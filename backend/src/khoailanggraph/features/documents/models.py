"""Source documents and their versions (docs/DATA_SHAPE: SourceDocument).

A document is the identity: the current title, format and latest version
number. Every upload appends one version row — the size, the plain text the
server extracted, and the server-only storage key of the bytes; a version is
never edited in place, exactly like an artifact revision.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from khoailanggraph.platform.db import Base


def utcnow() -> datetime:
    """UTC timestamp for every row this feature writes."""
    return datetime.now(UTC)


class SourceDocumentRow(Base):
    """The identity of one uploaded research document."""

    __tablename__ = "source_documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    format: Mapped[str] = mapped_column(String, nullable=False)
    latest_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class DocumentVersionRow(Base):
    """One stored version: the bytes on disk plus the extracted plain text.

    `storage_key` is `server-only` (docs/API.md §3): it names where the raw
    bytes live and never appears in a response.
    """

    __tablename__ = "document_versions"
    __table_args__ = (UniqueConstraint("document_id", "version"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("source_documents.id"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    text_extract: Mapped[str] = mapped_column(Text, nullable=False)
    storage_key: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
