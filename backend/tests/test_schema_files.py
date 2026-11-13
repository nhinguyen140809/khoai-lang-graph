"""The rules of `docs/schemas/README.md` that a JSON Schema cannot express.

Every file of `docs/schemas/` is checked against the meta schema, then
against the rules that relate a file to itself, to its name and to the
workflow definition versions that use it.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator

REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMAS = REPO_ROOT / "docs" / "schemas"
WORKFLOW = REPO_ROOT / "docs" / "workflow"
META = json.loads((SCHEMAS / "content-schema.meta.schema.json").read_text(encoding="utf-8"))
FILES = sorted([*(SCHEMAS / "artifacts").glob("*.json"), *(SCHEMAS / "items").glob("*.json")])
DEFINITIONS = [
    json.loads(path.read_text(encoding="utf-8"))
    for path in sorted(WORKFLOW.glob("requirements_engineering.v*.json"))
]


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def _ids(path: Path) -> str:
    return f"{path.parent.name}/{path.name}"


@pytest.mark.parametrize("path", FILES, ids=_ids)
def test_file_follows_the_meta_schema(path: Path) -> None:
    errors = sorted(error.message for error in Draft202012Validator(META).iter_errors(_load(path)))

    assert errors == []


@pytest.mark.parametrize("path", FILES, ids=_ids)
def test_name_and_id_agree(path: Path) -> None:
    schema = _load(path)
    kind, version = schema["x-kind"], schema["x-schema-version"]

    assert schema["$id"] == f"{path.parent.name}/{kind}/v{version}"
    assert schema["x-level"] == path.parent.name.removesuffix("s")
    assert path.name == f"{kind}.v{version}.json"


@pytest.mark.parametrize("path", FILES, ids=_ids)
def test_required_and_field_order_list_every_property(path: Path) -> None:
    schema = _load(path)
    names = list(schema["properties"])

    assert sorted(schema["required"]) == sorted(names)
    assert sorted(schema["x-ui-field-order"]) == sorted(names)


@pytest.mark.parametrize("path", FILES, ids=_ids)
def test_named_fields_are_properties(path: Path) -> None:
    schema = _load(path)
    names = set(schema["properties"])
    named = [
        schema[key]
        for key in ("x-ui-title-field", "x-ui-role-field", "x-ui-participants-field")
        if key in schema
    ]
    named += schema.get("x-ui-list-fields", [])

    assert set(named) <= names


@pytest.mark.parametrize("path", FILES, ids=_ids)
def test_title_of_a_navigable_kind_is_short(path: Path) -> None:
    schema = _load(path)
    if schema.get("x-ui-navigable") is not True:
        pytest.skip("not a navigable kind")
    description = schema["properties"][schema["x-ui-title-field"]]["description"]

    assert "60 characters" in description


@pytest.mark.parametrize("path", FILES, ids=_ids)
def test_value_lists_exist_in_a_definition_that_uses_the_file(path: Path) -> None:
    schema = _load(path)
    kind, version = schema["x-kind"], schema["x-schema-version"]
    users = [
        definition
        for definition in DEFINITIONS
        if any(
            entry["kind"] == kind and entry["schema_version"] == version
            for entry in [*definition["artifact_kinds"], *definition["item_kinds"]]
        )
    ]

    for name, field in schema["properties"].items():
        assert not ("enum" in field and "x-value-list" in field), f"{name}: enum and x-value-list"
        if "x-value-list" in field:
            assert users, f"{kind} v{version} is used by no definition"
            for definition in users:
                keys = {entry["key"] for entry in definition["value_lists"]}
                assert field["x-value-list"] in keys, f"{name}: no list {field['x-value-list']}"
