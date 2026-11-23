"""The reads of the assistant, one by one: what each one says about a small seeded project."""

from __future__ import annotations

import json
from pathlib import Path
from tempfile import gettempdir
from typing import TYPE_CHECKING
from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from khoailanggraph.features.artifacts.models import ArtifactItemRow, ArtifactRow
from khoailanggraph.features.assistant.tools import ToolContext, run_tool
from khoailanggraph.features.me.models import UserRow
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.runs.models import RunRow
from khoailanggraph.main import create_app
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings
from support.api_helpers import REGISTER

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from fastapi import FastAPI
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

TEST_DB = Path(gettempdir()) / "khoailang-white-box-tools.db"
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
async def seeded(
    app: FastAPI,
) -> AsyncIterator[tuple[AsyncSession, ProjectRow, UserRow]]:
    """A project of a user with a specification, one open issue and a finished run."""
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
        headers={"Origin": "http://localhost:3000"},
    ) as client:
        await client.post(f"{API}/auth/register", json=REGISTER)
        await client.post(
            f"{API}/auth/login", json={"email": REGISTER["email"], "password": "secret"}
        )
        project_id = (await client.post(f"{API}/projects", json={"name": "Mentors"})).json()["id"]
        thread_id = (await client.post(f"{API}/projects/{project_id}/threads")).json()["id"]

    factory: async_sessionmaker[AsyncSession] = app.state.session_factory
    async with factory() as session:
        project = await session.get(ProjectRow, UUID(project_id))
        assert project is not None
        user = await session.get(UserRow, project.owner_id)
        assert user is not None
        spec = ArtifactRow(
            project_id=project.id,
            kind="requirement_specification",
            title="Requirement specification",
            version=3,
            review_status="draft",
            content_json=b"{}",
        )
        issues = ArtifactRow(
            project_id=project.id,
            kind="validation_report",
            title="Validation report, iteration 2",
            version=2,
            review_status="draft",
            content_json=json.dumps({"iteration": 2, "status": "fail"}).encode("utf-8"),
        )
        session.add_all([spec, issues])
        await session.flush()
        session.add_all(
            [
                ArtifactItemRow(
                    artifact_id=spec.id,
                    project_id=project.id,
                    kind="spec_requirement",
                    key="REQ-003",
                    content_json=json.dumps(
                        {
                            "title": "Show when a rating was last reviewed",
                            "description": "Each rating shows the review round it came from.",
                            "priority": "must",
                        }
                    ).encode("utf-8"),
                    version=4,
                    review_status="draft",
                ),
                ArtifactItemRow(
                    artifact_id=spec.id,
                    project_id=project.id,
                    kind="spec_requirement",
                    key="REQ-004",
                    content_json=json.dumps({"title": "Answer within two seconds"}).encode("utf-8"),
                    version=1,
                    review_status="draft",
                ),
                ArtifactItemRow(
                    artifact_id=issues.id,
                    project_id=project.id,
                    kind="validation_issue",
                    key="VLI-001",
                    content_json=json.dumps(
                        {
                            "title": "REQ-004 is not measurable",
                            "severity": "high",
                            "status": "open",
                        }
                    ).encode("utf-8"),
                    version=1,
                    review_status="draft",
                ),
                ArtifactItemRow(
                    artifact_id=issues.id,
                    project_id=project.id,
                    kind="validation_issue",
                    key="VLI-002",
                    content_json=json.dumps(
                        {"title": "Fixed already", "severity": "low", "status": "fixed"}
                    ).encode("utf-8"),
                    version=1,
                    review_status="draft",
                ),
            ]
        )
        session.add(
            RunRow(
                thread_id=UUID(thread_id),
                project_id=project.id,
                number=2,
                started_by=user.id,
                workflow_name="requirements_engineering",
                workflow_version=2,
                status="failed",
                current_stage="writing_specification",
                step_count=9,
                error_code="provider_error",
                error_message="The provider timed out on the engineer step.",
                error_stage="writing_specification",
                run_config_json=b"{}",
                usage_json=b"{}",
            )
        )
        await session.commit()
        yield session, project, user


async def _tool(
    session: AsyncSession,
    project: ProjectRow,
    user: UserRow,
    name: str,
    key: str | None = None,
) -> str:
    return await run_tool(name, ToolContext(session=session, project=project, user=user), key)


async def test_read_item_names_the_fields_of_one_item(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "read_item", "REQ-003")

    assert "REQ-003 (spec_requirement), id " in text
    assert "version 4, draft" in text
    assert "Show when a rating was last reviewed" in text
    assert "priority: must" in text


async def test_read_item_says_so_when_the_key_is_missing(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "read_item", "REQ-999")

    assert "no item with the key REQ-999" in text


async def test_read_document_lists_the_items_of_the_newest_document(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "read_document", "requirement_specification")

    assert "Requirement specification (requirement_specification), version 3" in text
    assert "REQ-003" in text
    assert "Answer within two seconds" in text


async def test_read_document_without_a_kind_names_the_kinds(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "read_document")

    assert "requirement_specification" in text
    assert "validation_report" in text


async def test_open_issues_reads_the_open_findings_only(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "open_issues")

    assert "iteration 2): fail" in text
    assert "VLI-001" in text
    assert "VLI-002" not in text, "a fixed finding is not open"
    assert "high" in text


async def test_latest_run_explains_the_failure(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "latest_run")

    assert "run 2: failed" in text
    assert "provider_error" in text
    assert "timed out" in text


async def test_stage_info_reads_the_definition(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "stage_info", "analyst")

    assert "analyst" in text
    assert "agent role" in text


async def test_stage_info_without_a_step_lists_them(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "stage_info")

    assert "planner" in text
    assert "backlog_manager" in text


async def test_budget_left_says_what_the_month_cost(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "budget_left")

    assert "US dollars this month" in text


async def test_trace_item_reads_the_chain_it_belongs_to(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "trace_item", "REQ-003")

    assert "REQ-003 has no trace link" in text, "a link only exists when a step wrote one"


async def test_an_unknown_tool_reads_nothing(
    seeded: tuple[AsyncSession, ProjectRow, UserRow],
) -> None:
    session, project, user = seeded

    text = await _tool(session, project, user, "delete_everything", "REQ-003")

    assert text == "There is no tool called delete_everything."
