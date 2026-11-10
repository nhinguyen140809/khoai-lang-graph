"""The turn of the interviewer: a question, or a stop with a summary and a report."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from khoailanggraph.agents.requirements_engineering.outputs import InterviewerTurnOutput


def test_a_question_has_neither_a_summary_nor_a_report() -> None:
    turn = InterviewerTurnOutput(question="How do you book a session today?")

    assert turn.stop is False
    assert turn.summary is None
    assert turn.report is None


def test_a_stop_comes_with_a_summary_and_a_report() -> None:
    turn = InterviewerTurnOutput(
        question="",
        stop=True,
        summary="A commuter student who wants a spot quickly.",
        report="I finished talking with Minh, who cares most about finding a spot fast.",
    )

    assert turn.stop is True
    assert turn.report is not None


@pytest.mark.parametrize(
    ("fields", "missing"),
    [
        ({"summary": "A student."}, "report"),
        ({"report": "I finished the interview."}, "summary"),
        ({"summary": "A student.", "report": "  "}, "report"),
    ],
)
def test_a_stop_without_its_summary_or_its_report_is_refused(
    fields: dict[str, str], missing: str
) -> None:
    with pytest.raises(ValidationError, match=missing):
        InterviewerTurnOutput(question="", stop=True, **fields)
