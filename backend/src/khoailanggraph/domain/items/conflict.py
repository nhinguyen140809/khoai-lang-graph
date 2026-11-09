"""Content of a conflict item, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class ConflictContent(BaseModel):
    """Two or more requirements, or the wishes of two or more personas, that
    cannot all hold.

    `conflict_type` takes one value of the conflict_type list of the workflow
    definition. The requirements in conflict (`concerns`), the personas on the
    sides (`involves`) and the answer that settled it (`resolved_by`) are
    trace links.
    """

    model_config = ConfigDict(extra="forbid")

    description: str
    conflict_type: str
    severity: Literal["low", "medium", "high"]
    proposed_resolutions: list[str]
    status: Literal["open", "resolved", "dismissed"]
    resolution: str | None
