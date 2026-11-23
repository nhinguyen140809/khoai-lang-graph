"""The assistant: classify one message, answer the ones about the application, keep the answer.

The model sees a summary of the project — what it holds, its documents by id, its run settings, the
last messages — and either answers at once or asks to read one thing it is missing: an item, a
document, the last run, the open findings, a trace, a step of the workflow, the month's budget. That
read comes back to it, at most twice, and then it answers.

The answer is stored as a message of the thread, so it survives a reload and reads like every other
line of the conversation. The commands are transient: the client runs them once, from the response.
What each message costs is kept in `assistant_turns`, because no run step holds it.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any
from uuid import UUID

import structlog
from sqlalchemy import select

from khoailanggraph.agents import prompts as prompt_loader
from khoailanggraph.agents import workflows
from khoailanggraph.agents.assistance import definition as assistance
from khoailanggraph.agents.shared import catalogs
from khoailanggraph.features.artifacts.models import ArtifactItemRow, ArtifactRow
from khoailanggraph.features.assistant.models import AssistantTurnRow
from khoailanggraph.features.assistant.schemas import (
    AssistantCommand,
    AssistantDecision,
    AssistantStep,
)
from khoailanggraph.features.assistant.tools import (
    READ_TOOLS,
    ReadLog,
    ToolContext,
    catalog_of,
    run_tool,
)
from khoailanggraph.features.runs import service as runs_service
from khoailanggraph.features.runs.models import RunRow
from khoailanggraph.features.threads.models import MessageRow, ThreadRow, utcnow
from khoailanggraph.features.threads.sequence import add_message
from khoailanggraph.llm import get_chat_model, resolve_model_id
from khoailanggraph.llm.usage import Usage, UsageHandler, zero_usage

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.me.models import UserRow
    from khoailanggraph.features.projects.models import ProjectRow

logger = structlog.get_logger(__name__)

PROMPTS_PACKAGE = "khoailanggraph.agents.requirements_engineering"
ASSISTANT_PROMPT_VERSION = 2
HISTORY_MESSAGES = 8
HISTORY_LINE_LENGTH = 300


def _language(project: ProjectRow) -> str:
    return "English" if project.output_language == "en" else "Vietnamese"


async def _documents(session: AsyncSession, project: ProjectRow) -> list[dict[str, Any]]:
    """The live documents of the project, the only ids that a command may name."""
    rows = (
        await session.scalars(
            select(ArtifactRow)
            .where(ArtifactRow.project_id == project.id, ArtifactRow.deleted_at.is_(None))
            .order_by(ArtifactRow.created_at)
        )
    ).all()
    return [
        {
            "id": str(row.id),
            "kind": row.kind,
            "title": row.title,
            "version": row.version,
            "status": row.review_status,
        }
        for row in rows
    ]


async def _project_lines(session: AsyncSession, project: ProjectRow) -> str:
    """The head of the project: what it is called and where its work stands. What it holds, and the
    rest, the assistant reads with its tools."""
    latest = (
        await session.execute(
            select(RunRow.status, RunRow.current_stage)
            .where(
                RunRow.project_id == project.id,
                RunRow.workflow_name == workflows.MAIN_WORKFLOW.name,
            )
            .order_by(RunRow.created_at.desc(), RunRow.number.desc())
            .limit(1)
        )
    ).first()
    return "\n".join(
        [
            f"- name: {project.name or 'not named yet'}",
            f"- language of the documents: {project.output_language}",
            "- the latest run: none yet"
            if latest is None
            else f"- the latest run: {latest[0]} at {latest[1]}",
        ]
    )


def _history_line(row: MessageRow) -> str:
    who = "user" if row.author == "user" else f"agent ({row.agent_role or 'workflow'})"
    return f"{who}: {' '.join(row.content.split())[:HISTORY_LINE_LENGTH]}"


async def _history(session: AsyncSession, thread: ThreadRow) -> str:
    rows = (
        await session.scalars(
            select(MessageRow)
            .where(MessageRow.thread_id == thread.id)
            .order_by(MessageRow.sequence.desc())
            .limit(HISTORY_MESSAGES)
        )
    ).all()
    return "\n".join(_history_line(row) for row in reversed(rows)) or "(none)"


def _command_lines() -> str:
    """The commands the client can run, one line each, as the model reads them."""
    return "\n".join(
        f"- `{key}` (needs {entry['needs']}): {entry['description']}"
        for key, entry in catalogs.command_catalog().items()
    )


async def _kept_commands(
    session: AsyncSession, project: ProjectRow, decision: AssistantDecision
) -> list[AssistantCommand]:
    """The commands the client may run: a key of the catalog whose need this project meets.

    What each need checks is one entry of `_CHECKS`, keyed by the `needs` of the catalog, so a
    command that needs something already checked is a line of the catalog and nothing here.
    """
    catalog = catalogs.command_catalog()
    documents = await _documents(session, project)
    known = {entry["id"] for entry in documents}
    kept: list[AssistantCommand] = []
    for command in decision.commands:
        entry = catalog.get(command.command)
        check = _CHECKS.get(entry["needs"]) if entry is not None else None
        if check is not None and await check(session, project, command, known):
            kept.append(command)
        else:
            logger.warning(
                "assistant command dropped: not in the catalog, or it names nothing of the project",
                command=command.command,
                artifact_id=command.artifact_id,
                item_id=command.item_id,
            )
    return kept


async def _item_in_project(session: AsyncSession, project: ProjectRow, item_id: str | None) -> bool:
    """Whether the item exists in this project: the only ids a command may open."""
    if item_id is None:
        return False
    try:
        wanted = UUID(item_id)
    except ValueError:
        return False
    found = await session.scalar(
        select(ArtifactItemRow.id).where(
            ArtifactItemRow.id == wanted,
            ArtifactItemRow.project_id == project.id,
            ArtifactItemRow.deleted_at.is_(None),
        )
    )
    return found is not None


async def _has_review_waiting(session: AsyncSession, project: ProjectRow) -> bool:
    """Whether a run of the project waits for the user: what `open_review` brings into view."""
    found = await session.scalar(
        select(RunRow.id)
        .where(RunRow.project_id == project.id, RunRow.status == "interrupted")
        .limit(1)
    )
    return found is not None


async def _needs_nothing(
    session: AsyncSession, project: ProjectRow, command: AssistantCommand, known: set[str]
) -> bool:
    return True


async def _needs_document(
    session: AsyncSession, project: ProjectRow, command: AssistantCommand, known: set[str]
) -> bool:
    return command.artifact_id is not None and command.artifact_id in known


async def _needs_item(
    session: AsyncSession, project: ProjectRow, command: AssistantCommand, known: set[str]
) -> bool:
    return await _item_in_project(session, project, command.item_id)


async def _needs_review(
    session: AsyncSession, project: ProjectRow, command: AssistantCommand, known: set[str]
) -> bool:
    return await _has_review_waiting(session, project)


# What each `needs` of the catalog checks before a command leaves. A `needs` that is not here keeps
# its commands from leaving, and a test fails on a catalog that names one.
_CHECKS: dict[str, Callable[..., Awaitable[bool]]] = {
    "none": _needs_nothing,
    "artifact": _needs_document,
    "item": _needs_item,
    "review": _needs_review,
}


def _workflow() -> AssistantDecision:
    """The safe answer: a message nothing is certain about enters the workflow and is never lost."""
    return AssistantDecision(kind="workflow")


@dataclass(frozen=True)
class AssistantOutcome:
    """What the message came to, and what finding out cost."""

    decision: AssistantDecision
    model_id: str
    usage: Usage
    # What the reads looked at: the references of the answer.
    reads: ReadLog = field(default_factory=ReadLog)


async def _finish(
    session: AsyncSession, project: ProjectRow, decision: AssistantDecision | None
) -> AssistantDecision:
    """The decision as it leaves: an answer needs words, and its commands this project's records."""
    if decision is None or decision.kind == "workflow" or not decision.text.strip():
        return _workflow()
    return decision.model_copy(
        update={"commands": await _kept_commands(session, project, decision)}
    )


