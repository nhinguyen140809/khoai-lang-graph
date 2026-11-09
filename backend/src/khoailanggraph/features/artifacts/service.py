"""The SQLite-backed ArtifactSink: what the workflow writes through (§D.4).

Same contract as the in-memory sink of the tests (agents/ports.py), same
domain rules — only the storage differs. All methods run on the workflow's
sync engine/session so the graph can call them from its worker thread.
Events for the stream are recorded too: create/update of artifacts and items
become `artifact_created`/`artifact_delta` rows in the run event log, the
durable source the SSE endpoint reads (API.md §6: the graph never writes
into an HTTP response).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, cast
from uuid import UUID, uuid4

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, aliased

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering.ports import (
    ArtifactRecord,
    ItemRecord,
    LinkRecord,
)
from khoailanggraph.agents.requirements_engineering.state import ArtifactRef, ItemRef
from khoailanggraph.api.errors import ApiError
from khoailanggraph.domain import rules as domain_rules
from khoailanggraph.domain.errors import IntegrityError, Violation
from khoailanggraph.domain.keys import (
    KEY_PREFIXES,
    backlog_key,
    interview_message_key,
    key,
)
from khoailanggraph.domain.registry import schema_dict
from khoailanggraph.domain.rules import LinkCandidate
from khoailanggraph.features.artifacts import schemas
from khoailanggraph.features.artifacts.models import (
    ArtifactItemRow,
    ArtifactRevisionRow,
    ArtifactRow,
    ItemRevisionRow,
    TraceLinkRow,
)
from khoailanggraph.features.projects.models import ProjectKeyCounterRow
from khoailanggraph.features.runs.models import RunEventRow
from khoailanggraph.platform import origin as origins
from khoailanggraph.platform.origin import Origin

if TYPE_CHECKING:
    from sqlalchemy import Engine
    from sqlalchemy.ext.asyncio import AsyncSession


REVISION_VERSION = 1


def utcnow() -> datetime:
    return datetime.now(UTC)


def item_revision_row(entry: ArtifactItemRow, reason: str, by: Origin) -> ItemRevisionRow:
    """The revision of an item at its current version: what the item was and who changed it."""
    return ItemRevisionRow(
        item_id=entry.id,
        version=entry.version,
        snapshot_json=_dumps(
            {
                "content": _loads(entry.content_json),
                "position": entry.position,
                "parent_item_id": str(entry.parent_item_id) if entry.parent_item_id else None,
                "review_status": entry.review_status,
            }
        ),
        change_reason=reason,
        **_changed(by),
    )


def _changed(by: Origin) -> dict[str, Any]:
    """The `changed_*` columns of a revision row for an origin."""
    return {
        "changed_actor": by.actor,
        "changed_agent_role": by.agent_role,
        "changed_by_user_id": by.user_id,
        "changed_run_id": by.run_id,
        "changed_step_id": by.step_id,
    }


def _loads(blob: bytes) -> Any:
    return json.loads((blob or b"null").decode("utf-8"))


def _dumps(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False).encode("utf-8")


class SqlArtifactSink:
    """An `ArtifactSink` over the project's tables; run_id tags every event."""

    def __init__(
        self,
        engine: Engine,
        *,
        run_id: UUID | None = None,
        user_id: UUID | None = None,
    ) -> None:
        self.engine = engine
        self.run_id = run_id
        # The agent role of the node that is writing, set by the node wrapper; the user whose
        # decision the writes follow (an approval, an edit at a review), when there is one.
        self.agent_role: str | None = None
        self.user_id = user_id
        self._session: Session | None = None

    def _origin(self, *, by_user: bool = False) -> Origin:
        """Who the next write is credited to: the user of a decision, else the running agent."""
        if by_user and self.user_id is not None:
            return Origin(actor="user", user_id=self.user_id, run_id=self.run_id)
        return Origin.of_agent(self.agent_role, self.run_id)

    # — session plumbing —
    def bind(self, session: Session) -> None:
        """Adopt the caller's session (the executor opens one per run)."""
        self._session = session

    @property
    def session(self) -> Session:
        if self._session is None:
            msg = "sink.bind(session) must run before the first write"
            raise RuntimeError(msg)
        return self._session

    def _emit(self, event_type: str, data: dict[str, Any], sequence_hint: int) -> None:
        """Append one stream event, id = the run's next sequence (§6)."""
        if self.run_id is None:
            return
        self.session.add(
            RunEventRow(
                run_id=self.run_id,
                sequence=sequence_hint,
                step_id=None,
                type=event_type,
                data_json=_dumps(data),
            )
        )
        self.session.flush()

    def next_sequence(self) -> int:
        """The next run-event id (increasing per run; resume start)."""
        if self.run_id is None:
            return 0
        top = self.session.scalar(
            select(func.max(RunEventRow.sequence)).where(RunEventRow.run_id == self.run_id)
        )
        return 1 if top is None else int(top) + 1

    # — helpers —
    def _next(self, project_id: str, prefix: str) -> int:
        row = self.session.get(ProjectKeyCounterRow, (UUID(project_id), prefix))
        if row is None:
            row = ProjectKeyCounterRow(project_id=UUID(project_id), prefix=prefix, last_number=0)
            self.session.add(row)
        row.last_number += 1
        self.session.flush()
        return int(row.last_number)

    def _raise(self, violations: list[Violation]) -> None:
        if violations:
            raise IntegrityError(violations)

    def _plan_values(self, project_id: str) -> dict[str, list[str]]:
        plan = self.read_artifact(project_id, "elicitation_plan")
        if plan is None:
            return {"elicitation_plan.topics": [], "elicitation_plan.stakeholder_types": []}
        content = plan["content"]

        def as_str_list(name: str) -> list[str]:
            plain = cast("dict[str, Any]", content)
            return [str(value) for value in list(plain.get(name, []))]

        return {
            "elicitation_plan.topics": as_str_list("topics"),
            "elicitation_plan.stakeholder_types": as_str_list("stakeholder_types"),
        }

    # — artifact side —
    def create_artifact(
        self,
        project_id: str,
        kind: str,
        *,
        title: str,
        content: dict[str, Any],
        summary: str | None = None,
        subject_id: str | None = None,
    ) -> ArtifactRef:
        spec = wf.artifact_kinds().get(kind)
        if spec is None:
            msg = f"unknown artifact kind {kind}"
            raise ValueError(msg)
        if spec["per_project"] == "one" and self.read_artifact(project_id, kind) is not None:
            self._raise([Violation("one artifact", f"the project already has a {kind}")])
        self._raise(domain_rules.validate_content(kind, content, value_lists=wf.value_lists()))
        row = ArtifactRow(
            id=uuid4(),
            project_id=UUID(project_id),
            kind=kind,
            title=title,
            summary=summary,
            content_json=_dumps(content),
            subject_item_id=UUID(subject_id) if subject_id else None,
        )
        origins.write(row, "created", self._origin())
        origins.write(row, "updated", self._origin())
        self.session.add(row)
        self.session.flush()
        self.session.add(
            ArtifactRevisionRow(
                artifact_id=row.id,
                version=REVISION_VERSION,
                snapshot_json=_dumps(
                    {
                        "title": row.title,
                        "summary": row.summary,
                        "content": content,
                        "review_status": row.review_status,
                    }
                ),
                item_versions_json=_dumps([]),
                change_reason="generated",
                **_changed(self._origin()),
            )
        )
        seq = self.next_sequence()
        self._emit(
            "artifact_created",
            {"artifact_id": str(row.id), "name": row.title, "version": 1, "kind": kind},
            seq,
        )
        return ArtifactRef(artifact_id=str(row.id), kind=kind, title=title, version=1)

    def read_artifact(
        self,
        project_id: str,
        kind: str,
        *,
        subject_id: str | None = None,
    ) -> ArtifactRecord | None:
        statement = select(ArtifactRow).where(
            ArtifactRow.project_id == UUID(project_id),
            ArtifactRow.kind == kind,
            ArtifactRow.deleted_at.is_(None),
        )
        row = self.session.scalars(statement).first()
        if row is None:
            return None
        if subject_id is not None:
            row = (
                self.session.scalars(
                    statement.where(ArtifactRow.subject_item_id == UUID(subject_id))
                ).first()
                or None
            )
            if row is None:
                return None
        items = self.read_items(str(row.id))
        return ArtifactRecord(
            artifact_id=str(row.id),
            kind=row.kind,
            title=row.title,
            version=row.version,
            review_status=row.review_status,
            content=_loads(row.content_json),
            items=items,
        )

    def _artifact_row(self, artifact_id: str) -> ArtifactRow:
        row = self.session.get(ArtifactRow, UUID(artifact_id))
        if row is None:
            msg = f"no artifact {artifact_id}"
            raise KeyError(msg)
        return row

    def update_artifact_content(
        self,
        artifact_id: str,
        content: dict[str, Any],
    ) -> ArtifactRef:
        row = self._artifact_row(artifact_id)
        merged = {**_loads(row.content_json), **content}
        self._raise(
            domain_rules.validate_content(str(row.kind), merged, value_lists=wf.value_lists())
        )
        row.content_json = _dumps(merged)
        row.version += 1
        origins.write(row, "updated", self._origin())
        row.updated_at = utcnow()
        self.session.flush()
        self._write_artifact_revision(row, "generated")
        seq = self.next_sequence()
        self._emit(
            "artifact_delta",
            {
                "artifact_id": str(row.id),
                "delta": content,
                "version": row.version,
                "item_id": None,
                "item_key": None,
                "change": "artifact_updated",
            },
            seq,
        )
        return ArtifactRef(
            artifact_id=str(row.id), kind=row.kind, title=row.title, version=row.version
        )

    def approve_artifact(self, artifact_id: str) -> ArtifactRef:
        """The artifact under review and its draft items become approved, each as a new
        version with the change reason `reviewed`."""
        row = self._artifact_row(artifact_id)
        by = self._origin(by_user=True)
        for item in self.session.scalars(
            select(ArtifactItemRow).where(
                ArtifactItemRow.artifact_id == row.id,
                ArtifactItemRow.review_status == "draft",
            )
        ):
            item.review_status = "approved"
            item.version += 1
            origins.write(item, "updated", by)
            item.updated_at = utcnow()
            self._write_item_revision(item, "reviewed", by)
        if row.review_status == "draft":
            row.review_status = "approved"
        row.version += 1
        origins.write(row, "updated", by)
        row.updated_at = utcnow()
        self.session.flush()
        self._write_artifact_revision(row, "reviewed", by)
        return ArtifactRef(
            artifact_id=str(row.id), kind=row.kind, title=row.title, version=row.version
        )

    def _write_artifact_revision(
        self, row: ArtifactRow, reason: str, by: Origin | None = None
    ) -> None:
        item_rows = self.session.scalars(
            select(ArtifactItemRow).where(ArtifactItemRow.artifact_id == row.id)
        ).all()
        item_versions = [
            {"item_id": str(item.id), "version": item.version}
            for item in sorted(item_rows, key=lambda entry: entry.position)
        ]
        self.session.add(
            ArtifactRevisionRow(
                artifact_id=row.id,
                version=row.version,
                snapshot_json=_dumps(
                    {
                        "title": row.title,
                        "summary": row.summary,
                        "content": _loads(row.content_json),
                        "review_status": row.review_status,
                    }
                ),
                item_versions_json=_dumps(item_versions),
                change_reason=reason,
                **_changed(by or self._origin()),
            )
        )
        self.session.flush()

    # — item side —
    def _item_record(self, entry: ArtifactItemRow) -> ItemRecord:
        outgoing = self.session.scalars(
            select(TraceLinkRow).where(
                TraceLinkRow.source_item_id == entry.id,
                TraceLinkRow.deleted_at.is_(None),
            )
        ).all()
        grouped: dict[str, dict[str, Any]] = {}
        for link in outgoing:
            target = self.session.get(ArtifactItemRow, link.target_item_id)
            if target is None:
                continue
            slot = grouped.setdefault(str(link.link_type), {"targets": [], "quotes": {}})
            slot["targets"].append(str(target.key))
            if link.target_quote:
                slot["quotes"][str(target.key)] = str(link.target_quote)
        records: list[LinkRecord] = [
            LinkRecord(link_type=link_type, targets=slot["targets"], quotes=slot["quotes"])
            for link_type, slot in grouped.items()
        ]
        return ItemRecord(
            item_id=str(entry.id),
            kind=str(entry.kind),
            key=str(entry.key),
            version=entry.version,
            review_status=str(entry.review_status),
            content=_loads(entry.content_json),
            links=records,
        )

    def read_item(self, item_id: str) -> ItemRecord:
        entry = self.session.get(ArtifactItemRow, UUID(item_id))
        if entry is None or entry.deleted_at is not None:
            msg = f"no item {item_id}"
            raise KeyError(msg)
        return self._item_record(entry)

    def read_items(self, artifact_id: str) -> list[ItemRecord]:
        rows = self.session.scalars(
            select(ArtifactItemRow)
            .where(
                ArtifactItemRow.artifact_id == UUID(artifact_id),
                ArtifactItemRow.deleted_at.is_(None),
            )
            .order_by(ArtifactItemRow.position)
        ).all()
        return [self._item_record(entry) for entry in rows]

    def _item_key(
        self,
        artifact_row: ArtifactRow,
        entry_kind: str,
        content: dict[str, Any],
        artifact_item_count: int,
    ) -> str:
        if entry_kind == "interview_message":
            subject = artifact_row.subject_item_id
            if subject is None:
                msg = "an interview transcript needs its persona subject"
                raise ValueError(msg)
            persona = self.read_item(str(subject))
            return interview_message_key(str(persona["key"]), artifact_item_count + 1)
        if entry_kind == "backlog_item":
            number = self._next(str(artifact_row.project_id), "backlog")
            return backlog_key(number, epic=bool(content["item_type"] == "epic"))
        prefix = KEY_PREFIXES.get(entry_kind, entry_kind.upper()[:3])
        return key(prefix, self._next(str(artifact_row.project_id), prefix))

    def _next_position(self, artifact_id: UUID, parent_id: str | None) -> int:
        """The position after the last item under the same parent, from 1."""
        parent = UUID(parent_id) if parent_id else None
        top = self.session.scalar(
            select(func.max(ArtifactItemRow.position)).where(
                ArtifactItemRow.artifact_id == artifact_id,
                ArtifactItemRow.parent_item_id.is_(None)
                if parent is None
                else ArtifactItemRow.parent_item_id == parent,
            )
        )
        return 1 if top is None else int(top) + 1

    def add_item(
        self,
        artifact_id: str,
        kind: str,
        content: dict[str, Any],
        *,
        ref: str | None = None,
        subject_id: str | None = None,
        parent_id: str | None = None,
    ) -> ItemRef:
        row = self._artifact_row(artifact_id)
        self._raise(domain_rules.check_item_in_artifact(kind, str(row.kind), wf.artifact_kinds()))
        self._raise(
            domain_rules.validate_content(
                kind,
                content,
                value_lists=wf.value_lists(),
                plan_values=self._plan_values(str(row.project_id)),
            )
        )
        count = (
            self.session.scalar(select(func.count()).where(ArtifactItemRow.artifact_id == row.id))
            or 0
        )
        entry = ArtifactItemRow(
            id=uuid4(),
            artifact_id=row.id,
            project_id=row.project_id,
            kind=kind,
            key=self._item_key(row, kind, content, int(count)),
            parent_item_id=UUID(parent_id) if parent_id else None,
            position=self._next_position(row.id, parent_id),
            content_json=_dumps(content),
        )
        origins.write(entry, "created", self._origin())
        origins.write(entry, "updated", self._origin())
        del subject_id  # items carry no subject column; artifacts hold it (§2.3)
        row.version += 1
        self.session.add(entry)
        self.session.flush()
        self._write_item_revision(entry, "generated", self._origin())
        seq = self.next_sequence()
        self._emit(
            "artifact_delta",
            {
                "artifact_id": str(row.id),
                "delta": None,
                "version": row.version,
                "item_id": str(entry.id),
                "item_key": str(entry.key),
                "change": "item_created",
            },
            seq,
        )
        return ItemRef(item_id=str(entry.id), kind=kind, key=str(entry.key), version=entry.version)

    def _write_item_revision(self, entry: ArtifactItemRow, reason: str, by: Origin) -> None:
        self.session.add(item_revision_row(entry, reason, by))

    def update_item_content(self, item_id: str, content: dict[str, Any]) -> ItemRef:
        entry = self.session.get(ArtifactItemRow, UUID(item_id))
        if entry is None:
            msg = f"no item {item_id}"
            raise KeyError(msg)
        merged = {**_loads(entry.content_json), **content}
        self._raise(
            domain_rules.validate_content(str(entry.kind), merged, value_lists=wf.value_lists())
        )
        by = self._origin(by_user=True)
        entry.content_json = _dumps(merged)
        entry.version += 1
        origins.write(entry, "updated", by)
        entry.updated_at = utcnow()
        self.session.flush()
        self._write_item_revision(entry, "user_edit", by)
        return ItemRef(
            item_id=str(entry.id),
            kind=str(entry.kind),
            key=str(entry.key),
            version=entry.version,
        )

    def mark_item_superseded(self, item_id: str) -> ItemRef:
        entry = self.session.get(ArtifactItemRow, UUID(item_id))
        if entry is None:
            msg = f"no item {item_id}"
            raise KeyError(msg)
        entry.review_status = "superseded"
        entry.version += 1
        origins.write(entry, "updated", self._origin())
        entry.updated_at = utcnow()
        self.session.flush()
        self._write_item_revision(entry, "generated", self._origin())
        return ItemRef(
            item_id=str(entry.id),
            kind=str(entry.kind),
            key=str(entry.key),
            version=entry.version,
        )

    def add_link(
        self,
        *,
        source_id: str,
        target_id: str,
        link_type: str,
        source_quote: str | None = None,
        target_quote: str | None = None,
        note: str | None = None,
    ) -> None:
        source = self.session.get(ArtifactItemRow, UUID(source_id))
        target = self.session.get(ArtifactItemRow, UUID(target_id))
        if source is None or target is None:
            msg = "link endpoints must both exist"
            raise ValueError(msg)
        violations = domain_rules.check_link(
            LinkCandidate(
                link_type=link_type,
                source_id=source_id,
                source_kind=str(source.kind),
                target_id=target_id,
                target_kind=str(target.kind),
            ),
            link_types=wf.link_types(),
        )
        self._raise(violations)
        statement = (
            update(TraceLinkRow)
            .where(
                TraceLinkRow.source_item_id == UUID(source_id),
                TraceLinkRow.target_item_id == UUID(target_id),
                TraceLinkRow.link_type == link_type,
                TraceLinkRow.deleted_at.is_(None),
            )
            .values(deleted_at=utcnow())
            .execution_options(synchronize_session=False)
        )
        self.session.execute(statement)
        self.session.add(
            TraceLinkRow(
                id=uuid4(),
                project_id=UUID(str(source.project_id)),
                link_type=link_type,
                source_item_id=UUID(source_id),
                target_item_id=UUID(target_id),
                target_version=target.version,
                source_quote=source_quote,
                target_quote=target_quote,
                note=note,
                created_by_run_id=self.run_id,
            )
        )
        self.session.flush()

    def plan_values(self, project_id: str, reference: str) -> list[str]:
        return self._plan_values(project_id).get(reference, [])


