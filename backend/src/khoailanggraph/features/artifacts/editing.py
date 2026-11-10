"""What a user changes in the documents of a project, and the rule that lets them.

The user changes an artifact, its items and the trace links of its items only while the run of the
project waits for a review that takes changes: the run is `interrupted`, and its pending interrupt
allows edits and lists the artifact. `ensure_editable` answers `409 invalid_state` otherwise.

The functions that write take a synchronous session and are called with `session.run_sync`, so
that a change of the user goes through the same helpers as the writes of the agents: a new
version of the item, its revision, a new version of the artifact and its revision.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, cast
from uuid import UUID

from sqlalchemy import select

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.api.errors import ApiError
from khoailanggraph.domain import links as link_rules
from khoailanggraph.domain import rules as domain_rules
from khoailanggraph.domain.errors import IntegrityError, Violation
from khoailanggraph.features.artifacts.models import (
    ArtifactItemRow,
    ArtifactRevisionRow,
    ArtifactRow,
    ItemRevisionRow,
    TraceLinkRow,
)
from khoailanggraph.features.artifacts.service import (
    SqlArtifactSink,
    bump_artifact,
    item_revision_row,
)
from khoailanggraph.features.runs.models import InterruptRow, RunRow
from khoailanggraph.platform import origin as origins

if TYPE_CHECKING:
    from sqlalchemy import Engine
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import Session

    from khoailanggraph.platform.origin import Origin

REVIEW_STATUSES = ("draft", "approved", "rejected", "superseded")


def _now() -> datetime:
    return datetime.now(UTC)


def _refuse(rule: str, message: str, path: str = "") -> IntegrityError:
    return IntegrityError([Violation(rule, message, path)])


# - the rule that lets a user change a document -


async def ensure_editable(session: AsyncSession, artifact: ArtifactRow) -> None:
    """The artifact takes changes only while a review that allows edits waits for the user."""
    waiting = (
        await session.scalars(
            select(InterruptRow)
            .join(RunRow, RunRow.id == InterruptRow.run_id)
            .where(
                RunRow.project_id == artifact.project_id,
                RunRow.status == "interrupted",
                InterruptRow.status == "pending",
                InterruptRow.allow_edits.is_(True),
            )
        )
    ).all()
    for interrupt in waiting:
        listed = json.loads((interrupt.artifacts_json or b"[]").decode("utf-8"))
        if str(artifact.id) in {str(entry.get("artifact_id")) for entry in listed}:
            return
    raise ApiError(
        409,
        "invalid_state",
        "Invalid state",
        "A document takes changes only while a review that allows edits waits for you.",
    )


# - reading the rows a change starts from -


def _live_artifact(session: Session, artifact_id: UUID) -> ArtifactRow:
    row = session.get(ArtifactRow, artifact_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The artifact does not exist.")
    return row


def _item(session: Session, item_id: UUID, *, deleted: bool = False) -> ArtifactItemRow:
    row = session.get(ArtifactItemRow, item_id)
    if row is None or (row.deleted_at is not None and not deleted):
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    return row


def _live_items(session: Session, artifact_id: UUID) -> list[ArtifactItemRow]:
    return list(
        session.scalars(
            select(ArtifactItemRow).where(
                ArtifactItemRow.artifact_id == artifact_id,
                ArtifactItemRow.deleted_at.is_(None),
            )
        ).all()
    )


def _siblings(items: list[ArtifactItemRow], parent_id: UUID | None) -> list[ArtifactItemRow]:
    return sorted(
        (row for row in items if row.parent_item_id == parent_id),
        key=lambda row: (row.position, row.key),
    )


def _changed_item(row: ArtifactItemRow, reason: str, by: Origin, session: Session) -> None:
    """A new version of an item, with its revision."""
    row.version += 1
    origins.write(row, "updated", by)
    row.updated_at = _now()
    session.flush()
    session.add(item_revision_row(row, reason, by))
    session.flush()


def _check_version(current: int, if_match: str | None, what: str) -> None:
    """`409 version_conflict` when the caller edits from another version than the stored one."""
    if if_match is None:
        return
    if if_match.strip('"') not in {str(current), f'"v{current}"'}:
        raise ApiError(
            409, "version_conflict", "Version conflict", f"The {what} is at version {current}."
        )


# - an artifact -


def patch_artifact(
    session: Session,
    artifact_id: UUID,
    *,
    fields: dict[str, Any],
    if_match: str | None,
    by: Origin,
) -> ArtifactRow:
    """Change the title, summary, content or review status of an artifact."""
    row = _live_artifact(session, artifact_id)
    _check_version(row.version, if_match, "artifact")
    problems: list[Violation] = []
    if "title" in fields and not (isinstance(fields["title"], str) and fields["title"].strip()):
        problems.append(Violation("title", "Enter a title.", "title"))
    if "review_status" in fields and fields["review_status"] not in REVIEW_STATUSES:
        problems.append(Violation("review status", "Not a review status.", "review_status"))
    merged = {**json.loads(row.content_json or b"{}"), **(fields.get("content") or {})}
    if "content" in fields:
        problems += domain_rules.validate_content(
            str(row.kind), merged, value_lists=wf.value_lists()
        )
    if problems:
        raise IntegrityError(problems)
    if "title" in fields:
        row.title = fields["title"].strip()
    if "summary" in fields:
        row.summary = fields["summary"]
    if "content" in fields:
        row.content_json = json.dumps(merged, ensure_ascii=False).encode("utf-8")
    if "review_status" in fields:
        row.review_status = fields["review_status"]
    bump_artifact(session, row, "user_edit", by)
    return row


def _apply_snapshot(
    row: ArtifactItemRow, snapshot: dict[str, Any], live_parents: set[UUID]
) -> None:
    """Put an item back to what a revision says: its content, place and review status."""
    row.content_json = json.dumps(snapshot.get("content", {}), ensure_ascii=False).encode("utf-8")
    row.position = int(snapshot.get("position", row.position))
    parent = snapshot.get("parent_item_id")
    row.parent_item_id = UUID(parent) if parent and UUID(parent) in live_parents else None
    row.review_status = str(snapshot.get("review_status", row.review_status))


def restore_artifact(session: Session, artifact_id: UUID, version: int, by: Origin) -> ArtifactRow:
    """Make an old version of an artifact and of its items current again, as new versions."""
    row = _live_artifact(session, artifact_id)
    revision = session.get(ArtifactRevisionRow, (artifact_id, version))
    if revision is None:
        raise ApiError(404, "not_found", "Not found", "The version does not exist.")
    snapshot = json.loads(revision.snapshot_json or b"{}")
    row.title = snapshot.get("title", row.title)
    row.summary = snapshot.get("summary")
    row.content_json = json.dumps(snapshot.get("content", {}), ensure_ascii=False).encode("utf-8")
    row.review_status = snapshot.get("review_status", row.review_status)
    wanted = {
        UUID(entry["item_id"]): int(entry["version"])
        for entry in json.loads(revision.item_versions_json or b"[]")
    }
    every = list(
        session.scalars(select(ArtifactItemRow).where(ArtifactItemRow.artifact_id == artifact_id))
    )
    parents = set(wanted)
    for item in every:
        if item.id in wanted:
            then = session.get(ItemRevisionRow, (item.id, wanted[item.id]))
            if then is None:
                continue
            item.deleted_at = None
            _apply_snapshot(item, json.loads(then.snapshot_json or b"{}"), parents)
            _changed_item(item, "restored", by, session)
        elif item.deleted_at is None:
            item.deleted_at = _now()
            _changed_item(item, "deleted", by, session)
    bump_artifact(session, row, "restored", by)
    return row


# - the items of an artifact -


def create_item(
    session: Session,
    artifact_id: UUID,
    *,
    kind: str,
    content: dict[str, Any],
    parent_item_id: UUID | None,
    by: Origin,
) -> ArtifactItemRow:
    """Create an item or a section by hand: the server gives it its key and puts it last under
    its parent."""
    artifact = _live_artifact(session, artifact_id)
    items = _live_items(session, artifact_id)
    parent = next((row for row in items if row.id == parent_item_id), None)
    if parent_item_id is not None and parent is None:
        raise _refuse(
            "parent item", "The parent is not an item of this artifact.", "parent_item_id"
        )
    problems = [
        *domain_rules.check_parent(
            None if parent is None else str(parent.kind), kind, str(artifact.kind)
        ),
        *domain_rules.check_section_placement(str(artifact.kind), kind),
    ]
    if problems:
        raise IntegrityError(problems)
    sink = SqlArtifactSink(cast("Engine", session.get_bind()), user_id=by.user_id, as_user=True)
    sink.bind(session)
    ref = sink.add_item(
        str(artifact_id),
        kind,
        content,
        parent_id=None if parent_item_id is None else str(parent_item_id),
    )
    return _item(session, UUID(ref["item_id"]))


def reorder_items(
    session: Session,
    artifact_id: UUID,
    *,
    parent_item_id: UUID | None,
    ids: list[UUID],
    by: Origin,
) -> None:
    """Change the order of the items under one parent: `ids` lists each of them once."""
    artifact = _live_artifact(session, artifact_id)
    siblings = _siblings(_live_items(session, artifact_id), parent_item_id)
    if sorted(ids) != sorted(row.id for row in siblings):
        raise _refuse("reorder", "List every item under the parent once.", "ids")
    by_id = {row.id: row for row in siblings}
    changed = False
    for position, item_id in enumerate(ids, start=1):
        row = by_id[item_id]
        if row.position != position:
            row.position = position
            _changed_item(row, "user_edit", by, session)
            changed = True
    if changed:
        bump_artifact(session, artifact, "user_edit", by)


def _is_below(items: list[ArtifactItemRow], item_id: UUID, ancestor_id: UUID) -> bool:
    """Whether `item_id` sits inside `ancestor_id`."""
    parents = {row.id: row.parent_item_id for row in items}
    cursor = parents.get(item_id)
    seen: set[UUID] = set()
    while cursor is not None and cursor not in seen:
        if cursor == ancestor_id:
            return True
        seen.add(cursor)
        cursor = parents.get(cursor)
    return False


def move_item(
    session: Session,
    item_id: UUID,
    *,
    parent_item_id: UUID | None,
    position: int,
    by: Origin,
) -> ArtifactItemRow:
    """Move an item, with everything inside it, under another parent of the same artifact."""
    row = _item(session, item_id)
    artifact = _live_artifact(session, row.artifact_id)
    items = _live_items(session, row.artifact_id)
    parent = next((entry for entry in items if entry.id == parent_item_id), None)
    if parent_item_id is not None and parent is None:
        raise _refuse(
            "parent item", "The parent is not an item of this artifact.", "parent_item_id"
        )
    problems = domain_rules.check_parent(
        None if parent is None else str(parent.kind), str(row.kind), str(artifact.kind)
    )
    if parent_item_id == item_id or (
        parent_item_id is not None and _is_below(items, parent_item_id, item_id)
    ):
        problems.append(Violation("tree", "An item cannot move into itself.", "parent_item_id"))
    new_parent = {
        entry.id: parent_item_id if entry.id == item_id else entry.parent_item_id for entry in items
    }
    after = [
        {"id": str(key), "parent": None if value is None else str(value)}
        for key, value in new_parent.items()
    ]
    problems += domain_rules.check_item_tree(after)
    if problems:
        raise IntegrityError(problems)
    old_parent = row.parent_item_id
    target = [entry for entry in _siblings(items, parent_item_id) if entry.id != item_id]
    target.insert(max(0, min(position - 1, len(target))), row)
    row.parent_item_id = parent_item_id
    changed: list[ArtifactItemRow] = []
    for place, entry in enumerate(target, start=1):
        if entry.position != place or (entry.id == item_id and old_parent != parent_item_id):
            entry.position = place
            changed.append(entry)
    if old_parent != parent_item_id:
        left = [entry for entry in _siblings(items, old_parent) if entry.id != item_id]
        for place, entry in enumerate(left, start=1):
            if entry.position != place:
                entry.position = place
                changed.append(entry)
    for entry in changed:
        _changed_item(entry, "user_edit", by, session)
    if changed:
        bump_artifact(session, artifact, "user_edit", by)
    return row


def delete_item(session: Session, item_id: UUID, by: Origin) -> None:
    """Soft delete: the item gets a new version with the reason `deleted` and leaves the lists.
    A section that still holds items is refused."""
    row = _item(session, item_id)
    artifact = _live_artifact(session, row.artifact_id)
    if any(entry.parent_item_id == item_id for entry in _live_items(session, row.artifact_id)):
        raise ApiError(
            409,
            "invalid_state",
            "Invalid state",
            "The item still holds items; move or delete them.",
        )
    row.deleted_at = _now()
    _changed_item(row, "deleted", by, session)
    bump_artifact(session, artifact, "user_edit", by)


def restore_item(session: Session, item_id: UUID, version: int, by: Origin) -> ArtifactItemRow:
    """Make an old version of an item current again, as a new version; it also brings back an
    item that was deleted."""
    row = _item(session, item_id, deleted=True)
    artifact = _live_artifact(session, row.artifact_id)
    revision = session.get(ItemRevisionRow, (item_id, version))
    if revision is None:
        raise ApiError(404, "not_found", "Not found", "The version does not exist.")
    parents = {entry.id for entry in _live_items(session, row.artifact_id)}
    row.deleted_at = None
    _apply_snapshot(row, json.loads(revision.snapshot_json or b"{}"), parents)
    _changed_item(row, "restored", by, session)
    bump_artifact(session, artifact, "restored", by)
    return row


# - the trace links of the project -


def create_link(
    session: Session,
    project_id: UUID,
    *,
    source_item_id: UUID,
    target_item_id: UUID,
    link_type: str,
    note: str | None,
    source_quote: str | None,
    target_quote: str | None,
) -> TraceLinkRow:
    """Create a link by hand. The link type is one of the definition that is not only for the
    agents, the pair of kinds is one the link type allows, and a quote follows the quote rules."""
    types = wf.link_types()
    source = _item(session, source_item_id)
    target = _item(session, target_item_id)
    if source.project_id != project_id or target.project_id != project_id:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    if link_type not in types:
        raise _refuse("link type", "Not a link type of the workflow.", "link_type")
    if types[link_type].get("agent_only"):
        raise _refuse("link type", "Only the agents create this type of link.", "link_type")
    problems = domain_rules.check_link(
        domain_rules.LinkCandidate(
            link_type=link_type,
            source_id=str(source.id),
            source_kind=str(source.kind),
            target_id=str(target.id),
            target_kind=str(target.kind),
        ),
        link_types=types,
    )
    for side, quote, item in (("source", source_quote, source), ("target", target_quote, target)):
        if quote is not None:
            problems += [
                Violation(violation.rule, violation.message, f"{side}_quote")
                for violation in domain_rules.check_quote(
                    side,
                    quote,
                    link_type=link_type,
                    link_type_definition=types[link_type],
                    kind=str(item.kind),
                    content=json.loads(item.content_json or b"{}"),
                )
            ]
    existing = list(
        session.scalars(
            select(TraceLinkRow).where(
                TraceLinkRow.project_id == project_id, TraceLinkRow.deleted_at.is_(None)
            )
        )
    )
    if link_type in link_rules.ACYCLIC_LINK_TYPES and not problems:
        rows = [
            (str(row.source_item_id), str(row.target_item_id), str(row.link_type))
            for row in existing
        ]
        rows.append((str(source.id), str(target.id), link_type))
        if link_rules.has_cycle(rows, link_type):
            problems.append(Violation("no cycle", f"{link_type} would loop back", "target_item_id"))
    if problems:
        raise IntegrityError(problems)
    if any(
        row.source_item_id == source.id
        and row.target_item_id == target.id
        and row.link_type == link_type
        for row in existing
    ):
        raise ApiError(409, "conflict", "Conflict", "These items are already linked this way.")
    link = TraceLinkRow(
        project_id=project_id,
        link_type=link_type,
        source_item_id=source.id,
        target_item_id=target.id,
        target_version=target.version,
        source_quote=source_quote,
        target_quote=target_quote,
        note=note,
    )
    session.add(link)
    session.flush()
    return link


def delete_link(session: Session, link_id: UUID) -> None:
    """Remove a link: it keeps its row with `deleted_at` set, so earlier steps can show it."""
    link = session.get(TraceLinkRow, link_id)
    if link is None or link.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The link does not exist.")
    link.deleted_at = _now()
    session.flush()
