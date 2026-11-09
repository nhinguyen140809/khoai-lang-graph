"""Project routes of docs/API.md §5, shape-locked to frontend Zod."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response

from khoailanggraph.api import deps
from khoailanggraph.api.errors import ApiError
from khoailanggraph.api.schemas import MAX_LIMIT, Page
from khoailanggraph.features.projects import schemas, service
from khoailanggraph.features.threads import schemas as thread_schemas
from khoailanggraph.features.threads import service as thread_service

router = APIRouter()


@router.get("/projects")
async def list_projects(
    user: deps.CurrentUser,
    db: deps.DbSession,
    status: Annotated[str, Query()] = "active",
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.ProjectSummary]:
    """Owner's projects, newest activity first, envelope + cursor (§3/§5)."""
    views, next_cursor = await service.list_projects(
        db, UUID(str(user.id)), status=status, cursor=cursor, limit=limit
    )
    return Page(items=views, next_cursor=next_cursor)


@router.post("/projects", status_code=201)
async def create_project(
    body: schemas.ProjectBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    response: Response,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.ProjectSummary:
    """Create a project; the FE opens its chat right after (§5)."""
    name = body.name.strip()
    if not name:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            errors=[{"field": "name", "message": "Enter a name."}],
        )
    row = await service.create_project(
        db,
        user,
        schemas.ProjectBody(
            name=name, description=body.description, output_language=body.output_language
        ),
    )
    response.headers["Location"] = f"/api/v1/projects/{row.id}"
    return await service.project_view(db, row)


@router.get("/projects/{project_id}")
async def get_project(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.ProjectSummary:
    """One project with the derived counts the project list shows."""
    row = await service.get_project_row(db, project_id)
    return await service.project_view(db, row)


@router.get("/projects/{project_id}/threads")
async def list_threads(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[thread_schemas.ThreadSummary]:
    """The conversation of the project, newest message first (§5)."""
    views, next_cursor = await thread_service.list_threads(
        db, project_id=project_id, cursor=cursor, limit=limit
    )
    return Page(items=views, next_cursor=next_cursor)


@router.post("/projects/{project_id}/threads", status_code=201)
async def create_thread(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    response: Response,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> thread_schemas.ThreadSummary:
    """Create the empty conversation; 201 + Location (§5)."""
    row = await thread_service.create_thread(
        db, project_id=project_id, created_by=UUID(str(user.id))
    )
    response.headers["Location"] = f"/api/v1/threads/{row.id}"
    return await thread_service.thread_view(row)


@router.get("/threads/{thread_id}")
async def get_thread(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> thread_schemas.ThreadSummary:
    """One thread, with `active_run_id`/`active_run_status` when it runs."""
    row = await thread_service.get_thread_row(db, thread_id)
    return await thread_service.thread_view(row)
