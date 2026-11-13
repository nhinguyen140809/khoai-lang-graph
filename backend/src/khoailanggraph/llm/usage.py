"""What one call to a chat model used: the tokens the provider reports and the cost they make.

The provider is the only source of token counts. A callback handler collects them from the
answer of one call; the cost is computed here, from the prices of the model in the catalog of
`config/models.yaml`, so no caller needs to know a price.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, TypedDict

from langchain_core.callbacks import BaseCallbackHandler

from khoailanggraph.llm.registry import default_registry

if TYPE_CHECKING:
    from collections.abc import Callable
    from uuid import UUID

    from langchain_core.outputs import ChatGenerationChunk, GenerationChunk, LLMResult

PER_MILLION = 1_000_000


class Usage(TypedDict):
    """The usage of one call, of one step or of one run (the `usage` of the API)."""

    input_tokens: int
    output_tokens: int
    cache_read_tokens: int
    cache_write_tokens: int
    cost_usd: float
    duration_ms: int


def zero_usage() -> Usage:
    return Usage(
        input_tokens=0,
        output_tokens=0,
        cache_read_tokens=0,
        cache_write_tokens=0,
        cost_usd=0.0,
        duration_ms=0,
    )


def add_usage(total: Usage, part: Usage) -> Usage:
    """The sum of two usages."""
    return Usage(
        input_tokens=total["input_tokens"] + part["input_tokens"],
        output_tokens=total["output_tokens"] + part["output_tokens"],
        cache_read_tokens=total["cache_read_tokens"] + part["cache_read_tokens"],
        cache_write_tokens=total["cache_write_tokens"] + part["cache_write_tokens"],
        cost_usd=round(total["cost_usd"] + part["cost_usd"], 6),
        duration_ms=total["duration_ms"] + part["duration_ms"],
    )


def cost_of(model_id: str, usage: Usage) -> float:
    """The cost in US dollars of the tokens of `usage` at the prices of the model. `input_tokens`
    is the input that was not read from or written to the cache. A price the provider does not
    publish counts as zero, and cached tokens that have no price of their own are charged as
    input."""
    profile = next((entry for entry in default_registry().allowlist if entry.id == model_id), None)
    if profile is None:
        return 0.0
    input_price = profile.input_price_per_mtok or 0.0
    read_price = (
        profile.cache_read_price_per_mtok
        if profile.cache_read_price_per_mtok is not None
        else input_price
    )
    write_price = (
        profile.cache_write_price_per_mtok
        if profile.cache_write_price_per_mtok is not None
        else input_price
    )
    total = (
        usage["input_tokens"] * input_price
        + usage["cache_read_tokens"] * read_price
        + usage["cache_write_tokens"] * write_price
        + usage["output_tokens"] * (profile.output_price_per_mtok or 0.0)
    )
    return round(total / PER_MILLION, 6)


class UsageHandler(BaseCallbackHandler):
    """Collects the token counts that the provider reports for the calls it is attached to, and
    hands the text the model generates to `on_text` while it is generated."""

    def __init__(self, on_text: Callable[[str], None] | None = None) -> None:
        self.text_sink = on_text
        self.input_tokens = 0
        self.output_tokens = 0
        self.cache_read_tokens = 0
        self.cache_write_tokens = 0

    def on_llm_new_token(
        self,
        token: str | list[str | dict[str, Any]],
        *,
        chunk: GenerationChunk | ChatGenerationChunk | None = None,
        run_id: UUID,
        parent_run_id: UUID | None = None,
        tags: list[str] | None = None,
        **kwargs: Any,
    ) -> None:
        """A piece of generated text; for an answer given as a tool call, the piece of its
        arguments."""
        if self.text_sink is None:
            return
        text = token if isinstance(token, str) else ""
        message = getattr(chunk, "message", None)
        for piece in getattr(message, "tool_call_chunks", None) or []:
            text += str(piece.get("args") or "")
        if text:
            self.text_sink(text)

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        for generations in response.generations:
            for generation in generations:
                message = getattr(generation, "message", None)
                metadata = getattr(message, "usage_metadata", None)
                if not metadata:
                    continue
                details = metadata.get("input_token_details") or {}
                self.input_tokens += int(metadata.get("input_tokens", 0))
                self.output_tokens += int(metadata.get("output_tokens", 0))
                self.cache_read_tokens += int(details.get("cache_read", 0))
                self.cache_write_tokens += int(details.get("cache_creation", 0))

    def usage(self, model_id: str, duration_ms: int) -> Usage:
        """What the attached calls used, priced for the model that served them. The provider
        reports the whole input; the usage keeps the part that did not touch the cache."""
        counted = Usage(
            input_tokens=max(
                self.input_tokens - self.cache_read_tokens - self.cache_write_tokens, 0
            ),
            output_tokens=self.output_tokens,
            cache_read_tokens=self.cache_read_tokens,
            cache_write_tokens=self.cache_write_tokens,
            cost_usd=0.0,
            duration_ms=duration_ms,
        )
        counted["cost_usd"] = cost_of(model_id, counted)
        return counted
