"""Artifacts, items, revisions and trace links (dbml artifacts group).

The workflow and the artifact feature write through the same domain rules
(ports.py); these tables keep only references and content JSON. Revisions
append (never rewritten) with the origin and reason of every change.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from khoailanggraph.platform.db import Base


def utcnow() -> datetime:
    """UTC timestamp for every row this feature writes."""
    return datetime.now(UTC)


class ArtifactRow(Base):
    __tablename__ = "artifacts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), nullable=False, index=True
    )
    kind: Mapped[str] = mapped_column(String, nullable=False, index=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    schema_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    content_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    subject_item_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    review_status: Mapped[str] = mapped_column(String, default="draft", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ArtifactItemRow(Base):
    __tablename__ = "artifact_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    artifact_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("artifacts.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), nullable=False, index=True
    )
    kind: Mapped[str] = mapped_column(String, nullable=False, index=True)
    key: Mapped[str] = mapped_column(String, nullable=False, index=True)
    parent_item_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    schema_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    content_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    review_status: Mapped[str] = mapped_column(String, default="draft", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ArtifactRevisionRow(Base):
    __tablename__ = "artifact_revisions"

    artifact_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("artifacts.id"), primary_key=True
    )
    version: Mapped[int] = mapped_column(Integer, primary_key=True)
    snapshot_json: Mapped[bytes] = mapped_column(nullable=False)
    item_versions_json: Mapped[bytes] = mapped_column(nullable=False)
    change_reason: Mapped[str] = mapped_column(String, default="generated", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, nullable=False, index=True
    )


class ItemRevisionRow(Base):
    __tablename__ = "item_revisions"

    item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("artifact_items.id"), primary_key=True
    )
    version: Mapped[int] = mapped_column(Integer, primary_key=True)
    snapshot_json: Mapped[bytes] = mapped_column(nullable=False)
    change_reason: Mapped[str] = mapped_column(String, default="generated", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, nullable=False, index=True
    )


class TraceLinkRow(Base):
    __tablename__ = "trace_links"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), nullable=False, index=True
    )
    link_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    source_item_id: Mapped[uuid.UUID] = mapped_column(Uuid(), nullable=False, index=True)
    target_item_id: Mapped[uuid.UUID] = mapped_column(Uuid(), nullable=False, index=True)
    target_version: Mapped[int] = mapped_column(Integer, nullable=False)
    quote: Mapped[str | None] = mapped_column(Text, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_run_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    created_by_step_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


__all__ = [
    "ArtifactItemRow",
    "ArtifactRevisionRow",
    "ArtifactRow",
    "ItemRevisionRow",
    "TraceLinkRow",
]
