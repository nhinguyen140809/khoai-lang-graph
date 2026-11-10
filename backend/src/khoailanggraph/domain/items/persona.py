"""Content of a persona item, mirroring items/persona/v2.json."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class PersonaEvidence(BaseModel):
    """One research quote a persona is built from, traced to its origin."""

    model_config = ConfigDict(extra="forbid")

    observation: str
    source: str
    quote: str


class PersonaContent(BaseModel):
    """A simulated stakeholder grounded in evidence mined from documents.

    The prompt view of the profile renders into the messages of the persona
    agent. `stakeholder_type` takes one of the stakeholder types of the
    current elicitation plan (x-value-from); `interview_status` is set by the
    system, never written by an agent (readOnly). `evaluative_dimension` is
    what this persona evaluates a product by; `grounded_in` names the
    stakeholder observation keys it is built from and `evidence` carries
    their quotes, copied exactly, with the source document keys.
    """

    model_config = ConfigDict(extra="forbid")

    name: str
    stakeholder_type: str
    evaluative_dimension: str
    grounded_in: list[str]
    background: str
    expertise: str
    goals: list[str]
    interests: list[str]
    constraints: list[str]
    priorities: list[str]
    concerns: list[str]
    behavioral_tendencies: str
    evidence: list[PersonaEvidence]
    interview_status: Literal["not_started", "in_progress", "completed"]
