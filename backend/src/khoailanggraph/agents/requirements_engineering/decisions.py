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

import json
import os
import time
from typing import Any, Literal, Protocol, runtime_checkable

from pydantic import BaseModel

from khoailanggraph.llm import factory as llm_factory
from khoailanggraph.llm.registry import default_registry
from khoailanggraph.settings import get_settings

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
    action: Literal["auto", "kept_low_confidence", "needs_review", "applied_unrated"]
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
# Provider: llm — the OpenAI-compatible gateway as the decision model
# ---------------------------------------------------------------------------

_STATE_RENDER_LIMIT = 4000


def _render_state_for_llm(context: dict[str, Any]) -> str:
    """The decision context as bounded JSON for the llm provider."""
    try:
        rendered = json.dumps(context, ensure_ascii=False, default=str)
    except (TypeError, ValueError):
        return str(context)[:_STATE_RENDER_LIMIT]
    return rendered[:_STATE_RENDER_LIMIT]


def _decision_model_id() -> str:
    """The model the llm provider decides with: the DECISION_MODEL env var,
    the Settings field (backend/.env), else the registry default of
    config/models.yaml."""
    env = os.environ.get("DECISION_MODEL")
    if env:
        return env.strip()
    settings_model = get_settings().decision_model
    if settings_model:
        return str(settings_model).strip()
    return default_registry().default_model


class LLMDecisionModel:
    """The gateway LLM answering the bounded questions (DECISION_PROVIDER=llm).

    Uncalibrated by design: the answers carry no confidence, so the policy
    applies them as-is ("applied_unrated") — the questions themselves are
    the bound (declared options, no free prose).
    """

    provider_name = "llm"
    calibrated = False

    def decide(
        self, decision_id: str, context: dict[str, Any], specs: list[DecisionSpec]
    ) -> DecisionResult:
        start = _now_ms()
        from pydantic import create_model  # noqa: PLC0415 - a schema per batch

        fields: dict[str, Any] = {}
        for spec in specs:
            if spec.kind == "noul":
                fields[spec.name] = (bool, spec.default if spec.default is not None else False)
            else:
                option_values = [str(option.get("value")) for option in spec.options or []]
                if not option_values:
                    option_values = [str(spec.default)]
                fields[spec.name] = (
                    Literal[tuple(option_values)],
                    str(spec.default) if spec.default is not None else option_values[0],
                )
        prompt_schema = create_model(f"Decision_{decision_id.replace('-', '_')}", **fields)

        lines = [
            "You are a bounded decision model. Answer every question by picking "
            "one of the declared values. Do not explain. Do not invent values.",
        ]
        for spec in specs:
            if spec.kind == "noul":
                lines.append(f"- `{spec.name}`: true if — {spec.criteria or spec.name}")
            else:
                rendered = ", ".join(
                    f"{option.get('value')}: {option.get('what', '')}"
                    for option in spec.options or []
                )
                lines.append(f"- `{spec.name}`: choose one of [{rendered}]")
        lines.append("INPUT STATE (JSON):\n" + _render_state_for_llm(context))

        model = llm_factory.build_chat_model(_decision_model_id())
        outcome = model.with_structured_output(prompt_schema).invoke(
            [("system", lines[0]), ("human", "\n".join(lines[1:]))]
        )
        answers: dict[str, DecisionAnswer] = {}
        for spec in specs:
            value = getattr(outcome, spec.name, None)
            answers[spec.name] = DecisionAnswer(name=spec.name, value=value)
        return DecisionResult(
            decision_id=decision_id,
            provider=self.provider_name,
            calibrated=False,
            answers=answers,
            latency_ms=_now_ms() - start,
        )


# ---------------------------------------------------------------------------
# Provider: Jev — bounded, calibrated judgments via typesafe_sdk
# ---------------------------------------------------------------------------


