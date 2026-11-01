"""The single entry point every agent uses to obtain its chat model.

`get_chat_model(role, config)` resolves the role to a `provider:model` string
(run override > project > user > the role's models.yaml default; the run's
frozen map arrives as `config["configurable"]["models"]`) and builds — or
reuses — the chat model for it. Every model id resolves through the provider
registry (models.yaml) — production always uses a real provider.

A node never hard-codes a model and never builds a chat model itself
(CONTRIBUTING: LangGraph/agents): it asks for its role.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any

from khoailanggraph.llm.registry import default_registry
from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from langchain_core.language_models.chat_models import BaseChatModel

_model_cache: dict[tuple[str, float | None], BaseChatModel] = {}


def resolve_model_id(role: str, config: Mapping[str, Any] | None = None) -> str:
    """The `provider:model` a role uses for this run, per the resolution order."""
    configurable = dict(config or {}).get("configurable", {})
    overrides = configurable.get("models") if isinstance(configurable, Mapping) else None
    if overrides and role in overrides:
        return str(overrides[role])
    return default_registry().model_for_role(role)


def build_chat_model(model_id: str, temperature: float | None = None) -> BaseChatModel:
    """One chat model per `provider:model` id, without importing lazy providers
    that a keyless run never uses."""
    provider, _, name = model_id.partition(":")
    if provider == "openai":
        from langchain_openai import ChatOpenAI  # noqa: PLC0415 - provider is imported only when used

        settings = get_settings()
        credentials: dict[str, Any] = {}
        if settings.openai_api_key:
            credentials["api_key"] = settings.openai_api_key
        if settings.openai_base_url:
            credentials["base_url"] = settings.openai_base_url
        # Transient gateway errors (5xx timeouts) retry with the openai
        # client; a long agent conversation tolerates the added latency.
        # Streaming keeps bytes flowing so the gateway's ~90s no-response
        # proxy ceiling never fires: a persona call generating 2-3k tokens
        # ran 305s streamed where every non-streamed attempt 504'd
        # (verified 2026-10-27 against the real gateway). The token cap
        # bounds a degenerate streamed generation (one looped to 386KB of
        # carriage returns) so the _invoke retry takes over instead of a
        # runaway — 32k left room for the largest lawful output (the
        # analyst's one-call batch: RAW+AR+latent+assumptions+conflicts)
        # which truncated at 16k on the real run of 2026-10-27.
        return ChatOpenAI(
            model=name,
            temperature=temperature,
            max_retries=default_registry().max_retries,
            max_tokens=32768,
            streaming=True,
            **credentials,
        )
    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic  # noqa: PLC0415 - provider is imported only when used

        return ChatAnthropic(model=name, temperature=temperature)

    msg = f"Unknown LLM provider '{provider}' in model id '{model_id}'."
    raise ValueError(msg)


def get_chat_model(role: str, config: Mapping[str, Any] | None = None) -> BaseChatModel:
    """The chat model a node with `role` uses for the run of `config`."""
    model_id = resolve_model_id(role, config)
    temperature = default_registry().default_temperature
    key = (model_id, temperature)
    if key not in _model_cache:
        _model_cache[key] = build_chat_model(model_id, temperature)
    return _model_cache[key]


def reset_model_cache() -> None:
    """Drop the cached models; each run (and test) starts with fresh ones."""
    _model_cache.clear()
