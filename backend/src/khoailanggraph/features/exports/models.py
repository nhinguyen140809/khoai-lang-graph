"""The exports of a project: a file generated from its documents, for download."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from khoailanggraph.platform.db import Base


def utcnow() -> datetime:
    """UTC timestamp for every row this feature writes."""
    return datetime.now(UTC)


class ExportRow(Base):
    __tablename__ = "exports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), nullable=False, index=True
    )
    requested_by: Mapped[uuid.UUID] = mapped_column(Uuid(), ForeignKey("users.id"), nullable=False)
    template: Mapped[str] = mapped_column(String, nullable=False)
    format: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending", nullable=False)
    included_artifacts_json: Mapped[bytes] = mapped_column(default=b"[]", nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_key: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


__all__ = ["ExportRow"]
