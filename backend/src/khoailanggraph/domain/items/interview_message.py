"""Content of an interview message, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class InterviewMessageContent(BaseModel):
    """One question or answer of an interview transcript.

    A question and its answer share a `turn`; `iteration` marks the interview
    round (0 for the first interview, higher for rework rounds). The key of
    the item is its persona's key, `#` and its position in the transcript.
    """

    model_config = ConfigDict(extra="forbid")

    turn: int = Field(ge=1)
    role: Literal["interviewer", "persona"]
    content: str
    iteration: int = Field(ge=0)
    topic: str | None
