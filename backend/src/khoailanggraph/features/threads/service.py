"""Thread use cases (§5): the conversation container, auto-created for a
project on first chat open, title nulled until the first message (§5)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING, cast
from uuid import UUID  # noqa: TC003 - FastAPI cast at runtime

from sqlalchemy import select

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.projects.service import get_project_row, has_unfinished_thread_run
from khoailanggraph.features.runs.models import RunRow
from khoailanggraph.features.threads import schemas
from khoailanggraph.features.threads.models import ThreadRow


def _now() -> datetime:
    return datetime.now(UTC)


async def latest_run_status(session: AsyncSession, thread_id: UUID) -> str | None:
    """The status of the latest run of a thread, unfinished or ended; null before its first run."""
    return await session.scalar(
        select(RunRow.status)
        .where(RunRow.thread_id == thread_id)
        .order_by(RunRow.number.desc())
        .limit(1)
    )


async def thread_view(session: AsyncSession, row: ThreadRow) -> schemas.ThreadSummary:
    """The thread shape the client reads, with the status of its latest run."""
    return schemas.ThreadSummary(
        id=str(row.id),
        project_id=str(row.project_id),
        created_by=str(row.created_by),
        title=row.title,
        status=row.status,
        current_stage=row.current_stage,
        active_run_id=str(row.active_run_id) if row.active_run_id else None,
        latest_run_status=cast(
            "schemas.RunStatus | None", await latest_run_status(session, row.id)
        ),
        last_message_at=row.last_message_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


async def get_thread_row(session: AsyncSession, thread_id: UUID) -> ThreadRow:
    """The thread row; 404 Problem carries a message the FE trusts."""
    row = await session.get(ThreadRow, thread_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The thread does not exist.")
    project = await session.get(ProjectRow, row.project_id)
    if project is None or project.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The thread does not exist.")
    return row


async def list_threads(
    session: AsyncSession,
    *,
    project_id: UUID,
    cursor: int,
    limit: int,
) -> tuple[list[schemas.ThreadSummary], int | None]:
    """The threads of a project, newest message first (API.md §5)."""
    await get_project_row(session, project_id)
    statement = (
        select(ThreadRow)
        .where(
            ThreadRow.project_id == project_id,
            ThreadRow.deleted_at.is_(None),
        )
        .order_by(ThreadRow.last_message_at.desc(), ThreadRow.id)
    )
    statement = statement.offset(cursor).limit(limit) if cursor else statement.limit(limit)
    rows = list((await session.scalars(statement)).all())
    views = [await thread_view(session, row) for row in rows]
    next_cursor = cursor + len(views) if len(views) == limit else None
    return views, next_cursor


async def create_thread(
    session: AsyncSession,
    *,
    project_id: UUID,
    created_by: UUID,
    title: str | None = None,
) -> ThreadRow:
    """The empty conversation the first message later fills (§5)."""
    await get_project_row(session, project_id)
    row = ThreadRow(
        project_id=project_id,
        created_by=created_by,
        title=title,
        last_message_at=_now(),
    )
    session.add(row)
    await session.flush()
    return row


async def resolve_or_create_thread(
    session: AsyncSession,
    *,
    project_id: UUID,
    user_id: UUID,
) -> ThreadRow:
    """The project's single conversation; created on the first chat open."""
    statement = (
        select(ThreadRow)
        .where(ThreadRow.project_id == project_id, ThreadRow.deleted_at.is_(None))
        .order_by(ThreadRow.last_message_at.desc())
        .limit(1)
    )
    existing = await session.scalar(statement)
    if existing is not None:
        return existing
    return await create_thread(session, project_id=project_id, created_by=user_id)


async def list_user_threads(
    session: AsyncSession,
    *,
    owner_id: UUID,
    project_id: UUID | None,
    cursor: int,
    limit: int,
) -> tuple[list[schemas.ThreadSummary], int | None]:
    """The threads of the user across their projects, or of one project, newest message first."""
    conditions = [
        ProjectRow.owner_id == owner_id,
        ProjectRow.deleted_at.is_(None),
        ThreadRow.deleted_at.is_(None),
    ]
    if project_id is not None:
        conditions.append(ThreadRow.project_id == project_id)
    rows = list(
        (
            await session.scalars(
                select(ThreadRow)
                .join(ProjectRow, ProjectRow.id == ThreadRow.project_id)
                .where(*conditions)
                .order_by(ThreadRow.last_message_at.desc(), ThreadRow.id)
                .offset(cursor)
                .limit(limit + 1)
            )
        ).all()
    )
    window = rows[:limit]
    views = [await thread_view(session, row) for row in window]
    return views, (cursor + limit if len(rows) > limit else None)


async def update_thread(
    session: AsyncSession, row: ThreadRow, body: schemas.ThreadPatch
) -> ThreadRow:
    """Change the title or the status of a thread. The title is a text with more than
    whitespace and cannot be set back to null."""
    given = body.model_fields_set
    problems: list[dict[str, str]] = []
    if "title" in given and (body.title is None or not body.title.strip()):
        problems.append({"field": "title", "message": "Enter a title."})
    if "status" in given and body.status is None:
        problems.append({"field": "status", "message": "Choose active or archived."})
    if problems:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            "The body has fields that are not valid.",
            errors=problems,
        )
    if "title" in given and body.title is not None:
        row.title = body.title.strip()
    if "status" in given and body.status is not None:
        row.status = body.status
    row.updated_at = _now()
    await session.flush()
    return row


async def delete_thread(session: AsyncSession, row: ThreadRow) -> None:
    """Soft delete a thread; one with an unfinished run is refused: the run is stopped first."""
    if await has_unfinished_thread_run(session, row.id):
        raise ApiError(
            409,
            "invalid_state",
            "Invalid state",
            "A run of the thread is not finished; stop it first.",
        )
    row.deleted_at = _now()
    await session.flush()
