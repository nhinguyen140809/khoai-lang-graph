"""Answering the messages of a thread as a job of the server.

Sending a message stores it and starts the run of the assistance workflow that answers it; the
request ends there. The job asks the assistant what the message is. A message about the application
is answered in that run. A message about the work of the project takes the run away and goes where
it always went: it starts a run of the main workflow, or waits as pending in the one that is
unfinished. A message that came while the assistant was answering another waits, and is answered
when that run ends, one after the other.
"""

from __future__ import annotations

import asyncio
import json as jsonlib
from dataclasses import dataclass, replace
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import structlog
from sqlalchemy import select

from khoailanggraph.agents import workflows
from khoailanggraph.features.assistant import recorder
from khoailanggraph.features.assistant import service as assistant_service
from khoailanggraph.features.me.models import UserRow
from khoailanggraph.features.projects import service as projects_service
from khoailanggraph.features.runs import config as run_config_rules
from khoailanggraph.features.runs import service
from khoailanggraph.features.runs.background import executor_of, start_job
from khoailanggraph.features.runs.models import UNFINISHED_RUN_STATUSES, RunRow
from khoailanggraph.features.threads.models import MessageRow, ThreadRow

if TYPE_CHECKING:
    from fastapi import FastAPI
    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.projects.models import ProjectRow
    from khoailanggraph.features.projects.schemas import RunDefaults

logger = structlog.get_logger(__name__)

_TASKS_ATTRIBUTE = "answer_tasks"


@dataclass(frozen=True)
class RunChoices:
    """What the sender of a message chose for a run that the message may start."""

    run_config: RunDefaults | None = None
    models: dict[str, str] | None = None


@dataclass(frozen=True)
class Answer:
    """A message to answer, and the run of the assistant that answers it."""

    user_id: UUID
    message_id: UUID
    run_id: UUID
    choices: RunChoices = RunChoices()


@dataclass(frozen=True)
class Turn:
    """The rows that a message is handled with."""

    user: UserRow
    thread: ThreadRow
    project: ProjectRow
    message: MessageRow
    choices: RunChoices


async def enter_workflow(app: FastAPI, session: AsyncSession, turn: Turn) -> None:
    """Hand a message about the work of the project to the main workflow: it starts a run, or
    waits as `pending` in the run of the thread that is unfinished."""
    user, thread, project, message = turn.user, turn.thread, turn.project, turn.message
    unfinished = await service.unfinished_run_of_thread(
        session, thread.id, workflows.MAIN_WORKFLOW.name
    )
    if unfinished is not None:
        message.run_id = unfinished.id
        message.delivery = "pending"
        return
    resolved = await run_config_rules.resolve_run_config(
        session, project, user.id, run_config=turn.choices.run_config, models=turn.choices.models
    )
    try:
        run = await service.create_run(
            session,
            thread.id,
            lambda number: RunRow(
                id=uuid4(),
                thread_id=thread.id,
                project_id=thread.project_id,
                number=number,
                started_by=user.id,
                workflow_name=service.WF_NAME,
                workflow_version=service.WF_VERSION,
                status="queued",
                current_stage="intent_routing",
                run_config_json=jsonlib.dumps(resolved).encode("utf-8"),
                usage_json=jsonlib.dumps(service.ZERO_USAGE).encode("utf-8"),
            ),
        )
    except service.RunConflictError as conflict:
        # Another request started the run of this thread first: the message waits for it.
        message.run_id = conflict.existing.id
        message.delivery = "pending"
        return
    message.run_id = run.id
    message.delivery = "started_run"
    if project.initial_message_id is None:
        project.initial_message_id = message.id
    await session.commit()  # the worker's connection must see the queued rows
    await start_job(app, run.id)


class _RunWatcher:
    """What the assistant tells its run while it works, kept as the run's rows as it goes: a call of
    a tool shows at once, and a message that came into the run is taken in for the next step."""

    def __init__(self, session: AsyncSession, run: RunRow, message: MessageRow) -> None:
        self._session = session
        self._run = run
        self._message = message

    async def called(self, tool: str, subject: str | None) -> None:
        await recorder.note_call(self._session, self._run, tool, subject)
        await self._session.commit()  # a page that asks for the run sees it now

    async def arrived(self) -> list[MessageRow]:
        taken = await recorder.take_arrived(self._session, self._run, self._message)
        if taken:
            await self._session.commit()
        return taken


