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
        "kind",
        "project_id",
        "title",
        "summary",
        "schema_version",
        "content",
        "subject_item_id",
        "version",
        "review_status",
        "item_count",
        "created_by",
        "updated_by",
        "created_at",
        "updated_at",
    }
    assert first["created_by"]["actor"] == "agent"
    assert first["created_by"]["run_id"] is not None
    assert first["created_by"]["agent_role"] == "planner"
    artifact_ids = {artifact["id"] for artifact in body["items"]}
    assert project_id not in artifact_ids
    assert len(artifact_ids) > 1


async def test_list_project_links_gives_the_ids_of_both_ends(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/trace-links")

    body = response.json()
    assert response.status_code == 200
    assert body["items"], "the workflow writes trace links"
    link = body["items"][0]
    assert set(link) == {
        "id",
        "source_item_id",
        "target_item_id",
        "link_type",
        "target_version",
        "source_quote",
        "target_quote",
        "note",
    }
    types = {entry["link_type"] for entry in body["items"]}
    assert "derived_from" in types
    evidence = [entry for entry in body["items"] if entry["link_type"] == "evidenced_by"]
    assert any(entry["target_quote"] for entry in evidence), "interview evidence quotes the target"
    assert all(entry["source_quote"] is None for entry in evidence)


async def test_traceability_matrix_follows_the_definition(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/traceability/matrix")

    body = response.json()
    assert response.status_code == 200
    assert [column["key"] for column in body["columns"]] == [
        "backlog_item",
        "spec_requirement",
        "analyzed_requirement",
        "raw_requirement",
        "interview_message",
    ]
    assert body["columns"][3]["title"] == "Raw requirement / Latent need"
    assert body["rows"], "the workflow writes derived_from chains"
    column_keys = {column["key"] for column in body["columns"]}
    for row in body["rows"]:
        assert set(row["cells"]) == column_keys
    first = body["rows"][0]["cells"]
    assert first["backlog_item"][0]["kind"] == "backlog_item"
    assert set(first["backlog_item"][0]) == {"item_id", "key", "kind", "title"}
    assert first["spec_requirement"][0]["kind"] == "spec_requirement"
    assert first["analyzed_requirement"][0]["kind"] == "analyzed_requirement"
    assert first["raw_requirement"], "the last level holds what the item above derives from"


async def test_traceability_coverage_lists_the_gaps(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.get(f"/api/v1/projects/{project_id}/traceability/coverage")

    body = response.json()
    assert response.status_code == 200
    assert [gap["key"] for gap in body["gaps"]] == [
        "no_backlog_item",
        "no_source",
        "needs_review",
    ]
    for gap in body["gaps"]:
        assert gap["title"]
        assert gap["description"]
        for entry in gap["items"]:
            assert {"item_id", "key", "kind", "title"} <= set(entry)
            assert ("changed_targets" in entry) == (gap["key"] == "needs_review")


async def test_item_revisions_desc(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    items = await client.get(f"/api/v1/projects/{project_id}/items", params={"q": "REQ-00"})
    item_id = items.json()["items"][0]["id"]

    response = await client.get(f"/api/v1/items/{item_id}/revisions")

    body = response.json()
    assert response.status_code == 200
    assert body["items"], "the sink writes a revision per version"
    first = body["items"][0]
    assert set(first) == {"version", "change_reason", "changed_by", "created_at", "content"}
    assert first["changed_by"]["actor"] == "agent"
    versions = [entry["version"] for entry in body["items"]]
    assert versions == sorted(versions, reverse=True)


async def test_item_trace_gives_items_and_links(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    items = await client.get(f"/api/v1/projects/{project_id}/items", params={"q": "US-0"})
    item_id = items.json()["items"][0]["id"]

    response = await client.get(f"/api/v1/items/{item_id}/trace")

    body = response.json()
    assert response.status_code == 200
    assert set(body) == {"items", "links"}
    assert {"id", "artifact_id", "key", "kind", "version", "review_status", "content"} == set(
        body["items"][0]
    )
    assert item_id in {entry["id"] for entry in body["items"]}
    assert any(link["link_type"] == "derived_from" for link in body["links"])
    ends = {link["source_item_id"] for link in body["links"]} | {
        link["target_item_id"] for link in body["links"]
    }
    assert ends <= {entry["id"] for entry in body["items"]}
    keys = [entry["key"] for entry in body["items"]]
    assert keys == sorted(keys)


async def test_item_trace_keeps_its_direction(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    items = await client.get(f"/api/v1/projects/{project_id}/items", params={"q": "US-0"})
    item_id = items.json()["items"][0]["id"]

    backward = (
        await client.get(f"/api/v1/items/{item_id}/trace", params={"direction": "backward"})
    ).json()
    forward = (
        await client.get(f"/api/v1/items/{item_id}/trace", params={"direction": "forward"})
    ).json()
    invalid = await client.get(f"/api/v1/items/{item_id}/trace", params={"direction": "up"})

    assert {entry["kind"] for entry in backward["items"]} > {"backlog_item", "spec_requirement"}
    assert {entry["kind"] for entry in forward["items"]} == {"backlog_item"}, (
        "nothing is built from a story"
    )
    assert invalid.status_code == 422


async def test_artifact_trace_covers_all_its_items(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    artifacts = await client.get(f"/api/v1/projects/{project_id}/artifacts")
    backlog_id = next(a["id"] for a in artifacts.json()["items"] if a["kind"] == "product_backlog")
    stories = await client.get(f"/api/v1/artifacts/{backlog_id}/items")

    response = await client.get(
        f"/api/v1/artifacts/{backlog_id}/trace", params={"direction": "backward"}
    )

    body = response.json()
    assert response.status_code == 200
    found = {entry["id"] for entry in body["items"]}
    assert {entry["id"] for entry in stories.json()["items"]} <= found
    assert {entry["kind"] for entry in body["items"]} >= {"raw_requirement", "interview_message"}
    missing = await client.get(f"/api/v1/artifacts/{uuid4()}/trace")
    assert missing.status_code == 404


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
    assert body["workflow_version"] == 2
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
    assert any(m["id"] == "openai:gpt-4.1" for m in body["models"])


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


ITEM_FIELDS = {
    "id",
    "artifact_id",
    "project_id",
    "key",
    "kind",
    "parent_item_id",
    "position",
    "outline_number",
    "schema_version",
    "version",
    "review_status",
    "created_by",
    "updated_by",
    "created_at",
    "updated_at",
    "content",
}


async def test_an_item_has_the_fields_of_the_client_schema(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    listing = await client.get(
        f"/api/v1/projects/{project_id}/items", params={"kind": "backlog_item"}
    )
    item = listing.json()["items"][0]

    response = await client.get(f"/api/v1/items/{item['id']}")

    body = response.json()
    assert set(body) == ITEM_FIELDS
    assert body["created_by"]["actor"] == "agent"
    assert body["created_by"]["agent_role"] == "backlog_manager"
    assert body["created_by"]["run_id"] is not None
    assert body["updated_by"] == body["created_by"]
    assert body["outline_number"].isdigit()


async def test_outline_items_carry_a_depth_and_nest_with_the_tree_shape(
    client: AsyncClient,
) -> None:
    project_id, _thread_id = await seeded_run(client)
    artifacts = await client.get(f"/api/v1/projects/{project_id}/artifacts")
    spec_id = next(
        a["id"] for a in artifacts.json()["items"] if a["kind"] == "requirement_specification"
    )

    flat = (await client.get(f"/api/v1/artifacts/{spec_id}/items")).json()["items"]
    tree = (await client.get(f"/api/v1/artifacts/{spec_id}/items", params={"shape": "tree"})).json()

    assert all(set(entry) == ITEM_FIELDS | {"depth"} for entry in flat)
    assert [entry["outline_number"] for entry in flat] == [str(n) for n in range(1, len(flat) + 1)]
    assert {entry["depth"] for entry in flat} == {1}
    assert [entry["id"] for entry in tree["items"]] == [entry["id"] for entry in flat]
    assert all(entry["children"] == [] for entry in tree["items"])


async def test_items_can_be_listed_by_the_run_that_wrote_them(client: AsyncClient) -> None:
    project_id, thread_id = await seeded_run(client)
    run_id = (await client.get(f"/api/v1/threads/{thread_id}/runs")).json()["items"][0]["id"]

    written = await client.get(f"/api/v1/projects/{project_id}/items", params={"run_id": run_id})
    other = await client.get(
        f"/api/v1/projects/{project_id}/items", params={"run_id": str(uuid4())}
    )

    assert written.json()["items"]
    assert other.json()["items"] == []


async def test_a_user_edit_is_a_revision_credited_to_the_user(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    listing = await client.get(f"/api/v1/projects/{project_id}/items")
    first = listing.json()["items"][0]

    await client.patch(
        f"/api/v1/items/{first['id']}",
        headers={"If-Match": str(first["version"])},
        json={"review_status": "approved"},
    )

    revisions = (await client.get(f"/api/v1/items/{first['id']}/revisions")).json()["items"]
    assert revisions[0]["version"] == first["version"] + 1
    assert revisions[0]["change_reason"] == "user_edit"
    assert revisions[0]["changed_by"]["actor"] == "user"
    assert revisions[0]["changed_by"]["user_id"] is not None
    edited = await client.get(f"/api/v1/items/{first['id']}")
    assert edited.json()["updated_by"]["actor"] == "user"
    assert edited.json()["created_by"]["actor"] == "agent"
