"""Runs routes of docs/API.md §5 §6 with the compat shim for today's chat."""

from __future__ import annotations

import asyncio
import json as jsonlib
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Annotated, Any, Literal, cast
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select

from khoailanggraph.api import deps, idempotency
from khoailanggraph.api.errors import ApiError
from khoailanggraph.api.schemas import MAX_LIMIT, Cursor, Page
from khoailanggraph.features.artifacts.models import ArtifactItemRow
from khoailanggraph.features.assistant import recorder as assistant_recorder
from khoailanggraph.features.projects import service as projects_service
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.projects.schemas import RunDefaults  # noqa: TC001 - body model
from khoailanggraph.features.runs import answering, background, schemas, service
from khoailanggraph.features.runs import config as run_config
from khoailanggraph.features.runs import resume as resume_rules
from khoailanggraph.features.runs.executor import RunExecutor
from khoailanggraph.features.runs.models import (
    UNFINISHED_RUN_STATUSES,
    DirectiveRow,
    HumanDecisionRow,
    InterruptRow,
    RunEventRow,
    RunRow,
    RunStepRow,
)
from khoailanggraph.features.threads import service as thread_service
from khoailanggraph.features.threads.models import MessageRow, ThreadRow

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.me.models import UserRow
    from khoailanggraph.features.runs.executor import RunExecutor

router = APIRouter()


def _sync_engine(request: Request) -> Any:
    """The worker engine on app.state, created on first use when missing."""
    return background.sync_engine_of(request.app)


@router.get("/threads/{thread_id}/messages")
async def list_messages(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Message]:
    """The chat messages of a thread in the order they were sent: what the user wrote and the
    report of each step of the agents, with the artifacts and the items it refers to (§5)."""
    await thread_service.get_thread_row(db, thread_id, UUID(str(user.id)))
    rows = list(
        (
            await db.scalars(
                select(MessageRow)
                .where(MessageRow.thread_id == thread_id)
                .order_by(MessageRow.sequence)
                .offset(cursor)
                .limit(limit + 1)
            )
        ).all()
    )
    window = rows[:limit]
    return Page(
        items=[service.message_output(row) for row in window],
        next_cursor=cursor + limit if len(rows) > limit else None,
    )


class MessageBody(BaseModel):
    """POST /threads/{id}/messages: the text, and the settings a run started by it uses."""

    model_config = ConfigDict(extra="forbid")

    content: str
    run_config: RunDefaults | None = None
    models: dict[str, str] | None = None


def _executor(request: Request) -> RunExecutor:
    """The executor on app.state, created on first use when missing."""
    return background.executor_of(request.app)


async def _start_job(request: Request, run_id: UUID, resume_interrupt: UUID | None = None) -> None:
    await background.start_job(request.app, run_id, resume_interrupt)


async def _wait_for_run(db: AsyncSession, message: MessageRow, run: RunRow) -> dict[str, Any]:
    """The answer for a message that waits in the run of its thread that is unfinished."""
    message.delivery = "pending"
    await db.flush()
    return {
        "message": service.message_output(message).model_dump(mode="json"),
        "run": service.runs_output(run).model_dump(mode="json"),
    }


async def _start_answer_or_wait(
    db: AsyncSession, user: UserRow, thread: ThreadRow, message: MessageRow
) -> RunRow | dict[str, Any]:
    """The run of the assistant that answers the message, or the response of a message that waits.

    The assistant answers one message of a thread at a time. A message that comes while it answers
    another waits for that run, and the job of that run answers it when it ends. The wait is
    committed before the run is looked at again: a run that ended meanwhile did not see the message,
    and then the message is answered here.
    """
    while True:
        try:
            return await assistant_recorder.start_answer(db, user, thread, message)
        except service.RunConflictError as conflict:
            waiting_for = conflict.existing.id
        message.run_id = waiting_for
        message.delivery = "pending"
        await db.commit()
        existing = await db.get(RunRow, waiting_for, populate_existing=True)
        if existing is not None and existing.status in UNFINISHED_RUN_STATUSES:
            return await _wait_for_run(db, message, existing)
        message.delivery = "delivered"


