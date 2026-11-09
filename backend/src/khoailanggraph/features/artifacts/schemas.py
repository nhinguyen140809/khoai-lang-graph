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


class ItemRevision(BaseModel):
    """One version of an item (GET /items/{id}/revisions)."""

    model_config = ConfigDict(extra="forbid")

    version: int
    change_reason: Literal["generated", "user_edit", "rework", "reviewed", "restored", "deleted"]
    changed_by: Origin
    created_at: IsoDatetime
    content: dict[str, Any]


class TraceLink(BaseModel):
    """One current trace link (API.md traceability)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    source_item_id: str
    target_item_id: str
    link_type: str
    target_version: int
    source_quote: str | None
    target_quote: str | None
    note: str | None


class TraceItem(BaseModel):
    """An item that a chain reaches."""

    model_config = ConfigDict(extra="forbid")

    id: str
    artifact_id: str
    key: str
    kind: str
    version: int
    review_status: str
    content: dict[str, Any]


class Trace(BaseModel):
    """The chains of an item or an artifact: the items found and the links between them."""

    model_config = ConfigDict(extra="forbid")

    items: list[TraceItem]
    links: list[TraceLink]


class ItemSummary(BaseModel):
    """An item as a cell or a list of the traceability views shows it."""

    model_config = ConfigDict(extra="forbid")

    item_id: str
    key: str
    kind: str
    title: str


class MatrixColumn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    title: str
    kinds: list[str]


class MatrixRow(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cells: dict[str, list[ItemSummary]]


class Matrix(BaseModel):
    """Rows of `derived_from` chains; the columns come from the workflow definition."""

    model_config = ConfigDict(extra="forbid")

    columns: list[MatrixColumn]
    rows: list[MatrixRow]


class ChangedTarget(BaseModel):
    """A target of a link that changed after the link was made."""

    model_config = ConfigDict(extra="forbid")

    target: ItemSummary
    link_type: str
    made_from_version: int
    current_version: int


class CoverageItem(ItemSummary):
    changed_targets: list[ChangedTarget] | None = None


class CoverageGap(BaseModel):
    model_config = ConfigDict(extra="forbid")

    key: str
    title: str
    description: str
    items: list[CoverageItem]


class Coverage(BaseModel):
    """The items that need attention, one list for each reason."""

    model_config = ConfigDict(extra="forbid")

    gaps: list[CoverageGap]
