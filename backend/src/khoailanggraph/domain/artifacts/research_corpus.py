"""Content of the research corpus artifact, mirroring artifacts/research_corpus/v1."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ResearchCorpusContent(BaseModel):
    """The curated research corpus of the project: the artifact under review
    alongside its source documents and mined stakeholder observations."""

    model_config = ConfigDict(extra="forbid")

    selection_rationale: str
