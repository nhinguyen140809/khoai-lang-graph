"""Database engine, sessions and the declarative base (platform layer).

Dev defaults to SQLite (zero setup: a file under backend/data); production
points `DATABASE_URL` at PostgreSQL. Tests use per-engine URLs — a shared
async engine serves the API and the runner threads get *sync* engines on the
same database, so the workflow can write its steps, events and artifacts
from one thread while the API keeps reading (SQLite in WAL mode handles the
mix; the run executor serializes its own writes).
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import TYPE_CHECKING

from sqlalchemy import Engine, MetaData, create_engine, event, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from khoailanggraph.settings import Settings

NAMING_CONVENTIONS = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Every ORM model of the features inherits this base."""

    metadata = MetaData(naming_convention=NAMING_CONVENTIONS)


def async_database_url(settings: Settings) -> str:
    """The URL rows travel over for the API layer (async drivers only).

    A plain `sqlite:///` DATABASE_URL becomes `sqlite+aiosqlite:///` here, so
    zero-setup dev URLs keep working with the async engine.
    """
    url = settings.database_url
    if url.startswith("sqlite:///"):
        path = Path(url.removeprefix("sqlite:///"))
        if ":memory:" not in str(path):
            path.parent.mkdir(parents=True, exist_ok=True)
        return "sqlite+aiosqlite:///" + url.removeprefix("sqlite:///")
    return url


async def ensure_schema(engine: AsyncEngine) -> None:
    """Create every registered table that is missing (dev/test only).

    The lifespan calls this when `app_env` is local or test: SQLite needs no
    migration step and tests start from an empty file. Production (Postgres)
    runs `alembic upgrade head` instead (backend/README).
    """
    async with engine.begin() as conn:
        exists = await conn.scalar(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        )
        if exists is None:
            await conn.run_sync(Base.metadata.create_all)


def sync_database_url(settings: Settings) -> str:
    """The same database through the sync driver (workflow worker threads)."""
    url = settings.database_url
    if url.startswith("sqlite+aiosqlite:///"):
        return "sqlite:///" + url.removeprefix("sqlite+aiosqlite:///")
    if url.startswith("sqlite:///"):
        return url
    if url.startswith("postgresql+asyncpg://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql+asyncpg://")
    return url


def make_async_engine(settings: Settings) -> AsyncEngine:
    """The process-wide async engine; SQLite runs in WAL for mixed access."""
    engine = create_async_engine(async_database_url(settings), echo=False)
    if settings.database_url.startswith("sqlite"):

        @event.listens_for(engine.sync_engine, "connect")
        def _set_wal(dbapi_connection: object, _record: object) -> None:
            cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA busy_timeout=15000")
            cursor.close()

    return engine


def make_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Request/session factory for the API layer."""
    return async_sessionmaker(engine, expire_on_commit=False)


def make_sync_engine(settings: Settings) -> Engine:
    """A sync engine on the same database, for the runner thread."""
    engine = create_engine(sync_database_url(settings), echo=False)
    if settings.database_url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def _set_wal_sync(dbapi_connection: object, _record: object) -> None:
            cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA busy_timeout=15000")
            cursor.close()

    return engine


def make_sync_session_factory(engine: Engine) -> sessionmaker[Session]:
    """A Session factory bound to a sync engine (used by the executor)."""
    return sessionmaker(engine, expire_on_commit=False)


@asynccontextmanager
async def session_scope(
    factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    """One committed-or-rolled-back session, for request handlers."""
    session = factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
