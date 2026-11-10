"""The views of runs, steps, messages, interrupts and directives, and the small rules around them.

The walk of a run lives in `executor`; the settings a run starts with are resolved in `config`.
`role_models` and `make_research_search` are the two seams a test or a script replaces to run the
workflow offline.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, cast
from uuid import UUID

from sqlalchemy import func, select

from khoailanggraph.agents.requirements_engineering import definition as workflow_definition
from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.threads.models import MessageRow, ThreadRow

if TYPE_CHECKING:
    from collections.abc import Mapping

    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.me.models import UserRow


from khoailanggraph.features.artifacts.models import ArtifactItemRow
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.runs import schemas, usage
from khoailanggraph.features.runs.models import (
    DirectiveRow,
    HumanDecisionRow,
    InterruptRow,
    RunRow,
    RunStepRow,
)
from khoailanggraph.settings import get_settings
from khoailanggraph.tools.research import make_research_search as make_research_search  # noqa: PLC0414 - the seam

WF_NAME = "requirements_engineering"
WF_VERSION = workflow_definition.WORKFLOW_VERSION


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


def role_models() -> dict[str, str]:
    """The per-role model map of a run: empty — each role resolves through
    `config/models.yaml` (defaults/roles) against the gateway env keys."""
    return {}


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
        artifact_refs=[
            schemas.ArtifactRef.model_validate(ref)
            for ref in json.loads((row.artifact_refs_json or b"[]").decode("utf-8"))
        ],
        item_refs=[
            schemas.ItemRef.model_validate(ref)
            for ref in json.loads((row.item_refs_json or b"[]").decode("utf-8"))
        ],
        created_at=row.created_at,
    )


def interrupt_output(row: InterruptRow, decision: HumanDecisionRow | None) -> schemas.Interrupt:
    """An interrupt with its options, questions and decision; a question written without a
    source is one of the definition."""
    questions = json.loads((row.questions_json or b"[]").decode("utf-8"))
    return schemas.Interrupt(
        id=str(row.id),
        run_id=str(row.run_id),
        step_id=str(row.step_id) if row.step_id else None,
        node=row.node,
        prompt=row.prompt,
        options=json.loads((row.options_json or b"[]").decode("utf-8")),
        questions=[{"source": "definition", **question} for question in questions],
        allow_edits=row.allow_edits,
        review_artifacts=[
            schemas.ArtifactRef.model_validate(ref)
            for ref in json.loads((row.artifacts_json or b"[]").decode("utf-8"))
        ],
        status=cast("schemas.InterruptStatus", row.status),
        created_at=row.created_at,
        resolved_at=row.resolved_at,
        decision=None
        if decision is None
        else schemas.InterruptDecision(
            option=decision.option,
            feedback=decision.feedback,
            answers=json.loads((decision.answers_json or b"{}").decode("utf-8")),
            decided_by=str(decision.decided_by) if decision.decided_by else None,
            decided_at=decision.created_at,
        ),
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


def workflow_state_values(state: Mapping[str, Any]) -> dict[str, Any]:
    """The values of the workflow state that a run shows: the fields of the `state_schema` of
    the definition, as plain JSON. They hold references to artifacts and items, never copies."""
    fields = workflow_definition.state_schema()["properties"]
    return cast(
        "dict[str, Any]",
        json.loads(json.dumps({k: v for k, v in state.items() if k in fields}, default=str)),
    )


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
    project = None if row is None else await session.get(ProjectRow, row.project_id)
    if row is None or project is None or project.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The run does not exist.")
    return row


async def directive_output(session: AsyncSession, row: DirectiveRow) -> schemas.Directive:
    """A directive with the items it refers to, each as the reference of the item now."""
    entries = json.loads((row.items_json or b"[]").decode("utf-8"))
    items: list[schemas.DirectiveItem] = []
    for entry in entries:
        item = await session.get(ArtifactItemRow, UUID(str(entry["item_id"])))
        if item is not None:
            items.append(
                schemas.DirectiveItem(
                    item=schemas.ItemRef(
                        item_id=str(item.id), kind=item.kind, key=item.key, version=item.version
                    ),
                    role=str(entry["role"]),
                )
            )
    return schemas.Directive(
        id=str(row.id),
        run_id=str(row.run_id),
        kind=row.kind,
        issued_by_step_id=str(row.issued_by_step_id) if row.issued_by_step_id else None,
        human_decision_id=str(row.human_decision_id) if row.human_decision_id else None,
        target_node=row.target_node,
        iteration=row.iteration,
        instruction=row.instruction,
        items=items,
        details=json.loads((row.details_json or b"{}").decode("utf-8")),
        created_at=row.created_at,
    )


def run_state_output(run: RunRow, step: RunStepRow | None) -> schemas.RunState:
    """The workflow state a step saved; a run without a saved step has no values yet."""
    values = (
        workflow_state_values(json.loads(step.state_json.decode("utf-8")))
        if step is not None and step.state_json is not None
        else {}
    )
    return schemas.RunState(
        run_id=str(run.id),
        step_id=str(step.id) if step is not None else None,
        workflow_version=run.workflow_version,
        values=values,
    )


async def unfinished_run_of_thread(session: AsyncSession, thread_id: UUID) -> RunRow | None:
    """The run of the thread that is queued, running or waiting for a review, if there is one."""
    return await session.scalar(
        select(RunRow)
        .where(
            RunRow.thread_id == thread_id, RunRow.status.in_(("queued", "running", "interrupted"))
        )
        .order_by(RunRow.number.desc())
        .limit(1)
    )


async def next_run_number(session: AsyncSession, thread_id: UUID) -> int:
    """The number of the next run of a thread: from 1, without gaps."""
    top = await session.scalar(select(func.max(RunRow.number)).where(RunRow.thread_id == thread_id))
    return int(top or 0) + 1


async def undeliver_pending(session: AsyncSession, thread_id: UUID) -> None:
    """The messages of a thread that waited for a run that ended without taking them in."""
    for message in (
        await session.scalars(
            select(MessageRow).where(
                MessageRow.thread_id == thread_id, MessageRow.delivery == "pending"
            )
        )
    ).all():
        message.delivery = "undelivered"


async def ensure_budget(session: AsyncSession, user: UserRow) -> None:
    """Answer `429 budget_exceeded` when the month of the user has no budget left for more work."""
    budget = (
        user.monthly_budget_usd
        if user.monthly_budget_usd is not None
        else get_settings().default_monthly_budget_usd
    )
    if budget is None:
        return
    start, end = usage.month_bounds()
    runs = (await session.scalars(usage.runs_of_user_in(UUID(str(user.id)), start, end))).all()
    if usage.total_usage(list(runs))["cost_usd"] >= budget:
        raise ApiError(
            429, "budget_exceeded", "Budget exceeded", "The budget of this month is spent."
        )
