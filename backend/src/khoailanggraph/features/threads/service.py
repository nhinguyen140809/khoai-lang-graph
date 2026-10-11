"""Thread use cases (§5): the conversation container, auto-created for a
project on first chat open, title nulled until the first message (§5)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID  # noqa: TC003 - FastAPI cast at runtime

from sqlalchemy import select

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.projects.service import get_project_row
from khoailanggraph.features.threads import schemas
from khoailanggraph.features.threads.models import ThreadRow


def _now() -> datetime:
    return datetime.now(UTC)


async def thread_view(row: ThreadRow) -> schemas.ThreadSummary:
    """The thread shape the FE reads: active run fields included (§5)."""
    return schemas.ThreadSummary(
        id=str(row.id),
        project_id=str(row.project_id),
        created_by=str(row.created_by),
        title=row.title,
        status=row.status,
        current_stage=row.current_stage,
        active_run_id=str(row.active_run_id) if row.active_run_id else None,
        active_run_status=row.active_run_status,
        last_message_at=row.last_message_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


async def get_thread_row(session: AsyncSession, thread_id: UUID) -> ThreadRow:
    """The thread row; 404 Problem carries a message the FE trusts."""
    row = await session.get(ThreadRow, thread_id)
    if row is None or row.deleted_at is not None:
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
    views = [await thread_view(row) for row in rows]
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
