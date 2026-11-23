"""The assistance definition is valid against its schema, and agrees with the code that runs it:
the tools it names are the reads the assistant makes, and the acts it names are in the catalog."""

from __future__ import annotations

import json
from importlib import resources
from typing import Any, get_args

import pytest
from jsonschema import Draft202012Validator

from khoailanggraph.agents.assistance import definition as assistance
from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.features.assistant.schemas import ToolName
from khoailanggraph.features.assistant.tools import READ_TOOLS


@pytest.fixture
def definition_schema() -> dict[str, Any]:
    raw = (
        resources.files("khoailanggraph.agents.requirements_engineering") / "definition.schema.json"
    ).read_text(encoding="utf-8")
    return dict(json.loads(raw))


def test_the_definition_validates_against_the_schema(definition_schema: dict[str, Any]) -> None:
    Draft202012Validator(definition_schema).validate(assistance.DEFINITION)


def test_the_graph_runs_from_start_through_the_assistant_to_the_end() -> None:
    nodes = {str(node["id"]): node for node in assistance.DEFINITION["nodes"]}
    kinds = [node["kind"] for node in nodes.values()]
    assert kinds.count("start") == 1
    assert kinds.count("end") == 1
    edges = [(str(edge["source"]), str(edge["target"])) for edge in assistance.DEFINITION["edges"]]
    assert edges == [("__start__", "assistant"), ("assistant", "__end__")]
    roles = {str(role["key"]) for role in assistance.DEFINITION["agent_roles"]}
    stages = {str(stage["key"]) for stage in assistance.DEFINITION["stages"]}
    assert nodes["assistant"]["agent_role"] in roles
    assert nodes["assistant"]["stage"] in stages
    assert set(assistance.DEFINITION["entry"].values()) == {"assistant"}


def test_it_is_not_the_requirements_engineering_workflow() -> None:
    assert assistance.WORKFLOW_NAME != wf.WORKFLOW_NAME
    assert assistance.WORKFLOW_NAME == "assistance"


def test_the_tools_it_names_are_the_reads_that_the_assistant_makes() -> None:
    declared = set(assistance.tools())
    assert declared == {tool.name for tool in READ_TOOLS}, "a read and its declaration go together"
    assert declared == set(get_args(ToolName)), "the names the model may give are the declared ones"


def test_every_tool_has_its_words_and_acts_of_the_catalog() -> None:
    catalog = wf.act_catalog()
    for key, tool in assistance.tools().items():
        assert tool["title"].strip(), key
        assert tool["uses"]["one"].strip(), key
        assert "{count}" in tool["uses"]["other"], key
        for act in tool.get("acts", []):
            assert act in catalog, f"{key} names the unknown act {act}"
    for stage in assistance.DEFINITION["stages"]:
        for act in stage.get("acts", []):
            assert act in catalog, f"stage {stage['key']} names the unknown act {act}"


def test_the_reads_for_one_message_are_a_parameter_within_its_bounds() -> None:
    spec = assistance.DEFINITION["run_parameters_schema"]["properties"]["max_reads"]
    assert spec["minimum"] <= assistance.max_reads() <= spec["maximum"]
