"""Projects and their key counters (dbml workspace group)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from khoailanggraph.platform.db import Base


def utcnow() -> datetime:
    """UTC timestamp for every row this feature writes."""
    return datetime.now(UTC)


class ProjectRow(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active", nullable=False)
    output_language: Mapped[str] = mapped_column(String, default="en", nullable=False)
    run_config_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    model_overrides_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    initial_message_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ProjectKeyCounterRow(Base):
    """The running numbers of every key prefix, unique per project (§2.3)."""

    __tablename__ = "project_key_counters"

    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), primary_key=True
    )
    prefix: Mapped[str] = mapped_column(String, primary_key=True)
    last_number: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


__all__ = [
    "ProjectKeyCounterRow",
    "ProjectRow",
]
