"""Content of an interview message, mirroring its v1 content schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class InterviewMessageContent(BaseModel):
    """One question or answer of an interview transcript.

    The `speaker` is the key of a participant of the transcript.
    A question and its answer share a `turn`; `iteration` marks the interview
    round (0 for the first interview, higher for rework rounds). The key of
    the item is its persona's key, `#` and its position in the transcript.
    """

    model_config = ConfigDict(extra="forbid")

    turn: int = Field(ge=1)
    speaker: str
    content: str
    iteration: int = Field(ge=0)
    topic: str | None
    message_kind: str = "answer"
    follows_up_on: str | None = None
    covers: list[str] = Field(default_factory=list)
