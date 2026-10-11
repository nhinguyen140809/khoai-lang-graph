"""Pure-state helpers for the multi-persona interview loop (the port of the
prototype's interview orchestrator, close to unchanged).

The graph has no `advance_persona` node: the cursor lives in state, and the
interviewer node is its only writer. The store (an `ArtifactSink`) is passed
by the callers — nodes get it from the run's LangGraph config — because
`run_config` never carries live objects (it is a plain, frozen record).
Transcripts stay in the artifact store; rework re-opens a completed cycle and
the transcripts are kept (a new interview round appends fresh,
iteration-marked messages)."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from khoailanggraph.agents.requirements_engineering.ports import ArtifactSink, ItemRecord
    from khoailanggraph.agents.requirements_engineering.state import REState


def active_persona(state: REState, sink: ArtifactSink) -> ItemRecord:
    """The persona the cursor points at, with its record from the store.

    Raises IndexError when the cursor is out of range: a node must never ask
    or answer on behalf of a persona that does not exist.
    """
    personas = state["personas"]
    index = int(state["active_persona_index"])
    if not 0 <= index < len(personas):
        msg = f"the persona cursor {index} is out of range ({len(personas)} persona(s))"
        raise IndexError(msg)
    return sink.read_item(personas[index]["item_id"])


def interviews_complete(state: REState) -> bool:
    """Interviews are terminally complete: the stop flag is set, or no persona."""
    return bool(state["interviewer_stop"]) or int(state["active_persona_index"]) >= len(
        state["personas"]
    )


def open_cycle_update() -> dict[str, int | bool]:
    """Cursor writes that re-open a completed cycle at the first persona and
    turn; transcripts are kept — the new round appends to them."""
    return {"active_persona_index": 0, "interview_turn": 0, "interviewer_stop": False}


def exceeded_max_turns(state: REState, *, turns_per_persona: int) -> bool:
    """The active persona used all its allowed question-answer turns."""
    return int(state["interview_turn"]) >= turns_per_persona


def advance_update(state: REState) -> dict[str, int | bool]:
    """Cursor writes that move to the next persona, first turn."""
    return {
        "active_persona_index": int(state["active_persona_index"]) + 1,
        "interview_turn": 0,
        "interviewer_stop": False,
    }
