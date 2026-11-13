"""What the user is asked at a checkpoint, made from what the node before it wrote."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering import nodes
from khoailanggraph.agents.requirements_engineering.outputs import (
    AnalystOutput,
    EngineerOutput,
    GeneratorOutputV2,
)
from khoailanggraph.agents.requirements_engineering.review import (
    checkpoint_review,
    describe_answers,
)

if TYPE_CHECKING:
    from pydantic import BaseModel

# The questions of the agent come with an `ask` checkpoint; its spec is the review one with them on.
SPEC = {**wf.nodes()["checkpoint_analysis"], "agent_questions": True}


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
            {
                "key": "accept",
                "description": "The analysis goes on to the specification.",
                "suggested_feedback": "not for an option without feedback",
            },
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
    assert by_key["accept"]["description"] == "The analysis goes on to the specification."
    assert "description" not in by_key["reject_reanalyse"], "left out, nothing is added"
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


def test_the_suggestions_of_a_review_can_only_name_the_options_of_its_checkpoint() -> None:
    outputs: list[tuple[type[BaseModel], str]] = [
        (GeneratorOutputV2, "checkpoint_personas"),
        (AnalystOutput, "checkpoint_analysis"),
        (EngineerOutput, "checkpoint_spec"),
    ]
    for model, checkpoint in outputs:
        option = model.model_json_schema()["$defs"][f"ReviewOptionOf_{checkpoint}"]

        assert option["properties"]["key"]["enum"] == [
            entry["key"] for entry in wf.nodes()[checkpoint]["options"]
        ]


def test_something_else_has_words_of_its_own_and_never_a_suggested_text() -> None:
    brief = {
        "options": [
            {
                "key": "other",
                "label": "Tell me what to change",
                "description": "Say it in your own words; the right step does it again.",
                "suggested_feedback": "never suggested",
            }
        ]
    }

    asked = checkpoint_review(SPEC, brief)

    other = next(option for option in asked["options"] if option["key"] == "other")
    assert other["label"] == "Tell me what to change"
    assert other["description"].startswith("Say it in your own words")
    assert "suggested_feedback" not in other
    assert other["requires_feedback"] is True


def test_the_questions_before_the_research_are_choices_with_the_assumption_of_the_planner() -> None:
    ask = wf.nodes()["checkpoint_plan"]
    # The brief as the planner leaves it: what it asks the user before the research begins.
    brief = {
        "questions": [
            {
                "key": "login",
                "kind": "single_select",
                "prompt": "How do students sign in?",
                "choices": [
                    {"key": "campus", "label": "With their campus account"},
                    {"key": "own", "label": "With an account of this app"},
                ],
                "default_choice_keys": ["campus"],
            },
            {"key": "notes", "kind": "free_text", "prompt": "Anything else to know?"},
        ]
    }
    state = {"review_briefs": {"checkpoint_plan": brief}}

    questions = nodes._questions_to_ask(ask, state)  # type: ignore[arg-type]

    login = questions[0]
    assert login["type"] == "single_select"
    assert login["default_answer"]["choice_keys"] == ["campus"]
    assert [choice["key"] for choice in login["choices"]] == ["campus", "own", "other"]
    assert login["choices"][-1]["requires_text"] is True
    assert questions[1]["type"] == "free_text"


def test_an_ask_without_a_brief_has_no_question() -> None:
    assert nodes._questions_to_ask(wf.nodes()["ask_personas"], {}) == []  # type: ignore[typeddict-item]
