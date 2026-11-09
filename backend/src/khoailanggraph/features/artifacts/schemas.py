"""Pydantic shapes of the items, kinds and search (§5, mock parity)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

from khoailanggraph.platform.serialization import IsoDatetime


class Item(BaseModel):
    """GET /projects/{id}/items và GET /items/{id}; Zod strips unknowns."""

    model_config = ConfigDict(extra="forbid")

    id: str
    project_id: str
    artifact_id: str
    parent_item_id: str | None
    key: str
    kind: str
    review_status: str
    content: dict[str, Any]
    version: int
    updated_at: IsoDatetime


class ArtifactSummary(BaseModel):
    """One artifact instance of the project tree (Artifacts tab, §5)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    project_id: str
    kind: str
    title: str
    summary: str | None
    schema_version: int
    version: int
    review_status: str
    content: dict[str, Any]
    updated_at: IsoDatetime


class ItemLinkRef(BaseModel):
    """The item a link points from or to, resolved for the UI."""

    model_config = ConfigDict(extra="forbid")

    id: str
    key: str
    kind: str
    review_status: str


class ItemRevision(BaseModel):
    """One version of an item (GET /items/{id}/revisions, DATA_SHAPE §7)."""

    model_config = ConfigDict(extra="forbid")

    item_id: str
    version: int
    change_reason: Literal["generated", "user_edit", "rework", "reviewed", "restored", "deleted"]
    snapshot: dict[str, Any]
    created_at: IsoDatetime


class MatrixChainRef(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    key: str
    kind: str
    review_status: str


class MatrixChainRow(BaseModel):
    """One row of the coverage matrix (API.md: 'derived_from chains from
    backlog item down to raw requirement'); source and evidence may be
    several per skeleton's comma-joined cells."""

    model_config = ConfigDict(extra="forbid")

    backlog: MatrixChainRef | None
    spec: MatrixChainRef | None
    analyzed: MatrixChainRef | None
    source: list[MatrixChainRef]
    evidence: list[MatrixChainRef]


class CoverageEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    count: int
    items: list[MatrixChainRef]


class TraceCoverage(BaseModel):
    """The three coverage lists of API.md: requirements with no backlog
    item, requirements with no source, items that need review after a
    source changed."""

    model_config = ConfigDict(extra="forbid")

    no_backlog_item: CoverageEntry
    no_source: CoverageEntry
    needs_review: CoverageEntry


class TraceLink(BaseModel):
    """One trace link of the project (Traceability tab, §5)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    project_id: str
    link_type: str
    source: ItemLinkRef
    target: ItemLinkRef
    target_version: int
    quote: str | None
    note: str | None
