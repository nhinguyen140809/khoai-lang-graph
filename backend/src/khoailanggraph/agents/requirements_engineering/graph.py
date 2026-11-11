"""Graph assembly of the requirements engineering workflow (version 2).

The 17 nodes and 27 conditional/plain edges below are `definition.v2.json`
mapped onto LangGraph under the §2.1 mapping: `__start__ → {planner |
intent_router}`, the research stage of the evidence-grounded persona pipeline
(`planner → corpus_builder → stakeholder_miner → persona_generator`, the
MAJ-EVAL mechanism of arXiv:2507.21028), the interview loop under the in-node
orchestrator, the analyst with the rework control node, the v1 checkpoint
options on the conditional edges that carry their keys, and the iteration
guard on the validator (a still-failing run closes at `max_iterations`; it
never fails).

Checkpoint prompts and their options are read from the definition — not
re-declared in Python — and the graph runs without the API: agents get their
chat model from `llm` by role, the sinks arrive through the LangGraph
configurable, which is what `research/` and the artifact feature both wire.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from langgraph.graph import END, START, StateGraph

from khoailanggraph.agents.requirements_engineering import routing
from khoailanggraph.agents.requirements_engineering.nodes import (
    analyst_node,
    backlog_manager_node,
    checkpoint_analysis,
    checkpoint_personas,
    checkpoint_plan,
    checkpoint_spec,
    corpus_builder_node,
    intent_router_node,
    interviewer_node,
    persona_agent_node,
    persona_generator_node,
    planner_node,
    requirement_engineer_node,
    rework_elicitation_node,
    stakeholder_miner_node,
    validator_node,
)
from khoailanggraph.agents.requirements_engineering.state import REState

if TYPE_CHECKING:
    from langgraph.checkpoint.base import BaseCheckpointSaver
    from langgraph.graph.state import CompiledStateGraph

NODE_NAMES = (
    "__start__",
    "planner",
    "corpus_builder",
    "stakeholder_miner",
    "persona_generator",
    "checkpoint_plan",
    "checkpoint_personas",
    "interviewer",
    "persona_agent",
    "analyst",
    "rework_elicitation",
    "checkpoint_analysis",
    "requirement_engineer",
    "checkpoint_spec",
    "backlog_manager",
    "validator",
    "intent_router",
    "__end__",
)

EDGE_COUNT = 28


def build_re_graph(
    checkpointer: BaseCheckpointSaver[Any] | None = None,
) -> CompiledStateGraph[REState]:
    """Assemble and compile the workflow graph, with an optional checkpointer."""
    builder = StateGraph(REState)

    builder.add_node("planner", planner_node)
    builder.add_node("corpus_builder", corpus_builder_node)
    builder.add_node("stakeholder_miner", stakeholder_miner_node)
    builder.add_node("persona_generator", persona_generator_node)
    builder.add_node("checkpoint_plan", checkpoint_plan)
    builder.add_node("checkpoint_personas", checkpoint_personas)
    builder.add_node("interviewer", interviewer_node)
    builder.add_node("persona_agent", persona_agent_node)
    builder.add_node("analyst", analyst_node)
    builder.add_node("rework_elicitation", rework_elicitation_node)
    builder.add_node("checkpoint_analysis", checkpoint_analysis)
    builder.add_node("requirement_engineer", requirement_engineer_node)
    builder.add_node("checkpoint_spec", checkpoint_spec)
    builder.add_node("backlog_manager", backlog_manager_node)
    builder.add_node("validator", validator_node)
    builder.add_node("intent_router", intent_router_node)

    builder.add_conditional_edges(
        START,
        routing.route_start,
        [name for name in NODE_NAMES if name not in {"__start__", "__end__"}],
    )
    builder.add_conditional_edges(
        "intent_router",
        routing.route_after_intent_router,
        ["planner", "checkpoint_plan", "interviewer", "analyst", "requirement_engineer", "backlog_manager"],
    )
    builder.add_edge("planner", "corpus_builder")
    builder.add_conditional_edges(
        "checkpoint_plan",
        routing.route_after_plan,
        ["planner", END],
    )
    builder.add_edge("corpus_builder", "stakeholder_miner")
    builder.add_edge("stakeholder_miner", "persona_generator")
    builder.add_edge("persona_generator", "checkpoint_personas")
    builder.add_conditional_edges(
        "checkpoint_personas",
        routing.route_after_personas,
        ["interviewer", "intent_router", END],
    )
    builder.add_conditional_edges(
        "interviewer",
        routing.route_after_interviewer,
        ["persona_agent", "analyst", END],
    )
    builder.add_edge("persona_agent", "interviewer")
    builder.add_conditional_edges(
        "analyst",
        routing.route_after_analyst,
        ["rework_elicitation", "checkpoint_analysis", END],
    )
    builder.add_edge("rework_elicitation", "interviewer")
    builder.add_conditional_edges(
        "checkpoint_analysis",
        routing.route_after_analysis,
        ["requirement_engineer", "analyst", "rework_elicitation", "intent_router", END],
    )
    builder.add_edge("requirement_engineer", "checkpoint_spec")
    builder.add_conditional_edges(
        "checkpoint_spec",
        routing.route_after_spec,
        ["backlog_manager", "requirement_engineer", "intent_router", END],
    )
    builder.add_edge("backlog_manager", "validator")
    builder.add_conditional_edges(
        "validator",
        routing.route_after_validator,
        [END, "requirement_engineer"],
    )
    return builder.compile(checkpointer=checkpointer)
