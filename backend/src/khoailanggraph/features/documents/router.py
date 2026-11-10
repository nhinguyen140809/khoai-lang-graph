"""Document routes: upload, list, read, soft delete (docs/API.md §5)."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Form, Query, Request, UploadFile
from fastapi.responses import JSONResponse, Response

from khoailanggraph.api import deps
from khoailanggraph.api.errors import ApiError
from khoailanggraph.api.schemas import MAX_LIMIT, Cursor, Page
from khoailanggraph.features.documents import schemas, service
from khoailanggraph.features.documents.models import SourceDocumentRow
from khoailanggraph.features.projects.service import get_project_row

router = APIRouter()


@router.post("/projects/{project_id}/documents", status_code=201)
async def upload_document(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    request: Request,
    file: UploadFile,
    title: Annotated[str | None, Form()] = None,
    first_version_id: Annotated[UUID | None, Form()] = None,
    _origin: Annotated[None, Depends(deps.check_origin)] = None,
) -> JSONResponse:
    """Upload one source document (§5 Source documents).

    The bytes land on the configured store; the response carries the parsed
    metadata and the server-extracted text, never the raw bytes, with a
    `Location` header on the created document.
    """
    await get_project_row(db, project_id)
    settings = request.app.state.settings
    limit = settings.max_upload_mb * 1024 * 1024
    payload = await file.read(limit + 1)
    if len(payload) > limit:
        raise ApiError(
            422,
            "too_large",
            "Too large",
            f"Uploads are at most {settings.max_upload_mb} MB.",
        )
    filename = file.filename or "untitled.txt"
    detail = await service.save_document(
        db,
        store=Path(settings.documents_dir),
        project_id=project_id,
        filename=filename,
        title=title,
        payload=payload,
        first_version_id=first_version_id,
    )
    return JSONResponse(
        status_code=201,
        content=detail.model_dump(mode="json"),
        headers={"Location": f"/api/v1/documents/{detail.id}"},
    )


@router.get("/projects/{project_id}/documents")
async def list_documents(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Document]:
    """Documents of the project, newest first (API.md envelope)."""
    await get_project_row(db, project_id)
    documents, next_cursor = await service.list_documents(
        db, project_id, limit=limit, cursor=cursor
    )
    return Page(items=documents, next_cursor=next_cursor)


@router.get("/documents/{document_id}")
async def get_document(
    document_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    version: Annotated[int | None, Query()] = None,
) -> schemas.DocumentDetail:
    """One document with its versions; `?version=` reads any stored text."""
    document = await db.get(SourceDocumentRow, document_id)
    if document is None or document.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The document does not exist.")
    await get_project_row(db, document.project_id)
    return await service.document_detail(db, document_id, version_requested=version)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)] = None,
) -> Response:
    """Soft delete (§5): the lists leave it, the versions stay readable."""
    document = await db.get(SourceDocumentRow, document_id)
    if document is None or document.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The document does not exist.")
    await get_project_row(db, document.project_id)
    await service.delete_document(db, document_id)
    return Response(status_code=204)
