"""Content of the requirements analysis artifact, mirroring its v1 schema."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class RequirementsAnalysisContent(BaseModel):
    """The summary of the analysis, reviewed at the checkpoint_analysis
    checkpoint; the findings themselves are the artifact's items."""

    model_config = ConfigDict(extra="forbid")

    key_findings: list[str]
    open_questions: list[str]
