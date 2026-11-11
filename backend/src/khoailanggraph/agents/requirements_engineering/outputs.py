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

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    create_model,
    field_validator,
    model_validator,
)

from khoailanggraph.agents.requirements_engineering import definition as workflow_definition
from khoailanggraph.domain.artifacts import ElicitationPlanContent
from khoailanggraph.llm.note_stream import fit_note

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


def _keys_of(list_name: str) -> str:
    """The keys of a value list of the definition, as a phrase for a field description."""
    values = workflow_definition.DEFINITION.get("value_lists", [])
    keys = [
        str(value["key"])
        for entry in values
        if entry["key"] == list_name
        for value in entry["values"]
    ]
    return ", ".join(f"`{key}`" for key in keys)


# The report of a node: what the user reads in the chat about what the node did.
Report = Annotated[
    str,
    Field(
        min_length=1,
        description=(
            "One to three sentences to the user, in the output language, about what you did: "
            "what was done in plain words first, then only what needs their attention. "
            "Name things by what they say, never by their key. You may use Markdown for "
            "**bold**, *italic* and a short list; never headings, tables, links or code. "
            "When you name three or more things side by side, write one sentence that "
            "introduces them and then a Markdown list with one `- ` bullet per thing, each on "
            "its own line, instead of a long sentence with commas."
        ),
    ),
]


def _shortened(value: object) -> object:
    """A note that is too long, shortened at a word; anything else is left for the schema."""
    return fit_note(value) if isinstance(value, str) else value


class StepNoteOutput(BaseModel):
    """One short note of a node to the user, written while it worked."""

    model_config = ConfigDict(extra="forbid")

    kind: Literal["doing", "finding"]
    text: Annotated[str, BeforeValidator(_shortened)] = Field(
        description="The note in plain words: one short sentence, about 100 characters.",
    )


