"""The persona generator is asked for observation keys that exist, and only those."""

from __future__ import annotations

import json
from typing import Any, cast

import pytest
from pydantic import ValidationError

from khoailanggraph.agents.requirements_engineering.outputs import (
    GeneratorOutputV2,
    generator_output_for,
)

KEYS = ["OBS-001", "OBS-002"]


def _answer(key: str, aspects: tuple[str, ...] = ()) -> dict[str, object]:
    evidence = {"observation": key, "source": "SRC-001", "quote": "A quote."}
    scores = [{"aspect": aspect, "score": 3, "rationale": "r"} for aspect in aspects]
    return {
        "notes": [{"kind": "doing", "text": "I am writing the interviewees."}],
        "report": "A report.",
        "selection_rationale": "why",
        "stakeholder_groups": [
            {"ref": "G1", "name": "Group", "description": "d", "observations": [key]}
        ],
        "uncovered_stakeholder_types": [],
        "personas": [
            {
                "ref": "P1",
                "name": "Minh",
                "stakeholder_type": "Student",
                "occupation": "Student",
                "age_range": "20-22",
                "evaluative_dimension": "speed",
                "grounded_in": [key],
                "background": "b",
                "typical_day": "d",
                "expertise": "e",
                "current_workarounds": [],
                "vocabulary": [],
                "goals": [],
                "interests": [],
                "constraints": [],
                "priorities": [],
                "concerns": [],
                "behavioral_tendencies": "t",
                "scores": scores,
                "evidence": [evidence],
            }
        ],
    }


def test_the_schema_lists_the_observation_keys_as_the_only_allowed_values() -> None:
    schema = json.dumps(generator_output_for(KEYS).model_json_schema())

    assert schema.count('"enum": ["OBS-001", "OBS-002"]') >= 3


def test_a_key_that_was_not_mined_is_refused_by_the_schema() -> None:
    constrained = generator_output_for(KEYS)

    assert constrained.model_validate(_answer("OBS-002"))
    with pytest.raises(ValidationError):
        constrained.model_validate(_answer("OBS-INT-1"))


def test_without_mined_observations_the_schema_stays_the_plain_one() -> None:
    assert generator_output_for([]) is GeneratorOutputV2


ASPECTS = ("domain_expertise", "pain_severity")


def test_the_schema_lists_the_aspect_keys_and_asks_for_a_score_on_each() -> None:
    schema = generator_output_for(KEYS, ASPECTS).model_json_schema()

    score = schema["$defs"]["PersonaScoreOutput"]["properties"]
    persona = schema["$defs"]["NewPersonaV2"]["properties"]["scores"]
    assert score["aspect"]["enum"] == list(ASPECTS)
    assert (persona["minItems"], persona["maxItems"]) == (2, 2)


def test_each_persona_needs_exactly_one_score_for_each_aspect() -> None:
    constrained = generator_output_for(KEYS, ASPECTS)

    assert constrained.model_validate(_answer("OBS-001", ASPECTS))
    for wrong in [("domain_expertise",), ("domain_expertise", "domain_expertise")]:
        with pytest.raises(ValidationError):
            constrained.model_validate(_answer("OBS-001", wrong))


def test_a_score_is_a_whole_number_from_one_to_five() -> None:
    constrained = generator_output_for(KEYS, ASPECTS)
    answer = _answer("OBS-001", ASPECTS)
    persona = cast("list[dict[str, Any]]", answer["personas"])[0]
    persona["scores"][0]["score"] = 6

    with pytest.raises(ValidationError):
        constrained.model_validate(answer)


def test_without_aspects_or_keys_the_plain_model_is_used() -> None:
    assert generator_output_for([], []) is GeneratorOutputV2
