"""Shared API schemas: the list envelope and pagination (docs/API.md §3)."""

from __future__ import annotations

import base64
import binascii
import json
from typing import Annotated, TypeVar

from fastapi import Query
from pydantic import BaseModel, BeforeValidator, field_validator

ItemT = TypeVar("ItemT")

MAX_LIMIT = 200
DEFAULT_LIMIT = 50


def encode_cursor(offset: int) -> str:
    """The opaque cursor that stands for the position `offset` in a list."""
    raw = json.dumps({"s": offset}, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(value: object) -> int:
    """The position a cursor of `encode_cursor` stands for; a value that is no such cursor is an
    error of the request."""
    if isinstance(value, int):
        return value
    try:
        decoded = json.loads(base64.urlsafe_b64decode(f"{value}==="))
        offset = decoded["s"]
    except (ValueError, KeyError, TypeError, binascii.Error) as exc:
        msg = "The cursor is not one that a list returned."
        raise ValueError(msg) from exc
    if not isinstance(offset, int) or offset < 0:
        msg = "The cursor is not one that a list returned."
        raise ValueError(msg)
    return offset


# The `?cursor=` of a list: the opaque string of the page before, read as a position.
Cursor = Annotated[
    int,
    BeforeValidator(decode_cursor),
    Query(ge=0, json_schema_extra={"type": "string"}),
]


class Page[ItemT](BaseModel):
    """Every list endpoint answers `{ items, next_cursor }`; the cursor is opaque, and a list that
    pages by position gives that position as a number."""

    items: list[ItemT]
    next_cursor: str | None

    @field_validator("next_cursor", mode="before")
    @classmethod
    def _opaque(cls, value: object) -> object:
        return encode_cursor(value) if isinstance(value, int) else value


class FieldProblem(BaseModel):
    """One validation failure, at its field (frontend Zod expects `errors[]`)."""

    field: str
    message: str
