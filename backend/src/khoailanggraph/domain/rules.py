"""Integrity rules over artifact and item content (docs/DATA_SHAPE §8).

Every check is a pure function of the data it needs; the caller (the artifact
feature, the workflow, a test) reads the data a check requires and passes it
in — the domain itself does no I/O. Content failures are returned as
`Violation` rows; a save path collects them and raises one `IntegrityError`
when the write must be rejected.

The definition parts a check needs are passed in already keyed by name
(`value_lists[name] = [entry, ...]`, `artifact_kinds[kind] = {...}`,
`link_types[type] = {...}`); the agents package maps the raw lists of a
definition file onto these mappings.
"""

from __future__ import annotations

import copy
import dataclasses
from typing import TYPE_CHECKING, Any

from jsonschema import Draft202012Validator

from khoailanggraph.domain.errors import Violation
from khoailanggraph.domain.links import allowed_target_kinds
from khoailanggraph.domain.registry import all_kinds, schema_dict

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence

MAX_SECTION_DEPTH = 4


def schema_with_value_lists(
    kind: str,
    value_lists: Mapping[str, Sequence[Mapping[str, Any]]],
) -> dict[str, Any]:
    """A kind's content schema with every `x-value-list` field given its enum.

    Mirrors what the client sees: the keys of the named value list of the
    definition in use become the field's enum (null appended when the field is
    nullable), and each value's description joins the field description.
    """
    schema = copy.deepcopy(dict(schema_dict(kind)))
    for _field, spec in schema.get("properties", {}).items():
        if not isinstance(spec, dict) or "x-value-list" not in spec:
            continue
        entries = list(value_lists.get(str(spec["x-value-list"]), []))
        keys = [str(entry.get("key")) for entry in entries]
        types = spec.get("type")
        nullable = isinstance(types, list) and "null" in types
        if keys:
            spec["enum"] = [*keys, None] if nullable else keys
        meanings = "; ".join(
            f"{entry.get('key')}: {entry.get('description', '')}" for entry in entries
        )
        if meanings:
            spec["description"] = f"{str(spec.get('description', '')).strip()} Values: {meanings}"
    return schema


def validate_content(
    kind: str,
    content: Mapping[str, Any],
    *,
    value_lists: Mapping[str, Sequence[Mapping[str, Any]]],
    plan_values: Mapping[str, Sequence[str]] | None = None,
) -> list[Violation]:
    """Check one artifact's or item's content against its canonical schema.

    `value_lists` holds the named lists of the definition version in use, keyed
    by name: fields marked `x-value-list` accept the keys of their list (and
    null when the field is nullable). `plan_values` maps an `x-value-from`
    reference (e.g. `elicitation_plan.topics`) to the values the referenced
    artifact currently holds; every value of such a field, and every element
    when it is a list, must come from that list (null allowed when nullable; a
    reference with no artifact yet accepts only null).
    """
    schema = schema_with_value_lists(kind, value_lists)
    validator = Draft202012Validator(schema)
    violations = [
        Violation(
            "content",
            error.message,
            path=".".join(str(part) for part in error.absolute_path),
        )
        for error in sorted(
            validator.iter_errors(dict(content)),
            key=lambda error: list(error.absolute_path),
        )
    ]
    if plan_values is not None:
        violations.extend(_check_value_from(kind, content, plan_values))
    return violations


def _check_value_from(
    kind: str,
    content: Mapping[str, Any],
    plan_values: Mapping[str, Sequence[str]],
) -> list[Violation]:
    """Check every field marked `x-value-from` against the values the
    referenced artifact currently holds."""
    violations: list[Violation] = []
    schema = dict(schema_dict(kind))
    for field, spec in schema.get("properties", {}).items():
        if not isinstance(spec, dict):
            continue
        reference = spec.get("x-value-from")
        if not isinstance(reference, str):
            continue
        allowed = list(plan_values.get(reference, []))
        value = content.get(field)
        values = value if isinstance(value, list) else [value]
        for entry in values:
            if entry is not None and entry not in allowed:
                violations.append(
                    Violation(
                        "plan values",
                        f"{entry!r} is not one of {reference}",
                        path=field,
                    )
                )
    return violations


