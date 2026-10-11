"""Run creation + the demo executor: message POST, the runs shim, and the
background task that walks the whole 15-node workflow through the DB sink
(§5 run lifecycle). On the dev SQLite demo the executor runs the workflow
with the roles pointed at `fake:demo` and writes artifacts, items, links,
steps and events as it goes — the same walk Phase C proves in-process, now
persisted, and serving the shapes the reads (runs, steps, search, SSE) answer
from.

The executor is deliberately synchronous-inline for the demo: POST /messages
answers with {message, run} of a run in `queued`, runs the graph to completion
(or to its first interrupt) before answering — good enough for the API
contract and dramatically simpler than task infrastructure; the async-polling
SSE endpoint replays over the events the run already recorded. A later change
moves the walk into a background thread without touching this contract.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker  # noqa: TC002 - runtime types

from khoailanggraph.agents.requirements_engineering.definition import agent_roles
from khoailanggraph.agents.requirements_engineering.graph import build_re_graph
from khoailanggraph.agents.requirements_engineering.state import make_initial_state
from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.artifacts.service import SqlArtifactSink
from khoailanggraph.features.threads.models import MessageRow, ThreadRow
from khoailanggraph.llm import reset_model_cache
from khoailanggraph.platform.db import make_sync_session_factory
from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.runs import schemas
from khoailanggraph.features.runs.models import (
    DirectiveRow,
    RunEventRow,
    RunRow,
    RunStepRow,
)

WF_NAME = "requirements_engineering"
WF_VERSION = 1
FALLBACK_ROLE_MODEL = "fake:demo"


def utcnow() -> datetime:
    return datetime.now(UTC)


def _loads(blob: bytes) -> Any:
    return json.loads((blob or b"null").decode("utf-8"))


def _dumps(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False).encode("utf-8")


ZERO_USAGE: dict[str, Any] = {
    "input_tokens": 0,
    "output_tokens": 0,
    "cache_read_tokens": 0,
    "cache_write_tokens": 0,
    "cost_usd": 0.0,
    "duration_ms": 0,
}


DEFAULT_RUN_CONFIG: dict[str, Any] = {
    "models": {},
    "review_checkpoints": [],
    "output_language": "en",
    "max_steps": 400,
    "max_cost_usd": None,
    "parameters": {
        "target_personas_num": 3,
        "max_personas": 3,
        "max_turns": 6,
        "max_iterations": 2,
    },
}


def role_models() -> dict[str, str]:
    """The per-role model map of a run.

    Demo mode pins every role to the keyless fake provider; with
    `DEMO_MODE=false` the map is empty and each role resolves through
    `config/models.yaml` (defaults/roles) against the gateway env keys.
    """
    if get_settings().demo_mode:
        return {role: FALLBACK_ROLE_MODEL for role in sorted(agent_roles())}
    return {}


def run_config_for(output_language: str = "en") -> dict[str, Any]:
    config = dict(DEFAULT_RUN_CONFIG)
    config["models"] = role_models()
    config["output_language"] = output_language
    return config


def runs_output(row: RunRow) -> schemas.Run:
    """The Run view of the client's Zod (every field of API.md §5)."""
    config = _loads(row.run_config_json)
    return schemas.Run(
        id=str(row.id),
        thread_id=str(row.thread_id),
        project_id=str(row.project_id),
        number=row.number,
        started_by=str(row.started_by),
        workflow_name=row.workflow_name,
        workflow_version=row.workflow_version,
        status=row.status,
        current_stage=row.current_stage,
        iteration_count=row.iteration_count,
        run_config=schemas.RunConfig.model_validate(config),
        retry_of_run_id=str(row.retry_of_run_id) if row.retry_of_run_id else None,
        error=(
            schemas.RunError(
                code=str(row.error_code),
                message=str(row.error_message),
                stage=str(row.error_stage),
            )
            if row.error_code
            else None
        ),
        usage=schemas.Usage.model_validate(_loads(row.usage_json)),
        trace_id=row.trace_id,
        step_count=row.step_count,
        last_event_id=row.last_event_id,
        started_at=row.started_at,
        finished_at=row.finished_at,
    )


def message_output(row: MessageRow) -> schemas.Message:
    return schemas.Message(
        id=str(row.id),
        thread_id=str(row.thread_id),
        sequence=row.sequence,
        run_id=str(row.run_id) if row.run_id else None,
        author=row.author,
        agent_role=row.agent_role,
        content=row.content,
        delivery=row.delivery,
        delivered_in_step_id=str(row.delivered_in_step_id) if row.delivered_in_step_id else None,
        created_at=row.created_at,
    )


