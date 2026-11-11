"""Pydantic shapes of the runs feature (§5, contract parity)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel

from khoailanggraph.platform.serialization import IsoDatetime

InterruptStatus = Literal["pending", "resolved", "cancelled"]
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


class StepNote(BaseModel):
    """A short note of a step to the user, in Markdown."""

    kind: Literal["doing", "finding", "thinking"]
    text: str
    created_at: IsoDatetime


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
    notes: list[StepNote]
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


class ArtifactRef(BaseModel):
    artifact_id: str
    kind: str
    title: str
    version: int


class Message(BaseModel):
    id: str
    thread_id: str
    sequence: int
    run_id: str | None
    author: Literal["user", "agent", "system"]
    agent_role: str | None
    content: str
    artifact_refs: list[ArtifactRef]
    item_refs: list[ItemRef]
    delivery: Literal["started_run", "pending", "delivered", "undelivered"] | None
    delivered_in_step_id: str | None
    created_at: IsoDatetime


class SendMessageResponse(BaseModel):
    message: Message
    run: Run


class InterruptDecision(BaseModel):
    """The human decision that resolved an interrupt."""

    option: str | None
    feedback: str | None
    answers: dict[str, Any]
    decided_by: str | None
    decided_at: IsoDatetime


class Interrupt(BaseModel):
    """A pause of a run, with its options and questions and, once resolved, the decision that
    resolved it. A `review` asks the user to look at documents and approve them or ask for changes;
    an `ask` puts questions of the agent to the user, with no document under review."""

    id: str
    run_id: str
    step_id: str | None
    node: str
    purpose: Literal["review", "ask"]
    prompt: str
    options: list[dict[str, Any]]
    questions: list[dict[str, Any]]
    allow_edits: bool
    review_artifacts: list[ArtifactRef]
    status: InterruptStatus
    created_at: IsoDatetime
    resolved_at: IsoDatetime | None
    decision: InterruptDecision | None


class DirectiveItem(BaseModel):
    """An item a directive refers to, and what it is to the directive."""

    item: ItemRef
    role: str


class Directive(BaseModel):
    """An instruction that one part of the workflow gives to another: to interview some
    personas again, or to act on a message of the user."""

    id: str
    run_id: str
    kind: str
    issued_by_step_id: str | None
    human_decision_id: str | None
    target_node: str
    iteration: int
    instruction: str
    items: list[DirectiveItem]
    details: dict[str, Any]
    created_at: IsoDatetime


class RunState(BaseModel):
    """The values of the workflow state after a step of a run."""

    run_id: str
    step_id: str | None
    workflow_version: int
    values: dict[str, Any]
