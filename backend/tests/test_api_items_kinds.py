"""Phase D.6 gate: items search, kinds/definition/models, PATCH items (§5)."""

from __future__ import annotations

from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

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

TEST_DB = Path(gettempdir()) / "khoailang-white-box-items.db"
REGISTER = {"email": "items@example.com", "password": "secret", "display_name": "Items"}
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


async def seeded_run(client: AsyncClient) -> tuple[str, str]:
    """Sign in, create the project, run the workflow once."""
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    project = await client.post("/api/v1/projects", json=PROJECT_BODY)
    project_id = project.json()["id"]
    thread = await client.post(f"/api/v1/projects/{project_id}/threads")
    await client.post(f"/api/v1/threads/{thread.json()['id']}/messages", json={"content": TASK})
    return project_id, thread.json()["id"]


async def test_items_carry_artifact_id(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/items", params={"q": "PER-001"})

    item = response.json()["items"][0]
    assert response.status_code == 200
    assert item["artifact_id"], "items resolve to their artifact for the tree"


async def test_list_project_artifacts_tree(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/artifacts")

    body = response.json()
    assert response.status_code == 200
    kinds = {artifact["kind"] for artifact in body["items"]}
    assert {"elicitation_plan", "persona_catalog", "requirement_specification"} <= kinds
    first = body["items"][0]
    assert set(first) == {
        "id",
        "project_id",
        "kind",
        "title",
        "summary",
        "schema_version",
        "version",
        "review_status",
        "content",
        "updated_at",
    }
    artifact_ids = {artifact["id"] for artifact in body["items"]}
    assert project_id not in artifact_ids
    assert len(artifact_ids) > 1


async def test_list_project_links_resolves_both_ends(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/trace-links")

    body = response.json()
    assert response.status_code == 200
    assert body["items"], "the workflow writes trace links"
    link = body["items"][0]
    assert set(link) == {
        "id",
        "project_id",
        "link_type",
        "source",
        "target",
        "target_version",
        "quote",
        "note",
    }
    for end in ("source", "target"):
        assert set(link[end]) == {"id", "key", "kind", "review_status"}
    types = {entry["link_type"] for entry in body["items"]}
    assert "derived_from" in types


async def test_traceability_matrix_rows(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/traceability/matrix")

    rows = response.json()["rows"]
    assert response.status_code == 200
    assert rows, "the workflow writes derived_from chains"
    first = rows[0]
    assert set(first) == {"backlog", "spec", "analyzed", "source", "evidence"}
    assert first["backlog"] is not None
    assert first["backlog"]["kind"] == "backlog_item"
    assert first["spec"] is not None
    assert first["spec"]["kind"] == "spec_requirement"
    assert first["analyzed"] is not None
    expected_sources = {"raw_requirement", "latent_need"}
    assert any(entry["kind"] in expected_sources for entry in first["source"])


async def test_traceability_coverage_lists(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/traceability/coverage")

    body = response.json()
    assert response.status_code == 200
    entry_fields = {"id", "key", "kind", "review_status"}
    for key in ("no_backlog_item", "no_source", "needs_review"):
        assert body[key]["count"] == len(body[key]["items"])
        for entry in body[key]["items"]:
            assert set(entry) == entry_fields


async def test_item_revisions_desc(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    items = await client.get(f"/api/v1/projects/{project_id}/items", params={"q": "REQ-00"})
    item_id = items.json()["items"][0]["id"]

    response = await client.get(f"/api/v1/items/{item_id}/revisions")

    body = response.json()
    assert response.status_code == 200
    assert body["items"], "the sink writes a revision per version"
    first = body["items"][0]
    assert set(first) == {"item_id", "version", "change_reason", "snapshot", "created_at"}
    versions = [entry["version"] for entry in body["items"]]
    assert versions == sorted(versions, reverse=True)


async def test_item_trace_walks_both_directions(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    items = await client.get(f"/api/v1/projects/{project_id}/items", params={"q": "US-0"})
    item_id = items.json()["items"][0]["id"]

    response = await client.get(f"/api/v1/items/{item_id}/trace")

    body = response.json()
    assert response.status_code == 200
    assert body["nodes"], "the chain resolves items"
    assert body["links"], "the chain carries links"
    assert any(link["link_type"] == "derived_from" for link in body["links"])


async def test_search_finds_spec_requirements(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/items", params={"q": "REQ-001"})

    body = response.json()
    assert response.status_code == 200
    assert body["items"], "workflow items searchable"
    item = body["items"][0]
    assert item["key"] == "REQ-001"
    assert item["kind"] == "spec_requirement"
    assert "title" in item["content"]


async def test_search_text_match_not_only_key(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(
        f"/api/v1/projects/{project_id}/items", params={"q": "Simple, fast interface"}
    )
    body = response.json()["items"]
    # "Simple, fast interface" là priority của persona PER-001
    assert any(item["kind"] == "persona" for item in body)


async def test_get_item_by_id(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    listing = await client.get(f"/api/v1/projects/{project_id}/items")
    item_id = UUID(listing.json()["items"][0]["id"])

    response = await client.get(f"/api/v1/items/{item_id}")
    assert response.status_code == 200
    assert response.json()["id"] == str(item_id)

    missing = await client.get(f"/api/v1/items/{uuid4()}")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "The item does not exist."


async def test_artifact_kinds_full_contract(client: AsyncClient) -> None:
    await seeded_run(client)

    response = await client.get("/api/v1/artifact-kinds")

    body = response.json()
    assert response.status_code == 200
    assert body["workflow_version"] == 3
    kinds = [k["kind"] for k in body["artifact_kinds"]]
    assert "elicitation_plan" in kinds
    assert "research_corpus" in kinds
    assert "requirements_analysis" in kinds
    assert len(kinds) == 8
    # The kinds of definition v2: persona + persona_catalog moved to v2, and
    # the served schema_version of every item kind follows the definition.
    catalog = next(k for k in body["artifact_kinds"] if k["kind"] == "persona_catalog")
    assert catalog["schema_version"] == 2
    persona = next(item for item in catalog["item_kinds"] if item["kind"] == "persona")
    assert persona["schema_version"] == 2
    assert "evaluative_dimension" in persona["schema"]["properties"]
    assert "evidence" in persona["schema"]["properties"]
    research = next(k for k in body["artifact_kinds"] if k["kind"] == "research_corpus")
    assert {item["kind"] for item in research["item_kinds"]} == {
        "source_document",
        "stakeholder_observation",
    }
    # enum của x-value-list được fill (như mocks' withValueLists)
    spec_kind = next(k for k in body["artifact_kinds"] if k["kind"] == "requirements_analysis")
    raw = next(item for item in spec_kind["item_kinds"] if item["kind"] == "analyzed_requirement")
    priority = raw["schema"]["properties"]["priority"]
    assert priority["enum"] == ["must", "should", "could", "wont"]


async def test_workflow_definition_immutable_when_version_given(
    client: AsyncClient,
) -> None:
    await seeded_run(client)

    response = await client.get("/api/v1/workflow/definition")
    assert response.status_code == 200
    assert response.json()["name"] == "requirements_engineering"
    assert "Cache-Control" not in response.headers

    pinned = await client.get("/api/v1/workflow/definition", params={"version": 1})
    assert pinned.status_code == 200
    assert pinned.headers["Cache-Control"] == "public, max-age=31536000, immutable"


async def test_models_catalog_serves_allowlist(client: AsyncClient) -> None:
    await seeded_run(client)

    response = await client.get("/api/v1/models")
    body = response.json()
    assert response.status_code == 200
    assert "models" in body
    assert any(m["id"] == "openai:glm-5.2" for m in body["models"])


async def test_patch_item_and_version_conflict(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    listing = await client.get(f"/api/v1/projects/{project_id}/items")
    first = listing.json()["items"][0]
    item_id = first["id"]
    version = first["version"]

    updated = await client.patch(
        f"/api/v1/items/{item_id}",
        headers={"If-Match": str(version)},
        json={"review_status": "approved"},
    )
    assert updated.status_code == 200
    assert updated.json()["version"] == version + 1

    stale = await client.patch(
        f"/api/v1/items/{item_id}",
        headers={"If-Match": str(version)},
        json={"review_status": "draft"},
    )
    assert stale.status_code == 409
    assert stale.json()["code"] == "version_conflict"


async def test_artifact_items_outline(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    artifacts = await client.get(f"/api/v1/projects/{project_id}/artifacts")
    spec_id = next(
        (a["id"] for a in artifacts.json()["items"] if a["kind"] == "requirement_specification"),
        None,
    )
    assert spec_id is not None

    response = await client.get(f"/api/v1/artifacts/{spec_id}/items")

    items = response.json()["items"]
    assert response.status_code == 200
    assert items, "the spec artifact carries its requirements"
    assert all(entry["artifact_id"] == spec_id for entry in items)
    assert response.json()["next_cursor"] is None


async def test_artifact_content_in_summary(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    artifacts = await client.get(f"/api/v1/projects/{project_id}/artifacts")

    kinds = {a["kind"]: a for a in artifacts.json()["items"]}
    assert "content" in kinds["elicitation_plan"], "document fields served"
    assert isinstance(kinds["elicitation_plan"]["content"], dict)