def _origin_view(by: Origin) -> schemas.Origin:
    return schemas.Origin(
        actor=by.actor,
        agent_role=by.agent_role,
        user_id=None if by.user_id is None else str(by.user_id),
        run_id=None if by.run_id is None else str(by.run_id),
        step_id=None if by.step_id is None else str(by.step_id),
    )


def outline_of(rows: list[ArtifactItemRow]) -> dict[UUID, tuple[str, int]]:
    """The outline number and depth of each item of one artifact.

    The number is the position of the item among its siblings, joined with the numbers of its
    ancestors (`3.2.1`); an artifact without sections numbers its items `1`, `2`, ... An item
    whose parent is not among `rows` counts as top level.
    """
    present = {row.id for row in rows}
    children: dict[UUID | None, list[ArtifactItemRow]] = {}
    for row in rows:
        parent = row.parent_item_id if row.parent_item_id in present else None
        children.setdefault(parent, []).append(row)
    for siblings in children.values():
        siblings.sort(key=lambda row: (row.position, row.key))
    numbering: dict[UUID, tuple[str, int]] = {}

    def walk(parent: UUID | None, prefix: str, depth: int) -> None:
        for index, row in enumerate(children.get(parent, []), start=1):
            number = f"{prefix}{index}"
            numbering[row.id] = (number, depth)
            walk(row.id, f"{number}.", depth + 1)

    walk(None, "", 1)
    return numbering


