"""The quote a link carries is kept word for word, and cut to the length the rules allow."""

from __future__ import annotations

from khoailanggraph.agents.requirements_engineering.nodes import _clip_quote, _words_of
from khoailanggraph.domain.rules import MAX_QUOTE_LENGTH

_PARAGRAPH = (
    "Most readers open the app in the morning and again after work, and they read the "
    "headlines on the phone while they commute, then come back to the long pieces at "
    "night when the children are asleep and the house is quiet, which is the only hour "
    "they say they have for the news."
)
# Two of them: a paragraph the model quotes whole runs past the limit of one quote.
LONG = f"{_PARAGRAPH} {_PARAGRAPH}"


def test_an_over_long_quote_is_cut_at_a_word_and_stays_a_prefix() -> None:
    clipped = _clip_quote(LONG)

    assert len(LONG) > MAX_QUOTE_LENGTH
    assert len(clipped) <= MAX_QUOTE_LENGTH
    assert LONG.startswith(clipped)
    assert not clipped.endswith((" ", ",", ";", ":", "."))


def test_a_quote_within_the_limit_is_kept_as_it_is() -> None:
    assert _clip_quote("  One sentence.  ") == "One sentence."


def test_a_quote_that_differs_only_in_spacing_is_written_as_the_document_writes_it() -> None:
    field = "Readers open the app \u2014 usually before coffee \u2014 and read at night."
    found = _words_of(field, "Readers  open the app - usually before coffee")

    assert found == "Readers open the app \u2014 usually before coffee"


def test_a_quote_whose_words_changed_is_not_recovered() -> None:
    assert _words_of("Readers open the app.", "Readers never open the app") is None
