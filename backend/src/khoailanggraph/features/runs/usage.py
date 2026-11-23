"""Usage and cost of the runs of a user: the totals the budget and `GET /me/usage` read."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import select

from khoailanggraph.features.assistant.models import AssistantTurnRow
from khoailanggraph.features.runs.models import RunRow
from khoailanggraph.llm.usage import Usage, add_usage, zero_usage

if TYPE_CHECKING:
    from uuid import UUID

    from sqlalchemy import Select
    from sqlalchemy.ext.asyncio import AsyncSession


def month_bounds(month: str | None = None) -> tuple[datetime, datetime]:
    """The first moment of a calendar month in UTC (`YYYY-MM`, the current month by default) and
    the first moment of the next month."""
    now = datetime.now(UTC)
    year, number = (now.year, now.month) if month is None else map(int, month.split("-"))
    start = datetime(year, number, 1, tzinfo=UTC)
    end = datetime(year + (number == 12), number % 12 + 1, 1, tzinfo=UTC)  # noqa: PLR2004
    return start, end


def runs_of_user_in(user_id: UUID, start: datetime, end: datetime) -> Select[Any]:
    """The runs the user started in a period of time, by the time they were created."""
    return select(RunRow).where(
        RunRow.started_by == user_id,
        RunRow.created_at >= start.replace(tzinfo=None),
        RunRow.created_at < end.replace(tzinfo=None),
    )


def usage_of(blob: bytes) -> Usage:
    """The usage that a run or a step stores."""
    stored = json.loads((blob or b"{}").decode("utf-8")) or {}
    total = zero_usage()
    return add_usage(
        total,
        Usage(
            input_tokens=int(stored.get("input_tokens", 0)),
            output_tokens=int(stored.get("output_tokens", 0)),
            cache_read_tokens=int(stored.get("cache_read_tokens", 0)),
            cache_write_tokens=int(stored.get("cache_write_tokens", 0)),
            cost_usd=float(stored.get("cost_usd", 0.0)),
            duration_ms=int(stored.get("duration_ms", 0)),
        ),
    )


def total_usage(runs: list[RunRow]) -> Usage:
    """The sum of the usage of some runs."""
    total = zero_usage()
    for run in runs:
        total = add_usage(total, usage_of(run.usage_json))
    return total


async def assistant_turns_in(
    session: AsyncSession, user_id: UUID, start: datetime, end: datetime
) -> list[AssistantTurnRow]:
    """The messages the assistant answered for the user in a period of time."""
    return list(
        (
            await session.scalars(
                select(AssistantTurnRow).where(
                    AssistantTurnRow.user_id == user_id,
                    AssistantTurnRow.created_at >= start.replace(tzinfo=None),
                    AssistantTurnRow.created_at < end.replace(tzinfo=None),
                )
            )
        ).all()
    )


async def assistant_spend_of(
    session: AsyncSession, user_id: UUID, start: datetime, end: datetime
) -> float:
    """What the assistant cost this user in the period.

    The assistant is called before any run exists, so its price is on no run step: a budget that
    counted only runs would let a user spend past it by talking to the assistant.
    """
    turns = await assistant_turns_in(session, user_id, start, end)
    return sum(usage_of(turn.usage_json)["cost_usd"] for turn in turns)
