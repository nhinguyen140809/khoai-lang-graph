"""The exports of a project: the file of a template in a format, from its documents."""

from __future__ import annotations

import csv
import io
import json
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
    make_sync_engine,
)
from khoailanggraph.settings import Settings
from support.api_helpers import seeded_run

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI

TEST_DB = Path(gettempdir()) / "khoailang-white-box-exports.db"
EXPORTS_DIR = Path(gettempdir()) / "khoailang-white-box-exports-files"
API = "/api/v1"


@pytest.fixture
async def app() -> AsyncIterator[FastAPI]:
    TEST_DB.unlink(missing_ok=True)
    settings = Settings(
        app_env="test",
        database_url=f"sqlite+aiosqlite:///{TEST_DB}",
        exports_dir=EXPORTS_DIR,
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
        for file in EXPORTS_DIR.glob("*"):
            file.unlink()


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Origin": "http://localhost:3000"},
    ) as http:
        yield http


async def _download(client: AsyncClient, project_id: str, template: str, fmt: str) -> str:
    created = await client.post(
        f"{API}/projects/{project_id}/exports", json={"template": template, "format": fmt}
    )
    assert created.status_code == 202, created.text
    file = await client.get(created.json()["download_url"])
    assert file.status_code == 200
    return file.text


async def test_a_requested_export_is_ready_with_the_exact_versions_it_holds(
    client: AsyncClient,
) -> None:
    project_id, _thread_id = await seeded_run(client)
    artifacts = (await client.get(f"{API}/projects/{project_id}/artifacts")).json()["items"]

    response = await client.post(
        f"{API}/projects/{project_id}/exports",
        json={"template": "requirement_specification", "format": "markdown"},
    )

    body = response.json()
    assert response.status_code == 202
    assert response.headers["location"] == f"{API}/exports/{body['id']}"
    assert set(body) == {
        "id",
        "project_id",
        "template",
        "format",
        "status",
        "file_name",
        "size_bytes",
        "download_url",
        "requested_by",
        "included_artifacts",
        "created_at",
    }
    assert body["status"] == "ready"
    assert body["file_name"] == "requirement_specification.md"
    assert body["download_url"] == f"{API}/exports/{body['id']}/file"
    spec = next(a for a in artifacts if a["kind"] == "requirement_specification")
    assert body["included_artifacts"] == [
        {
            "artifact_id": spec["id"],
            "kind": spec["kind"],
            "title": spec["title"],
            "version": spec["version"],
        }
    ]
    assert body["size_bytes"] > 0
    assert (await client.get(f"{API}/exports/{body['id']}")).json() == body


