"""Export use cases: request a file, generate it, list, read and download it."""

from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from anyio import to_thread
from sqlalchemy import select

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.artifacts import service as artifact_service
from khoailanggraph.features.exports import renderers, schemas
from khoailanggraph.features.exports.models import ExportRow, utcnow
from khoailanggraph.features.projects.models import ProjectRow

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.me.models import UserRow


def _problem(field: str, message: str) -> ApiError:
    return ApiError(
        422,
        "validation_failed",
        "Validation failed",
        "The request has a field that is not valid.",
        errors=[{"field": field, "message": message}],
    )


def export_view(row: ExportRow) -> schemas.Export:
    """An export as the client reads it; a ready one carries the address of its file."""
    return schemas.Export(
        id=str(row.id),
        project_id=str(row.project_id),
        template=row.template,
        format=row.format,
        status=row.status,
        file_name=row.file_name,
        size_bytes=row.size_bytes,
        download_url=f"/api/v1/exports/{row.id}/file" if row.status == "ready" else None,
        requested_by=str(row.requested_by),
        included_artifacts=[
            schemas.ArtifactRef.model_validate(ref)
            for ref in json.loads((row.included_artifacts_json or b"[]").decode("utf-8"))
        ],
        created_at=row.created_at,
    )


def check_request(body: schemas.ExportBody) -> dict[str, Any]:
    """The template of the definition that the request names, when the format is one it lists
    and one that can be generated; otherwise `422 validation_failed` at the field."""
    templates = {str(entry["key"]): entry for entry in wf.DEFINITION["export_templates"]}
    template = templates.get(body.template)
    if template is None:
        raise _problem("template", "Not an export template of the workflow.")
    if body.format not in template["formats"]:
        raise _problem("format", f"This template is exported as {', '.join(template['formats'])}.")
    if body.format not in renderers.SUPPORTED_FORMATS:
        raise _problem("format", "This format is not available yet.")
    return dict(template)


async def _gather(
    session: AsyncSession, project: ProjectRow, template: dict[str, Any]
) -> renderers.ExportData:
    """The documents of the project that a template takes, at their current versions."""
    kinds = set(template["artifact_kinds"])
    artifacts, _next = await artifact_service.list_project_artifacts(
        session, project.id, limit=10_000, cursor=0
    )
    documents = []
    for artifact in artifacts:
        if artifact.kind not in kinds:
            continue
        items, _next = await artifact_service.list_artifact_items(
            session,
            UUID(artifact.id),
            kind=None,
            review_status=None,
            parent_item_id=None,
            limit=10_000,
            cursor=0,
        )
        documents.append(
            renderers.Document(
                artifact=artifact.model_dump(mode="json"),
                items=[item.model_dump(mode="json") for item in items],
            )
        )
    matrix = None
    if template["key"] == "traceability_matrix":
        matrix = (await artifact_service.traceability_matrix(session, project.id)).model_dump()
    return renderers.ExportData(
        project_name=project.name or "Untitled project",
        template_title=str(template["title"]),
        documents=documents,
        matrix=matrix,
    )


async def create_export(
    session: AsyncSession,
    *,
    store: Path,
    project: ProjectRow,
    user: UserRow,
    body: schemas.ExportBody,
) -> ExportRow:
    """Generate the file of a template in a format from the documents of the project, and keep
    the exact versions it holds."""
    template = check_request(body)
    data = await _gather(session, project, template)
    if not data.documents:
        raise ApiError(
            409,
            "invalid_state",
            "Invalid state",
            "The project has no document for this template yet.",
        )
    content = renderers.render(body.template, body.format, data)
    storage_key = f"{uuid4()}.bin"

    def _store() -> None:
        store.mkdir(parents=True, exist_ok=True)
        (store / storage_key).write_bytes(content)

    await to_thread.run_sync(_store)
    row = ExportRow(
        id=uuid4(),
        project_id=project.id,
        requested_by=UUID(str(user.id)),
        template=body.template,
        format=body.format,
        status="ready",
        included_artifacts_json=json.dumps(
            [
                {
                    "artifact_id": str(document.artifact["id"]),
                    "kind": document.artifact["kind"],
                    "title": document.artifact["title"],
                    "version": document.artifact["version"],
                }
                for document in data.documents
            ]
        ).encode("utf-8"),
        file_name=f"{body.template}.{renderers.EXTENSIONS[body.format]}",
        size_bytes=len(content),
        storage_key=storage_key,
    )
    session.add(row)
    await session.flush()
    return row


async def list_exports(
    session: AsyncSession, project_id: UUID, *, cursor: int, limit: int
) -> tuple[list[schemas.Export], int | None]:
    """The exports of a project, newest first."""
    rows = list(
        (
            await session.scalars(
                select(ExportRow)
                .where(ExportRow.project_id == project_id)
                .order_by(ExportRow.created_at.desc(), ExportRow.id)
                .offset(cursor)
                .limit(limit + 1)
            )
        ).all()
    )
    return [export_view(row) for row in rows[:limit]], (
        cursor + limit if len(rows) > limit else None
    )


async def get_export_row(session: AsyncSession, export_id: UUID) -> ExportRow:
    row = await session.get(ExportRow, export_id)
    project = None if row is None else await session.get(ProjectRow, row.project_id)
    if row is None or project is None or project.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The export does not exist.")
    return row


def file_path(store: Path, row: ExportRow) -> Path:
    """Where the file of a ready export is; 404 when it is not ready or is gone."""
    path = None if row.storage_key is None else store / row.storage_key
    if row.status != "ready" or path is None or not path.is_file():
        raise ApiError(404, "not_found", "Not found", "The file of this export is not available.")
    return path


__all__ = ["utcnow"]
