"""Phase A gate: the app factory and the operations endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING

from httpx import ASGITransport, AsyncClient

from khoailanggraph.main import create_app
from khoailanggraph.settings import Settings

if TYPE_CHECKING:
    from fastapi import FastAPI


async def test_health_answers_without_auth(client: AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_ready_answers_when_config_is_loaded(client: AsyncClient) -> None:
    response = await client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


async def test_create_app_has_no_side_effects_between_calls(app: FastAPI) -> None:
    other = create_app(app.state.settings)

    assert other.title == app.title
    assert other.state.settings is app.state.settings


async def test_docs_served_outside_production(app: FastAPI, client: AsyncClient) -> None:
    assert app.state.settings.app_env != "production"

    docs = await client.get("/docs")
    schema = await client.get("/openapi.json")

    assert docs.status_code == 200
    assert schema.status_code == 200
    assert schema.json()["info"]["title"] == "Khoailanggraph API"


async def test_docs_hidden_in_production() -> None:
    """The interactive API surface stays private in production (§security)."""
    production = create_app(
        Settings(
            app_env="production",
            database_url="sqlite+aiosqlite:///:memory:",
            log_level="WARNING",
            log_format="json",
        )
    )
    transport = ASGITransport(app=production)
    async with AsyncClient(transport=transport, base_url="http://test", headers={"Origin": "http://localhost:3000"}) as http:
        assert (await http.get("/docs")).status_code == 404
        assert (await http.get("/redoc")).status_code == 404
        assert (await http.get("/openapi.json")).status_code == 404


async def test_docs_served_in_production_when_enabled() -> None:
    production = create_app(
        Settings(
            app_env="production",
            database_url="sqlite+aiosqlite:///:memory:",
            api_docs_enabled=True,
            log_level="WARNING",
            log_format="json",
        )
    )
    transport = ASGITransport(app=production)
    async with AsyncClient(transport=transport, base_url="http://test", headers={"Origin": "http://localhost:3000"}) as http:
        assert (await http.get("/docs")).status_code == 200
