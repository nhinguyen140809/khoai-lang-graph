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
    key: str
    kind: str
    review_status: str
    content: dict[str, Any]
    version: int
    updated_at: IsoDatetime
