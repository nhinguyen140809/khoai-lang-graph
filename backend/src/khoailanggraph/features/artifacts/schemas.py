"""Pydantic shapes of the items, kinds and search (§5, mock parity)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict

from khoailanggraph.platform.serialization import IsoDatetime


class Item(BaseModel):
    """GET /projects/{id}/items và GET /items/{id}; Zod strips unknowns."""

    model_config = ConfigDict(extra="forbid")

    id: str
    project_id: str
    artifact_id: str
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
    updated_at: IsoDatetime


class ItemLinkRef(BaseModel):
    """The item a link points from or to, resolved for the UI."""

    model_config = ConfigDict(extra="forbid")

    id: str
    key: str
    kind: str
    review_status: str


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
