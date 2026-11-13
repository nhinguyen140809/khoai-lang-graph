"""The rules that a project, and the settings a user saves, hold for run settings and models.

Each function answers the problems it finds as `{field, message}` entries, with the path of the
field in the body, so that the route can answer `422 validation_failed` at that field.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from jsonschema import Draft202012Validator

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.llm.registry import default_registry

if TYPE_CHECKING:
    from collections.abc import Mapping

    from khoailanggraph.features.projects.schemas import RunDefaults

Problem = dict[str, str]


def run_defaults_problems(prefix: str, defaults: RunDefaults) -> list[Problem]:
    """The problems of run settings: the reviews are checkpoints of the workflow, the limits are
    in range, and each parameter is one of the workflow and fits its schema."""
    problems: list[Problem] = []
    checkpoints = set(wf.checkpoint_nodes())
    if defaults.review_checkpoints is not None:
        seen: set[str] = set()
        for index, checkpoint in enumerate(defaults.review_checkpoints):
            field = f"{prefix}.review_checkpoints.{index}"
            if checkpoint not in checkpoints:
                problems.append({"field": field, "message": "Not a checkpoint of the workflow."})
            elif checkpoint in seen:
                problems.append({"field": field, "message": "Given more than once."})
            seen.add(checkpoint)
    if defaults.max_steps is not None and defaults.max_steps < 1:
        problems.append({"field": f"{prefix}.max_steps", "message": "At least 1."})
    if defaults.max_cost_usd is not None and defaults.max_cost_usd < 0:
        problems.append({"field": f"{prefix}.max_cost_usd", "message": "Not below 0."})
    if defaults.parameters is not None:
        schema = wf.run_parameters_schema()["properties"]
        for name, value in defaults.parameters.items():
            field = f"{prefix}.parameters.{name}"
            if name not in schema:
                problems.append({"field": field, "message": "Not a parameter of the workflow."})
                continue
            for error in Draft202012Validator(schema[name]).iter_errors(value):
                problems.append({"field": field, "message": error.message})
                break
    return problems


def model_problems(prefix: str, choices: Mapping[str, Any]) -> list[Problem]:
    """The problems of a map of agent role to model: the role is one of the workflow and the
    model is in the catalog and may serve the role."""
    problems: list[Problem] = []
    roles = list(wf.agent_roles())
    catalog = {entry.model_id: entry for entry in default_registry().catalog(roles)}
    for role, model in choices.items():
        field = f"{prefix}.{role}"
        if role not in roles:
            problems.append({"field": field, "message": "Not an agent role of the workflow."})
        elif not isinstance(model, str) or model not in catalog:
            problems.append({"field": field, "message": "Not a model of the catalog."})
        elif role not in catalog[model].allowed_roles:
            problems.append({"field": field, "message": "This model does not serve the role."})
    return problems
