"""The run executor: walks the workflow of a run, one step at a time, and records every step.

A run executes on a thread of the API process (or inside the request in `inline` mode). Each step
is stored as it ends: the step row with its usage, the items it produced and the workflow state
after it, the events of the stream, and the interrupt of a checkpoint that waits for the user.
Because the state after every step is stored, nothing has to stay alive while a run waits:

- a **start** walks from the entry rule of the workflow (the planner for the first run of a
  project, the intent router for every later run);
- a **resume** builds the state after a checkpoint from the decision of the user and walks on from
  the node that the chosen option leads to;
- a **retry** walks from the state saved before a step of another run.

Between two steps the executor checks the run for a cancel, the step limit and the messages that
the user sent meanwhile; a message that waits is handed to the intent router before the next node.
Before every call to a model the cost limit of the run and the budget of the user are checked and
afterwards the usage is added, see `UsageGate`.
"""

from __future__ import annotations

import asyncio
import json
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, cast
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session  # noqa: TC002 - runtime type of the session factory

from khoailanggraph.agents.requirements_engineering import definition as workflow_definition
from khoailanggraph.agents.requirements_engineering import routing
from khoailanggraph.agents.requirements_engineering.graph import build_re_graph
from khoailanggraph.agents.requirements_engineering.ports import RunLimitError
from khoailanggraph.agents.requirements_engineering.state import REState, make_initial_state
from khoailanggraph.features.artifacts.models import ArtifactRow
from khoailanggraph.features.artifacts.service import SqlArtifactSink
from khoailanggraph.features.documents.service import sync_latest_texts
from khoailanggraph.features.me.models import UserRow
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.runs import restore, service
from khoailanggraph.features.runs import usage as run_usage_totals
from khoailanggraph.features.runs.models import (
    DirectiveRow,
    HumanDecisionRow,
    InterruptRow,
    RunEventRow,
    RunRow,
    RunStepRow,
)
from khoailanggraph.features.threads.models import MessageRow, ThreadRow
from khoailanggraph.llm import reset_model_cache
from khoailanggraph.llm.usage import Usage, add_usage, zero_usage
from khoailanggraph.platform.db import make_sync_session_factory
from khoailanggraph.platform.origin import Origin
from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Callable, Mapping

    from sqlalchemy import Engine

    from khoailanggraph.agents.requirements_engineering.ports import DirectiveItem

# The state fields that hold the items of a kind, and the state fields that hold an artifact.
ITEM_FIELDS = {
    "observations": ("research_corpus", "stakeholder_observation"),
    "personas": ("persona_catalog", "persona"),
    "raw_requirements": ("interview_transcript", "raw_requirement"),
    "analyzed_requirements": ("requirements_analysis", "analyzed_requirement"),
    "latent_needs": ("requirements_analysis", "latent_need"),
    "assumptions": ("requirements_analysis", "assumption"),
    "ambiguities": ("requirements_analysis", "ambiguity_issue"),
    "conflicts": ("requirements_analysis", "conflict"),
    "requirement_specification": ("requirement_specification", "spec_requirement"),
    "product_backlog": ("product_backlog", "backlog_item"),
}
ARTIFACT_FIELDS = {
    "elicitation_plan": "elicitation_plan",
    "research_corpus": "research_corpus",
    "validation_report": "validation_report",
}
PROJECT_NAME_LENGTH = 60
ENTRY_NODES = {"planner", "intent_router"}


def _now() -> datetime:
    return datetime.now(UTC)


def _dumps(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, default=str).encode("utf-8")


def _loads(blob: bytes | None) -> Any:
    return json.loads((blob or b"null").decode("utf-8"))


class RunExecutor:
    """Where the jobs of the runs execute: on a thread of the process, or inline."""

    def __init__(self, mode: str) -> None:
        self.inline = mode == "inline"
        self._threads: list[threading.Thread] = []

    async def submit(self, job: Callable[[], None]) -> None:
        """Start a job. Inline mode waits for it to end or to pause at a review."""
        if self.inline:
            await asyncio.to_thread(job)
            return
        thread = threading.Thread(target=job, daemon=True, name="run-executor")
        self._threads = [alive for alive in self._threads if alive.is_alive()]
        self._threads.append(thread)
        thread.start()

    def wait(self, timeout: float = 30.0) -> None:
        """Wait for the jobs that are running, up to a time limit (a planned stop of the API)."""
        for thread in list(self._threads):
            thread.join(timeout)


