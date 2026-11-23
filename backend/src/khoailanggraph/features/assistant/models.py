"""The assistant's own bookkeeping: what each classified message cost.

The assistant calls a model before any run exists, so its spend cannot live on a run step. One row
per message keeps it visible to the usage view and to the budget gate, which otherwise count only
the work of runs.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from khoailanggraph.platform.db import Base


def _now() -> datetime:
    return datetime.now(UTC)


class AssistantTurnRow(Base):
    """One message the assistant looked at: its kind, the model, and what the call cost."""

    __tablename__ = "assistant_turns"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), nullable=False, index=True
    )
    thread_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("threads.id"), nullable=False, index=True
    )
    # Which way the message went: "workflow" or "general".
    kind: Mapped[str] = mapped_column(String, nullable=False)
    model_id: Mapped[str] = mapped_column(String, nullable=False)
    usage_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now, nullable=False)
