"""Project use cases over the ORM rows (§5): the shape the FE client reads.

Parity notes (matching the current Zod on one side and API.md on the other):
`run_config` and `model_overrides` always appear (objects, never omitted),
`item_counts` is derived from live items of the project, and the
`unfinished_run_counts` count runs in `queued`, `running`, `interrupted` —
`interrupted` being the ones waiting on a review, exactly what the badge on
the activity bar shows. Nothing here touches HTTP.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import func, select

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.me.models import UserRow

from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.artifacts.models import ArtifactItemRow
from khoailanggraph.features.projects import schemas
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.runs.models import RunRow

UNFINISHED_STATUSES = ("queued", "running", "interrupted")


def _now() -> datetime:
    return datetime.now(UTC)


async def get_project_row(session: AsyncSession, project_id: UUID) -> ProjectRow:
    """The project row or a 404 Problem (the one answer for missing ids)."""
    row = await session.get(ProjectRow, project_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The project does not exist.")
    return row


async def _item_counts(session: AsyncSession, project_id: UUID) -> dict[str, int]:
    """Grouped live item counts of one project, censoring zero-sized keys? No—
    zero-sized keys stay (breaks nothing in TS; keeps the bootstrap cheap)."""
    statement = (
        select(ArtifactItemRow.kind, func.count())
        .where(
            ArtifactItemRow.project_id == project_id,
            ArtifactItemRow.deleted_at.is_(None),
        )
        .group_by(ArtifactItemRow.kind)
    )
    return {kind: int(count) for kind, count in (await session.execute(statement)).all()}


async def _unfinished_counts(session: AsyncSession, project_id: UUID) -> dict[str, int]:
    statement = (
        select(RunRow.status, func.count())
        .where(
            RunRow.project_id == project_id,
            RunRow.status.in_(UNFINISHED_STATUSES),
        )
        .group_by(RunRow.status)
    )
    rows = {status: int(count) for status, count in (await session.execute(statement)).all()}
    return {status: rows.get(status, 0) for status in UNFINISHED_STATUSES}


def _run_defaults(raw: bytes) -> schemas.RunDefaults:
    payload = json.loads(raw.decode("utf-8") or b"{}")
    if not isinstance(payload, dict):
        payload = {}
    return schemas.RunDefaults.model_validate(payload)


async def project_view(
    session: AsyncSession,
    row: ProjectRow,
) -> schemas.ProjectSummary:
    """Every field of GET /projects/{id} (§5), derived fresh per read."""
    item_counts = await _item_counts(session, row.id)
    unfinished = await _unfinished_counts(session, row.id)
    return schemas.ProjectSummary(
        id=str(row.id),
        owner_id=str(row.owner_id),
        name=row.name,
        description=row.description,
        status=row.status,
        output_language=row.output_language,
        run_config=_run_defaults(row.run_config_json),
        initial_message_id=(str(row.initial_message_id) if row.initial_message_id else None),
        model_overrides={
            k: v
            for k, v in json.loads(
                (row.model_overrides_json or b"{}").decode("utf-8") or "{}"
            ).items()
        },
        item_counts=item_counts,
        unfinished_run_counts=schemas.UnfinishedRunCounts(
            queued=unfinished.get("queued", 0),
            running=unfinished.get("running", 0),
            interrupted=unfinished.get("interrupted", 0),
        ),
        last_activity_at=row.last_activity_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


async def list_projects(
    session: AsyncSession,
    owner_id: UUID,
    *,
    status: str,
    cursor: int,
    limit: int,
) -> tuple[list[schemas.ProjectSummary], int | None]:
    """Threads of the owner, newest activity first, cursor pagination (§3)."""
    statement = (
        select(ProjectRow)
        .where(
            ProjectRow.owner_id == owner_id,
            ProjectRow.status == status,
            ProjectRow.deleted_at.is_(None),
        )
        .order_by(ProjectRow.last_activity_at.desc(), ProjectRow.id)
    )
    statement = statement.offset(cursor).limit(limit) if cursor else statement.limit(limit)
    rows = list((await session.scalars(statement)).all())
    views = [await project_view(session, row) for row in rows]
    next_cursor = cursor + len(views) if len(views) == limit else None
    return views, next_cursor


async def create_project(
    session: AsyncSession,
    owner: UserRow,
    body: schemas.ProjectBody,
) -> ProjectRow:
    """Create one project; name whitespace is a 422 at the router, robust even here."""
    row = ProjectRow(
        id=uuid4(),
        owner_id=UUID(str(owner.id)),
        name=body.name,
        description=body.description,
        output_language=body.output_language,
        run_config_json=b"{}",
        model_overrides_json=b"{}",
        last_activity_at=_now(),
    )
    session.add(row)
    await session.flush()
    return row
