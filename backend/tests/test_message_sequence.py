"""The messages of a thread are numbered in order, and two never share a number."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session

from khoailanggraph.features.threads.models import MessageRow
from khoailanggraph.features.threads.sequence import add_message, add_message_sync
from khoailanggraph.platform.db import Base

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
    from pathlib import Path
    from uuid import UUID


def _message(thread_id: UUID, sequence: int) -> MessageRow:
    return MessageRow(thread_id=thread_id, sequence=sequence, author="user", content="A message.")


@pytest.fixture
async def session(tmp_path: Path) -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'messages.db'}")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as opened:
        yield opened
    await engine.dispose()


def test_two_messages_of_a_thread_never_share_a_sequence() -> None:
    engine = sa.create_engine("sqlite://")
    Base.metadata.create_all(engine)
    thread_id = uuid4()
    with Session(engine) as session:
        session.add(_message(thread_id, 1))
        session.flush()
        session.add(_message(thread_id, 1))

        with pytest.raises(IntegrityError):
            session.flush()


async def test_a_message_is_numbered_after_the_last_one(session: AsyncSession) -> None:
    thread_id = uuid4()

    first = await add_message(session, thread_id, lambda n: _message(thread_id, n))
    second = await add_message(session, thread_id, lambda n: _message(thread_id, n))

    assert (first.sequence, second.sequence) == (1, 2)


async def test_a_message_that_finds_its_number_taken_is_written_with_the_next_one(
    session: AsyncSession,
) -> None:
    """Another request wrote number 1 after this one read that the thread had no message."""
    thread_id = uuid4()
    await add_message(session, thread_id, lambda n: _message(thread_id, n))
    read_last = AsyncMock(side_effect=[0, 1])
    asked: list[int] = []

    def build(number: int) -> MessageRow:
        asked.append(number)
        return _message(thread_id, number)

    with patch.object(session, "scalar", read_last):
        written = await add_message(session, thread_id, build)

    assert asked == [1, 2], "number 1 was refused, then the next one was asked for"
    assert written.sequence == 2


def test_the_same_holds_for_the_messages_that_a_run_writes() -> None:
    engine = sa.create_engine("sqlite://")
    Base.metadata.create_all(engine)
    thread_id = uuid4()
    with Session(engine) as session:
        add_message_sync(session, thread_id, lambda n: _message(thread_id, n))
        read_last = patch.object(session, "scalar", side_effect=[0, 1])
        asked: list[int] = []

        def build(number: int) -> MessageRow:
            asked.append(number)
            return _message(thread_id, number)

        with read_last:
            written = add_message_sync(session, thread_id, build)

    assert asked == [1, 2]
    assert written.sequence == 2
