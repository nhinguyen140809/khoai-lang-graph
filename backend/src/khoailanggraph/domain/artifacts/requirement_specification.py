"""Content of the requirement specification artifact, its v1 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class Definition(BaseModel):
    """One term used by the requirements, defined in the specification."""

    model_config = ConfigDict(extra="forbid")

    term: str
    definition: str


class RequirementSpecificationContent(BaseModel):
    """The frame of the specification, reviewed at the checkpoint_spec
    checkpoint; its sections and specified requirements are the items."""

    model_config = ConfigDict(extra="forbid")

    purpose: str
    scope: str
    out_of_scope: list[str]
    definitions: list[Definition]
