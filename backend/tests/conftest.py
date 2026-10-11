"""Shared pytest fixtures."""

from __future__ import annotations

import os

# Hermetic suite: scripted keyless models, no gateway reads, whatever the
# developer's backend/.env contains (real env vars outrank the dotenv file).
os.environ["DEMO_MODE"] = "true"
os.environ.pop("OPENAI_API_KEY", None)
os.environ.pop("OPENAI_BASE_URL", None)

from typing import TYPE_CHECKING

import pytest
from httpx import ASGITransport, AsyncClient

from khoailanggraph.main import create_app
from khoailanggraph.settings import Settings

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI


@pytest.fixture
def app() -> FastAPI:
    """An app per test with a throwaway SQLite database and console logs."""
    return create_app(
        Settings(
            app_env="test",
            database_url="sqlite+aiosqlite:///:memory:",
            log_level="WARNING",
            log_format="json",
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