async def test_the_file_of_an_export_is_a_download(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    created = (
        await client.post(
            f"{API}/projects/{project_id}/exports",
            json={"template": "product_backlog", "format": "csv"},
        )
    ).json()

    file = await client.get(created["download_url"])

    assert file.headers["content-type"].startswith("text/csv")
    assert 'filename="product_backlog.csv"' in file.headers["content-disposition"]
    assert len(file.content) == created["size_bytes"]


async def test_the_specification_is_exported_as_markdown(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    text = await _download(client, project_id, "requirement_specification", "markdown")

    assert text.startswith("# Requirement specification\n")
    assert "Project: Mentors" in text
    assert "## Requirement specification" in text
    assert "REQ-001" in text
    assert "**Statement**" in text


async def test_the_backlog_is_exported_as_a_table_and_as_json(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    table = list(
        csv.reader(io.StringIO(await _download(client, project_id, "product_backlog", "csv")))
    )
    document = json.loads(await _download(client, project_id, "product_backlog", "json"))

    assert table[0][:3] == ["key", "kind", "outline_number"]
    assert "title" in table[0]
    assert all(row[1] == "backlog_item" for row in table[1:])
    assert len(table) - 1 == len(document["artifacts"][0]["items"])
    assert document["project"] == "Mentors"
    assert document["artifacts"][0]["kind"] == "product_backlog"
    assert document["artifacts"][0]["items"][0]["key"].startswith(("US-", "EP-"))


async def test_the_matrix_is_exported_with_its_columns_from_the_definition(
    client: AsyncClient,
) -> None:
    project_id, _thread_id = await seeded_run(client)

    table = list(
        csv.reader(io.StringIO(await _download(client, project_id, "traceability_matrix", "csv")))
    )
    markdown = await _download(client, project_id, "traceability_matrix", "markdown")

    assert table[0] == [
        "Backlog item",
        "Spec requirement",
        "Analyzed requirement",
        "Raw requirement / Latent need",
        "Interview message / Source document",
    ]
    assert len(table) > 1
    assert table[1][0].startswith(("US-", "EP-"))
    assert markdown.splitlines()[4].startswith("| Backlog item |")
    assert "## " not in markdown, "the matrix alone, not the documents behind it"


async def test_the_interviews_are_exported_as_a_conversation(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    text = await _download(client, project_id, "interview_transcripts", "markdown")

    assert "## Interview with" in text
    assert "**Interviewer:**" in text
    assert text.count("## Interview with") == 3


async def test_every_document_is_exported_in_one_file(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)

    document = json.loads(await _download(client, project_id, "full_project", "json"))
    markdown = await _download(client, project_id, "full_project", "markdown")

    kinds = {entry["kind"] for entry in document["artifacts"]}
    assert {"elicitation_plan", "persona_catalog", "requirement_specification"} <= kinds
    assert "research_corpus" not in kinds, "only the documents the template names"
    assert "## Elicitation plan" in markdown


@pytest.mark.parametrize(
    ("body", "field"),
    [
        ({"template": "novel", "format": "markdown"}, "template"),
        ({"template": "product_backlog", "format": "docx"}, "format"),
        ({"template": "requirement_specification", "format": "pdf"}, "format"),
        ({"template": "requirement_specification", "format": "docx"}, "format"),
    ],
)
async def test_a_request_the_workflow_does_not_allow_is_refused(
    client: AsyncClient, body: dict[str, str], field: str
) -> None:
    project_id, _thread_id = await seeded_run(client)

    response = await client.post(f"{API}/projects/{project_id}/exports", json=body)

    assert response.status_code == 422
    assert response.json()["errors"][0]["field"] == field


async def test_a_project_without_the_documents_has_nothing_to_export(client: AsyncClient) -> None:
    await seeded_run(client)
    empty = (await client.post(f"{API}/projects", json={"name": "Idea"})).json()["id"]

    response = await client.post(
        f"{API}/projects/{empty}/exports", json={"template": "full_project", "format": "json"}
    )

    assert response.status_code == 409
    assert response.json()["code"] == "invalid_state"


async def test_the_exports_of_a_project_come_newest_first(client: AsyncClient) -> None:
    project_id, _thread_id = await seeded_run(client)
    ids = []
    for template, fmt in (
        ("product_backlog", "json"),
        ("full_project", "json"),
        ("product_backlog", "csv"),
    ):
        created = await client.post(
            f"{API}/projects/{project_id}/exports", json={"template": template, "format": fmt}
        )
        ids.append(created.json()["id"])

    listing = (await client.get(f"{API}/projects/{project_id}/exports")).json()
    paged = (await client.get(f"{API}/projects/{project_id}/exports", params={"limit": 2})).json()

    assert [entry["id"] for entry in listing["items"]] == ids[::-1]
    assert listing["next_cursor"] is None
    assert [entry["id"] for entry in paged["items"]] == ids[::-1][:2]
    assert paged["next_cursor"] == 2


async def test_an_export_that_does_not_exist_or_whose_project_is_gone_answers_404(
    client: AsyncClient,
) -> None:
    project_id, _thread_id = await seeded_run(client)
    created = (
        await client.post(
            f"{API}/projects/{project_id}/exports",
            json={"template": "product_backlog", "format": "json"},
        )
    ).json()

    assert (await client.get(f"{API}/exports/{uuid4()}")).status_code == 404
    assert (await client.get(f"{API}/exports/{uuid4()}/file")).status_code == 404
    assert (await client.get(f"{API}/projects/{uuid4()}/exports")).status_code == 404
    await client.delete(f"{API}/projects/{project_id}")
    assert (await client.get(f"{API}/exports/{created['id']}")).status_code == 404
