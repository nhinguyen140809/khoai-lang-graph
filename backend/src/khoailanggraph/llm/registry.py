"""Model profiles: the registry of `config/models.yaml` (README: Model
Configuration).

Agents ask for a role, never a model; this module turns a role into a
`provider:model` string by merging the file's defaults and role overrides. The
caller (the run executor) layers user and project settings on top before it
freezes the run config; this registry only reads the file.
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field
from yaml import safe_load

from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from pathlib import Path


class ModelProfile(BaseModel):
    """One allowlist entry: what a user may pick in the UI."""

    id: str
    label: str
    capabilities: list[str] = Field(default_factory=list)


class ModelRegistry(BaseModel):
    """The parsed `config/models.yaml`: defaults, per-role overrides, allowlist."""

    default_model: str = "openai:glm-5.2"
    default_temperature: float = 0.2
    max_retries: int = 2
    roles: dict[str, str] = Field(default_factory=dict)
    allowlist: list[ModelProfile] = Field(default_factory=list)

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
