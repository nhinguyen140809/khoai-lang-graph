"""Content of the persona catalog artifact, mirroring its v1 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class PersonaCatalogContent(BaseModel):
    """Why the persona set is what it is: the artifact reviewed at the
    checkpoint_personas checkpoint, holding the personas as items."""

    model_config = ConfigDict(extra="forbid")

    selection_rationale: str
    uncovered_stakeholder_types: list[str]
