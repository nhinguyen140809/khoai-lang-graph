"""The configuration a run starts with: resolved field by field when the run starts, then frozen.

Each field takes the first value set in this order: the request that starts the run, the project,
the settings of the user, the server default. Models follow the same order with the settings of
the user per agent role in the place of the user level.
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

from sqlalchemy import select

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.me.models import ModelSettingsRow, UserSettingsRow
from khoailanggraph.features.projects.validation import model_problems, run_defaults_problems
from khoailanggraph.features.runs import service
from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Mapping
    from uuid import UUID

    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.projects.models import ProjectRow
    from khoailanggraph.features.projects.schemas import RunDefaults


def server_models() -> dict[str, str]:
    """The model of each agent role the server picks when nothing else does: none, so that each
    role resolves through `config/models.yaml` when it calls a model."""
    return {}


def _loads(blob: bytes | None) -> dict[str, Any]:
    value = json.loads((blob or b"{}").decode("utf-8") or "{}")
    return value if isinstance(value, dict) else {}


def parameter_defaults() -> dict[str, Any]:
    """The default of each run parameter in the parameter schema of the workflow definition."""
    schema = wf.run_parameters_schema()["properties"]
    return {name: spec["default"] for name, spec in schema.items() if "default" in spec}


def server_review_checkpoints() -> list[str]:
    """The checkpoints a run pauses at when no level names any."""
    configured = get_settings().default_review_checkpoints
    return list(wf.checkpoint_nodes()) if configured is None else list(configured)


def request_problems(run_config: RunDefaults | None, models: Mapping[str, str] | None) -> None:
    """Answer `422 validation_failed` for the settings in a message request that are not valid."""
    problems: list[dict[str, str]] = []
    if run_config is not None:
        problems += run_defaults_problems("run_config", run_config)
    if models is not None:
        problems += model_problems("models", models)
    if problems:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            "The body has fields that are not valid.",
            errors=problems,
        )


async def resolve_run_config(
    session: AsyncSession,
    project: ProjectRow,
    user_id: UUID,
    *,
    run_config: RunDefaults | None = None,
    models: Mapping[str, str] | None = None,
) -> dict[str, Any]:
    """The frozen configuration of a run that starts now."""
    settings_row = await session.get(UserSettingsRow, user_id)
    levels: list[dict[str, Any]] = [
        run_config.model_dump(exclude_none=True) if run_config is not None else {},
        _loads(project.run_config_json),
        _loads(settings_row.default_run_config_json) if settings_row is not None else {},
    ]

    def first(name: str, default: Any) -> Any:
        for level in levels:
            if level.get(name) is not None:
                return level[name]
        return default

    parameters = parameter_defaults()
    for level in reversed(levels):
        parameters.update(level.get("parameters") or {})
    saved = await session.scalars(
        select(ModelSettingsRow).where(ModelSettingsRow.user_id == user_id)
    )
    chosen = {row.agent_role: row.model_id for row in saved.all()}
    resolved_models = {
        **service.role_models(),
        **server_models(),
        **chosen,
        **_loads(project.model_overrides_json),
        **dict(models or {}),
    }
    return {
        "models": resolved_models,
        "review_checkpoints": first("review_checkpoints", server_review_checkpoints()),
        "output_language": project.output_language,
        "max_steps": first("max_steps", 400),
        "max_cost_usd": first("max_cost_usd", None),
        "parameters": parameters,
    }
