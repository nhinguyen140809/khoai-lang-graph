"""Model profiles: the registry of `config/models.yaml` (README: Model
Configuration).

Agents ask for a role, never a model; this module turns a role into a
`provider:model` string by merging the file's defaults and role overrides. The
caller (the run executor) layers user and project settings on top before it
freezes the run config; this registry only reads the file.
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING, Any, Literal

from pydantic import BaseModel, Field, model_validator
from yaml import safe_load

from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from pathlib import Path


Capability = Literal["tool_calling", "structured_output", "streaming", "vision"]


class ModelProfile(BaseModel):
    """One allowlist entry: what a user may pick, and what the model offers.

    `allowed_roles` names the agent roles the model may serve; left out, it serves every role
    (the catalog lists the roles of the workflow definition in use).

    `base_url` and `api_key_env` say where the model is served. A model with a `base_url` is
    called through the OpenAI-compatible protocol, whatever the name before the colon of its id
    (for example `gemini:gemini-2.5-flash`). `api_key_env` is the NAME of the variable that holds
    the key, read from the environment or `backend/.env`; a key never sits in this file. A model
    with neither uses the `OPENAI_BASE_URL` and `OPENAI_API_KEY` settings, as before.
    """

    id: str
    label: str
    base_url: str | None = None
    api_key_env: str | None = None
    capabilities: list[Capability] = Field(default_factory=list)
    context_window: int
    input_price_per_mtok: float | None = None
    output_price_per_mtok: float | None = None
    cache_read_price_per_mtok: float | None = None
    cache_write_price_per_mtok: float | None = None
    allowed_roles: list[str] | None = None

    @model_validator(mode="after")
    def _endpoint_names_its_key(self) -> ModelProfile:
        """A model at its own address names the variable of its key: without one, the client
        library would send the key of `OPENAI_API_KEY` to an address that is not the gateway."""
        if self.base_url and not self.api_key_env:
            msg = f"Model '{self.id}' sets base_url, so it must set api_key_env as well."
            raise ValueError(msg)
        return self


class ModelCatalogEntry(BaseModel):
    """A model a user may pick (GET /models), as the API serves it."""

    model_id: str
    provider: str
    display_name: str
    capabilities: list[Capability]
    context_window: int
    input_price_per_mtok: float | None
    output_price_per_mtok: float | None
    cache_read_price_per_mtok: float | None
    cache_write_price_per_mtok: float | None
    allowed_roles: list[str]


class ModelRegistry(BaseModel):
    """The parsed `config/models.yaml`: defaults, per-role overrides, allowlist."""

    default_model: str = "openai:glm-5.2"
    default_temperature: float = 0.2
    max_retries: int = 2
    roles: dict[str, str] = Field(default_factory=dict)
    allowlist: list[ModelProfile] = Field(default_factory=list)

    def catalog(self, roles: list[str]) -> list[ModelCatalogEntry]:
        """The models a user may pick, ordered by `model_id`; `roles` are the agent roles of the
        workflow definition in use, which a model without a list of its own serves."""
        return [
            ModelCatalogEntry(
                model_id=entry.id,
                provider=entry.id.partition(":")[0],
                display_name=entry.label,
                capabilities=entry.capabilities,
                context_window=entry.context_window,
                input_price_per_mtok=entry.input_price_per_mtok,
                output_price_per_mtok=entry.output_price_per_mtok,
                cache_read_price_per_mtok=entry.cache_read_price_per_mtok,
                cache_write_price_per_mtok=entry.cache_write_price_per_mtok,
                allowed_roles=roles if entry.allowed_roles is None else entry.allowed_roles,
            )
            for entry in sorted(self.allowlist, key=lambda profile: profile.id)
        ]

    def profile(self, model_id: str) -> ModelProfile | None:
        """The allowlist entry of a model id, None for a model that is not listed."""
        return next((entry for entry in self.allowlist if entry.id == model_id), None)

    def model_for_role(self, role: str) -> str:
        """The `provider:model` of a role; an unlisted role uses the default."""
        return self.roles.get(role, self.default_model)


def load_registry(file: Path | None = None) -> ModelRegistry:
    """Parse a models.yaml file; a missing file keeps the built-in defaults."""
    path = file if file is not None else get_settings().models_config_file
    if not path.exists():
        return ModelRegistry()
    raw: dict[str, Any] = safe_load(path.read_text(encoding="utf-8")) or {}
    defaults = raw.get("defaults") or {}
    allowlist = [ModelProfile.model_validate(entry) for entry in raw.get("allowlist", [])]
    return ModelRegistry(
        default_model=str(defaults.get("model", "openai:glm-5.2")),
        default_temperature=float(defaults.get("temperature", 0.2)),
        max_retries=int(defaults.get("max_retries", 2)),
        roles={str(key): str(value) for key, value in (raw.get("roles") or {}).items()},
        allowlist=allowlist,
    )


@lru_cache
def default_registry() -> ModelRegistry:
    """The registry of the configured models file, parsed once."""
    return load_registry()
