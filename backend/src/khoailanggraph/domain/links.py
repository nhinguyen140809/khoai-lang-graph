"""Trace link rules: which source and target kinds a link type may connect.

The link type table lives in the workflow definition, so every function takes
the `link_types` part of the definition version in use as data — the domain
knows the shape, the definition supplies the names (docs/DATA_SHAPE §8).

Direction: a link always runs from the later item to the earlier one. A pair's
`source` and `target` each name one kind or a list of kinds; the special
target `any` means every kind except a section and `same` means the source
kind itself.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Mapping, Sequence

# The link types whose chains must never loop back to the source.
ACYCLIC_LINK_TYPES = frozenset({"derived_from", "depends_on", "supersedes"})

# 'any' as a pair source or target means every item kind except a section.
SECTION_KIND = "section"
_ANY_KIND = "any"
_SAME_KIND = "same"


def _kinds(value: Any) -> list[str]:
    """A pair's source or target, always as a list of kind names."""
    if isinstance(value, list):
        return [str(kind) for kind in value]
    return [str(value)]


def allowed_target_kinds(
    link_type: str,
    source_kind: str,
    link_types: Mapping[str, Mapping[str, Any]],
    all_item_kinds: Sequence[str],
) -> set[str]:
    """The item kinds a `link_type` may point at from a `source_kind`.

    An unknown link type or source kind allows nothing.
    """
    definition = link_types.get(link_type)
    if definition is None:
        return set()
    allowed: set[str] = set()
    for pair in definition.get("pairs", []):
        sources = _kinds(pair.get("source"))
        source_matches = source_kind in sources or (
            _ANY_KIND in sources and source_kind != SECTION_KIND
        )
        if source_matches:
            for target in _kinds(pair.get("target")):
                if target == _SAME_KIND:
                    allowed.add(source_kind)
                elif target == _ANY_KIND:
                    allowed.update(kind for kind in all_item_kinds if kind != SECTION_KIND)
                else:
                    allowed.add(target)
    return allowed


def link_pair_allowed(
    link_type: str,
    source_kind: str,
    target_kind: str,
    link_types: Mapping[str, Mapping[str, Any]],
    all_item_kinds: Sequence[str],
) -> bool:
    """Whether one link of `link_type` from source_kind to target_kind follows
    the pairs of the definition in use."""
    return target_kind in allowed_target_kinds(link_type, source_kind, link_types, all_item_kinds)


def has_cycle(links: Sequence[tuple[str, str, str]], link_type: str) -> bool:
    """Whether following `link_type` links (source to target) from any item
    reaches that item again.

    `links` holds `(source_id, target_id, link_type)` rows; only the rows of
    the given link type take part, and only the acyclic ones are ever checked.
    """
    graph: dict[str, set[str]] = {}
    for source_id, target_id, row_type in links:
        if row_type == link_type:
            graph.setdefault(source_id, set()).add(target_id)
    for start in graph:
        seen: set[str] = set()
        stack = list(graph.get(start, ()))
        while stack:
            node = stack.pop()
            if node == start:
                return True
            if node in seen:
                continue
            seen.add(node)
            stack.extend(graph.get(node, ()))
    return False
