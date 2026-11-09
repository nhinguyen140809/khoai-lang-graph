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

from typing import TYPE_CHECKING, Any, cast

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from pydantic import BaseModel, ConfigDict, PrivateAttr

if TYPE_CHECKING:
    from collections.abc import Sequence


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
        schema = self._bound_schema
        system = str(messages[0].content) if messages and messages[0].type == "system" else ""
        user = str(messages[-1].content) if messages else ""

        message: AIMessage
        if schema is None:
            message = AIMessage(content="Fake response without a bound schema.")
        else:
            name = schema.__name__
            answer = invoke_demo(self.demo, name, system, user)
            model = schema.model_validate(answer)
            message = AIMessage(
                content="",
                tool_calls=[
                    {"name": name, "args": model.model_dump(mode="json"), "id": f"call_{name}"}
                ],
                usage_metadata={
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                },
            )
        return ChatResult(generations=[ChatGeneration(message=message)])


def invoke_demo(
    demo: Any,
    schema_name: str,
    system: str,
    user: str,
) -> dict[str, Any]:
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
    answer = cast("dict[str, Any]", handler(system, user, call_number))
    return _with_titles(answer)


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