def outline_in_order(rows: list[ArtifactItemRow]) -> list[ArtifactItemRow]:
    """The items of one artifact in outline order: a section, then what it contains."""
    numbering = outline_of(rows)

    def order(row: ArtifactItemRow) -> tuple[int, ...]:
        return tuple(int(part) for part in numbering[row.id][0].split("."))

    return sorted(rows, key=order)


async def _numbering_of(
    session: AsyncSession, artifact_ids: set[UUID]
) -> dict[UUID, tuple[str, int]]:
    """The outline of every artifact in `artifact_ids`, from their live items."""
    if not artifact_ids:
        return {}
    rows = (
        await session.scalars(
            select(ArtifactItemRow).where(
                ArtifactItemRow.artifact_id.in_(artifact_ids),
                ArtifactItemRow.deleted_at.is_(None),
            )
        )
    ).all()
    by_artifact: dict[UUID, list[ArtifactItemRow]] = {}
    for row in rows:
        by_artifact.setdefault(row.artifact_id, []).append(row)
    numbering: dict[UUID, tuple[str, int]] = {}
    for items in by_artifact.values():
        numbering |= outline_of(items)
    return numbering


def item_view(row: ArtifactItemRow, numbering: dict[UUID, tuple[str, int]]) -> schemas.Item:
    return schemas.Item(**_item_fields(row, numbering))