# The notes of a node: how its work went, in a few short lines. The server keeps the first five
# and shortens each to 160 characters at a word, so a long answer is shortened instead of refused.
Notes = Annotated[
    list[StepNoteOutput],
    Field(
        min_length=1,
        description=(
            "One to five short notes to the user, in the order you write them, each with a "
            "`kind` and a `text`. Begin with a `doing` note, in the present tense, that says "
            'what you are doing now or are about to do, such as "I am comparing what the '
            'students and the librarians say about booking." Add a `finding` for something '
            "the user may care about, such as a conflict, a gap or a surprise; a `finding` says "
            "one thing, so two findings are two notes. Keep every note to one short sentence "
            "of at most 100 characters that names two or three concrete things at most; never "
            'list everything you looked at, and do not join two points with "but" or '
            '"and". A good `finding`: "The idea does not say how a group of eight is '
            'recognised." When there is more to say, write another note instead of a '
            "longer one: the notes arrive one after another, so several short ones read "
            "better than one long one. Write in the output "
            "language, in plain words, as you would explain it to a colleague who does not "
            "build software. Name things by what they say, never by their keys, ids or field "
            "names, and never mention JSON, prompts or tools. Do not repeat the report: notes "
            "tell what you are doing and what you notice on the way, the report tells what the "
            "work ended with. You may use Markdown for **bold** and *italic* only. Always "
            "write the `doing` note; add a `finding` only when you have one, and never pad."
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
    kind: Literal["single_select", "multi_select", "free_text"] = Field(
        description=(
            "Prefer `single_select` (one answer) or `multi_select` (several) with choices that "
            "you propose, so that the user only picks. Use `free_text` only when no set of "
            "choices could fit. The user can always answer something else."
        )
    )
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
            "Do not ask what you can decide yourself, and never ask the same thing twice. Make "
            "each one a choice that you propose, with your own assumption as the default, so "
            "that the user answers by picking and types only when the proposal is not right. "
            "Leave the list empty when there is nothing to ask."
        ),
    )


def _review_for(checkpoint: str) -> type[ReviewOutput]:
    """The review of one checkpoint: the key of each suggestion is one of the options that the
    checkpoint has, which the schema tells the model with what each one is."""
    options = workflow_definition.nodes()[checkpoint]["options"]
    keys: Any = Literal[tuple(str(option["key"]) for option in options)]
    meaning = "; ".join(f'`{option["key"]}` is "{option["label"]}"' for option in options)
    option_model: Any = create_model(
        f"ReviewOptionOf_{checkpoint}",
        __base__=ReviewOptionOutput,
        key=(keys, Field(description=f"The option this is about: {meaning}.")),
    )
    return create_model(
        f"ReviewOf_{checkpoint}",
        __base__=ReviewOutput,
        options=(
            list[option_model],
            Field(
                default_factory=list,
                description="Suggestions for the options of the review, only for the ones you "
                "have something to say about.",
            ),
        ),
    )


PersonasReview = _review_for("checkpoint_personas")
AnalysisReview = _review_for("checkpoint_analysis")
SpecificationReview = _review_for("checkpoint_spec")


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


def kind_of_source(value: object) -> object:
    """The key of the list `source_type` that `value` means, or `other` when it means none."""
    keys = [str(entry["key"]) for entry in workflow_definition.value_lists().get("source_type", [])]
    if not isinstance(value, str) or not keys or value in keys:
        return value
    words = set(value.strip().lower().replace("-", "_").replace(" ", "_").split("_"))
    for key in keys:
        if key != "other" and words & set(key.split("_")):
            return key
    return "other" if "other" in keys else value


class NewSource(_Output):
    """A curated research document draft; the system assigns the key."""

    ref: str
    title: str
    url: str
    publisher: str
    source_type: str = Field(
        description="What kind of document this is: one of " + _keys_of("source_type") + "."
    )
    year: str = ""
    excerpt: str
    text: str = ""
    relevance_reason: str
    origin: Literal["web", "upload"] = "web"

    @field_validator("source_type", mode="before")
    @classmethod
    def _a_kind_of_the_list(cls, value: object) -> object:
        """A kind the model phrased its own way (`news_article`) is read as the kind of the list
        it names (`news`); one that names none is `other`."""
        return kind_of_source(value)


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


class PersonaScoreOutput(_Output):
    """The score of a persona on one aspect."""

    aspect: str = Field(description="The key of the aspect, as it is listed for you.")
    score: int = Field(
        ge=1,
        le=5,
        description=(
            "From 1 to 5, as the aspect describes its two ends. Do not give every persona the "
            "same score."
        ),
    )
    rationale: str = Field(
        description=(
            "One sentence, in the output language, that says what in the observations supports "
            "the score. When the observations are silent, say that you gave the typical value of "
            "the group."
        )
    )


class NewPersonaV2(_Output):
    """A persona draft grounded in mined observations; the system assigns the key."""

    ref: str
    name: str
    stakeholder_type: str
    occupation: str = Field(
        description="What the person does for a living or in their studies, in a few words."
    )
    age_range: str = Field(description="A range of age such as 18-24.")
    evaluative_dimension: str
    grounded_in: list[str] = Field(min_length=1)
    background: str
    typical_day: str = Field(
        description=(
            "Two or three sentences about a normal day around the subject of the product: when, "
            "where and with whom the person meets the problem."
        )
    )
    expertise: str
    current_workarounds: list[str] = Field(
        description="What the person does today without the product, including tools and tricks."
    )
    vocabulary: list[str] = Field(
        description="Three to six words or phrases that the person uses for the subject."
    )
    goals: list[str]
    interests: list[str]
    constraints: list[str]
    priorities: list[str]
    concerns: list[str]
    behavioral_tendencies: str
    scores: list[PersonaScoreOutput] = Field(
        description="One score for each aspect that is listed for you, the system's and the plan's."
    )
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
    review: PersonasReview | None = Field(  # type: ignore[valid-type]
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


def generator_output_for(
    observation_keys: Sequence[str], aspect_keys: Sequence[str] = ()
) -> type[GeneratorOutputV2]:
    """`GeneratorOutputV2` whose observation keys and aspect keys can only be the ones given.

    The schema sent to the model lists the observation keys as the allowed values of every field
    that cites one (groups, `grounded_in`, evidence), and the aspect keys as the allowed values of
    a score, so a provider that constrains its decoding cannot produce another key, and a parse
    that names one is refused and asked again. Every persona must have exactly one score for each
    aspect.
    """
    if not observation_keys and not aspect_keys:
        return GeneratorOutputV2
    persona_fields: dict[str, Any] = {}
    output_fields: dict[str, Any] = {}
    if observation_keys:
        key: Any = Literal[tuple(observation_keys)]
        evidence: Any = create_model(
            "PersonaEvidence", __base__=PersonaEvidence, observation=(key, ...)
        )
        group: Any = create_model(
            "StakeholderGroup",
            __base__=StakeholderGroup,
            observations=(list[key], Field(min_length=1)),
        )
        persona_fields["grounded_in"] = (list[key], Field(min_length=1))
        persona_fields["evidence"] = (list[evidence], Field(min_length=1))
        output_fields["stakeholder_groups"] = (list[group], ...)
    validators: dict[str, Any] = {}
    if aspect_keys:
        aspect: Any = Literal[tuple(aspect_keys)]
        score: Any = create_model(
            "PersonaScoreOutput", __base__=PersonaScoreOutput, aspect=(aspect, ...)
        )
        persona_fields["scores"] = (
            list[score],
            Field(
                min_length=len(aspect_keys),
                max_length=len(aspect_keys),
                description=(
                    "One score for each aspect that is listed for you, the system's and the plan's."
                ),
            ),
        )

        def _one_score_for_each_aspect(self: Any) -> Any:
            for persona in self.personas:
                given = [entry.aspect for entry in persona.scores]
                if sorted(given) != sorted(aspect_keys):
                    msg = f"score {persona.name} once on each aspect: {', '.join(aspect_keys)}"
                    raise ValueError(msg)
            return self

        validators["_one_score_for_each_aspect"] = model_validator(mode="after")(
            _one_score_for_each_aspect
        )
    persona: Any = create_model("NewPersonaV2", __base__=NewPersonaV2, **persona_fields)
    output_fields["personas"] = (list[persona], ...)
    schema: Any = create_model(
        "GeneratorOutputV2",
        __base__=GeneratorOutputV2,
        __validators__=validators,
        **output_fields,
    )
    return schema


class PlannerOutput(ElicitationPlanContent, _Narrated):
    """The plan content verbatim, and the report; the planner produces no items."""

    report: Report
    summary: Summary


class PlannerQuestionsOutput(_Narrated):
    """What the planner asks the user before it writes the plan: the questions that the idea
    leaves open, or none. The questions are not a part of the plan document."""

    report: Report
    questions: list[ReviewQuestionOutput] = Field(
        default_factory=list,
        description=(
            "At most three questions whose answers would change the plan, the research and the "
            "interviews that follow and that the idea does not settle, such as who the users "
            "are, the scale, the region, a rule that must hold or a system to connect to. Ask "
            "only what the idea leaves open; return an empty list when it already settles "
            "these. Prefer `single_select` or `multi_select` with two to four choices that "
            "you propose from what you understand of the idea, and always give your own "
            "assumption in `default_choice_keys`, so that the user only has to pick and may "
            "accept the proposal without typing. Use `free_text` only when no set of choices "
            "could fit. The user can always answer something else, so do not add a choice "
            "for it."
        ),
    )


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
            "links or code. When you name three or more things side by side, put them in a "
            "list with one `- ` bullet per thing. Null when you ask a question."
        ),
    )

    covered_by_last_answer: list[str] = Field(
        default_factory=list,
        description=(
            "The data of the plan that the last answer of the person gave, each copied exactly as "
            "the plan lists it. Judge by what the person actually said, not by what they might "
            "know. Empty on the first turn and when the answer gave none."
        ),
    )
    topic: str | None = Field(
        default=None,
        description="The topic of the plan that your question is about, copied as written.",
    )
    question_kind: Literal["opening", "follow_up", "new_topic"] | None = Field(
        default=None,
        description=(
            "`opening` for the question that starts the interview, `follow_up` when it digs into "
            "what the person just said, `new_topic` when it moves on. Null when you stop."
        ),
    )
    follows_up_on: str | None = Field(
        default=None,
        description=(
            "For a follow-up, the key of the message that it digs into, as it is listed in the "
            "transcript. Null otherwise."
        ),
    )
    top_findings: list[str] = Field(
        default_factory=list,
        description=(
            "When you stop: the three or four problems or wishes that this interview raised, one "
            "plain sentence each, in the output language, using only what the person said."
        ),
    )
    follow_ups: list[str] = Field(
        default_factory=list,
        description=(
            "When you stop: questions that the interview left open for a later round, in the "
            "output language. Empty when nothing is left open."
        ),
    )

    @model_validator(mode="after")
    def _a_question_has_its_kind(self) -> InterviewerTurnOutput:
        if not self.stop and self.question_kind is None:
            msg = "say what kind of question you ask"
            raise ValueError(msg)
        return self

    @model_validator(mode="after")
    def _a_stop_comes_with_a_summary_and_a_report(self) -> InterviewerTurnOutput:
        if self.stop and not (self.summary and self.summary.strip()):
            msg = "write the summary of the interview when you stop"
            raise ValueError(msg)
        if self.stop and not (self.report and self.report.strip()):
            msg = "write the report of the interview when you stop"
            raise ValueError(msg)
        if self.stop and not self.top_findings:
            msg = "write what stood out in the interview when you stop"
            raise ValueError(msg)
        return self


