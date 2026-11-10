"""Content of the elicitation plan artifact, mirroring its v1 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class DataToCollect(BaseModel):
    """What an interview must bring back for one topic before the topic counts as covered."""

    model_config = ConfigDict(extra="forbid")

    topic: str = Field(description="One of the topics of the plan, copied as written.")
    needed: list[str] = Field(
        min_length=1,
        description=(
            "The concrete data to bring back for the topic, one item each: how often the person "
            "does it, what they do when it fails, what it costs them, who else is involved."
        ),
    )


class PersonaAspect(BaseModel):
    """One aspect that every persona is scored on, from 1 to 5."""

    model_config = ConfigDict(extra="forbid")

    key: str = Field(
        pattern=r"^[a-z][a-z0-9_]{0,39}$",
        description="A short key in lower case with underscores, unique in the plan.",
    )
    title: str = Field(description="What the user reads, in a few words.")
    description: str = Field(description="What the aspect measures, in one sentence.")
    low: str = Field(description="What a score of 1 means, in a few words.")
    high: str = Field(description="What a score of 5 means, in a few words.")


class ElicitationPlanContent(BaseModel):
    """What the planner produces: the strategy the interviewers follow.

    The plan artifact holds no items; its fields are its content. Personas
    are generated from `stakeholder_types` (persona content takes its
    stakeholder_type from this list) and interview questions aim at `topics`.
    """

    model_config = ConfigDict(extra="forbid")

    objectives: list[str] = Field(min_length=1)
    topics: list[str]
    data_to_collect: list[DataToCollect] = Field(
        default_factory=list,
        description=(
            "For each topic, the concrete data an interview must bring back before the topic "
            "counts as covered. This is what the interviewer checks to know it has enough."
        ),
    )
    opening_questions: list[str] = Field(
        default_factory=list,
        description=(
            "Two to four open questions that an interview can start with, in plain words, with "
            "one thing in each, such as how the person does the thing today. No leading questions."
        ),
    )
    information_gaps: list[str]
    stakeholder_types: list[str] = Field(min_length=1)
    persona_aspects: list[PersonaAspect] = Field(
        default_factory=list,
        max_length=4,
        description=(
            "Up to four aspects, specific to this project, that every persona is scored on from 1 "
            "to 5, on top of the aspects the system always uses (domain expertise, usage "
            "frequency, technology comfort, pain severity, decision influence). Each one differs "
            "from those and from the others, and says what matters for this product, such as "
            "how urgent booking is. Leave the list empty when the system's aspects are enough."
        ),
    )
    strategies: list[str]
    stopping_conditions: list[str] = Field(
        description=(
            "When the interviews have gathered enough. Each condition names what must be known, "
            "so that it can be checked, for example that two interviewees have described how they "
            "book a room today."
        )
    )
