"""Bounded AI decisions: spec, mock, policy, and environment config."""

from __future__ import annotations

import os

from khoailanggraph.agents.requirements_engineering.decisions import (
    ConfidencePolicy,
    DecisionAnswer,
    DecisionResult,
    DecisionSpec,
    MockDecisionModel,
    apply_confidence_policy,
    get_decision_model,
    policy_from_environment,
    run_decision,
)


def test_spec_model_round_trips() -> None:
    spec = DecisionSpec(name="stop", kind="noul", default=True, criteria="enough")
    assert spec.name == "stop"
    assert spec.kind == "noul"
    assert spec.default is True


def test_mock_provider_high_confidence() -> None:
    model = MockDecisionModel()
    result = model.decide("test-1", {}, [DecisionSpec(name="stop", kind="noul", default=True)])
    assert result.provider == "mock"
    assert result.calibrated is True
    assert result.answers["stop"].confidence is not None
    assert result.answers["stop"].confidence >= 0.7
    assert result.answers["stop"].value is True


def test_confidence_policy_auto() -> None:
    policy = ConfidencePolicy(auto=0.7, review=0.4)
    result = DecisionResult(
        decision_id="d",
        provider="mock",
        calibrated=True,
        answers={"stop": DecisionAnswer(name="stop", value=True, confidence=0.85)},
        latency_ms=0.1,
    )
    spec = DecisionSpec(name="stop", kind="noul", default=False)
    applied = apply_confidence_policy(result, spec, False, policy)
    assert applied.action == "auto"
    assert applied.chosen is True
    assert applied.needs_human is False


def test_confidence_policy_needs_review() -> None:
    policy = ConfidencePolicy(auto=0.7, review=0.4)
    result = DecisionResult(
        decision_id="d",
        provider="mock",
        calibrated=True,
        answers={"stop": DecisionAnswer(name="stop", value=True, confidence=0.2)},
        latency_ms=0.1,
    )
    spec = DecisionSpec(name="stop", kind="noul", default=False)
    applied = apply_confidence_policy(result, spec, "current", policy)
    assert applied.action == "needs_review"
    assert applied.needs_human is True


def test_confidence_policy_kept_low() -> None:
    policy = ConfidencePolicy(auto=0.7, review=0.4)
    result = DecisionResult(
        decision_id="d",
        provider="mock",
        calibrated=True,
        answers={"stop": DecisionAnswer(name="stop", value=True, confidence=0.5)},
        latency_ms=0.1,
    )
    spec = DecisionSpec(name="stop", kind="noul", default=False)
    applied = apply_confidence_policy(result, spec, "llm_value", policy)
    assert applied.action == "kept_low_confidence"
    assert applied.chosen == "llm_value"
    assert applied.needs_human is False


def test_env_off_stops_decisions() -> None:
    os.environ["DECISION_PROVIDER"] = "off"
    assert get_decision_model() is None
    assert run_decision("t", {}, []) is None
    os.environ.pop("DECISION_PROVIDER", None)


def test_env_mock_runs() -> None:
    os.environ["DECISION_PROVIDER"] = "mock"
    result = run_decision("t", {}, [
        DecisionSpec(name="x", kind="choice", default="approve",
                      options=[{"value": "approve"}, {"value": "reject"}]),
    ])
    assert result is not None
    assert result.provider == "mock"
    assert result.answers["x"].value == "approve"
    os.environ.pop("DECISION_PROVIDER", None)