def interviewer_output_for(
    data_items: Sequence[str], topics: Sequence[str], message_keys: Sequence[str]
) -> type[InterviewerTurnOutput]:
    """`InterviewerTurnOutput` whose data, topic and message keys can only be the ones given.

    The schema lists them as the allowed values of the fields that name one, so what the
    interviewer ties to the plan and to the transcript always exists there.
    """
    fields: dict[str, Any] = {}
    if data_items:
        data: Any = Literal[tuple(data_items)]
        fields["covered_by_last_answer"] = (
            list[data],
            Field(
                default_factory=list,
                description=InterviewerTurnOutput.model_fields[
                    "covered_by_last_answer"
                ].description,
            ),
        )
    if topics:
        topic: Any = Literal[tuple(topics)]
        fields["topic"] = (
            topic | None,
            Field(
                default=None, description=InterviewerTurnOutput.model_fields["topic"].description
            ),
        )
    if message_keys:
        key: Any = Literal[tuple(message_keys)]
        fields["follows_up_on"] = (
            key | None,
            Field(
                default=None,
                description=InterviewerTurnOutput.model_fields["follows_up_on"].description,
            ),
        )
    if not fields:
        return InterviewerTurnOutput
    schema: Any = create_model("InterviewerTurnOutput", __base__=InterviewerTurnOutput, **fields)
    return schema


