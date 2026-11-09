"""Phase documents gate: upload, list, read, version, soft delete (§5)."""

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

TEST_DB = Path(gettempdir()) / "khoailang-white-box-documents.db"
TEST_STORE = Path(gettempdir()) / "khoailang-documents-test"
REGISTER = {"email": "documents@example.com", "password": "secret", "display_name": "Docs"}


@pytest.fixture
async def app() -> AsyncIterator[FastAPI]:
    TEST_DB.unlink(missing_ok=True)
    settings = Settings(
        app_env="test",
        database_url=f"sqlite+aiosqlite:///{TEST_DB}",
        documents_dir=TEST_STORE,
        max_upload_mb=1,
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
async def project_id(client: AsyncClient) -> str:
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    created = await client.post(
        "/api/v1/projects",
        json={"name": "Mentor platform", "description": None, "output_language": "en"},
    )
    return created.json()["id"]


async def upload(client: AsyncClient, project: str, name: str, content: bytes | str, **fields):
    payload = content.encode("utf-8") if isinstance(content, str) else content
    files = {"file": (name, payload, "text/plain")}
    return await client.post(f"/api/v1/projects/{project}/documents", files=files, data=fields)


async def test_upload_txt_round_trip(client: AsyncClient, project_id: str) -> None:
    text = "61% said they would stop using a tool that needs more than a few taps."
    response = await upload(client, project_id, "survey.txt", text, title="Student survey")
    assert response.status_code == 201, response.text
    body = response.json()
    assert response.headers["location"] == f"/api/v1/documents/{body['id']}"
    assert body["format"] == "txt"
    assert body["latest_version"] == 1
    assert body["text"] == text
    assert "storage_key" not in body

    detail = await client.get(f"/api/v1/documents/{body['id']}")
    assert detail.status_code == 200
    assert detail.json()["text"] == text
    assert [v["version"] for v in detail.json()["versions"]] == [1]


async def test_each_format_extracts_text(client: AsyncClient, project_id: str) -> None:
    html = "<script>alert(1)</script><main><p>Commuters circle the lots nightly.</p></main>"
    assert (await upload(client, project_id, "thread.html", html)).json()[
        "text"
    ] == "Commuters circle the lots nightly."

    markdown = "## Needs\n- fast booking\n- privacy"
    text_md = (await upload(client, project_id, "notes.md", markdown)).json()["text"]
    assert text_md == "## Needs - fast booking - privacy"

    data = '{"quote": "mentors cap hours weekly", "n": 240}'
    text_json = (await upload(client, project_id, "data.json", data)).json()["text"]
    assert "240" in text_json
    assert "mentors cap hours weekly" in text_json


async def test_rejects_unsupported_format_and_oversize(
    client: AsyncClient, project_id: str
) -> None:
    refused = await upload(client, project_id, "setup.exe", b"MZ...")
    assert refused.status_code == 422
    assert refused.json()["code"] == "unsupported_format"

    huge = await upload(client, project_id, "big.txt", b"a" * (1024 * 1024 + 2))
    assert huge.status_code == 422
    assert huge.json()["code"] == "too_large"


async def test_new_version_appends_and_old_text_stays(client: AsyncClient, project_id: str) -> None:
    first = (await upload(client, project_id, "survey.txt", "first words")).json()
    second = await upload(
        client, project_id, "survey.txt", "second words", first_version_id=first["id"]
    )
    assert second.status_code == 201
    assert second.json()["latest_version"] == 2
    assert second.json()["text"] == "second words"
    assert [v["version"] for v in second.json()["versions"]] == [1, 2]

    pinned = await client.get(f"/api/v1/documents/{first['id']}", params={"version": 1})
    assert pinned.json()["text"] == "first words"


async def test_list_is_newest_first_and_soft_delete(client: AsyncClient, project_id: str) -> None:
    first = (await upload(client, project_id, "a.txt", "one")).json()
    await upload(client, project_id, "b.txt", "two")

    listed = await client.get(f"/api/v1/projects/{project_id}/documents")
    body = listed.json()
    assert listed.status_code == 200
    assert [doc["filename"] for doc in body["items"]] == ["b.txt", "a.txt"]
    assert body["next_cursor"] is None

    gone = await client.delete(f"/api/v1/documents/{first['id']}")
    assert gone.status_code == 204
    missing = await client.get(f"/api/v1/documents/{first['id']}")
    assert missing.status_code == 404
    after_delete = await client.get(f"/api/v1/projects/{project_id}/documents")
    assert [doc["filename"] for doc in after_delete.json()["items"]] == ["b.txt"]


async def test_uploaded_text_is_capped_at_twenty_thousand_characters(
    client: AsyncClient, project_id: str
) -> None:
    """The extraction cap of the contract: the mining stage quotes from a
    bounded text, and a book-sized upload cannot blow up a run."""
    uploaded = (await upload(client, project_id, "book.txt", "word " * 9000)).json()

    assert len(uploaded["text"]) == 20_000
