"""The assistant end to end: a project that a real run filled, a scripted model that reads the
prompt it is given, the real reads over the real database, and the answers as the API gives them.

Nothing here scripts an answer for a test. The model asks for the reads that its message calls
for, answers from what they bring back and names the commands that the question needs, as the
real one is told to, so what is checked is the whole chain: the decision, the reads, the run of
the assistance workflow that records them, the references of the answer and the commands that the
client may run.
"""

from __future__ import annotations

from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING, Any
from uuid import UUID

import pytest
import sqlalchemy as sa
from httpx import ASGITransport, AsyncClient

from khoailanggraph.features.artifacts.models import ArtifactItemRow, ArtifactRow
from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings
from support.api_helpers import TASK, open_review, seeded_run

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI

TEST_DB = Path(gettempdir()) / "khoailang-white-box-assistant-e2e.db"
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


@pytest.fixture
async def worked_project(client: AsyncClient) -> tuple[str, str]:
    """A project whose requirements workflow ran to its end: its documents and items exist."""
    return await seeded_run(client)


async def _ask(client: AsyncClient, thread_id: str, content: str) -> dict[str, Any]:
    response = await client.post(f"{API}/threads/{thread_id}/messages", json={"content": content})
    assert response.status_code == 201, response.text
    return dict(response.json())


async def _answer_text(client: AsyncClient, thread_id: str) -> str:
    """The words of the last message of the thread: the answer, as it is stored with the run."""
    messages = (await client.get(f"{API}/threads/{thread_id}/messages")).json()["items"]
    return str(messages[-1]["content"])


async def _steps(client: AsyncClient, run_id: str) -> list[dict[str, Any]]:
    return list((await client.get(f"{API}/runs/{run_id}/steps")).json()["items"])


async def _first_item_key(app: FastAPI, project_id: str) -> str:
    async with app.state.session_factory() as session:
        key = await session.scalar(
            sa.select(ArtifactItemRow.key)
            .where(
                ArtifactItemRow.project_id == UUID(project_id),
                ArtifactItemRow.kind == "spec_requirement",
            )
            .order_by(ArtifactItemRow.key)
        )
    assert key is not None, "the run left no requirement behind"
    return str(key)


async def _specification_id(app: FastAPI, project_id: str) -> str:
    async with app.state.session_factory() as session:
        found = await session.scalar(
            sa.select(ArtifactRow.id).where(
                ArtifactRow.project_id == UUID(project_id),
                ArtifactRow.kind == "requirement_specification",
            )
        )
    assert found is not None
    return str(found)


async def test_a_question_about_an_item_is_answered_from_a_read_of_it(
    app: FastAPI, client: AsyncClient, worked_project: tuple[str, str]
) -> None:
    project_id, thread_id = worked_project
    key = await _first_item_key(app, project_id)

    body = await _ask(client, thread_id, f"What does {key} say?")

    run = body["run"]
    assert run["workflow_name"] == "assistance"
    assert run["status"] == "succeeded"
    assert key in await _answer_text(client, thread_id), "it comes from what the read brought back"
    step = (await _steps(client, run["id"]))[0]
    assert [(note["kind"], note["tool"]) for note in step["notes"]] == [("tool", "read_item")]
    assert key in step["notes"][0]["text"], "the note names what was read"
    messages = (await client.get(f"{API}/threads/{thread_id}/messages")).json()["items"]
    answer = messages[-1]
    assert (answer["agent_role"], answer["run_id"]) == ("assistant", run["id"])
    assert [ref["key"] for ref in answer["item_refs"]] == [key], "it names the item it read"


async def test_asking_to_open_an_item_gives_the_command_with_the_id_that_the_read_gave(
    app: FastAPI, client: AsyncClient, worked_project: tuple[str, str]
) -> None:
    project_id, thread_id = worked_project
    key = await _first_item_key(app, project_id)

    body = await _ask(client, thread_id, f"Open {key}")

    commands = body["commands"]
    assert [command["command"] for command in commands] == ["open_item"]
    async with app.state.session_factory() as session:
        item_id = await session.scalar(
            sa.select(ArtifactItemRow.id).where(
                ArtifactItemRow.project_id == UUID(project_id), ArtifactItemRow.key == key
            )
        )
    assert commands[0]["item_id"] == str(item_id), "an id the server checked against the project"


