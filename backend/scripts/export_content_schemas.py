#!/usr/bin/env python
"""Export the canonical content schemas and the workflow definition.

Writes the exact package bytes — the files the domain layer and the agents
package hold as the source of their schemas — into a target directory:

    uv run python scripts/export_content_schemas.py [--target DIR]

The default target is `exported/`. The gate: every exported file is
byte-identical to `docs/schemas/**` (+ `docs/workflow/definition` JSON) and to
the copies the frontend mocks serve (`frontend/src/mocks/data/**`).
"""

from __future__ import annotations

import argparse
from pathlib import Path

from khoailanggraph.agents.requirements_engineering import definition as workflow
from khoailanggraph.domain import registry

_DEFINITION_EXPORT_NAME = "requirements_engineering.v1.json"


def export(target: Path) -> list[Path]:
    """Write all 20 canonical files into `target`, returning what it wrote."""
    target.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for kind in registry.all_kinds():
        path = target / registry.schema_filename(kind)
        path.write_bytes(registry.schema_bytes(kind))
        written.append(path)
    path = target / _DEFINITION_EXPORT_NAME
    path.write_bytes(workflow.definition_bytes())
    written.append(path)
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--target",
        type=Path,
        default=Path("exported"),
        help="directory the canonical files are written to (default: exported/)",
    )
    args = parser.parse_args()
    written = export(args.target)
    names = sorted(path.name for path in written)
    print(f"exported {len(written)} canonical files to {args.target}")
    for name in names:
        print(f"  {name}")


if __name__ == "__main__":
    main()
