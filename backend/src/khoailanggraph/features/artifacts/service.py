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
from sqlalchemy.orm import Session

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

if TYPE_CHECKING:
    from sqlalchemy import Engine
    from sqlalchemy.ext.asyncio import AsyncSession


REVISION_VERSION = 1


def utcnow() -> datetime:
    return datetime.now(UTC)


def _loads(blob: bytes) -> Any:
    return json.loads((blob or b"null").decode("utf-8"))


def _dumps(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False).encode("utf-8")


class SqlArtifactSink:
    """An `ArtifactSink` over the project's tables; run_id tags every event."""

    def __init__(self, engine: Engine, *, run_id: UUID | None = None) -> None:
        self.engine = engine
        self.run_id = run_id
        self._session: Session | None = None

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
        self.session.flush()
        self._write_artifact_revision(row)
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
        row = self._artifact_row(artifact_id)
        row.review_status = "approved"
        for item in self.session.scalars(
            select(ArtifactItemRow).where(
                ArtifactItemRow.artifact_id == row.id,
                ArtifactItemRow.review_status == "draft",
            )
        ):
            item.review_status = "approved"
            item.version += 1
            self._write_item_revision(item, "generated")
        self.session.flush()
        return ArtifactRef(
            artifact_id=str(row.id), kind=row.kind, title=row.title, version=row.version
        )

    def _write_artifact_revision(self, row: ArtifactRow) -> None:
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
                change_reason="generated",
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
            if link.quote:
                slot["quotes"][str(target.key)] = str(link.quote)
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
            position=int(count) + 1,
            content_json=_dumps(content),
        )
        del subject_id  # items carry no subject column; artifacts hold it (§2.3)
        row.version += 1
        self.session.add(entry)
        self.session.flush()
        self._write_item_revision(entry, "generated")
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

    def _write_item_revision(self, entry: ArtifactItemRow, reason: str) -> None:
        self.session.add(
            ItemRevisionRow(
                item_id=entry.id,
                version=entry.version,
                snapshot_json=_dumps(
                    {
                        "content": _loads(entry.content_json),
                        "position": entry.position,
                        "parent_item_id": str(entry.parent_item_id)
                        if entry.parent_item_id
                        else None,
                        "review_status": entry.review_status,
                    }
                ),
                change_reason=reason,
            )
        )

    def update_item_content(self, item_id: str, content: dict[str, Any]) -> ItemRef:
        entry = self.session.get(ArtifactItemRow, UUID(item_id))
        if entry is None:
            msg = f"no item {item_id}"
            raise KeyError(msg)
        merged = {**_loads(entry.content_json), **content}
        self._raise(
            domain_rules.validate_content(str(entry.kind), merged, value_lists=wf.value_lists())
        )
        entry.content_json = _dumps(merged)
        entry.version += 1
        self.session.flush()
        self._write_item_revision(entry, "user_edit")
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
        self.session.flush()
        self._write_item_revision(entry, "generated")
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
        quote: str | None = None,
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
                quote=quote,
                note=note,
            )
        )
        self.session.flush()

    def plan_values(self, project_id: str, reference: str) -> list[str]:
        return self._plan_values(project_id).get(reference, [])


def item_view(row: ArtifactItemRow) -> schemas.Item:
    payload = json.loads((row.content_json or b"null").decode("utf-8"))
    if not isinstance(payload, dict):
        payload = {}
    return schemas.Item(
        id=str(row.id),
        project_id=str(row.project_id),
        key=row.key,
        kind=row.kind,
        review_status=row.review_status,
        content=payload,
        version=row.version,
        updated_at=row.updated_at,
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
    limit: int,
    cursor: int,
) -> tuple[list[schemas.Item], int | None]:
    """The items of a project by text; ordered by key, cursor pagination."""
    rows = list(
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
    views = [item_view(row) for row in rows]
    if query.strip():
        views = [view for view in views if matches(view, query.strip())]
    window = views[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(views) else None
    return window, next_cursor


async def get_item(session: AsyncSession, item_id: UUID) -> schemas.Item:
    row = await session.get(ArtifactItemRow, item_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    return item_view(row)


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
    artifact_kinds: list[dict[str, Any]] = []
    for artifact in workflow.DEFINITION["artifact_kinds"]:
        item_kinds = []
        for item_kind in artifact.get("item_kinds", []):
            item_kinds.append(
                {
                    "kind": str(item_kind),
                    "schema_version": 1,
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
