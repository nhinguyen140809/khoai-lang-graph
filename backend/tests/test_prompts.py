"""The prompts of the roles: their sections, and the common settings that come before them."""

from __future__ import annotations

import pytest

from khoailanggraph.agents import prompts as prompt_loader
from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering.nodes import PROMPTS_PACKAGE

ROLES = sorted(wf.agent_roles())


def _system_of(role: str) -> str:
    entry = wf.agent_roles()[role]
    prompt = prompt_loader.load_cached(PROMPTS_PACKAGE, role, int(entry["prompt_version"]))
    values = {item.name: "X" for item in prompt.inputs}
    values["output_language"] = "Vietnamese"
    return prompt_loader.assemble_prompt(prompt, values)[0][1]


@pytest.mark.parametrize("role", ROLES)
def test_every_role_starts_with_the_common_settings_and_then_its_own_sections(role: str) -> None:
    system = _system_of(role)

    assert system.startswith("# Common settings")
    assert system.count("# Common settings") == 1
    assert system.index("# Common settings") < system.index(prompt_loader.COMMON_HEADING)
    assert system.index(prompt_loader.COMMON_HEADING) < system.index("\n## Role\n")
    assert "{{" not in system


@pytest.mark.parametrize("role", ROLES)
def test_every_role_has_skills_between_its_goal_and_its_inputs(role: str) -> None:
    system = _system_of(role)

    goal, skills, inputs = (
        system.index(f"\n## {title}\n") for title in ("Goal", "Skills", "Inputs")
    )
    assert goal < skills < inputs
    assert system[skills:inputs].count("\n- ") >= 3


def test_the_language_of_the_user_is_the_one_of_the_run() -> None:
    assert "Write in Vietnamese, in the words" in _system_of("planner")


def test_the_common_settings_are_the_same_text_for_every_role() -> None:
    commons = {_system_of(role).split(prompt_loader.COMMON_HEADING)[0] for role in ROLES}

    assert len(commons) == 1


def test_the_common_settings_cover_the_writing_rules_and_how_to_ask() -> None:
    common = _system_of("planner").split(prompt_loader.COMMON_HEADING)[0]

    for heading in ("Writing for people", "Asking the user", "How you work"):
        assert f"## {heading}" in common
    assert "Lead with the outcome" in common
    assert "complete sentences" in common


@pytest.mark.parametrize("role", ["persona_generator", "analyst", "requirement_engineer"])
def test_a_role_that_is_followed_by_a_review_has_the_skill_of_preparing_it(role: str) -> None:
    system = _system_of(role)

    assert "Preparing the review" in system
    assert "- `review`:" in system


def test_the_skills_come_after_the_goal_and_before_the_inputs_or_the_prompt_is_refused() -> None:
    titles = ["Role", "Goal", "Inputs", "Skills", "Procedure", "Rules"]
    wrong = "".join(f"\n## {title}\n\nx\n" for title in titles)

    with pytest.raises(ValueError, match="must appear in the order"):
        prompt_loader._validate_system_sections("planner", 2, wrong)
