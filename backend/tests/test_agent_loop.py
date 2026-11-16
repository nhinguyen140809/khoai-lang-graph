"""The agent loop: tools answer the model, and `finish` carries the node's output."""

from __future__ import annotations

from typing import Any

import pytest
from langchain_core.messages import AIMessage
from langchain_core.tools import StructuredTool
from pydantic import BaseModel

from khoailanggraph.agents.requirements_engineering.agent_loop import (
    ToolLoopExceeded,
    run_agent,
)


class Answer(BaseModel):
    text: str


class ScriptedModel:
    """A model that answers with the turns the test queued, whatever the prompt says."""

    def __init__(self, *turns: AIMessage) -> None:
        self.turns = list(turns)
        self.seen: list[str] = []

    def bind_tools(self, tools: Any, **kwargs: Any) -> ScriptedModel:
        self.bound = [getattr(tool, "name", getattr(tool, "__name__", "")) for tool in tools]
        return self

    def invoke(self, messages: Any, config: Any = None, **kwargs: Any) -> AIMessage:
        self.seen = list(messages)
        return self.turns.pop(0)


def _tool(text: str) -> StructuredTool:
    def read(persona_key: str) -> str:
        """Read one interview."""
        return f"{persona_key}: {text}"

    return StructuredTool.from_function(func=read, name="read_transcript")


def _finish_call(text: str, call_id: str = "f1") -> AIMessage:
    return AIMessage(
        content="",
        tool_calls=[{"name": "Answer", "args": {"text": text}, "id": call_id}],
    )


def test_the_model_may_read_a_tool_before_it_finishes() -> None:
    model = ScriptedModel(
        AIMessage(
            content="",
            tool_calls=[
                {"name": "read_transcript", "args": {"persona_key": "PER-001"}, "id": "t1"}
            ],
        ),
        _finish_call("done"),
    )

    answer = run_agent(
        role="analyst",
        model=model,  # type: ignore[arg-type]
        messages=[],
        finish=Answer,
        tools=[_tool("hello")],
    )

    assert answer.text == "done"
    tool_messages = [str(message.content) for message in model.seen if message.type == "tool"]
    assert "PER-001: hello" in tool_messages


def test_an_unknown_tool_is_answered_with_the_names_it_may_use() -> None:
    model = ScriptedModel(
        AIMessage(content="", tool_calls=[{"name": "nope", "args": {}, "id": "x"}]),
        _finish_call("done"),
    )

    run_agent(
        role="analyst",
        model=model,  # type: ignore[arg-type]
        messages=[],
        finish=Answer,
        tools=[_tool("hello")],
    )

    tool_messages = [str(message.content) for message in model.seen if message.type == "tool"]
    assert any("Unknown tool" in text and "read_transcript" in text for text in tool_messages)


def test_a_finish_call_that_breaks_the_schema_is_refused_and_tried_again() -> None:
    bad = AIMessage(
        content="",
        tool_calls=[{"name": "Answer", "args": {"wrong": 1}, "id": "f1"}],
    )
    model = ScriptedModel(bad, _finish_call("fixed"))

    answer = run_agent(
        role="analyst",
        model=model,  # type: ignore[arg-type]
        messages=[],
        finish=Answer,
    )

    assert answer.text == "fixed"
    tool_messages = [str(message.content) for message in model.seen if message.type == "tool"]
    assert any("refused" in text for text in tool_messages)


def test_the_loop_stops_when_the_model_never_finishes() -> None:
    model = ScriptedModel(
        *[AIMessage(content="thinking") for _ in range(3)],
    )

    with pytest.raises(ToolLoopExceeded):
        run_agent(
            role="analyst",
            model=model,  # type: ignore[arg-type]
            messages=[],
            finish=Answer,
            max_rounds=3,
        )
