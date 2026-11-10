"""The rules an answer to an interrupt must hold before the run continues from it.

Each function returns the problems it finds as `{field, message}` entries with the path of the
field in the resume body, so that the route can answer `422 validation_failed` at that field.
"""

from __future__ import annotations

from typing import Any

Problem = dict[str, str]


def option_problems(
    options: list[dict[str, Any]], option: str | None, feedback: str | None
) -> list[Problem]:
    """The option is one of the interrupt (or absent when it has none), and feedback is given
    when the option requires it."""
    if not options:
        return (
            []
            if option is None
            else [{"field": "option", "message": "This review has no options."}]
        )
    keys = [str(entry["key"]) for entry in options]
    if option is None or option not in keys:
        return [{"field": "option", "message": f"Choose one of: {', '.join(sorted(keys))}."}]
    chosen = next(entry for entry in options if entry["key"] == option)
    if chosen.get("requires_feedback") and not (feedback or "").strip():
        return [{"field": "feedback", "message": "Enter feedback for this option."}]
    return []


def _answer_problems(question: dict[str, Any], answer: dict[str, Any]) -> list[str]:
    kind = question["type"]
    keys = list(answer.get("choice_keys") or [])
    text = (answer.get("text") or "").strip()
    number = answer.get("number")
    choices = {str(choice["key"]): choice for choice in question.get("choices", [])}
    problems: list[str] = []
    if kind in {"single_select", "multi_select"}:
        problems += [
            f"{key} is not a choice of this question." for key in keys if key not in choices
        ]
        if kind == "single_select" and len(keys) != 1:
            problems.append("Pick exactly one choice.")
        low, high = question.get("min_selected"), question.get("max_selected")
        if kind == "multi_select" and low is not None and len(keys) < low:
            problems.append(f"Pick at least {low}.")
        if kind == "multi_select" and high is not None and len(keys) > high:
            problems.append(f"Pick at most {high}.")
        if any(choices.get(key, {}).get("requires_text") for key in keys) and not text:
            problems.append("Explain the choice you picked.")
    elif kind == "free_text" and not text:
        problems.append("Enter a text.")
    elif kind == "number" and number is None:
        problems.append("Enter a number.")
    return problems


def answer_problems(questions: list[dict[str, Any]], answers: dict[str, Any]) -> list[Problem]:
    """Every question that is required is answered, an answer that is given follows the rules of
    its question, and no answer is for a question the review does not ask."""
    by_key = {str(question["key"]): question for question in questions}
    problems: list[Problem] = [
        {"field": f"answers.{key}", "message": "This review does not ask this question."}
        for key in answers
        if key not in by_key
    ]
    for key, question in by_key.items():
        field = f"answers.{key}"
        answer: dict[str, Any] = answers.get(key) or {}
        empty = not (
            answer.get("choice_keys")
            or (answer.get("text") or "").strip()
            or answer.get("number") is not None
        )
        if empty:
            if question.get("required"):
                problems.append({"field": field, "message": "Answer this question."})
            continue
        problems += [
            {"field": field, "message": message} for message in _answer_problems(question, answer)
        ]
    return problems
