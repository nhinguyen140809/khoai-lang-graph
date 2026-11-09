"""Pydantic shapes of the exports feature."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

from khoailanggraph.platform.serialization import IsoDatetime

ExportStatus = Literal["pending", "ready", "failed"]
ExportFormat = Literal["markdown", "pdf", "docx", "csv", "json"]


class ArtifactRef(BaseModel):
    """An artifact at the version that an export holds."""

    artifact_id: str
    kind: str
    title: str
    version: int


class Export(BaseModel):
    """A file generated from the documents of a project."""

    id: str
    project_id: str
    template: str
    format: ExportFormat
    status: ExportStatus
    file_name: str
    size_bytes: int | None
    download_url: str | None
    requested_by: str
    included_artifacts: list[ArtifactRef]
    created_at: IsoDatetime


class ExportBody(BaseModel):
    """POST /projects/{id}/exports: a template of the definition and one of its formats."""

    model_config = ConfigDict(extra="forbid")

    template: str
    format: str
