"""Phase D.2 gate over httpx/ASGI: every account endpoint of docs/API.md §5.

Parity with the frontend fixtures: register answers 201 with the user, login
answers 204 and sets the cookie, everything else answers 401 with the
`unauthenticated` code until signed in, and PUT /me/settings replaces the
six server-managed fields with 422 field problems when the body misses them.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import AsyncIterator
from pathlib import Path
from tempfile import gettempdir

import pytest

if TYPE_CHECKING:
    from fastapi import FastAPI

from httpx import ASGITransport, AsyncClient

from khoailanggraph.main import create_app
from khoailanggraph.platform.db import Base, make_async_engine, make_session_factory
from khoailanggraph.settings import Settings

TEST_DB = Path(gettempdir()) / "khoailang-white-box-auth.db"


@pytest.fixture
async def app() -> AsyncIterator[FastAPI]:
    """An app per test on a throwaway SQLite file, tables fresh."""
    TEST_DB.unlink(missing_ok=True)
    url = f"sqlite+aiosqlite:///{TEST_DB}"
    settings = Settings(app_env="test", database_url=url, log_level="WARNING", log_format="json")
    application = create_app(settings)
    engine = make_async_engine(settings)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    application.state.session_factory = make_session_factory(engine)
    try:
        yield application
    finally:
        await engine.dispose()
        TEST_DB.unlink(missing_ok=True)


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    """An httpx client without running the lifespan modules twice."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", headers={"Origin": "http://localhost:3000"}) as http:
        yield http


REGISTER = {"email": "linh.pham@example.com", "password": "secret", "display_name": "Linh Pham"}
SETTINGS_BODY = {
    "theme": "dark",
    "ui_language": "en",
    "default_output_language": "vi",
    "default_run_config": {
        "review_checkpoints": None,
        "max_steps": 100,
        "max_cost_usd": None,
        "parameters": None,
    },
    "notify_on_interrupt": True,
    "notify_on_run_finished": True,
}


async def test_register_answers_201_with_the_user(client: AsyncClient) -> None:
    response = await client.post("/api/v1/auth/register", json=REGISTER)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == REGISTER["email"]
    assert body["display_name"] == REGISTER["display_name"]
    assert body["role"] == "user"
    assert body["status"] == "active"
    assert "password" not in body
    assert "password_hash" not in body


async def test_register_twice_answers_422_field_problem(
    client: AsyncClient,
) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER)
    response = await client.post("/api/v1/auth/register", json=REGISTER)

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_failed"
    assert {"field": "email", "message": "An account with this email exists."} in body["errors"]


async def test_every_protected_endpoint_without_a_session(
    client: AsyncClient,
) -> None:
    response = await client.get("/api/v1/me")

    assert response.status_code == 401
    body = response.json()
    assert body["code"] == "unauthenticated"
    assert response.headers["content-type"].startswith("application/problem+json")

    response = await client.get("/api/v1/anything-unknown")
    assert response.status_code == 401
    assert response.json()["code"] == "unauthenticated"


async def test_validate_qas_problem_details_on_bad_body(client: AsyncClient) -> None:
    response = await client.post("/api/v1/auth/register", json={"email": "not-an-email"})

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_failed"
    assert body["title"] == "Validation failed"


async def test_login_logout_cycle(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER)

    response = await client.post(
        "/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"}
    )
    assert response.status_code == 204
    cookie = response.cookies.get("khoailanggraph_session")
    assert cookie

    me_response = await client.get("/api/v1/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == REGISTER["email"]

    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 204

    me_response = await client.get("/api/v1/me")
    assert me_response.status_code == 401


async def test_login_wrong_password_401(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER)
    response = await client.post(
        "/api/v1/auth/login", json={"email": REGISTER["email"], "password": "wrong"}
    )
    assert response.status_code == 401
    assert response.json()["code"] == "unauthenticated"
    assert response.json()["detail"] == "The email or the password is wrong."


async def test_settings_get_put(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})

    default_settings = await client.get("/api/v1/me/settings")
    assert default_settings.status_code == 200
    body = default_settings.json()
    assert body["theme"] == "dark"
    assert {
        "user_id",
        "theme",
        "ui_language",
        "default_output_language",
        "default_run_config",
        "notify_on_interrupt",
        "notify_on_run_finished",
        "created_at",
        "updated_at",
    } == set(body)

    replaced = await client.put("/api/v1/me/settings", json=SETTINGS_BODY)
    assert replaced.status_code == 200
    assert replaced.json()["default_output_language"] == "vi"
    assert replaced.json()["default_run_config"]["max_steps"] == 100

    again = await client.get("/api/v1/me/settings")
    assert again.json()["default_output_language"] == "vi"


async def test_settings_put_body_422_field_problems(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})

    response = await client.put("/api/v1/me/settings", json={})
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_failed"
    field_names = {item["field"] for item in body["errors"]}
    assert {
        "theme",
        "ui_language",
        "default_output_language",
        "default_run_config",
        "notify_on_interrupt",
        "notify_on_run_finished",
    } <= field_names
