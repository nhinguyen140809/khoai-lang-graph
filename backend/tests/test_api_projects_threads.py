"""Phase D.3 gate over httpx/ASGI: projects and threads of docs/API.md §5."""

from __future__ import annotations

from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from khoailanggraph.features.runs.models import RunRow
from khoailanggraph.features.threads.models import ThreadRow
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
        "rollup_run_status",
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
    assert body["rollup_run_status"] is None
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
        "latest_run_status",
        "last_message_at",
        "created_at",
        "updated_at",
    }
    assert thread["title"] is None
    assert thread["current_stage"] is None
    assert thread["active_run_id"] is None
    assert thread["latest_run_status"] is None

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


async def test_a_project_may_be_created_without_a_name(signed_in: AsyncClient) -> None:
    response = await signed_in.post("/api/v1/projects", json={"description": "An idea"})

    assert response.status_code == 201
    assert response.json()["name"] is None
    assert response.json()["output_language"] == "en"


async def test_a_language_left_out_is_the_default_language_of_the_user(
    signed_in: AsyncClient,
) -> None:
    saved = await signed_in.put(
        "/api/v1/me/settings",
        json={
            "theme": "system",
            "ui_language": "vi",
            "default_output_language": "vi",
            "default_run_config": {},
            "notify_on_interrupt": True,
            "notify_on_run_finished": True,
        },
    )
    assert saved.status_code == 200

    response = await signed_in.post("/api/v1/projects", json={"name": "Dự án"})

    assert response.json()["output_language"] == "vi"


async def test_a_name_of_spaces_is_refused(signed_in: AsyncClient) -> None:
    response = await signed_in.post("/api/v1/projects", json={"name": "   "})

    assert response.status_code == 422


async def test_the_project_list_is_filtered_by_the_status_of_the_latest_runs(
    signed_in: AsyncClient,
) -> None:
    started = (await signed_in.post("/api/v1/projects", json=PROJECT_BODY)).json()["id"]
    unstarted = (await signed_in.post("/api/v1/projects", json={"name": "Idea"})).json()["id"]
    thread = (await signed_in.post(f"/api/v1/projects/{started}/threads")).json()["id"]
    await signed_in.post(f"/api/v1/threads/{thread}/messages", json={"content": "Build it"})

    async def ids(**params: object) -> set[str]:
        response = await signed_in.get("/api/v1/projects", params=params)  # type: ignore[arg-type]
        assert response.status_code == 200
        return {entry["id"] for entry in response.json()["items"]}

    assert await ids(rollup_run_status="none") == {unstarted}
    assert await ids(rollup_run_status="succeeded") == {started}
    assert await ids(rollup_run_status=["none", "succeeded"]) == {started, unstarted}
    assert await ids(rollup_run_status="interrupted") == set()
    assert await ids(last_activity_after="2999-01-01T00:00:00Z") == set()
    assert await ids(last_activity_after="2000-01-01T00:00:00Z") == {started, unstarted}
    invalid = await signed_in.get("/api/v1/projects", params={"rollup_run_status": "done"})
    assert invalid.status_code == 400
    assert invalid.json()["code"] == "invalid_request"
    thread_view = (await signed_in.get(f"/api/v1/threads/{thread}")).json()
    assert thread_view["latest_run_status"] == "succeeded"
    assert thread_view["active_run_id"] is None


async def _create(signed_in: AsyncClient, **body: object) -> str:
    response = await signed_in.post("/api/v1/projects", json={"name": "P", **body})
    return str(response.json()["id"])


async def _add_run(app: FastAPI, project_id: str, thread_id: str, status: str) -> None:
    """A run of a thread in a status, written straight into the database."""
    async with app.state.session_factory() as session:
        thread = await session.get(ThreadRow, UUID(thread_id))
        assert thread is not None
        session.add(
            RunRow(
                thread_id=UUID(thread_id),
                project_id=UUID(project_id),
                number=1,
                started_by=thread.created_by,
                workflow_name="requirements_engineering",
                workflow_version=2,
                status=status,
                current_stage="planning",
                run_config_json=b"{}",
            )
        )
        await session.commit()


