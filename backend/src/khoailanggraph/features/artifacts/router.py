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
from khoailanggraph.features.artifacts.models import ArtifactItemRow, ArtifactRow
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
    kind: Annotated[str | None, Query()] = None,
    review_status: Annotated[str | None, Query()] = None,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Item]:
    """Search the items of a project by key or text, with the filters of
    docs/API.md §5: `kind` and `review_status` (filtering by `run_id` needs
    the actor tables and stays a follow-up)."""
    await get_project_row(db, project_id)
    items, next_cursor = await service.search_project_items(
        db, project_id, query=q, kind=kind, review_status=review_status, limit=limit, cursor=cursor
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


@router.get("/projects/{project_id}/trace-links")
async def list_project_trace_links(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    link_type: Annotated[str | None, Query()] = None,
    source_item_id: Annotated[UUID | None, Query()] = None,
    target_item_id: Annotated[UUID | None, Query()] = None,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 200,
) -> Page[schemas.TraceLink]:
    """Current links of the project, both ends resolved (API.md §5); the
    optional filters keep one link type or one link end."""
    await get_project_row(db, project_id)
    links, _all_fetched = await service.list_project_links(
        db, project_id, limit=10_000, cursor=0
    )
    if link_type is not None:
        links = [link for link in links if link.link_type == link_type]
    if source_item_id is not None:
        links = [link for link in links if link.source.id == str(source_item_id)]
    if target_item_id is not None:
        links = [link for link in links if link.target.id == str(target_item_id)]
    window = links[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(links) else None
    return Page(items=window, next_cursor=next_cursor)


@router.get("/projects/{project_id}/traceability/matrix")
async def traceability_matrix(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> dict[str, list[schemas.MatrixChainRow]]:
    """Rows of `derived_from` chains from backlog item down to raw requirement
    (API.md; the Traceability matrix view)."""
    await get_project_row(db, project_id)
    rows = await service.traceability_matrix(db, project_id)
    return {"rows": rows}


@router.get("/projects/{project_id}/traceability/coverage")
async def traceability_coverage(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.TraceCoverage:
    """Counts and lists (API.md): requirements with no backlog item,
    requirements with no source, items that need review after a source
    changed."""
    await get_project_row(db, project_id)
    return await service.traceability_coverage(db, project_id)


@router.get("/items/{item_id}/revisions")
async def item_revisions(
    item_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> Page[schemas.ItemRevision]:
    """Version history of the item, newest first (the TIMELINE view)."""
    revisions = await service.item_revisions(db, item_id)
    return Page(items=revisions, next_cursor=None)


@router.get("/items/{item_id}/trace")
async def item_trace(
    item_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    direction: Annotated[str, Query()] = "both",
    depth: Annotated[int, Query(ge=1, le=10)] = 5,
) -> dict[str, Any]:
    """The chain of one item: `nodes` and their `links`, walked `depth`
    hops backward, forward or both (API.md §5)."""
    nodes, links = await service.item_trace(
        db, item_id, direction=direction, depth=depth
    )
    return {"nodes": nodes, "links": links}


@router.get("/artifacts/{artifact_id}/items")
async def list_artifact_items(
    artifact_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    kind: Annotated[str | None, Query()] = None,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 200,
) -> Page[schemas.Item]:
    """The items of one artifact in outline order (API.md §5)."""
    row = await db.get(ArtifactRow, artifact_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The artifact does not exist.")
    items, next_cursor = await service.list_artifact_items(
        db, artifact_id, kind=kind, limit=limit, cursor=cursor
    )
    return Page(items=items, next_cursor=next_cursor)


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
    """The definition JSON; immutable cache when ?version= pins one (§5).

    API.md: a past run is shown with the definition it ran with — the
    pinned version serves that definition's own file, 404 when the version
    was never published.
    """
    raw: bytes
    headers: dict[str, str] = {}
    if version is None:
        raw = workflow.definition_bytes()
    else:
        headers["Cache-Control"] = "public, max-age=31536000, immutable"
        if version == workflow.WORKFLOW_VERSION:
            raw = workflow.definition_bytes()
        else:
            raw_or_none = workflow.definition_bytes_for(version)
            if raw_or_none is None:
                raise ApiError(404, "not_found", "Not found", "The workflow version does not exist.")
            raw = raw_or_none
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
    if body.content is not None:
        plan_values = await service.plan_values_of(db, UUID(str(row.project_id)))
        errors = service.validate_item_content(str(row.kind), merged, plan_values)
        if errors:
            raise ApiError(
                422,
                "validation_failed",
                "Validation failed",
                "The item content fails its schema or the plan vocabulary.",
                errors=errors,
            )
    row.content_json = jsonlib.dumps(merged, ensure_ascii=False).encode("utf-8")
    if body.review_status is not None:
        row.review_status = body.review_status
    row.version += 1
    await db.flush()
    return await service.get_item(db, item_id)
