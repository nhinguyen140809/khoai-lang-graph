"""Content of the elicitation plan artifact, mirroring its v1 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ElicitationPlanContent(BaseModel):
    """What the planner produces: the strategy the interviewers follow.

    The plan artifact holds no items; its fields are its content. Personas
    are generated from `stakeholder_types` (persona content takes its
    stakeholder_type from this list) and interview questions aim at `topics`.
    """

    model_config = ConfigDict(extra="forbid")

    objectives: list[str] = Field(min_length=1)
    topics: list[str]
    information_gaps: list[str]
    stakeholder_types: list[str] = Field(min_length=1)
    strategies: list[str]
    stopping_conditions: list[str]