async def test_a_project_can_be_renamed_and_archived(signed_in: AsyncClient) -> None:
    project_id = await _create(signed_in)

    response = await signed_in.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "  Mentors  ", "description": "Find mentors", "status": "archived"},
    )

    body = response.json()
    assert response.status_code == 200
    assert (body["name"], body["description"], body["status"]) == (
        "Mentors",
        "Find mentors",
        "archived",
    )
    assert set(body) >= {"item_counts", "unfinished_run_counts", "rollup_run_status"}
    active = (await signed_in.get("/api/v1/projects")).json()["items"]
    assert active == []
    archived = (await signed_in.get("/api/v1/projects", params={"status": "archived"})).json()[
        "items"
    ]
    assert [entry["id"] for entry in archived] == [project_id]


async def test_a_field_left_out_of_a_patch_keeps_its_value(signed_in: AsyncClient) -> None:
    project_id = await _create(signed_in, description="Keep me")

    response = await signed_in.patch(f"/api/v1/projects/{project_id}", json={"status": "archived"})

    assert response.json()["description"] == "Keep me"
    assert response.json()["name"] == "P"
    cleared = await signed_in.patch(f"/api/v1/projects/{project_id}", json={"description": None})
    assert cleared.json()["description"] is None


async def test_the_run_settings_and_the_models_of_a_project_are_checked(
    signed_in: AsyncClient,
) -> None:
    project_id = await _create(signed_in)

    ok = await signed_in.patch(
        f"/api/v1/projects/{project_id}",
        json={
            "run_config": {
                "review_checkpoints": ["checkpoint_analysis"],
                "max_steps": 40,
                "max_cost_usd": 1.5,
                "parameters": {"max_turns": 8},
            },
            "model_overrides": {"analyst": "openai:gpt-4.1-mini"},
        },
    )
    assert ok.status_code == 200
    assert ok.json()["run_config"]["parameters"] == {"max_turns": 8}
    assert ok.json()["model_overrides"] == {"analyst": "openai:gpt-4.1-mini"}

    bad = await signed_in.patch(
        f"/api/v1/projects/{project_id}",
        json={
            "name": "   ",
            "run_config": {
                "review_checkpoints": ["checkpoint_analysis", "checkpoint_analysis", "nowhere"],
                "max_steps": 0,
                "max_cost_usd": -1,
                "parameters": {"max_turns": 500, "speed": 1},
            },
            "model_overrides": {"cook": "openai:gpt-4.1", "analyst": "nobody:nothing"},
        },
    )

    assert bad.status_code == 422
    assert bad.json()["code"] == "validation_failed"
    fields = {error["field"] for error in bad.json()["errors"]}
    assert fields == {
        "name",
        "run_config.review_checkpoints.1",
        "run_config.review_checkpoints.2",
        "run_config.max_steps",
        "run_config.max_cost_usd",
        "run_config.parameters.max_turns",
        "run_config.parameters.speed",
        "model_overrides.cook",
        "model_overrides.analyst",
    }
    unchanged = (await signed_in.get(f"/api/v1/projects/{project_id}")).json()
    assert unchanged["name"] == "P"
    assert unchanged["run_config"]["max_steps"] == 40


async def test_a_patch_with_a_field_that_does_not_exist_is_refused(signed_in: AsyncClient) -> None:
    project_id = await _create(signed_in)

    response = await signed_in.patch(f"/api/v1/projects/{project_id}", json={"owner_id": "x"})

    assert response.status_code == 422


async def test_a_deleted_project_and_everything_under_it_is_gone(signed_in: AsyncClient) -> None:
    project_id = await _create(signed_in)
    thread_id = (await signed_in.post(f"/api/v1/projects/{project_id}/threads")).json()["id"]

    response = await signed_in.delete(f"/api/v1/projects/{project_id}")

    assert response.status_code == 204
    assert (await signed_in.get(f"/api/v1/projects/{project_id}")).status_code == 404
    assert (await signed_in.get(f"/api/v1/threads/{thread_id}")).status_code == 404
    assert (await signed_in.get(f"/api/v1/projects/{project_id}/threads")).status_code == 404
    assert (await signed_in.get("/api/v1/projects")).json()["items"] == []
    assert (await signed_in.get("/api/v1/threads")).json()["items"] == []
    assert (await signed_in.delete(f"/api/v1/projects/{project_id}")).status_code == 404


