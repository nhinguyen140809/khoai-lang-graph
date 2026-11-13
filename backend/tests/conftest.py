"""Shared pytest fixtures."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import pytest
from httpx import ASGITransport, AsyncClient

from khoailanggraph.llm import factory as llm_factory
from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings, get_settings
from support.hermetic import install_fake_provider

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Iterator
    from pathlib import Path

    from fastapi import FastAPI

# Hermetic suite: no gateway reads whatever the developer's backend/.env
# contains (real env vars outrank the dotenv file), and the scripted
# provider answers every run before any test starts. DECISION_PROVIDER is
# SET (not popped) — an explicit env var beats the .env file in
# decisions.py, so a developer's live DECISION_PROVIDER=llm cannot leak
# real gateway calls into the suite.
os.environ.pop("OPENAI_API_KEY", None)
os.environ.pop("OPENAI_BASE_URL", None)
os.environ["DECISION_PROVIDER"] = "off"
# Runs finish inside the request and pause at no review, so a test sees the whole run at once.
os.environ["RUN_EXECUTION"] = "inline"
os.environ["DEFAULT_REVIEW_CHECKPOINTS"] = "[]"
get_settings.cache_clear()
install_fake_provider()


@pytest.fixture(autouse=True)
def fresh_models() -> Iterator[None]:
    """Each test starts with fresh scripted models (fresh call counters)."""
    llm_factory.reset_model_cache()
    yield
    llm_factory.reset_model_cache()


@pytest.fixture
def app() -> FastAPI:
    """An app per test with a throwaway SQLite database and console logs."""
    return create_app(
        Settings(
            app_env="test",
            database_url="sqlite+aiosqlite:///:memory:",
            log_level="WARNING",
            log_format="json",
            run_execution="inline",
            default_review_checkpoints=[],
        )
    )


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    """An httpx client bound to the app, running the lifespan."""
    transport = ASGITransport(app=app)
    async with (
        app.router.lifespan_context(app),
        AsyncClient(transport=transport, base_url="http://test") as http,
    ):
        yield http


@pytest.fixture
async def file_app(tmp_path: Path) -> AsyncIterator[FastAPI]:
    """An app on a database file, so the runs of the executor (sync engine) and the requests
    (async engine) see the same rows."""
    settings = Settings(
        app_env="test",
        database_url=f"sqlite+aiosqlite:///{tmp_path / 'test.db'}",
        log_level="WARNING",
        log_format="json",
    )
    application = create_app(settings)
    engine = make_async_engine(settings)
    await ensure_schema(engine)
    application.state.session_factory = make_session_factory(engine)
    application.state.sync_engine = make_sync_engine(settings)
    try:
        yield application
    finally:
        await engine.dispose()
        application.state.sync_engine.dispose()


@pytest.fixture
async def file_client(file_app: FastAPI) -> AsyncIterator[AsyncClient]:
    """A client of `file_app` that sends the origin of the web app."""
    transport = ASGITransport(app=file_app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Origin": "http://localhost:3000"},
    ) as http:
        yield http
