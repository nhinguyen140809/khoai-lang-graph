"""Structured output models of the version 1 nodes (prompts.md: output models).

An agent returns items and directives — never prose to parse: every response
is one of these Pydantic models, parsed from a structured-output tool call.
New items carry a response-unique `ref`; existing items are referenced by
`key`, only to change lifecycle fields. Trace links are returned as fields
named after link types (keys/refs of targets), and the artifact store turns
them into trace-link rows.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, create_model, model_validator

from khoailanggraph.domain.artifacts import ElicitationPlanContent

if TYPE_CHECKING:
    from collections.abc import Sequence

DEFAULT_QUALITY = None

# The short name of an item, as the content schemas describe it: shown in lists and links.
ItemTitle = Annotated[
    str,
    Field(
        description=(
            "A short name of at most 60 characters that tells the point of the item at a glance."
        )
    ),
]


class _Output(BaseModel):
    model_config = ConfigDict(extra="forbid")


# The report of a node: what the user reads in the chat about what the node did.
Report = Annotated[
    str,
    Field(
        min_length=1,
        description=(
            "One to three sentences to the user, in the output language, about what you did: "
            "what was done in plain words first, then only what needs their attention. "
            "Name things by what they say, never by their key. You may use Markdown for "
            "**bold**, *italic* and a short list; never headings, tables, links or code."
        ),
    ),
]


class StepNoteOutput(BaseModel):
    """One short note of a node to the user, written while it worked."""

    model_config = ConfigDict(extra="forbid")

    kind: Literal["doing", "finding"]
    text: str = Field(description="The note in plain words, at most 280 characters.")


# The notes of a node: how its work went, in a few short lines. The server keeps the first three
# and cuts each at 280 characters, so a long answer is shortened instead of refused.
Notes = Annotated[
    list[StepNoteOutput],
    Field(
        default_factory=list,
        description=(
            "Up to three short notes to the user about how your work went, in the order it "
            "happened, each with a `kind` and a `text`. Use `doing` for what you looked at or "
            'tried, in one sentence, such as "I compared what the three students said about '
            'booking." Use `finding` for something the user may care about, such as a conflict, '
            "a gap or a surprise, in one or two sentences. Each `text` has at most 280 "
            "characters; a longer one is cut. Write in the output language, in plain "
            "words, as you would explain it to a colleague who does not build software. Name "
            "things by what they say, never by their keys, ids or field names, and never mention "
            "JSON, prompts or tools. Do not repeat the report: notes tell how the work went, the "
            "report tells what it ended with. You may use Markdown for **bold** and *italic* "
            "only. Leave the list empty when there is nothing worth saying; never pad it."
        ),
    ),
]


class _Narrated(_Output):
    """An output that tells the user how the work went. `notes` is its first field, so that a
    model that writes the fields in order writes them before the rest, and the server can send
    each note while the answer is still being written."""

    notes: Notes


class ReviewOptionOutput(_Output):
    """What a node suggests for one answer of the review after it."""

    key: str = Field(description="The key of one option of the review, as it is given to you.")
    label: str | None = Field(
        default=None,
        description=(
            "What the option says in this case, at most 40 characters, in the output language, "
            "in plain text. Leave it out to keep the usual words."
        ),
    )
    description: str | None = Field(
        default=None,
        description=(
            "What happens if the user picks this option, in one sentence of at most 120 "
            "characters, in the output language, in plain text, for example which conflicts the "
            "analysis will settle. Leave it out when the label already says it."
        ),
    )
    suggested_feedback: str | None = Field(
        default=None,
        description=(
            "Only for an option that asks the user for feedback: what the user would most likely "
            "say, at most 300 characters, written as the user speaking, in the output language, "
            "in plain text, so that one click sends it. Leave it out for an option that asks for "
            "none."
        ),
    )


class ReviewChoiceOutput(_Output):
    key: str = Field(description="A short key in lower case with underscores, such as `students`.")
    label: str = Field(description="What the user reads, at most 60 characters, in plain text.")


class ReviewQuestionOutput(_Output):
    key: str = Field(description="A short key in lower case with underscores, unique here.")
    kind: Literal["single_select", "multi_select", "free_text"]
    prompt: str = Field(
        description="The question in one sentence of at most 140 characters, in plain text."
    )
    choices: list[ReviewChoiceOutput] = Field(
        default_factory=list,
        description="Two to four choices for a selection; none for a `free_text`.",
    )
    default_choice_keys: list[str] = Field(
        default_factory=list,
        description=(
            "Your own assumption: the key of the choice you would take (one for `single_select`). "
            "Always give it, so that the user can accept the review without answering."
        ),
    )


class ReviewOutput(_Output):
    """What the user is asked at the review that follows the node: what to look at, the answers
    it suggests, and the few decisions that only the user can make."""

    prompt: str = Field(
        description=(
            "One to three sentences to the user, at most 300 characters, in the output language: "
            "what to look at in this review, with what you found, for example how many conflicts "
            "are still open and what they are about. Plain words, never keys, in plain text "
            "without Markdown."
        )
    )
    options: list[ReviewOptionOutput] = Field(
        default_factory=list,
        description="Suggestions for the options of the review, only for the ones that exist.",
    )
    questions: list[ReviewQuestionOutput] = Field(
        default_factory=list,
        description=(
            "At most three questions about decisions that only the user can make and that you "
            "cannot settle from what you read, for example which of two conflicting wishes wins. "
            "Do not ask what you can decide yourself, and never ask the same thing twice. Leave "
            "the list empty when there is nothing to ask."
        ),
    )


# The summary of a document: what its content says, for the top of the artifact. It is not the
# report, which says what the step did.
Summary = Annotated[
    str | None,
    Field(
        default=None,
        description=(
            "One or two sentences, in the output language, about what the document says, for the "
            "top of it: the content, not what you did. Null when there is nothing to sum up."
        ),
    ),
]

_QUOTE_NOTE = (
    "One run of words, at most 300 characters, copied exactly from one text field of the item."
)


class EvidencedBy(_Output):
    """One interview message a requirement was taken from, with the words it quotes."""

    message: str
    target_quote: str = Field(description=f"The words of the message. {_QUOTE_NOTE}")

    def as_link(self) -> MessageLink:
        return MessageLink(message=self.message, target_quote=self.target_quote)


class ItemLink(_Output):
    """A link to an item with the words it is about, on one side or both."""

    item: str
    source_quote: str | None = Field(
        default=None, description=f"The words of this item that the link is about. {_QUOTE_NOTE}"
    )
    target_quote: str | None = Field(
        default=None, description=f"The words of the linked item that it is about. {_QUOTE_NOTE}"
    )


class MessageLink(_Output):
    """A link to an interview message with the words of the answer."""

    message: str
    target_quote: str | None = Field(
        default=None, description=f"The words of the answer. {_QUOTE_NOTE}"
    )


# A link names the item by its key or ref; an object adds the words the link is about.
LinkRef = str | ItemLink


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


class GeneratorOutput(_Narrated):
    """The frame of the persona catalog plus its persona items."""

    report: Report
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
    origin: Literal["web", "upload"] = "web"


class CorpusBuilderOutput(_Narrated):
    """The kept documents of the research corpus, with the reason each was kept."""

    report: Report
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


class MinerOutput(_Narrated):
    """The stakeholder observations mined from one source document."""

    report: Report
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


class GeneratorOutputV2(_Narrated):
    """The frame of the evidence-grounded persona catalog plus its personas."""

    report: Report
    review: ReviewOutput | None = Field(
        default=None,
        description=(
            "The review that follows this step: what the user is asked. Leave it out when the "
            "review has nothing to add to its usual question."
        ),
    )
    selection_rationale: str
    stakeholder_groups: list[StakeholderGroup]
    uncovered_stakeholder_types: list[str]
    personas: list[NewPersonaV2]


def generator_output_for(observation_keys: Sequence[str]) -> type[GeneratorOutputV2]:
    """`GeneratorOutputV2` whose observation keys can only be the ones given.

    The schema sent to the model lists the keys as the allowed values of every field that cites
    one (groups, `grounded_in`, evidence), so a provider that constrains its decoding cannot
    produce another key, and a parse that names one is refused and asked again.
    """
    if not observation_keys:
        return GeneratorOutputV2
    key: Any = Literal[tuple(observation_keys)]
    evidence: Any = create_model(
        "PersonaEvidence", __base__=PersonaEvidence, observation=(key, ...)
    )
    persona: Any = create_model(
        "NewPersonaV2",
        __base__=NewPersonaV2,
        grounded_in=(list[key], Field(min_length=1)),
        evidence=(list[evidence], Field(min_length=1)),
    )
    group: Any = create_model(
        "StakeholderGroup",
        __base__=StakeholderGroup,
        observations=(list[key], Field(min_length=1)),
    )
    schema: Any = create_model(
        "GeneratorOutputV2",
        __base__=GeneratorOutputV2,
        stakeholder_groups=(list[group], ...),
        personas=(list[persona], ...),
    )
    return schema


class PlannerOutput(ElicitationPlanContent, _Narrated):
    """The plan content verbatim, and the report; the planner produces no items."""

    report: Report
    summary: Summary


class InterviewerTurnOutput(_Output):
    question: str
    stop: bool = False
    summary: str | None = Field(
        default=None,
        description=(
            "When you stop: one sentence, at most 160 characters, about what the interviewee said "
            "(who they are, then what they care about), using only what they said. Null when you "
            "ask a question."
        ),
    )

    report: str | None = Field(
        default=None,
        description=(
            "When you stop: one to three sentences to the user, in the output language, about "
            "what this interview showed: who the person is and what matters most to them. The "
            "summary is for the document; this is for the user, so say it in your own words and "
            "do not copy the summary. Name things by what they say, never by their key. You may "
            "use Markdown for **bold**, *italic* and a short list; never headings, tables, "
            "links or code. Null when you ask a question."
        ),
    )

    @model_validator(mode="after")
    def _a_stop_comes_with_a_summary_and_a_report(self) -> InterviewerTurnOutput:
        if self.stop and not (self.summary and self.summary.strip()):
            msg = "write the summary of the interview when you stop"
            raise ValueError(msg)
        if self.stop and not (self.report and self.report.strip()):
            msg = "write the report of the interview when you stop"
            raise ValueError(msg)
        return self


class PersonaAnswerOutput(_Output):
    answer: str


class RawRequirementDraft(_Output):
    ref: str
    title: ItemTitle
    statement: str
    topic: str | None
    stated_by: str
    evidenced_by: list[EvidencedBy] = Field(min_length=1)
    supersedes: list[str] = Field(default_factory=list)


class AnalyzedRequirementDraft(_Output):
    ref: str
    title: ItemTitle
    statement: str
    type: Literal["functional", "non_functional", "constraint"]
    quality_category: str | None = DEFAULT_QUALITY
    priority: str
    rationale: str
    derived_from: list[LinkRef] = Field(min_length=1)
    involves: list[str]
    supersedes: list[str] = Field(default_factory=list)


class LatentNeedDraft(_Output):
    ref: str
    title: ItemTitle
    description: str
    reasoning: str
    confidence: Literal["low", "medium", "high"]
    disposition: Literal["open", "promoted", "dismissed"] = "open"
    evidenced_by: list[EvidencedBy] = Field(min_length=1)
    involves: list[str]
    supersedes: list[str] = Field(default_factory=list)


class AssumptionDraft(_Output):
    ref: str
    title: ItemTitle
    statement: str
    reasoning: str
    impact_if_wrong: str
    validation_status: Literal["unverified", "confirmed", "invalidated"]
    concerns: list[LinkRef]
    supersedes: list[str] = Field(default_factory=list)


class AmbiguityIssueDraft(_Output):
    ref: str
    title: ItemTitle
    description: str
    ambiguity_type: str
    ambiguous_text: str
    clarifying_question: str
    status: Literal["open", "resolved", "dismissed"]
    resolution: str | None
    concerns: list[LinkRef]
    resolved_by: str | MessageLink | None
    supersedes: list[str] = Field(default_factory=list)


class ConflictDraft(_Output):
    ref: str
    title: ItemTitle
    description: str
    conflict_type: str
    severity: Literal["low", "medium", "high"]
    proposed_resolutions: list[str]
    status: Literal["open", "resolved", "dismissed"]
    resolution: str | None
    concerns: list[LinkRef]
    involves: list[str]
    resolved_by: str | MessageLink | None
    supersedes: list[str] = Field(default_factory=list)


class AnalystOutput(_Narrated):
    report: Report
    review: ReviewOutput | None = Field(
        default=None,
        description=(
            "The review that follows this step: what the user is asked. Leave it out when the "
            "review has nothing to add to its usual question."
        ),
    )
    summary: Summary
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
    derived_from: list[LinkRef] = Field(min_length=1)
    depends_on: list[str]
    supersedes: list[str] = Field(default_factory=list)


class EngineerOutput(_Narrated):
    """The frame of the specification plus its requirement items."""

    report: Report
    review: ReviewOutput | None = Field(
        default=None,
        description=(
            "The review that follows this step: what the user is asked. Leave it out when the "
            "review has nothing to add to its usual question."
        ),
    )
    summary: Summary
    purpose: str
    scope: str
    out_of_scope: list[str]
    definitions: list[Definition]
    requirements: list[NewSpecRequirement]


class AcceptanceCriterionDraft(_Output):
    given: str
    when: str
    then: str


class NewBacklogItem(_Output):
    ref: str
    item_type: Literal["epic", "user_story"]
    title: str
    as_a: str | None
    i_want: str | None
    so_that: str | None
    acceptance_criteria: list[AcceptanceCriterionDraft]
    priority: str
    story_points: int | None
    derived_from: list[LinkRef] = Field(min_length=1)
    depends_on: list[str]
    supersedes: list[str] = Field(default_factory=list)


class BacklogOutput(_Narrated):
    """The frame of the backlog plus its items, in backlog order."""

    report: Report
    summary: Summary
    product_goal: str
    prioritization_notes: str | None
    items: list[NewBacklogItem]


class ValidationIssueDraft(_Output):
    ref: str
    title: ItemTitle
    category: str
    severity: Literal["low", "medium", "high"]
    description: str
    suggestion: str | None
    flags: list[LinkRef]


class ValidatorOutput(_Narrated):
    report: Report
    status: Literal["pass", "fail"]
    issues: list[ValidationIssueDraft]


ROUTER_TARGETS = Literal[
    "planner", "interviewer", "analyst", "requirement_engineer", "backlog_manager"
]


class IntentDirectiveOutput(_Narrated):
    report: Report
    target_node: ROUTER_TARGETS
    instruction: str
    about: list[str]