class DirectiveSink:
    """Records the directives that the nodes issue, with the step that issued them."""

    def __init__(self, session: Session, step_id: Callable[[], UUID | None]) -> None:
        self.session = session
        self.step_id = step_id

    def create_directive(
        self,
        run_id: str,
        kind: str,
        *,
        target_node: str,
        iteration: int,
        instruction: str,
        items: list[DirectiveItem],
    ) -> str:
        row = DirectiveRow(
            id=uuid4(),
            run_id=UUID(run_id),
            kind=kind,
            issued_by_step_id=self.step_id(),
            target_node=target_node,
            iteration=iteration,
            instruction=instruction,
            items_json=_dumps(items),
            details_json=_dumps({}),
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
            "item_ids": [str(entry["item_id"]) for entry in _loads(row.items_json) or []],
        }


class UsageGate:
    """Around every call to a model: the limits before it, the usage after it."""

    def __init__(self, walker: RunWalker) -> None:
        self.walker = walker

    def before_call(self, role: str) -> None:
        walker = self.walker
        spent = walker.run_usage["cost_usd"]
        limit = walker.config.get("max_cost_usd")
        if limit is not None and spent >= float(limit):
            msg = f"The run reached its cost limit of {limit} US dollars."
            raise RunLimitError("cost_limit_exceeded", msg)
        budget = walker.month_budget
        if budget is not None and walker.month_before + spent >= budget:
            msg = f"The monthly budget of {budget} US dollars is spent."
            raise RunLimitError("budget_exceeded", msg)

    def record_call(self, role: str, model_id: str, usage: Usage) -> None:
        walker = self.walker
        walker.step_usage = add_usage(walker.step_usage, usage)
        walker.run_usage = add_usage(walker.run_usage, usage)
        walker.step_calls += 1
        walker.step_model = model_id


