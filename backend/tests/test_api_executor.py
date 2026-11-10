"""How a run pauses at a review, continues from the answer, and stops: the executor over HTTP."""

from __future__ import annotations

import asyncio
import json as jsonlib
import time
from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from khoailanggraph.features.me.models import UserRow
from khoailanggraph.features.runs import service as runs_service
from khoailanggraph.features.runs.models import DirectiveRow, RunEventRow
from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings, get_settings
from support.api_helpers import REGISTER, TASK

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI

TEST_DB = Path(gettempdir()) / "khoailang-white-box-executor.db"
API = "/api/v1"


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


async def _thread(client: AsyncClient) -> str:
    await client.post(f"{API}/auth/register", json=REGISTER)
    await client.post(f"{API}/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    project = await client.post(f"{API}/projects", json={"name": "Mentors"})
    thread = await client.post(f"{API}/projects/{project.json()['id']}/threads")
    return str(thread.json()["id"])


async def _send(
    client: AsyncClient, thread_id: str, reviews: list[str] | None = None, **extra: Any
) -> dict[str, Any]:
    body: dict[str, Any] = {"content": TASK, **extra}
    if reviews is not None:
        body["run_config"] = {"review_checkpoints": reviews}
    response = await client.post(f"{API}/threads/{thread_id}/messages", json=body)
    assert response.status_code == 201, response.text
    return dict(response.json())


async def _pending(client: AsyncClient, run_id: str) -> dict[str, Any]:
    response = await client.get(f"{API}/runs/{run_id}/interrupts", params={"status": "pending"})
    items = response.json()["items"]
    assert len(items) == 1, items
    return dict(items[0])


async def _resume(client: AsyncClient, run_id: str, interrupt: dict[str, Any], **body: Any) -> Any:
    return await client.post(
        f"{API}/runs/{run_id}/resume", json={"interrupt_id": interrupt["id"], **body}
    )


async def test_a_run_pauses_at_a_review_and_waits_for_the_user(client: AsyncClient) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]

    assert run["status"] == "interrupted"
    interrupt = await _pending(client, run["id"])
    assert interrupt["node"] == "checkpoint_personas"
    assert interrupt["allow_edits"] is True
    assert [ref["kind"] for ref in interrupt["review_artifacts"]] == ["persona_catalog"]
    assert [option["key"] for option in interrupt["options"]] == ["approve", "other"]
    thread = (await client.get(f"{API}/threads/{thread_id}")).json()
    assert thread["active_run_id"] == run["id"]


async def _listen(app: FastAPI, client: AsyncClient, path: str, seconds: float) -> str:
    """What the SSE route sends in `seconds`, read at the ASGI level: a transport of the test
    client waits for the end of a response, which a stream that stays open never has."""
    cookies = "; ".join(f"{cookie.name}={cookie.value}" for cookie in client.cookies.jar)
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": [(b"host", b"testserver"), (b"cookie", cookies.encode())],
        "client": ("127.0.0.1", 1),
        "server": ("testserver", 80),
        "state": {},
    }
    received: list[bytes] = []

    async def receive() -> dict[str, Any]:
        await asyncio.sleep(3600)
        return {"type": "http.disconnect"}

    async def send(message: dict[str, Any]) -> None:
        if message["type"] == "http.response.body":
            received.append(message.get("body", b""))

    try:
        async with asyncio.timeout(seconds):
            await app(scope, receive, send)  # type: ignore[arg-type]
    except TimeoutError:
        pass
    return b"".join(received).decode()


async def test_the_stream_of_a_paused_run_sends_each_event_once_and_stays_open(
    client: AsyncClient, app: FastAPI
) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]

    text = await _listen(app, client, f"{API}/runs/{run['id']}/stream", 1.5)

    ids = [line[4:] for line in text.splitlines() if line.startswith("id: ")]
    assert ids
    assert len(ids) == len(set(ids))
    assert "event: done" not in text
    assert text.count("event: interrupt") == 1


async def test_the_answer_continues_the_run_from_the_chosen_option(client: AsyncClient) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]
    interrupt = await _pending(client, run["id"])

    response = await _resume(client, run["id"], interrupt, option="approve")

    assert response.status_code == 202
    finished = (await client.get(f"{API}/runs/{run['id']}")).json()
    assert finished["status"] == "succeeded"
    resolved = (await client.get(f"{API}/runs/{run['id']}/interrupts")).json()["items"][0]
    assert resolved["status"] == "resolved"
    assert resolved["decision"]["option"] == "approve"
    assert resolved["decision"]["decided_by"] is not None
    catalog = next(
        a
        for a in (await client.get(f"{API}/projects/{run['project_id']}/artifacts")).json()["items"]
        if a["kind"] == "persona_catalog"
    )
    assert catalog["review_status"] == "approved"
    steps = (await client.get(f"{API}/runs/{run['id']}/steps", params={"limit": 200})).json()
    assert steps["items"][0]["usage"]["output_tokens"] > 0
    assert finished["usage"]["output_tokens"] > 0