async def test_asking_to_open_a_document_lists_the_documents_and_names_the_one_asked_for(
    app: FastAPI, client: AsyncClient, worked_project: tuple[str, str]
) -> None:
    project_id, thread_id = worked_project

    body = await _ask(client, thread_id, "Open the requirement specification")

    assert [command["command"] for command in body["commands"]] == ["open_document"]
    assert body["commands"][0]["artifact_id"] == await _specification_id(app, project_id)
    notes = (await _steps(client, body["run"]["id"]))[0]["notes"]
    assert [note["tool"] for note in notes] == ["list_documents"], "it looked at what there is"


@pytest.mark.parametrize(
    ("question", "tool"),
    [
        ("How much budget is left?", "budget_left"),
        ("Where does the last run stand?", "latest_run"),
    ],
)
async def test_a_question_about_the_app_makes_the_read_that_it_calls_for(
    client: AsyncClient, worked_project: tuple[str, str], question: str, tool: str
) -> None:
    _project_id, thread_id = worked_project

    body = await _ask(client, thread_id, question)

    step = (await _steps(client, body["run"]["id"]))[0]
    assert [note["tool"] for note in step["notes"]] == [tool]
    assert (await _answer_text(client, thread_id)).strip()


async def test_a_message_about_the_work_still_starts_a_run_of_the_requirements_workflow(
    client: AsyncClient, worked_project: tuple[str, str]
) -> None:
    _project_id, thread_id = worked_project

    body = await _ask(client, thread_id, "Interview two more mentors.")

    assert body["commands"] == []
    assert body["run"]["workflow_name"] == "requirements_engineering"
    runs = (await client.get(f"{API}/threads/{thread_id}/runs?workflow=assistance")).json()["items"]
    assert runs == [], "the assistant answered nothing"


async def test_a_question_is_answered_while_the_requirements_run_waits_at_a_review(
    app: FastAPI, client: AsyncClient, worked_project: tuple[str, str]
) -> None:
    project_id, thread_id = worked_project
    await open_review(app, project_id)
    waiting = (await client.get(f"{API}/threads/{thread_id}")).json()["active_run_id"]
    assert waiting is not None

    answered = await _ask(client, thread_id, "What is waiting for me?")
    pending = await _ask(client, thread_id, TASK)

    assert answered["run"]["workflow_name"] == "assistance"
    assert [command["command"] for command in answered["commands"]] == ["open_review"], (
        "a review waits, so the command may leave"
    )
    thread = (await client.get(f"{API}/threads/{thread_id}")).json()
    assert thread["active_run_id"] == waiting, "the run that waits is still the one of the thread"
    assert thread["latest_run_status"] == "interrupted", "an answer does not become its status"
    assert pending["run"]["id"] == waiting, "a message about the work waits in that run"
    assert pending["message"]["delivery"] == "pending"
    runs = (await client.get(f"{API}/threads/{thread_id}/runs")).json()["items"]
    numbers = sorted(run["number"] for run in runs)
    assert numbers == list(range(1, len(numbers) + 1)), "the runs are numbered in order"


async def test_a_command_for_a_review_is_dropped_when_none_waits(
    client: AsyncClient, worked_project: tuple[str, str]
) -> None:
    _project_id, thread_id = worked_project

    body = await _ask(client, thread_id, "What is waiting for me?")

    assert body["commands"] == [], "no review waits, so the server keeps it back"


async def test_a_question_about_the_settings_reads_them_and_names_the_command_to_open_them(
    client: AsyncClient, worked_project: tuple[str, str]
) -> None:
    _project_id, thread_id = worked_project

    body = await _ask(client, thread_id, "What are the limits of a run?")

    notes = (await _steps(client, body["run"]["id"]))[0]["notes"]
    assert [note["tool"] for note in notes] == ["run_settings"]
    assert "max steps" in await _answer_text(client, thread_id), (
        "it answers from what the read gave"
    )
    assert [command["command"] for command in body["commands"]] == ["open_settings"]
