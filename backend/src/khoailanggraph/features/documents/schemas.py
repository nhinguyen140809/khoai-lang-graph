"""Response schemas of the documents endpoints (docs/API.md §5)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentVersion(BaseModel):
    """One stored version; `text` is the plain text the server extracted."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    document_id: UUID
    version: int
    size_bytes: int
    created_at: datetime


class DocumentVersionWithText(DocumentVersion):
    text: str


class Document(BaseModel):
    """The upload a project member manages in the Sources tab."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    project_id: UUID
    title: str
    filename: str
    format: str
    latest_version: int
    created_at: datetime
    updated_at: datetime


class DocumentDetail(Document):
    """A document with its version list and the text of the read version."""

    versions: list[DocumentVersion]
    text: str
