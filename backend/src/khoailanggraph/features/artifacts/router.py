"""Artifact routes: items search, kinds, definition, models (§5, mock parity)."""

from __future__ import annotations

import json as jsonlib
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

from khoailanggraph.agents.requirements_engineering import definition as workflow
from khoailanggraph.api import deps
from khoailanggraph.api.errors import ApiError
from khoailanggraph.api.schemas import MAX_LIMIT, Page
from khoailanggraph.features.artifacts import schemas, service
from khoailanggraph.features.artifacts.models import ArtifactItemRow
from khoailanggraph.features.projects.service import get_project_row
from khoailanggraph.features.runs.service import project_has_active_run
from khoailanggraph.llm.registry import default_registry

router = APIRouter()


@router.get("/projects/{project_id}/items")
async def search_items(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    q: Annotated[str, Query()] = "",
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Item]:
    """Search the items of a project by key or text (§5)."""
    await get_project_row(db, project_id)
    items, next_cursor = await service.search_project_items(
        db, project_id, query=q, limit=limit, cursor=cursor
    )
    return Page(items=items, next_cursor=next_cursor)


@router.get("/projects/{project_id}/artifacts")
async def list_project_artifacts(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.ArtifactSummary]:
    """The artifacts of the project, for the Artifacts tree (§5)."""
    await get_project_row(db, project_id)
    artifacts, next_cursor = await service.list_project_artifacts(
        db, project_id, limit=limit, cursor=cursor
    )
    return Page(items=artifacts, next_cursor=next_cursor)


@router.get("/projects/{project_id}/links")
async def list_project_trace_links(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 200,
) -> Page[schemas.TraceLink]:
    """The trace links of the project, both ends resolved (§5 Traceability)."""
    await get_project_row(db, project_id)
    links, next_cursor = await service.list_project_links(
        db, project_id, limit=limit, cursor=cursor
    )
    return Page(items=links, next_cursor=next_cursor)


@router.get("/items/{item_id}")
async def get_item(
    item_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.Item:
    """One item (§5); a later ?version reads any stored version."""
    return await service.get_item(db, item_id)


@router.get("/artifact-kinds")
async def list_artifact_kinds(
    user: deps.CurrentUser,
) -> Any:
    """The kinds + schemas of the version-1 definition (mock parity)."""
    return service.artifact_kinds_response(workflow)


@router.get("/workflow/definition")
async def get_workflow_definition(
    user: deps.CurrentUser,
    version: Annotated[int | None, Query()] = None,
) -> Any:
    """The definition JSON; immutable cache when ?version= is given (§5)."""
    raw = workflow.definition_bytes()
    headers: dict[str, str] = {}
    if version is not None:
        headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return JSONResponse(content=jsonlib.loads(raw.decode("utf-8")), headers=headers)


@router.get("/models")
async def list_models(user: deps.CurrentUser) -> Any:
    """The allowlist catalog served to the settings UI (§5)."""
    registry = default_registry()
    return {
        "models": [
            {
                "id": entry.id,
                "label": entry.label,
                "provider": entry.id.partition(":")[0],
                "capabilities": list(entry.capabilities),
            }
            for entry in registry.allowlist
        ]
    }


class PatchItemBody(BaseModel):
    """PATCH /items/{id}: content fields and/or review_status (§5)."""

    model_config = ConfigDict(extra="forbid")

    content: dict[str, Any] | None = None
    review_status: str | None = None


@router.patch("/items/{item_id}")
async def patch_item(
    item_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    body: PatchItemBody,
    if_match: Annotated[str | None, Header()] = None,
    _origin: Annotated[None, Depends(deps.check_origin)] = None,
) -> schemas.Item:
    """Edit an item (§5): If-Match version → 409 on mismatch; items are
    read-only while a run of their project is unfinished (409 invalid_state)."""
    current = await service.get_item(db, item_id)
    row = await db.get(ArtifactItemRow, item_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    if await project_has_active_run(db, UUID(str(row.project_id))):
        raise ApiError(
            409,
            "invalid_state",
            "Invalid state",
            "A run of this project is in progress; items are read-only.",
        )
    wanted = (if_match or "").strip('"')
    if if_match is not None and wanted not in {str(current.version), f'"v{current.version}"'}:
        raise ApiError(
            409,
            "version_conflict",
            "Version conflict",
            f"The item is at version {current.version}.",
        )
    merged = {**current.content, **(body.content or {})}
    row.content_json = jsonlib.dumps(merged, ensure_ascii=False).encode("utf-8")
    if body.review_status is not None:
        row.review_status = body.review_status
    row.version += 1
    await db.flush()
    return await service.get_item(db, item_id)