@pytest.mark.parametrize("status", ["queued", "running", "interrupted"])
async def test_a_project_with_an_unfinished_run_is_not_deleted(
    app: FastAPI, signed_in: AsyncClient, status: str
) -> None:
    project_id = await _create(signed_in)
    thread_id = (await signed_in.post(f"/api/v1/projects/{project_id}/threads")).json()["id"]
    await _add_run(app, project_id, thread_id, status)

    response = await signed_in.delete(f"/api/v1/projects/{project_id}")

    assert response.status_code == 409
    assert response.json()["code"] == "invalid_state"
    assert (await signed_in.get(f"/api/v1/projects/{project_id}")).status_code == 200


async def test_a_project_whose_run_ended_can_be_deleted(
    app: FastAPI, signed_in: AsyncClient
) -> None:
    project_id = await _create(signed_in)
    thread_id = (await signed_in.post(f"/api/v1/projects/{project_id}/threads")).json()["id"]
    await _add_run(app, project_id, thread_id, "failed")

    assert (await signed_in.delete(f"/api/v1/projects/{project_id}")).status_code == 204


async def test_the_threads_of_the_user_come_across_projects(signed_in: AsyncClient) -> None:
    first = await _create(signed_in)
    second = await _create(signed_in)
    older = (await signed_in.post(f"/api/v1/projects/{first}/threads")).json()["id"]
    newer = (await signed_in.post(f"/api/v1/projects/{second}/threads")).json()["id"]

    everything = (await signed_in.get("/api/v1/threads")).json()
    one = (await signed_in.get("/api/v1/threads", params={"project_id": first})).json()

    assert [entry["id"] for entry in everything["items"]] == [newer, older]
    assert [entry["id"] for entry in one["items"]] == [older]
    paged = (await signed_in.get("/api/v1/threads", params={"limit": 1})).json()
    assert [entry["id"] for entry in paged["items"]] == [newer]
    assert paged["next_cursor"] == 1


async def test_a_thread_can_be_retitled_archived_and_deleted(signed_in: AsyncClient) -> None:
    project_id = await _create(signed_in)
    thread_id = (await signed_in.post(f"/api/v1/projects/{project_id}/threads")).json()["id"]

    changed = await signed_in.patch(
        f"/api/v1/threads/{thread_id}", json={"title": " Booking ", "status": "archived"}
    )
    cleared = await signed_in.patch(f"/api/v1/threads/{thread_id}", json={"title": None})
    blank = await signed_in.patch(f"/api/v1/threads/{thread_id}", json={"title": "  "})
    wrong = await signed_in.patch(f"/api/v1/threads/{thread_id}", json={"status": "gone"})
    removed = await signed_in.delete(f"/api/v1/threads/{thread_id}")

    assert (changed.json()["title"], changed.json()["status"]) == ("Booking", "archived")
    assert cleared.status_code == 422
    assert cleared.json()["errors"][0]["field"] == "title"
    assert blank.status_code == 422
    assert wrong.status_code == 422
    assert removed.status_code == 204
    assert (await signed_in.get(f"/api/v1/threads/{thread_id}")).status_code == 404
    assert (await signed_in.get(f"/api/v1/projects/{project_id}/threads")).json()["items"] == []


async def test_a_thread_with_an_unfinished_run_is_not_deleted(
    app: FastAPI, signed_in: AsyncClient
) -> None:
    project_id = await _create(signed_in)
    thread_id = (await signed_in.post(f"/api/v1/projects/{project_id}/threads")).json()["id"]
    await _add_run(app, project_id, thread_id, "interrupted")

    response = await signed_in.delete(f"/api/v1/threads/{thread_id}")

    assert response.status_code == 409
