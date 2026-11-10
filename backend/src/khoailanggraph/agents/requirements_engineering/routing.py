"""Routing functions of the conditional edges of `definition.v1.json` (§2.1).

Only these read `checkpoint_outcomes`, `pending_messages`, `routed_target`,
and `status` to pick the next node — so the option of a checkpoint decides the
very edge the workflow definition names, the guard closes a still-failing run
at max_iterations, and every error drains to the graph exit. Every other
state field is written by nodes only; to stay pure, none of these functions
touches the store or a model.
"""

from langgraph.graph import END

from khoailanggraph.agents.requirements_engineering import orchestrator
from khoailanggraph.agents.requirements_engineering.state import REState


def _latest_outcome(state: REState, node_id: str) -> str:
    for outcome in reversed(state.get("checkpoint_outcomes", [])):
        if outcome["node"] == node_id:
            return str(outcome["option"])
    return ""


def _status(state: REState) -> str:
    return str(state.get("status", ""))


def route_error(state: REState) -> str:
    """Every router's first clause: a failed node, and a checkpoint that waits for the user,
    drain to the graph exit; the executor decides what happens next."""
    return END if _status(state) in {"failed", "interrupted"} else ""


def route_start(state: REState) -> str:
    """`__start__ → {planner (first run), intent_router (later runs)}`; the entry
    clause is §2.1 (the entry of a run began earlier, before the intents edge). A walk that
    continues a run (a resume, a retry, a delivered message) names its node in `start_at`."""
    if state.get("start_at"):
        return str(state["start_at"])
    if state.get("first_run", False) or not state.get("personas"):
        return "checkpoint_plan"
    return "intent_router"


def route_after_personas(state: REState) -> str:
    """`checkpoint_personas → interviewer` (approve); the node never rejects."""
    if route_error(state):
        return route_error(state)
    return "interviewer"


def route_after_interviewer(state: REState) -> str:
    """A fresh turn → persona_agent; the terminal flag → analyst."""
    if route_error(state):
        return route_error(state)
    if orchestrator.interviews_complete(state):
        return "analyst"
    return "persona_agent"


def route_after_analyst(state: REState) -> str:
    """`analyst → rework_elicitation | checkpoint_analysis` (§2.1): only the
    analyst's open-and-unresolvable conflicts stop the flow — the prototype's
    self-trigger, now keyed to v1's artifacts (heuristic until §C.6)."""
    if route_error(state):
        return route_error(state)
    review_pending = state.get("response_analyst_status", "")
    if review_pending == "needs_interviews":
        return "rework_elicitation"
    return "checkpoint_analysis"


def route_after_analysis(state: REState) -> str:
    """`checkpoint_analysis → {requirement_engineer, analyst, rework_elicitation}`."""
    if route_error(state):
        return route_error(state)
    option = _latest_outcome(state, "checkpoint_analysis")
    if option == "reject_reanalyse":
        return "analyst"
    if option == "reject_reinterview":
        return "rework_elicitation"
    return "requirement_engineer"


def route_after_spec(state: REState) -> str:
    """`checkpoint_spec → {backlog_manager, requirement_engineer}`."""
    if route_error(state):
        return route_error(state)
    option = _latest_outcome(state, "checkpoint_spec")
    if option == "not_ok":
        return "requirement_engineer"
    return "backlog_manager"


def route_after_validator(state: REState) -> str:
    """`validator → {__end__ (pass or guard), requirement_engineer (fail)}`."""
    if route_error(state):
        return route_error(state)
    if state.get("status") == "succeeded":
        return END
    verdict = str(state.get("response_validator_status", ""))
    if verdict == "fail":
        return "requirement_engineer"
    return END


def route_after_intent_router(state: REState) -> str:
    """The told targets of the definition: one of the five agent stages."""
    if route_error(state):
        return route_error(state)
    target = str(state.get("routed_target", ""))
    allowed = {
        "planner",
        "interviewer",
        "analyst",
        "requirement_engineer",
        "backlog_manager",
    }
    if target == "planner":
        return "checkpoint_plan"
    return target if target in allowed else "analyst"


def route_after_plan(state: REState) -> str:
    """`checkpoint_plan → corpus_builder` once the plan is approved."""
    if route_error(state):
        return route_error(state)
    return "planner"


CHECKPOINT_ROUTES = {
    "checkpoint_plan": route_after_plan,
    "checkpoint_personas": route_after_personas,
    "checkpoint_analysis": route_after_analysis,
    "checkpoint_spec": route_after_spec,
}


def next_after_checkpoint(node_id: str, state: REState) -> str:
    """The node the workflow continues at once a checkpoint holds its outcome: the edge the chosen
    option names; the end of the walk when the state is failed."""
    return CHECKPOINT_ROUTES[node_id](state)