async def test_a_bad_answer_is_refused_and_a_second_answer_conflicts(client: AsyncClient) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]
    interrupt = await _pending(client, run["id"])

    wrong_option = await _resume(client, run["id"], interrupt, option="nope")
    assert wrong_option.status_code == 422
    assert wrong_option.json()["errors"][0]["field"] == "option"
    unknown = await client.post(
        f"{API}/runs/{run['id']}/resume", json={"interrupt_id": str(uuid4()), "option": "approve"}
    )
    assert unknown.status_code == 404

    assert (await _resume(client, run["id"], interrupt, option="approve")).status_code == 202
    again = await _resume(client, run["id"], interrupt, option="approve")
    assert again.status_code == 409


async def test_rejecting_with_feedback_sends_the_run_back_with_a_directive(
    client: AsyncClient, app: FastAPI
) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_analysis"]))["run"]
    interrupt = await _pending(client, run["id"])
    assert interrupt["node"] == "checkpoint_analysis"

    without = await _resume(client, run["id"], interrupt, option="reject_reanalyse")
    assert without.status_code == 422
    assert without.json()["errors"][0]["field"] == "feedback"

    response = await _resume(
        client, run["id"], interrupt, option="reject_reanalyse", feedback="Merge the duplicates."
    )

    assert response.status_code == 202
    again = (await client.get(f"{API}/runs/{run['id']}")).json()
    assert again["status"] == "interrupted"  # the analyst ran again and the review waits again
    second = await _pending(client, run["id"])
    assert second["id"] != interrupt["id"]
    async with app.state.session_factory() as session:
        directives = (
            await session.scalars(
                select(DirectiveRow).where(DirectiveRow.run_id == UUID(run["id"]))
            )
        ).all()
    human = [d for d in directives if d.human_decision_id is not None]
    assert [d.instruction for d in human] == ["Merge the duplicates."]
    assert human[0].issued_by_step_id is None


async def test_a_run_is_cancelled_while_it_waits(client: AsyncClient, app: FastAPI) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]

    response = await client.post(f"{API}/runs/{run['id']}/cancel")

    assert response.status_code == 202
    assert response.json()["status"] == "cancelled"
    interrupts = (await client.get(f"{API}/runs/{run['id']}/interrupts")).json()["items"]
    assert [entry["status"] for entry in interrupts] == ["cancelled"]
    async with app.state.session_factory() as session:
        done = (
            await session.scalars(
                select(RunEventRow).where(
                    RunEventRow.run_id == UUID(run["id"]), RunEventRow.type == "done"
                )
            )
        ).all()
    assert len(done) == 1
    thread = (await client.get(f"{API}/threads/{thread_id}")).json()
    assert thread["active_run_id"] is None


async def test_the_step_limit_fails_the_run(client: AsyncClient) -> None:
    thread_id = await _thread(client)
    body = await _send(client, thread_id, [])
    assert body["run"]["status"] == "succeeded"
    second_thread = (
        await client.post(f"{API}/projects/{body['run']['project_id']}/threads")
    ).json()["id"]

    response = await client.post(
        f"{API}/threads/{second_thread}/messages",
        json={"content": "More", "run_config": {"max_steps": 2, "review_checkpoints": []}},
    )

    run = response.json()["run"]
    assert run["status"] == "failed"
    assert run["error"]["code"] == "step_limit_exceeded"
    assert run["step_count"] == 2


async def test_a_spent_budget_refuses_new_work(client: AsyncClient, app: FastAPI) -> None:
    thread_id = await _thread(client)
    async with app.state.session_factory() as session:
        user = (await session.scalars(select(UserRow))).one()
        user.monthly_budget_usd = 0.0
        await session.commit()

    response = await client.post(f"{API}/threads/{thread_id}/messages", json={"content": TASK})

    assert response.status_code == 429
    assert response.json()["code"] == "budget_exceeded"


