"""Structured output models of the version 1 nodes (prompts.md: output models).

An agent returns items and directives — never prose to parse: every response
is one of these Pydantic models, parsed from a structured-output tool call.
New items carry a response-unique `ref`; existing items are referenced by
`key`, only to change lifecycle fields. Trace links are returned as fields
named after link types (keys/refs of targets), and the artifact store turns
them into trace-link rows.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from khoailanggraph.domain.artifacts import ElicitationPlanContent

DEFAULT_QUALITY = None


class _Output(BaseModel):
    model_config = ConfigDict(extra="forbid")


class EvidencedBy(_Output):
    """One interview message a requirement was taken from, with its quote."""

    message: str
    quote: str


class NewPersona(_Output):
    """A persona draft; the system assigns the key and the interview status."""

    ref: str
    name: str
    stakeholder_type: str
    background: str
    expertise: str
    goals: list[str]
    interests: list[str]
    constraints: list[str]
    priorities: list[str]
    concerns: list[str]
    behavioral_tendencies: str


class GeneratorOutput(_Output):
    """The frame of the persona catalog plus its persona items."""

    selection_rationale: str
    uncovered_stakeholder_types: list[str]
    personas: list[NewPersona]


class NewSource(_Output):
    """A curated research document draft; the system assigns the key."""

    ref: str
    title: str
    url: str
    publisher: str
    year: str = ""
    excerpt: str
    text: str = ""
    relevance_reason: str


class CorpusBuilderOutput(_Output):
    """The kept documents of the research corpus, with the reason each was kept."""

    selection_rationale: str
    sources: list[NewSource]


class NewObservation(_Output):
    """One mined stakeholder perspective; the system assigns the key."""

    ref: str
    stakeholder_name: str
    description: str
    dimension: str
    evidence: str
    source: str


class MinerOutput(_Output):
    """The stakeholder observations mined from one source document."""

    observations: list[NewObservation]


class PersonaEvidence(_Output):
    """One research quote a persona was built from: its observation, document, quote."""

    observation: str
    source: str
    quote: str


class NewPersonaV2(_Output):
    """A persona draft grounded in mined observations; the system assigns the key."""

    ref: str
    name: str
    stakeholder_type: str
    evaluative_dimension: str
    grounded_in: list[str] = Field(min_length=1)
    background: str
    expertise: str
    goals: list[str]
    interests: list[str]
    constraints: list[str]
    priorities: list[str]
    concerns: list[str]
    behavioral_tendencies: str
    evidence: list[PersonaEvidence] = Field(min_length=1)


class StakeholderGroup(_Output):
    """One consolidated group of mined observations."""

    ref: str
    name: str
    description: str
    observations: list[str] = Field(min_length=1)


class GeneratorOutputV2(_Output):
    """The frame of the evidence-grounded persona catalog plus its personas."""

    selection_rationale: str
    stakeholder_groups: list[StakeholderGroup]
    uncovered_stakeholder_types: list[str]
    personas: list[NewPersonaV2]


class PlannerOutput(ElicitationPlanContent):
    """The plan content verbatim; the planner produces no items."""


class InterviewerTurnOutput(_Output):
    question: str
    stop: bool = False


class PersonaAnswerOutput(_Output):
    answer: str


class RawRequirementDraft(_Output):
    ref: str
    statement: str
    topic: str | None
    stated_by: str
    evidenced_by: list[EvidencedBy] = Field(min_length=1)
    supersedes: list[str] = Field(default_factory=list)


class AnalyzedRequirementDraft(_Output):
    ref: str
    statement: str
    type: Literal["functional", "non_functional", "constraint"]
    quality_category: str | None = DEFAULT_QUALITY
    priority: str
    rationale: str
    derived_from: list[str] = Field(min_length=1)
    involves: list[str]
    supersedes: list[str] = Field(default_factory=list)


class LatentNeedDraft(_Output):
    ref: str
    description: str
    reasoning: str
    confidence: Literal["low", "medium", "high"]
    disposition: Literal["open", "promoted", "dismissed"] = "open"
    evidenced_by: list[EvidencedBy] = Field(min_length=1)
    involves: list[str]
    supersedes: list[str] = Field(default_factory=list)


class AssumptionDraft(_Output):
    ref: str
    statement: str
    reasoning: str
    impact_if_wrong: str
    validation_status: Literal["unverified", "confirmed", "invalidated"]
    concerns: list[str]
    supersedes: list[str] = Field(default_factory=list)


class AmbiguityIssueDraft(_Output):
    ref: str
    description: str
    ambiguity_type: str
    ambiguous_text: str
    clarifying_question: str
    status: Literal["open", "resolved", "dismissed"]
    resolution: str | None
    concerns: list[str]
    resolved_by: str | None
    supersedes: list[str] = Field(default_factory=list)


class ConflictDraft(_Output):
    ref: str
    description: str
    conflict_type: str
    severity: Literal["low", "medium", "high"]
    proposed_resolutions: list[str]
    status: Literal["open", "resolved", "dismissed"]
    resolution: str | None
    concerns: list[str]
    involves: list[str]
    resolved_by: str | None
    supersedes: list[str] = Field(default_factory=list)


class AnalystOutput(_Output):
    raw_requirements: list[RawRequirementDraft]
    analyzed_requirements: list[AnalyzedRequirementDraft]
    latent_needs: list[LatentNeedDraft]
    assumptions: list[AssumptionDraft]
    ambiguity_issues: list[AmbiguityIssueDraft]
    conflicts: list[ConflictDraft]
    key_findings: list[str]
    open_questions: list[str]


class Definition(_Output):
    term: str
    definition: str


class NewSpecRequirement(_Output):
    ref: str
    title: str
    statement: str
    type: Literal["functional", "non_functional", "constraint"]
    quality_category: str | None = DEFAULT_QUALITY
    priority: str
    rationale: str
    acceptance_criteria: list[str]
    fit_criterion: str | None
    verification_method: Literal["test", "inspection", "demonstration", "analysis"]
    derived_from: list[str] = Field(min_length=1)
    depends_on: list[str]
    supersedes: list[str] = Field(default_factory=list)


class EngineerOutput(_Output):
    """The frame of the specification plus its requirement items."""

    purpose: str
    scope: str
    out_of_scope: list[str]
    definitions: list[Definition]
    requirements: list[NewSpecRequirement]


class NewBacklogItem(_Output):
    ref: str
    item_type: Literal["epic", "user_story"]
    title: str
    as_a: str | None
    i_want: str | None
    so_that: str | None
    acceptance_criteria: list[dict[str, str]]
    priority: str
    story_points: int | None
    derived_from: list[str] = Field(min_length=1)
    depends_on: list[str]
    supersedes: list[str] = Field(default_factory=list)


class BacklogOutput(_Output):
    """The frame of the backlog plus its items, in backlog order."""

    product_goal: str
    prioritization_notes: str | None
    items: list[NewBacklogItem]


class ValidationIssueDraft(_Output):
    ref: str
    category: str
    severity: Literal["low", "medium", "high"]
    description: str
    suggestion: str | None
    flags: list[str]


class ValidatorOutput(_Output):
    status: Literal["pass", "fail"]
    issues: list[ValidationIssueDraft]


ROUTER_TARGETS = Literal[
    "planner", "interviewer", "analyst", "requirement_engineer", "backlog_manager"
]


class IntentDirectiveOutput(_Output):
    target_node: ROUTER_TARGETS
    instruction: str
    about: list[str]
