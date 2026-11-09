"""The package copies of the schemas and definitions are the bytes of `docs/`.

`docs/schemas/**` and `docs/workflow/` are the source; the package holds
copies so that it runs without the repository, and `scripts/sync_from_docs.py`
writes them. The gate: every copy is byte-identical to its source.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Any

import pytest

from khoailanggraph.agents.requirements_engineering import definition as workflow
from khoailanggraph.domain import registry

REPO_ROOT = Path(__file__).resolve().parents[2]
DOCS_SCHEMAS = REPO_ROOT / "docs" / "schemas"
DOCS_WORKFLOW = REPO_ROOT / "docs" / "workflow"
SYNC_SCRIPT = REPO_ROOT / "backend" / "scripts" / "sync_from_docs.py"
DOCS_DEFINITION = DOCS_WORKFLOW / f"requirements_engineering.v{workflow.WORKFLOW_VERSION}.json"


def _docs_schema(kind: str) -> Path:
    group = "artifacts" if registry.is_artifact(kind) else "items"
    return DOCS_SCHEMAS / group / registry.schema_filename(kind)


def test_every_kind_has_a_docs_copy() -> None:
    kinds = registry.all_kinds()
    assert len(kinds) == 22

    for kind in kinds:
        assert _docs_schema(kind).is_file(), f"docs copy missing for {kind}"


@pytest.mark.parametrize("kind", sorted(registry.CONTENT_MODELS))
def test_schema_bytes_match_docs(kind: str) -> None:
    assert registry.schema_bytes(kind) == _docs_schema(kind).read_bytes()


def test_definition_bytes_match_docs() -> None:
    assert workflow.definition_bytes() == DOCS_DEFINITION.read_bytes()


def test_every_published_definition_version_is_served_from_the_package() -> None:
    for source in DOCS_WORKFLOW.glob("requirements_engineering.v*.json"):
        version = int(source.stem.rsplit(".v", 1)[1])
        assert workflow.definition_bytes_for(version) == source.read_bytes()


def _load_sync_module() -> Any:
    spec = importlib.util.spec_from_file_location("sync_from_docs", SYNC_SCRIPT)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_the_package_holds_every_copy_the_sync_script_plans() -> None:
    sync = _load_sync_module()

    assert sync.differing() == []
    assert sync.stale() == []
