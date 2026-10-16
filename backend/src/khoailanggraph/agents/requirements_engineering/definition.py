"""Workflow definition version 2: the canonical JSON file, with accessors.

The committed `definition.v2.json` beside this module is the single description
of the graph: the name a run records, the entry points, the agent roles and
their prompt versions, the stages, the nodes with their checkpoint options,
the edges, the artifact and item kinds, the link types, the value lists, the
directive kinds, the export templates, and the schemas of the run parameters
and the workflow state. A never-published file apart, the file never changes
(runs and clients cache a version forever); version N+1 is a new file.

Version 2 adds the research stage between the planner and the persona
generator (MAJ-EVAL, arXiv:2507.21028): a corpus builder curates real
documents, a miner extracts stakeholder observations with verbatim evidence,
and the persona generator (prompt v2) grounds every persona in those
observations. `definition.v1.json` stays committed unchanged as history.

The raw lists of the file are keyed here into the mappings the checks in
`domain/rules.py` and `domain/links.py` take, so no caller re-keys them.
"""

from __future__ import annotations

import json
from importlib import resources
from typing import Any

_PACKAGE = "khoailanggraph.agents.requirements_engineering"
_DEFINITION_FILE = "definition.v2.json"

DEFINITION: dict[str, Any] = json.loads(
    (resources.files(_PACKAGE) / _DEFINITION_FILE).read_text(encoding="utf-8")
)

WORKFLOW_NAME: str = str(DEFINITION["name"])
WORKFLOW_VERSION: int = int(DEFINITION["version"])


def definition_bytes() -> bytes:
    """The exact bytes of the canonical definition file (schema export gate)."""
    return (resources.files(_PACKAGE) / _DEFINITION_FILE).read_bytes()


def _keyed(name: str) -> dict[str, dict[str, Any]]:
    """A list of `{key: ...}` entries of the definition, keyed by that key."""
    return {str(entry["key"]): entry for entry in DEFINITION[name]}


def value_lists() -> dict[str, list[dict[str, Any]]]:
    """Every named value list of the definition: name -> its value entries."""
    return {str(entry["key"]): list(entry.get("values", [])) for entry in DEFINITION["value_lists"]}


def artifact_kinds() -> dict[str, dict[str, Any]]:
    """The artifact kinds of the definition, keyed by kind."""
    return {str(entry["kind"]): entry for entry in DEFINITION["artifact_kinds"]}


def item_kinds() -> dict[str, dict[str, Any]]:
    """The item kinds of the definition, keyed by kind."""
    return {str(entry["kind"]): entry for entry in DEFINITION["item_kinds"]}


def link_types() -> dict[str, dict[str, Any]]:
    """The link types of the definition, keyed by link type."""
    return _keyed("link_types")


def agent_roles() -> dict[str, dict[str, Any]]:
    """The agent roles of the definition, keyed by role."""
    return _keyed("agent_roles")


def stages() -> list[str]:
    """The stage keys, in the order of the definition."""
    return [str(entry["key"]) for entry in DEFINITION["stages"]]


def nodes() -> dict[str, dict[str, Any]]:
    """The nodes of the definition, keyed by node id."""
    return {str(entry["id"]): entry for entry in DEFINITION["nodes"]}


def edges() -> list[dict[str, Any]]:
    """The edges of the definition, in file order."""
    return list(DEFINITION["edges"])


def checkpoint_nodes() -> dict[str, dict[str, Any]]:
    """Only the checkpoint nodes, keyed by node id."""
    return {node_id: node for node_id, node in nodes().items() if node.get("kind") == "checkpoint"}


def agent_nodes() -> dict[str, dict[str, Any]]:
    """Only the agent nodes, keyed by node id."""
    return {node_id: node for node_id, node in nodes().items() if node.get("kind") == "agent"}


def node_of_edge_options(node_id: str) -> list[dict[str, Any]]:
    """The options of a checkpoint node (empty for other nodes)."""
    return list(nodes().get(node_id, {}).get("options", []))


def run_parameters_schema() -> dict[str, Any]:
    """The JSON Schema of the run config `parameters` of this definition."""
    return dict(DEFINITION["run_parameters_schema"])


def state_schema() -> dict[str, Any]:
    """The JSON Schema of the workflow state of this definition."""
    return dict(DEFINITION["state_schema"])
