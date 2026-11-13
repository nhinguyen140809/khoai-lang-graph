"""Content of an ambiguity issue item, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AmbiguityIssueContent(BaseModel):
    """A statement that can be read in more than one way or lacks detail.

    `ambiguity_type` takes one value of the ambiguity_type list of the
    workflow definition. The answer that settled it (`resolved_by`) is a
    trace link; `resolution` stays null while the issue is open.
    """

    model_config = ConfigDict(extra="forbid")

    title: str
    description: str
    ambiguity_type: str
    ambiguous_text: str
    interpretations: list[str] = Field(default_factory=list)
    clarifying_question: str
    status: Literal["open", "resolved", "dismissed"]
    resolution: str | None
