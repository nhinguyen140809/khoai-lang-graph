"""The assistant over HTTP: a message about the application is answered, a message about the work
starts a run, and nothing about the application touches the workflow."""

from __future__ import annotations

import json
from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING, Any
from unittest.mock import patch
from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

import khoailanggraph.llm.factory as llm_factory
from khoailanggraph.agents import prompts as prompt_loader
from khoailanggraph.agents.requirements_engineering import definition as workflow
from khoailanggraph.features.artifacts.models import ArtifactItemRow, ArtifactRow
from khoailanggraph.features.assistant.service import (
    ASSISTANT_PROMPT_VERSION,
    PROMPTS_PACKAGE,
)
from khoailanggraph.llm import reset_model_cache
from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings
from support.api_helpers import REGISTER, TASK
from support.fake_data import DemoData

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI

TEST_DB = Path(gettempdir()) / "khoailang-white-box-assistant.db"
API = "/api/v1"

# What the scripted assistant answers. A test sets it before sending the message.
ANSWER: dict[str, Any] = {"kind": "workflow", "text": "", "commands": []}
# The steps the scripted assistant makes before its answer, and the prompts it was given.
STEPS: list[dict[str, Any]] = []
SEEN: list[str] = []


class AssistantData(DemoData):
    """The demo dataset, with the assistant answering what the test asked for."""

    @staticmethod
    def AssistantDecision(  # noqa: N802 - the name is the schema the model answers
        system: str, user: str, call_number: int
    ) -> dict[str, Any]:
        return dict(ANSWER)

    @staticmethod
    def AssistantStep(  # noqa: N802 - the name is the schema the model answers
        system: str, user: str, call_number: int
    ) -> dict[str, Any]:
        """A step of the scripted loop: the queued reads first, then the answer."""
        SEEN.append(user)
        if STEPS:
            return STEPS.pop(0)
        return {"tool": None, "key": None, "answer": dict(ANSWER)}


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


