"""Phase D.3 gate over httpx/ASGI: projects and threads of docs/API.md §5."""

from __future__ import annotations

from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
)
from khoailanggraph.settings import Settings

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI

TEST_DB = Path(gettempdir()) / "khoailang-white-box-projects.db"

REGISTER = {"email": "d3@example.com", "password": "secret", "display_name": "Project Owner"}
PROJECT_BODY = {"name": "Mentor platform", "description": "Find mentors", "output_language": "en"}


@pytest.fixture
async def app() -> AsyncIterator[FastAPI]:
    """An app per test on a throwaway SQLite file, tables already present."""
    TEST_DB.unlink(missing_ok=True)
    settings = Settings(
        app_env="test",
        database_url=f"sqlite+aiosqlite:///{TEST_DB}",
        log_level="WARNING",
        log_format="json",
    )
    application = create_app(settings)
    engine = make_async_engine(settings)
    await ensure_schema(engine)
    application.state.session_factory = make_session_factory(engine)
    try:
        yield application
    finally:
        await engine.dispose()
        TEST_DB.unlink(missing_ok=True)


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http


@pytest.fixture
async def signed_in(client: AsyncClient) -> AsyncClient:
    """A client that registered and signed in once."""
    await client.post("/api/v1/auth/register", json=REGISTER)
    response = await client.post(
        "/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"}
    )
    assert response.status_code == 204
    return client


async def test_projects_empty_then_create(signed_in: AsyncClient) -> None:
    listing = await signed_in.get("/api/v1/projects")
    body = listing.json()
    assert listing.status_code == 200
    assert body["items"] == []
    assert body["next_cursor"] is None
    assert set(body) == {"items", "next_cursor"}


async def test_create_project_returns_201_location_full_shape(
    signed_in: AsyncClient,
) -> None:
    response = await signed_in.post("/api/v1/projects", json=PROJECT_BODY)

    assert response.status_code == 201
    location = response.headers["location"]
    assert location == f"/api/v1/projects/{response.json()['id']}"
    body = response.json()
    assert set(body) == {
        "id",
        "owner_id",
        "name",
        "description",
        "status",
        "output_language",
        "run_config",
        "initial_message_id",
        "model_overrides",
        "item_counts",
        "unfinished_run_counts",
        "last_activity_at",
        "created_at",
        "updated_at",
    }
    assert body["name"] == "Mentor platform"
    assert body["status"] == "active"
    assert body["run_config"] == {
        "review_checkpoints": None,
        "max_steps": None,
        "max_cost_usd": None,
        "parameters": None,
    }
    assert body["model_overrides"] == {}
    assert body["item_counts"] == {}
    assert body["unfinished_run_counts"] == {"queued": 0, "running": 0, "interrupted": 0}
    assert body["last_activity_at"] is not None
    assert body["initial_message_id"] is None
    assert body["created_at"] is not None
    assert body["updated_at"] is not None


async def test_create_project_blank_name_422(signed_in: AsyncClient) -> None:
    response = await signed_in.post(
        "/api/v1/projects", json={"name": "   ", "output_language": "en"}
    )

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_failed"
    assert {"field": "name", "message": "Enter a name."} in body["errors"]


async def test_get_project_404(signed_in: AsyncClient) -> None:
    missing = uuid4()
    response = await signed_in.get(f"/api/v1/projects/{missing}")

    assert response.status_code == 404
    assert response.json()["code"] == "not_found"
    assert response.json()["detail"] == "The project does not exist."


async def test_thread_lifecycle_matches_frontend_contract(
    signed_in: AsyncClient,
) -> None:
    created = await signed_in.post("/api/v1/projects", json=PROJECT_BODY)
    project_id = created.json()["id"]

    threads = await signed_in.get(f"/api/v1/projects/{project_id}/threads")
    assert threads.status_code == 200
    assert threads.json()["items"] == []

    response = await signed_in.post(f"/api/v1/projects/{project_id}/threads")
    assert response.status_code == 201
    assert response.headers["location"] == f"/api/v1/threads/{response.json()['id']}"
    thread = response.json()
    assert set(thread) == {
        "id",
        "project_id",
        "created_by",
        "title",
        "status",
        "current_stage",
        "active_run_id",
        "active_run_status",
        "last_message_at",
        "created_at",
        "updated_at",
    }
    assert thread["title"] is None
    assert thread["current_stage"] is None
    assert thread["active_run_id"] is None
    assert thread["active_run_status"] is None

    listing = await signed_in.get(f"/api/v1/projects/{project_id}/threads")
    assert listing.json()["items"][0]["id"] == thread["id"]

    one = await signed_in.get(f"/api/v1/threads/{thread['id']}")
    assert one.status_code == 200
    assert one.json()["id"] == thread["id"]


async def test_threads_of_missing_project_404(signed_in: AsyncClient) -> None:
    missing = uuid4()
    list_response = await signed_in.get(f"/api/v1/projects/{missing}/threads")
    create_response = await signed_in.post(f"/api/v1/projects/{missing}/threads")

    assert list_response.status_code == 404
    assert create_response.status_code == 404
    assert list_response.json()["detail"] == "The project does not exist."


async def test_projects_archived_filter(signed_in: AsyncClient) -> None:
    await signed_in.post("/api/v1/projects", json=PROJECT_BODY)
    missing = await signed_in.get("/api/v1/projects?status=archived")

    assert missing.status_code == 200
    assert missing.json()["items"] == []
