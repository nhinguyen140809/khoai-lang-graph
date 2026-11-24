"""The catalog of the faces of people, read from the package's copy of the docs.

`docs/faces/faces.catalog.json` is the source of the copy (`scripts/sync_from_docs.py` writes
it). A face spec names a variant of a part and a token of a color role by key, never a value: the
keys are the vocabulary that this module hands out, and the README of the docs holds the rules that
keep the catalog in agreement with the web app that draws it.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from importlib import resources
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Mapping

_PACKAGE = "khoailanggraph.domain"

# The age of a person as the catalog tags it, by the first number of their age range: a child of
# seven to ten, a teen of eleven to nineteen, an adult, and an elder from sixty-five on.
_AGE_BOUNDS = (
    (11, "child"),
    (20, "teen"),
    (65, "adult"),
)
_AGE_RANGE_NUMBER = re.compile(r"\d+")


@lru_cache(maxsize=1)
def face_catalog() -> dict[str, Any]:
    """The catalog of the faces, parsed: styles, tag categories, parts, colors, palettes."""
    raw = (resources.files(_PACKAGE) / "faces" / "faces.catalog.json").read_text(encoding="utf-8")
    return dict(json.loads(raw))


def styles() -> list[str]:
    """The keys of the styles of drawing a face."""
    return [str(entry["key"]) for entry in face_catalog()["styles"]]


def parts() -> list[dict[str, Any]]:
    """The parts of a face of the first style, each with its variants and whether it is optional."""
    return [dict(entry) for entry in face_catalog()["parts"]]


def part_of(key: str) -> dict[str, Any] | None:
    """The part with this key, if the catalog has one."""
    return next((entry for entry in face_catalog()["parts"] if entry["key"] == key), None)


def variant_of(part: str, key: str) -> dict[str, Any] | None:
    """The variant of a part with this key, if the part has one."""
    return next(
        (entry for entry in (part_of(part) or {}).get("variants", []) if entry["key"] == key),
        None,
    )


def color_roles() -> list[str]:
    """The roles of the colors of the art, by key."""
    return [str(entry["role"]) for entry in face_catalog()["colors"]]


def palette_of(key: str) -> dict[str, Any] | None:
    """The palette with this key, if the catalog has one."""
    return next(
        (entry for entry in face_catalog()["palettes"] if entry["key"] == key),
        None,
    )


def token_of(role: str, key: str) -> dict[str, Any] | None:
    """The token of a color role with this key, if the role has one."""
    return next(
        (
            entry
            for entry in face_catalog()["colors"]
            if entry["role"] == role
            for token in entry.get("tokens", [])
            if token["key"] == key
        ),
        None,
    )


def age_tag_of(age_range: str) -> str | None:
    """The age tag that a person's age range fits, as the catalog tags its variants.

    The first number of the range stands for the person ("20-22" is twenty); a range that names no
    number fits every age, so None says the check does not apply.
    """
    match = _AGE_RANGE_NUMBER.search(str(age_range or ""))
    if match is None:
        return None
    age = int(match.group())
    for bound, tag in _AGE_BOUNDS:
        if age < bound:
            return tag
    return "elder"


def _tag_line(tags: Mapping[str, Any]) -> str:
    return " ".join(
        f"{category}={','.join(str(value) for value in values)}"
        for category, values in sorted(tags.items())
        if values
    )


def catalog_view_lines() -> list[str]:
    """The catalog as one line per choice, for a prompt that picks a face from it.

    Every variant of every part and every palette is a line, with the tags that say whom it fits;
    a part that a face may go without says so. The one style of the catalog is named once: a spec
    names it, and only its parts and palettes are listed here.
    """
    catalog = face_catalog()
    lines = [f"style {entry['key']} ({entry['title']})" for entry in catalog["styles"]]
    lines.append(
        "tags "
        + " ".join(
            f"{entry['key']}={','.join(str(value) for value in entry['values'])}"
            for entry in catalog["tagCategories"]
        )
    )
    for part in catalog["parts"]:
        title = str(part["key"]) + (" (optional)" if part.get("optional") else "")
        lines.append(f"part {title}")
        for variant in part["variants"]:
            line = f"  {variant['key']} ({variant['title']})"
            tagged = _tag_line(variant.get("tags", {}))
            lines.append(f"{line} [{tagged}]" if tagged else line)
    for palette in catalog["palettes"]:
        line = f"palette {palette['key']} ({palette['title']})"
        tagged = _tag_line(palette.get("tags", {}))
        if tagged:
            line = f"{line} [{tagged}]"
        lips = palette.get("lips")
        if lips:
            line = f"{line} lips={','.join(str(token) for token in lips)}"
        lines.append(line)
    return lines