def outline_item_view(
    row: ArtifactItemRow, numbering: dict[UUID, tuple[str, int]]
) -> schemas.OutlineItem:
    return schemas.OutlineItem(
        **_item_fields(row, numbering), depth=numbering.get(row.id, ("1", 1))[1]
    )


def _item_fields(row: ArtifactItemRow, numbering: dict[UUID, tuple[str, int]]) -> dict[str, Any]:
    payload = json.loads((row.content_json or b"null").decode("utf-8"))
    return {
        "id": str(row.id),
        "artifact_id": str(row.artifact_id),
        "project_id": str(row.project_id),
        "key": row.key,
        "kind": row.kind,
        "parent_item_id": None if row.parent_item_id is None else str(row.parent_item_id),
        "position": row.position,
        "outline_number": numbering.get(row.id, (str(row.position), 1))[0],
        "schema_version": row.schema_version,
        "version": row.version,
        "review_status": row.review_status,
        "created_by": _origin_view(origins.read(row, "created")),
        "updated_by": _origin_view(origins.read(row, "updated")),
        "created_at": row.created_at,
        "updated_at": row.updated_at,
        "content": payload if isinstance(payload, dict) else {},
    }


def nested_outline(items: list[schemas.OutlineItem]) -> list[schemas.NestedOutlineItem]:
    """The outline items as a forest: each item holds the items whose parent it is."""
    nodes = {item.id: schemas.NestedOutlineItem(**item.model_dump(), children=[]) for item in items}
    roots: list[schemas.NestedOutlineItem] = []
    for item in items:
        node = nodes[item.id]
        parent = nodes.get(item.parent_item_id) if item.parent_item_id is not None else None
        (parent.children if parent is not None else roots).append(node)
    return roots


