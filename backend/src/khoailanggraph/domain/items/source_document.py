"""Content of a source document item, mirroring items/source_document/v1."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict


class SourceDocumentContent(BaseModel):
    """One research document of the corpus, kept for the stakeholder mining.

    The corpus builder copies the identity fields verbatim from the search
    hit; `text` carries the document text the hit brought, and the stakeholder
    miner mines its observations out of it, so every evidence quote stays
    checkable against this text.
    """

    model_config = ConfigDict(extra="forbid")

    title: str
    url: str
    publisher: str
    source_type: str = "other"
    year: str
    excerpt: str
    text: str
    origin: Literal["web", "upload"]
    relevance_reason: str
