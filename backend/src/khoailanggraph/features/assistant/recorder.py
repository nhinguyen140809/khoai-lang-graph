"""The run of the assistance workflow that an answered message has.

The assistant answers within the request that asked, so its run is already over when it is
written: one step of the agent `assistant`, with a note of kind `tool` for each read it made, the
usage and the cost of the answer, and the events that a stream of the run would have sent. A client
reads it as it reads any run: the agent, its acts, the uses of its tools and its answer.
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from khoailanggraph.agents import workflows
from khoailanggraph.agents.assistance import definition as assistance
from khoailanggraph.features.assistant import service
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.runs import service as runs_service
from khoailanggraph.features.runs.models import RunEventRow, RunRow, RunStepRow
from khoailanggraph.features.threads.models import MessageRow, utcnow
from khoailanggraph.llm.note_stream import fit_note

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.assistant.service import AssistantOutcome
    from khoailanggraph.features.me.models import UserRow
    from khoailanggraph.features.threads.models import ThreadRow

# The only node and stage of the workflow: the definition names them, and the step is theirs.
NODE = "assistant"


def _stage() -> str:
    return str(next(node["stage"] for node in assistance.DEFINITION["nodes"] if node["id"] == NODE))


def _notes_of(outcome: AssistantOutcome) -> list[dict[str, str]]:
    """One note of kind `tool` for each read that was made, in the words of its tool."""
    tools = assistance.tools()
    notes: list[dict[str, str]] = []
    for name, key in outcome.reads.calls:
        tool = tools.get(name)
        if tool is None:
            continue
        text = fit_note(f"{tool['title']}: {key}" if key else str(tool["title"]))
        notes.append(
            {"kind": "tool", "tool": name, "text": text, "created_at": utcnow().isoformat()}
        )
    return notes


def _dumps(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False).encode("utf-8")


async def record_answer(
    session: AsyncSession,
    user: UserRow,
    thread: ThreadRow,
    message: MessageRow,
    outcome: AssistantOutcome,
) -> tuple[RunRow, MessageRow]:
    """Write the finished run of an answered message, and the answer as a message of that run.

    `message` is the message of the user, which becomes a message of the run. The run never becomes
    the active run of the thread: it is over before anyone could follow it.
    """
    project = await session.get(ProjectRow, thread.project_id)
    language = project.output_language if project is not None else "en"
    now = utcnow()
    stage = _stage()
    notes = _notes_of(outcome)
    usage = dict(outcome.usage)
    run = RunRow(
        id=uuid4(),
        thread_id=thread.id,
        project_id=thread.project_id,
        number=await runs_service.next_run_number(session, thread.id),
        started_by=user.id,
        workflow_name=workflows.ASSISTANCE.name,
        workflow_version=workflows.ASSISTANCE.version,
        status="succeeded",
        current_stage=stage,
        run_config_json=_dumps(
            {
                "models": {},
                "review_checkpoints": [],
                "output_language": language,
                "max_steps": assistance.max_reads() + 1,
                "max_cost_usd": None,
                "parameters": {"max_reads": assistance.max_reads()},
            }
        ),
        usage_json=_dumps(usage),
        step_count=1,
        started_at=now,
        finished_at=now,
    )
    session.add(run)
    await session.flush()
    step = RunStepRow(
        id=uuid4(),
        run_id=run.id,
        sequence=1,
        node=NODE,
        agent_role=NODE,
        stage=stage,
        status="succeeded",
        model_id=outcome.model_id or None,
        llm_calls=len(notes) + 1,
        usage_json=_dumps(usage),
        notes_json=_dumps(notes),
        started_at=now,
        finished_at=now,
    )
    session.add(step)
    events: list[tuple[str, dict[str, Any], bool]] = [
        (
            "node_start",
            {"node": NODE, "step_id": str(step.id), "agent_role": NODE, "stage": stage},
            True,
        ),
        *(("step_note", {"step_id": str(step.id), **note}, True) for note in notes),
        ("node_end", {"node": NODE, "step_id": str(step.id), "status": "succeeded"}, True),
        ("done", {"status": "succeeded"}, False),
    ]
    for sequence, (kind, data, has_step) in enumerate(events, start=1):
        session.add(
            RunEventRow(
                run_id=run.id,
                sequence=sequence,
                step_id=step.id if has_step else None,
                type=kind,
                data_json=_dumps(data),
            )
        )
    run.last_event_id = len(events)
    message.run_id = run.id
    reply = await service.record_reply(
        session, thread, outcome.decision, outcome.reads, run_id=run.id
    )
    await session.flush()
    return run, reply