def artifact_view(row: ArtifactRow, item_count: int) -> schemas.Artifact:
    """The artifact row as the client reads it."""
    return schemas.Artifact(
        id=str(row.id),
        kind=row.kind,
        project_id=str(row.project_id),
        title=row.title,
        summary=row.summary,
        schema_version=row.schema_version,
        content=_loads(row.content_json or b"{}"),
        subject_item_id=None if row.subject_item_id is None else str(row.subject_item_id),
        version=row.version,
        review_status=row.review_status,
        item_count=item_count,
        created_by=_origin_view(origins.read(row, "created")),
        updated_by=_origin_view(origins.read(row, "updated")),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _ref_view(row: ArtifactItemRow | None) -> schemas.ItemLinkRef:
    """A link end resolved to its item; links never dangle by construction."""
    if row is None:
        msg = "trace link end does not resolve to a live item"
        raise ValueError(msg)
    return schemas.ItemLinkRef(
        id=str(row.id), key=row.key, kind=row.kind, review_status=row.review_status
    )


def matches(item: schemas.Item, query: str) -> bool:
    """Mock parity: substring on key or stringify of content (case-insensitive)."""
    lowered = query.lower()
    if lowered in item.key.lower():
        return True
    return lowered in json.dumps(item.content, ensure_ascii=False).lower()


async def search_project_items(
    session: AsyncSession,
    project_id: UUID,
    *,
    query: str,
    kind: str | None = None,
    review_status: str | None = None,
    run_id: UUID | None = None,
    limit: int,
    cursor: int,
) -> tuple[list[schemas.Item], int | None]:
    """The items of a project by text, filtered by kind, review status and run (the items that
    run created or changed); ordered by key, cursor pagination."""
    conditions = [
        ArtifactItemRow.project_id == project_id,
        ArtifactItemRow.deleted_at.is_(None),
    ]
    if kind is not None:
        conditions.append(ArtifactItemRow.kind == kind)
    if review_status is not None:
        conditions.append(ArtifactItemRow.review_status == review_status)
    if run_id is not None:
        conditions.append(
            ArtifactItemRow.id.in_(
                select(ItemRevisionRow.item_id).where(ItemRevisionRow.changed_run_id == run_id)
            )
        )
    rows = list(
        (
            await session.scalars(
                select(ArtifactItemRow).where(*conditions).order_by(ArtifactItemRow.key)
            )
        ).all()
    )
    numbering = await _numbering_of(session, {row.artifact_id for row in rows})
    views = [item_view(row, numbering) for row in rows]
    if query.strip():
        views = [view for view in views if matches(view, query.strip())]
    window = views[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(views) else None
    return window, next_cursor


async def plan_values_of(session: AsyncSession, project_id: UUID) -> dict[str, list[str]]:
    """The `x-value-from` choices of the project's elicitation plan (API.md
    §5: a referenced field accepts only the values the plan holds)."""
    plan = await session.scalar(
        select(ArtifactRow).where(
            ArtifactRow.project_id == project_id,
            ArtifactRow.kind == "elicitation_plan",
            ArtifactRow.deleted_at.is_(None),
        )
    )
    if plan is None:
        return {"elicitation_plan.topics": [], "elicitation_plan.stakeholder_types": []}
    content = _loads(plan.content_json)

    def as_str_list(name: str) -> list[str]:
        return [str(value) for value in content.get(name, [])]

    return {
        "elicitation_plan.topics": as_str_list("topics"),
        "elicitation_plan.stakeholder_types": as_str_list("stakeholder_types"),
    }


def validate_item_content(
    kind: str,
    content: dict[str, Any],
    plan_values: dict[str, list[str]],
) -> list[dict[str, str]]:
    """The violations of an item edit against its canonical schema and the
    plan vocabulary — the same rules the agent writes go through, so what
    an agent produces and what the API accepts cannot disagree."""
    violations = domain_rules.validate_content(
        kind, content, value_lists=wf.value_lists(), plan_values=plan_values
    )
    return [
        {"field": violation.path or "content", "message": violation.message}
        for violation in violations
    ]


async def list_project_artifacts(
    session: AsyncSession,
    project_id: UUID,
    *,
    kind: str | None = None,
    review_status: str | None = None,
    limit: int,
    cursor: int,
) -> tuple[list[schemas.Artifact], int | None]:
    """The artifacts of a project, in creation order, filtered by kind and review status."""
    conditions = [ArtifactRow.project_id == project_id, ArtifactRow.deleted_at.is_(None)]
    if kind is not None:
        conditions.append(ArtifactRow.kind == kind)
    if review_status is not None:
        conditions.append(ArtifactRow.review_status == review_status)
    rows = list(
        (
            await session.scalars(
                select(ArtifactRow)
                .where(*conditions)
                .order_by(ArtifactRow.created_at, ArtifactRow.id)
            )
        ).all()
    )
    counts = dict(
        (
            await session.execute(
                select(ArtifactItemRow.artifact_id, func.count())
                .where(
                    ArtifactItemRow.project_id == project_id,
                    ArtifactItemRow.deleted_at.is_(None),
                )
                .group_by(ArtifactItemRow.artifact_id)
            )
        )
        .tuples()
        .all()
    )
    views = [artifact_view(row, int(counts.get(row.id, 0))) for row in rows]
    window = views[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(views) else None
    return window, next_cursor


async def list_project_links(
    session: AsyncSession,
    project_id: UUID,
    *,
    limit: int,
    cursor: int,
) -> tuple[list[schemas.TraceLink], int | None]:
    """The trace links of a project with both ends resolved (Traceability tab)."""
    source = aliased(ArtifactItemRow, name="source_item")
    target = aliased(ArtifactItemRow, name="target_item")
    rows = list(
        (
            await session.execute(
                select(TraceLinkRow, source, target)
                .join(source, source.id == TraceLinkRow.source_item_id)
                .join(target, target.id == TraceLinkRow.target_item_id)
                .where(
                    TraceLinkRow.project_id == project_id,
                    TraceLinkRow.deleted_at.is_(None),
                    source.deleted_at.is_(None),
                    target.deleted_at.is_(None),
                )
                .order_by(source.key, TraceLinkRow.link_type, target.key)
            )
        ).all()
    )
    views = [
        schemas.TraceLink(
            id=str(link.id),
            project_id=str(link.project_id),
            link_type=link.link_type,
            source=_ref_view(source_row),
            target=_ref_view(target_row),
            target_version=link.target_version,
            quote=link.target_quote,
            note=link.note,
        )
        for link, source_row, target_row in rows
    ]
    window = views[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(views) else None
    return window, next_cursor


def _chain_ref(row: ArtifactItemRow) -> schemas.MatrixChainRef:
    return schemas.MatrixChainRef(
        id=str(row.id), key=row.key, kind=row.kind, review_status=row.review_status
    )


async def _live_items_of_project(session: AsyncSession, project_id: UUID) -> list[ArtifactItemRow]:
    return list(
        (
            await session.scalars(
                select(ArtifactItemRow)
                .where(
                    ArtifactItemRow.project_id == project_id,
                    ArtifactItemRow.deleted_at.is_(None),
                )
                .order_by(ArtifactItemRow.key)
            )
        ).all()
    )


def _derived_target(
    derived_by_source: dict[str, list[tuple[str, ArtifactItemRow]]], source_id: str
) -> tuple[str, ArtifactItemRow] | None:
    options = derived_by_source.get(source_id)
    return options[0] if options else None


def _no_source_of(
    links: list[schemas.TraceLink], kind: str, items: list[ArtifactItemRow]
) -> list[schemas.MatrixChainRef]:
    """Spec or analyzed requirements with no outgoing derived_from."""
    with_source = {link.source.id for link in links if link.link_type == "derived_from"}
    return [_chain_ref(item) for item in items if item.kind == kind and item.id not in with_source]


def _staleness_of_links(
    links: list[schemas.TraceLink], versions: dict[str, tuple[int, str]]
) -> list[schemas.MatrixChainRef]:
    """Sources whose link was made from an older version of the target, or
    whose target is superseded (DATA_SHAPE §8 Staleness)."""
    stale: dict[str, schemas.MatrixChainRef] = {}
    for link in links:
        if link.link_type in {"supersedes", "duplicates"}:
            continue
        current = versions.get(link.target.id)
        if current is None:
            continue
        version, review_status = current
        if link.target_version < version or review_status == "superseded":
            stale[link.source.id] = schemas.MatrixChainRef(
                id=link.source.id,
                key=link.source.key,
                kind=link.source.kind,
                review_status=link.source.review_status,
            )
    return list(stale.values())


async def traceability_matrix(
    session: AsyncSession, project_id: UUID
) -> list[schemas.MatrixChainRow]:
    """Rows of `derived_from` chains (API.md traceability matrix): one row
    per chain from a backlog item down to its raw or latent source, with the
    `evidenced_by` interview messages behind each source."""
    items = await _live_items_of_project(session, project_id)
    links, _ = await list_project_links(session, project_id, limit=10_000, cursor=0)
    by_id = {str(row.id): row for row in items}

    derived: dict[str, ArtifactItemRow] = {}
    for link in links:
        if link.link_type == "derived_from" and link.target.id in by_id:
            derived.setdefault(link.source.id, by_id[link.target.id])

    def evidence_of(source_id: str) -> list[schemas.MatrixChainRef]:
        found: dict[str, schemas.MatrixChainRef] = {}
        for link in links:
            if link.source.id != source_id or link.link_type != "evidenced_by":
                continue
            target = by_id.get(link.target.id)
            if target is not None:
                found[link.target.id] = _chain_ref(target)
        return list(found.values())

    def chain(backlog: ArtifactItemRow | None, spec_row: ArtifactItemRow) -> None:
        analyzed = derived.get(str(spec_row.id))
        sources: list[ArtifactItemRow] = []
        for link in links:
            if (
                analyzed is not None
                and link.link_type == "derived_from"
                and link.source.id == str(analyzed.id)
                and link.target.id in by_id
            ):
                sources.append(by_id[link.target.id])
        evidence = [ref for source in sources for ref in evidence_of(str(source.id))]
        rows.append(
            schemas.MatrixChainRow(
                backlog=_chain_ref(backlog) if backlog is not None else None,
                spec=_chain_ref(spec_row),
                analyzed=_chain_ref(analyzed) if analyzed is not None else None,
                source=[_chain_ref(entry) for entry in sources],
                evidence=evidence,
            )
        )

    rows: list[schemas.MatrixChainRow] = []
    covered_specs: set[str] = set()
    for item in items:
        if item.kind != "backlog_item":
            continue
        spec = derived.get(str(item.id))
        if spec is not None:
            covered_specs.add(str(spec.id))
            chain(item, spec)
    for item in items:
        if item.kind == "spec_requirement" and str(item.id) not in covered_specs:
            chain(None, item)
    return rows


async def traceability_coverage(session: AsyncSession, project_id: UUID) -> schemas.TraceCoverage:
    """The three coverage lists of API.md, each with its items."""
    items = await _live_items_of_project(session, project_id)
    links, _ = await list_project_links(session, project_id, limit=10_000, cursor=0)

    outgoing_source: dict[str, None] = {}
    incoming_target: dict[str, None] = {}
    for link in links:
        if link.link_type == "derived_from":
            outgoing_source[link.source.id] = None
            incoming_target[link.target.id] = None

    specs = [item for item in items if item.kind == "spec_requirement"]
    no_backlog = [_chain_ref(item) for item in specs if str(item.id) not in incoming_target]
    no_source = [
        _chain_ref(item)
        for item in items
        if item.kind in {"spec_requirement", "analyzed_requirement"}
        and str(item.id) not in outgoing_source
    ]

    versions = {str(row.id): (row.version, row.review_status) for row in items}
    stale = _staleness_of_links(links, versions)
    stale_ids = {entry.id for entry in stale}
    open_kinds = {"ambiguity_issue", "conflict", "validation_issue"}
    open_issues = [
        _chain_ref(item)
        for item in items
        if item.kind in open_kinds and item.review_status != "superseded"
    ]
    needs_review = stale + [entry for entry in open_issues if entry.id not in stale_ids]
    return schemas.TraceCoverage(
        no_backlog_item=schemas.CoverageEntry(count=len(no_backlog), items=no_backlog),
        no_source=schemas.CoverageEntry(count=len(no_source), items=no_source),
        needs_review=schemas.CoverageEntry(count=len(needs_review), items=needs_review),
    )


async def item_revisions(session: AsyncSession, item_id: UUID) -> list[schemas.ItemRevision]:
    """The versions of one item, newest first (TIMELINE)."""
    row = await session.get(ArtifactItemRow, item_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    history = list(
        (
            await session.scalars(
                select(ItemRevisionRow)
                .where(ItemRevisionRow.item_id == item_id)
                .order_by(ItemRevisionRow.version.desc())
            )
        ).all()
    )
    return [
        schemas.ItemRevision(
            version=entry.version,
            change_reason=str(entry.change_reason),
            changed_by=_origin_view(origins.read(entry, "changed")),
            created_at=entry.created_at,
            content=_loads(entry.snapshot_json or b"{}").get("content", {}),
        )
        for entry in history
    ]


async def item_trace(
    session: AsyncSession,
    item_id: UUID,
    *,
    direction: str,
    depth: int,
) -> tuple[list[schemas.Item], list[schemas.TraceLink]]:
    """The chain of one item (GET /items/{id}/trace): the links within
    `depth` hops, forward, backward or both, with their items resolved."""
    row = await session.get(ArtifactItemRow, item_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    links, _ = await list_project_links(session, UUID(str(row.project_id)), limit=10_000, cursor=0)
    directions: set[str] = {"both", "forward", "backward"}
    if direction not in directions:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            "direction must be backward, forward or both.",
        )

    reachable: dict[str, None] = {str(item_id): None}
    found: list[schemas.TraceLink] = []
    seen_links: set[str] = set()

    def walk(current: str, hops: int) -> None:
        if hops == 0:
            return
        for link in links:
            if link.id in seen_links:
                continue
            follows = (direction in {"forward", "both"} and link.source.id == current) or (
                direction in {"backward", "both"} and link.target.id == current
            )
            if not follows:
                continue
            seen_links.add(link.id)
            found.append(link)
            other = link.target.id if link.source.id == current else link.source.id
            if other not in reachable:
                reachable[other] = None
                walk(other, hops - 1)

    walk(str(item_id), max(1, depth))
    node_rows = list(
        (
            await session.scalars(
                select(ArtifactItemRow).where(
                    ArtifactItemRow.id.in_([UUID(key) for key in reachable]),
                    ArtifactItemRow.deleted_at.is_(None),
                )
            )
        ).all()
    )
    numbering = await _numbering_of(session, {node.artifact_id for node in node_rows})
    nodes = [item_view(node, numbering) for node in node_rows]
    return nodes, found


async def list_artifact_items(
    session: AsyncSession,
    artifact_id: UUID,
    *,
    kind: str | None,
    review_status: str | None,
    parent_item_id: UUID | None,
    limit: int,
    cursor: int,
) -> tuple[list[schemas.OutlineItem], int | None]:
    """The live items of one artifact in outline order (a section, then what it contains).

    The outline numbers come from the whole artifact; a filter only keeps some of its items.
    """
    rows = list(
        (
            await session.scalars(
                select(ArtifactItemRow).where(
                    ArtifactItemRow.artifact_id == artifact_id,
                    ArtifactItemRow.deleted_at.is_(None),
                )
            )
        ).all()
    )
    numbering = outline_of(rows)
    kept = [
        row
        for row in outline_in_order(rows)
        if (kind is None or row.kind == kind)
        and (review_status is None or row.review_status == review_status)
        and (parent_item_id is None or row.parent_item_id == parent_item_id)
    ]
    views = [outline_item_view(row, numbering) for row in kept]
    window = views[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(views) else None
    return window, next_cursor


async def get_item(session: AsyncSession, item_id: UUID) -> schemas.Item:
    row = await session.get(ArtifactItemRow, item_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    return item_view(row, await _numbering_of(session, {row.artifact_id}))


def _with_value_lists(kind: str, value_lists: dict[str, Any]) -> dict[str, Any]:
    output = json.loads(json.dumps(dict(schema_dict(kind))))
    for field_schema in output.get("properties", {}).values():
        if isinstance(field_schema, dict) and "x-value-list" in field_schema:
            name = str(field_schema["x-value-list"])
            entry = value_lists.get(name)
            if not entry:
                continue
            keys = [str(v.get("key")) for v in entry]
            types = field_schema.get("type")
            nullable = isinstance(types, list) and "null" in types
            if keys:
                field_schema["enum"] = [*keys, None] if nullable else keys
            meanings = "; ".join(f"{v.get('key')}: {v.get('description', '')}" for v in entry)
            if meanings:
                field_schema["description"] = (
                    f"{str(field_schema.get('description', '')).strip()} Values: {meanings}"
                )
    return cast("dict[str, Any]", output)


def artifact_kinds_response(workflow: Any) -> dict[str, Any]:
    """The artifact-kinds of the definition, the shape mocks serve (§5)."""
    value_lists = {k: v for k, v in workflow.value_lists().items()}
    item_versions = {
        str(kind): int(entry.get("schema_version", 1))
        for kind, entry in workflow.item_kinds().items()
    }
    artifact_kinds: list[dict[str, Any]] = []
    for artifact in workflow.DEFINITION["artifact_kinds"]:
        item_kinds = []
        for item_kind in artifact.get("item_kinds", []):
            item_kinds.append(
                {
                    "kind": str(item_kind),
                    "schema_version": item_versions[str(item_kind)],
                    "schema": _with_value_lists(str(item_kind), value_lists),
                }
            )
        artifact_kinds.append(
            {
                "kind": str(artifact.get("kind")),
                "schema_version": int(artifact.get("schema_version", 1)),
                "schema": _with_value_lists(str(artifact.get("kind")), value_lists),
                "item_kinds": item_kinds,
            }
        )
    return {
        "workflow_version": int(workflow.DEFINITION["version"]),
        "artifact_kinds": artifact_kinds,
    }
