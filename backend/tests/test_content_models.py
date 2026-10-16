"""The typed content models mirror the canonical schemas, field for field.

A test fails the moment a schema file and its model drift apart — the two are
written together or not at all.
"""

from __future__ import annotations

from typing import Any, get_args, get_type_hints

import pytest
from pydantic import BaseModel

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.domain import registry

_JSON_TYPE_TO_PY = {"string": "str", "integer": "int", "array": "list", "object": "dict"}


@pytest.mark.parametrize("kind", sorted(registry.CONTENT_MODELS))
def test_model_fields_match_schema_properties(kind: str) -> None:
    model = registry.content_model(kind)
    schema = dict(registry.schema_dict(kind))
    properties: dict[str, Any] = schema["properties"]
    hints = get_type_hints(model)

    assert set(hints) == set(properties), (
        f"{kind}: model lists {sorted(hints)}, schema lists {sorted(properties)}"
    )

    for field, spec in properties.items():
        annotation = hints[field]
        types = spec.get("type")
        type_list = types if isinstance(types, list) else [types]
        args = {
            arg if isinstance(arg, str) else getattr(arg, "__name__", str(arg))
            for arg in get_args(annotation)
        }

        # Nullability: the schema allows null exactly when the annotation does.
        schema_nullable = "null" in type_list
        model_nullable = "NoneType" in args or str(annotation).endswith("| None")
        assert schema_nullable == model_nullable, f"{kind}.{field}: nullability differs"

        # Enum values: a Literal annotation lists exactly the schema's values.
        enum_values = spec.get("enum")
        if isinstance(enum_values, list) and None not in enum_values:
            literals = {arg for arg in get_args(annotation) if isinstance(arg, str)}
            assert literals == {str(value) for value in enum_values}, (
                f"{kind}.{field}: literals {literals} != enum {enum_values}"
            )

        # Base type: the annotation mentions the Python type of the JSON type.
        if enum_values is None or spec.get("x-value-list"):
            expected = {_JSON_TYPE_TO_PY[value] for value in type_list if value in _JSON_TYPE_TO_PY}
            signature = repr(annotation)
            assert any(marker in signature for marker in expected), (
                f"{kind}.{field}: {signature} does not cover the schema types {types}"
            )


def test_every_schema_marks_every_field_required() -> None:
    for kind in registry.all_kinds():
        schema = dict(registry.schema_dict(kind))
        assert set(schema["required"]) == set(schema["properties"]), (
            f"{kind}: optionality is expressed with nullable types, not missing fields"
        )


def test_every_model_is_strict() -> None:
    for kind, model in registry.CONTENT_MODELS.items():
        assert issubclass(model, BaseModel), kind
        assert model.model_config.get("extra") == "forbid", f"{kind} must reject unknown fields"


def test_schema_versions_mirror_the_definition() -> None:
    kinds = wf.DEFINITION["artifact_kinds"] + wf.DEFINITION["item_kinds"]
    for entry in kinds:
        kind = str(entry["kind"])
        version = int(entry["schema_version"])
        assert registry.schema_version(kind) == version, f"{kind} diverged from the definition"
    known = {str(entry["kind"]) for entry in kinds}
    unheard = set(registry.SCHEMA_VERSIONS) - known
    assert not unheard, f"SCHEMA_VERSIONS names unknown kinds: {unheard}"
