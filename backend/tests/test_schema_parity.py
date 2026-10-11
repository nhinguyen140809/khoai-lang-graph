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
DOCS_DEFINITION = REPO_ROOT / "docs" / "workflow" / "requirements_engineering.v1.json"
MOCKS_SCHEMAS = REPO_ROOT / "frontend" / "src" / "mocks" / "data" / "content-schemas"
MOCKS_DEFINITION = (
    REPO_ROOT
    / "frontend"
    / "src"
    / "mocks"
    / "data"
    / "workflow"
    / "requirements_engineering.v1.json"
)
EXPORT_SCRIPT = BACKEND_ROOT / "scripts" / "export_content_schemas.py"


def _docs_schema(kind: str) -> Path:
    group = "artifacts" if registry.is_artifact(kind) else "items"
    return DOCS_SCHEMAS / group / registry.schema_filename(kind)


def test_every_kind_has_a_docs_and_a_mocks_copy() -> None:
    kinds = registry.all_kinds()
    assert len(kinds) == 19

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

    assert len(written) == 20
    for path in written:
        expected = (
            workflow.definition_bytes()
            if path.name == "requirements_engineering.v1.json"
            else registry.schema_bytes(path.name.removesuffix(".v1.json"))
        )
        assert path.read_bytes() == expected, f"exported file diverged: {path.name}"
