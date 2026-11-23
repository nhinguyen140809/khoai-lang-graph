"""A type of stakeholder in the plan is a short name, not a sentence."""

from __future__ import annotations

from typing import Any

import pytest
from pydantic import ValidationError

from khoailanggraph.domain.artifacts.elicitation_plan import ElicitationPlanContent


def _plan(stakeholder_types: list[str]) -> dict[str, Any]:
    return {
        "objectives": ["Understand how students book a room"],
        "topics": ["Booking"],
        "information_gaps": ["How a room is assigned"],
        "stakeholder_types": stakeholder_types,
        "strategies": ["Ask for the last time"],
        "stopping_conditions": ["Every topic is covered"],
    }


@pytest.mark.parametrize("name", ["Student", "Library staff", "Night shift hospital nurse"])
def test_a_short_name_is_a_stakeholder_type(name: str) -> None:
    plan = ElicitationPlanContent.model_validate(_plan([name]))

    assert plan.stakeholder_types == [name]


@pytest.mark.parametrize(
    "name",
    [
        "Students who book rooms on a phone between lectures",
        "One two three four five",
        "A" * 41,
        "",
    ],
)
def test_a_long_name_is_not_a_stakeholder_type(name: str) -> None:
    with pytest.raises(ValidationError):
        ElicitationPlanContent.model_validate(_plan([name]))
