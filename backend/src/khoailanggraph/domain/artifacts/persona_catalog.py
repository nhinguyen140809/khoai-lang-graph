"""Content of the persona catalog artifact, mirroring its v2 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class StakeholderGroupContent(BaseModel):
    """One consolidated group of mined stakeholder observations."""

    model_config = ConfigDict(extra="forbid")

    name: str
    description: str
    observations: list[str]


class PersonaCatalogContent(BaseModel):
    """Why the persona set is what it is: the artifact reviewed at the
    checkpoint_personas checkpoint, holding the personas as items.

    `stakeholder_groups` records how the mined observations were consolidated
    before the personas were built — MAJ-EVAL's clustering step — so the
    evidence chain from persona to observation stays inspectable.
    """

    model_config = ConfigDict(extra="forbid")

    selection_rationale: str
    stakeholder_groups: list[StakeholderGroupContent]
    uncovered_stakeholder_types: list[str]
