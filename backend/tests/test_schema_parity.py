"""Phase B gate: the exported schemas are byte-identical everywhere.

The package resources are the source; docs/schemas, the workflow definition
and the frontend mock copies must contain the same bytes, and the export
script writes exactly those bytes.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Any

import pytest

from khoailanggraph.agents.requirements_engineering import definition as workflow
from khoailanggraph.domain import registry

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
DOCS_SCHEMAS = REPO_ROOT / "docs" / "schemas"
MOCKS_SCHEMAS = REPO_ROOT / "frontend" / "src" / "mocks" / "data" / "content-schemas"
# The current definition version, exported under its own name; older files,
# like requirements_engineering.v1.json, stay in place as history.
_DEFINITION_EXPORT_BASE = REPO_ROOT / "docs" / "workflow"
_MOCKS_EXPORT_BASE = REPO_ROOT / "frontend" / "src" / "mocks" / "data" / "workflow"
_EXPORT_NAME = f"requirements_engineering.v{workflow.WORKFLOW_VERSION}.json"
DOCS_DEFINITION = _DEFINITION_EXPORT_BASE / _EXPORT_NAME
MOCKS_DEFINITION = _MOCKS_EXPORT_BASE / _EXPORT_NAME
EXPORT_SCRIPT = BACKEND_ROOT / "scripts" / "export_content_schemas.py"


def _docs_schema(kind: str) -> Path:
    group = "artifacts" if registry.is_artifact(kind) else "items"
    return DOCS_SCHEMAS / group / registry.schema_filename(kind)


def test_every_kind_has_a_docs_and_a_mocks_copy() -> None:
    kinds = registry.all_kinds()
    assert len(kinds) == 22

    for kind in kinds:
        assert _docs_schema(kind).is_file(), f"docs copy missing for {kind}"
        assert (MOCKS_SCHEMAS / registry.schema_filename(kind)).is_file(), (
            f"mocks copy missing for {kind}"
        )


@pytest.mark.parametrize("kind", sorted(registry.CONTENT_MODELS))
def test_schema_bytes_match_docs_and_mocks(kind: str) -> None:
    package = registry.schema_bytes(kind)

    assert package == _docs_schema(kind).read_bytes()
    assert package == (MOCKS_SCHEMAS / registry.schema_filename(kind)).read_bytes()


def test_definition_bytes_match_docs_and_mocks() -> None:
    package = workflow.definition_bytes()

    assert package == DOCS_DEFINITION.read_bytes()
    assert package == MOCKS_DEFINITION.read_bytes()


def _load_export_module() -> Any:
    spec = importlib.util.spec_from_file_location("export_content_schemas", EXPORT_SCRIPT)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_export_script_writes_the_same_bytes(tmp_path: Path) -> None:
    export = _load_export_module().export
    written: list[Path] = export(tmp_path)

    assert len(written) == 23
    kind_by_filename = {registry.schema_filename(kind): kind for kind in registry.all_kinds()}
    for path in written:
        if path.name == f"requirements_engineering.v{workflow.WORKFLOW_VERSION}.json":
            expected = workflow.definition_bytes()
        else:
            expected = registry.schema_bytes(kind_by_filename[path.name])
        assert path.read_bytes() == expected, f"exported file diverged: {path.name}"
