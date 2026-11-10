"""Threads and messages (dbml conversation group)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from khoailanggraph.platform.db import Base


def utcnow() -> datetime:
    """UTC timestamp for every row this feature writes."""
    return datetime.now(UTC)


class ThreadRow(Base):
    __tablename__ = "threads"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), nullable=False, index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(Uuid(), ForeignKey("users.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="active", nullable=False)
    current_stage: Mapped[str | None] = mapped_column(String, nullable=True)
    active_run_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(), nullable=True, unique=True)
    last_message_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class MessageRow(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    thread_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("threads.id"), nullable=False, index=True
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    run_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True, index=True)
    author: Mapped[str] = mapped_column(String, nullable=False)
    agent_role: Mapped[str | None] = mapped_column(String, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    delivery: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    delivered_in_step_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    artifact_refs_json: Mapped[bytes] = mapped_column(default=b"[]", nullable=False)
    item_refs_json: Mapped[bytes] = mapped_column(default=b"[]", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


__all__ = [
    "MessageRow",
    "ThreadRow",
]
