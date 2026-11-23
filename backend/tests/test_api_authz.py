"""A resource of one account answers 404 to another account (docs/API.md §3).

Every route that addresses a project, a thread, a run, an artifact, an item, a document or an
export by id resolves it for the signed-in user only. A foreign id is indistinguishable from a
missing one, so an id cannot be used to learn that the resource exists.
"""

from __future__ import annotations

from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING

import pytest
from httpx import ASGITransport, AsyncClient

from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI

TEST_DB = Path(gettempdir()) / "khoailang-authz.db"
ORIGIN = {"Origin": "http://localhost:3000"}
OWNER = {"email": "owner@example.com", "password": "secret", "display_name": "Owner"}
OTHER = {"email": "other@example.com", "password": "secret", "display_name": "Other"}
IDEA = "A platform where students find mentors."


@pytest.fixture
async def app() -> AsyncIterator[FastAPI]:
    TEST_DB.unlink(missing_ok=True)
    settings = Settings(
        app_env="test",
        database_url=f"sqlite+aiosqlite:///{TEST_DB}",
        log_level="WARNING",
        log_format="json",
        run_execution="inline",
        default_review_checkpoints=[],
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
        TEST_DB.unlink(missing_ok=True)


def _client(app: FastAPI) -> AsyncClient:
    return AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver", headers=ORIGIN
    )


async def _signed_in(app: FastAPI, who: dict[str, str]) -> AsyncClient:
    client = _client(app)
    await client.post("/api/v1/auth/register", json=who)
    await client.post(
        "/api/v1/auth/login", json={"email": who["email"], "password": who["password"]}
    )
    return client


async def _owned_project(client: AsyncClient) -> dict[str, object]:
    """A project with a thread, a finished run and the items it wrote."""
    project = (await client.post("/api/v1/projects", json={"name": "Owned"})).json()
    project_id = str(project["id"])
    thread = (await client.post(f"/api/v1/projects/{project_id}/threads")).json()
    thread_id = str(thread["id"])
    await client.post(f"/api/v1/threads/{thread_id}/messages", json={"content": IDEA})
    runs = (await client.get(f"/api/v1/threads/{thread_id}/runs")).json()["items"]
    artifacts = (await client.get(f"/api/v1/projects/{project_id}/artifacts")).json()["items"]
    items = (await client.get(f"/api/v1/projects/{project_id}/items")).json()["items"]
    return {
        "project": project_id,
        "thread": thread_id,
        "run": str(runs[0]["id"]),
        "artifact": str(artifacts[0]["id"]),
        "item": str(items[0]["id"]),
    }


async def test_a_project_of_another_user_is_not_found(app: FastAPI) -> None:
    owner = await _signed_in(app, OWNER)
    other = await _signed_in(app, OTHER)
    ids = await _owned_project(owner)

    response = await other.get(f"/api/v1/projects/{ids['project']}")

    assert response.status_code == 404
    assert response.json()["code"] == "not_found"
    assert (await owner.get(f"/api/v1/projects/{ids['project']}")).status_code == 200
    await owner.aclose()
    await other.aclose()


async def test_the_lists_of_a_foreign_project_are_not_found(app: FastAPI) -> None:
    owner = await _signed_in(app, OWNER)
    other = await _signed_in(app, OTHER)
    ids = await _owned_project(owner)
    project_id = ids["project"]

    for path in (
        f"/api/v1/projects/{project_id}/threads",
        f"/api/v1/projects/{project_id}/artifacts",
        f"/api/v1/projects/{project_id}/items",
        f"/api/v1/projects/{project_id}/trace-links",
        f"/api/v1/projects/{project_id}/traceability/matrix",
        f"/api/v1/projects/{project_id}/documents",
        f"/api/v1/projects/{project_id}/exports",
    ):
        response = await other.get(str(path))
        assert response.status_code == 404, path
    await owner.aclose()
    await other.aclose()


async def test_a_thread_run_artifact_and_item_of_another_user_are_not_found(
    app: FastAPI,
) -> None:
    owner = await _signed_in(app, OWNER)
    other = await _signed_in(app, OTHER)
    ids = await _owned_project(owner)

    for path in (
        f"/api/v1/threads/{ids['thread']}",
        f"/api/v1/threads/{ids['thread']}/messages",
        f"/api/v1/threads/{ids['thread']}/runs",
        f"/api/v1/runs/{ids['run']}",
        f"/api/v1/runs/{ids['run']}/steps",
        f"/api/v1/runs/{ids['run']}/state",
        f"/api/v1/runs/{ids['run']}/interrupts",
        f"/api/v1/artifacts/{ids['artifact']}",
        f"/api/v1/artifacts/{ids['artifact']}/items",
        f"/api/v1/artifacts/{ids['artifact']}/revisions",
        f"/api/v1/artifacts/{ids['artifact']}/trace",
        f"/api/v1/items/{ids['item']}",
        f"/api/v1/items/{ids['item']}/revisions",
        f"/api/v1/items/{ids['item']}/trace",
    ):
        response = await other.get(str(path))
        assert response.status_code == 404, path
    await owner.aclose()
    await other.aclose()


async def test_writing_in_a_foreign_project_is_not_found(app: FastAPI) -> None:
    owner = await _signed_in(app, OWNER)
    other = await _signed_in(app, OTHER)
    ids = await _owned_project(owner)

    patched_project = await other.patch(
        f"/api/v1/projects/{ids['project']}", json={"name": "Mine now"}
    )
    patched_item = await other.patch(f"/api/v1/items/{ids['item']}", json={"content": {}})
    deleted_item = await other.delete(f"/api/v1/items/{ids['item']}")
    sent = await other.post(f"/api/v1/threads/{ids['thread']}/messages", json={"content": "Hello"})
    deleted_project = await other.delete(f"/api/v1/projects/{ids['project']}")

    for response in (patched_project, patched_item, deleted_item, sent, deleted_project):
        assert response.status_code == 404, response.text
    still_there = await owner.get(f"/api/v1/projects/{ids['project']}")
    assert still_there.status_code == 200
    await owner.aclose()
    await other.aclose()
