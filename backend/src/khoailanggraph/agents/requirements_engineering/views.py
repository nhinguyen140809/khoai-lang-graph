"""Prompt-view rendering of items (DATA_SHAPE §9: prompt view).

The same item has two renderings: the UI view shows everything, the prompt
view shows the key, the content fields in the order of the canonical schema,
and the outgoing trace links as lists of target keys (one field per link
type). Items are listed sorted by key, so the same items always render to
the same text — the fixed prefix of a run stays identical for the prompt
cache of the provider.
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

from khoailanggraph.domain.registry import schema_dict

if TYPE_CHECKING:
    from khoailanggraph.agents.requirements_engineering.ports import ItemRecord


def _ordered_content(kind: str, content: dict[str, object]) -> dict[str, object]:
    """The content fields in the order of the canonical schema file."""
    ordered: dict[str, object] = {}
    for field in dict(schema_dict(kind)).get("properties", {}):
        if field in content:
            ordered[field] = content[field]
    for field, value in content.items():
        if field not in ordered:
            ordered[field] = value
    return ordered


def prompt_view(item: ItemRecord) -> dict[str, Any]:
    """One item in prompt-view form: key, content, outgoing links."""
    view: dict[str, Any] = {"key": item["key"]}
    view.update(_ordered_content(item["kind"], dict(item["content"])))
    for link in item["links"]:
        view.setdefault(link["link_type"], link["targets"])
    return view


def prompt_views(items: list[ItemRecord]) -> str:
    """Every item of one list as one JSON object per line, sorted by key."""
    lines = [
        json.dumps(prompt_view(item), ensure_ascii=False)
        for item in sorted(items, key=lambda entry: entry["key"])
    ]
    return "\n".join(lines)


def summary_lines(items: list[ItemRecord], fields: tuple[str, ...]) -> str:
    """One key-stamped line per item, in the order of the keys."""
    lines: list[str] = []
    for item in sorted(items, key=lambda entry: entry["key"]):
        parts = [str(item["content"][field]) for field in fields if field in item["content"]]
        lines.append(f"{item['key']} {' — '.join(parts)}".rstrip())
    return "\n".join(lines)


def transcript_lines(
    persona_key: str,
    items: list[ItemRecord],
) -> list[str]:
    """Interview messages as `<key> <role>: <content>`, in transcript order.

    A message key is its persona's key, `#` and the position, such as
    `PER-001#4` — the form analyst.v1 expects.
    """
    return [
        f"{persona_key}#{position} {entry['content']['role']}: {entry['content']['content']}"
        for position, entry in enumerate(sorted(items, key=lambda item: item["key"]), start=1)
    ]
