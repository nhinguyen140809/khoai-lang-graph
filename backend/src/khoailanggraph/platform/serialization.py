"""ISO-8601 serialization of the timestamps the API hands out.

The client schemas read every datetime as `z.iso.datetime()`: the hours and
minutes with seconds (or a fraction) and the offset strictly `Z` — never the
``+00:00`` form Pydantic emits by default. Pydantic serializes what SQLite
reads back (naive UTC) through `iso_utc` too: naive rows are treated as UTC
and both SQLite and Postgres flows answer in the single client format.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated

from pydantic import PlainSerializer


def iso_utc(value: datetime) -> str:
    """`2026-10-11T08:39:02.123456Z`, whatever tzinfo the row carried."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


IsoDatetime = Annotated[datetime, PlainSerializer(iso_utc, return_type=str)]