async def _answer_one(app: FastAPI, session: AsyncSession, answer: Answer) -> None:
    user = await session.get(UserRow, answer.user_id)
    message = await session.get(MessageRow, answer.message_id)
    run = await session.get(RunRow, answer.run_id)
    if user is None or message is None or run is None:
        return
    thread = await session.get(ThreadRow, message.thread_id)
    if thread is None:
        return
    project = await projects_service.own_project_row(session, thread.project_id, user)
    watcher = _RunWatcher(session, run, message)
    asked = assistant_service.Asked(project, thread, message.content, user)
    outcome = await assistant_service.decide(session, asked, watcher)
    if outcome.decision.kind == "general":
        await recorder.finish_answer(session, thread, run, outcome)
        return
    # What deciding cost is kept apart: a message about the work has no run of the assistant.
    await assistant_service.record_turn(session, user, project, thread, outcome)
    await recorder.discard_answer(session, run)
    # The assistant read the messages that came meanwhile with this one, and they all are about the
    # work: each goes to the main workflow in the order it came.
    for sent in (message, *outcome.arrived):
        sent.run_id = None
        sent.delivered_in_step_id = None
        await enter_workflow(app, session, Turn(user, thread, project, sent, answer.choices))


async def _next_waiting(session: AsyncSession, thread_id: UUID) -> MessageRow | None:
    """The oldest message of the thread that waits for a run of the assistant that has ended."""
    return await session.scalar(
        select(MessageRow)
        .join(RunRow, RunRow.id == MessageRow.run_id)
        .where(
            MessageRow.thread_id == thread_id,
            MessageRow.author == "user",
            MessageRow.delivery == "pending",
            RunRow.workflow_name == workflows.ASSISTANCE.name,
            RunRow.status.not_in(UNFINISHED_RUN_STATUSES),
        )
        .order_by(MessageRow.sequence)
        .limit(1)
    )


async def _answer_thread(app: FastAPI, first: Answer) -> None:
    factory = app.state.session_factory
    answer = first
    while True:
        async with factory() as session:
            try:
                await _answer_one(app, session, answer)
                await session.commit()
            except Exception as exc:
                await session.rollback()
                logger.exception("assistant job failed", run_id=str(answer.run_id))
                run = await session.get(RunRow, answer.run_id)
                if run is not None and run.status in UNFINISHED_RUN_STATUSES:
                    reason = f"{type(exc).__name__}: {str(exc)[:200]}"
                    await recorder.fail_answer(session, run, reason)
                    await session.commit()
            message = await session.get(MessageRow, answer.message_id)
            waiting = None if message is None else await _next_waiting(session, message.thread_id)
            user = await session.get(UserRow, answer.user_id)
            thread = None if waiting is None else await session.get(ThreadRow, waiting.thread_id)
            if waiting is None or user is None or thread is None:
                return
            waiting.delivery = "delivered"
            try:
                next_run = await recorder.start_answer(session, user, thread, waiting)
            except service.RunConflictError:
                # Another job answers this thread now, and looks for the messages that wait when
                # its run ends.
                await session.rollback()
                return
            await session.commit()
            # What the sender of a message that waited chose is not kept: it takes the defaults.
            answer = replace(first, message_id=waiting.id, run_id=next_run.id, choices=RunChoices())


async def submit(app: FastAPI, answer: Answer) -> None:
    """Start the job that answers a message: in the background, or waited for in inline mode."""
    job = _answer_thread(app, answer)
    if executor_of(app).inline:
        await job
        return
    tasks: set[asyncio.Task[None]] = getattr(app.state, _TASKS_ATTRIBUTE, set())
    setattr(app.state, _TASKS_ATTRIBUTE, tasks)
    task = asyncio.create_task(job)
    tasks.add(task)
    task.add_done_callback(tasks.discard)
