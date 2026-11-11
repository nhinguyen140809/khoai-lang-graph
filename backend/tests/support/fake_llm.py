"""The deterministic chat model of the tests and the keyless demo.

`FakeChatModel` is a real LangChain chat model: nodes bind their structured
output schema as a tool, the model answers with a tool call built from the
demo dataset, and LangChain parses it back into the schema — the exact path a
real provider takes. The dataset dispatches on the schema name and on the
markers nodes embed in their prompts (PERSONA/ROLE/TURN/TRANSCRIPT OF), so the
interview loop stays deterministic across runs.

A run maps a role to `fake:demo` via its run config to use this model.
"""

from __future__ import annotations

import json
import time
from typing import TYPE_CHECKING, Any, cast

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult
from pydantic import BaseModel, ConfigDict, PrivateAttr

if TYPE_CHECKING:
    from collections.abc import Sequence


# Seconds that each call of the model waits before it answers: zero for the tests, raised by the
# demo server on request so that a run can be watched while it works.
_call_delay_seconds = 0.0


def set_call_delay(seconds: float) -> None:
    """Make every later call of the scripted model wait this long."""
    global _call_delay_seconds  # noqa: PLW0603 - one switch for the whole process
    _call_delay_seconds = max(seconds, 0.0)


class DemoCalls:
    """Per-schema call history, shared through the demo object: the models that
    `bind_tools` clones hold the same history, so call numbers survive clones."""

    __slots__ = ("counts",)

    def __init__(self) -> None:
        self.counts: dict[str, int] = {}

    def next_call(self, schema_name: str) -> int:
        self.counts[schema_name] = self.counts.get(schema_name, 0) + 1
        return self.counts[schema_name]


