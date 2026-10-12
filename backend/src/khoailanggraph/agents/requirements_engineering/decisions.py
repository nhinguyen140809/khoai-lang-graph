"""Bounded AI decisions for workflow gate points — "prod, not god".

The LangGraph workflow owns the control flow; this module calls a cheap,
calibrated decision model (Jev via typesafe_sdk, an LLM, or a mock) at the
three gate points the source proto names: should the interview stop, does
the spec have the right type/priority, and did validation pass.  When the
model's confidence is high the decision is applied automatically; between
the two thresholds the LLM's own value is kept; below the low threshold
the run pushes a human review instead.

The module never changes the graph's topology: the three gate nodes keep
their edges, only the value they write into the state can come from the
decision layer instead of a static default (decisions.py of the source,
ported to khoai-lang-graph).
"""

from __future__ import annotations

import os
import time
from typing import Any, Literal, Protocol, runtime_checkable

from pydantic import BaseModel

DecisionKind = Literal["noul", "choice"]

# The three gate points (source: app/services/decisions.py DECISION_POINTS).
DECISION_POINTS: dict[str, list[str]] = {
    "interviewer": ["interview_turn_policy"],
    "requirement_engineer": ["spec_type_priority_review"],
    "validator": ["validation_status_review"],
}

_DEFAULT_AUTO_CONFIDENCE = 0.7
_DEFAULT_REVIEW_CONFIDENCE = 0.4


class DecisionSpec(BaseModel):
    """One question the decision layer answers."""

    name: str
    kind: DecisionKind
    criteria: str | None = None
    options: list[dict[str, Any]] | None = None
    default: Any = None


class DecisionAnswer(BaseModel):
    """The decision model's answer for one spec."""

    name: str
    value: Any = None
    probability: float | None = None
    confidence: float | None = None


class DecisionResult(BaseModel):
    """A batch of answers from one decision-model call."""

    decision_id: str
    provider: str
    calibrated: bool
    answers: dict[str, DecisionAnswer]
    latency_ms: float
    fallback_used: bool = False
    error: str | None = None

    def answer(self, name: str) -> DecisionAnswer:
        return self.answers[name]

    def value(self, name: str) -> Any:
        return self.answers[name].value if name in self.answers else None


class ConfidencePolicy(BaseModel):
    auto: float = _DEFAULT_AUTO_CONFIDENCE
    review: float = _DEFAULT_REVIEW_CONFIDENCE


class DecisionProviderError(Exception):
    """The decision provider could not produce a decision."""


class AppliedDecision(BaseModel):
    """What happened to one spec after the confidence policy ran."""

    name: str
    chosen: Any
    action: Literal[
        "auto", "kept_low_confidence", "needs_review", "applied_unrated"
    ]
    needs_human: bool = False


@runtime_checkable
class DecisionModel(Protocol):
    provider_name: str
    calibrated: bool

    def decide(
        self, decision_id: str, context: dict[str, Any], specs: list[DecisionSpec]
    ) -> DecisionResult: ...


def _now_ms() -> float:
    return time.perf_counter() * 1000.0


def _as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Provider: mock — always confident, returns the default
# ---------------------------------------------------------------------------

class MockDecisionModel:
    provider_name = "mock"
    calibrated = True

    def decide(
        self, decision_id: str, context: dict[str, Any], specs: list[DecisionSpec]
    ) -> DecisionResult:
        start = _now_ms()
        answers: dict[str, DecisionAnswer] = {}
        for spec in specs:
            if spec.kind == "noul":
                truthy = bool(spec.default)
                answers[spec.name] = DecisionAnswer(
                    name=spec.name,
                    value=truthy,
                    probability=0.9 if truthy else 0.1,
                    confidence=0.9,
                )
            else:
                answers[spec.name] = DecisionAnswer(
                    name=spec.name,
                    value=spec.default,
                    probability=None,
                    confidence=0.9,
                )
        return DecisionResult(
            decision_id=decision_id,
            provider=self.provider_name,
            calibrated=True,
            answers=answers,
            latency_ms=_now_ms() - start,
        )


_DEFAULT_NOUL_SPLIT = 0.5

# ---------------------------------------------------------------------------
# Provider: Jev — bounded, calibrated judgments via typesafe_sdk
# ---------------------------------------------------------------------------

