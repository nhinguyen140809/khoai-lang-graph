"""Helpers of the API tests that run the scripted workflow and edit its documents."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import select

from khoailanggraph.features.artifacts.models import ArtifactRow
from khoailanggraph.features.runs.models import InterruptRow, RunRow

if TYPE_CHECKING:
    from fastapi import FastAPI
    from httpx import AsyncClient

REGISTER = {"email": "edit@example.com", "password": "secret", "display_name": "Editor"}
TASK = "I want to build an online platform for university students to find mentors."


async def seeded_run(client: AsyncClient) -> tuple[str, str]:
    """Sign in, create a project and run the workflow once; returns the project and thread ids."""
    await client.post("/api/v1/auth/register", json=REGISTER)
    await client.post("/api/v1/auth/login", json={"email": REGISTER["email"], "password": "secret"})
    project = await client.post(
        "/api/v1/projects", json={"name": "Mentors", "output_language": "en"}
    )
    project_id = project.json()["id"]
    thread = await client.post(f"/api/v1/projects/{project_id}/threads")
    await client.post(f"/api/v1/threads/{thread.json()['id']}/messages", json={"content": TASK})
    return project_id, thread.json()["id"]


async def open_review(
    app: FastAPI,
    project_id: str,
    *,
    allow_edits: bool = True,
    artifact_ids: list[str] | None = None,
    status: str = "interrupted",
) -> None:
    """Put the run of the project at a review: the pending interrupt lists the given artifacts
    (every artifact of the project by default)."""
    async with app.state.session_factory() as session:
        run = (
            await session.scalars(select(RunRow).where(RunRow.project_id == UUID(project_id)))
        ).first()
        assert run is not None
        run.status = status
        listed = artifact_ids or [
            str(artifact)
            for artifact in (
                await session.scalars(
                    select(ArtifactRow.id).where(ArtifactRow.project_id == UUID(project_id))
                )
            ).all()
        ]
        session.add(
            InterruptRow(
                run_id=run.id,
                node="checkpoint_analysis",
                prompt="Review the documents.",
                allow_edits=allow_edits,
                artifacts_json=json.dumps(
                    [
                        {"artifact_id": artifact, "kind": "x", "title": "t", "version": 1}
                        for artifact in listed
                    ]
                ).encode(),
            )
        )
        await session.commit()
