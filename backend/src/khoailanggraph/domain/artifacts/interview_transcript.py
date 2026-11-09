"""Content of an interview transcript artifact, mirroring its v1 schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Participant(BaseModel):
    """One person of the interview: the interviewer first, then the persona."""

    model_config = ConfigDict(extra="forbid")

    key: str
    name: str
    role: Literal["interviewer", "persona"]
    item_id: str | None


class InterviewTranscriptContent(BaseModel):
    """The system-computed state of one persona's interview.

    One transcript artifact per persona (the persona is its subject item);
    its messages are the items of the artifact, ordered by position. Every
    field is readOnly: set by the workflow, never written by an agent.
    """

    model_config = ConfigDict(extra="forbid")

    participants: list[Participant] = Field(min_length=2)
    status: Literal["in_progress", "completed"]
    turn_count: int = Field(ge=0)
    stop_reason: Literal["max_turns", "interviewer_stopped", "stopping_condition_met"] | None
