"""The decision-layer wiring: the three gate points of the workflow call it,
and its graded answers replace the LLM's only when the confidence policy
allows (decisions.py — Jev / mock via DECISION_PROVIDER, off by default)."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING, Any
from unittest.mock import patch

import pytest

from khoailanggraph.agents.requirements_engineering import nodes
from khoailanggraph.agents.requirements_engineering.decisions import (
    DecisionAnswer,
    DecisionResult,
    DecisionSpec,
)
from khoailanggraph.agents.requirements_engineering.definition import agent_roles
from khoailanggraph.agents.requirements_engineering.graph import build_re_graph
from khoailanggraph.agents.requirements_engineering.state import REState, make_initial_state
from khoailanggraph.llm import reset_model_cache
from support.fake_data import DEMO_INTENT
from support.fake_search import demo_research_search
from support.in_memory_sinks import InMemoryArtifactSink, InMemoryDirectiveSink

if TYPE_CHECKING:
    from collections.abc import Generator

    from langchain_core.runnables import RunnableConfig

    from khoailanggraph.agents.requirements_engineering.ports import ArtifactSink

ROLES = sorted(agent_roles())


def _config(sink: ArtifactSink, directives: InMemoryDirectiveSink) -> RunnableConfig:
    return {
        "configurable": {
            "run_id": "run-1",
            "artifact_sink": sink,
            "directive_sink": directives,
            "models": {role: "fake:demo" for role in ROLES},
            "research_search": demo_research_search,
            "project_documents": lambda _project_id: [],
            "pending_messages": [{"id": "m0", "content": DEMO_INTENT}],
        }
    }


def _state() -> REState:
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
                "target_sources_num": 3,
                "target_personas_num": 3,
                "max_personas": 3,
                "max_turns": 6,
                "max_iterations": 2,
            },
        },
        first_run=True,
    )


@pytest.fixture(autouse=True)
def _fresh_models() -> Generator[None]:
    reset_model_cache()
    yield
    reset_model_cache()


def _result(
    decision_id: str,
    specs: list[DecisionSpec],
    confidence: float,
    override: dict[str, Any] | None = None,
) -> DecisionResult:
    """A calibrated provider that echoes every default unless overridden."""
    answers = {}
    for spec in specs:
        value = (override or {}).get(spec.name, spec.default)
        answers[spec.name] = DecisionAnswer(name=spec.name, value=value, confidence=confidence)
    return DecisionResult(
        decision_id=decision_id,
        provider="wiring-test",
        calibrated=True,
        answers=answers,
        latency_ms=1.0,
    )


def test_gate_points_call_the_decision_layer() -> None:
    """interview_turn_policy, spec_type_priority_review, validation_status_review
    all reach the layer; an echoing high-confidence answer changes nothing."""
    calls: list[str] = []

    def _run(
        decision_id: str, context: dict[str, Any], specs: list[DecisionSpec]
    ) -> DecisionResult:
        calls.append(decision_id)
        return _result(decision_id, specs, 0.95)

    sink = InMemoryArtifactSink()
    with patch.object(nodes, "run_decision", _run):
        final = build_re_graph().invoke(_state(), config=_config(sink, InMemoryDirectiveSink()))

    assert final["status"] == "succeeded", final.get("error")
    assert set(calls) >= {
        "interview_turn_policy",
        "spec_type_priority_review",
        "validation_status_review",
    }
    # The echo leaves the scripted flow exactly as it is.
    messages = [e for e in sink.items if e["kind"] == "interview_message"]
    assert len(messages) == 18


def test_high_confidence_priority_overrides_the_engineer() -> None:
    """Auto-graded answers replace the engineer's type/priority values."""

    def _run(
        decision_id: str, context: dict[str, Any], specs: list[DecisionSpec]
    ) -> DecisionResult:
        override = {s.name: "could" for s in specs if s.name.endswith("_priority")}
        return _result(decision_id, specs, 0.95, override)

    sink = InMemoryArtifactSink()
    with patch.object(nodes, "run_decision", _run):
        final = build_re_graph().invoke(_state(), config=_config(sink, InMemoryDirectiveSink()))

    assert final["status"] == "succeeded", final.get("error")
    specs_written = [e for e in sink.items if e["kind"] == "spec_requirement"]
    assert specs_written
    assert all(str(e["content"].get("priority")) == "could" for e in specs_written)


def test_low_confidence_keeps_the_llm_values() -> None:
    """Between the two thresholds the engineer's own values stay."""

    def _run(
        decision_id: str, context: dict[str, Any], specs: list[DecisionSpec]
    ) -> DecisionResult:
        override = {s.name: "could" for s in specs if s.name.endswith("_priority")}
        return _result(decision_id, specs, 0.5, override)

    sink = InMemoryArtifactSink()
    with patch.object(nodes, "run_decision", _run):
        final = build_re_graph().invoke(_state(), config=_config(sink, InMemoryDirectiveSink()))

    assert final["status"] == "succeeded", final.get("error")
    specs_written = [e for e in sink.items if e["kind"] == "spec_requirement"]
    assert specs_written
    assert all(str(e["content"].get("priority")) != "could" for e in specs_written)


def test_env_mock_provider_flows_through_the_real_path() -> None:
    """DECISION_PROVIDER=mock (the real env knob, unpatched) drives the whole
    workflow through run_decision; mock echoes the LLM defaults, so the
    scripted flow stays identical."""
    os.environ["DECISION_PROVIDER"] = "mock"
    try:
        sink = InMemoryArtifactSink()
        final = build_re_graph().invoke(_state(), config=_config(sink, InMemoryDirectiveSink()))
    finally:
        # restore, not pop: an absent var would fall back to backend/.env
        os.environ["DECISION_PROVIDER"] = "off"

    assert final["status"] == "succeeded", final.get("error")
    messages = [e for e in sink.items if e["kind"] == "interview_message"]
    assert len(messages) == 18
    specs_written = [e for e in sink.items if e["kind"] == "spec_requirement"]
    assert all(str(e["content"].get("priority")) != "could" for e in specs_written)
