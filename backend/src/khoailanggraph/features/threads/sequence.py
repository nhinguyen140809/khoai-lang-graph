"""Numbering the messages of a thread, whatever other requests write meanwhile.

The sequence of a message is its place in its thread, from 1, without gaps. Two requests of one
thread may both read the last number and both write the next one, so the database holds the rule
(no two messages of a thread share a sequence) and a message that finds its number taken is written
again with the one after it.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from khoailanggraph.domain.errors import NotNumberedError
from khoailanggraph.features.threads.models import MessageRow

if TYPE_CHECKING:
    from collections.abc import Callable
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import Session

# How many times a message is written again when another message took its sequence.
MESSAGE_SEQUENCE_ATTEMPTS = 8


async def add_message(
    session: AsyncSession, thread_id: UUID, build: Callable[[int], MessageRow]
) -> MessageRow:
    """Write a message of a thread with the next sequence. `build` makes it for a number, and is
    called again for each attempt."""
    for _attempt in range(MESSAGE_SEQUENCE_ATTEMPTS):
        top = await session.scalar(
            select(func.max(MessageRow.sequence)).where(MessageRow.thread_id == thread_id)
        )
        row = build(int(top or 0) + 1)
        try:
            async with session.begin_nested():
                session.add(row)
        except IntegrityError:
            continue
        return row
    raise NotNumberedError("message")


def add_message_sync(
    session: Session, thread_id: UUID, build: Callable[[int], MessageRow]
) -> MessageRow:
    """`add_message` for the code that writes through a synchronous session, such as a run."""
    for _attempt in range(MESSAGE_SEQUENCE_ATTEMPTS):
        top = session.scalar(
            select(func.max(MessageRow.sequence)).where(MessageRow.thread_id == thread_id)
        )
        row = build(int(top or 0) + 1)
        try:
            with session.begin_nested():
                session.add(row)
        except IntegrityError:
            continue
        return row
    raise NotNumberedError("message")
