"""The notes of a structured answer are read while the answer is still being written."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, cast

import pytest

from khoailanggraph.features.runs.executor import UsageGate
from khoailanggraph.llm.note_stream import NoteStream, fit_note

if TYPE_CHECKING:
    from khoailanggraph.features.runs.executor import RunWalker

ANSWER = {
    "notes": [
        {"kind": "doing", "text": 'I read the "interviews" first, {all of them}.'},
        {"kind": "finding", "text": "Two people **disagree** on who approves."},
    ],
    "report": "I finished.",
    "objectives": ["a", "b"],
}
NOTES = ANSWER["notes"]


def _read(pieces: list[str]) -> list[list[dict[str, str]]]:
    stream = NoteStream()
    return [stream.feed(piece) for piece in pieces]


def test_a_note_is_returned_when_its_closing_brace_arrives() -> None:
    text = json.dumps(ANSWER)
    first_end = text.index("}", text.index("{all of them}") + len("{all of them}")) + 1

    rounds = _read([text[: first_end - 1], text[first_end - 1 : first_end], text[first_end:]])

    assert rounds[0] == []
    assert rounds[1] == [NOTES[0]]
    assert rounds[2] == [NOTES[1]]


@pytest.mark.parametrize("size", [1, 2, 3, 5, 7, 16, 1000])
def test_the_notes_are_the_same_whatever_the_size_of_the_pieces(size: int) -> None:
    text = json.dumps(ANSWER, ensure_ascii=False, indent=2)

    rounds = _read([text[start : start + size] for start in range(0, len(text), size)])

    assert [note for notes in rounds for note in notes] == NOTES


def test_no_note_comes_twice() -> None:
    stream = NoteStream()
    text = json.dumps(ANSWER)

    first = stream.feed(text)
    again = stream.feed(" ")

    assert first == NOTES
    assert again == []


def test_an_empty_list_and_an_answer_without_notes_give_nothing() -> None:
    assert _read([json.dumps({"notes": [], "report": "x"})]) == [[]]
    assert _read([json.dumps({"report": "x"})]) == [[]]


def test_a_key_called_notes_inside_a_later_value_is_not_read() -> None:
    padding = "x" * 2500
    text = json.dumps({"report": padding, "other": '"notes": [{"kind": "doing", "text": "no"}]'})

    assert _read([text]) == [[]]


def test_only_the_first_notes_are_kept() -> None:
    many = {"notes": [{"kind": "doing", "text": str(number)} for number in range(6)]}

    notes = NoteStream(max_notes=3).feed(json.dumps(many))

    assert [note["text"] for note in notes] == ["0", "1", "2"]


def test_an_object_that_is_not_a_note_is_skipped() -> None:
    text = json.dumps({"notes": [{"kind": "doing"}, {"kind": "finding", "text": "ok"}]})

    assert _read([text]) == [[{"kind": "finding", "text": "ok"}]]


class _Walker:
    """Stands in for the walk of a run: it keeps what the gate hands it."""

    def __init__(self) -> None:
        self.text: list[str] = []
        self.notes: list[dict[str, str]] = []

    def buffer_text(self, text: str) -> None:
        self.text.append(text)

    def stream_note(self, note: dict[str, str]) -> None:
        self.notes.append(dict(note))


def test_the_gate_sends_each_note_while_the_answer_is_still_coming() -> None:
    walker = _Walker()
    gate = UsageGate(cast("RunWalker", walker))
    text = json.dumps(ANSWER)
    cut = text.index("report")

    for start in range(0, cut, 9):
        gate.record_text("analyst", text[start : min(start + 9, cut)])

    # Both notes are out before the rest of the answer has been written.
    assert walker.notes == NOTES
    assert "report" not in "".join(walker.text)


def test_a_note_that_is_too_long_is_cut_at_a_word_and_ends_with_dots() -> None:
    short = "I am comparing the two groups."
    long = "I am comparing " + "what the students and the librarians say about booking " * 5

    assert fit_note(short) == short
    cut = fit_note(long)
    assert len(cut) <= 160
    assert cut.endswith("...")
    assert not cut[:-3].endswith(" "), "the cut falls after a whole word"
    assert long.startswith(cut[:-3])
    assert fit_note("word " * 100, 20) == "word word word..."
