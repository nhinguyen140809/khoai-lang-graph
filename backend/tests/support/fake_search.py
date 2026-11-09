"""Fake search for tests — the offline corpus fixture (test-only)."""

from __future__ import annotations

import copy
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Sequence


DEMO_SEARCH_HITS: list[dict[str, Any]] = [
    {
        "title": "Mentorship — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Mentorship",
        "publisher": "Wikipedia",
        "year": "2024",
        "text": (
            "We asked 240 students about mentoring platforms. Undergraduates "
            "overwhelmingly want a simple, fast interface: 61% said they would "
            "stop using a tool that needs more than a few taps to book a chat. "
            "Students also worry about visibility: \"I don't want my career "
            'questions visible to everyone," wrote one third-year respondent. '
            'Several complained that mentees get no reply from mentors: "I '
            'messaged five mentors and heard back from one."'
        ),
    },
    {
        "title": "Youth mentoring — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Youth_mentoring",
        "publisher": "Wikipedia",
        "year": "2024",
        "text": (
            "Mentors volunteer about two hours a week and guard that budget "
            "closely. The strongest recurring complaint is low-effort requests: "
            '"Spam requests with no agenda make me decline everything," one '
            "senior engineer reported. Several asked for a clear agenda before "
            'each session and an easy way to decline: "If I cannot say no '
            'without an awkward exchange, I just stop logging in." Others '
            "warned that students treat mentoring as a homework service: "
            '"Some mentees want solutions handed over, not guidance."'
        ),
    },
    {
        "title": "E-mentoring — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/E-mentoring",
        "publisher": "Wikipedia",
        "year": "2024",
        "text": (
            "Every mentoring profile must be verified before it goes live. "
            "Administrators require approval workflows, audit reports, and "
            'usage reports each semester: "I will not approve the platform '
            'without verification and reporting," the review states. '
            "Moderation staffing is thin, so unmoderated interactions are the "
            "main risk: sessions should at least be reportable, and every "
            "rule should be written down."
        ),
    },
    {
        "title": "Peer mentor — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Peer_mentor",
        "publisher": "Wikipedia",
        "year": "2023",
        "text": (
            "Matching quality decides whether students come back. Students "
            "judge mentors by field of study and career path first; a pool "
            "that is too large causes choice paralysis. The report recommends "
            'short mentor profiles and a bookmark list, because "students '
            "who saved three candidates booked twice as often as those who "
            'browsed without saving."'
        ),
    },
    {
        "title": "Coaching — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Coaching",
        "publisher": "Wikipedia",
        "year": "2024",
        "text": (
            "Our platform boosts engagement 300% through gamified badges and "
            "streaks. Book a demo today to see how universities unlock "
            "mentoring at scale. No campus interviews are quoted in this "
            "document. This vendor page should not be selected as a research "
            "document because it carries no stakeholder voice."
        ),
    },
]


def demo_research_search(queries: Sequence[str]) -> list[dict[str, Any]]:
    """The offline answer: the fixture corpus, ignoring the queries.

    Deterministic by design — every keyless run mines the same documents, so
    the demo dataset's observation and persona fixtures stay in sync with the
    stored source texts (the verbatim-evidence gates depend on it).
    """
    return copy.deepcopy(DEMO_SEARCH_HITS)
