"""The JSON examples in the prompts teach the model what to write, so each one must be valid for
the output model it teaches."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import pytest

from khoailanggraph.agents.requirements_engineering import outputs

PROMPTS = Path(outputs.__file__).parent / "prompts"
FENCE = re.compile(r"```json\n(.*?)```", re.DOTALL)


def _examples(name: str) -> list[Any]:
    """The JSON blocks of the Examples section of a prompt."""
    text = (PROMPTS / name).read_text()
    section = text.split("\n## Examples", 1)[1].split("\n# User", 1)[0]
    return [json.loads(block) for block in FENCE.findall(section)]


@pytest.mark.parametrize(
    ("name", "model"),
    [
        ("persona_generator.v3.md", outputs.PersonasReview),
        ("analyst.v2.md", outputs.AnalysisReview),
        ("requirement_engineer.v2.md", outputs.SpecificationReview),
    ],
)
def test_the_review_example_holds_the_rules_of_its_checkpoint(name: str, model: Any) -> None:
    reviews = [example["review"] for example in _examples(name) if "review" in example]

    assert reviews, f"{name} has no review example"
    for review in reviews:
        model.model_validate(review)


def test_the_interviewer_examples_are_valid_turns() -> None:
    turns = _examples("interviewer.v2.md")

    assert len(turns) == 2
    for turn in turns:
        outputs.InterviewerTurnOutput.model_validate(turn)


def test_the_validator_example_has_valid_checks_and_issues() -> None:
    (example,) = _examples("validator.v2.md")

    for check in example["checks"]:
        outputs.ValidationCheckDraft.model_validate(check)
    for issue in example["issues"]:
        outputs.ValidationIssueDraft.model_validate(issue)
