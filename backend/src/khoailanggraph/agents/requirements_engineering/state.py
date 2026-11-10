"""The workflow state of the requirements engineering graph (v1 state_schema).

The state keeps *references*, not copies: every artifact and item appears at
the version the step used, as an ArtifactRef or ItemRef; the content lives in
the artifact store, and a version is never rewritten, so any saved checkpoint
stays readable. Pending messages are NOT part of the state (runtime.md: the
executor hands them to the intent router through the config). The runtime
channels the executor and the conditional edges share beyond the 26 schema
fields: `first_run` (the entry routing §2.1), the analyst's and the
validator's verdicts of the latest pass, the resolved checkpoint outcomes and
the run's routed target, so the edges stay pure functions of the state.
"""

from __future__ import annotations

import operator
from typing import Annotated, TypedDict


class ItemRef(TypedDict):
    item_id: str
    kind: str
    key: str
    version: int


class ArtifactRef(TypedDict):
    artifact_id: str
    kind: str
    title: str
    version: int


class RunError(TypedDict):
    code: str
    message: str
    stage: str


class CheckpointOutcome(TypedDict):
    """Which option (and feedback) a checkpoint resolved with, in this run."""

    node: str
    option: str
    feedback: str
    # True when the checkpoint was not in `review_checkpoints` and took its default option.
    automatic: bool


class REState(TypedDict):
    """The 26 schema fields of `state_schema`, plus the runtime channels."""

    # — run inputs, set before the graph runs and never rewritten —
    project_id: str
    initial_intent: str
    run_config: dict[str, object]
    first_run: bool

    # — artifact references, at the version the run produced them —
    elicitation_plan: ArtifactRef | None
    research_corpus: ArtifactRef | None
    observations: list[ItemRef]
    personas: list[ItemRef]
    interview_transcripts: list[ArtifactRef]
    raw_requirements: list[ItemRef]
    analyzed_requirements: list[ItemRef]
    latent_needs: list[ItemRef]
    assumptions: list[ItemRef]
    ambiguities: list[ItemRef]
    conflicts: list[ItemRef]
    requirement_specification: list[ItemRef]
    product_backlog: list[ItemRef]
    validation_report: ArtifactRef | None

    # — human review and rework, as ids the features layer records —
    human_feedback: Annotated[list[str], operator.add]
    rework_directives: Annotated[list[str], operator.add]
    checkpoint_outcomes: Annotated[list[CheckpointOutcome], operator.add]

    # — routing channels the conditional edges read (single-run scope) —
    # The verdict of the latest analyst pass; a still-failed rework needs more
    # interviews ("needs_interviews") and reworks them through the control node.
    response_analyst_status: str
    # The verdict of the latest validator pass: pass | fail.
    response_validator_status: str
    # Where the intent router routed this round (§2.1's five targets).
    routed_target: str

    # — runtime channels of the executor, not part of the workflow state it shows —
    # The node that a walk begins at (a resume or a retry) instead of the entry rule.
    start_at: str
    # The review a checkpoint hands to the executor when it pauses the run.
    interrupt_payload: dict[str, object] | None

    # — run bookkeeping —
    active_persona_index: int
    interview_turn: int
    interviewer_stop: bool
    iteration_count: int
    current_stage: str
    status: str
    error: RunError | None


def make_initial_state(
    project_id: str,
    initial_intent: str,
    run_config: dict[str, object],
    *,
    first_run: bool,
) -> REState:
    """The state a first graph invocation receives; every key is present."""
    return REState(
        project_id=project_id,
        initial_intent=initial_intent,
        run_config=run_config,
        first_run=first_run,
        elicitation_plan=None,
        research_corpus=None,
        observations=[],
        personas=[],
        interview_transcripts=[],
        raw_requirements=[],
        analyzed_requirements=[],
        latent_needs=[],
        assumptions=[],
        ambiguities=[],
        conflicts=[],
        requirement_specification=[],
        product_backlog=[],
        validation_report=None,
        human_feedback=[],
        rework_directives=[],
        checkpoint_outcomes=[],
        response_analyst_status="",
        response_validator_status="",
        routed_target="",
        start_at="",
        interrupt_payload=None,
        active_persona_index=0,
        interview_turn=0,
        interviewer_stop=False,
        iteration_count=0,
        current_stage="intent_routing",
        status="running",
        error=None,
    )