class PersonaAnswerOutput(_Output):
    answer: str = Field(
        description=(
            "What the person says, in first person, in one to three sentences and at most 400 "
            "characters, as in a real interview. Say more only when asked to walk through "
            "something."
        )
    )


class RawRequirementDraft(_Output):
    ref: str
    title: ItemTitle
    statement: str
    topic: str | None
    stated_by: str
    evidenced_by: list[EvidencedBy] = Field(min_length=1)
    supersedes: list[str] = Field(default_factory=list)


def _enum(name: str, fallback: tuple[str, ...]) -> object:
    """A Literal of the value list of the current definition version.

    The provider enforces the enum at generation time, so a value outside the
    list cannot reach the store; the analyst normalizer stays as a second
    line of defence for older records.
    """
    entries = workflow_definition.value_lists().get(name, [])
    values = tuple(str(entry["key"]) for entry in entries) or fallback
    return Literal[values]


Priority = _enum("priority", ("must", "should", "could", "wont"))
AmbiguityType = _enum("ambiguity_type", ("lexical", "syntactic", "semantic", "vague", "incomplete"))
ConflictType = _enum(
    "conflict_type", ("between_requirements", "between_stakeholders", "with_constraint")
)


class AnalyzedRequirementDraft(_Output):
    ref: str
    title: ItemTitle
    statement: str
    type: Literal["functional", "non_functional", "constraint"]
    quality_category: str | None = DEFAULT_QUALITY
    priority: Priority  # type: ignore[valid-type]
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
    impact: int = Field(
        ge=1,
        le=5,
        description=(
            "From 1 to 5: how much the work would change if the assumption were wrong. Use 5 for "
            "an assumption that the whole design rests on, and 1 for one that changes a detail."
        ),
    )
    validation_status: Literal["unverified", "confirmed", "invalidated"]
    validation_plan: str = Field(
        description=(
            "One sentence, in the output language, that says how the assumption can be checked and "
            "who can confirm it, such as asking the coordinator at the next interview."
        )
    )
    concerns: list[LinkRef]
    supersedes: list[str] = Field(default_factory=list)


