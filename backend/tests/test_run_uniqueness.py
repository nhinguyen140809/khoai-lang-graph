"""A thread holds at most one unfinished run of each workflow, and the database says so."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import pytest
import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from khoailanggraph.features.runs.models import RunRow
from khoailanggraph.platform.db import Base


@pytest.fixture
def session() -> Session:
    engine = sa.create_engine("sqlite://")
    Base.metadata.create_all(engine)
    return Session(engine)


def _run(thread_id: object, workflow: str, status: str, number: int) -> RunRow:
    return RunRow(
        id=uuid4(),
        thread_id=thread_id,
        project_id=uuid4(),
        number=number,
        started_by=uuid4(),
        workflow_name=workflow,
        workflow_version=1,
        status=status,
        current_stage="planning",
        run_config_json=b"{}",
        usage_json=b"{}",
        created_at=datetime.now(UTC),
    )


@pytest.mark.parametrize("status", ["queued", "running", "interrupted"])
def test_a_second_unfinished_run_of_a_workflow_in_a_thread_is_refused(
    session: Session, status: str
) -> None:
    thread_id = uuid4()
    session.add(_run(thread_id, "requirements_engineering", status, 1))
    session.flush()
    session.add(_run(thread_id, "requirements_engineering", "queued", 2))

    with pytest.raises(IntegrityError):
        session.flush()


def test_runs_that_ended_and_runs_of_other_workflows_do_not_count(session: Session) -> None:
    thread_id = uuid4()
    session.add_all(
        [
            _run(thread_id, "requirements_engineering", "succeeded", 1),
            _run(thread_id, "requirements_engineering", "failed", 2),
            _run(thread_id, "requirements_engineering", "running", 3),
            _run(thread_id, "assistance", "running", 4),
            _run(uuid4(), "requirements_engineering", "running", 1),
        ]
    )

    session.flush()


def test_two_runs_of_a_thread_never_share_a_number(session: Session) -> None:
    thread_id = uuid4()
    session.add(_run(thread_id, "requirements_engineering", "succeeded", 1))
    session.flush()
    session.add(_run(thread_id, "assistance", "succeeded", 1))

    with pytest.raises(IntegrityError):
        session.flush()
