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

import asyncio
import json
import time
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Protocol
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
    AssistantDecision,
    AssistantStep,
    ToolCall,
    UiCommand,
)
from khoailanggraph.features.assistant.tools import (
    READ_TOOLS,
    ReadLog,
    ToolContext,
    catalog_of,
    known_tools,
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
) -> list[UiCommand]:
    """The commands the client may run: a key of the catalog whose need this project meets.

    What each need checks is one entry of `_CHECKS`, keyed by the `needs` of the catalog, so a
    command that needs something already checked is a line of the catalog and nothing here.
    """
    catalog = catalogs.command_catalog()
    documents = await _documents(session, project)
    known = {entry["id"] for entry in documents}
    kept: list[UiCommand] = []
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
    session: AsyncSession, project: ProjectRow, command: UiCommand, known: set[str]
) -> bool:
    return True


async def _needs_document(
    session: AsyncSession, project: ProjectRow, command: UiCommand, known: set[str]
) -> bool:
    return command.artifact_id is not None and command.artifact_id in known


async def _needs_item(
    session: AsyncSession, project: ProjectRow, command: UiCommand, known: set[str]
) -> bool:
    return await _item_in_project(session, project, command.item_id)


async def _needs_review(
    session: AsyncSession, project: ProjectRow, command: UiCommand, known: set[str]
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
    # The messages that came while the assistant worked and that it read in a later step.
    arrived: tuple[MessageRow, ...] = ()


class Watcher(Protocol):
    """What the assistant tells, and asks, of the run that it works in while it works."""

    async def called(self, tool: str, subject: str | None) -> None:
        """A tool was called, on what `subject` names: the run shows it at once."""

    async def arrived(self) -> list[MessageRow]:
        """The messages that came into the run since the last time, now taken in."""


async def _finish(
    session: AsyncSession, project: ProjectRow, decision: AssistantDecision | None
) -> AssistantDecision:
    """The decision as it leaves: an answer needs words, and its commands this project's records."""
    if decision is None or decision.kind == "workflow" or not decision.text.strip():
        return _workflow()
    return decision.model_copy(
        update={"commands": await _kept_commands(session, project, decision)}
    )


async def _answered(raw: Any, model: Any, messages: list[Any], handler: UsageHandler) -> Any:
    """One structured step of the model, with the usage handler attached to the call.

    The call waits on the provider for seconds, so it runs off the event loop: the other requests
    of the server go on meanwhile.
    """
    bound = model.with_structured_output(raw)
    return await asyncio.to_thread(bound.invoke, messages, config={"callbacks": [handler]})


def _subject_of(call: ToolCall, reads: ReadLog) -> str | None:
    """What the note of a call says it was about: the title of the record that the tool read, or
    the words of the user for a tool that looks for them; never the key of a record."""
    tool = known_tools().get(call.tool)
    if reads.subject:
        return reads.subject
    return call.key if tool is not None and tool.key_is_words else None


async def _take_arrivals(
    watcher: Watcher | None, messages: list[Any], arrivals: list[MessageRow]
) -> None:
    """Add the messages that came since the last step to what the model reads next."""
    if watcher is None:
        return
    for message in await watcher.arrived():
        arrivals.append(message)
        messages.append(("human", f"<new_message>\n{message.content}\n</new_message>"))


@dataclass(frozen=True)
class Asked:
    """A message to decide about, with the rows it is decided with."""

    project: ProjectRow
    thread: ThreadRow
    content: str
    user: UserRow


async def decide(
    session: AsyncSession, asked: Asked, watcher: Watcher | None = None
) -> AssistantOutcome:
    """Which kind the message is, and for a question about the application, its answer.

    The model may call the tools of the assistance definition, as many times as `max_reads` of it
    allows; after that it answers from what it has. A message that comes into the run meanwhile is
    read in the next step, through `watcher`. Anything a provider does with the
    tools that this code does not expect ends the same way as a failure: the message enters the
    workflow, where it is never lost.
    """
    project, thread, content, user = asked.project, asked.thread, asked.content, asked.user
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
    work = _Work(model_id=model_id, handler=handler, started=started, reads=context.reads)
    arrivals = work.arrivals
    try:
        while len(context.reads.calls) < reads_allowed:
            await _take_arrivals(watcher, messages, arrivals)
            step = AssistantStep.model_validate(
                await _answered(AssistantStep, model, messages, handler)
            )
            if not step.tool_calls:
                answered = await _finish(session, project, step.answer)
                return _outcome(answered, work)
            # The calls of a step are independent, so one call of the model asked for all of them;
            # they run one after another on the session, and only the ones the limit still allows.
            room = reads_allowed - len(context.reads.calls)
            results: list[str] = []
            for call in step.tool_calls[:room]:
                context.reads.calls.append((call.tool, call.key))
                context.reads.subject = None
                result = await run_tool(call.tool, context, call.key)
                if watcher is not None:
                    await watcher.called(call.tool, _subject_of(call, context.reads))
                results.append(f'<tool_result tool="{call.tool}">\n{result}\n</tool_result>')
            messages.append(("human", "\n".join(results)))
        await _take_arrivals(watcher, messages, arrivals)
        final = AssistantDecision.model_validate(
            await _answered(AssistantDecision, model, messages, handler)
        )
    except Exception as exc:  # a provider that fails must not lose the message
        logger.warning(
            "assistant decision failed; the message goes to the workflow",
            error=f"{type(exc).__name__}: {str(exc)[:200]}",
        )
        return _outcome(_workflow(), work)
    return _outcome(await _finish(session, project, final), work)


@dataclass
class _Work:
    """What a message cost the assistant while it decided, and what it looked at on the way."""

    model_id: str
    handler: UsageHandler
    started: float
    reads: ReadLog
    arrivals: list[MessageRow] = field(default_factory=list)


def _outcome(decision: AssistantDecision, work: _Work) -> AssistantOutcome:
    elapsed_ms = int((time.monotonic() - work.started) * 1000)
    usage = work.handler.usage(work.model_id, elapsed_ms) if work.model_id else zero_usage()
    return AssistantOutcome(
        decision=decision,
        model_id=work.model_id,
        usage=usage,
        reads=work.reads,
        arrived=tuple(work.arrivals),
    )


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
            commands_json=json.dumps(
                [command.model_dump(mode="json") for command in decision.commands]
            ).encode("utf-8"),
        ),
    )
    thread.last_message_at = utcnow()
    await session.flush()
    return row