def check_item_in_artifact(
    item_kind: str,
    artifact_kind: str,
    artifact_kinds: Mapping[str, Mapping[str, Any]],
) -> list[Violation]:
    """Whether an item kind lives inside an artifact kind of the definition."""
    spec = artifact_kinds.get(artifact_kind)
    if spec is not None and item_kind in spec.get("item_kinds", []):
        return []
    return [Violation("item in artifact", f"{item_kind} is not an item kind of {artifact_kind}")]


def check_parent(
    parent_kind: str | None,
    item_kind: str,
    artifact_kind: str,
) -> list[Violation]:
    """Whether a parent item is valid: a section, or the epic of a user story.

    An interview transcript holds no sections, so no parent is ever valid
    there; a user story's epic is another backlog item of the same artifact.
    """
    if parent_kind is None:
        return []
    if artifact_kind == "interview_transcript":
        return [Violation("parent item", "a transcript holds one flat list, with no parents")]
    if parent_kind == "section":
        return []
    if item_kind == "backlog_item" and parent_kind == "backlog_item":
        return []
    return [
        Violation(
            "parent item",
            f"an item of kind {item_kind} cannot sit inside a parent of kind {parent_kind}",
        )
    ]


def check_section_placement(artifact_kind: str, item_kind: str) -> list[Violation]:
    """A section is never created in an interview transcript."""
    if item_kind == "section" and artifact_kind == "interview_transcript":
        return [Violation("section placement", "a transcript holds no sections")]
    return []


def check_item_tree(
    items: Sequence[Mapping[str, Any]],
    max_depth: int = MAX_SECTION_DEPTH,
) -> list[Violation]:
    """Whether every item's parent chain stays acyclic and shallow enough.

    Each item carries an `id`, a nullable `parent` id and (for the depth
    rule to hold at all) the sections below the limit; the waiver: only
    sections can nest, and no deeper than `max_depth`.
    """
    parents = {str(item["id"]): item.get("parent") for item in items}
    violations: list[Violation] = []
    for item_id, parent in parents.items():
        seen: set[str] = set()
        cursor = parent
        depth = 0
        while cursor is not None:
            if cursor == item_id:
                violations.append(Violation("tree", f"{item_id} is its own ancestor", path=item_id))
                break
            if cursor in seen:
                break
            seen.add(cursor)
            depth += 1
            if depth > max_depth:
                violations.append(
                    Violation(
                        "tree",
                        f"{item_id} nests deeper than {max_depth}",
                        path=item_id,
                    )
                )
                break
            cursor = parents.get(cursor)
    return violations


@dataclasses.dataclass(frozen=True, slots=True)
class LinkCandidate:
    """One link a save path wants to write, before the rules accept it."""

    link_type: str
    source_id: str
    source_kind: str
    target_id: str
    target_kind: str


def check_link(
    link: LinkCandidate,
    *,
    link_types: Mapping[str, Mapping[str, Any]],
) -> list[Violation]:
    """The per-link rules: no section endpoints, no self link, allowed pair."""
    violations: list[Violation] = []
    if link.source_kind == "section" or link.target_kind == "section":
        violations.append(Violation("link endpoints", "a section is never linked"))
    if link.source_id == link.target_id:
        violations.append(Violation("no self link", link.source_id))
    if link.target_kind not in allowed_target_kinds(
        link.link_type, link.source_kind, link_types, all_kinds()
    ):
        violations.append(
            Violation(
                "link type",
                f"{link.source_kind} -> {link.target_kind} is not a pair of {link.link_type}",
            )
        )
    return violations