class JevDecisionModel:
    provider_name = "jev"
    calibrated = True

    def decide(
        self, decision_id: str, context: dict[str, Any], specs: list[DecisionSpec]
    ) -> DecisionResult:
        start = _now_ms()
        try:
            from typesafe_sdk import TypeSafeClient  # type: ignore[import-not-found]  # noqa: PLC0415
        except ImportError as exc:
            raise DecisionProviderError(f"typesafe_sdk not installed: {exc}") from exc

        questions: dict[str, Any] = {}
        for spec in specs:
            if spec.kind == "noul":
                questions[spec.name] = {
                    "type": "noul",
                    "criteria": spec.criteria or spec.name,
                }
            else:
                questions[spec.name] = {
                    "type": "choice",
                    "options": spec.options or [],
                }

        try:
            with TypeSafeClient() as client:
                response = client.system_one(
                    state=context, questions=questions
                )
            raw_answers = getattr(response, "answers", None) or {}
        except Exception as exc:
            raise DecisionProviderError(f"jev system_one call failed: {exc}") from exc

        answers: dict[str, DecisionAnswer] = {}
        for spec in specs:
            raw = raw_answers.get(spec.name)
            if raw is None:
                raise DecisionProviderError(
                    f"jev returned no answer for '{spec.name}'"
                )
            if spec.kind == "noul":
                probability = _as_float(
                    getattr(raw, "noul", None)
                    if not isinstance(raw, dict)
                    else raw.get("noul")
                )
                if probability is None:
                    raise DecisionProviderError(
                        f"jev noul answer missing for '{spec.name}'"
                    )
                answers[spec.name] = DecisionAnswer(
                    name=spec.name,
                    value=probability >= _DEFAULT_NOUL_SPLIT,
                    probability=probability,
                    confidence=max(probability, 1.0 - probability),
                )
            else:
                choice = (
                    getattr(raw, "choice", None)
                    if not isinstance(raw, dict)
                    else raw.get("choice")
                )
                confidence = _as_float(
                    getattr(raw, "confidence", None)
                    if not isinstance(raw, dict)
                    else raw.get("confidence")
                )
                if choice is None:
                    raise DecisionProviderError(
                        f"jev choice answer missing for '{spec.name}'"
                    )
                answers[spec.name] = DecisionAnswer(
                    name=spec.name,
                    value=choice,
                    probability=None,
                    confidence=confidence,
                )
        return DecisionResult(
            decision_id=decision_id,
            provider=self.provider_name,
            calibrated=True,
            answers=answers,
            latency_ms=_now_ms() - start,
        )


# ---------------------------------------------------------------------------
# Config, cache, and the confidence policy
# ---------------------------------------------------------------------------

_decision_cache: dict[str, DecisionModel] = {}


def reset_decision_cache() -> None:
    _decision_cache.clear()


def _provider_from_environment() -> str:
    return (os.environ.get("DECISION_PROVIDER") or "off").strip().lower()


def _fallback_from_environment() -> str:
    return (os.environ.get("DECISION_FALLBACK") or "mock").strip().lower()


def policy_from_environment() -> ConfidencePolicy:
    auto = _as_float(os.environ.get("DECISION_AUTO_CONFIDENCE"))
    review = _as_float(os.environ.get("DECISION_REVIEW_CONFIDENCE"))
    return ConfidencePolicy(
        auto=auto if auto is not None else _DEFAULT_AUTO_CONFIDENCE,
        review=review if review is not None else _DEFAULT_REVIEW_CONFIDENCE,
    )


def get_decision_model() -> DecisionModel | None:
    """The decision model the DECISION_PROVIDER env names; None when off."""
    provider = _provider_from_environment()
    if provider in {"", "off", "none"}:
        return None
    if provider == "mock":
        return MockDecisionModel()
    if provider == "jev":
        return JevDecisionModel()
    return None


def run_decision(
    decision_id: str,
    context: dict[str, Any],
    specs: list[DecisionSpec],
) -> DecisionResult | None:
    """Call the provider; on error, fall back (mock by default)."""
    model = get_decision_model()
    if model is None:
        return None
    try:
        return model.decide(decision_id, context, specs)
    except DecisionProviderError:
        fallback_name = _fallback_from_environment()
        if fallback_name == "mock":
            fallback_model: DecisionModel = MockDecisionModel()
        else:
            return None
        result = fallback_model.decide(decision_id, context, specs)
        result.fallback_used = True
        return result


def apply_confidence_policy(
    result: DecisionResult,
    spec: DecisionSpec,
    current_value: Any,
    policy: ConfidencePolicy,
) -> AppliedDecision:
    """The graded application of one answer: auto, keep, or human review."""
    answer = result.answers.get(spec.name)
    if answer is None or answer.value is None:
        return AppliedDecision(
            name=spec.name, chosen=current_value, action="kept_low_confidence"
        )
    if not result.calibrated or answer.confidence is None:
        return AppliedDecision(
            name=spec.name, chosen=answer.value, action="applied_unrated"
        )
    if answer.confidence >= policy.auto:
        return AppliedDecision(name=spec.name, chosen=answer.value, action="auto")
    if answer.confidence >= policy.review:
        return AppliedDecision(
            name=spec.name, chosen=current_value, action="kept_low_confidence"
        )
    return AppliedDecision(
        name=spec.name,
        chosen=current_value,
        action="needs_review",
        needs_human=True,
    )


def new_decision_id(prefix: str) -> str:
    return f"{prefix}-{time.time_ns()}"


__all__ = [
    "DECISION_POINTS",
    "AppliedDecision",
    "ConfidencePolicy",
    "DecisionAnswer",
    "DecisionKind",
    "DecisionModel",
    "DecisionProviderError",
    "DecisionResult",
    "DecisionSpec",
    "JevDecisionModel",
    "MockDecisionModel",
    "apply_confidence_policy",
    "new_decision_id",
    "policy_from_environment",
    "reset_decision_cache",
    "run_decision",
]
