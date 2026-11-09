#!/usr/bin/env python
"""Copy the content schemas and the workflow definitions of `docs/` into the package.

`docs/schemas/**` and `docs/workflow/` are the source of these files; the
package holds byte-identical copies so that it runs without the repository:

    uv run python scripts/sync_from_docs.py          # write the copies
    uv run python scripts/sync_from_docs.py --check  # list the copies that differ, exit 1

What is copied:

- every `docs/schemas/{artifacts,items}/*.json` to `domain/content_schemas/`;
- every `docs/workflow/requirements_engineering.v<N>.json` to
  `agents/requirements_engineering/definition.v<N>.json`;
- `docs/workflow/definition.schema.json` to `agents/requirements_engineering/`;
- every `docs/workflow/prompts/*.md` (the template and the example prompts) to
  `agents/requirements_engineering/prompts/`. The prompts of the other roles live only in the
  package.

A copy whose source is gone is reported (and removed when writing).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PACKAGE = REPO_ROOT / "backend" / "src" / "khoailanggraph"
SCHEMAS_SRC = REPO_ROOT / "docs" / "schemas"
SCHEMAS_DST = PACKAGE / "domain" / "content_schemas"
WORKFLOW_SRC = REPO_ROOT / "docs" / "workflow"
WORKFLOW_DST = PACKAGE / "agents" / "requirements_engineering"

_DEFINITION_NAME = re.compile(r"^requirements_engineering\.v(\d+)\.json$")


def plan() -> dict[Path, Path]:
    """Destination file -> source file, for every copy the package must hold."""
    pairs: dict[Path, Path] = {}
    for level in ("artifacts", "items"):
        for source in sorted((SCHEMAS_SRC / level).glob("*.json")):
            pairs[SCHEMAS_DST / source.name] = source
    for source in sorted(WORKFLOW_SRC.glob("requirements_engineering.v*.json")):
        match = _DEFINITION_NAME.match(source.name)
        if match is not None:
            pairs[WORKFLOW_DST / f"definition.v{match.group(1)}.json"] = source
    pairs[WORKFLOW_DST / "definition.schema.json"] = WORKFLOW_SRC / "definition.schema.json"
    for source in sorted((WORKFLOW_SRC / "prompts").glob("*.md")):
        pairs[WORKFLOW_DST / "prompts" / source.name] = source
    return pairs


def stale() -> list[Path]:
    """Copies in the package whose source no longer exists."""
    wanted = set(plan())
    found = [*SCHEMAS_DST.glob("*.json"), *WORKFLOW_DST.glob("definition*.json")]
    return sorted(path for path in found if path not in wanted)


def differing() -> list[Path]:
    """Destinations that are missing or differ from their source."""
    return [
        destination
        for destination, source in plan().items()
        if not destination.is_file() or destination.read_bytes() != source.read_bytes()
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="only report, change nothing")
    args = parser.parse_args()

    changed = differing()
    extra = stale()
    if args.check:
        for path in changed:
            print(f"differs: {path.relative_to(REPO_ROOT)}")
        for path in extra:
            print(f"no source: {path.relative_to(REPO_ROOT)}")
        return 1 if changed or extra else 0

    for destination, source in plan().items():
        if destination in changed:
            destination.write_bytes(source.read_bytes())
    for path in extra:
        path.unlink()
    print(f"copied {len(changed)} files, removed {len(extra)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
