"""A scripted assistant that reads what it is given, as a model does.

The scripted model of the demo dataset answers every role from a fixed storyline. The assistant
cannot: what it says depends on the message, on the documents it is shown, and on what its reads
brought back. This one reads the prompt it is given (the message, the documents, the settings and
the results of its reads) and decides from them: it asks for a read when the answer needs one,
answers from the result when it has it, names the commands that the question calls for, and leaves
a message about the work to the workflow. It is a rule list, not a model, so a test knows what it
will say, but it makes the same moves, in the same order, over the same text.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

_ITEM_KEY = re.compile(r"\b([A-Z]{2,5}-\d{3})\b")
_QUESTION_WORDS = (
    "what",
    "where",
    "how",
    "which",
    "who",
    "when",
    "why",
    "is ",
    "are ",
    "can ",
    "does ",
)
_OPEN_WORDS = ("open", "show")


@dataclass(frozen=True)
class _Prompt:
    """What the assistant is shown: the message, its documents, its settings, and what it read."""

    message: str
    reads: dict[str, str]

    @property
    def lowered(self) -> str:
        return self.message.lower()

    @property
    def is_question(self) -> bool:
        return self.lowered.strip().startswith(_QUESTION_WORDS) or self.lowered.endswith("?")

    @property
    def wants_to_open(self) -> bool:
        return self.lowered.strip().startswith(_OPEN_WORDS)


def _block(user: str, name: str) -> str:
    found = re.search(rf"<{name}>\n(.*?)\n</{name}>", user, re.DOTALL)
    return found.group(1) if found else ""


def _read(user: str) -> _Prompt:
    reads = dict(re.findall(r'<tool_result tool="(\w+)">\n(.*?)\n</tool_result>', user, re.DOTALL))
    messages = re.findall(r"<message>\n(.*?)\n</message>", user, re.DOTALL)
    return _Prompt(message=messages[-1] if messages else "", reads=reads)


def _first_line(text: str) -> str:
    return text.strip().splitlines()[0] if text.strip() else ""


def _answer(text: str, *commands: dict[str, Any]) -> dict[str, Any]:
    return {
        "tool": None,
        "key": None,
        "answer": {"kind": "general", "text": text, "commands": list(commands)},
    }


def _read_first(tool: str, key: str | None = None) -> dict[str, Any]:
    return {"tool": tool, "key": key, "answer": None}


def _workflow() -> dict[str, Any]:
    return {"tool": None, "key": None, "answer": {"kind": "workflow", "text": "", "commands": []}}


def _about_an_item(prompt: _Prompt, key: str) -> dict[str, Any]:
    result = prompt.reads.get("read_item")
    if result is None:
        return _read_first("read_item", key)
    head = _first_line(result)
    identified = re.search(r"id ([0-9a-f-]{36})", head)
    fields = [line.removeprefix("- ") for line in result.splitlines()[1:3]]
    text = f"{head.split(', id')[0]}: " + "; ".join(fields) + "."
    if prompt.wants_to_open and identified:
        return _answer(text, {"command": "open_item", "item_id": identified.group(1), "label": key})
    return _answer(text)


def _about_a_document(prompt: _Prompt) -> dict[str, Any]:
    """Opens the document that the message names, once `list_documents` has said which there are."""
    listed = prompt.reads.get("list_documents")
    if listed is None:
        return _read_first("list_documents")
    for line in listed.splitlines():
        match = re.match(r"- id (\S+) \| (\w+) \| (.*?) \| version", line)
        if match is None:
            continue
        words = {match[2].replace("_", " "), match[3].lower()}
        if any(word and word in prompt.lowered for word in words):
            return _answer(
                f"Here is {match[3]}.",
                {"command": "open_document", "artifact_id": match[1], "label": match[3]},
            )
    return _answer("This project has no such document yet.")


def _item_rule(prompt: _Prompt) -> dict[str, Any] | None:
    key = _ITEM_KEY.search(prompt.message)
    if key and (prompt.is_question or prompt.wants_to_open):
        return _about_an_item(prompt, key.group(1))
    return None


def _budget_rule(prompt: _Prompt) -> dict[str, Any] | None:
    if "budget" not in prompt.lowered or not prompt.is_question:
        return None
    result = prompt.reads.get("budget_left")
    return _answer(_first_line(result)) if result else _read_first("budget_left")


def _last_run_rule(prompt: _Prompt) -> dict[str, Any] | None:
    if not prompt.is_question or not (
        "last run" in prompt.lowered or "work stand" in prompt.lowered
    ):
        return None
    result = prompt.reads.get("latest_run")
    return _answer(_first_line(result)) if result else _read_first("latest_run")


def _review_rule(prompt: _Prompt) -> dict[str, Any] | None:
    if not prompt.is_question or not ("waiting" in prompt.lowered or "review" in prompt.lowered):
        return None
    return _answer(
        "A review may wait for you at the end of the chat.",
        {"command": "open_review", "label": "The review"},
    )


def _settings_rule(prompt: _Prompt) -> dict[str, Any] | None:
    if not (prompt.is_question or prompt.wants_to_open) or not any(
        word in prompt.lowered for word in ("limit", "setting", "cost")
    ):
        return None
    settings = prompt.reads.get("run_settings")
    if settings is None:
        return _read_first("run_settings")
    lines = [line.removeprefix("- ") for line in settings.splitlines()[:2]]
    return _answer(
        "The settings say: " + "; ".join(lines) + ".",
        {"command": "open_settings", "label": "Run settings"},
    )


def _document_rule(prompt: _Prompt) -> dict[str, Any] | None:
    return _about_a_document(prompt) if prompt.wants_to_open else None


# In the order the assistant considers them; the first that applies decides.
_RULES = (_item_rule, _budget_rule, _last_run_rule, _review_rule, _settings_rule, _document_rule)


def _remembered(user: str, memory: dict[str, _Prompt]) -> _Prompt:
    """The prompt of the message being answered, with what its reads brought back so far.

    The model is shown the whole prompt once and, after each read, only the result of that read;
    what it decides then rests on what it was shown before, which `memory` keeps for the message.
    """
    seen = _read(user)
    if seen.message:
        memory["prompt"] = seen
        return seen
    before = memory["prompt"]
    prompt = _Prompt(before.message, {**before.reads, **seen.reads})
    memory["prompt"] = prompt
    return prompt


def scripted_assistant(
    system: str, user: str, call_number: int, memory: dict[str, _Prompt]
) -> dict[str, Any]:
    """The next move of the scripted assistant: a read to make, or its answer."""
    del system, call_number  # it decides from the message and what it read, not from the count
    prompt = _remembered(user, memory)
    for rule in _RULES:
        move = rule(prompt)
        if move is not None:
            return move
    return _workflow()
