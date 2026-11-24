"""A face spec: what a face looks like, as the catalog of the faces names it.

The spec is the contract between the workflow that picks a face (the persona generator, a tool of
the assistant) and the clients that draw it: the variant of each part and the token of each color
role, by key. What it does not name comes from the seed of the item on the client; `sanitize_face`
is the gate that keeps a spec to what the catalog holds before it is stored.
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from khoailanggraph.domain.faces import catalog


class FaceSpec(BaseModel):
    """How a face looks, named by the catalog of the faces.

    Mirrors the face field of a persona item (items/persona/v3): a style, a palette of colors
    that go together, the variant of a part (`null` for a part a face may go without), and the
    token of a color role in place of the one of the palette.
    """

    model_config = ConfigDict(extra="forbid")

    style: str = Field(description="The style of the art that draws the face, such as plain.")
    palette: str | None = Field(
        default=None,
        description="The palette of the face, by its key: the colors that go together.",
    )
    parts: dict[str, str | None] = Field(
        default_factory=dict,
        description=(
            "The variant of a part of the face by its key; null says the face has none of a part "
            "it may go without."
        ),
    )
    colors: dict[str, str] = Field(
        default_factory=dict,
        description="The token of a color role by its key, in place of the one of the palette.",
    )


def _fits(tags: object, age_tag: str | None) -> bool:
    """Whether the tags of a choice carry the age of the person; every age when there is none."""
    if age_tag is None or not isinstance(tags, dict):
        return True
    values = [str(value) for value in tags.get("age", [])]
    return not values or age_tag in values


def _kept_parts(spec: FaceSpec, age_tag: str | None) -> tuple[dict[str, str | None], list[str]]:
    """The parts of the spec that the catalog holds, and what was dropped to get there.

    A part unknown to the catalog, a variant that is not the part's, `null` for a part a face may
    not go without, and a variant whose tags do not carry the age of the person are left out; the
    client draws the part from the seed instead.
    """
    parts: dict[str, str | None] = {}
    notes: list[str] = []
    for part_key, variant_key in spec.parts.items():
        part = catalog.part_of(part_key)
        if part is None:
            notes.append(f"part '{part_key}' is not a part of the catalog")
            continue
        if variant_key is None:
            if part.get("optional"):
                parts[part_key] = None
            else:
                notes.append(f"part '{part_key}' is one a face may not go without")
            continue
        variant = catalog.variant_of(part_key, variant_key)
        if variant is None:
            notes.append(f"'{variant_key}' is not a variant of '{part_key}'")
            continue
        if not _fits(variant.get("tags"), age_tag):
            notes.append(f"variant '{variant_key}' does not fit the age '{age_tag}'")
            continue
        parts[part_key] = variant_key
    return parts, notes


def _kept_palette(spec: FaceSpec, age_tag: str | None) -> tuple[str | None, list[str]]:
    """The palette of the spec that the catalog holds and that fits the age of the person."""
    if spec.palette is None:
        return None, []
    palette = catalog.palette_of(spec.palette)
    if palette is None:
        return None, [f"palette '{spec.palette}' is not a palette of the catalog"]
    if not _fits(palette.get("tags"), age_tag):
        return None, [f"palette '{spec.palette}' does not fit the age '{age_tag}'"]
    return spec.palette, []


def _kept_colors(
    spec: FaceSpec, age_tag: str | None, palette: str | None
) -> tuple[dict[str, str], list[str]]:
    """The color tokens of the spec that the catalog holds and that fit, and what was dropped.

    A lip color comes from the lips of the palette the spec names: a mouth token that is not one
    of them is dropped, and the face keeps the dark tone the palette draws the mouth in.
    """
    lips = ((catalog.palette_of(palette) or {}) if palette is not None else {}).get("lips") or []
    colors: dict[str, str] = {}
    notes: list[str] = []
    for role, token_key in spec.colors.items():
        token = catalog.token_of(role, token_key)
        if token is None:
            notes.append(f"'{token_key}' is not a token of the color '{role}'")
            continue
        if not _fits(token.get("tags"), age_tag):
            notes.append(f"token '{token_key}' does not fit the age '{age_tag}'")
            continue
        if role == "mouth" and palette is not None and lips and token_key not in lips:
            notes.append(f"token '{token_key}' is not a lip color of the palette '{palette}'")
            continue
        colors[role] = token_key
    return colors, notes


def sanitize_face(spec: FaceSpec, age_tag: str | None) -> tuple[FaceSpec | None, list[str]]:
    """A face spec that only names what the catalog holds, and what it dropped to get there.

    The age tag (see `catalog.age_tag_of`) is the age of the person the face is for: a choice the
    catalog tags with ages it does not carry is dropped, not stored, and the client draws the
    part from the seed instead. A spec whose style the catalog does not hold is dropped whole.
    """
    if spec.style not in catalog.styles():
        return None, [f"style '{spec.style}' is not a style of the catalog"]

    parts, part_notes = _kept_parts(spec, age_tag)
    palette, palette_notes = _kept_palette(spec, age_tag)
    colors, color_notes = _kept_colors(spec, age_tag, palette)

    kept = FaceSpec(style=spec.style, palette=palette, parts=parts, colors=colors)
    return kept, [*part_notes, *palette_notes, *color_notes]
