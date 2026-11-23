"""The run of the assistance workflow that an answered message has.

The assistant answers as a job of the server. Its run starts `running` with one step of the agent
`assistant`, and ends `succeeded` with a note of kind `tool` for each read it made, the usage and
the cost of the answer, the events that a stream of the run would have sent, and the answer as a
message of the run. A client reads it as it reads any run: the agent, its acts, the uses of its
tools and its answer.
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlalchemy import delete, select

from khoailanggraph.agents import workflows
from khoailanggraph.agents.assistance import definition as assistance
from khoailanggraph.features.assistant import service
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.runs import service as runs_service
from khoailanggraph.features.runs.models import RunEventRow, RunRow, RunStepRow
from khoailanggraph.features.threads.models import MessageRow, utcnow
from khoailanggraph.llm.note_stream import fit_note
from khoailanggraph.llm.usage import zero_usage

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.assistant.service import AssistantOutcome
    from khoailanggraph.features.me.models import UserRow
    from khoailanggraph.features.threads.models import ThreadRow

# The only node and stage of the workflow: the definition names them, and the step is theirs.
NODE = "assistant"


def _stage() -> str:
    return str(next(node["stage"] for node in assistance.DEFINITION["nodes"] if node["id"] == NODE))


def _note_of(name: str, subject: str | None) -> dict[str, str] | None:
    """The note of kind `tool` for a call, in the words of its tool and what it was about; none for
    a tool that the definition does not declare or does not show."""
    tool = assistance.tools().get(name)
    # A tool that the definition does not show to the user leaves no note and sends no event.
    if tool is None or tool.get("visible") is False:
        return None
    text = fit_note(f"{tool['title']}: {subject}" if subject else str(tool["title"]))
    return {"kind": "tool", "tool": name, "text": text, "created_at": utcnow().isoformat()}


def _dumps(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False).encode("utf-8")


def _run_config(language: str) -> dict[str, Any]:
    return {
        "models": {},
        "review_checkpoints": [],
        "output_language": language,
        "max_steps": assistance.max_reads() + 1,
        "max_cost_usd": None,
        "parameters": {"max_reads": assistance.max_reads()},
    }


async def start_answer(
    session: AsyncSession, user: UserRow, thread: ThreadRow, message: MessageRow
) -> RunRow:
    """Write the run of the assistance workflow that answers a message, while it works.

    The run is `running` with its one step; `message` is the message of the user, which becomes a
    message of the run. `RunConflictError` says that the thread has an unfinished run of the
    assistance workflow already: the message waits for it.
    """
    project = await session.get(ProjectRow, thread.project_id)
    language = project.output_language if project is not None else "en"
    now = utcnow()
    stage = _stage()
    run = await runs_service.create_run(
        session,
        thread.id,
        lambda number: RunRow(
            id=uuid4(),
            thread_id=thread.id,
            project_id=thread.project_id,
            number=number,
            started_by=user.id,
            workflow_name=workflows.ASSISTANCE.name,
            workflow_version=workflows.ASSISTANCE.version,
            status="running",
            current_stage=stage,
            run_config_json=_dumps(_run_config(language)),
            usage_json=_dumps(dict(zero_usage())),
            step_count=1,
            started_at=now,
        ),
    )
    await session.flush()
    step = RunStepRow(
        id=uuid4(),
        run_id=run.id,
        sequence=1,
        node=NODE,
        agent_role=NODE,
        stage=stage,
        status="running",
        usage_json=_dumps(dict(zero_usage())),
        notes_json=_dumps([]),
        started_at=now,
    )
    session.add(step)
    session.add(
        RunEventRow(
            run_id=run.id,
            sequence=1,
            step_id=step.id,
            type="node_start",
            data_json=_dumps(
                {"node": NODE, "step_id": str(step.id), "agent_role": NODE, "stage": stage}
            ),
        )
    )
    run.last_event_id = 1
    message.run_id = run.id
    await session.flush()
    return run


async def _step_of(session: AsyncSession, run: RunRow) -> RunStepRow | None:
    return await session.scalar(
        select(RunStepRow).where(RunStepRow.run_id == run.id, RunStepRow.sequence == 1)
    )


async def note_call(session: AsyncSession, run: RunRow, tool: str, subject: str | None) -> None:
    """Show a call of a tool in the run as it starts: a note of kind `tool` on its step, and the
    event that a stream of the run sends for it."""
    step = await _step_of(session, run)
    note = _note_of(tool, subject)
    if step is None or note is None:
        return
    notes = json.loads((step.notes_json or b"[]").decode("utf-8"))
    notes.append(note)
    step.notes_json = _dumps(notes)
    step.llm_calls = len(notes)
    run.last_event_id += 1
    session.add(
        RunEventRow(
            run_id=run.id,
            sequence=run.last_event_id,
            step_id=step.id,
            type="step_note",
            data_json=_dumps({"step_id": str(step.id), **note}),
        )
    )
    await session.flush()


async def take_arrived(session: AsyncSession, run: RunRow, first: MessageRow) -> list[MessageRow]:
    """The messages that came into the run while it works, taken in by its step now: they were
    `pending`, and are `delivered` in the step. `first` is the message that the run answers."""
    step = await _step_of(session, run)
    arrived = list(
        (
            await session.scalars(
                select(MessageRow)
                .where(
                    MessageRow.run_id == run.id,
                    MessageRow.author == "user",
                    MessageRow.delivery == "pending",
                    MessageRow.id != first.id,
                )
                .order_by(MessageRow.sequence)
            )
        ).all()
    )
    for message in arrived:
        message.delivery = "delivered"
        message.delivered_in_step_id = step.id if step is not None else None
    await session.flush()
    return arrived


async def finish_answer(
    session: AsyncSession, thread: ThreadRow, run: RunRow, outcome: AssistantOutcome
) -> MessageRow:
    """End the run of an answer: its usage and cost, and the answer as a message of the run, with
    the commands that the client runs once. The notes of its calls were written as they were
    made."""
    step = await _step_of(session, run)
    now = utcnow()
    usage = dict(outcome.usage)
    if step is not None:
        step.status = "succeeded"
        step.model_id = outcome.model_id or None
        step.llm_calls = len(outcome.reads.calls) + 1
        step.usage_json = _dumps(usage)
        step.finished_at = now
    step_id = str(step.id) if step is not None else None
    events: list[tuple[str, dict[str, Any], bool]] = [
        ("node_end", {"node": NODE, "step_id": step_id, "status": "succeeded"}, True),
        ("done", {"status": "succeeded"}, False),
    ]
    sequence = run.last_event_id
    for kind, data, has_step in events:
        sequence += 1
        session.add(
            RunEventRow(
                run_id=run.id,
                sequence=sequence,
                step_id=step.id if has_step and step is not None else None,
                type=kind,
                data_json=_dumps(data),
            )
        )
    run.last_event_id = sequence
    run.status = "succeeded"
    run.usage_json = _dumps(usage)
    run.finished_at = now
    reply = await service.record_reply(
        session, thread, outcome.decision, outcome.reads, run_id=run.id
    )
    await session.flush()
    return reply


async def discard_answer(session: AsyncSession, run: RunRow) -> None:
    """Remove the run made for a message that turned out to belong to the work of the project: it
    has no answer to show."""
    await session.execute(delete(RunEventRow).where(RunEventRow.run_id == run.id))
    await session.execute(delete(RunStepRow).where(RunStepRow.run_id == run.id))
    await session.delete(run)
    await session.flush()


async def fail_answer(session: AsyncSession, run: RunRow, reason: str) -> None:
    """End the run of an answer that could not be written."""
    run.status = "failed"
    run.error_code = "assistant_failed"
    run.error_message = reason
    run.error_stage = run.current_stage
    run.finished_at = utcnow()
    run.last_event_id += 1
    session.add(
        RunEventRow(
            run_id=run.id,
            sequence=run.last_event_id,
            step_id=None,
            type="done",
            data_json=_dumps({"status": "failed"}),
        )
    )
    await session.flush()
