"""Content of a backlog item, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AcceptanceCriterion(BaseModel):
    """One Given/When/Then acceptance criterion of a backlog item."""

    model_config = ConfigDict(extra="forbid")

    given: str
    when: str
    then: str


class BacklogItemContent(BaseModel):
    """An epic or a user story of the product backlog.

    `as_a`, `i_want` and `so_that` carry the user-story sentence and are null
    for an epic; the epic of a story is its parent item. `delivery_status` is
    set by the user, not the system. What a story implements (`derived_from`)
    and what must be done first (`depends_on`) are trace links.
    """

    model_config = ConfigDict(extra="forbid")

    item_type: Literal["epic", "user_story"]
    title: str
    as_a: str | None
    i_want: str | None
    so_that: str | None
    acceptance_criteria: list[AcceptanceCriterion]
    priority: str
    story_points: int | None = Field(ge=0)
    delivery_status: Literal["todo", "in_progress", "done"]
