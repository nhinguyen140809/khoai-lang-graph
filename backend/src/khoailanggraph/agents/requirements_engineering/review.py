"""What the user is asked at a checkpoint, made from the review that the node before it wrote.

The definition gives a checkpoint a fixed prompt, fixed options and, when `agent_questions` is set,
room for questions of the agent. The node before the checkpoint knows what it just found, so it
writes a `ReviewOutput`: a prompt that fits this case, suggested answers for the options that ask
for feedback, and a few questions with a default each. `checkpoint_review` turns it into the
payload of the interrupt, dropping whatever does not hold the rules of a question, and
`describe_answers` turns the answers back into words for the agents that continue the run.
"""

from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence

MAX_QUESTIONS = 3
MIN_CHOICES = 2
MAX_CHOICES = 4
PROMPT_LENGTH = 300
LABEL_LENGTH = 40
DESCRIPTION_LENGTH = 120
QUESTION_LENGTH = 140
CHOICE_LENGTH = 60
FEEDBACK_LENGTH = 300

_KEY = re.compile(r"^[a-z][a-z0-9_]{0,39}$")
OTHER_KEY = "other"
OTHER_LABEL = "Something else, please tell me"


def _text(value: object, limit: int) -> str:
    """A text of the model, trimmed and cut at `limit` characters."""
    return str(value or "").strip()[:limit].strip()


def checkpoint_review(spec: Mapping[str, Any], brief: Mapping[str, Any] | None) -> dict[str, Any]:
    """The prompt, the options and the questions of a checkpoint for this case.

    Without a brief, or for what the brief leaves out, the definition's own words stand. Questions
    of the agent come only when the checkpoint allows them (`agent_questions`)."""
    brief = brief or {}
    prompt = _text(brief.get("prompt"), PROMPT_LENGTH) or str(spec.get("prompt", ""))
    suggestions = {
        str(entry.get("key")): entry
        for entry in brief.get("options") or []
        if isinstance(entry, dict)
    }
    options: list[dict[str, Any]] = []
    for option in spec.get("options", []):
        merged = dict(option)
        suggestion = suggestions.get(str(option["key"]), {})
        label = _text(suggestion.get("label"), LABEL_LENGTH)
        if label:
            merged["label"] = label
        description = _text(suggestion.get("description"), DESCRIPTION_LENGTH)
        if description:
            merged["description"] = description
        feedback = _text(suggestion.get("suggested_feedback"), FEEDBACK_LENGTH)
        if feedback and option.get("requires_feedback"):
            merged["suggested_feedback"] = feedback
        options.append(merged)
    questions = [dict(question) for question in spec.get("questions", [])]
    if spec.get("agent_questions"):
        taken = {str(question["key"]) for question in questions}
        asked = 0
        for raw in brief.get("questions") or []:
            question = _agent_question(raw, taken)
            if question is None:
                continue
            taken.add(question["key"])
            questions.append(question)
            asked += 1
            if asked == MAX_QUESTIONS:
                break
    return {"prompt": prompt, "options": options, "questions": questions}


def _agent_question(raw: object, taken: set[str]) -> dict[str, Any] | None:
    """A question of the agent as the interrupt carries it, or None when it breaks a rule."""
    if not isinstance(raw, dict):
        return None
    key = str(raw.get("key") or "")
    prompt = _text(raw.get("prompt"), QUESTION_LENGTH)
    kind = raw.get("kind")
    if not _KEY.match(key) or key in taken or not prompt:
        return None
    if kind == "free_text":
        return {
            "key": key,
            "type": "free_text",
            "prompt": prompt,
            "required": False,
            "choices": [],
            "min_selected": None,
            "max_selected": None,
            "default_answer": None,
            "source": "agent",
        }
    if kind not in {"single_select", "multi_select"}:
        return None
    choices = _choices(raw.get("choices"))
    if len(choices) < MIN_CHOICES:
        return None
    keys = [choice["key"] for choice in choices]
    wanted = [str(key) for key in raw.get("default_choice_keys") or [] if str(key) in keys]
    default = wanted[:1] if kind == "single_select" else wanted
    if not default:
        default = keys[:1]
    # The user may always say something the choices do not.
    choices.append({"key": OTHER_KEY, "label": OTHER_LABEL, "requires_text": True})
    return {
        "key": key,
        "type": kind,
        "prompt": prompt,
        # Leaving it alone accepts the default, so the review can be approved without a word.
        "required": False,
        "choices": choices,
        "min_selected": 1 if kind == "multi_select" else None,
        "max_selected": None,
        "default_answer": {"choice_keys": default, "text": None, "number": None},
        "source": "agent",
    }


def _choices(raw: object) -> list[dict[str, Any]]:
    """The choices of a question that are valid, each key once, at most four."""
    choices: list[dict[str, Any]] = []
    seen: set[str] = {OTHER_KEY}
    for entry in raw if isinstance(raw, list) else []:
        if not isinstance(entry, dict):
            continue
        key = str(entry.get("key") or "")
        label = _text(entry.get("label"), CHOICE_LENGTH)
        if not _KEY.match(key) or key in seen or not label:
            continue
        seen.add(key)
        choices.append({"key": key, "label": label, "requires_text": False})
    return choices[:MAX_CHOICES]


def describe_answers(questions: Sequence[Mapping[str, Any]], answers: Mapping[str, Any]) -> str:
    """The answers to the questions of the agent as lines of words, for the agents that go on.

    A question that was not answered counts as answered with its default, which the user accepted
    by leaving it. Questions of the definition are left out: the option and the feedback carry
    them."""
    lines: list[str] = []
    for question in questions:
        if question.get("source") != "agent":
            continue
        answer = answers.get(str(question["key"])) or question.get("default_answer") or {}
        text = _answer_words(question, answer)
        if text:
            lines.append(f"- {question['prompt']} {text}")
    if not lines:
        return ""
    return "What the user decided at the review:\n" + "\n".join(lines)


def _answer_words(question: Mapping[str, Any], answer: Mapping[str, Any]) -> str:
    labels = {str(choice["key"]): str(choice["label"]) for choice in question.get("choices", [])}
    chosen = [labels.get(str(key), str(key)) for key in answer.get("choice_keys") or []]
    text = str(answer.get("text") or "").strip()
    parts = [", ".join(chosen)] if chosen else []
    if text:
        parts.append(text if not chosen else f"({text})")
    return " ".join(parts)
