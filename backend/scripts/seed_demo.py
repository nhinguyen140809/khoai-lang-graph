#!/usr/bin/env python
"""Seed the dev database with the demo user, the four projects of the frontend
fixtures, and one full workflow run for the Mentor platform, so the web app
opens on real data instead of an empty list.

    uv run python scripts/seed_demo.py [--reset]

The data matches the ids of `frontend/src/mocks/mock-ids.constants.ts` so the
API answers look exactly like what the mock server served: user
linh.pham@example.com, projects 90aa-0001 to -0004, the mentor platform's main
thread 7f3a-0001. Running the workflow once writes its artifacts, items,
steps and events, and the run row is marked succeeded, so the status bar shows
"Run 1: done" until the user starts their own run.
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, func, select

import khoailanggraph.api.models_registry  # noqa: F401 - registers every table
from khoailanggraph.agents.requirements_engineering.definition import agent_roles
from khoailanggraph.features.artifacts import models as artifacts_models
from khoailanggraph.features.me import hashing
from khoailanggraph.features.me import models as me_models
from khoailanggraph.features.projects import models as project_models
from khoailanggraph.features.runs import models as run_models
from khoailanggraph.features.runs import service as runs_service
from khoailanggraph.features.threads import models as thread_models
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import get_settings

DEMO_USER_ID = UUID("11b70000-0000-4000-8000-000000000001")
PROJECT_IDS = {
    "mentor": UUID("90aa0000-0000-4000-8000-000000000001"),
    "campus": UUID("90aa0000-0000-4000-8000-000000000002"),
    "library": UUID("90aa0000-0000-4000-8000-000000000003"),
    "laundry": UUID("90aa0000-0000-4000-8000-000000000004"),
}
MENTOR_THREAD_ID = UUID("7f3a0000-0000-4000-8000-000000000001")
MENTOR_RUN_ID = UUID("5f2d0000-0000-4000-8000-000000000001")
DEMO_INTENT = "I want to build an online platform for university students to find mentors."
DEMO_PASSWORD = "secret"  # noqa: S105 - demo credentials are public

PROJECTS = [
    (
        "mentor",
        "Mentor platform",
        "An online platform where university students find mentors.",
        "2026-10-06T08:41:12Z",
        "active",
    ),
    (
        "campus",
        "Campus food ordering",
        "Order food from campus canteens ahead of time.",
        "2026-10-05T16:20:00Z",
        "active",
    ),
    (
        "library",
        "Library booking",
        "Book study rooms in the university library.",
        "2026-10-03T10:12:00Z",
        "active",
    ),
    (
        "laundry",
        "Dorm laundry booking",
        "Book washing machines in the dorm laundry.",
        "2026-09-20T09:00:00Z",
        "archived",
    ),
]

# Wipe order respects foreign keys (children first).
WIPE_MODELS = (
    runs_service.__dict__.get("HumanDecisionRow"),
    None,
)


async def wipe(session) -> None:

    for model in (
        run_models.HumanDecisionRow,
        run_models.DirectiveRow,
        run_models.InterruptRow,
        run_models.RunEventRow,
        run_models.RunStepRow,
        run_models.RunRow,
        thread_models.MessageRow,
        thread_models.ThreadRow,
        artifacts_models.TraceLinkRow,
        artifacts_models.ItemRevisionRow,
        artifacts_models.ArtifactItemRow,
        artifacts_models.ArtifactRevisionRow,
        artifacts_models.ArtifactRow,
        project_models.ProjectKeyCounterRow,
        project_models.ProjectRow,
        me_models.SessionRow,
        me_models.UserSettingsRow,
        me_models.UserRow,
    ):
        await session.execute(delete(model))
    await session.commit()
    print("database reset")


async def seed(reset: bool) -> None:
    settings = get_settings()
    engine = make_async_engine(settings)
    await ensure_schema(engine)
    factory = make_session_factory(engine)
    sync_engine = make_sync_engine(settings)

    async with factory() as session:
        existing = await session.scalar(select(func.count()).select_from(me_models.UserRow))
        if existing and not reset:
            print("database already seeded; use --reset to wipe and start over")
            return
        if reset:
            await wipe(session)

        user = me_models.UserRow(
            id=DEMO_USER_ID,
            email="linh.pham@example.com",
            password_hash=hashing.hash_password(DEMO_PASSWORD),
            display_name="Linh Pham",
        )
        session.add(user)
        session.add(me_models.UserSettingsRow(user_id=DEMO_USER_ID))
        for key, name, description, stamp, status in PROJECTS:
            session.add(
                project_models.ProjectRow(
                    id=PROJECT_IDS[key],
                    owner_id=DEMO_USER_ID,
                    name=name,
                    description=description,
                    status=status,
                    last_activity_at=datetime.fromisoformat(stamp.replace("Z", "+00:00")),
                )
            )
        await session.flush()
        session.add(
            thread_models.ThreadRow(
                id=MENTOR_THREAD_ID,
                project_id=PROJECT_IDS["mentor"],
                created_by=DEMO_USER_ID,
                title="Main thread",
            )
        )
        await session.commit()
    await engine.dispose()

    config = runs_service.run_config_for(output_language="en")
    # The seed replays the scripted Mentor platform storyline by design
    # (fixtures of the frontend), whatever DEMO_MODE the machine runs with.
    config["models"] = {
        role: runs_service.FALLBACK_ROLE_MODEL for role in sorted(agent_roles())
    }
    runs_service.start_run_blocking(
        sync_engine,
        run_id=MENTOR_RUN_ID,
        thread_id=MENTOR_THREAD_ID,
        user_id=DEMO_USER_ID,
        initial_intent=DEMO_INTENT,
        first_run=True,
        config=config,
    )
    sync_engine.dispose()
    print("seed complete: linh.pham@example.com / secret; run 1 for «Mentor platform»")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--reset", action="store_true", help="wipe the seeded tables before seeding again"
    )
    args = parser.parse_args()
    asyncio.run(seed(args.reset))


if __name__ == "__main__":
    main()