async def project_has_active_run(session: AsyncSession, project_id: UUID) -> bool:
    statement = (
        select(func.count())
        .select_from(RunRow)
        .where(
            RunRow.project_id == project_id,
            RunRow.status.in_(("queued", "running", "interrupted")),
        )
    )
    return bool((await session.scalar(statement)) or 0)


async def append_message(
    session: AsyncSession,
    *,
    thread: ThreadRow,
    content: str,
) -> MessageRow:
    """The user's chat message, the only way a run starts (§5)."""
    count = (
        await session.scalar(
            select(func.count()).select_from(MessageRow).where(MessageRow.thread_id == thread.id)
        )
    ) or 0
    row = MessageRow(
        thread_id=thread.id,
        sequence=int(count) + 1,
        author="user",
        content=content,
        delivery="started_run",  # or "pending" when a run is still open
    )
    session.add(row)
    thread.last_message_at = utcnow()
    await session.flush()
    project = await session.get(ProjectRow, thread.project_id)
    if project is not None and project.initial_message_id is None:
        project.initial_message_id = row.id
    return row


def start_run_blocking(
    engine: Any,
    *,
    run_id: UUID,
    thread_id: UUID,
    user_id: UUID,
    initial_intent: str,
    first_run: bool,
    config: dict[str, Any],
    started_by_message: UUID | None = None,
) -> None:
    """Run the whole workflow through the DB sink (executor demo, §5 runs).

    Writes the RunRow + every step + event onto the sync engine in one worker
    thread, so the async app either awaits or replays what this recorded.
    """
    reset_model_cache()

    factory: sessionmaker[Session] = make_sync_session_factory(engine)
    with factory() as session:
        thread = session.get(ThreadRow, thread_id)
        if thread is None:
            msg = f"thread {thread_id} does not exist"
            raise ValueError(msg)
        # The router created the queued run row this worker now drives (§5).
        run = session.get(RunRow, run_id)
        if run is None:
            run = RunRow(
                id=run_id,
                thread_id=thread_id,
                project_id=thread.project_id,
                number=1,
                started_by=user_id,
                workflow_name=WF_NAME,
                workflow_version=WF_VERSION,
                status="queued",
                current_stage="intent_routing",
                run_config_json=_dumps(config),
                usage_json=_dumps(ZERO_USAGE),
            )
            session.add(run)
            session.flush()
        run.status = "running"
        run.started_at = run.started_at or utcnow()
        message = session.scalar(select(MessageRow).where(MessageRow.run_id == run.id))
        if message is None:
            # The caller did not record one (the seed path): the intent itself
            # is the message that started this run (§5 messages).
            count = (
                session.scalar(
                    select(func.count())
                    .select_from(MessageRow)
                    .where(MessageRow.thread_id == thread.id)
                )
                or 0
            )
            message = MessageRow(
                thread_id=thread.id,
                sequence=int(count) + 1,
                author="user",
                content=initial_intent,
                run_id=run.id,
                delivery="started_run",
            )
            session.add(message)
            session.flush()
            thread.last_message_at = utcnow()
        project = session.get(ProjectRow, thread.project_id)
        if project is not None and project.initial_message_id is None:
            project.initial_message_id = message.id
            session.flush()
        thread.active_run_id = run.id
        thread.active_run_status = "running"
        sink = SqlArtifactSink(engine, run_id=run.id)
        sink.bind(session)
        state = make_initial_state(
            str(thread.project_id) if thread else str(run_id),
            initial_intent,
            config,
            first_run=first_run,
        )
        # node_start/node_end events for every visited node, with the final state.
        graph = build_re_graph()
        node_sequence = [0]
        events: list[tuple[str, dict[str, Any]]] = []
        step_rows: list[tuple[int, str]] = []

        def node_marker(node: str) -> None:
            node_sequence[0] += 1
            events.append(("node_start", {"node": node, "step_id": node_sequence[0]}))
            node_label = str(node).replace("__start__", "start").replace("__end__", "end")
            step_rows.append((node_sequence[0], node_label))

        result: dict[str, Any] = {"final": {}}
        try:
            for update in graph.stream(
                state,
                config={
                    "configurable": {
                        "run_id": str(run.id),
                        "artifact_sink": sink,
                        "directive_sink": DirectiveSink(session),
                        "models": config["models"],
                    }
                },
            ):
                for node in update:
                    if node in {"__interrupt__", "__end__"}:
                        continue
                    node_marker(node)
                    chunk = update[node] or {}
                    events.append(("node_end", {"node": node, "step_id": node_sequence[0]}))
                    # Merge every chunk: a safe_node failure rides an early
                    # update while plain edges keep the walk going, so the
                    # last chunk alone would bury it (and fake a success).
                    result["final"].update(chunk)
                    if str(chunk.get("status", "")) == "failed":
                        result["final"]["failed_node"] = node
            final = result["final"]
            status = str(final.get("status", "succeeded") or "succeeded")
            run.status = (
                "succeeded" if status not in {"failed", "cancelled", "interrupted"} else status
            )
            run.current_stage = str(final.get("current_stage", "done") or "done")
            if run.status == "failed":
                error = dict(final.get("error") or {})
                run.error_code = str(error.get("code") or "node_failed")
                run.error_message = str(error.get("message") or "the workflow failed")
                run.error_stage = str(error.get("stage") or run.current_stage)
                events.append(("error", {"message": run.error_message}))
        except Exception as exc:
            run.status = "failed"
            run.error_code = "provider_error"
            run.error_message = f"exec demo run: {exc}"
        failed_node = result["final"].get("failed_node")
        for sequence, node_label in step_rows:
            session.add(
                RunStepRow(
                    id=uuid4(),
                    run_id=run.id,
                    sequence=sequence,
                    node=node_label,
                    agent_role=None,
                    stage=str(run.current_stage or ""),
                    status="failed" if node_label == failed_node else "succeeded",
                    started_at=run.started_at or utcnow(),
                    finished_at=utcnow(),
                )
            )
        # Append lifecycle/events after the walk so the ids follow the artifacts.
        events.append(("done", {"status": run.status}))
        top = session.scalar(
            select(func.max(RunEventRow.sequence)).where(RunEventRow.run_id == run.id)
        )
        seq = int(top or 0)
        for event_type, payload in events:
            seq += 1
            session.add(
                RunEventRow(
                    run_id=run.id,
                    sequence=seq,
                    type=event_type,
                    data_json=_dumps(payload),
                )
            )
        run.last_event_id = seq
        run.step_count = node_sequence[0]
        run.finished_at = utcnow()
        if thread is not None:
            thread.active_run_id = None
            thread.active_run_status = None
            thread.current_stage = run.current_stage
        session.commit()


