"""Pydantic shapes of the runs feature (§5, contract parity)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel

from khoailanggraph.platform.serialization import IsoDatetime

RunStatus = Literal["queued", "running", "interrupted", "succeeded", "failed", "cancelled"]


class Usage(BaseModel):
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_write_tokens: int
    cost_usd: float
    duration_ms: int


class RunConfig(BaseModel):
    models: dict[str, str]
    review_checkpoints: list[str]
    output_language: Literal["en", "vi"]
    max_steps: int
    max_cost_usd: float | None
    parameters: dict[str, Any]


class RunError(BaseModel):
    code: str
    message: str
    stage: str


class ItemRef(BaseModel):
    item_id: str
    kind: str
    key: str
    version: int


class RunStep(BaseModel):
    id: str
    run_id: str
    sequence: int
    node: str
    agent_role: str | None
    stage: str
    status: Literal["running", "succeeded", "failed", "skipped"]
    iteration: int
    subject_item_id: str | None
    model_id: str | None
    llm_calls: int
    usage: Usage
    produced: list[ItemRef]
    error: str | None
    started_at: IsoDatetime
    finished_at: IsoDatetime | None


class Run(BaseModel):
    id: str
    thread_id: str
    project_id: str
    number: int
    started_by: str
    workflow_name: str
    workflow_version: int
    status: RunStatus
    current_stage: str
    iteration_count: int
    run_config: RunConfig
    retry_of_run_id: str | None
    error: RunError | None
    usage: Usage
    trace_id: str | None
    step_count: int
    last_event_id: int
    started_at: IsoDatetime | None
    finished_at: IsoDatetime | None


class Message(BaseModel):
    id: str
    thread_id: str
    sequence: int
    run_id: str | None
    author: str
    agent_role: str | None
    content: str
    delivery: Literal["started_run", "pending", "delivered", "undelivered"] | None
    delivered_in_step_id: str | None
    created_at: IsoDatetime


class SendMessageResponse(BaseModel):
    message: Message
    run: Run