async def test_a_repeated_request_with_the_same_key_gives_the_first_answer(
    client: AsyncClient,
) -> None:
    thread_id = await _thread(client)
    headers = {"Idempotency-Key": "key-1"}
    first = await client.post(
        f"{API}/threads/{thread_id}/messages",
        json={"content": TASK, "run_config": {"review_checkpoints": []}},
        headers=headers,
    )
    second = await client.post(
        f"{API}/threads/{thread_id}/messages",
        json={"content": TASK, "run_config": {"review_checkpoints": []}},
        headers=headers,
    )

    assert first.status_code == second.status_code == 201
    assert first.json() == second.json()
    runs = (await client.get(f"{API}/threads/{thread_id}/runs")).json()["items"]
    assert len(runs) == 1
    other = await client.post(
        f"{API}/projects", json={"name": "x"}, headers=headers
    )  # same key, another request
    assert other.status_code == 422


async def test_a_later_message_starts_a_run_at_the_intent_router(client: AsyncClient) -> None:
    thread_id = await _thread(client)
    first = (await _send(client, thread_id, []))["run"]
    assert first["status"] == "succeeded"

    second = (
        await client.post(
            f"{API}/threads/{thread_id}/messages",
            json={"content": "Also support alumni.", "run_config": {"review_checkpoints": []}},
        )
    ).json()["run"]

    assert second["number"] == 2
    steps = (await client.get(f"{API}/runs/{second['id']}/steps", params={"limit": 200})).json()
    assert steps["items"][0]["node"] == "intent_router"


async def test_a_user_over_the_request_limit_waits(app: FastAPI, client: AsyncClient) -> None:
    app.state.settings = app.state.settings.model_copy(update={"requests_per_minute": 3})
    await _thread(client)  # register and login, then the user is known

    answers = [await client.get(f"{API}/projects") for _ in range(6)]

    limited = [answer for answer in answers if answer.status_code == 429]
    assert limited
    assert limited[0].json()["code"] == "rate_limited"
    assert int(limited[0].headers["Retry-After"]) >= 1


async def test_a_user_edits_while_the_run_waits_and_the_run_goes_on_with_the_edit(
    client: AsyncClient,
) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_analysis"]))["run"]
    interrupt = await _pending(client, run["id"])
    analysis = interrupt["review_artifacts"][0]
    items = (await client.get(f"{API}/artifacts/{analysis['artifact_id']}/items")).json()["items"]
    target = next(item for item in items if item["kind"] == "analyzed_requirement")

    edited = await client.patch(
        f"{API}/items/{target['id']}",
        json={"content": {**target["content"], "statement": "Edited."}},
    )
    assert edited.status_code == 200, edited.text
    assert edited.json()["version"] == target["version"] + 1
    too_far = await _resume(
        client,
        run["id"],
        interrupt,
        option="accept",
        modified_items=[{"item_id": target["id"], "version": 99}],
    )
    assert too_far.status_code == 422

    response = await _resume(
        client,
        run["id"],
        interrupt,
        option="accept",
        modified_items=[{"item_id": target["id"], "version": edited.json()["version"]}],
    )

    assert response.status_code == 202
    assert (await client.get(f"{API}/runs/{run['id']}")).json()["status"] == "succeeded"
    decision = (await client.get(f"{API}/runs/{run['id']}/interrupts")).json()["items"]
    resolved = next(entry for entry in decision if entry["id"] == interrupt["id"])
    assert resolved["decision"]["option"] == "accept"
    # Once the run has moved on, the review is over: edits are refused again.
    late = await client.patch(
        f"{API}/items/{target['id']}", json={"content": {**target["content"], "statement": "Late."}}
    )
    assert late.status_code == 409


async def _events(app: FastAPI, run_id: str, kind: str) -> list[RunEventRow]:
    async with app.state.session_factory() as session:
        return list(
            (
                await session.scalars(
                    select(RunEventRow)
                    .where(RunEventRow.run_id == UUID(run_id), RunEventRow.type == kind)
                    .order_by(RunEventRow.sequence)
                )
            ).all()
        )


async def test_the_text_a_node_generates_and_the_tools_it_calls_are_events(
    client: AsyncClient, app: FastAPI
) -> None:
    run = (await _send(client, await _thread(client), []))["run"]

    tokens = await _events(app, run["id"], "token")
    tools = await _events(app, run["id"], "tool_call")

    assert tokens
    first = jsonlib.loads(tokens[0].data_json)
    assert first["text"]
    assert first["node"] == "planner"
    assert tokens[0].step_id is not None
    assert str(tokens[0].step_id) == first["step_id"]
    called = [jsonlib.loads(event.data_json)["tool"] for event in tools]
    assert "research_search" in called
    search = next(e for e in tools if jsonlib.loads(e.data_json)["tool"] == "research_search")
    assert jsonlib.loads(search.data_json)["args"]["queries"]
    sequences = [event.sequence for event in [*tokens, *tools]]
    assert len(sequences) == len(set(sequences))