@dataclass
class RunWalker:
    """One walk of one run over its own database session."""

    engine: Engine
    run_id: UUID
    session: Session = field(init=False)
    run: RunRow = field(init=False)
    thread: ThreadRow = field(init=False)
    project: ProjectRow = field(init=False)
    sink: SqlArtifactSink = field(init=False)
    config: dict[str, Any] = field(default_factory=dict)
    state: REState | None = None
    step: RunStepRow | None = None
    chunk: dict[str, Any] = field(default_factory=dict)
    step_usage: Usage = field(default_factory=zero_usage)
    step_calls: int = 0
    step_model: str | None = None
    run_usage: Usage = field(default_factory=zero_usage)
    month_before: float = 0.0
    month_budget: float | None = None
    paused: bool = False
    failure: tuple[str, str] | None = None
    pending_for_router: list[dict[str, str]] = field(default_factory=list)

    # — entry points —
    def execute(self, resume_interrupt: UUID | None = None) -> UUID | None:
        """Walk the run to its end or to the next review; returns the run that the pending
        messages of the thread started when this one succeeded, if any."""
        reset_model_cache()
        factory = make_sync_session_factory(self.engine)
        with factory() as session:
            self.session = session
            run = session.get(RunRow, self.run_id)
            if run is None or run.status not in {"queued", "running"}:
                return None
            self.run = run
            self.thread = cast("ThreadRow", session.get(ThreadRow, run.thread_id))
            self.project = cast("ProjectRow", session.get(ProjectRow, run.project_id))
            self.config = _loads(run.run_config_json)
            self.run_usage = run_usage_totals.usage_of(run.usage_json)
            self._load_budget()
            self.sink = SqlArtifactSink(self.engine, run_id=run.id, thread_id=self.thread.id)
            self.sink.bind(session)
            run.status = "running"
            run.started_at = run.started_at or _now()
            self.thread.active_run_id = run.id
            try:
                state = self._entry(resume_interrupt)
                self._commit()
                self._walk(state)
            except Exception as exc:
                session.rollback()
                self._fail_unexpected(exc)
            return self._finish()

    def _load_budget(self) -> None:
        user = self.session.get(UserRow, self.run.started_by)
        settings = get_settings()
        budget = user.monthly_budget_usd if user is not None else None
        self.month_budget = budget if budget is not None else settings.default_monthly_budget_usd
        start, end = run_usage_totals.month_bounds()
        others = self.session.scalars(
            run_usage_totals.runs_of_user_in(self.run.started_by, start, end).where(
                RunRow.id != self.run.id
            )
        ).all()
        self.month_before = run_usage_totals.total_usage(list(others))["cost_usd"]

    # — the state a walk begins with —
    def _entry(self, resume_interrupt: UUID | None) -> REState:
        """The state the walk begins with; its `start_at` names the node to begin at."""
        retry = _loads(self.run.input_json) or {}
        if resume_interrupt is not None:
            return self._resumed_state(resume_interrupt)
        if retry.get("retry_from_step_id"):
            return self._retried_state(UUID(str(retry["retry_from_step_id"])))
        return self._started_state()

    def _started_state(self) -> REState:
        starting = self.session.scalar(
            select(MessageRow)
            .where(MessageRow.run_id == self.run.id, MessageRow.author == "user")
            .order_by(MessageRow.sequence)
            .limit(1)
        )
        first_message = (
            self.session.get(MessageRow, self.project.initial_message_id)
            if self.project.initial_message_id
            else starting
        )
        intent = first_message.content if first_message is not None else ""
        first_run = starting is not None and self.project.initial_message_id == starting.id
        state = make_initial_state(str(self.project.id), intent, self.config, first_run=first_run)
        if not first_run:
            cast("dict[str, Any]", state).update(self._project_refs())
            state["current_stage"] = self.run.current_stage
            state["start_at"] = "intent_router"
            if starting is not None:
                self.pending_for_router = [{"id": str(starting.id), "content": starting.content}]
        return state

    def _project_refs(self) -> dict[str, Any]:
        """The references to the documents the project holds now, for a run that continues work."""
        refs: dict[str, Any] = {}
        project = str(self.project.id)
        for name, kind in ARTIFACT_FIELDS.items():
            record = self.sink.read_artifact(project, kind)
            if record is not None:
                refs[name] = self._artifact_ref(record)
        for name, (artifact_kind, item_kind) in ITEM_FIELDS.items():
            record = self.sink.read_artifact(project, artifact_kind)
            if record is None:
                continue
            refs[name] = [
                {
                    "item_id": entry["item_id"],
                    "kind": entry["kind"],
                    "key": entry["key"],
                    "version": entry["version"],
                }
                for entry in record["items"]
                if entry["kind"] == item_kind
            ]
        transcripts = self.session.scalars(
            select(ArtifactRow).where(
                ArtifactRow.project_id == self.project.id,
                ArtifactRow.kind == "interview_transcript",
            )
        ).all()
        refs["interview_transcripts"] = [
            {
                "artifact_id": str(row.id),
                "kind": row.kind,
                "title": row.title,
                "version": row.version,
            }
            for row in transcripts
        ]
        return refs

    @staticmethod
    def _artifact_ref(record: Mapping[str, Any]) -> dict[str, Any]:
        return {
            "artifact_id": record["artifact_id"],
            "kind": record["kind"],
            "title": record["title"],
            "version": record["version"],
        }

    def _resumed_state(self, interrupt_id: UUID) -> REState:
        """The state after a checkpoint with the decision of the user in it, ready to walk on."""
        interrupt = self.session.get(InterruptRow, interrupt_id)
        decision = self.session.scalar(
            select(HumanDecisionRow).where(HumanDecisionRow.interrupt_id == interrupt_id)
        )
        if interrupt is None or decision is None or interrupt.step_id is None:
            msg = "the run has no decided interrupt to continue from"
            raise ValueError(msg)
        step = self.session.get(RunStepRow, interrupt.step_id)
        if step is None or step.state_json is None:
            msg = "the step of the interrupt saved no state"
            raise ValueError(msg)
        state = cast("REState", _loads(step.state_json))
        option = str(decision.option)
        feedback = decision.feedback or ""
        state["checkpoint_outcomes"] = [
            *state["checkpoint_outcomes"],
            {"node": interrupt.node, "option": option, "feedback": feedback, "automatic": False},
        ]
        if feedback:
            state["human_feedback"] = [*state["human_feedback"], feedback]
        state["status"] = "running"
        state["interrupt_payload"] = None
        chosen: dict[str, Any] = next(
            (entry for entry in _loads(interrupt.options_json) if entry["key"] == option), {}
        )
        self.sink.user_id = decision.decided_by
        if chosen.get("approves"):
            for ref in _loads(interrupt.artifacts_json) or []:
                self.sink.approve_artifact(str(ref["artifact_id"]))
        target = routing.next_after_checkpoint(interrupt.node, state)
        if not chosen.get("approves"):
            directive = DirectiveRow(
                id=uuid4(),
                run_id=self.run.id,
                kind="rework",
                human_decision_id=decision.id,
                target_node=target,
                iteration=int(state["iteration_count"]),
                instruction=feedback or str(chosen.get("label", option)),
                items_json=_dumps(
                    [
                        {"item_id": str(entry["item_id"]), "role": "edited"}
                        for entry in _loads(decision.modified_items_json) or []
                    ]
                ),
                details_json=_dumps({}),
            )
            self.session.add(directive)
            self.session.flush()
            state["rework_directives"] = [*state["rework_directives"], str(directive.id)]
        state["start_at"] = target
        self.run.current_stage = str(state["current_stage"])
        return state

    def _retried_state(self, from_step_id: UUID) -> REState:
        """The state saved before a step of another run, to walk from that step again."""
        original = self.session.get(RunStepRow, from_step_id)
        if original is None:
            msg = "the step to retry from does not exist"
            raise ValueError(msg)
        previous = self.session.scalar(
            select(RunStepRow).where(
                RunStepRow.run_id == original.run_id,
                RunStepRow.sequence == original.sequence - 1,
            )
        )
        if previous is None or previous.state_json is None:
            starting = self.session.scalar(
                select(MessageRow)
                .where(MessageRow.run_id == original.run_id, MessageRow.author == "user")
                .order_by(MessageRow.sequence)
                .limit(1)
            )
            first = (
                self.session.get(MessageRow, self.project.initial_message_id)
                if self.project.initial_message_id
                else starting
            )
            state = make_initial_state(
                str(self.project.id),
                first.content if first is not None else "",
                self.config,
                first_run=original.node == "planner",
            )
        else:
            state = cast("REState", _loads(previous.state_json))
            state["status"] = "running"
            state["error"] = None
            state["interrupt_payload"] = None
            state["run_config"] = self.config
        state["start_at"] = original.node
        restore.bring_back(
            self.session,
            self.project.id,
            original,
            Origin(actor="user", user_id=self.run.started_by, run_id=self.run.id),
        )
        return state

    # — the walk —
    def _walk(self, state: REState) -> None:
        graph = build_re_graph()
        sink_config = self._graph_config()
        while True:
            restart = False
            self.state = state
            for mode, payload in cast("Any", graph).stream(
                state,
                stream_mode=["tasks", "updates", "values"],
                config=sink_config,
            ):
                if mode == "tasks":
                    task = cast("dict[str, Any]", payload)
                    if "input" in task:
                        verdict = self._on_task_start(str(task["name"]))
                        if verdict == "stop":
                            return
                        if verdict == "router":
                            restart = True
                            break
                elif mode == "updates":
                    for node, chunk in cast("dict[str, Any]", payload).items():
                        if node not in {"__interrupt__", "__end__"}:
                            self.chunk.update(chunk or {})
                else:
                    self.state = cast("REState", payload)
                    if self.step is not None and self._on_step_done():
                        return
            if not restart:
                return
            state = cast("REState", dict(self.state or state))
            state["start_at"] = "intent_router"

    def _graph_config(self) -> dict[str, Any]:
        engine = self.engine
        return {
            "recursion_limit": max(int(self.config.get("max_steps", 400)) * 2, 50),
            "configurable": {
                "run_id": str(self.run.id),
                "artifact_sink": self.sink,
                "directive_sink": DirectiveSink(
                    self.session, lambda: self.step.id if self.step is not None else None
                ),
                "llm_gate": UsageGate(self),
                "models": self.config.get("models", {}),
                "pending_messages": self.pending_for_router,
                "research_search": service.make_research_search(get_settings()),
                "project_documents": lambda project_id: sync_latest_texts(
                    engine, UUID(str(project_id))
                ),
            },
        }

    def _cancelled(self) -> bool:
        self.session.refresh(self.run, attribute_names=["status"])
        return self.run.status == "cancelled"

    def _pending_messages(self) -> list[MessageRow]:
        return list(
            self.session.scalars(
                select(MessageRow)
                .where(
                    MessageRow.thread_id == self.thread.id,
                    MessageRow.author == "user",
                    MessageRow.delivery == "pending",
                )
                .order_by(MessageRow.sequence)
            ).all()
        )

    def _on_task_start(self, node: str) -> str:
        """A node is about to run: the safe point before it, then its step. Returns `stop`, `router`
        (the pending messages go to the intent router first) or an empty string."""
        if self._cancelled():
            return "stop"
        if node != "intent_router" and self._pending_messages():
            return "router"
        if self.run.step_count >= int(self.config.get("max_steps", 400)):
            self.failure = (
                "step_limit_exceeded",
                f"The run reached its limit of {self.config.get('max_steps')} steps.",
            )
            return "stop"
        self._begin_step(node)
        return ""

    def _begin_step(self, node: str) -> None:
        spec = workflow_definition.nodes().get(node, {})
        state = self.state
        subject: dict[str, Any] | None = None
        if state is not None and node in {"interviewer", "persona_agent"}:
            personas = state.get("personas", [])
            index = int(state.get("active_persona_index", 0))
            subject = cast("dict[str, Any]", personas[index]) if index < len(personas) else None
        step = RunStepRow(
            id=uuid4(),
            run_id=self.run.id,
            sequence=self.run.step_count + 1,
            node=node,
            agent_role=spec.get("agent_role"),
            stage=str(spec.get("stage") or self.run.current_stage),
            status="running",
            iteration=int(state["iteration_count"]) if state is not None else 0,
            subject_item_id=UUID(str(subject["item_id"])) if subject else None,
            started_at=_now(),
        )
        self.session.add(step)
        self.run.step_count = step.sequence
        self.run.current_stage = step.stage
        self.session.flush()
        self.step = step
        self.chunk = {}
        self.step_usage = zero_usage()
        self.step_calls = 0
        self.step_model = None
        self.sink.step_id = step.id
        self.sink.emit(
            "node_start",
            {
                "node": node,
                "step_id": str(step.id),
                "agent_role": step.agent_role,
                "stage": step.stage,
                "iteration": step.iteration,
                "persona_key": subject["key"] if subject else None,
            },
            step_id=step.id,
        )
        self._name_project(step)
        if node == "intent_router":
            self._hand_messages_to_router(step)
        self._commit()

    def _name_project(self, step: RunStepRow) -> None:
        """A project created without a name gets one from the intent of its first run."""
        if self.project.name is not None or self.state is None:
            return
        words = " ".join(str(self.state["initial_intent"]).split())
        name = words if len(words) <= PROJECT_NAME_LENGTH else words[:PROJECT_NAME_LENGTH].rstrip()
        if not name:
            return
        self.project.name = name
        self.sink.emit(
            "project_named",
            {"step_id": str(step.id), "project_id": str(self.project.id), "name": name},
            step_id=step.id,
        )

    def _hand_messages_to_router(self, step: RunStepRow) -> None:
        """The messages that wait are delivered to the intent router in this step."""
        waiting = self._pending_messages()
        for message in waiting:
            message.delivery = "delivered"
            message.delivered_in_step_id = step.id
            self.sink.emit(
                "message_delivered",
                {"message_id": str(message.id), "step_id": str(step.id), "node": "intent_router"},
                step_id=step.id,
            )
        if waiting:
            self.pending_for_router[:] = [
                {"id": str(message.id), "content": message.content} for message in waiting
            ]

    def _on_step_done(self) -> bool:
        """A step ended: record it. Returns True when the walk must stop here."""
        step = self.step
        state = self.state
        if step is None or state is None:
            return False
        failed = str(self.chunk.get("status", "")) == "failed"
        step.status = "failed" if failed else "succeeded"
        step.finished_at = _now()
        step.usage_json = _dumps(self.step_usage)
        step.llm_calls = self.step_calls
        step.model_id = self.step_model
        step.produced_json = _dumps(self.sink.produced())
        step.state_json = _dumps(state)
        if failed:
            error = dict(self.chunk.get("error") or {})
            step.error = str(error.get("message") or "the step failed")
            self.failure = (str(error.get("code") or "node_failed"), step.error)
        self.run.current_stage = str(state.get("current_stage", self.run.current_stage))
        self.run.iteration_count = int(state.get("iteration_count", 0))
        self.run.usage_json = _dumps(self.run_usage)
        self.sink.emit(
            "node_end",
            {
                "node": step.node,
                "step_id": str(step.id),
                "status": step.status,
                "usage": self.step_usage,
            },
            step_id=step.id,
        )
        self._record_checkpoint(step)
        self.step = None
        self.sink.step_id = None
        self._commit()
        return self.paused or failed or self._cancelled()

    def _record_checkpoint(self, step: RunStepRow) -> None:
        """A checkpoint step: store the interrupt it holds, or the one it resolved at once."""
        payload = self.chunk.get("interrupt_payload")
        spec = workflow_definition.nodes().get(step.node, {})
        if payload:
            row = self._interrupt_row(step, payload)
            self.session.add(row)
            self.session.flush()
            self.paused = True
            self.sink.emit(
                "interrupt",
                {
                    "node": step.node,
                    "step_id": str(step.id),
                    "payload": {
                        "interrupt_id": str(row.id),
                        "prompt": row.prompt,
                        "options": payload["options"],
                        "questions": [
                            {"source": "definition", **question}
                            for question in payload["questions"]
                        ],
                        "allow_edits": row.allow_edits,
                        "review_artifacts": payload["review_artifacts"],
                    },
                },
                step_id=step.id,
            )
            return
        for outcome in self.chunk.get("checkpoint_outcomes", []):
            if not outcome.get("automatic"):
                continue
            row = self._interrupt_row(
                step,
                {
                    "prompt": spec.get("prompt", ""),
                    "options": spec.get("options", []),
                    "questions": spec.get("questions", []),
                    "allow_edits": spec.get("allow_edits", False),
                    "review_artifacts": [],
                },
            )
            row.status = "resolved"
            row.resolved_at = _now()
            self.session.add(row)
            self.session.flush()
            self.session.add(
                HumanDecisionRow(
                    id=uuid4(),
                    interrupt_id=row.id,
                    run_id=self.run.id,
                    decided_by=None,
                    option=outcome["option"],
                    feedback=None,
                    answers_json=_dumps({}),
                    modified_items_json=_dumps([]),
                )
            )

    def _interrupt_row(self, step: RunStepRow, payload: Mapping[str, Any]) -> InterruptRow:
        return InterruptRow(
            id=uuid4(),
            run_id=self.run.id,
            step_id=step.id,
            node=step.node,
            prompt=str(payload.get("prompt", "")),
            options_json=_dumps(payload.get("options", [])),
            questions_json=_dumps(payload.get("questions", [])),
            allow_edits=bool(payload.get("allow_edits", False)),
            artifacts_json=_dumps(payload.get("review_artifacts", [])),
        )

    def _commit(self) -> None:
        top = self.session.scalar(
            select(func.max(RunEventRow.sequence)).where(RunEventRow.run_id == self.run.id)
        )
        self.run.last_event_id = int(top or 0)
        self.run.updated_at = _now()
        self.session.commit()

    # — the end of a walk —
    def _fail_unexpected(self, exc: Exception) -> None:
        self.run = cast("RunRow", self.session.get(RunRow, self.run_id))
        if self.step is not None:
            step = self.session.get(RunStepRow, self.step.id)
            if step is not None:
                step.status = "failed"
                step.error = str(exc)
                step.finished_at = _now()
        self.failure = ("provider_error", f"run executor: {exc}")

    def _finish(self) -> UUID | None:
        """Close the walk: a pause, a cancel, a failure or a success; the run the pending messages
        of the thread start when this one succeeded."""
        session = self.session
        run = session.get(RunRow, self.run_id)
        if run is None:
            return None
        self.run = run
        session.refresh(run)
        if run.status == "cancelled":
            self._end_thread()
            session.commit()
            return None
        if self.paused:
            run.status = "interrupted"
            self._commit()
            return None
        current = cast("dict[str, Any]", self.state or {})
        final = current.get("status", "succeeded")
        failed = self.failure is not None or final == "failed"
        if failed and self.failure is None:
            error = dict(current.get("error") or {})
            self.failure = (
                str(error.get("code") or "node_failed"),
                str(error.get("message") or "the workflow failed"),
            )
        run.status = "failed" if failed else "succeeded"
        run.finished_at = _now()
        run.usage_json = _dumps(self.run_usage)
        sink = self.sink
        sink.step_id = None
        if failed and self.failure is not None:
            run.error_code, run.error_message = self.failure
            run.error_stage = run.current_stage
            sink.emit(
                "error",
                {"message": run.error_message, "code": run.error_code, "stage": run.error_stage},
            )
        sink.emit("done", {"status": run.status})
        self._end_thread()
        follow_up = self._start_follow_up() if run.status == "succeeded" else None
        if run.status == "failed":
            self._undeliver_pending()
        self._commit()
        return follow_up

    def _end_thread(self) -> None:
        self.thread.active_run_id = None
        self.thread.current_stage = self.run.current_stage

    def _undeliver_pending(self) -> None:
        for message in self._pending_messages():
            message.delivery = "undelivered"

    def _start_follow_up(self) -> UUID | None:
        """Messages left pending by a run that succeeded start the next run together."""
        waiting = self._pending_messages()
        if not waiting:
            return None
        run = RunRow(
            id=uuid4(),
            thread_id=self.thread.id,
            project_id=self.project.id,
            number=self.run.number + 1,
            started_by=self.run.started_by,
            workflow_name=self.run.workflow_name,
            workflow_version=self.run.workflow_version,
            status="queued",
            current_stage="intent_routing",
            run_config_json=self.run.run_config_json,
            usage_json=_dumps(zero_usage()),
        )
        self.session.add(run)
        self.session.flush()
        for message in waiting:
            message.delivery = "started_run"
            message.run_id = run.id
        self.thread.active_run_id = run.id
        return run.id