def _answered(raw: Any, model: Any, messages: list[Any], handler: UsageHandler) -> Any:
    """One structured step of the model, with the usage handler attached to the call."""
    bound = model.with_structured_output(raw)
    return bound.invoke(messages, config={"callbacks": [handler]})


async def decide(
    session: AsyncSession,
    project: ProjectRow,
    thread: ThreadRow,
    content: str,
    user: UserRow,
) -> AssistantOutcome:
    """Which kind the message is, and for a question about the application, its answer.

    The model may ask to read one thing it lacks, as many times as `max_reads` of the assistance
    definition allows; after that it answers from what it has. Anything a provider does with the
    tools that this code does not expect ends the same way as a failure: the message enters the
    workflow, where it is never lost.
    """
    prompt = prompt_loader.load_cached(PROMPTS_PACKAGE, "assistant", ASSISTANT_PROMPT_VERSION)
    messages: list[Any] = list(
        prompt_loader.assemble_prompt(
            prompt,
            {
                "output_language": _language(project),
                "project": await _project_lines(session, project),
                "history": await _history(session, thread),
                "tools": catalog_of(READ_TOOLS),
                "commands": _command_lines(),
                "max_reads": str(assistance.max_reads()),
                "message": content,
            },
        )
    )
    # The role map of a run, read at call time: `assistant` resolves through it, so a test or a
    # script that replaces the map with scripted models answers here too.
    models = runs_service.role_models()
    config = {"configurable": {"models": models}} if models else None
    model_id = resolve_model_id("assistant", config)
    model = get_chat_model("assistant", config)
    handler = UsageHandler()
    started = time.monotonic()
    context = ToolContext(session=session, project=project, user=user)
    reads_allowed = assistance.max_reads()
    try:
        for _step_no in range(reads_allowed):
            step = AssistantStep.model_validate(_answered(AssistantStep, model, messages, handler))
            if step.tool is None:
                answered = await _finish(session, project, step.answer)
                return _outcome(answered, model_id, handler, started, context.reads)
            context.reads.calls.append((step.tool, step.key))
            result = await run_tool(step.tool, context, step.key)
            messages.append(
                ("human", f'<tool_result tool="{step.tool}">\n{result}\n</tool_result>')
            )
        final = AssistantDecision.model_validate(
            _answered(AssistantDecision, model, messages, handler)
        )
    except Exception as exc:  # a provider that fails must not lose the message
        logger.warning(
            "assistant decision failed; the message goes to the workflow",
            error=f"{type(exc).__name__}: {str(exc)[:200]}",
        )
        return _outcome(_workflow(), model_id, handler, started, context.reads)
    return _outcome(
        await _finish(session, project, final), model_id, handler, started, context.reads
    )