class FakeChatModel(BaseChatModel):
    """A chat model whose answers come from a demo dataset, never from a provider.

    The dataset object (and with it the per-schema call history) is shared by
    every clone `bind_tools` makes, so a run's calls count as one voice.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    demo: Any

    _bound_schema: type[BaseModel] | None = PrivateAttr(default=None)

    @property
    def _llm_type(self) -> str:
        return "fake-demo"

    def bind_tools(self, tools: Any, **kwargs: Any) -> FakeChatModel:
        """Remember the single structured-output schema the caller binds."""
        clone = FakeChatModel(demo=self.demo)
        clone._bound_schema = next(
            (
                schema
                for schema in tools
                if isinstance(schema, type) and issubclass(schema, BaseModel)
            ),
            None,
        )
        if clone._bound_schema is None:
            msg = "FakeChatModel expects one Pydantic schema in bind_tools"
            raise ValueError(msg)
        return clone

    def _generate(
        self,
        messages: Sequence[BaseMessage],
        stop: list[str] | None = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        if _call_delay_seconds:
            time.sleep(_call_delay_seconds)
        schema = self._bound_schema
        system = str(messages[0].content) if messages and messages[0].type == "system" else ""
        user = str(messages[-1].content) if messages else ""

        message: AIMessage
        if schema is None:
            message = AIMessage(content="Fake response without a bound schema.")
        else:
            name = schema.__name__
            answer = invoke_demo(self.demo, name, system, user)
            if answer is None:
                # A model that has the tools it needs answers in words and calls none.
                return ChatResult(
                    generations=[ChatGeneration(message=AIMessage(content="I have what I need."))]
                )
            model = schema.model_validate(answer)
            message = AIMessage(
                content="",
                tool_calls=[
                    {"name": name, "args": model.model_dump(mode="json"), "id": f"call_{name}"}
                ],
                usage_metadata={
                    "input_tokens": len(system + user) // 4,
                    "output_tokens": len(str(model.model_dump(mode="json"))) // 4,
                    "total_tokens": (len(system + user) + len(str(model.model_dump(mode="json"))))
                    // 4,
                },
            )
        if run_manager is not None and schema is not None:
            # A real provider streams the arguments of the tool call piece by piece.
            text = json.dumps(message.tool_calls[0]["args"], ensure_ascii=False)
            for start in range(0, len(text), 400):
                piece = text[start : start + 400]
                run_manager.on_llm_new_token(
                    piece,
                    chunk=ChatGenerationChunk(message=AIMessageChunk(content=piece)),
                )
        return ChatResult(generations=[ChatGeneration(message=message)])


def invoke_demo(
    demo: Any,
    schema_name: str,
    system: str,
    user: str,
) -> dict[str, Any] | None:
    """Route one request to the demo dataset by schema name.

    The dataset carries its own call history (a `DemoCalls` on the demo
    object), so the number of a call counts every question of the run, no
    matter how many model clones answered it.
    """
    calls = getattr(demo, "calls", None)
    call_number = calls.next_call(schema_name) if calls is not None else 1
    handler = getattr(demo, schema_name, None)
    if handler is None:
        msg = f"the demo dataset has no answer for schema '{schema_name}'"
        raise LookupError(msg)
    answer = cast("dict[str, Any] | None", handler(system, user, call_number))
    if answer is None:
        return None
    return _with_reports(_with_titles(answer), schema_name)


# What each node says to the user in its report, as a scripted model writes it. The answers of the
# persona (`PersonaAnswerOutput`) have no report: they are the transcript, and the interviewer
# reports once, when it stops.
_REPORTS = {
    "PlannerOutput": "I read your idea and planned the interviews around who will use it.",
    "CorpusBuilderOutput": "I gathered the documents the interviewees will be based on.",
    "MinerOutput": "I read a document and noted what its stakeholders care about.",
    "GeneratorOutputV2": "I proposed the interviewees, each based on the evidence I found.",
    "GeneratorOutput": "I proposed the interviewees.",
    "AnalystOutput": "I turned the interviews into requirements and found a few open questions.",
    "EngineerOutput": "I wrote the specification from the analysis.",
    "BacklogOutput": "I turned the specification into a backlog of user stories.",
    "ValidatorOutput": "I checked the documents and listed what still needs a fix.",
    "IntentDirectiveOutput": "I will go back to the step your message is about.",
}


# The notes of the nodes that write some, as a scripted model writes them.
_NOTES = {
    "PlannerOutput": [
        {"kind": "doing", "text": "I am listing who the idea affects."},
        {"kind": "finding", "text": "The idea does not say who **approves** a session."},
    ],
}


# The notes of every other node that writes some: it says what it is doing, and nothing more.
_DEFAULT_NOTES = [{"kind": "doing", "text": "I am working through what I was given."}]


# What a node writes for the review that follows it, as a scripted model writes it.
_REVIEWS = {
    "GeneratorOutputV2": {
        "prompt": "I proposed the interviewees. Check that they cover the people who matter.",
        "options": [],
        "questions": [
            {
                "key": "focus",
                "kind": "single_select",
                "prompt": "Whom should the interviews focus on?",
                "choices": [
                    {"key": "students", "label": "The students"},
                    {"key": "mentors", "label": "The mentors"},
                ],
                "default_choice_keys": ["students"],
            }
        ],
    },
    "AnalystOutput": {
        "prompt": (
            "I wrote the requirements analysis and found open questions. "
            "Check them, then approve it."
        ),
        "options": [
            {"key": "accept", "description": "The analysis goes on to the specification."},
            {
                "key": "reject_reanalyse",
                "description": "The analysis is written again, settling the open questions.",
                "suggested_feedback": "Settle the open questions in favour of the students.",
            },
        ],
        "questions": [],
    },
}


# What the documents say, for the outputs that may carry a summary of the artifact.
_SUMMARIES = {
    "PlannerOutput": "Three kinds of stakeholders and the topics to ask each of them about.",
    "AnalystOutput": "Students want fast booking, mentors want limits, an admin wants oversight.",
    "EngineerOutput": "The platform lets students find and book mentors, with verified profiles.",
    "BacklogOutput": "User stories for search, booking, mentor limits and moderation.",
}


def _with_reports(answer: dict[str, Any], schema_name: str) -> dict[str, Any]:
    """Give the answer of a node the `report` it must write, and a `summary` where it may."""
    if schema_name in _REPORTS:
        answer.setdefault("report", _REPORTS[schema_name])
    if schema_name in _SUMMARIES:
        answer.setdefault("summary", _SUMMARIES[schema_name])
    if schema_name in _REPORTS:
        answer.setdefault("notes", _NOTES.get(schema_name, _DEFAULT_NOTES))
    if schema_name in _REVIEWS:
        answer.setdefault("review", _REVIEWS[schema_name])
    return answer


# The drafts of an answer that carry a `title`, and the field a short name is cut from.
_TITLED_DRAFTS = {
    "raw_requirements": "statement",
    "analyzed_requirements": "statement",
    "latent_needs": "description",
    "assumptions": "statement",
    "ambiguity_issues": "description",
    "conflicts": "description",
    "issues": "description",
}
_TITLE_LIMIT = 60


def _short_name(text: str) -> str:
    """The first words of `text`, at most 60 characters, the way an agent names an item."""
    first = text.split(".", maxsplit=1)[0].strip()
    if len(first) <= _TITLE_LIMIT:
        return first
    cut = first[:_TITLE_LIMIT].rsplit(" ", 1)[0]
    return cut.rstrip(",;:")


def _with_titles(answer: dict[str, Any]) -> dict[str, Any]:
    """Give every draft of the scripted answer the `title` an agent must write."""
    for section, field in _TITLED_DRAFTS.items():
        for draft in answer.get(section, []):
            if isinstance(draft, dict) and "title" not in draft and field in draft:
                draft["title"] = _short_name(str(draft[field]))
    return answer
