"""Content of a specified requirement item, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class SpecRequirementContent(BaseModel):
    """A requirement as written in the requirement specification.

    `quality_category` is set for a non-functional requirement (from the
    quality_category value list) and null otherwise; `fit_criterion` is the
    measurable threshold of a non-functional requirement. What it was built
    from (`derived_from`) and what must be met first (`depends_on`) are trace
    links.
    """

    model_config = ConfigDict(extra="forbid")

    title: str
    statement: str
    type: Literal["functional", "non_functional", "constraint"]
    quality_category: str | None
    priority: str
    rationale: str
    acceptance_criteria: list[str]
    fit_criterion: str | None
    verification_method: Literal["test", "inspection", "demonstration", "analysis"]
