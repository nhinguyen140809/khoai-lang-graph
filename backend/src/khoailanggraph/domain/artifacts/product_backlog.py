"""Content of the product backlog artifact, mirroring its v1 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ProductBacklogContent(BaseModel):
    """The frame of the backlog; the epics and user stories are the items.

    The order of the items in the artifact is the backlog order.
    """

    model_config = ConfigDict(extra="forbid")

    product_goal: str
    prioritization_notes: str | None
    definition_of_done: list[str] = Field(default_factory=list)
