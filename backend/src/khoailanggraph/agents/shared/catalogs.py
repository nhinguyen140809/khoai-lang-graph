"""The schema and the catalogs that every workflow definition refers to.

They are copies of the files of `docs/workflow/` (`scripts/sync_from_docs.py` writes them), and
belong to no workflow: a definition names acts of the act catalog in its stages and its tools, and
the commands of the command catalog are what the app may ask a client to run after an answer.
"""

from __future__ import annotations

import json
from importlib import resources
from typing import Any

_PACKAGE = "khoailanggraph.agents.shared"


def _read(name: str) -> dict[str, Any]:
    return dict(json.loads((resources.files(_PACKAGE) / name).read_text(encoding="utf-8")))


def definition_schema() -> dict[str, Any]:
    """The JSON Schema that every workflow definition is valid against."""
    return _read("definition.schema.json")


def act_catalog() -> dict[str, dict[str, Any]]:
    """The acts a client may show, keyed by act: the keys that `acts` of a stage or tool name."""
    return {str(entry["key"]): entry for entry in _read("acts.catalog.json")["acts"]}


def command_catalog() -> dict[str, dict[str, Any]]:
    """The commands the app may ask a client to run, keyed by command.

    `needs` says what is checked before a command leaves: `none`, a document (`artifact`) or an item
    (`item`) of the project, or a `review` that waits for the user.
    """
    return {str(entry["key"]): entry for entry in _read("commands.catalog.json")["commands"]}
