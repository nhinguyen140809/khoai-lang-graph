"""Content of a section item, mirroring its v1 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class SectionContent(BaseModel):
    """A heading that groups items inside an artifact; sections nest.

    The outline number of the item is derived from the positions along the
    path from the top level. A section is never traced and is not created in
    an interview transcript.
    """

    model_config = ConfigDict(extra="forbid")

    title: str
    introduction: str | None
