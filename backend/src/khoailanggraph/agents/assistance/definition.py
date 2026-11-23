"""The definition of the assistance workflow, read from its published file.

`definition.v1.json` is a copy of `docs/workflow/assistance.v1.json`; run
`scripts/sync_from_docs.py` after a change there. It names the one agent that answers a message
about the app, the tools it may read with, and the number of reads it may make for one message.
The model-facing words of each tool live beside the code of the tool, as the words of a prompt do.
"""

from __future__ import annotations

import json
from importlib import resources
from typing import Any

_PACKAGE = "khoailanggraph.agents.assistance"
_DEFINITION_FILE = "definition.v1.json"

DEFINITION: dict[str, Any] = json.loads(
    (resources.files(_PACKAGE) / _DEFINITION_FILE).read_text(encoding="utf-8")
)

WORKFLOW_NAME: str = str(DEFINITION["name"])
WORKFLOW_VERSION: int = int(DEFINITION["version"])


def tools() -> dict[str, dict[str, Any]]:
    """The tools of the definition, keyed by tool."""
    return {str(entry["key"]): entry for entry in DEFINITION["tools"]}


def max_reads() -> int:
    """How many reads one message may make: the default of `max_reads` in the run parameters."""
    spec = DEFINITION["run_parameters_schema"]["properties"]["max_reads"]
    return int(spec["default"])
