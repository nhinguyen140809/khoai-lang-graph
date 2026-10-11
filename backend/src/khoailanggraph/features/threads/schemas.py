"""Pydantic shapes of the threads feature (frontend Zod contracts §5)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict

from khoailanggraph.platform.serialization import IsoDatetime

ThreadStatus = Literal["active", "archived"]
ActiveRunStatus = Literal["queued", "running", "interrupted"]


class ThreadSummary(BaseModel):
    """The shape of every thread row the FE reads (mock parity)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    project_id: str
    created_by: str
    title: str | None
    status: ThreadStatus
    current_stage: str | None
    active_run_id: str | None
    active_run_status: ActiveRunStatus | None
    last_message_at: IsoDatetime
    created_at: IsoDatetime
    updated_at: IsoDatetime
