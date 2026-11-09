"""Pydantic shapes of the items, kinds and search (§5, mock parity)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

from khoailanggraph.platform.serialization import IsoDatetime


class Origin(BaseModel):
    """Who made a change: an agent (with its role, run and step) or a user."""

    model_config = ConfigDict(extra="forbid")

    actor: Literal["agent", "user"]
    agent_role: str | None
    user_id: str | None
    run_id: str | None
    step_id: str | None


class Item(BaseModel):
    """One item of an artifact (API.md items; the shape of the client's item schema)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    artifact_id: str
    project_id: str
    key: str
    kind: str
    parent_item_id: str | None
    position: int
    outline_number: str
    schema_version: int
    version: int
    review_status: str
    created_by: Origin
    updated_by: Origin
    created_at: IsoDatetime
    updated_at: IsoDatetime
    content: dict[str, Any]


class OutlineItem(Item):
    """An item in the outline of its artifact: with the depth of its outline number."""

    depth: int


class NestedOutlineItem(OutlineItem):
    """An item with the items under it (`?shape=tree`)."""

    children: list[NestedOutlineItem]


class Artifact(BaseModel):
    """One artifact instance of a project (API.md artifacts)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    kind: str
    project_id: str
    title: str
    summary: str | None
    schema_version: int
    content: dict[str, Any]
    subject_item_id: str | None
    version: int
    review_status: str
    item_count: int
    created_by: Origin
    updated_by: Origin
    created_at: IsoDatetime
    updated_at: IsoDatetime


class ItemLinkRef(BaseModel):
    """The item a link points from or to, resolved for the UI."""

    model_config = ConfigDict(extra="forbid")

    id: str
    key: str
    kind: str
    review_status: str


class ItemRevision(BaseModel):
    """One version of an item (GET /items/{id}/revisions)."""

    model_config = ConfigDict(extra="forbid")

    version: int
    change_reason: Literal["generated", "user_edit", "rework", "reviewed", "restored", "deleted"]
    changed_by: Origin
    created_at: IsoDatetime
    content: dict[str, Any]


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
