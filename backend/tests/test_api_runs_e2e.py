"""Phase D.4 gate: send a task, the whole 15-node workflow runs through the
real SQLite sink, and the reads serve what it wrote.

The end-to-end path mirrors what the Sprint C in-process test proves, except
everything crosses HTTP and the database now: POST /threads/{id}/messages
answers 201 {message, run} with the run already completed (the demo executor
is synchronous), GET /runs/{id} shows `succeeded`, the steps and the items
line up with workflow v1, and the trace links (stated_by, evidenced_by,
derived_from, supersedes) are all in place.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

from pathlib import Path
from tempfile import gettempdir
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

if TYPE_CHECKING:
    from fastapi import FastAPI

from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings

TEST_DB = Path(gettempdir()) / "khoailang-white-box-runs.db"

REGISTER = {"email": "runs@example.com", "password": "secret", "display_name": "Runner"}
PROJECT_BODY = {"name": "Mentor platform", "description": None, "output_language": "en"}
TASK = "I want to build an online platform for university students to find mentors."


@pytest.fixture
async def app() -> AsyncIterator[FastAPI]:
    """An app whose SQLite file both engines (async + sync worker) share."""
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
    application.state.sync_engine = make_sync_engine(settings)
    try:
        yield application
    finally:
        await engine.dispose()
        application.state.sync_engine.dispose()
        TEST_DB.unlink(missing_ok=True)


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Origin": "http://localhost:3000"},
    ) as http:
        yield http


async def _setup(client: AsyncClient) -> tuple[str, str]:
    """Register, sign in, create the project, open its conversation."""
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    project = await client.post("/api/v1/projects", json=PROJECT_BODY)
    project_id = project.json()["id"]
    thread = await client.post(f"/api/v1/projects/{project_id}/threads")
    return project_id, thread.json()["id"]


async def test_send_message_runs_the_workflow_end_to_end(
    client: AsyncClient,
) -> None:
    _project_id, thread_id = await _setup(client)

    response = await client.post(f"/api/v1/threads/{thread_id}/messages", json={"content": TASK})

    assert response.status_code == 201, response.text
    body = response.json()
    assert set(body) == {"message", "run"}

    message = body["message"]
    assert message["author"] == "user"
    assert message["content"] == TASK
    assert message["sequence"] == 1
    assert message["artifact_refs"] == []
    assert message["item_refs"] == []

    run = body["run"]
    assert run["status"] == "succeeded", run
    assert run["workflow_name"] == "requirements_engineering"
    assert run["workflow_version"] == 2
    assert run["run_config"]["models"], "per-role models resolved"
    assert run["usage"]["cost_usd"] == 0  # fake provider reports zero tokens
    assert run["step_count"] > 0
    assert run["last_event_id"] > 0

    # The thread now reflects the finished run (§5 GET /threads/{id}).
    thread = await client.get(f"/api/v1/threads/{thread_id}")
    assert thread.json()["current_stage"] == "done"


async def test_runs_read_endpoints_serve_the_walk(
    client: AsyncClient,
) -> None:
    _project_id, thread_id = await _setup(client)
    await client.post(f"/api/v1/threads/{thread_id}/messages", json={"content": TASK})

    runs = await client.get(f"/api/v1/threads/{thread_id}/runs")
    body = runs.json()
    assert runs.status_code == 200
    assert body["next_cursor"] is None
    assert len(body["items"]) == 1
    run_id = body["items"][0]["id"]
    assert body["items"][0]["status"] == "succeeded"

    one = await client.get(f"/api/v1/runs/{run_id}")
    assert one.json()["id"] == run_id

    missing = await client.get(f"/api/v1/runs/{uuid4()}")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "The run does not exist."


async def test_shim_match_runs_wire(client: AsyncClient) -> None:
    """The compat shim: {input} -> {run_id}, the shape today's chat reads."""
    _project_id, thread_id = await _setup(client)
    response = await client.post(f"/api/v1/threads/{thread_id}/runs", json={"input": TASK})

    assert response.status_code == 200
    assert set(response.json()) == {"run_id"}  # contract of mocks/runs.handlers.ts
    run_id = response.json()["run_id"]

    run = await client.get(f"/api/v1/runs/{run_id}")
    assert run.json()["status"] == "succeeded"


async def test_message_validation_problem(client: AsyncClient) -> None:
    _project_id, thread_id = await _setup(client)
    response = await client.post(f"/api/v1/threads/{thread_id}/messages", json={"content": "   "})

    assert response.status_code == 422
    assert response.json()["code"] == "validation_failed"
    assert {"field": "content", "message": "Enter a value."} in response.json()["errors"]


async def test_items_written_by_the_workflow_are_searchable(
    client: AsyncClient,
) -> None:
    """GET /projects/{id}/items finds what the workflow wrote (D.6 preview)."""
    _project_id, thread_id = await _setup(client)
    await client.post(f"/api/v1/threads/{thread_id}/messages", json={"content": TASK})
    project_id = _project_id

    project = await client.get(f"/api/v1/projects/{project_id}")
    counts = project.json()["item_counts"]
    assert counts["persona"] == 3
    assert counts["raw_requirement"] == 9
    assert counts["spec_requirement"] == 6  # 5 + the reworked one superseding REQ-004
    assert counts["backlog_item"] == 5
    assert counts["validation_issue"] == 1  # the failing iteration's issue


async def test_retry_creates_queued_run_with_lineage(client: AsyncClient) -> None:
    """POST /runs/{id}/retry records lineage and queues the new run."""
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    project = await client.post("/api/v1/projects", json=PROJECT_BODY)
    project_id = project.json()["id"]
    thread = await client.post(f"/api/v1/projects/{project_id}/threads")
    message = await client.post(
        f"/api/v1/threads/{thread.json()['id']}/messages", json={"content": TASK}
    )
    run_id = message.json()["run"]["id"]
    steps = await client.get(f"/api/v1/runs/{run_id}/steps")
    step_id = steps.json()["items"][0]["id"]

    retry = await client.post(f"/api/v1/runs/{run_id}/retry", json={"from_step_id": step_id})

    body = retry.json()
    assert retry.status_code == 202
    assert body["retry_of_run_id"] == run_id
    assert body["status"] == "queued"
    assert body["number"] == 2


async def test_retry_rejects_step_of_another_run(client: AsyncClient) -> None:
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    project = await client.post("/api/v1/projects", json=PROJECT_BODY)
    project_id = project.json()["id"]
    thread = await client.post(f"/api/v1/projects/{project_id}/threads")
    message = await client.post(
        f"/api/v1/threads/{thread.json()['id']}/messages", json={"content": TASK}
    )
    run_id = message.json()["run"]["id"]

    other = "00000000-0000-4000-8000-000000000001"
    retry = await client.post(f"/api/v1/runs/{run_id}/retry", json={"from_step_id": other})

    assert retry.status_code == 422
