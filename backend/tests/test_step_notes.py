"""Which notes of a step are kept, and what they carry."""

from __future__ import annotations

from khoailanggraph.features.artifacts.service import step_note_fields


def test_a_note_of_a_tool_keeps_the_name_of_the_tool() -> None:
    note = {"kind": "tool", "tool": "search", "text": "Looking at what students say."}

    assert step_note_fields(note) == note


def test_a_note_of_another_kind_carries_no_tool() -> None:
    kept = step_note_fields({"kind": "finding", "tool": "search", "text": "A gap."})

    assert kept == {"kind": "finding", "text": "A gap."}


def test_a_note_of_a_tool_the_definition_does_not_list_is_left_out() -> None:
    assert step_note_fields({"kind": "tool", "tool": "teleport", "text": "Jumping."}) is None
    assert step_note_fields({"kind": "tool", "text": "No tool named."}) is None


def test_an_empty_note_or_one_of_an_unknown_kind_is_left_out() -> None:
    assert step_note_fields({"kind": "doing", "text": "  "}) is None
    assert step_note_fields({"kind": "mood", "text": "Happy."}) is None


def test_a_long_note_is_shortened() -> None:
    kept = step_note_fields({"kind": "doing", "text": "word " * 100})

    assert kept is not None
    assert len(kept["text"]) <= 160
