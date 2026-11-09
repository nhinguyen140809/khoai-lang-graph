"""Export routes of docs/API.md §5."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import FileResponse

from khoailanggraph.api import deps
from khoailanggraph.api.schemas import MAX_LIMIT, Page
from khoailanggraph.features.exports import renderers, schemas, service
from khoailanggraph.features.projects.service import get_project_row

router = APIRouter()


@router.post("/projects/{project_id}/exports", status_code=202)
async def create_export(
    project_id: UUID,
    body: schemas.ExportBody,
    request: Request,
    user: deps.CurrentUser,
    db: deps.DbSession,
    response: Response,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Export:
    """Request a document: a template of the workflow and one of its formats. The file is
    generated at once from the current versions of the documents; `included_artifacts` names
    the exact versions it holds."""
    project = await get_project_row(db, project_id)
    row = await service.create_export(
        db,
        store=Path(request.app.state.settings.exports_dir),
        project=project,
        user=user,
        body=body,
    )
    response.headers["Location"] = f"/api/v1/exports/{row.id}"
    return service.export_view(row)


@router.get("/projects/{project_id}/exports")
async def list_exports(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Export]:
    """The exports of a project, newest first."""
    await get_project_row(db, project_id)
    items, next_cursor = await service.list_exports(db, project_id, cursor=cursor, limit=limit)
    return Page(items=items, next_cursor=next_cursor)


@router.get("/exports/{export_id}")
async def get_export(
    export_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.Export:
    """The status of an export; a ready one carries the address of its file."""
    return service.export_view(await service.get_export_row(db, export_id))


@router.get("/exports/{export_id}/file")
async def download_export(
    export_id: UUID,
    request: Request,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> FileResponse:
    """The file of a ready export, as a download."""
    row = await service.get_export_row(db, export_id)
    path = service.file_path(Path(request.app.state.settings.exports_dir), row)
    return FileResponse(
        path,
        media_type=renderers.MEDIA_TYPES[row.format],
        filename=row.file_name,
    )