def run_job(engine: Engine, run_id: UUID, *, resume_interrupt: UUID | None = None) -> None:
    """The job of a run: walk it, then walk the run that its pending messages started, and so on."""
    next_run = RunWalker(engine, run_id).execute(resume_interrupt)
    while next_run is not None:
        next_run = RunWalker(engine, next_run).execute()


__all__ = ["RunExecutor", "RunWalker", "UsageGate", "run_job"]


def recover_runs(engine: Engine) -> list[UUID]:
    """What the API does when it starts again: a run that was `running` lost the step in
    progress and fails with `server_restarted`; a run that was `queued` is returned to be started;
    a run that was `interrupted` waits as before."""
    queued: list[UUID] = []
    with make_sync_session_factory(engine)() as session:
        for run in session.scalars(
            select(RunRow).where(RunRow.status.in_(("queued", "running")))
        ).all():
            if run.status == "queued":
                queued.append(run.id)
                continue
            run.status = "failed"
            run.error_code = "server_restarted"
            run.error_message = "The server restarted while the run was working."
            run.error_stage = run.current_stage
            run.finished_at = _now()
            for step in session.scalars(
                select(RunStepRow).where(
                    RunStepRow.run_id == run.id, RunStepRow.status == "running"
                )
            ).all():
                step.status = "failed"
                step.error = run.error_message
                step.finished_at = _now()
            sink = SqlArtifactSink(engine, run_id=run.id)
            sink.bind(session)
            sink.emit(
                "error",
                {"message": run.error_message, "code": run.error_code, "stage": run.error_stage},
            )
            run.last_event_id = sink.emit("done", {"status": "failed"})
            thread = session.get(ThreadRow, run.thread_id)
            if thread is not None and thread.active_run_id == run.id:
                thread.active_run_id = None
        session.commit()
    return queued
