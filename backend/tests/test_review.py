"""What the user is asked at a checkpoint, made from what the node before it wrote."""

from __future__ import annotations

from typing import Any

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering.review import (
    checkpoint_review,
    describe_answers,
)

SPEC = wf.nodes()["checkpoint_analysis"]


def _question(**fields: Any) -> dict[str, Any]:
    return {
        "key": "winner",
        "kind": "single_select",
        "prompt": "Whose wish wins on who approves a session?",
        "choices": [
            {"key": "students", "label": "The students: book in minutes"},
            {"key": "librarian", "label": "The librarian: approve every one"},
        ],
        "default_choice_keys": ["students"],
        **fields,
    }


def test_without_a_brief_the_words_of_the_definition_stand() -> None:
    asked = checkpoint_review(SPEC, None)

    assert asked["prompt"] == SPEC["prompt"]
    assert asked["options"] == SPEC["options"]
    assert asked["questions"] == []


def test_the_prompt_fits_the_case_and_an_option_may_suggest_what_to_say() -> None:
    brief = {
        "prompt": "I found two conflicts that still need your say.",
        "options": [
            {
                "key": "reject_reanalyse",
                "label": "Settle the conflicts",
                "suggested_feedback": "Settle both conflicts in favour of the students.",
            },
            {"key": "accept", "suggested_feedback": "not for an option without feedback"},
            {"key": "unknown_key", "label": "ignored"},
        ],
    }

    asked = checkpoint_review(SPEC, brief)

    assert asked["prompt"] == "I found two conflicts that still need your say."
    by_key = {option["key"]: option for option in asked["options"]}
    assert by_key["reject_reanalyse"]["label"] == "Settle the conflicts"
    assert by_key["reject_reanalyse"]["suggested_feedback"].startswith("Settle both")
    assert by_key["reject_reanalyse"]["requires_feedback"] is True
    assert "suggested_feedback" not in by_key["accept"]
    assert by_key["accept"]["label"] == "Approve analysis"
    assert len(asked["options"]) == len(SPEC["options"])


def test_a_question_of_the_agent_has_its_default_and_a_way_to_say_something_else() -> None:
    asked = checkpoint_review(SPEC, {"prompt": "x", "questions": [_question()]})

    (question,) = asked["questions"]
    assert question["source"] == "agent"
    assert question["type"] == "single_select"
    assert question["required"] is False, "left alone, the default stands"
    assert question["default_answer"] == {"choice_keys": ["students"], "text": None, "number": None}
    assert [choice["key"] for choice in question["choices"]] == ["students", "librarian", "other"]
    assert question["choices"][-1]["requires_text"] is True


def test_a_multiple_choice_defaults_to_the_first_choice_when_the_default_is_not_one() -> None:
    brief = {"questions": [_question(kind="multi_select", default_choice_keys=["nope"])]}

    (question,) = checkpoint_review(SPEC, brief)["questions"]

    assert question["type"] == "multi_select"
    assert question["min_selected"] == 1
    assert question["default_answer"]["choice_keys"] == ["students"]


def test_a_free_text_question_is_optional() -> None:
    brief = {"questions": [_question(kind="free_text", choices=[])]}

    (question,) = checkpoint_review(SPEC, brief)["questions"]

    assert question["type"] == "free_text"
    assert question["required"] is False
    assert question["default_answer"] is None


def test_a_question_that_breaks_a_rule_is_dropped_and_at_most_three_are_kept() -> None:
    questions = [
        _question(key="Bad Key"),
        _question(key="one_choice", choices=[{"key": "a", "label": "A"}]),
        _question(key="no_prompt", prompt="  "),
        _question(key="odd_kind", kind="number"),
        _question(key="winner"),
        _question(key="winner"),
        _question(key="third"),
        _question(key="fourth"),
        _question(key="fifth"),
    ]

    asked = checkpoint_review(SPEC, {"questions": questions})

    assert [question["key"] for question in asked["questions"]] == ["winner", "third", "fourth"]


def test_a_checkpoint_that_does_not_allow_questions_asks_none() -> None:
    spec = {**SPEC, "agent_questions": False}

    assert checkpoint_review(spec, {"questions": [_question()]})["questions"] == []


def test_the_answers_become_lines_for_the_agents_that_go_on() -> None:
    (question,) = checkpoint_review(SPEC, {"questions": [_question()]})["questions"]

    chosen = describe_answers([question], {"winner": {"choice_keys": ["librarian"]}})
    explained = describe_answers(
        [question], {"winner": {"choice_keys": ["other"], "text": "Both, by turns"}}
    )
    accepted = describe_answers([question], {})

    assert "The librarian: approve every one" in chosen
    assert "Both, by turns" in explained
    assert "The students: book in minutes" in accepted, "a question left alone is its default"
    assert chosen.startswith("What the user decided at the review:")


def test_questions_of_the_definition_are_not_repeated_in_the_decisions() -> None:
    question = {"key": "q", "source": "definition", "prompt": "P", "choices": []}

    assert describe_answers([question], {"q": {"text": "x"}}) == ""
