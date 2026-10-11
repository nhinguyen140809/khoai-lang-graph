"""Phase C gate: the full workflow runs on the fake model.

With `review_checkpoints = []` the gateway checkpoints auto-take their
default options (§2.4), so the run must walk every stage end-to-end and close
itself: elicitation plan → personas → interviews → analysis → specification →
backlog → validation, the validator failing once on a backlog-category issue
and passing after the engineer and backlog reworks (the demo dataset). Every
artifact, item and link the run wrote must hold against the domain rules
with the version-1 definition.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from collections.abc import Generator

    from langchain_core.runnables import RunnableConfig

    from khoailanggraph.agents.requirements_engineering.ports import ArtifactSink

from khoailanggraph.agents import prompts as prompt_loader
from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering.definition import agent_roles
from khoailanggraph.agents.requirements_engineering.graph import build_re_graph
from khoailanggraph.agents.requirements_engineering.nodes import PROMPTS_PACKAGE
from khoailanggraph.agents.requirements_engineering.outputs import InterviewerTurnOutput
from khoailanggraph.agents.requirements_engineering.state import REState, make_initial_state
from khoailanggraph.domain import rules as domain_rules
from khoailanggraph.llm import reset_model_cache
from khoailanggraph.llm.demo import DEMO_INTENT, DemoData
from khoailanggraph.llm.fake import FakeChatModel
from support.in_memory_sinks import InMemoryArtifactSink, InMemoryDirectiveSink

ROLES = sorted(agent_roles())


def fake_config(sink: ArtifactSink, directives: InMemoryDirectiveSink) -> RunnableConfig:
    return {
        "configurable": {
            "run_id": "run-1",
            "artifact_sink": sink,
            "directive_sink": directives,
            "models": {role: "fake:demo" for role in ROLES},
        }
    }


def run_state() -> REState:
    return make_initial_state(
        "project-1",
        DEMO_INTENT,
        {
            "models": {role: "fake:demo" for role in ROLES},
            "review_checkpoints": [],
            "output_language": "en",
            "max_steps": 200,
            "max_cost_usd": None,
            "parameters": {
                "target_personas_num": 3,
                "max_personas": 3,
                "max_turns": 6,
                "max_iterations": 2,
            },
        },
        first_run=True,
    )


@pytest.fixture(autouse=True)
def fresh_models() -> Generator[None]:
    reset_model_cache()
    yield
    reset_model_cache()


def test_full_workflow_succeeds_and_passes_domain_rules() -> None:
    sink = InMemoryArtifactSink()
    directives = InMemoryDirectiveSink()
    graph = build_re_graph()

    final = graph.invoke(run_state(), config=fake_config(sink, directives))

    # The run closed itself cleanly after two validation passes.
    assert final["status"] == "succeeded", final.get("error")
    assert final["error"] is None
    assert final["iteration_count"] == 2

    # Every stage wrote its artifact exactly as v1 defines the kinds.
    plan = sink.read_artifact("project-1", "elicitation_plan")
    catalog = sink.read_artifact("project-1", "persona_catalog")
    analysis = sink.read_artifact("project-1", "requirements_analysis")
    spec = sink.read_artifact("project-1", "requirement_specification")
    backlog = sink.read_artifact("project-1", "product_backlog")
    assert plan
    assert catalog
    assert analysis
    assert spec
    assert backlog

    # Three personas, and a transcript artifact per persona with its messages.
    personas = [entry for entry in sink.items if entry["kind"] == "persona"]
    assert len(personas) == 3
    transcripts = [
        artifact for artifact in sink.artifacts if artifact["kind"] == "interview_transcript"
    ]
    assert len(transcripts) == 3
    messages = [entry for entry in sink.items if entry["kind"] == "interview_message"]
    assert len(messages) == 18  # 3 questions asked per persona (demo stops at 3)
    assert all(entry["key"].startswith("PER-00") for entry in messages)

    # The analysis items and their links resolve.
    analyzed = [entry for entry in sink.items if entry["kind"] == "analyzed_requirement"]
    assert len(analyzed) == 6
    raw = [entry for entry in sink.items if entry["kind"] == "raw_requirement"]
    assert len(raw) == 9
    assert all(
        link["link_type"] == "stated_by" for link in sink.links if link["link_type"] == "stated_by"
    )
    derived_rows = [row for row in sink.links if row["link_type"] == "derived_from"]
    assert derived_rows, "the analysis must trace analyzed → raw"

    # Spec + backlog: rework superseded the old non-functional requirement and
    # the backlog grew a story that inherits the measurable criteria (§2.3).
    specs = [
        entry
        for entry in sink.items
        if entry["kind"] == "spec_requirement" and entry["review_status"] != "superseded"
    ]
    superseded_specs = [
        entry
        for entry in sink.items
        if entry["kind"] == "spec_requirement" and entry["review_status"] == "superseded"
    ]
    assert len(specs) == 5
    assert len(superseded_specs) == 1
    stories = [entry for entry in sink.items if entry["kind"] == "backlog_item"]
    assert len(stories) == 5
    assert any(row["link_type"] == "supersedes" for row in sink.links), (
        "the rework must supersede the old requirement"
    )

    # Two validation reports: per validator execution (per_project: many).
    reports = [artifact for artifact in sink.artifacts if artifact["kind"] == "validation_report"]
    assert len(reports) == 2

    # Every stored content is valid against its canonical schema + rules.
    value_lists = wf.value_lists()
    plan_values = {
        "elicitation_plan.topics": sink.plan_values("project-1", "topics"),
        "elicitation_plan.stakeholder_types": sink.plan_values("project-1", "stakeholder_types"),
    }
    for artifact in sink.artifacts:
        violations = domain_rules.validate_content(
            artifact["kind"], artifact["content"], value_lists=value_lists
        )
        assert violations == [], (artifact["kind"], violations)
    for entry in sink.items:
        violations = domain_rules.validate_content(
            entry["kind"],
            entry["content"],
            value_lists=value_lists,
            plan_values=plan_values,
        )
        assert violations == [], (entry["key"], violations)

    # The checkpoints took their default option: everything reviewed approved.
    assert analysis["review_status"] in {"approved"}
    assert spec["review_status"] == "approved"
    outcomes = final["checkpoint_outcomes"]
    assert {outcome["node"] for outcome in outcomes} == {
        "checkpoint_personas",
        "checkpoint_analysis",
        "checkpoint_spec",
    }
    assert all(outcome["option"] in {"approve", "accept", "ok"} for outcome in outcomes)

    # Directives: the rework round a checkpoint reject triggered was `rework`;
    # the auto-approve pass records none (§2.4), so this set is data-driven.
    kinds = {row["kind"] for row in directives.rows}
    assert kinds <= {"rework", "intent"}


def test_get_graph_topology_matches_definition_v1() -> None:
    graph = build_re_graph()
    drawn = graph.get_graph()

    node_ids = (
        set(drawn["nodes"])
        if isinstance(drawn, dict)
        else {getattr(node, "id", node) for node in drawn.nodes}
    )
    assert len(node_ids) == 15
    assert "planner" in node_ids
    assert "validator" in node_ids
    assert "intent_router" in node_ids

    edge_pairs = (
        drawn["edges"]
        if isinstance(drawn, dict)
        else [(edge.source, edge.target) for edge in drawn.edges]
    )
    edges = {tuple(pair) for pair in edge_pairs}
    # The definition's 25 rows, error drains aside (backend-only, routing.py).
    definition_pairs = {(str(row["source"]), str(row["target"])) for row in wf.edges()}
    application_edges = {
        pair for pair in edges if not (pair[1] == "__end__" and pair[0] != "validator")
    }
    assert application_edges == definition_pairs


@pytest.mark.parametrize("role", ROLES)
def test_every_prompt_loads_and_validates(role: str) -> None:
    prompt = prompt_loader.load_cached(PROMPTS_PACKAGE, role, 1)
    assert prompt.role == role
    assert prompt.version == 1
    text = prompt.system + prompt.user
    assert "# System" not in text
    assert "# User" not in text


def test_fake_model_returns_instead_of_providers() -> None:
    # bind_tools wiring: the fake model answers the bound schema with a tool
    # call the StructuredResponse parser turns back into the model instance.
    fake = FakeChatModel(demo=DemoData())
    bound = fake.bind_tools([InterviewerTurnOutput])
    answer = bound.with_structured_output(InterviewerTurnOutput)
    result = answer.invoke(
        [("system", "x"), ("human", "PERSONA: Minh\nROLE: Student\nTRANSCRIPT SO FAR:\n(none)")]
    )
    assert isinstance(result, InterviewerTurnOutput)
    assert result.stop is False
    assert result.question
