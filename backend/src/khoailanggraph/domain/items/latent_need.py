"""Content of a latent need item, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class LatentNeedContent(BaseModel):
    """A need no persona stated directly, inferred from what they said.

    `disposition` records what became of it: open, promoted (a requirement
    was created from it) or dismissed. Which messages evidenced the inference
    (`evidenced_by`) and which personas it involves are trace links.
    """

    model_config = ConfigDict(extra="forbid")

    title: str
    description: str
    reasoning: str
    confidence: Literal["low", "medium", "high"]
    disposition: Literal["open", "promoted", "dismissed"]
