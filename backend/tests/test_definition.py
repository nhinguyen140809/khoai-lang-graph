"""The definition file is valid against its schema and the rules a JSON Schema
cannot express (docs/workflow/README.md §4)."""

from __future__ import annotations

import json
from importlib import resources
from typing import Any

import pytest
from jsonschema import Draft202012Validator

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.domain import registry

_SCHEMA_FILE = "definition.schema.json"


@pytest.fixture
def definition_schema() -> dict[str, Any]:
    raw = (
        resources.files("khoailanggraph.agents.requirements_engineering") / _SCHEMA_FILE
    ).read_text(encoding="utf-8")
    return dict(json.loads(raw))


def test_definition_validates_against_its_schema(definition_schema: dict[str, Any]) -> None:
    Draft202012Validator(definition_schema).validate(wf.DEFINITION)


def test_exactly_one_start_and_one_end() -> None:
    kinds = [node.get("kind") for node in wf.DEFINITION["nodes"]]
    assert kinds.count("start") == 1
    assert kinds.count("end") == 1


def test_every_named_id_exists() -> None:
    nodes = wf.nodes()
    node_ids = set(nodes)
    stages = set(wf.stages())
    roles = set(wf.agent_roles())
    artifact_kinds = set(wf.artifact_kinds())
    item_kinds = set(wf.item_kinds())

    for edge in wf.edges():
        assert str(edge["source"]) in node_ids | {"__start__"}
        assert str(edge["target"]) in node_ids | {"__end__"}
        if edge.get("option") is not None:
            checkpoint_options = {
                str(option["key"]) for option in nodes[str(edge["source"])].get("options", [])
            }
            assert str(edge["option"]) in checkpoint_options
    for node in wf.DEFINITION["nodes"]:
        if node.get("agent_role") is not None:
            assert str(node["agent_role"]) in roles
        if node.get("stage") is not None:
            assert str(node["stage"]) in stages
    for artifact in wf.DEFINITION["artifact_kinds"]:
        assert str(artifact["kind"]) in artifact_kinds
        for item_kind in artifact.get("item_kinds", []):
            assert str(item_kind) in item_kinds


def test_checkpoint_options_route_and_default_exactly_once() -> None:
    nodes = wf.nodes()
    per_node_targets: dict[str, set[str]] = {node_id: set() for node_id in nodes}
    for edge in wf.edges():
        if "option" in edge:
            per_node_targets.setdefault(str(edge["source"]), set()).add(str(edge["option"]))

    for node_id, node in wf.checkpoint_nodes().items():
        options = {str(option["key"]) for option in node.get("options", [])}
        is_defaults = [option for option in node.get("options", []) if option.get("is_default")]
        assert len(is_defaults) == 1, f"{node_id} needs exactly one default option"
        assert options, f"{node_id} has no options"
        routed = per_node_targets.get(node_id, set())
        assert options == routed, f"{node_id} options {options} != edges {routed}"


def test_every_item_kind_has_a_home() -> None:
    homed = {
        str(kind)
        for artifact in wf.DEFINITION["artifact_kinds"]
        for kind in artifact.get("item_kinds", [])
    }
    assert homed == set(wf.item_kinds())


def test_value_from_targets_a_per_project_artifact() -> None:
    # Every x-value-from reference found in the content schemas names a
    # `per_project: one` artifact kind and a list-of-strings field of it.
    artifact_kinds = wf.artifact_kinds()
    for kind in registry.all_kinds():
        schema = dict(registry.schema_dict(kind))
        for spec in schema.get("properties", {}).values():
            if not isinstance(spec, dict) or "x-value-from" not in spec:
                continue
            artifact_kind, field_name = str(spec["x-value-from"]).split(".", maxsplit=1)
            artifact = artifact_kinds.get(artifact_kind)
            assert artifact is not None
            assert artifact.get("per_project") == "one"
            target_schema = dict(registry.schema_dict(artifact_kind))
            target_field = target_schema.get("properties", {}).get(field_name)
            assert isinstance(target_field, dict)
            assert target_field.get("type") == "array"
            assert target_field.get("items", {}).get("type") == "string"


def test_run_parameter_defaults_validate() -> None:
    schema = wf.run_parameters_schema()
    for _name, spec in schema.get("properties", {}).items():
        default = spec.get("default")
        if default is None:
            continue
        validator = Draft202012Validator(spec)
        validator.validate(default)
    targets = schema["properties"]["target_personas_num"]["default"]
    maximum = schema["properties"]["max_personas"]["default"]
    assert maximum >= targets, "max_personas must not be lower than target_personas_num"


def test_state_schema_is_valid_json_schema() -> None:
    Draft202012Validator.check_schema(wf.state_schema())
