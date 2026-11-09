"""Shared API schemas: the list envelope and pagination (docs/API.md §3)."""

from __future__ import annotations

from typing import TypeVar

from pydantic import BaseModel

ItemT = TypeVar("ItemT")

MAX_LIMIT = 200
DEFAULT_LIMIT = 50


class Page[ItemT](BaseModel):
    """Every list endpoint answers `{ items, next_cursor }`."""

    items: list[ItemT]
    next_cursor: int | None


class FieldProblem(BaseModel):
    """One validation failure, at its field (frontend Zod expects `errors[]`)."""

    field: str
    message: str
