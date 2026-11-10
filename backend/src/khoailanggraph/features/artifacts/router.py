"""Artifact routes: items search, kinds, definition, models (§5, mock parity)."""

from __future__ import annotations

import json as jsonlib
from datetime import UTC, datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

from khoailanggraph.agents.requirements_engineering import definition as workflow
from khoailanggraph.api import deps
from khoailanggraph.api.errors import ApiError
from khoailanggraph.api.schemas import MAX_LIMIT, Cursor, Page
from khoailanggraph.features.artifacts import editing, schemas, service
from khoailanggraph.features.artifacts.models import ArtifactItemRow, ArtifactRow, TraceLinkRow
from khoailanggraph.features.projects.service import get_project_row
from khoailanggraph.llm.registry import ModelCatalogEntry, default_registry
from khoailanggraph.platform import origin as origins
from khoailanggraph.platform.origin import Origin

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
    run_id: Annotated[UUID | None, Query()] = None,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Item]:
    """Search the items of a project by key or text, with the filters of
    docs/API.md §5: `kind`, `review_status` and `run_id` (the items that run created or changed)."""
    await get_project_row(db, project_id)
    items, next_cursor = await service.search_project_items(
        db,
        project_id,
        query=q,
        kind=kind,
        review_status=review_status,
        run_id=run_id,
        limit=limit,
        cursor=cursor,
    )
    return Page(items=items, next_cursor=next_cursor)


