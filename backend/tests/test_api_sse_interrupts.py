"""Phase D.5 gate: the SSE stream and the interrupt routes (§6, §5)."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from khoailanggraph.features.runs.models import HumanDecisionRow, InterruptRow
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

TEST_DB = Path(gettempdir()) / "khoailang-white-box-sse.db"
REGISTER = {"email": "sse@example.com", "password": "secret", "display_name": "SSE"}
PROJECT_BODY = {"name": "Mentor platform", "description": None, "output_language": "en"}
TASK = "I want to build an online platform for university students to find mentors."


@pytest.fixture
async def app() -> AsyncIterator[FastAPI]:
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


async def _run_once(client: AsyncClient) -> str:
    """Register, sign in, and run the workflow once; returns the run id."""
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    project = await client.post("/api/v1/projects", json=PROJECT_BODY)
    project_id = project.json()["id"]
    thread = await client.post(f"/api/v1/projects/{project_id}/threads")
    response = await client.post(
        f"/api/v1/threads/{thread.json()['id']}/messages", json={"content": TASK}
    )
    return str(response.json()["run"]["id"])


async def _read_stream(client: AsyncClient, run_id: str, after: int = 0) -> list[str]:
    """Read the SSE stream until `done`, returning the raw event lines."""
    lines: list[str] = []
    async with client.stream(
        "GET",
        f"/api/v1/runs/{run_id}/stream",
        params={"after": after},
        timeout=10.0,
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        # A proxy in front of the API must neither compress nor hold the stream.
        assert "no-transform" in response.headers["cache-control"]
        async for chunk in response.aiter_text():
            lines.append(chunk)
    return lines


async def test_stream_replays_all_events_and_closes_after_done(
    client: AsyncClient,
) -> None:
    run_id = await _run_once(client)
    lines = await _read_stream(client, run_id)

    raw = "".join(lines)
    # id, event, data: the three fields of §6 on every event.
    assert "event: node_start" in raw
    assert "event: node_end" in raw
    assert "event: artifact_created" in raw
    assert "event: artifact_delta" in raw
    assert "event: done" in raw
    assert "data: " in raw
    assert "id: " in raw  # event ids carry the sequence

    # done carries the final status (§6).
    assert '"succeeded"' in raw


async def test_stream_resumes_from_after(client: AsyncClient) -> None:
    run_id = await _run_once(client)
    full = "".join(await _read_stream(client, run_id, after=0))
    tail = "".join(await _read_stream(client, run_id, after=120))

    # the stream after 120 contains only the tail: the first events that it
    # replayed start at sequence 121, and the planner node (sequence ~120)
    # never appears in it again.
    assert "planner" not in tail
    assert "event: done" in tail
    assert len(tail) < len(full)


async def test_stream_closes_only_after_done_event(client: AsyncClient) -> None:
    run_id = await _run_once(client)
    lines = await _read_stream(client, run_id)
    raw = "".join(lines)
    # The stream closed itself: aiter completed without timeout, with done.
    assert "event: done" in raw


async def test_a_run_without_reviews_records_the_defaults_it_took(client: AsyncClient) -> None:
    """With no review checkpoint the run does not pause: every checkpoint is recorded as an
    interrupt resolved at once, with a decision that has no user, except a checkpoint with nothing
    under review."""
    run_id = await _run_once(client)
    response = await client.get(f"/api/v1/runs/{run_id}/interrupts")

    assert response.status_code == 200
    items = response.json()["items"]
    # The plan review has no document under review yet, so it records no default.
    assert [entry["node"] for entry in items][:3] == [
        "checkpoint_personas",
        "checkpoint_analysis",
        "checkpoint_spec",
    ]
    assert {entry["status"] for entry in items} == {"resolved"}
    assert all(entry["decision"]["decided_by"] is None for entry in items)
    assert (
        await client.get(f"/api/v1/runs/{run_id}/interrupts", params={"status": "pending"})
    ).json()["items"] == []


async def test_resume_answers_409_when_not_interrupted(client: AsyncClient) -> None:
    run_id = await _run_once(client)
    response = await client.post(
        f"/api/v1/runs/{run_id}/resume",
        json={"interrupt_id": str(uuid4()), "option": "accept"},
    )

    assert response.status_code == 409
    assert response.json()["code"] == "invalid_state"


async def test_cancel_finished_run_answers_409(client: AsyncClient) -> None:
    run_id = await _run_once(client)
    response = await client.post(f"/api/v1/runs/{run_id}/cancel")

    assert response.status_code == 409
    assert response.json()["code"] == "invalid_state"
    assert "The run already succeeded." in response.json()["detail"]


async def test_interrupts_come_oldest_first_with_the_decision_of_a_resolved_one(
    app: FastAPI, client: AsyncClient
) -> None:
    run_id = await _run_once(client)
    options = [
        {
            "key": "approve",
            "label": "Approve",
            "requires_feedback": False,
            "approves": True,
            "is_default": True,
        }
    ]
    async with app.state.session_factory() as session:
        resolved = InterruptRow(
            run_id=UUID(run_id),
            node="checkpoint_personas",
            prompt="Review the personas.",
            options_json=json.dumps(options).encode(),
            allow_edits=True,
            status="resolved",
            created_at=datetime(2020, 1, 1, tzinfo=UTC),
            resolved_at=datetime(2020, 1, 1, 1, tzinfo=UTC),
        )
        pending = InterruptRow(
            run_id=UUID(run_id),
            node="checkpoint_analysis",
            prompt="Review the analysis.",
            created_at=datetime(2020, 1, 2, tzinfo=UTC),
        )
        session.add_all([pending, resolved])
        await session.flush()
        session.add(
            HumanDecisionRow(
                interrupt_id=resolved.id,
                run_id=UUID(run_id),
                option="approve",
                feedback=None,
                answers_json=b"{}",
                created_at=datetime(2020, 1, 1, 1, tzinfo=UTC),
            )
        )
        await session.commit()

    # The run took its default at its own checkpoints; the two rows above are the oldest.
    everything = (await client.get(f"/api/v1/runs/{run_id}/interrupts")).json()["items"][:2]
    waiting = (
        await client.get(f"/api/v1/runs/{run_id}/interrupts", params={"status": "pending"})
    ).json()["items"]

    assert [entry["node"] for entry in everything] == ["checkpoint_personas", "checkpoint_analysis"]
    assert everything[0]["decision"] == {
        "option": "approve",
        "feedback": None,
        "answers": {},
        "decided_by": None,
        "decided_at": everything[0]["resolved_at"],
    }
    assert everything[1]["decision"] is None
    assert [entry["node"] for entry in waiting] == ["checkpoint_analysis"]
    assert everything[0]["review_artifacts"] == []
    assert everything[0]["options"] == options


async def test_a_status_that_no_interrupt_has_is_refused(client: AsyncClient) -> None:
    run_id = await _run_once(client)

    response = await client.get(f"/api/v1/runs/{run_id}/interrupts", params={"status": "open"})

    assert response.status_code == 422
