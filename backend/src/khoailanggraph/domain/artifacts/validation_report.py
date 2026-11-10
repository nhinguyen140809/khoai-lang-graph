"""Content of a validation report artifact, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ValidationReportContent(BaseModel):
    """The verdict of one validator execution; the issues are its items.

    A report is immutable: a new validation iteration produces a new report
    artifact. `iteration` is set by the system (readOnly).
    """

    model_config = ConfigDict(extra="forbid")

    iteration: int = Field(ge=0)
    status: Literal["pass", "fail"]