@router.get("/projects/{project_id}/artifacts")
async def list_project_artifacts(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    kind: Annotated[str | None, Query()] = None,
    review_status: Annotated[str | None, Query()] = None,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Artifact]:
    """The artifacts of the project (§5), filtered by kind and review status."""
    await get_project_row(db, project_id)
    artifacts, next_cursor = await service.list_project_artifacts(
        db, project_id, kind=kind, review_status=review_status, limit=limit, cursor=cursor
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
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 200,
) -> Page[schemas.TraceLink]:
    """Current links of the project, both ends resolved (API.md §5); the
    optional filters keep one link type or one link end."""
    await get_project_row(db, project_id)
    links, _all_fetched = await service.list_project_links(db, project_id, limit=10_000, cursor=0)
    if link_type is not None:
        links = [link for link in links if link.link_type == link_type]
    if source_item_id is not None:
        links = [link for link in links if link.source_item_id == str(source_item_id)]
    if target_item_id is not None:
        links = [link for link in links if link.target_item_id == str(target_item_id)]
    window = links[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(links) else None
    return Page(items=window, next_cursor=next_cursor)


@router.get("/projects/{project_id}/traceability/matrix")
async def traceability_matrix(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.Matrix:
    """Rows of `derived_from` chains from the top of the derivation down to the interview;
    the columns come from the workflow definition (API.md)."""
    await get_project_row(db, project_id)
    return await service.traceability_matrix(db, project_id)


@router.get("/projects/{project_id}/traceability/coverage", response_model_exclude_none=True)
async def traceability_coverage(
    project_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.Coverage:
    """The items that need attention (API.md): requirements with no user story, requirements
    with no source, and items whose links to a changed target need a check."""
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
    depth: Annotated[int, Query(ge=1, le=100)] = 5,
) -> schemas.Trace:
    """The chain of one item: the items found and the links between them, walked `depth`
    links backward (where it came from), forward (what was built from it) or both."""
    return await service.item_trace(db, item_id, direction=direction, depth=depth)


@router.get("/artifacts/{artifact_id}/trace")
async def artifact_trace(
    artifact_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    direction: Annotated[str, Query()] = "both",
    depth: Annotated[int | None, Query(ge=1, le=100)] = None,
) -> schemas.Trace:
    """The chains of all the items of one artifact, from the interview to the backlog, in one
    answer; without `depth` a chain goes to its end."""
    return await service.artifact_trace(db, artifact_id, direction=direction, depth=depth)


@router.get("/artifacts/{artifact_id}/items")
async def list_artifact_items(
    artifact_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    *,
    kind: Annotated[str | None, Query()] = None,
    review_status: Annotated[str | None, Query()] = None,
    parent_item_id: Annotated[UUID | None, Query()] = None,
    shape: Annotated[Literal["flat", "tree"], Query()] = "flat",
    version: Annotated[int | None, Query(ge=1)] = None,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 200,
) -> Page[schemas.NestedOutlineItem] | Page[schemas.OutlineItem]:
    """The items of one artifact in outline order; `?shape=tree` nests each item under its
    parent (API.md §5)."""
    row = await db.get(ArtifactRow, artifact_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The artifact does not exist.")
    items, next_cursor = await service.list_artifact_items(
        db,
        artifact_id,
        kind=kind,
        review_status=review_status,
        parent_item_id=parent_item_id,
        version=version,
        limit=limit,
        cursor=cursor,
    )
    if shape == "tree":
        return Page(items=service.nested_outline(items), next_cursor=next_cursor)
    return Page(items=items, next_cursor=next_cursor)


@router.get("/artifacts/{artifact_id}")
async def get_artifact(
    artifact_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    version: Annotated[int | None, Query(ge=1)] = None,
) -> schemas.Artifact:
    """One artifact; `?version=` reads any stored version (§5)."""
    return await service.get_artifact(db, artifact_id, version)


@router.get("/items/{item_id}")
async def get_item(
    item_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    version: Annotated[int | None, Query(ge=1)] = None,
) -> schemas.Item:
    """One item; `?version=` reads any stored version (§5)."""
    return await service.get_item(db, item_id, version)


@router.get("/artifact-kinds")
async def list_artifact_kinds(
    user: deps.CurrentUser,
) -> Any:
    """The kinds + schemas of the version-1 definition (mock parity)."""
    return service.artifact_kinds_response(workflow)


@router.get("/content-schemas/{kind}/{schema_version}")
async def get_content_schema(
    kind: str,
    schema_version: int,
    user: deps.CurrentUser,
) -> JSONResponse:
    """The content schema of one artifact kind or item kind at one version: to show a document
    stored with an older version. It never changes, so it can be cached for ever."""
    schema = service.content_schema_at(workflow, kind, schema_version)
    return JSONResponse(
        content=schema, headers={"Cache-Control": "public, max-age=31536000, immutable"}
    )


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
                raise ApiError(
                    404, "not_found", "Not found", "The workflow version does not exist."
                )
            raw = raw_or_none
    return JSONResponse(content=jsonlib.loads(raw.decode("utf-8")), headers=headers)


@router.get("/models")
async def list_models(
    user: deps.CurrentUser,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[ModelCatalogEntry]:
    """The models a user may pick, ordered by `model_id` (§5)."""
    catalog = default_registry().catalog(list(workflow.agent_roles()))
    window = catalog[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(catalog) else None
    return Page(items=window, next_cursor=next_cursor)


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
    """Edit an item (§5): `If-Match` with another version answers 409; an item takes changes
    only while a review that allows edits waits for the user (409 invalid_state)."""
    current = await service.get_item(db, item_id)
    row = await db.get(ArtifactItemRow, item_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    await editing.ensure_editable(db, await _artifact_of(db, row))
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
    by = Origin.of_user(UUID(str(user.id)))
    row.content_json = jsonlib.dumps(merged, ensure_ascii=False).encode("utf-8")
    if body.review_status is not None:
        row.review_status = body.review_status
    row.version += 1
    origins.write(row, "updated", by)
    row.updated_at = datetime.now(UTC)
    await db.flush()
    db.add(service.item_revision_row(row, "user_edit", by))
    await db.flush()
    artifact = await db.get(ArtifactRow, row.artifact_id)
    if artifact is not None:
        await db.run_sync(lambda session: service.bump_artifact(session, artifact, "user_edit", by))
    return await service.get_item(db, item_id)


async def _artifact_of(db: deps.DbSession, item: ArtifactItemRow) -> ArtifactRow:
    artifact = await db.get(ArtifactRow, item.artifact_id)
    if artifact is None or artifact.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The artifact does not exist.")
    return artifact


def _by(user: Any) -> Origin:
    return Origin.of_user(UUID(str(user.id)))


@router.patch("/artifacts/{artifact_id}")
async def patch_artifact(
    artifact_id: UUID,
    body: schemas.ArtifactPatch,
    user: deps.CurrentUser,
    db: deps.DbSession,
    if_match: Annotated[str | None, Header()] = None,
    _origin: Annotated[None, Depends(deps.check_origin)] = None,
) -> schemas.Artifact:
    """Change the title, summary, content or review status of an artifact."""
    artifact = await db.get(ArtifactRow, artifact_id)
    if artifact is None or artifact.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The artifact does not exist.")
    await editing.ensure_editable(db, artifact)
    fields = {key: getattr(body, key) for key in body.model_fields_set}
    by = _by(user)
    await db.run_sync(
        lambda session: editing.patch_artifact(
            session, artifact_id, fields=fields, if_match=if_match, by=by
        )
    )
    return await service.get_artifact(db, artifact_id)


@router.get("/artifacts/{artifact_id}/revisions")
async def list_artifact_revisions(
    artifact_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> Page[schemas.ArtifactRevision]:
    """The versions of an artifact, newest first, each with its content."""
    return Page(items=await service.artifact_revisions(db, artifact_id), next_cursor=None)


@router.post("/artifacts/{artifact_id}/restore")
async def restore_artifact(
    artifact_id: UUID,
    body: schemas.RestoreBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Artifact:
    """Make an old version of the artifact and of its items current again, as new versions."""
    artifact = await db.get(ArtifactRow, artifact_id)
    if artifact is None or artifact.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The artifact does not exist.")
    await editing.ensure_editable(db, artifact)
    by = _by(user)
    await db.run_sync(
        lambda session: editing.restore_artifact(session, artifact_id, body.version, by)
    )
    return await service.get_artifact(db, artifact_id)


@router.post("/artifacts/{artifact_id}/items", status_code=201)
async def create_item(
    artifact_id: UUID,
    body: schemas.CreateItemBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    response: Response,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Item:
    """Create an item or a section by hand; the server gives it its key and puts it last under
    its parent."""
    artifact = await db.get(ArtifactRow, artifact_id)
    if artifact is None or artifact.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The artifact does not exist.")
    await editing.ensure_editable(db, artifact)
    by = _by(user)
    row = await db.run_sync(
        lambda session: editing.create_item(
            session,
            artifact_id,
            kind=body.kind,
            content=body.content,
            parent_item_id=body.parent_item_id,
            by=by,
        )
    )
    response.headers["Location"] = f"/api/v1/items/{row.id}"
    return await service.get_item(db, row.id)


@router.post("/artifacts/{artifact_id}/items/reorder", status_code=204)
async def reorder_items(
    artifact_id: UUID,
    body: schemas.ReorderBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Response:
    """Change the order of the items under one parent."""
    artifact = await db.get(ArtifactRow, artifact_id)
    if artifact is None or artifact.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The artifact does not exist.")
    await editing.ensure_editable(db, artifact)
    by = _by(user)
    await db.run_sync(
        lambda session: editing.reorder_items(
            session, artifact_id, parent_item_id=body.parent_item_id, ids=body.ids, by=by
        )
    )
    return Response(status_code=204)


@router.delete("/items/{item_id}", status_code=204)
async def delete_item(
    item_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Response:
    """Soft delete an item: it leaves the lists and its versions stay readable."""
    item = await db.get(ArtifactItemRow, item_id)
    if item is None or item.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    await editing.ensure_editable(db, await _artifact_of(db, item))
    by = _by(user)
    await db.run_sync(lambda session: editing.delete_item(session, item_id, by))
    return Response(status_code=204)


@router.post("/items/{item_id}/move")
async def move_item(
    item_id: UUID,
    body: schemas.MoveBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Item:
    """Move an item, with everything inside it, under another parent of the same artifact."""
    item = await db.get(ArtifactItemRow, item_id)
    if item is None or item.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    await editing.ensure_editable(db, await _artifact_of(db, item))
    by = _by(user)
    await db.run_sync(
        lambda session: editing.move_item(
            session,
            item_id,
            parent_item_id=body.parent_item_id,
            position=body.position,
            by=by,
        )
    )
    return await service.get_item(db, item_id)


@router.post("/items/{item_id}/restore")
async def restore_item(
    item_id: UUID,
    body: schemas.RestoreBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Item:
    """Make an old version of an item current again; it also brings back a deleted item."""
    item = await db.get(ArtifactItemRow, item_id)
    if item is None:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    await editing.ensure_editable(db, await _artifact_of(db, item))
    by = _by(user)
    await db.run_sync(lambda session: editing.restore_item(session, item_id, body.version, by))
    return await service.get_item(db, item_id)


@router.post("/projects/{project_id}/trace-links", status_code=201)
async def create_trace_link(
    project_id: UUID,
    body: schemas.CreateLinkBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    response: Response,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.TraceLink:
    """Create a link by hand. A link is a statement about its source, so it is made only while
    the document of the source takes changes."""
    await get_project_row(db, project_id)
    source = await db.get(ArtifactItemRow, body.source_item_id)
    if source is None or source.deleted_at is not None or source.project_id != project_id:
        raise ApiError(404, "not_found", "Not found", "The item does not exist.")
    await editing.ensure_editable(db, await _artifact_of(db, source))
    link = await db.run_sync(
        lambda session: editing.create_link(
            session,
            project_id,
            source_item_id=body.source_item_id,
            target_item_id=body.target_item_id,
            link_type=body.link_type,
            note=body.note,
            source_quote=body.source_quote,
            target_quote=body.target_quote,
        )
    )
    response.headers["Location"] = f"/api/v1/trace-links/{link.id}"
    return service.link_view(link)


@router.delete("/trace-links/{link_id}", status_code=204)
async def delete_trace_link(
    link_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Response:
    """Remove a link; it keeps its row, so earlier steps can show it again."""
    link = await db.get(TraceLinkRow, link_id)
    if link is None or link.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The link does not exist.")
    source = await db.get(ArtifactItemRow, link.source_item_id)
    if source is not None:
        await editing.ensure_editable(db, await _artifact_of(db, source))
    await db.run_sync(lambda session: editing.delete_link(session, link_id))
    return Response(status_code=204)