def _outcome(
    decision: AssistantDecision,
    model_id: str,
    handler: UsageHandler,
    started: float,
    reads: ReadLog,
) -> AssistantOutcome:
    elapsed_ms = int((time.monotonic() - started) * 1000)
    usage = handler.usage(model_id, elapsed_ms) if model_id else zero_usage()
    return AssistantOutcome(decision=decision, model_id=model_id, usage=usage, reads=reads)


async def record_turn(
    session: AsyncSession,
    user: UserRow,
    project: ProjectRow,
    thread: ThreadRow,
    outcome: AssistantOutcome,
) -> None:
    """Keep what the message cost, so the usage view and the budget count it."""
    row = AssistantTurnRow(
        user_id=user.id,
        project_id=project.id,
        thread_id=thread.id,
        kind=outcome.decision.kind,
        model_id=outcome.model_id,
        usage_json=json.dumps(dict(outcome.usage)).encode("utf-8"),
    )
    session.add(row)
    await session.flush()


async def record_reply(
    session: AsyncSession,
    thread: ThreadRow,
    decision: AssistantDecision,
    reads: ReadLog,
    run_id: UUID | None = None,
) -> MessageRow:
    """The answer as a message of the thread, so it reads with the other lines after a reload.

    It names the documents and items that were read to answer, as the messages of the agents name
    what they were written from.
    """
    row = await add_message(
        session,
        thread.id,
        lambda sequence: MessageRow(
            thread_id=thread.id,
            sequence=sequence,
            run_id=run_id,
            author="agent",
            agent_role="assistant",
            content=decision.text,
            artifact_refs_json=json.dumps(list(reads.artifacts.values())).encode("utf-8"),
            item_refs_json=json.dumps(list(reads.items.values())).encode("utf-8"),
        ),
    )
    thread.last_message_at = utcnow()
    await session.flush()
    return row
