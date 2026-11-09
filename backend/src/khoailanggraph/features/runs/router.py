"""Runs routes of docs/API.md §5 §6 with the compat shim for today's chat."""

from __future__ import annotations

import asyncio
import json as jsonlib
from typing import TYPE_CHECKING, Annotated, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from khoailanggraph.api import deps
from khoailanggraph.api.errors import ApiError
from khoailanggraph.api.schemas import MAX_LIMIT, Page
from khoailanggraph.features.runs import schemas, service
from khoailanggraph.features.runs.models import RunEventRow, RunRow, RunStepRow
from khoailanggraph.features.threads import service as thread_service
from khoailanggraph.features.threads.models import ThreadRow
from khoailanggraph.platform.db import make_sync_engine

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

router = APIRouter()


class CreateRunShim(BaseModel):
    """The chat's current wire: {input} -> {run_id} (TODO remove once the
    frontend moves to POST /threads/{id}/messages)."""

    model_config = ConfigDict(extra="forbid")

    input: str


def _sync_engine(request: Request) -> Any:
    """The worker engine on app.state, created on first use when missing."""
    engine = getattr(request.app.state, "sync_engine", None)
    if engine is None:
        engine = make_sync_engine(request.app.state.settings)
        request.app.state.sync_engine = engine
    return engine


@router.post("/threads/{thread_id}/messages", status_code=201)
async def send_message(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    request: Request,
    body: dict[str, Any],
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Any:
    """201 {message, run}: the task starts a new run, or waits as `pending`.

    The executor runs the workflow synchronously before answering, so
    the 201 already carries the finished run; the SSE endpoint replays the
    events this walk recorded.
    """
    import asyncio

    thread = await thread_service.get_thread_row(db, thread_id)
    content = str(body.get("content", ""))
    if not content.strip():
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            errors=[{"field": "content", "message": "Enter a value."}],
        )
    run_config = service.run_config_for(output_language="en")
    unfinished = await service.project_has_active_run(db, thread.project_id)
    message = await service.append_message(db, thread=thread, content=content)
    if unfinished:
        # §5: the message is never rejected; a busy run stores it as pending.
        message.delivery = "pending"
        latest_run = await db.scalar(
            select(RunRow)
            .where(RunRow.thread_id == thread.id)
            .order_by(RunRow.created_at.desc())
            .limit(1)
        )
        await db.flush()
        if latest_run is None:
            raise ApiError(
                409, "invalid_state", "Invalid state", "No run of this thread exists yet."
            )
        return {
            "message": service.message_output(message).model_dump(mode="json"),
            "run": service.runs_output(latest_run).model_dump(mode="json"),
        }

    run_id = uuid4()
    user_id = UUID(str(user.id))
    run = RunRow(
        id=run_id,
        thread_id=thread.id,
        project_id=thread.project_id,
        number=1,
        started_by=user_id,
        workflow_name=service.WF_NAME,
        workflow_version=service.WF_VERSION,
        status="queued",
        current_stage="intent_routing",
        run_config_json=jsonlib.dumps(run_config).encode("utf-8"),
        usage_json=jsonlib.dumps(service.ZERO_USAGE).encode("utf-8"),
    )
    db.add(run)
    message.run_id = run.id
    thread.active_run_id = run.id
    thread.active_run_status = "queued"
    await db.commit()  # the worker's connection must see the queued rows
    await asyncio.to_thread(
        service.start_run_blocking,
        _sync_engine(request),
        run_id=run_id,
        thread_id=thread.id,
        user_id=user_id,
        initial_intent=content,
        first_run=not thread.current_stage,
        config=run_config,
    )
    await db.refresh(run)  # what the worker wrote (status, stage, usage)
    return {
        "message": service.message_output(message).model_dump(mode="json"),
        "run": service.runs_output(run).model_dump(mode="json"),
    }


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
    import asyncio

    thread = await thread_service.get_thread_row(db, thread_id)
    run_config = service.run_config_for(output_language="en")
    run_id = uuid4()
    user_id = UUID(str(user.id))
    run = RunRow(
        id=run_id,
        thread_id=thread.id,
        project_id=thread.project_id,
        number=1,
        started_by=user_id,
        workflow_name=service.WF_NAME,
        workflow_version=service.WF_VERSION,
        status="queued",
        current_stage="intent_routing",
        run_config_json=jsonlib.dumps(run_config).encode("utf-8"),
        usage_json=jsonlib.dumps(service.ZERO_USAGE).encode("utf-8"),
        input_json=jsonlib.dumps({"input": body.input}).encode("utf-8"),
    )
    db.add(run)
    thread.active_run_id = run.id
    thread.active_run_status = "queued"
    await db.commit()  # worker connection must see the queued rows
    await asyncio.to_thread(
        service.start_run_blocking,
        _sync_engine(request),
        run_id=run_id,
        thread_id=thread.id,
        user_id=user_id,
        initial_intent=body.input,
        first_run=not thread.current_stage,
        config=run_config,
    )
    return {"run_id": str(run_id)}


