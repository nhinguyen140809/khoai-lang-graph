"""Pydantic shapes of the projects feature (frontend Zod contracts §5)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from khoailanggraph.platform.serialization import IsoDatetime

OutputLanguage = Literal["en", "vi"]
ProjectStatus = Literal["active", "archived"]
RunStatus = Literal["queued", "running", "interrupted", "succeeded", "failed", "cancelled"]


class RunDefaults(BaseModel):
    """Any subset; null means 'not set' (frontend contracts.types)."""

    model_config = ConfigDict(extra="forbid")

    review_checkpoints: list[str] | None = None
    max_steps: int | None = None
    max_cost_usd: float | None = None
    parameters: dict[str, object] | None = None


class UnfinishedRunCounts(BaseModel):
    model_config = ConfigDict(extra="forbid")

    queued: int
    running: int
    interrupted: int


class ProjectSummary(BaseModel):
    """The row shape of GET /projects (mock parity)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    owner_id: str
    name: str | None
    description: str | None
    status: ProjectStatus
    output_language: OutputLanguage
    run_config: RunDefaults
    initial_message_id: str | None
    model_overrides: dict[str, str]
    item_counts: dict[str, int]
    unfinished_run_counts: UnfinishedRunCounts
    rollup_run_status: RunStatus | None
    last_activity_at: IsoDatetime
    created_at: IsoDatetime
    updated_at: IsoDatetime


class ProjectBody(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None)
    description: str | None = None
    output_language: OutputLanguage | None = None


class ProjectPatch(BaseModel):
    """PATCH /projects/{id}: the fields to change; a field left out keeps its value."""

    model_config = ConfigDict(extra="forbid")

    name: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    run_config: RunDefaults | None = None
    model_overrides: dict[str, str] | None = None