@pytest.fixture
async def project_and_thread(client: AsyncClient) -> tuple[str, str]:
    await client.post(f"{API}/auth/register", json=REGISTER)
    await client.post(f"{API}/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    project = await client.post(f"{API}/projects", json={"name": "Mentors"})
    thread = await client.post(f"{API}/projects/{project.json()['id']}/threads")
    return str(project.json()["id"]), str(thread.json()["id"])


def _assistant(**answer: Any) -> Any:
    """Answer the next messages with this decision, from a model that nothing else reaches."""
    ANSWER.clear()
    ANSWER.update({"kind": "workflow", "text": "", "commands": [], **answer})
    STEPS.clear()
    SEEN.clear()
    return patch.object(llm_factory, "make_demo_data", lambda _name: AssistantData())


async def _send(client: AsyncClient, thread_id: str, content: str, **headers: Any) -> Any:
    return await client.post(
        f"{API}/threads/{thread_id}/messages", json={"content": content}, headers=headers
    )


async def test_a_message_about_the_application_is_answered_without_a_run(
    client: AsyncClient, project_and_thread: tuple[str, str]
) -> None:
    project_id, thread_id = project_and_thread
    with _assistant(kind="general", text="You can read the interviews first."):
        reset_model_cache()
        response = await _send(client, thread_id, "Which document should I read first?")

    assert response.status_code == 201
    body = response.json()
    assert body["run"] is None
    assert body["assistant"]["text"] == "You can read the interviews first."
    assert body["assistant"]["commands"] == []
    assert body["message"]["delivery"] == "delivered"

    runs = (await client.get(f"{API}/threads/{thread_id}/runs")).json()["items"]
    assert runs == [], "a question about the application starts no run"

    messages = (await client.get(f"{API}/threads/{thread_id}/messages")).json()["items"]
    assert [(entry["author"], entry["agent_role"]) for entry in messages] == [
        ("user", None),
        ("agent", "assistant"),
    ], "the answer is stored with the conversation and survives a reload"

    project = (await client.get(f"{API}/projects/{project_id}")).json()
    assert project["initial_message_id"] is None, "an answered question is not the project's idea"


async def test_a_message_about_the_work_starts_a_run(
    client: AsyncClient, project_and_thread: tuple[str, str]
) -> None:
    _project_id, thread_id = project_and_thread
    with _assistant(kind="workflow"):
        reset_model_cache()
        response = await _send(client, thread_id, TASK)

    body = response.json()
    assert body["run"] is not None
    assert body["assistant"] is None
    assert body["run"]["status"] in {"queued", "running", "succeeded", "interrupted"}


async def test_a_command_that_names_another_projects_document_is_dropped(
    client: AsyncClient, project_and_thread: tuple[str, str]
) -> None:
    _project_id, thread_id = project_and_thread
    with _assistant(
        kind="general",
        text="Opening the plan.",
        commands=[
            {"command": "open_document", "artifact_id": "11111111-1111-4111-8111-111111111111"}
        ],
    ):
        reset_model_cache()
        response = await _send(client, thread_id, "Open the plan")

    assert response.json()["assistant"]["commands"] == [], "an id outside the project never leaves"


async def test_a_command_that_is_not_in_the_catalog_is_dropped(
    client: AsyncClient, project_and_thread: tuple[str, str]
) -> None:
    _project_id, thread_id = project_and_thread
    with _assistant(
        kind="general",
        text="Here are the settings.",
        commands=[{"command": "send_to_workflow"}, {"command": "open_settings"}],
    ):
        reset_model_cache()
        response = await _send(client, thread_id, "Show me the settings")

    kept = response.json()["assistant"]["commands"]
    assert [entry["command"] for entry in kept] == ["open_settings"], (
        "a key that the catalog does not list never leaves, and one that needs nothing does"
    )


async def test_the_prompt_lists_the_commands_of_the_catalog(
    client: AsyncClient, project_and_thread: tuple[str, str]
) -> None:
    _project_id, thread_id = project_and_thread
    with _assistant(kind="workflow"):
        reset_model_cache()
        await _send(client, thread_id, TASK)

    seen = "\n".join(SEEN)
    for key in workflow.command_catalog():
        assert f"`{key}`" in seen, f"the prompt does not list the command {key}"


async def test_a_repeated_request_answers_once(
    client: AsyncClient, project_and_thread: tuple[str, str]
) -> None:
    _project_id, thread_id = project_and_thread
    key = {"Idempotency-Key": "k1"}
    with _assistant(kind="general", text="The cost limit stops a run that spends too much."):
        reset_model_cache()
        first = await _send(client, thread_id, "What is the cost limit?", **key)
        second = await _send(client, thread_id, "What is the cost limit?", **key)

    assert first.status_code == second.status_code == 201
    assert first.json() == second.json()
    messages = (await client.get(f"{API}/threads/{thread_id}/messages")).json()["items"]
    assert len(messages) == 2, "the replay stores no second answer"


async def test_the_prompt_of_the_assistant_loads() -> None:
    prompt = prompt_loader.load_prompt(PROMPTS_PACKAGE, "assistant", ASSISTANT_PROMPT_VERSION)
    assert prompt.role == "assistant"
    assert {item.name for item in prompt.inputs} >= {"message", "documents", "settings", "tools"}


async def test_a_read_comes_back_before_the_answer(
    app: FastAPI, client: AsyncClient, project_and_thread: tuple[str, str]
) -> None:
    """The model asks for one item, reads it, and answers from what it read."""
    project_id, thread_id = project_and_thread
    spec_id = await _seed_item(app, project_id)
    answer = {"kind": "general", "text": "REQ-003 shows the review round."}
    with _assistant(**answer):
        STEPS.append({"tool": "read_item", "key": "REQ-003"})
        reset_model_cache()
        response = await _send(client, thread_id, "What does REQ-003 say?")

    assert response.status_code == 201
    assert response.json()["assistant"]["text"] == "REQ-003 shows the review round."
    assert len(SEEN) == 2, "one step names the read, the next one answers"
    assert "REQ-003 (spec_requirement), id " in SEEN[-1], (
        "the tool result reaches the prompt of the next step"
    )
    assert spec_id is not None

    messages = (await client.get(f"{API}/threads/{thread_id}/messages")).json()["items"]
    answer_message = messages[-1]
    assert answer_message["agent_role"] == "assistant"
    assert [ref["key"] for ref in answer_message["item_refs"]] == ["REQ-003"], (
        "the answer names the item it was read from"
    )
    assert messages[0]["item_refs"] == [], "the question names nothing"


async def test_the_message_is_counted_where_the_budget_reads(
    client: AsyncClient, project_and_thread: tuple[str, str]
) -> None:
    """An answered message costs tokens that no run holds, so the usage view must show them."""
    _project_id, thread_id = project_and_thread
    with _assistant(kind="general", text="The limit is 80 steps."):
        reset_model_cache()
        await _send(client, thread_id, "How many steps may a run take?")

    usage = (await client.get(f"{API}/me/usage?group_by=agent_role")).json()
    assert usage["total"]["input_tokens"] > 0
    assert [group["key"] for group in usage["groups"]] == ["assistant"]


async def _seed_item(app: FastAPI, project_id: str) -> str:
    """One specification with one item, as a finished run would leave behind."""
    factory = app.state.session_factory
    async with factory() as session:
        artifact = ArtifactRow(
            project_id=UUID(project_id),
            kind="requirement_specification",
            title="Requirement specification",
            version=1,
            content_json=b"{}",
        )
        session.add(artifact)
        await session.flush()
        session.add(
            ArtifactItemRow(
                artifact_id=artifact.id,
                project_id=UUID(project_id),
                kind="spec_requirement",
                key="REQ-003",
                content_json=json.dumps(
                    {"title": "Show the review round", "priority": "must"}
                ).encode("utf-8"),
                version=4,
            )
        )
        await session.commit()
        return str(artifact.id)
