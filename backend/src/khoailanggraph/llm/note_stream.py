"""Reads the `notes` of a structured answer while the model is still writing it.

A model that answers with a structured output sends its JSON in small pieces. When `notes` is the
first field, each note is complete long before the rest of the answer, and the user can read it at
once instead of waiting for the whole call. `NoteStream` takes the pieces as they come and returns
each note of the array the moment its closing brace arrives.
"""

from __future__ import annotations

import json
import re

_NOTES_KEY = re.compile(r'"notes"\s*:\s*\[')
# The notes are the first field; a key that appears later is a value of something else.
_SEARCH_LIMIT = 2000


# The notes that one answer may carry, and the longest note, after which a note is shortened.
MAX_NOTES_PER_ANSWER = 5
NOTE_LENGTH = 160


def fit_note(text: str, limit: int = NOTE_LENGTH) -> str:
    """The note within `limit` characters: cut at the last word that fits and ended with `...`,
    instead of in the middle of a word."""
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    cut = text[: limit - 3]
    space = cut.rfind(" ")
    if space > limit // 2:
        cut = cut[:space]
    return cut.rstrip(" ,;:-.") + "..."


class NoteStream:
    """Collects the pieces of one answer and returns its notes as they become complete."""

    def __init__(self, max_notes: int = MAX_NOTES_PER_ANSWER) -> None:
        self._max_notes = max_notes
        self._text = ""
        self._scan_from: int | None = None
        self._done = False
        self._count = 0

    def feed(self, piece: str) -> list[dict[str, str]]:
        """The notes that this piece completed, in order; each is `{"kind", "text"}`."""
        if self._done or not piece:
            return []
        self._text += piece
        if self._scan_from is None:
            found = _NOTES_KEY.search(self._text, 0, _SEARCH_LIMIT)
            if found is None:
                return []
            self._scan_from = found.end()
        return self._scan()

    def _scan(self) -> list[dict[str, str]]:
        notes: list[dict[str, str]] = []
        text = self._text
        index = self._scan_from or 0
        while index < len(text):
            char = text[index]
            if char == "]":
                self._done = True
                break
            if char != "{":
                index += 1
                continue
            end = _end_of_object(text, index)
            if end is None:
                # The note is not complete yet: read it again from its start with the next piece.
                self._scan_from = index
                return notes
            note = _note_of(text[index : end + 1])
            if note is not None and self._count < self._max_notes:
                notes.append(note)
                self._count += 1
            index = end + 1
        self._scan_from = index
        return notes


def _end_of_object(text: str, start: int) -> int | None:
    """The position of the brace that closes the object opened at `start`, or None when the text
    ends before it."""
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
        elif char == '"':
            in_string = True
        elif char in "{[":
            depth += 1
        elif char in "}]":
            depth -= 1
            if depth == 0:
                return index
    return None


def _note_of(raw: str) -> dict[str, str] | None:
    """The note of a JSON object, or None when it is not a note with a kind and a text."""
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return None
    if not isinstance(value, dict):
        return None
    kind, text = value.get("kind"), value.get("text")
    if not isinstance(kind, str) or not isinstance(text, str):
        return None
    return {"kind": kind, "text": text}