async def test_a_step_that_runs_too_long_fails_the_run_with_timeout(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "node_timeout_seconds", 0.0)

    run = (await _send(client, await _thread(client), []))["run"]

    assert run["status"] == "failed"
    assert run["error"]["code"] == "timeout"


async def test_a_tool_that_runs_too_long_fails_the_run_with_timeout(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "tool_timeout_seconds", 0.05)

    def slow(_queries: object) -> list[dict[str, object]]:
        time.sleep(0.5)
        return []

    monkeypatch.setattr(runs_service, "make_research_search", lambda _settings: slow)

    run = (await _send(client, await _thread(client), []))["run"]

    assert run["status"] == "failed"
    assert run["error"]["code"] == "timeout"
    assert "research_search" in run["error"]["message"]


async def test_a_step_keeps_the_notes_it_wrote_and_the_stream_sends_each_one(
    client: AsyncClient, app: FastAPI
) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]

    steps = (await client.get(f"{API}/runs/{run['id']}/steps")).json()["items"]
    planner = next(step for step in steps if step["node"] == "planner")
    text = await _listen(app, client, f"{API}/runs/{run['id']}/stream", 1.5)

    assert [(note["kind"], note["text"]) for note in planner["notes"]] == [
        ("doing", "I listed who the idea affects."),
        ("finding", "The idea does not say who **approves** a session."),
    ]
    assert all(note["created_at"].endswith("Z") for note in planner["notes"])
    assert text.count("event: step_note") == 2
    assert all(step["notes"] == [] for step in steps if step["node"] != "planner")
    # The notes of a step come before its end, and its report comes after them.
    assert text.index("event: step_note") < text.index("event: node_end")


async def test_a_review_fits_the_case_and_asks_what_only_the_user_can_decide(
    client: AsyncClient,
) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]

    interrupt = await _pending(client, run["id"])

    assert interrupt["prompt"].startswith("I proposed the interviewees.")
    (question,) = interrupt["questions"]
    assert question["source"] == "agent"
    assert question["key"] == "focus"
    assert question["default_answer"]["choice_keys"] == ["students"]
    assert [choice["key"] for choice in question["choices"]] == ["students", "mentors", "other"]


async def test_the_answers_to_the_questions_of_the_agent_are_checked_and_continue_the_run(
    client: AsyncClient,
) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]
    interrupt = await _pending(client, run["id"])

    refused = await _resume(
        client,
        run["id"],
        interrupt,
        option="approve",
        answers={"focus": {"choice_keys": ["other"], "text": None, "number": None}},
    )
    accepted = await _resume(
        client,
        run["id"],
        interrupt,
        option="approve",
        answers={"focus": {"choice_keys": ["mentors"], "text": None, "number": None}},
    )

    assert refused.status_code == 422
    assert accepted.status_code == 202
    decision = (await client.get(f"{API}/runs/{run['id']}/interrupts")).json()["items"][0][
        "decision"
    ]
    assert decision["answers"]["focus"]["choice_keys"] == ["mentors"]


async def test_something_else_needs_words_and_goes_to_the_intent_router_as_a_message(
    client: AsyncClient,
) -> None:
    thread_id = await _thread(client)
    run = (await _send(client, thread_id, ["checkpoint_personas"]))["run"]
    interrupt = await _pending(client, run["id"])
    other = next(option for option in interrupt["options"] if option["key"] == "other")

    refused = await _resume(client, run["id"], interrupt, option="other")
    accepted = await _resume(
        client,
        run["id"],
        interrupt,
        option="other",
        feedback="Also interview a librarian.",
    )

    assert other["requires_feedback"] is True
    assert other["approves"] is False
    assert refused.status_code == 422
    assert accepted.status_code == 202
    messages = (await client.get(f"{API}/threads/{thread_id}/messages")).json()["items"]
    said = [message for message in messages if message["content"] == "Also interview a librarian."]
    assert [message["author"] for message in said] == ["user"]
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        steps = (await client.get(f"{API}/runs/{run['id']}/steps")).json()["items"]
        if any(step["node"] == "intent_router" for step in steps):
            break
        await asyncio.sleep(0.5)
    assert any(step["node"] == "intent_router" for step in steps)
