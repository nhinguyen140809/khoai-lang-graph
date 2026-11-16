"""The loop that makes one node an agent: it may call tools, read what they answer, and call
`finish` with the structured output of the node.

The node keeps owning its prompt, its data and its post-processing; this loop only decides how
the model's turns run. A call that breaks the args schema is answered with the reason, so the
model corrects it instead of failing the run. The loop stops on `finish`, after `max_rounds`, or
when the model answers with no tool at all (it is then told to call `finish`).
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

import structlog
from langchain_core.messages import HumanMessage, ToolMessage
from pydantic import ValidationError

from khoailanggraph.llm.usage import UsageHandler

if TYPE_CHECKING:
    from collections.abc import Sequence

    from langchain_core.language_models import BaseChatModel
    from langchain_core.messages import BaseMessage
    from langchain_core.tools import BaseTool
    from pydantic import BaseModel

    from khoailanggraph.agents.requirements_engineering.ports import LlmGate

MAX_ROUNDS = 5

logger = structlog.get_logger(__name__)


@dataclass(frozen=True)
class CallLog:
    """What one round of the loop did, for the step's events and for the tests."""

    round: int
    tools: list[str]


class ToolLoopExceeded(RuntimeError):
    """The model never called `finish` within the rounds the node allows."""


def run_agent[T: BaseModel](  # noqa: PLR0913 - the loop is one place, the knobs are its contract
    *,
    role: str,
    model: BaseChatModel,
    messages: list[BaseMessage],
    finish: type[T],
    tools: Sequence[BaseTool] = (),
    gate: LlmGate | None = None,
    model_id: str = "",
    max_rounds: int = MAX_ROUNDS,
    on_round: Any = None,
) -> T:
    """Run the node's agent loop and return the validated `finish` payload."""
    bound = model.bind_tools([finish, *tools])
    by_name = {tool.name: tool for tool in tools}
    for round_no in range(1, max_rounds + 1):
        if gate is not None:
            gate.before_call(role)
        handler = UsageHandler(
            on_text=None if gate is None else (lambda text: gate.record_text(role, text))
        )
        started = time.monotonic()
        try:
            reply = bound.invoke(messages, config={"callbacks": [handler]})
        finally:
            # A round that failed was paid for as well: its tokens count.
            if gate is not None:
                elapsed = int((time.monotonic() - started) * 1000)
                gate.record_call(role, model_id, handler.usage(model_id, elapsed))
        calls = list(getattr(reply, "tool_calls", []) or [])
        finish_calls = [call for call in calls if call["name"] == finish.__name__]
        if finish_calls:
            try:
                return finish.model_validate(finish_calls[0]["args"])
            except ValidationError as exc:
                messages.extend(
                    [
                        reply,
                        ToolMessage(
                            content=(
                                f"The call was refused: {exc.errors()[0]['msg']}. "
                                f"Correct it and call {finish.__name__} again."
                            ),
                            tool_call_id=finish_calls[0]["id"],
                        ),
                    ]
                )
                _log(role, round_no, [finish.__name__], on_round)
                continue
        if not calls:
            # The model answered in words instead of calling the tool. The same schema that the
            # node used before this loop parses that answer, once, on the whole conversation.
            _log(role, round_no, [], on_round)
            try:
                return _structured(role, model, [*messages, reply], finish, gate, model_id)
            except Exception:  # noqa: BLE001 - the next round gives the model another turn
                continue
        messages.append(reply)
        used: list[str] = []
        for call in calls:
            tool = by_name.get(str(call["name"]))
            used.append(str(call["name"]))
            if tool is None:
                text = f"Unknown tool. Use one of: {', '.join(by_name)}."
            else:
                try:
                    text = str(tool.invoke(call["args"]))
                except Exception as exc:  # noqa: BLE001 - the model reads the failure and retries
                    text = f"The tool failed: {type(exc).__name__}: {exc}"
            messages.append(ToolMessage(content=text, tool_call_id=call["id"]))
        _log(role, round_no, used, on_round)
    # No finish call after every round: one structured pass over what the conversation holds
    # settles it, instead of failing a run that already paid for its tools.
    try:
        return _structured(role, model, messages, finish, gate, model_id)
    except Exception as exc:  # noqa: BLE001 - the run fails with the rounds it used
        raise ToolLoopExceeded(
            f"{role} did not call {finish.__name__} within {max_rounds} rounds"
        ) from exc


def _structured[T: BaseModel](
    role: str,
    model: BaseChatModel,
    messages: list[BaseMessage],
    finish: type[T],
    gate: LlmGate | None,
    model_id: str,
) -> T:
    """One structured call on the conversation so far, with the same accounting as a round."""
    if gate is not None:
        gate.before_call(role)
    handler = UsageHandler(
        on_text=None if gate is None else (lambda text: gate.record_text(role, text))
    )
    started = time.monotonic()
    try:
        return model.with_structured_output(finish).invoke(
            messages, config={"callbacks": [handler]}
        )
    finally:
        if gate is not None:
            elapsed = int((time.monotonic() - started) * 1000)
            gate.record_call(role, model_id, handler.usage(model_id, elapsed))


def _log(role: str, round_no: int, tools: list[str], on_round: Any) -> None:
    logger.debug("agent round", role=role, round=round_no, tools=tools)
    if on_round is not None:
        on_round(CallLog(round=round_no, tools=tools))
