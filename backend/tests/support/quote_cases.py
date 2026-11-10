"""Cases of the quote rules: a quote on one side of a link, and what it is checked against."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

MESSAGE = {
    "turn": 1,
    "speaker": "PER-001",
    "content": "I want to book a room in a minute.",
    "iteration": 0,
    "topic": None,
}
REQUIREMENT = {
    "title": "Book a room",
    "statement": "Students shall book a study room in under a minute.",
    "topic": None,
}
PERSONA = {"name": "Lan", "goals": ["Book rooms fast"]}


@dataclass(frozen=True)
class QuoteCase:
    name: str
    link_type: str
    side: str
    quote: str
    kind: str
    content: dict[str, Any]
    problem: str | None  # a word of the violation, or None when the quote holds


CASES = [
    QuoteCase(
        "words of a message",
        "evidenced_by",
        "target",
        "book a room in a minute",
        "interview_message",
        MESSAGE,
        None,
    ),
    QuoteCase(
        "the whole text of a field",
        "evidenced_by",
        "target",
        "I want to book a room in a minute.",
        "interview_message",
        MESSAGE,
        None,
    ),
    QuoteCase(
        "a source quote of a link that allows one",
        "derived_from",
        "source",
        "study room in under a minute",
        "spec_requirement",
        {
            "title": "t",
            "statement": "Students book a study room in under a minute.",
            "type": "functional",
            "quality_category": None,
            "priority": "must",
            "rationale": "r",
            "acceptance_criteria": [],
            "fit_criterion": None,
            "verification_method": "test",
        },
        None,
    ),
    QuoteCase(
        "a source quote of a link that does not allow one",
        "evidenced_by",
        "source",
        "book a room",
        "raw_requirement",
        REQUIREMENT,
        "does not allow",
    ),
    QuoteCase(
        "a quote on a link type with no quotes",
        "stated_by",
        "target",
        "Lan",
        "persona",
        PERSONA,
        "does not allow",
    ),
    QuoteCase(
        "an empty quote", "evidenced_by", "target", "   ", "interview_message", MESSAGE, "empty"
    ),
    QuoteCase(
        "a quote over 300 characters",
        "evidenced_by",
        "target",
        "a" * 301,
        "interview_message",
        {**MESSAGE, "content": "a" * 400},
        "over 300",
    ),
    QuoteCase(
        "a quote of exactly 300 characters",
        "evidenced_by",
        "target",
        "a" * 300,
        "interview_message",
        {**MESSAGE, "content": "a" * 400},
        None,
    ),
    QuoteCase(
        "words that are not in the item",
        "evidenced_by",
        "target",
        "book a desk",
        "interview_message",
        MESSAGE,
        "word for word",
    ),
    QuoteCase(
        "words with another case",
        "evidenced_by",
        "target",
        "BOOK A ROOM",
        "interview_message",
        MESSAGE,
        "word for word",
    ),
    QuoteCase(
        "words of a field that is not text",
        "concerns",
        "target",
        "Book rooms fast",
        "persona",
        PERSONA,
        "word for word",
    ),
]