@router.get("/threads/{thread_id}/runs")
async def list_runs(
    thread_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.Run]:
    """The runs of one thread, newest first (§5)."""
    statement = (
        select(RunRow).where(RunRow.thread_id == thread_id).order_by(RunRow.created_at.desc())
    )
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
    row = await service.get_run_row(db, run_id)
    return service.runs_output(row)


@router.get("/runs/{run_id}/steps")
async def get_run_steps(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    cursor: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = 50,
) -> Page[schemas.RunStep]:
    """Run steps in order, with usage and produced ItemRefs (§5)."""
    await service.get_run_row(db, run_id)
    statement = select(RunStepRow).where(RunStepRow.run_id == run_id).order_by(RunStepRow.sequence)
    statement = statement.offset(cursor).limit(limit) if cursor else statement.limit(limit)
    rows = list((await db.scalars(statement)).all())
    items = [service.run_step_output(row) for row in rows]
    return Page(items=items, next_cursor=cursor + len(items) if len(items) == limit else None)


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
    await service.get_run_row(db, run_id)
    header_id = request.headers.get("last-event-id") or request.headers.get("Last-Event-ID")
    cursor = int(header_id) if header_id is not None else after if after is not None else 0

    async def event_source() -> AsyncIterator[bytes]:
        idle_seconds = 0.0
        heartbeat_seconds = 15.0
        while True:
            rows = list(
                (
                    await db.execute(
                        select(RunEventRow)
                        .where(RunEventRow.run_id == run_id, RunEventRow.sequence > cursor)
                        .order_by(RunEventRow.sequence)
                    )
                ).scalars()
            )
            await asyncio.sleep(0)
            finished = False
            for row in rows:
                if row.type == "done":
                    finished = True
                payload = jsonlib.loads(row.data_json.decode("utf-8"))
                yield (
                    f"id: {row.sequence}\n"
                    f"event: {row.type}\n"
                    f"data: {jsonlib.dumps(payload, ensure_ascii=False)}\n\n"
                ).encode()
            await db.commit()
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
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


class ResumeBody(BaseModel):
    """POST /runs/{id}/resume (§5): the answer to a pending interrupt."""

    model_config = ConfigDict(extra="forbid")

    interrupt_id: str
    option: str
    feedback: str | None = None
    answers: dict[str, Any] = {}
    modified_items: list[dict[str, Any]] = []


@router.get("/runs/{run_id}/interrupts")
async def list_run_interrupts(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    status: Annotated[str | None, Query()] = None,
) -> list[dict[str, Any]]:
    """The interrupts of a run; ?status=pending gives the one to answer (§5)."""
    from khoailanggraph.features.runs.models import InterruptRow

    statement = select(InterruptRow).where(InterruptRow.run_id == run_id)
    if status is not None:
        statement = statement.where(InterruptRow.status == status)
    rows = list((await db.scalars(statement)).all())
    return [
        {
            "id": str(row.id),
            "run_id": str(row.run_id),
            "step_id": str(row.step_id) if row.step_id else None,
            "node": row.node,
            "prompt": row.prompt,
            "options": jsonlib.loads((row.options_json or b"[]").decode("utf-8")),
            "questions": jsonlib.loads((row.questions_json or b"[]").decode("utf-8")),
            "allow_edits": row.allow_edits,
            "review_artifacts": jsonlib.loads((row.artifacts_json or b"[]").decode("utf-8")),
            "status": row.status,
            "created_at": row.created_at,
            "resolved_at": row.resolved_at,
        }
        for row in rows
    ]


