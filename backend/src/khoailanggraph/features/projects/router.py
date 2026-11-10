"""Project routes of docs/API.md §5, shape-locked to frontend Zod."""

from __future__ import annotations

from datetime import datetime  # noqa: TC003 - FastAPI reads the annotation at run time
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response

from khoailanggraph.api import deps, idempotency
from khoailanggraph.api.errors import ApiError
from khoailanggraph.api.schemas import MAX_LIMIT, Page
from khoailanggraph.features.projects import schemas, service
from khoailanggraph.features.projects.service import ROLLUP_ORDER
from khoailanggraph.features.threads import schemas as thread_schemas
from khoailanggraph.features.threads import service as thread_service

# The values a project list may be filtered by: the rollup statuses and "none" for no run yet.
ROLLUP_FILTERS = ("none", *ROLLUP_ORDER)

router = APIRouter()


@router.get("/projects")
async def list_projects(
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    status: Annotated[str, Query()] = "active",
    rollup_run_status: Annotated[list[str] | None, Query()] = None,
    last_activity_after: Annotated[datetime | None, Query()] = None,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.ProjectSummary]:
    """The projects of the user with one status, the latest activity first. `rollup_run_status`
    may be given several times (`none` matches a project without a run); `last_activity_after`
    keeps the projects with activity after a time (§3/§5)."""
    unknown = [value for value in rollup_run_status or [] if value not in ROLLUP_FILTERS]
    if unknown:
        raise ApiError(
            400,
            "invalid_request",
            "Invalid request",
            f"rollup_run_status must be one of {', '.join(ROLLUP_FILTERS)}.",
        )
    filters = service.ProjectFilters(
        status=status,
        rollup_run_statuses=rollup_run_status,
        last_activity_after=last_activity_after,
    )
    views, next_cursor = await service.list_projects(
        db, UUID(str(user.id)), filters, cursor=cursor, limit=limit
    )
    return Page(items=views, next_cursor=next_cursor)


@router.post("/projects", status_code=201)
async def create_project(
    body: schemas.ProjectBody,
    request: Request,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Any:
    """Create a project. The name is optional: without it, the first run names the project from
    its initial intent. A language left out is the default language of the user (§5). A repeated
    request with the same `Idempotency-Key` gives the first answer and creates nothing."""
    replayed = await idempotency.replay(request, db, UUID(str(user.id)))
    if replayed is not None:
        return replayed
    name = None if body.name is None else body.name.strip()
    if name == "":
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
    view = await service.project_view(db, row)
    return await idempotency.remember(
        request,
        db,
        UUID(str(user.id)),
        201,
        view.model_dump(mode="json"),
        {"Location": f"/api/v1/projects/{row.id}"},
    )


@router.get("/projects/{project_id}")
async def get_project(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.ProjectSummary:
    """One project with the derived counts the project list shows."""
    row = await service.get_project_row(db, project_id)
    return await service.project_view(db, row)


@router.patch("/projects/{project_id}")
async def update_project(
    project_id: UUID,
    body: schemas.ProjectPatch,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.ProjectSummary:
    """Change the name, description, status, run settings or model overrides of a project."""
    row = await service.get_project_row(db, project_id)
    await service.update_project(db, row, body)
    return await service.project_view(db, row)


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Response:
    """Soft delete a project; one with an unfinished run answers 409."""
    row = await service.get_project_row(db, project_id)
    await service.delete_project(db, row)
    return Response(status_code=204)


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
    return await thread_service.thread_view(db, row)


@router.get("/threads")
async def list_user_threads(
    user: deps.CurrentUser,
    db: deps.DbSession,
    project_id: Annotated[UUID | None, Query()] = None,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[thread_schemas.ThreadSummary]:
    """The threads of the user across their projects, `?project_id=` keeps one project's;
    newest message first (§5)."""
    views, next_cursor = await thread_service.list_user_threads(
        db, owner_id=UUID(str(user.id)), project_id=project_id, cursor=cursor, limit=limit
    )
    return Page(items=views, next_cursor=next_cursor)


@router.patch("/threads/{thread_id}")
async def update_thread(
    thread_id: UUID,
    body: thread_schemas.ThreadPatch,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> thread_schemas.ThreadSummary:
    """Change the title or the status of a thread."""
    row = await thread_service.get_thread_row(db, thread_id)
    await thread_service.update_thread(db, row, body)
    return await thread_service.thread_view(db, row)


@router.delete("/threads/{thread_id}", status_code=204)
async def delete_thread(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Response:
    """Soft delete a thread; one with an unfinished run answers 409."""
    row = await thread_service.get_thread_row(db, thread_id)
    await thread_service.delete_thread(db, row)
    return Response(status_code=204)


@router.get("/threads/{thread_id}")
async def get_thread(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> thread_schemas.ThreadSummary:
    """One thread, with its unfinished run and the status of its latest run."""
    row = await thread_service.get_thread_row(db, thread_id)
    return await thread_service.thread_view(db, row)
