"""Runs, steps, events, interrupts and decisions (dbml execution group).

The durable event log lives on `run_events`: the workflow writes into it and
the stream endpoint reads from it, so the graph never writes into an HTTP
response (API.md §6). Steps record every node execution with usage and the
items it produced; interrupts carry the checkpoint options of the definition
version the run froze.
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


class RunRow(Base):
    __tablename__ = "runs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    thread_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("threads.id"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("projects.id"), nullable=False, index=True
    )
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    started_by: Mapped[uuid.UUID] = mapped_column(Uuid(), ForeignKey("users.id"), nullable=False)
    workflow_name: Mapped[str] = mapped_column(String, nullable=False)
    workflow_version: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String, default="queued", nullable=False, index=True)
    current_stage: Mapped[str] = mapped_column(String, nullable=False)
    iteration_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    run_config_json: Mapped[bytes] = mapped_column(nullable=False)
    retry_of_run_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    error_code: Mapped[str | None] = mapped_column(String, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_stage: Mapped[str | None] = mapped_column(String, nullable=True)
    usage_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    trace_id: Mapped[str | None] = mapped_column(String, nullable=True)
    step_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_event_id: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    input_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class RunStepRow(Base):
    __tablename__ = "run_steps"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("runs.id"), nullable=False, index=True
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    node: Mapped[str] = mapped_column(String, nullable=False)
    agent_role: Mapped[str | None] = mapped_column(String, nullable=True)
    stage: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    iteration: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    subject_item_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    model_id: Mapped[str | None] = mapped_column(String, nullable=True)
    llm_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    usage_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    produced_json: Mapped[bytes] = mapped_column(default=b"[]", nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class RunEventRow(Base):
    __tablename__ = "run_events"

    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("runs.id"), primary_key=True, index=True
    )
    sequence: Mapped[int] = mapped_column(Integer, primary_key=True)
    step_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    data_json: Mapped[bytes] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, nullable=False, index=True
    )


class InterruptRow(Base):
    __tablename__ = "interrupts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("runs.id"), nullable=False, index=True
    )
    step_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    node: Mapped[str] = mapped_column(String, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    options_json: Mapped[bytes] = mapped_column(default=b"[]", nullable=False)
    questions_json: Mapped[bytes] = mapped_column(default=b"[]", nullable=False)
    allow_edits: Mapped[bool] = mapped_column(nullable=False, default=False)
    artifacts_json: Mapped[bytes] = mapped_column(default=b"[]", nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class HumanDecisionRow(Base):
    __tablename__ = "human_decisions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    interrupt_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("interrupts.id"), nullable=False, unique=True
    )
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("runs.id"), nullable=False, index=True
    )
    decided_by: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    option: Mapped[str | None] = mapped_column(String, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    answers_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class DirectiveRow(Base):
    __tablename__ = "directives"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("runs.id"), nullable=False, index=True
    )
    kind: Mapped[str] = mapped_column(String, nullable=False)
    issued_by_step_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    human_decision_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    target_node: Mapped[str] = mapped_column(String, nullable=False)
    iteration: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    instruction: Mapped[str] = mapped_column(Text, nullable=False)
    details_json: Mapped[bytes] = mapped_column(default=b"{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


__all__ = [
    "DirectiveRow",
    "HumanDecisionRow",
    "InterruptRow",
    "RunEventRow",
    "RunRow",
    "RunStepRow",
]
