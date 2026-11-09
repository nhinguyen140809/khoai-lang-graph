"""Content of a raw requirement item, mirroring its v1 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class RawRequirementContent(BaseModel):
    """A requirement as stated in an interview, before any rewriting.

    Who said it (`stated_by`) and which message evidences it (`evidenced_by`,
    with the exact quote) are trace links, not fields of the content.
    """

    model_config = ConfigDict(extra="forbid")

    statement: str
    topic: str | None