async def _send(
    request: Request,
    db: AsyncSession,
    user: UserRow,
    thread: ThreadRow,
    body: MessageBody,
) -> dict[str, Any]:
    """Store a message of the user and hand it to what answers it.

    The assistant decides first whether the message belongs to the workflow or to the application.
    A message about the application is answered and stored, with no run; every other message starts
    a run, or waits as pending in the run that is unfinished, exactly as before.
    """
    if not body.content.strip():
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            errors=[{"field": "content", "message": "Enter a value."}],
        )
    run_config.request_problems(body.run_config, body.models)
    await service.ensure_budget(db, user)
    user_id = UUID(str(user.id))
    # The thread may name any id; only the project of the caller is read, and a thread of another
    # user answers as missing.
    await projects_service.own_project_row(db, thread.project_id, user)

    # The message is stored and the assistant answers it as a job of the server: the request ends
    # here, and the run that answers is the run that the response names.
    message = await service.append_message(
        db, thread=thread, content=body.content, delivery="delivered"
    )
    run = await _start_answer_or_wait(db, user, thread, message)
    if isinstance(run, dict):
        return run
    await db.commit()  # the job's connection must see the rows
    await answering.submit(
        request.app,
        answering.Answer(
            user_id=user_id,
            message_id=message.id,
            run_id=run.id,
            choices=answering.RunChoices(run_config=body.run_config, models=body.models),
        ),
    )
    # What the job wrote, when it was waited for: a message that went to the work of the project
    # names the run of the work, and the run of the assistant is gone.
    await db.refresh(message)
    run = await db.get(RunRow, message.run_id or run.id, populate_existing=True) or run
    return {
        "message": service.message_output(message).model_dump(mode="json"),
        "run": service.runs_output(run).model_dump(mode="json"),
    }