@router.post("/runs/{run_id}/resume")
async def resume_run(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    body: ResumeBody,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Run:
    """Answer the pending interrupt; the run continues along the option's edge.

    A run that is not waiting at a checkpoint answers 409 invalid_state (§5).
    """
    from datetime import UTC, datetime

    from khoailanggraph.features.runs.models import HumanDecisionRow, InterruptRow

    run = await db.get(RunRow, run_id)
    if run is None:
        raise ApiError(404, "not_found", "Not found", "The run does not exist.")
    pending = await db.scalar(
        select(InterruptRow)
        .where(InterruptRow.run_id == run_id, InterruptRow.status == "pending")
        .order_by(InterruptRow.created_at.desc())
    )
    if pending is None or (run.status != "interrupted" and pending is None):
        raise ApiError(
            409, "invalid_state", "Invalid state", "The run is not waiting at a checkpoint."
        )
    options = jsonlib.loads((pending.options_json or b"[]").decode("utf-8"))
    known = {option.get("key") for option in options}
    if body.option not in known:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            errors=[
                {
                    "field": "option",
                    "message": f"Choose one of: {', '.join(sorted(str(k) for k in known if k))}",
                }
            ],
        )
    approving = next(
        (o for o in options if o.get("key") == body.option and bool(o.get("approves"))),
        None,
    )
    if approving is not None:
        from khoailanggraph.features.artifacts.models import ArtifactRow

        artifact = (
            await db.get(ArtifactRow, UUID(approving.get("artifact_id", "")))
            if approving.get("artifact_id")
            else None
        )
        if artifact is not None:
            artifact.review_status = "approved"
    decision = HumanDecisionRow(
        id=uuid4(),
        interrupt_id=pending.id,
        run_id=run_id,
        decided_by=UUID(str(user.id)) if user.id else None,
        option=body.option,
        feedback=body.feedback,
    )
    db.add(decision)
    pending.status = "resolved"
    pending.resolved_at = datetime.now(UTC)
    run.status = "running"
    await db.flush()
    # Note: with review_checkpoints=[] no interrupt exists, so the
    # workflow-level continuation lives in the checkpointer path (gap-report).
    return service.runs_output(run)


class RetryBody(BaseModel):
    """POST /runs/{id}/retry: the step the new run starts from."""

    model_config = ConfigDict(extra="forbid")

    from_step_id: UUID


@router.post("/runs/{run_id}/retry", status_code=202)
async def retry_run(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    body: RetryBody,
    _origin: Annotated[None, Depends(deps.check_origin)] = None,
) -> schemas.Run:
    """Create a new run that starts from a step of this run (API.md).

    The artifacts are brought back to the versions the state of that step
    references when a retry executes; v1 records the lineage (retry_of_run_id)
    and queues the run — full state-restore execution is a documented
    follow-up of the executor.
    """
    run = await db.get(RunRow, run_id)
    if run is None:
        raise ApiError(404, "not_found", "Not found", "The run does not exist.")
    if await service.project_has_active_run(db, UUID(str(run.project_id))):
        raise ApiError(
            409,
            "run_already_active",
            "Invalid state",
            "A run of this project is already running or waiting.",
        )
    step = await db.get(RunStepRow, body.from_step_id)
    if step is None or str(step.run_id) != str(run_id):
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            "from_step_id must be a step of this run.",
        )
    thread = await db.get(ThreadRow, run.thread_id)
    retry = RunRow(
        thread_id=run.thread_id,
        project_id=run.project_id,
        number=run.number + 1,
        started_by=user.id,
        workflow_name=run.workflow_name,
        workflow_version=run.workflow_version,
        status="queued",
        current_stage=str(step.stage or ""),
        run_config_json=run.run_config_json,
        usage_json=jsonlib.dumps(service.ZERO_USAGE).encode("utf-8"),
        retry_of_run_id=run.id,
    )
    db.add(retry)
    if thread is not None:
        thread.active_run_id = retry.id
        thread.active_run_status = "queued"
    await db.flush()
    return service.runs_output(retry)


@router.post("/runs/{run_id}/cancel")
async def cancel_run(
    run_id: UUID,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Run:
    """Cancel an unfinished run; finished runs answer 409 (§5)."""
    row = await service.get_run_row(db, run_id)
    if row.status in {"succeeded", "failed", "cancelled"}:
        raise ApiError(409, "invalid_state", "Invalid state", f"The run already {row.status}.")
    row.status = "cancelled"
    await db.flush()
    return service.runs_output(row)
