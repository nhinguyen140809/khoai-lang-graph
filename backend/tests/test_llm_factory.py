"""The endpoint and key of a model come from its allowlist entry, else from the settings."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from khoailanggraph.llm import factory
from khoailanggraph.llm.registry import ModelProfile, ModelRegistry
from khoailanggraph.settings import env_value, get_settings

if TYPE_CHECKING:
    from pathlib import Path

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def _profile(model_id: str, **fields: str) -> ModelProfile:
    return ModelProfile(id=model_id, label=model_id, context_window=1000, **fields)


@pytest.fixture
def registry(monkeypatch: pytest.MonkeyPatch) -> ModelRegistry:
    """A registry with one model on its own endpoint and one on the gateway of the settings."""
    built = ModelRegistry(
        allowlist=[
            _profile("gemini:gemini-2.5-flash", base_url=GEMINI_URL, api_key_env="TEST_GEMINI_KEY"),
            _profile("openai:gpt-4.1"),
        ]
    )
    monkeypatch.setattr(factory, "default_registry", lambda: built)
    settings = get_settings()
    monkeypatch.setattr(settings, "openai_base_url", "https://gateway.example/v1")
    monkeypatch.setattr(settings, "openai_api_key", "gateway-key")
    return built


def test_a_model_with_a_base_url_uses_its_own_endpoint_and_key(
    registry: ModelRegistry, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("TEST_GEMINI_KEY", "gemini-key")

    model = factory.build_chat_model("gemini:gemini-2.5-flash")

    assert isinstance(model, ChatOpenAI)
    assert model.model_name == "gemini-2.5-flash"
    assert model.openai_api_base == GEMINI_URL
    assert isinstance(model.openai_api_key, SecretStr)
    assert model.openai_api_key.get_secret_value() == "gemini-key"


def test_a_model_without_its_own_endpoint_uses_the_settings(registry: ModelRegistry) -> None:
    model = factory.build_chat_model("openai:gpt-4.1")

    assert isinstance(model, ChatOpenAI)
    assert model.openai_api_base == "https://gateway.example/v1"
    assert isinstance(model.openai_api_key, SecretStr)
    assert model.openai_api_key.get_secret_value() == "gateway-key"


def test_a_missing_key_variable_is_named_in_the_error(
    registry: ModelRegistry, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("TEST_GEMINI_KEY", raising=False)

    with pytest.raises(ValueError, match="TEST_GEMINI_KEY"):
        factory.build_chat_model("gemini:gemini-2.5-flash")


def test_an_unlisted_provider_without_a_base_url_is_refused(registry: ModelRegistry) -> None:
    with pytest.raises(ValueError, match="Unknown LLM provider"):
        factory.build_chat_model("mistral:large")


def test_env_value_reads_the_environment_and_ignores_empty(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.setenv("TEST_ENV_VALUE", "set")
    monkeypatch.setenv("TEST_ENV_EMPTY", "")

    assert env_value("TEST_ENV_VALUE") == "set"
    assert env_value("TEST_ENV_EMPTY") is None
    assert env_value("TEST_ENV_NEVER_DEFINED_ANYWHERE") is None
