"""Content of an assumption item, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class AssumptionContent(BaseModel):
    """Something taken as true without confirmation.

    The requirements whose meaning depends on it are `concerns` trace links;
    whether it holds is tracked in `validation_status`.
    """

    model_config = ConfigDict(extra="forbid")

    statement: str
    reasoning: str
    impact_if_wrong: str
    validation_status: Literal["unverified", "confirmed", "invalidated"]