@router.post("/threads/{thread_id}/messages", status_code=201)
async def send_message(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    request: Request,
    body: MessageBody,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Any:
    """201 {message, run}: the run of the assistant that answers the message while it works, which
    the stream follows. A message about the work then starts a run, or waits as `pending` in the
    run that is unfinished, as the job of the assistant decides (§5)."""
    thread = await thread_service.get_thread_row(db, thread_id, UUID(str(user.id)))
    key = request.headers.get("Idempotency-Key")
    scope = f"POST {request.url.path}"
    user_id = UUID(str(user.id))
    stored = await idempotency.find_response(db, user_id, key, scope)
    if stored is not None:
        return JSONResponse(status_code=stored[0], content=stored[1])
    result = await _send(request, db, user, thread, body)
    await idempotency.store_response(db, user_id, key, scope, 201, result)
    return JSONResponse(status_code=201, content=result)


class CreateRunShim(BaseModel):
    """The chat's current wire: {input} -> {run_id}."""

    model_config = ConfigDict(extra="forbid")

    input: str


@router.post("/threads/{thread_id}/runs")
async def create_run_shim(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    request: Request,
    body: CreateRunShim,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> dict[str, str]:
    """Compat shim: {input} -> {run_id}, the wire the chat reads today."""
    thread = await thread_service.get_thread_row(db, thread_id, UUID(str(user.id)))
    result = await _send(request, db, user, thread, MessageBody(content=body.input))
    return {"run_id": str(result["run"]["id"])}


@router.get("/threads/{thread_id}/runs")
async def list_runs(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
    workflow: Annotated[str | None, Query()] = None,
) -> Page[schemas.Run]:
    """The runs of one thread, newest first (§5): every run, or only those of the workflow that
    `?workflow=` names."""
    await thread_service.get_thread_row(db, thread_id, UUID(str(user.id)))
    statement = (
        select(RunRow).where(RunRow.thread_id == thread_id).order_by(RunRow.created_at.desc())
    )
    if workflow is not None:
        statement = statement.where(RunRow.workflow_name == workflow)
    statement = statement.offset(cursor).limit(limit) if cursor else statement.limit(limit)
    rows = list((await db.scalars(statement)).all())
    items = [service.runs_output(row) for row in rows]
    return Page(items=items, next_cursor=cursor + len(items) if len(items) == limit else None)


@router.get("/runs/{run_id}")
async def get_run(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.Run:
    row = await service.get_run_row(db, run_id, UUID(str(user.id)))
    return service.runs_output(row)


@router.get("/runs/{run_id}/steps")
async def get_run_steps(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.RunStep]:
    """Run steps in order, with usage and produced ItemRefs (§5)."""
    await service.get_run_row(db, run_id, UUID(str(user.id)))
    statement = select(RunStepRow).where(RunStepRow.run_id == run_id).order_by(RunStepRow.sequence)
    statement = statement.offset(cursor).limit(limit + 1) if cursor else statement.limit(limit + 1)
    rows = list((await db.scalars(statement)).all())
    items = [service.run_step_output(row) for row in rows[:limit]]
    return Page(items=items, next_cursor=cursor + limit if len(rows) > limit else None)


@router.get("/runs/{run_id}/stream")
async def stream_run_events(
    run_id: UUID,
    user: deps.CurrentUser,
    request: Request,
    db: deps.DbSession,
    after: Annotated[int | None, Query(ge=0)] = None,
) -> StreamingResponse:
    """SSE (§6): the run event log, live and replayable.

    `id:` = the event sequence, so `Last-Event-ID` (or `?after=`) resumes
    exactly where a dropped connection left; a comment `: ping` keeps the
    connection warm every 15 s; the stream closes itself after `done` and
    stays open (heartbeats only) while the run waits at an interrupt.
    """
    await service.get_run_row(db, run_id, UUID(str(user.id)))
    # The stream reads with sessions of its own. This one goes back to the pool now, so that a
    # stream that is cancelled does not keep a connection checked out.
    await db.close()
    header_id = request.headers.get("last-event-id") or request.headers.get("Last-Event-ID")
    start = int(header_id) if header_id is not None else after if after is not None else 0

    session_factory = request.app.state.session_factory

    async def event_source() -> AsyncIterator[bytes]:
        # A first line at once makes a proxy in front of the API send the headers and open the
        # stream, instead of holding it until the first event or ping.
        yield b": open\n\n"
        cursor = start
        idle_seconds = 0.0
        heartbeat_seconds = 15.0
        while True:
            if await request.is_disconnected():
                return
            # Each read has a session of its own: a stream lives far longer than the request
            # session, which is closed when the client leaves.
            async with session_factory() as session:
                rows = list(
                    (
                        await session.execute(
                            select(RunEventRow)
                            .where(RunEventRow.run_id == run_id, RunEventRow.sequence > cursor)
                            .order_by(RunEventRow.sequence)
                        )
                    ).scalars()
                )
            finished = False
            if rows:
                cursor = rows[-1].sequence
            for row in rows:
                if row.type == "done":
                    finished = True
                payload = jsonlib.loads(row.data_json.decode("utf-8"))
                yield (
                    f"id: {row.sequence}\n"
                    f"event: {row.type}\n"
                    f"data: {jsonlib.dumps(payload, ensure_ascii=False)}\n\n"
                ).encode()
            if finished:
                return
            if rows:
                idle_seconds = 0.0
                continue
            idle_seconds += 0.25
            if idle_seconds >= heartbeat_seconds:
                yield b": ping\n\n"
                idle_seconds = 0.0
            await asyncio.sleep(0.25)

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


@router.get("/runs/{run_id}/directives")
async def list_directives(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Directive]:
    """The directives of a run with their items, ordered by iteration: why the run looped."""
    await service.get_run_row(db, run_id, UUID(str(user.id)))
    rows = list(
        (
            await db.scalars(
                select(DirectiveRow)
                .where(DirectiveRow.run_id == run_id)
                .order_by(DirectiveRow.iteration, DirectiveRow.created_at)
                .offset(cursor)
                .limit(limit + 1)
            )
        ).all()
    )
    views = [await service.directive_output(db, row) for row in rows[:limit]]
    return Page(items=views, next_cursor=cursor + limit if len(rows) > limit else None)


@router.get("/runs/{run_id}/state")
async def get_run_state(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.RunState:
    """The workflow state after the latest step that saved one (§5)."""
    run = await service.get_run_row(db, run_id, UUID(str(user.id)))
    step = await db.scalar(
        select(RunStepRow)
        .where(RunStepRow.run_id == run_id, RunStepRow.state_json.is_not(None))
        .order_by(RunStepRow.sequence.desc())
        .limit(1)
    )
    return service.run_state_output(run, step)


@router.get("/runs/{run_id}/steps/{step_id}/state")
async def get_step_state(
    run_id: UUID,
    step_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.RunState:
    """The workflow state saved after one step: the starting point of a retry from the next."""
    run = await service.get_run_row(db, run_id, UUID(str(user.id)))
    step = await db.get(RunStepRow, step_id)
    if step is None or step.run_id != run_id or step.state_json is None:
        raise ApiError(404, "not_found", "Not found", "No state was saved for this step.")
    return service.run_state_output(run, step)


@router.get("/runs/{run_id}/interrupts")
async def list_interrupts(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    status: Annotated[Literal["pending", "resolved", "cancelled"] | None, Query()] = None,
    cursor: Cursor = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Interrupt]:
    """The interrupts of a run, the oldest first, each with the decision that resolved it;
    `?status=pending` gives the one the user must answer (§5)."""
    await service.get_run_row(db, run_id, UUID(str(user.id)))
    statement = select(InterruptRow).where(InterruptRow.run_id == run_id)
    if status is not None:
        statement = statement.where(InterruptRow.status == status)
    rows = list((await db.scalars(statement.order_by(InterruptRow.created_at))).all())
    decisions = {
        decision.interrupt_id: decision
        for decision in (
            await db.scalars(select(HumanDecisionRow).where(HumanDecisionRow.run_id == run_id))
        ).all()
    }
    views = [service.interrupt_output(row, decisions.get(row.id)) for row in rows]
    window = views[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(views) else None
    return Page(items=window, next_cursor=next_cursor)


class ModifiedItem(BaseModel):
    """An item the user edited before answering, at the version it has now."""

    model_config = ConfigDict(extra="forbid")

    item_id: str
    version: int


class ResumeBody(BaseModel):
    """POST /runs/{id}/resume (§5): the answer to the pending interrupt."""

    model_config = ConfigDict(extra="forbid")

    interrupt_id: str
    option: str | None = None
    feedback: str | None = None
    answers: dict[str, Any] = {}
    modified_items: list[ModifiedItem] = []


async def _modified_item_problems(
    db: AsyncSession, interrupt: InterruptRow, body: ResumeBody
) -> tuple[list[dict[str, str]], list[dict[str, Any]]]:
    """The problems of the edited items a resume lists, and the references to store."""
    if not body.modified_items:
        return [], []
    if not interrupt.allow_edits:
        return [{"field": "modified_items", "message": "This review does not take edits."}], []
    listed = {
        UUID(str(ref["artifact_id"]))
        for ref in jsonlib.loads((interrupt.artifacts_json or b"[]").decode("utf-8"))
    }
    problems: list[dict[str, str]] = []
    refs: list[dict[str, Any]] = []
    for index, entry in enumerate(body.modified_items):
        field = f"modified_items.{index}"
        try:
            item = await db.get(ArtifactItemRow, UUID(entry.item_id))
        except ValueError:
            item = None
        if item is None or item.artifact_id not in listed:
            problems.append({"field": field, "message": "Not an item of the artifacts in review."})
        elif not 1 <= entry.version <= item.version:
            problems.append({"field": field, "message": "Not a version of this item."})
        else:
            refs.append(
                {
                    "item_id": str(item.id),
                    "kind": item.kind,
                    "key": item.key,
                    "version": entry.version,
                }
            )
    return problems, refs


@router.post("/runs/{run_id}/resume", status_code=202)
async def resume_run(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    request: Request,
    body: ResumeBody,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Any:
    """Answer the pending interrupt; the run continues along the edge of the option (§5).

    A run that is not waiting at this interrupt answers 409 invalid_state.
    """
    user_id = UUID(str(user.id))
    key = request.headers.get("Idempotency-Key")
    scope = f"POST {request.url.path}"
    stored = await idempotency.find_response(db, user_id, key, scope)
    if stored is not None:
        return JSONResponse(status_code=stored[0], content=stored[1])
    run = await service.get_run_row(db, run_id, UUID(str(user.id)))
    if run.status != "interrupted":
        raise ApiError(
            409, "invalid_state", "Invalid state", "The run is not waiting for a review."
        )
    try:
        interrupt = await db.get(InterruptRow, UUID(body.interrupt_id))
    except ValueError:
        interrupt = None
    if interrupt is None or interrupt.run_id != run_id:
        raise ApiError(404, "not_found", "Not found", "The interrupt does not exist.")
    if interrupt.status != "pending":
        raise ApiError(
            409, "invalid_state", "Invalid state", "The run is not waiting at this interrupt."
        )
    options = jsonlib.loads((interrupt.options_json or b"[]").decode("utf-8"))
    questions = jsonlib.loads((interrupt.questions_json or b"[]").decode("utf-8"))
    item_problems, modified = await _modified_item_problems(db, interrupt, body)
    problems = [
        *resume_rules.option_problems(options, body.option, body.feedback),
        *resume_rules.answer_problems(questions, body.answers),
        *item_problems,
    ]
    if problems:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            "The body has fields that are not valid.",
            errors=problems,
        )
    await service.ensure_budget(db, user)
    db.add(
        HumanDecisionRow(
            id=uuid4(),
            interrupt_id=interrupt.id,
            run_id=run_id,
            decided_by=user_id,
            option=body.option,
            feedback=body.feedback,
            answers_json=jsonlib.dumps(body.answers).encode("utf-8"),
            modified_items_json=jsonlib.dumps(modified).encode("utf-8"),
        )
    )
    interrupt.status = "resolved"
    interrupt.resolved_at = datetime.now(UTC)
    run.status = "running"
    await db.commit()
    await _start_job(request, run_id, resume_interrupt=interrupt.id)
    await db.refresh(run)
    result = service.runs_output(run).model_dump(mode="json")
    await idempotency.store_response(db, user_id, key, scope, 202, result)
    return JSONResponse(status_code=202, content=result)


class RetryBody(BaseModel):
    """POST /runs/{id}/retry: the step the new run starts from."""

    model_config = ConfigDict(extra="forbid")

    from_step_id: UUID


@router.post("/runs/{run_id}/retry", status_code=202)
async def retry_run(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    request: Request,
    body: RetryBody,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Any:
    """Create a new run that starts from a step of this run (§5). The new run resolves its
    settings now; earlier steps are not executed again."""
    user_id = UUID(str(user.id))
    key = request.headers.get("Idempotency-Key")
    scope = f"POST {request.url.path}"
    stored = await idempotency.find_response(db, user_id, key, scope)
    if stored is not None:
        return JSONResponse(status_code=stored[0], content=stored[1])
    run = await service.get_run_row(db, run_id, UUID(str(user.id)))
    if await service.project_has_active_run(db, run.project_id):
        raise ApiError(
            409,
            "run_already_active",
            "Invalid state",
            "A run of this project is already running or waiting.",
        )
    step = await db.get(RunStepRow, body.from_step_id)
    if step is None or step.run_id != run_id:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            errors=[{"field": "from_step_id", "message": "Not a step of this run."}],
        )
    await service.ensure_budget(db, user)
    await thread_service.get_thread_row(db, run.thread_id, UUID(str(user.id)))
    project = cast("ProjectRow", await db.get(ProjectRow, run.project_id))
    resolved = await run_config.resolve_run_config(db, project, user_id)
    try:
        retry = await service.create_run(
            db,
            run.thread_id,
            lambda number: RunRow(
                id=uuid4(),
                thread_id=run.thread_id,
                project_id=run.project_id,
                number=number,
                started_by=user_id,
                workflow_name=run.workflow_name,
                workflow_version=run.workflow_version,
                status="queued",
                current_stage=step.stage,
                run_config_json=jsonlib.dumps(resolved).encode("utf-8"),
                usage_json=jsonlib.dumps(service.ZERO_USAGE).encode("utf-8"),
                retry_of_run_id=run.id,
                input_json=jsonlib.dumps({"retry_from_step_id": str(step.id)}).encode("utf-8"),
            ),
        )
    except service.RunConflictError:
        # Another request started a run of the thread between the check above and the write.
        raise ApiError(
            409,
            "run_already_active",
            "Invalid state",
            "A run of this project is already running or waiting.",
        ) from None
    await db.commit()
    await _start_job(request, retry.id)
    await db.refresh(retry)
    result = service.runs_output(retry).model_dump(mode="json")
    await idempotency.store_response(db, user_id, key, scope, 202, result)
    return JSONResponse(status_code=202, content=result)


@router.post("/runs/{run_id}/cancel", status_code=202)
async def cancel_run(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Run:
    """Stop an unfinished run (§5): the run becomes cancelled, a pending interrupt is cancelled
    with it and the stream sends `done`. A walk in progress stops at the end of its step; items
    already written stay. A finished run answers 409."""
    row = await service.get_run_row(db, run_id, UUID(str(user.id)))
    if row.status in {"succeeded", "failed", "cancelled"}:
        raise ApiError(409, "invalid_state", "Invalid state", f"The run already {row.status}.")
    row.status = "cancelled"
    row.finished_at = datetime.now(UTC)
    for pending in (
        await db.scalars(
            select(InterruptRow).where(
                InterruptRow.run_id == run_id, InterruptRow.status == "pending"
            )
        )
    ).all():
        pending.status = "cancelled"
    top = await db.scalar(
        select(func.max(RunEventRow.sequence)).where(RunEventRow.run_id == run_id)
    )
    sequence = int(top or 0) + 1
    db.add(
        RunEventRow(
            run_id=run_id,
            sequence=sequence,
            type="done",
            data_json=jsonlib.dumps({"status": "cancelled"}).encode("utf-8"),
        )
    )
    row.last_event_id = sequence
    thread = await db.get(ThreadRow, row.thread_id)
    if thread is not None:
        thread.current_stage = row.current_stage
    await service.undeliver_pending(db, row.thread_id)
    await db.flush()
    return service.runs_output(row)