def run_step_output(row: RunStepRow) -> schemas.RunStep:
    """The step view of GET /runs/{id}/steps (§5, envelope on top)."""

    usage = json.loads((row.usage_json or b"null").decode("utf-8")) or {}
    produced = json.loads((row.produced_json or b"null").decode("utf-8")) or []
    return schemas.RunStep(
        id=str(row.id),
        run_id=str(row.run_id),
        sequence=row.sequence,
        node=row.node,
        agent_role=row.agent_role,
        stage=row.stage,
        status=row.status,
        iteration=row.iteration,
        subject_item_id=str(row.subject_item_id) if row.subject_item_id else None,
        model_id=row.model_id,
        llm_calls=row.llm_calls,
        usage=schemas.Usage.model_validate(
            {
                "input_tokens": usage.get("input_tokens", 0),
                "output_tokens": usage.get("output_tokens", 0),
                "cache_read_tokens": usage.get("cache_read_tokens", 0),
                "cache_write_tokens": usage.get("cache_write_tokens", 0),
                "cost_usd": usage.get("cost_usd", 0.0),
                "duration_ms": usage.get("duration_ms", 0),
            }
        ),
        produced=[schemas.ItemRef.model_validate(item) for item in produced],
        error=row.error,
        started_at=row.started_at,
        finished_at=row.finished_at,
    )


async def get_run_row(session: AsyncSession, run_id: UUID) -> RunRow:
    row = await session.get(RunRow, run_id)
    if row is None:
        raise ApiError(404, "not_found", "Not found", "The run does not exist.")
    return row


class DirectiveSink:
    """The DB DirectiveSink: run-scoped (its own session)."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def create_directive(
        self,
        run_id: str,
        kind: str,
        *,
        target_node: str,
        iteration: int,
        instruction: str,
        item_ids: list[str],
    ) -> str:
        row = DirectiveRow(
            id=uuid4(),
            run_id=UUID(run_id),
            kind=kind,
            target_node=target_node,
            iteration=iteration,
            instruction=instruction,
            details_json=_dumps({"item_ids": item_ids}),
        )
        self.session.add(row)
        self.session.flush()
        return str(row.id)

    def read_directive(self, directive_id: str) -> Any:
        row = self.session.get(DirectiveRow, UUID(directive_id))
        if row is None:
            return None
        return {
            "id": str(row.id),
            "kind": row.kind,
            "target_node": row.target_node,
            "iteration": row.iteration,
            "instruction": row.instruction,
            "item_ids": (_loads(row.details_json) or {}).get("item_ids", []),
        }
