"""The face of a persona: the age tag of an age range, and a spec checked against the catalog.

The catalog itself (docs/faces/faces.catalog.json) holds its own rules; these tests cover the two
things the workflow does with it: turning the age range of a persona into the tag that its face
must fit, and dropping a spec that names what the catalog does not hold before it is stored.
"""

from __future__ import annotations

from typing import Any

from khoailanggraph.domain.faces import FaceSpec, age_tag_of, catalog_view_lines, sanitize_face

ADULT_FACE: dict[str, Any] = {
    "style": "plain",
    "palette": "fair-auburn-green",
    "parts": {
        "hair": "long-layered",
        "eyes": "lashed-round",
        "eyebrows": "soft-arched",
        "mouth": "small-smile",
        "nose": "button",
        "head": "oval",
        "glasses": None,
        "beard": None,
        "earrings": "stud",
        "freckles": None,
        "hairAccessories": None,
    },
    "colors": {"mouth": "coral"},
}


def test_the_age_of_a_range_is_the_tag_that_the_catalog_fits() -> None:
    assert age_tag_of("7-9") == "child"
    assert age_tag_of("12-15") == "teen"
    assert age_tag_of("18-24") == "teen"
    assert age_tag_of("20-22") == "adult"
    assert age_tag_of("60-64") == "adult"
    assert age_tag_of("65-74") == "elder"
    assert age_tag_of("70+") == "elder"
    assert age_tag_of("") is None
    assert age_tag_of("not an age") is None


def test_a_face_that_the_catalog_holds_is_kept_whole() -> None:
    face, notes = sanitize_face(FaceSpec.model_validate(ADULT_FACE), "adult")

    assert notes == []
    assert face is not None
    assert face.model_dump() == ADULT_FACE


def test_a_style_the_catalog_does_not_hold_drops_the_whole_face() -> None:
    face, notes = sanitize_face(
        FaceSpec.model_validate({**ADULT_FACE, "style": "painted"}), "adult"
    )

    assert face is None
    assert notes == ["style 'painted' is not a style of the catalog"]


def test_a_key_the_catalog_does_not_hold_is_dropped() -> None:
    face, notes = sanitize_face(
        FaceSpec.model_validate(
            {
                **ADULT_FACE,
                "parts": {**ADULT_FACE["parts"], "hat": "top-hat", "hair": "space-helmet"},
            }
        ),
        "adult",
    )

    assert face is not None
    expected = dict(ADULT_FACE["parts"])
    del expected["hair"]
    assert face.parts == expected
    assert set(notes) == {
        "part 'hat' is not a part of the catalog",
        "'space-helmet' is not a variant of 'hair'",
    }


def test_a_choice_that_does_not_fit_the_age_is_dropped() -> None:
    face, notes = sanitize_face(
        FaceSpec.model_validate(
            {
                **ADULT_FACE,
                "palette": "fair-white-gray",
                "parts": {**ADULT_FACE["parts"], "beard": "full"},
            }
        ),
        "teen",
    )

    assert face is not None
    assert face.palette is None
    assert "beard" not in face.parts
    assert {
        "palette 'fair-white-gray' does not fit the age 'teen'",
        "variant 'full' does not fit the age 'teen'",
    } <= set(notes)


def test_a_part_that_a_face_may_not_go_without_cannot_be_null() -> None:
    face, notes = sanitize_face(
        FaceSpec.model_validate({**ADULT_FACE, "parts": {**ADULT_FACE["parts"], "mouth": None}}),
        "adult",
    )

    assert face is not None
    assert "mouth" not in face.parts
    assert notes == ["part 'mouth' is one a face may not go without"]


def test_a_token_of_one_role_is_not_a_token_of_another() -> None:
    face, notes = sanitize_face(
        FaceSpec.model_validate(
            {**ADULT_FACE, "colors": {**ADULT_FACE["colors"], "skin": "ink-black"}}
        ),
        "adult",
    )

    assert face is not None
    assert face.colors == ADULT_FACE["colors"]
    assert notes == ["'ink-black' is not a token of the color 'skin'"]


def test_a_lip_color_comes_from_the_lips_of_the_palette() -> None:
    face, notes = sanitize_face(
        FaceSpec.model_validate(
            {**ADULT_FACE, "colors": {**ADULT_FACE["colors"], "mouth": "rose"}}
        ),
        "adult",
    )
    assert face is not None
    assert face.colors["mouth"] == "rose"
    assert notes == []

    face, notes = sanitize_face(
        FaceSpec.model_validate(
            {**ADULT_FACE, "colors": {**ADULT_FACE["colors"], "mouth": "fuchsia"}}
        ),
        "adult",
    )
    assert face is not None
    assert "mouth" not in face.colors
    assert notes == ["token 'fuchsia' is not a lip color of the palette 'fair-auburn-green'"]


def test_the_catalog_view_lists_every_choice_of_the_catalog() -> None:
    lines = catalog_view_lines()

    assert any(line.startswith("style plain") for line in lines)
    assert "part hair" in lines
    assert "part beard (optional)" in lines
    assert any(line.startswith("  short-side-part (") for line in lines)
    assert any(line.startswith("palette ink (") for line in lines)
    assert any(
        line.startswith("palette fair-auburn-green (") and "lips=rose,coral,mauve,red" in line
        for line in lines
    )
    assert sum(1 for line in lines if line.startswith("palette ")) == 25
    assert sum(1 for line in lines if line.startswith("  ")) == 134
