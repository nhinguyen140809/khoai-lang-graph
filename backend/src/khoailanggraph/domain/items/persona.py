"""Content of a persona item, mirroring docs/schemas/items/persona.v1.json."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class PersonaContent(BaseModel):
    """A simulated stakeholder.

    The prompt view of the profile renders into the system message of the
    persona agent. `stakeholder_type` takes one of the stakeholder types of
    the current elicitation plan (x-value-from); `interview_status` is set by
    the system, never written by an agent (readOnly).
    """

    model_config = ConfigDict(extra="forbid")

    name: str
    stakeholder_type: str
    background: str
    expertise: str
    goals: list[str]
    interests: list[str]
    constraints: list[str]
    priorities: list[str]
    concerns: list[str]
    behavioral_tendencies: str
    interview_status: Literal["not_started", "in_progress", "completed"]
