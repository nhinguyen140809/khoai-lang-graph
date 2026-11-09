"""Content of an analyzed requirement item, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class AnalyzedRequirementContent(BaseModel):
    """A requirement after analysis: merged, classified and prioritized.

    `quality_category` is set for a non-functional requirement (from the
    quality_category value list) and null otherwise; `priority` comes from the
    priority value list. What it was built from (`derived_from`) and the
    personas that want it (`involves`) are trace links.
    """

    model_config = ConfigDict(extra="forbid")

    title: str
    statement: str
    type: Literal["functional", "non_functional", "constraint"]
    quality_category: str | None
    priority: str
    rationale: str
