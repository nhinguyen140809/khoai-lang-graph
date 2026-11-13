"""Content of a validation issue item, mirroring its v1 content schema."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class ValidationIssueContent(BaseModel):
    """One problem the validator found in the produced artifacts.

    `category` takes one value of the validation_category list of the workflow
    definition. The items the problem is in are `flags` trace links; an issue
    about a whole artifact has no flags link and is identified by its
    category.
    """

    model_config = ConfigDict(extra="forbid")

    title: str
    category: str
    severity: Literal["low", "medium", "high"]
    description: str
    suggestion: str | None
    status: Literal["open", "fixed", "dismissed"]
