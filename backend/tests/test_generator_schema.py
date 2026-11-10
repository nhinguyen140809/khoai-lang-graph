"""The persona generator is asked for observation keys that exist, and only those."""

from __future__ import annotations

import json

import pytest
from pydantic import ValidationError

from khoailanggraph.agents.requirements_engineering.outputs import (
    GeneratorOutputV2,
    generator_output_for,
)

KEYS = ["OBS-001", "OBS-002"]


def _answer(key: str) -> dict[str, object]:
    evidence = {"observation": key, "source": "SRC-001", "quote": "A quote."}
    return {
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
                "evaluative_dimension": "speed",
                "grounded_in": [key],
                "background": "b",
                "expertise": "e",
                "goals": [],
                "interests": [],
                "constraints": [],
                "priorities": [],
                "concerns": [],
                "behavioral_tendencies": "t",
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