class AmbiguityIssueDraft(_Output):
    ref: str
    title: ItemTitle
    description: str
    ambiguity_type: AmbiguityType  # type: ignore[valid-type]
    ambiguous_text: str
    interpretations: list[str] = Field(
        description=(
            "The different ways the wording can be read, one in each entry, in the output "
            "language, so that the user can settle the issue by choosing one. Two or more; "
            "leave it empty only for missing information, where nothing can be chosen yet."
        )
    )
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
    conflict_type: ConflictType  # type: ignore[valid-type]
    severity: Literal["low", "medium", "high"]
    proposed_resolutions: list[str]
    status: Literal["open", "resolved", "dismissed"]
    resolution: str | None
    resolution_strategy: str | None = Field(
        default=None,
        description=(
            "When the conflict is resolved, how it was settled: one of "
            + _keys_of("resolution_strategy")
            + ". Null while it is open."
        ),
    )
    concerns: list[LinkRef]
    involves: list[str]
    resolved_by: str | MessageLink | None
    supersedes: list[str] = Field(default_factory=list)


class AnalystOutput(_Narrated):
    report: Report
    review: AnalysisReview | None = Field(  # type: ignore[valid-type]
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
    priority: Priority  # type: ignore[valid-type]
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
    review: SpecificationReview | None = Field(  # type: ignore[valid-type]
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
    priority: Priority  # type: ignore[valid-type]
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
    definition_of_done: list[str] = Field(
        description=(
            "What every item must meet before it counts as done, for the whole team, in the "
            "output language, three to six conditions such as that the criteria pass and the "
            "change is reviewed. It is apart from the acceptance criteria of one item."
        )
    )
    items: list[NewBacklogItem]


class ValidationIssueDraft(_Output):
    ref: str
    title: ItemTitle
    category: str
    severity: Literal["low", "medium", "high"]
    description: str
    suggestion: str | None
    flags: list[LinkRef]


class ValidationCheckDraft(_Output):
    check: str = Field(
        description=(
            "What you checked, in the output language, such as that every requirement can be "
            "tested or that every story implements a requirement."
        )
    )
    result: str = Field(
        description="How the check came out: one of " + _keys_of("check_result") + "."
    )
    note: str = Field(description="One sentence, in the output language, that says why.")


class ValidatorOutput(_Narrated):
    report: Report
    status: Literal["pass", "fail"]
    checks: list[ValidationCheckDraft] = Field(
        description=(
            "Every check that you made, one entry each, so that a pass says what it passed. "
            "Cover completeness, consistency, testability and traceability."
        )
    )
    issues: list[ValidationIssueDraft]


ROUTER_TARGETS = Literal[
    "planner", "interviewer", "analyst", "requirement_engineer", "backlog_manager"
]


class IntentDirectiveOutput(_Narrated):
    report: Report
    target_node: ROUTER_TARGETS
    instruction: str
    about: list[str]