def _jev_answer(spec: DecisionSpec, raw: Any) -> DecisionAnswer:
    """One parsed jev answer: a noul probability or a choice + confidence."""
    if spec.kind == "noul":
        probability = _as_float(
            getattr(raw, "noul", None) if not isinstance(raw, dict) else raw.get("noul")
        )
        if probability is None:
            raise DecisionProviderError(f"jev noul answer missing for '{spec.name}'")
        return DecisionAnswer(
            name=spec.name,
            value=probability >= _DEFAULT_NOUL_SPLIT,
            probability=probability,
            confidence=max(probability, 1.0 - probability),
        )
    choice = getattr(raw, "choice", None) if not isinstance(raw, dict) else raw.get("choice")
    confidence = _as_float(
        getattr(raw, "confidence", None) if not isinstance(raw, dict) else raw.get("confidence")
    )
    if choice is None:
        raise DecisionProviderError(f"jev choice answer missing for '{spec.name}'")
    return DecisionAnswer(name=spec.name, value=choice, probability=None, confidence=confidence)


class JevDecisionModel:
    provider_name = "jev"
    calibrated = True

    def decide(
        self, decision_id: str, context: dict[str, Any], specs: list[DecisionSpec]
    ) -> DecisionResult:
        start = _now_ms()
        try:
            from typesafe_sdk import TypeSafeClient  # noqa: PLC0415 - optional jev group
        except ImportError as exc:
            raise DecisionProviderError(f"typesafe_sdk not installed: {exc}") from exc

        # typesafe-sdk 0.7.5 question shapes: a noul describes its yes/no
        # outcomes as a criteria OBJECT; a choice maps every label to its
        # description (no options list — the proto was written for an older
        # SDK and the request died on normalize_questions validation).
        questions: dict[str, Any] = {}
        for spec in specs:
            if spec.kind == "noul":
                questions[spec.name] = {
                    "type": "noul",
                    "criteria": {"true": spec.criteria or spec.name},
                }
            else:
                questions[spec.name] = {
                    "type": "choice",
                    "criteria": {
                        str(option.get("value")): str(option.get("what", ""))
                        for option in spec.options or []
                    },
                }

        # The key reaches the SDK either way — real env var first (tests),
        # backend/.env through Settings second (the committed-free path).
        api_key = os.environ.get("TYPESAFE_API_KEY") or get_settings().typesafe_api_key
        base_url = os.environ.get("TYPESAFE_BASE_URL") or get_settings().typesafe_base_url
        credentials: dict[str, Any] = {}
        if api_key:
            credentials["api_key"] = api_key
        if base_url:
            credentials["base_url"] = base_url

        try:
            with TypeSafeClient(**credentials) as client:
                response = client.system_one(state=context, questions=questions)
            raw_answers = getattr(response, "answers", None) or {}
        except Exception as exc:
            raise DecisionProviderError(f"jev system_one call failed: {exc}") from exc

        answers: dict[str, DecisionAnswer] = {}
        for spec in specs:
            raw = raw_answers.get(spec.name)
            if raw is None:
                raise DecisionProviderError(f"jev returned no answer for '{spec.name}'")
            answers[spec.name] = _jev_answer(spec, raw)
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
    # The real env var wins over the .env file so per-call toggles (tests)
    # bypass the settings cache; .env flows through Settings like every
    # other knob of the backend.
    env = os.environ.get("DECISION_PROVIDER")
    if env is not None:
        return env.strip().lower()
    return str(get_settings().decision_provider or "off").strip().lower()


def _fallback_from_environment() -> str:
    env = os.environ.get("DECISION_FALLBACK")
    if env is not None:
        return env.strip().lower()
    return str(get_settings().decision_fallback or "mock").strip().lower()


def policy_from_environment() -> ConfidencePolicy:
    auto = _as_float(os.environ.get("DECISION_AUTO_CONFIDENCE"))
    if auto is None:
        auto = get_settings().decision_auto_confidence
    review = _as_float(os.environ.get("DECISION_REVIEW_CONFIDENCE"))
    if review is None:
        review = get_settings().decision_review_confidence
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
    if provider == "llm":
        return LLMDecisionModel()
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
        return AppliedDecision(name=spec.name, chosen=current_value, action="kept_low_confidence")
    if not result.calibrated or answer.confidence is None:
        return AppliedDecision(name=spec.name, chosen=answer.value, action="applied_unrated")
    if answer.confidence >= policy.auto:
        return AppliedDecision(name=spec.name, chosen=answer.value, action="auto")
    if answer.confidence >= policy.review:
        return AppliedDecision(name=spec.name, chosen=current_value, action="kept_low_confidence")
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
    "LLMDecisionModel",
    "MockDecisionModel",
    "apply_confidence_policy",
    "new_decision_id",
    "policy_from_environment",
    "reset_decision_cache",
    "run_decision",
]
