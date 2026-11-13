"""The demo dataset behind `fake:demo` — the mentor platform scenario.

Everything the fake model answers when a run resolves its roles to the demo
provider, ported from the prototype's dataset to the version-2 output models:
items carry a `ref` instead of ids, links are key/ref fields, personas carry
`stakeholder_type` and `background`, backlogs split into epics and user
stories with Given/When/Then criteria, and rework passes pass only the
changed items with a `supersedes` field (§2.3). The research stage answers
with the offline corpus of `tools/research.py`: the corpus builder keeps the
three documents that carry stakeholder voices, the miner extracts two
observations from each — their quotes are the exact sentences of the fixture
texts, asserted at import time — and the persona generator grounds the three
personas in those six observations (MAJ-EVAL, arXiv:2507.21028).

Method names are the schema names (`PlannerOutput`, ...); each answers one
node request. A second pass of the engineer or the backlog manager patches
the non-functional requirement REQ-004 so the demo shows a real repair: the
validator fails on a backlog-category issue, the rework makes the criteria
measurable, and the second validation passes.
"""

from __future__ import annotations

import json
import re
from typing import Any

from support.fake_llm import DemoCalls
from support.fake_search import DEMO_SEARCH_HITS

DEMO_INTENT = "I want to build an online platform for university students to find mentors."

# The fixture texts the demo dataset keeps as the corpus; entries in the
# exact order the corpus builder keeps them: students, mentors, admins.
_STUDENT_TEXT = str(DEMO_SEARCH_HITS[0]["text"])
_MENTOR_TEXT = str(DEMO_SEARCH_HITS[1]["text"])
_ADMIN_TEXT = str(DEMO_SEARCH_HITS[2]["text"])

_STUDENT_Q1 = (
    "61% said they would stop using a tool that needs more than a few taps to book a chat."
)
_STUDENT_Q2 = (
    '"I don\'t want my career questions visible to everyone," wrote one third-year respondent.'
)
_MENTOR_Q1 = (
    '"Spam requests with no agenda make me decline everything," one senior engineer reported.'
)
_MENTOR_Q2 = '"If I cannot say no without an awkward exchange, I just stop logging in."'
_ADMIN_Q1 = "Every mentoring profile must be verified before it goes live."
_ADMIN_Q2 = (
    '"I will not approve the platform without verification and reporting," the review states.'
)

# The verbatim-evidence contract of the research stage, checked at import
# time: every quote the fixtures use is a sentence of the fixture it cites,
# so the demo corpus, observations and personas can never drift apart.
for _quote, _text in (
    (_STUDENT_Q1, _STUDENT_TEXT),
    (_STUDENT_Q2, _STUDENT_TEXT),
    (_MENTOR_Q1, _MENTOR_TEXT),
    (_MENTOR_Q2, _MENTOR_TEXT),
    (_ADMIN_Q1, _ADMIN_TEXT),
    (_ADMIN_Q2, _ADMIN_TEXT),
):
    if _quote not in _text:
        msg = f"demo quote drifted from the fixture text: {_quote!r}"
        raise RuntimeError(msg)


def _hit_lines(user: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """The `<search_results>` lines of a corpus prompt, split into the
    member uploads (`upload://`) and the live web hits."""
    uploads: list[dict[str, Any]] = []
    web: list[dict[str, Any]] = []
    for raw_line in user.splitlines():
        line = raw_line.strip()
        if not line.startswith("{"):
            continue
        try:
            hit = dict(json.loads(line))
        except ValueError:
            continue
        if str(hit.get("url", "")).startswith("upload://"):
            uploads.append(hit)
        else:
            web.append(hit)
    return uploads, web


def _observation_lines(user: str) -> list[dict[str, Any]]:
    """The `<observations>` JSONL of a persona prompt as parsed objects."""
    found: list[dict[str, Any]] = []
    for raw_line in user.splitlines():
        line = raw_line.strip()
        if not line.startswith("{"):
            continue
        try:
            entry = dict(json.loads(line))
        except ValueError:
            continue
        if {"key", "evidence", "source", "dimension"} <= set(entry):
            found.append(entry)
    return found


def _corpus(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The curated corpus (CorpusBuilderOutput): member uploads first, then
    the web documents that carry stakeholder voices, texts verbatim."""
    relevance = (
        "Student survey on discovery, booking and privacy",
        "Mentor perspective on filtering, agendas and declining",
        "Administrator needs: verification, moderation and reporting",
    )
    uploads, _web_hits = _hit_lines(user)
    sources: list[dict[str, Any]] = []
    for number, hit in enumerate(uploads, start=1):
        sources.append(
            {
                "ref": f"S{number}",
                "title": str(hit["title"]),
                "url": str(hit["url"]),
                "publisher": str(hit.get("publisher", "upload")),
                "source_type": "interview",
                "year": str(hit.get("year", "")),
                "excerpt": str(hit["text"])[:120],
                "text": str(hit["text"]),
                "relevance_reason": "Member upload: a trusted hand-picked source.",
            }
        )
    kept = DEMO_SEARCH_HITS[: max(0, 3 - len(uploads))]
    for index, hit in enumerate(kept):
        number = len(uploads) + index + 1
        sources.append(
            {
                "ref": f"S{number}",
                "title": str(hit["title"]),
                "url": str(hit["url"]),
                "publisher": str(hit["publisher"]),
                "source_type": ["survey", "forum_thread", "study"][index % 3],
                "year": str(hit["year"]),
                "excerpt": f"SRC excerpt {number}: {hit['title']}.",
                "text": str(hit["text"]),
                "relevance_reason": relevance[index],
            }
        )
    rationale = (
        "Three documents cover the three stakeholder types of the plan, "
        "each quoting its stakeholders directly; the vendor page and the "
        "matching report were left out — the first has no stakeholder voice."
    )
    if uploads:
        rationale = (
            f"{len(uploads)} member upload(s) lead the corpus as the most "
            "trusted voices; web documents fill the stakeholder types."
        )
    return {"selection_rationale": rationale, "sources": sources}


def _upload_grounded_personas(observations: list[dict[str, Any]], user: str) -> dict[str, Any]:
    """A single persona built on the first observation the upload produced."""
    first = observations[0] if observations else None
    if first is None:  # pragma: no cover - persona gen never runs unmined
        raise LookupError("the upload persona fixture needs one observation")
    key = str(first.get("key", "OBS-001"))
    source = str(first.get("source", "SRC-001"))
    quote = str(first.get("evidence", ""))
    dimension = str(first.get("dimension", "the first concern the upload records"))
    return {
        "selection_rationale": (
            "The member upload leads the corpus; one persona speaks its voice, "
            "grounded on the observation mined from its text."
        ),
        "stakeholder_groups": [
            {
                "ref": "G1",
                "name": "Members quoted in the upload",
                "description": "Voices recorded in the uploaded document.",
                "observations": [key],
            }
        ],
        "uncovered_stakeholder_types": [],
        "personas": [
            {
                "ref": "P1",
                "name": "Uploaded voice",
                "stakeholder_type": "Student",
                "occupation": "Member who wrote the uploaded document",
                "age_range": "20-30",
                "evaluative_dimension": dimension,
                "grounded_in": [key],
                "background": "A stakeholder speaking through a member-uploaded document.",
                "typical_day": "Described only by what the uploaded document records.",
                "expertise": "Everyday experience of the platform's domain.",
                "current_workarounds": ["Whatever the uploaded document describes"],
                "vocabulary": ["the words of the uploaded document"],
                "goals": ["Make the recorded concerns heard in the plan"],
                "interests": ["The topics the upload raises"],
                "constraints": ["Answers only from what the upload records"],
                "priorities": [dimension],
                "concerns": ["Being misquoted beyond the uploaded record"],
                "behavioral_tendencies": "Speaks plainly from the uploaded record.",
                "scores": _scores(user, {}, {}),
                "evidence": [{"observation": key, "source": source, "quote": quote}],
            }
        ],
    }


# Shared descriptions of the mined stakeholder groups, worded per source.
_MIN_QUOTE_CHARS = 25
_STUDENT_DESC = (
    "Undergraduates looking for career guidance through short, mostly written exchanges."
)
_MENTOR_DESC = (
    "Experienced engineers mentoring a few students a month within a tight weekly budget."
)
_ADMIN_DESC = "University staff responsible for the platform's safe, auditable operation."


# The observations the miner returns per source document key: OBS content for
# the two dimensions kept per stakeholder group, quotes exactly as mined.
_MINED_BY_SOURCE: dict[str, list[dict[str, Any]]] = {
    "SRC-001": [
        {
            "ref": "O1",
            "stakeholder_name": "students",
            "description": _STUDENT_DESC,
            "dimension": "simplicity and speed of booking",
            "evidence": _STUDENT_Q1,
            "source": "SRC-001",
        },
        {
            "ref": "O2",
            "stakeholder_name": "students",
            "description": _STUDENT_DESC,
            "dimension": "privacy of career questions",
            "evidence": _STUDENT_Q2,
            "source": "SRC-001",
        },
    ],
    "SRC-002": [
        {
            "ref": "O1",
            "stakeholder_name": "volunteer mentors",
            "description": _MENTOR_DESC,
            "dimension": "filtering low-effort requests",
            "evidence": _MENTOR_Q1,
            "source": "SRC-002",
        },
        {
            "ref": "O2",
            "stakeholder_name": "volunteer mentors",
            "description": _MENTOR_DESC,
            "dimension": "clear agenda before accepting",
            "evidence": _MENTOR_Q2,
            "source": "SRC-002",
        },
    ],
    "SRC-003": [
        {
            "ref": "O1",
            "stakeholder_name": "administrators",
            "description": _ADMIN_DESC,
            "dimension": "verification before go-live",
            "evidence": _ADMIN_Q1,
            "source": "SRC-003",
        },
        {
            "ref": "O2",
            "stakeholder_name": "administrators",
            "description": _ADMIN_DESC,
            "dimension": "approval workflows, reporting and moderation",
            "evidence": _ADMIN_Q2,
            "source": "SRC-003",
        },
    ],
}


def _first_recorded_sentence(document: str) -> str:
    """The first full-sentence quote of an uploaded document (>= 25 chars),
    verbatim — the mining gate proves it against the document's text."""
    for raw_candidate in re.split(r"(?<=[.!?])\s+", document):
        candidate = raw_candidate.strip()
        if len(candidate) >= _MIN_QUOTE_CHARS:
            return candidate
    return document.strip()[:200]


def _mined(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The observations of one source document (MinerOutput).

    Web hits answer from the per-source fixtures; a member upload
    (`upload://` in its `<source>`) is mined from its own document text."""
    match = re.search(r"SRC-\d{3}", user)
    key = match.group(0) if match is not None else ""
    document = user.split("<document>", 1)[-1].split("</document>", 1)[0].strip()
    if "upload://" in user:
        return {
            "observations": [
                {
                    "ref": "O1",
                    "stakeholder_name": "members quoted in the upload",
                    "description": "Voices recorded in the uploaded document.",
                    "dimension": "the first concern the upload records",
                    "evidence": _first_recorded_sentence(document),
                    "source": key,
                }
            ]
        }

    # Web hits answer from the fixture of their own page — keyed by url, so
    # an upload ahead of them never shifts the mapping; every observation
    # cites the key the node actually minted for this hit.
    def _fixture(page_key: str) -> dict[str, Any]:
        rows = [dict(entry) for entry in _MINED_BY_SOURCE[page_key]]
        for row in rows:
            row["source"] = key
        return {"observations": rows}

    if "/wiki/Mentorship" in user:
        return _fixture("SRC-001")
    if "/wiki/Youth_mentoring" in user:
        return _fixture("SRC-002")
    if "/wiki/E-mentoring" in user:
        return _fixture("SRC-003")
    if key not in _MINED_BY_SOURCE:
        raise LookupError(f"the demo miner has no fixture for source '{key}'")
    return {"observations": [dict(entry) for entry in _MINED_BY_SOURCE[key]]}


def _no_questions(system: str, user: str, call_number: int) -> dict[str, Any]:
    return {"questions": []}


def _plain(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The plan of the mentor platform (PlannerOutput)."""
    return {
        "objectives": [
            "Understand how students discover and choose mentors",
            "Understand mentor availability, expectations and limits",
            "Understand administrator safety, verification and reporting needs",
        ],
        "topics": [
            "mentor discovery and search",
            "session booking and scheduling",
            "privacy of student interactions",
            "mentor availability limits",
            "verification and moderation",
            "usage reporting",
        ],
        "data_to_collect": [
            {
                "topic": "mentor discovery and search",
                "needed": [
                    "how the person looked for a mentor or advice the last time",
                    "how long it took and how many people answered",
                ],
            },
            {
                "topic": "session booking and scheduling",
                "needed": [
                    "how often sessions happen or are wanted",
                    "what is arranged by message today and what goes wrong",
                ],
            },
            {
                "topic": "privacy of student interactions",
                "needed": ["what the person is not willing to show to others"],
            },
            {
                "topic": "mentor availability limits",
                "needed": [
                    "how many hours a week a mentor can give",
                    "what a request must contain to be accepted",
                ],
            },
            {
                "topic": "verification and moderation",
                "needed": [
                    "which checks are required before a mentor is shown",
                    "who answers when a session goes wrong",
                ],
            },
            {
                "topic": "usage reporting",
                "needed": ["which figures are reported, how often and to whom"],
            },
        ],
        "opening_questions": [
            "Walk me through the last time you looked for a mentor or career advice.",
            "Tell me about the last time a student asked you for help.",
            "How does a new service that students use under the university's name get "
            "approved today?",
        ],
        "information_gaps": [
            "How students judge mentor quality before contacting them",
            "What verification steps administrators require",
            "Which usage metrics matter for semester reports",
        ],
        "stakeholder_types": ["Student", "Mentor", "Administrator"],
        "persona_aspects": [
            {
                "key": "booking_urgency",
                "title": "Booking urgency",
                "description": "How soon the person needs an answer from a mentor.",
                "low": "Can wait weeks",
                "high": "Needs an answer the same day",
            },
            {
                "key": "privacy_sensitivity",
                "title": "Privacy sensitivity",
                "description": "How much the person worries about who can see their conversations.",
                "low": "Does not mind",
                "high": "Will not use a service that shows them",
            },
        ],
        "strategies": [
            "Interview each stakeholder persona separately, starting from "
            "their goals, then constraints, then risks; probe for examples.",
            "Ask for concrete examples and numbers; follow up on vague terms "
            "like 'simple', 'safe' or 'fast'; surface disagreements.",
        ],
        "stopping_conditions": [
            "All plan topics covered for the persona",
            "Persona starts repeating earlier points",
            "No new information in the last two turns",
        ],
    }


def _aspect_keys(user: str) -> list[str]:
    """The keys of the aspects that the prompt lists, in the order listed."""
    return re.findall(r"^- ([a-z][a-z0-9_]*) \(", user, flags=re.MULTILINE)


def _scores(user: str, base: dict[str, int], reasons: dict[str, str]) -> list[dict[str, Any]]:
    """One score for each listed aspect: the persona's own where it has one, else a middle value
    that says the observations are silent."""
    return [
        {
            "aspect": key,
            "score": base.get(key, 3),
            "rationale": reasons.get(
                key, "The observations are silent, so this is the typical value of the group."
            ),
        }
        for key in _aspect_keys(user)
    ]


def _personas(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The three evidence-grounded personas (GeneratorOutputV2).

    The observations arrive in the prompt sorted by key. The standard corpus
    (six web fixtures) answers with the three mentor-platform personas; an
    upload-driven corpus answers with one persona grounded on the first
    observation the upload produced, quoting it exactly.
    """
    observations = _observation_lines(user)
    fixture_quotes = {
        _STUDENT_Q1,
        _STUDENT_Q2,
        _MENTOR_Q1,
        _MENTOR_Q2,
        _ADMIN_Q1,
        _ADMIN_Q2,
    }
    if not {str(entry.get("evidence", "")) for entry in observations} <= fixture_quotes:
        return _upload_grounded_personas(observations, user)
    student_evidence = [
        {"observation": "OBS-001", "source": "SRC-001", "quote": _STUDENT_Q1},
        {"observation": "OBS-002", "source": "SRC-001", "quote": _STUDENT_Q2},
    ]
    mentor_evidence = [
        {"observation": "OBS-003", "source": "SRC-002", "quote": _MENTOR_Q1},
        {"observation": "OBS-004", "source": "SRC-002", "quote": _MENTOR_Q2},
    ]
    admin_evidence = [
        {"observation": "OBS-005", "source": "SRC-003", "quote": _ADMIN_Q1},
        {"observation": "OBS-006", "source": "SRC-003", "quote": _ADMIN_Q2},
    ]
    return {
        "selection_rationale": (
            "Three personas cover every stakeholder type of the plan; each is "
            "grounded in the mined observations and brings conflicting "
            "priorities the platform must reconcile."
        ),
        "stakeholder_groups": [
            {
                "ref": "G1",
                "name": "Students",
                "description": (
                    "Undergraduates seeking career guidance with little time "
                    "and real privacy worries."
                ),
                "observations": ["OBS-001", "OBS-002"],
            },
            {
                "ref": "G2",
                "name": "Volunteer mentors",
                "description": "Experienced engineers guarding a small weekly mentoring budget.",
                "observations": ["OBS-003", "OBS-004"],
            },
            {
                "ref": "G3",
                "name": "Administrators",
                "description": (
                    "University staff answerable for the platform's safety and reporting."
                ),
                "observations": ["OBS-005", "OBS-006"],
            },
        ],
        "uncovered_stakeholder_types": [],
        "personas": [
            {
                "ref": "P1",
                "name": "Minh — 3rd-year CS student",
                "stakeholder_type": "Student",
                "occupation": "Third-year computer science student",
                "age_range": "20-22",
                "evaluative_dimension": "simplicity and speed of booking",
                "grounded_in": ["OBS-001", "OBS-002"],
                "background": (
                    "A busy undergraduate who wants career guidance and "
                    "internship preparation, prefers quick asynchronous steps."
                ),
                "typical_day": (
                    "Lectures from 8:00 to 15:00, a part-time shift in the library, and "
                    "evenings on assignments. He looks for advice on his phone in the gaps."
                ),
                "expertise": "Basic programming, no industry experience",
                "current_workarounds": [
                    "Messages engineers he finds on LinkedIn",
                    "Asks seniors in his student club",
                ],
                "vocabulary": ["quick chat", "intro", "reply", "internship"],
                "goals": [
                    "Find a mentor working in my target career field",
                    "Get honest advice on skills and internships",
                    "Book short chats without long back-and-forth",
                ],
                "interests": ["Internships", "Career paths", "Portfolio projects"],
                "constraints": ["Full course load", "Mostly uses phone", "Limited free time"],
                "priorities": [
                    "Simple, fast interface",
                    "Relevant matches",
                    "Private conversations",
                ],
                "concerns": [
                    "Choice paralysis with too many mentors",
                    "Privacy of my questions and career worries",
                    "Mentors who never reply",
                ],
                "behavioral_tendencies": (
                    "Direct, concise answers; grows impatient with long forms."
                ),
                "scores": _scores(
                    user,
                    {
                        "domain_expertise": 2,
                        "usage_frequency": 3,
                        "tech_comfort": 5,
                        "pain_severity": 4,
                        "decision_influence": 1,
                        "booking_urgency": 4,
                        "privacy_sensitivity": 4,
                    },
                    {
                        "domain_expertise": (
                            "He has no industry experience, which the observations describe."
                        ),
                        "pain_severity": "Students report that finding a mentor takes weeks.",
                        "decision_influence": "Students do not choose the platform.",
                    },
                ),
                "evidence": student_evidence,
            },
            {
                "ref": "P2",
                "name": "Dr. Lan — senior engineer, part-time mentor",
                "stakeholder_type": "Mentor",
                "occupation": "Senior software engineer",
                "age_range": "35-44",
                "evaluative_dimension": "filtering low-effort requests, clear agendas",
                "grounded_in": ["OBS-003", "OBS-004"],
                "background": (
                    "An experienced engineer willing to mentor a few students "
                    "per month if requests are well-prepared and bounded."
                ),
                "typical_day": (
                    "Full workdays at her company, with student requests arriving by email "
                    "late in the evening, which she answers in one batch at the weekend."
                ),
                "expertise": "10 years industry experience, career coaching",
                "current_workarounds": [
                    "Answers student emails in one batch each weekend",
                    "Keeps a short template that asks what the student already tried",
                ],
                "vocabulary": ["request", "agenda", "bounded", "slot"],
                "goals": [
                    "Give back to the student community",
                    "Guide a small number of students well",
                    "Keep sessions focused and useful",
                ],
                "interests": ["Technical mentoring", "Career coaching", "Interview prep"],
                "constraints": ["About 2 hours per week", "Prefers scheduled sessions"],
                "priorities": ["Clear agendas", "Request filtering", "Easy decline option"],
                "concerns": [
                    "Spam or low-effort requests",
                    "Students expecting homework solutions",
                    "Unclear expectations causing awkward sessions",
                ],
                "behavioral_tendencies": (
                    "Asks clarifying questions before accepting anything; sets firm boundaries."
                ),
                "scores": _scores(
                    user,
                    {
                        "domain_expertise": 5,
                        "usage_frequency": 2,
                        "tech_comfort": 4,
                        "pain_severity": 3,
                        "decision_influence": 3,
                        "booking_urgency": 2,
                        "privacy_sensitivity": 3,
                    },
                    {
                        "domain_expertise": "She has ten years of industry experience.",
                        "usage_frequency": "She can give about two hours a week.",
                    },
                ),
                "evidence": mentor_evidence,
            },
            {
                "ref": "P3",
                "name": "Mr. Bao — platform administrator",
                "stakeholder_type": "Administrator",
                "occupation": "Academic IT operations manager",
                "age_range": "45-54",
                "evaluative_dimension": "verification and reporting before go-live",
                "grounded_in": ["OBS-005", "OBS-006"],
                "background": (
                    "Responsible for the platform's safe operation and its "
                    "acceptance by the university administration."
                ),
                "typical_day": (
                    "Meetings with the faculty offices in the morning, reviews of service "
                    "requests in the afternoon, and a monthly report to the vice dean."
                ),
                "expertise": "Academic IT operations, compliance processes",
                "current_workarounds": [
                    "Reviews every external service on a checklist",
                    "Collects complaints in a spreadsheet",
                ],
                "vocabulary": ["review", "compliance", "audit", "sign-off"],
                "goals": [
                    "Keep the platform safe and compliant",
                    "Ensure mentor quality through verification",
                    "Report platform value to the university each semester",
                ],
                "interests": ["Compliance reporting", "Moderation workflows", "Usage analytics"],
                "constraints": ["University data policies", "Limited moderation staff"],
                "priorities": ["Detailed configuration", "Approval workflows", "Audit reports"],
                "concerns": [
                    "Unmoderated interactions and misuse",
                    "Unverified or fake mentor profiles",
                    "Manual moderation workload",
                ],
                "behavioral_tendencies": (
                    "Formal, policy-oriented; wants every rule written down."
                ),
                "scores": _scores(
                    user,
                    {
                        "domain_expertise": 4,
                        "usage_frequency": 3,
                        "tech_comfort": 3,
                        "pain_severity": 4,
                        "decision_influence": 5,
                        "booking_urgency": 1,
                        "privacy_sensitivity": 5,
                    },
                    {
                        "decision_influence": "He signs off whether the platform goes live.",
                        "pain_severity": (
                            "Unverified mentors and misuse are what he worries about most."
                        ),
                    },
                ),
                "evidence": admin_evidence,
            },
        ],
    }


_QUESTS_PER_PERSONA = 3
# What each interview asks and answers, turn by turn. The second question picks up a detail of
# the first answer, and the third asks for what the person would need, as an interviewer who
# listens does; the answers are what a person says in an interview, a few sentences each.
_INTERVIEWS: dict[str, list[tuple[str, str]]] = {
    "Student": [
        (
            "Walk me through the last time you looked for a mentor or career advice.",
            "Last month I needed help with internship applications. I scrolled LinkedIn for an "
            "hour and messaged four engineers. Only one answered, three weeks later.",
        ),
        (
            "You said only one of the four answered, after three weeks. What did you do in "
            "the meantime?",
            "I asked a senior in my club, but she was busy too. In the end I copied a template "
            "from a forum, and I did not trust it much.",
        ),
        (
            "What would have made you comfortable sending that first message?",
            "Knowing the person really takes students, and that my question stays between us. I "
            "do not want my career worries visible to everyone.",
        ),
    ],
    "Mentor": [
        (
            "Tell me about the last time a student asked you for help.",
            "A student emailed me at eleven at night and wanted his resume reviewed by the next "
            "morning. No context at all. I get two or three of those a month.",
        ),
        (
            "You mentioned the late request with no context. What did you do with it?",
            "I asked which role he was aiming for, and then he never wrote back. That was half "
            "an hour of my evening for nothing.",
        ),
        (
            "What would a request need to contain for you to accept it?",
            "A specific question, what he already tried, and a time window. I can give about two "
            "hours a week, so one session a week at most.",
        ),
    ],
    "Administrator": [
        (
            "How does a new service that students use under the university's name get approved "
            "today?",
            "Every outside service goes through a review of data handling, who is accountable, "
            "and who can be reported. It usually takes about three weeks.",
        ),
        (
            "You said it takes about three weeks. Which part of the review takes longest?",
            "Verifying the people. If we cannot confirm that a mentor is who they say they are, "
            "the review stops there.",
        ),
        (
            "What reports would you need once the platform is running?",
            "Each semester: how many sessions took place, how many mentors were active, and any "
            "complaints with how they were handled. The vice dean asks for it.",
        ),
    ],
}
_ROLES = list(_INTERVIEWS)


def _role_in(user: str) -> str:
    """The stakeholder type of the persona that the prompt shows."""
    for role in _ROLES:
        if f'stakeholder_type": "{role}' in user:
            return role
    for role in _ROLES:
        if role in user:
            return role
    return "Student"


def _interviewer_turn(system: str, user: str, call_number: int) -> dict[str, Any]:
    """One interviewer question, or the stop signal after three turns.

    The node renders each transcript line as `<key> interviewer: <content>`
    (views.transcript_lines); this counts exactly those markers, so the flow
    stops deterministically after the plan's three questions per persona.
    """
    asked = user.count(" interviewer:")
    topics = re.findall(r"^topic: (.+)$", user, flags=re.MULTILINE)
    answers = re.findall(r"^(\S+#\d+) persona:", user, flags=re.MULTILINE)
    # What the last answer gave: the first item of the plan that this interview has not ticked.
    open_items = re.findall(r"^- \[ \] (.+)$", user, flags=re.MULTILINE)
    covered = open_items[:1] if answers else []
    if asked >= _QUESTS_PER_PERSONA or "<limit_reached>\nyes" in user:
        return {
            "question": "",
            "stop": True,
            "summary": _summary_for(user),
            "report": "I finished the interview and noted what matters most to this person.",
            "covered_by_last_answer": covered,
            "top_findings": [_summary_for(user)],
            "follow_ups": ["Ask what a good week looks like once the platform exists."],
        }
    script = _INTERVIEWS[_role_in(user)]
    kinds = ["opening", "follow_up", "new_topic"]
    turn: dict[str, Any] = {
        "question": script[min(asked, len(script) - 1)][0],
        "stop": False,
        "question_kind": kinds[min(asked, len(kinds) - 1)],
        "covered_by_last_answer": covered,
        "topic": topics[min(asked, len(topics) - 1)] if topics else None,
    }
    if turn["question_kind"] == "follow_up" and answers:
        turn["follows_up_on"] = answers[-1]
    return turn


def _persona_answer(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The persona's answer to the question it is asked now, chosen by the persona in the prompt."""
    script = _INTERVIEWS[_role_in(user)]
    asked = max(user.count(" interviewer:"), 1)
    return {"answer": script[min(asked, len(script)) - 1][1]}


_SUMMARIES: dict[str, str] = {
    "Student": "A student short of time who wants a mentor fast and private questions.",
    "Mentor": "A mentor with two hours a week who wants clear agendas and easy declines.",
    "Administrator": "An administrator who puts safety first and wants verified mentors.",
}


def _summary_for(user: str) -> str:
    """One sentence about the interview, chosen by the persona in the prompt."""
    for role, summary in _SUMMARIES.items():
        if f'stakeholder_type": "{role}' in user:
            return summary
    return _SUMMARIES["Student"]


_EVIDENCE = {
    "Student": [
        (
            "The platform shall let students search for mentors by skill or career field.",
            "mentor discovery and search",
            "I scrolled LinkedIn for an hour and messaged four engineers",
        ),
        (
            "The platform shall show when a mentor is available, so that students do not wait "
            "for weeks.",
            "session booking and scheduling",
            "she was busy too",
        ),
        (
            "Student questions shall remain private and not visible to other users.",
            "privacy of student interactions",
            "my question stays between us",
        ),
    ],
    "Mentor": [
        (
            "Mentors shall be able to limit the number of requests they receive per month.",
            "mentor availability limits",
            "two or three of those a month",
        ),
        (
            "Mentors shall have a way to decline requests without penalty.",
            "session booking and scheduling",
            "half an hour of my evening for nothing",
        ),
        (
            "Each request shall state a specific question, what was tried and a time window.",
            "session booking and scheduling",
            "A specific question, what he already tried, and a time window",
        ),
    ],
    "Administrator": [
        (
            "The platform shall show who is accountable for each session and who can be reported.",
            "verification and moderation",
            "who is accountable, and who can be reported",
        ),
        (
            "Every mentor profile shall be verified by an administrator before publication.",
            "verification and moderation",
            "If we cannot confirm that a mentor is who they say they are",
        ),
        (
            "The platform shall provide usage reports to administrators each semester.",
            "usage reporting",
            "how many sessions took place, how many mentors were active",
        ),
    ],
}


def _upload_flow_analysis() -> dict[str, Any]:
    """The one-persona analysis of an upload-driven run: the student-shape
    subset of the fixture evidence, every key existing in a one-persona
    store, statements answering the uploaded record."""
    rows = _EVIDENCE["Student"]
    raw_requirements = [
        {
            "ref": f"R{position}",
            "statement": row[0],
            "topic": row[1],
            "stated_by": "PER-001",
            "evidenced_by": [{"message": f"PER-001#{2 * position}", "target_quote": row[2]}],
        }
        for position, row in enumerate(rows, start=1)
    ]
    return {
        "raw_requirements": raw_requirements,
        "analyzed_requirements": [
            {
                "ref": "A1",
                "statement": (
                    "Students shall be able to search for mentors by skill and career field."
                ),
                "type": "functional",
                "quality_category": None,
                "priority": "must",
                "rationale": "The core discovery need, asked in the uploaded record.",
                "derived_from": ["R1"],
                "involves": ["PER-001"],
            },
            {
                "ref": "A2",
                "statement": "Students shall be able to book a short session in a few taps.",
                "type": "functional",
                "quality_category": None,
                "priority": "must",
                "rationale": "The record asks for quick, uncomplicated booking.",
                "derived_from": ["R2"],
                "involves": ["PER-001"],
            },
            {
                "ref": "A3",
                "statement": "Student questions shall stay private to the conversation.",
                "type": "functional",
                "quality_category": None,
                "priority": "should",
                "rationale": "Privacy worries come straight from the record.",
                "derived_from": ["R3"],
                "involves": ["PER-001"],
            },
        ],
        "latent_needs": [
            {
                "ref": "LN1",
                "description": "Students want a safe space for career questions, only implied.",
                "reasoning": "Inferred from the privacy worries, never stated outright.",
                "confidence": "medium",
                "disposition": "open",
                "evidenced_by": [{"message": "PER-001#6", "target_quote": rows[2][2]}],
                "involves": ["PER-001"],
            }
        ],
        "assumptions": [
            {
                "ref": "ASM1",
                "statement": "Mentors reply to student requests within a few days.",
                "reasoning": "The record never says how long a reply may take.",
                "impact_if_wrong": "Students lose interest before an answer arrives.",
                "impact": 4,
                "validation_status": "unverified",
                "validation_plan": "Ask a mentor how long a reply usually takes.",
                "concerns": ["A1"],
            }
        ],
        "ambiguity_issues": [],
        "conflicts": [],
        "key_findings": ["The uploaded record asks for search, quick booking and privacy."],
        "open_questions": [],
    }


def _analyst(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The full analysis of the three interviews (AnalystOutput)."""
    if '"Uploaded voice"' in user or "uploaded record" in user:
        return _upload_flow_analysis()
    raw_requirements: list[dict[str, Any]] = []
    for index, statements in enumerate(_EVIDENCE.items(), start=1):
        entries = statements[1]
        for position, statement in enumerate(entries, start=1):
            raw_requirements.append(
                {
                    "ref": f"R{len(raw_requirements) + 1}",
                    "statement": statement[0],
                    "topic": statement[1],
                    "stated_by": f"PER-00{index}",
                    "evidenced_by": [
                        {
                            "message": f"PER-00{index}#{2 * position}",
                            "target_quote": statement[2],
                        }
                    ],
                }
            )

    def analyzed(
        ref: str,
        statement: str,
        priority: str,
        rationale: str,
        derived_from: list[str],
        involves: list[str],
        spec_type: str = "functional",
    ) -> dict[str, Any]:
        return {
            "ref": ref,
            "statement": statement,
            "type": spec_type,
            "quality_category": None,
            "priority": priority,
            "rationale": rationale,
            "derived_from": derived_from,
            "involves": involves,
        }

    def latent(
        ref: str,
        description: str,
        persona: str,
        message: str,
        quote: str,
    ) -> dict[str, Any]:
        return {
            "ref": ref,
            "description": description,
            "reasoning": "Inferred from the persona's words, never stated outright.",
            "confidence": "medium",
            "disposition": "open",
            "evidenced_by": [{"message": message, "target_quote": quote}],
            "involves": [persona],
        }

    return {
        "raw_requirements": raw_requirements,
        "analyzed_requirements": [
            analyzed(
                "A1",
                "Students shall be able to search for mentors by skill and career field.",
                "must",
                "The core discovery need, stated directly by the student persona.",
                ["R1"],
                ["PER-001"],
            ),
            analyzed(
                "A2",
                "Students shall be able to book a short mentoring session with an agreed agenda.",
                "must",
                "Booking (student) merged with the agenda expectation (mentor).",
                ["R2", "R6"],
                ["PER-001", "PER-002"],
            ),
            analyzed(
                "A3",
                "Mentor profiles shall be verified by an administrator before publication.",
                "must",
                "Safety requirement raised by the administrator persona.",
                ["R7"],
                ["PER-003"],
            ),
            analyzed(
                "A4",
                "The platform shall respect mentor availability limits when scheduling sessions.",
                "should",
                "Mentor-side availability and control needs, merged.",
                ["R4", "R5"],
                ["PER-002"],
            ),
            analyzed(
                "A5",
                "The platform shall provide semester usage reports to administrators.",
                "should",
                "Reporting requirement from the administrator persona.",
                ["R8"],
                ["PER-003"],
            ),
            analyzed(
                "A6",
                "Student interactions shall remain private and reportable for moderation.",
                "must",
                "Privacy (student) reconciled with moderation (administrator).",
                ["R3", "R9"],
                ["PER-001", "PER-003"],
                spec_type="constraint",
            ),
        ],
        "latent_needs": [
            latent(
                "L1",
                "Students need trust signals such as a verified badge before contacting a mentor.",
                "PER-001",
                "PER-001#6",
                "my question stays between us",
            ),
            latent(
                "L2",
                "Administrators need automated moderation support to keep their workload feasible.",
                "PER-003",
                "PER-003#6",
                "complaints with how they were handled",
            ),
        ],
        "assumptions": [
            {
                "ref": "S1",
                "statement": "Mentors are affiliated with or vetted by the university.",
                "reasoning": "The administrator verification requirement implies "
                "an institutional vetting pipeline exists.",
                "impact_if_wrong": "Verification would need a different trust "
                "anchor, changing the onboarding flow.",
                "impact": 5,
                "validation_status": "unverified",
                "validation_plan": "Ask the administrator who vets mentors today.",
                "concerns": ["AR-003"],
            },
            {
                "ref": "S2",
                "statement": "A typical mentoring session lasts about 30 minutes.",
                "reasoning": "The student persona asked for quick exchanges, not long calls.",
                "impact_if_wrong": "Booking granularity and mentor capacity "
                "rules would need new limits.",
                "impact": 2,
                "validation_status": "unverified",
                "validation_plan": "Ask a mentor how long a session usually runs.",
                "concerns": ["AR-002"],
            },
        ],
        "ambiguity_issues": [
            {
                "ref": "B1",
                "description": "The performance and usability target of the "
                "student's demand is unspecified.",
                "ambiguity_type": "incomplete",
                "ambiguous_text": "simple and fast to use",
                "interpretations": [
                    "A booking takes under two minutes.",
                    "A page opens in under two seconds.",
                ],
                "clarifying_question": "Define measurable load-time and booking-effort targets.",
                "status": "open",
                "resolution": None,
                "concerns": ["AR-001", "AR-002"],
                "resolved_by": None,
            }
        ],
        "conflicts": [
            {
                "ref": "C1",
                "description": "Simplicity versus configurability: students "
                "want a simple, fast interface while administrators require "
                "detailed configuration, approval workflows, and audit "
                "reporting.",
                "conflict_type": "between_stakeholders",
                "severity": "medium",
                "proposed_resolutions": [
                    "A simple student view with an administration area for configuration.",
                    "Progressive disclosure: defaults for students, advanced "
                    "settings for administrators.",
                ],
                "status": "open",
                "resolution": None,
                "resolution_strategy": None,
                "concerns": ["AR-001", "AR-005"],
                "involves": ["PER-001", "PER-003"],
                "resolved_by": None,
            }
        ],
        "key_findings": [
            "Nine raw requirements across three stakeholders, merged into six "
            "analyzed requirements.",
            "One open conflict between student simplicity and administrator configurability.",
            "One ambiguity around the unmeasured performance wording.",
        ],
        "open_questions": [
            "What grace period should a pending mentor verification allow?",
            "Which usage metrics matter most for the semester reports?",
        ],
    }


def _upload_flow_spec() -> dict[str, Any]:
    """The one-persona specification of an upload-driven run: three
    requirements derived from the analysis the uploaded record shaped."""

    def requirement(
        ref: str,
        title: str,
        statement: str,
        spec_type: str,
        priority: str,
        quality: str | None,
        rationale: str,
        verification: str,
    ) -> dict[str, Any]:
        return {
            "ref": ref,
            "title": title,
            "statement": statement,
            "type": spec_type,
            "quality_category": quality,
            "priority": priority,
            "rationale": rationale,
            "acceptance_criteria": [f"{title} works as asked in the uploaded record."],
            "fit_criterion": None,
            "verification_method": verification,
            "derived_from": [f"AR-00{ref[-1]}"],
            "depends_on": [],
            "supersedes": [],
        }

    return {
        "purpose": "Let students find and book mentors, with questions kept private.",
        "scope": "Search, short bookings, and privacy of conversations.",
        "out_of_scope": ["Payments"],
        "definitions": [{"term": "Mentor", "definition": "A volunteer offering guidance."}],
        "requirements": [
            requirement(
                "Q1",
                "Search mentors",
                "Students shall search for mentors by skill and career field.",
                "functional",
                "must",
                None,
                "The discovery need the uploaded record leads with.",
                "test",
            ),
            requirement(
                "Q2",
                "Book a session",
                "Students shall book a short mentoring session in a few taps.",
                "functional",
                "must",
                None,
                "Quick booking is asked for the uploaded record.",
                "test",
            ),
            requirement(
                "Q3",
                "Keep questions private",
                "Student questions shall remain private to their conversation.",
                "non_functional",
                "should",
                "security",
                "Privacy worries come straight from the uploaded record.",
                "inspection",
            ),
        ],
    }


def _engineer(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The specification (EngineerOutput); the rework pass supersedes REQ-004."""
    if "uploaded record" in user:
        return _upload_flow_spec()

    def requirement(
        ref: str,
        title: str,
        statement: str,
        spec_type: str,
        priority: str,
        rationale: str,
        acceptance_criteria: list[str],
        fit_criterion: str | None,
        verification_method: str,
        derived_from: list[str],
        depends_on: list[str],
    ) -> dict[str, Any]:
        return {
            "ref": ref,
            "title": title,
            "statement": statement,
            "type": spec_type,
            "quality_category": "usability" if spec_type == "non_functional" else None,
            "priority": priority,
            "rationale": rationale,
            "acceptance_criteria": acceptance_criteria,
            "fit_criterion": fit_criterion,
            "verification_method": verification_method,
            "derived_from": derived_from,
            "depends_on": depends_on,
        }

    requirements_v1 = [
        requirement(
            "REQ-1",
            "Search mentors",
            "The platform shall let students search for mentors by skill and career field.",
            "functional",
            "must",
            "Directly requested by students during elicitation; the core discovery need.",
            [
                "Search supports filtering by skill tag and career field.",
                "Results show mentor name, short profile, and availability.",
            ],
            None,
            "test",
            ["AR-001"],
            [],
        ),
        requirement(
            "REQ-2",
            "Book a session",
            "Students shall be able to request and book a 30-minute session "
            "with an available mentor.",
            "functional",
            "must",
            "Booking is the primary action students expect after finding a mentor.",
            [
                "A request creates a booking entry visible to both parties.",
                "Mentors receive the proposed agenda with the request.",
            ],
            None,
            "test",
            ["AR-002"],
            ["REQ-1"],
        ),
        requirement(
            "REQ-3",
            "Verify mentor profiles",
            "Administrators shall verify mentor profiles before they become publicly visible.",
            "functional",
            "must",
            "Compliance and safety requirement raised by the administrator persona.",
            [
                "New mentor profiles enter a pending verification state.",
                "Only administrators can transition a profile to verified.",
            ],
            None,
            "inspection",
            ["AR-003"],
            [],
        ),
        requirement(
            "REQ-4",
            "Search speed",
            "The user interface of the platform shall be simple and fast to use.",
            "non_functional",
            "should",
            "Strong student preference; needs a measurable criterion "
            "(flagged by analysis as ambiguous).",
            [],
            None,
            "test",
            ["AR-001"],
            [],
        ),
        requirement(
            "REQ-5",
            "Weekly mentor cap",
            "Mentor availability shall be limited to at most two hours per week per mentor.",
            "constraint",
            "must",
            "Mentors explicitly bounded their commitment; the scheduler must respect it.",
            ["The scheduler rejects bookings that exceed a mentor's weekly cap."],
            None,
            "test",
            ["AR-004"],
            ["REQ-2"],
        ),
    ]

    def frame(requirements: list[dict[str, Any]]) -> dict[str, Any]:
        return {
            "purpose": "A mentor discovery platform for university students.",
            "scope": "The mentor discovery, booking and verification flows of the platform.",
            "out_of_scope": ["Billing and payments", "Mobile applications"],
            "definitions": [
                {"term": "Mentor", "definition": "A verified platform member offering guidance."},
            ],
            "requirements": requirements,
        }

    if call_number <= 1:
        return frame(requirements_v1)
    # Rework pass: only the changed requirement returns, superseding REQ-004.
    return frame(
        [
            requirement(
                "REQ-1",
                "Search speed",
                "The platform's core screens shall load within 2 seconds (P95) "
                "on a standard campus connection, and a new student shall book a "
                "first session in at most 5 steps.",
                "non_functional",
                "should",
                "The student's measurable simplicity demand, resolved by this rework.",
                [
                    "Core screens load within 2 seconds (P95) on a standard connection.",
                    "Booking a first session takes at most 5 user steps.",
                ],
                "P95 page load under 2 s; first booking in at most 5 steps.",
                "test",
                ["AR-001"],
                [],
            )
            | {"supersedes": ["REQ-004"]},
        ]
    )


def _upload_flow_backlog() -> dict[str, Any]:
    """The one-persona backlog of an upload-driven run: one story per
    specified requirement, each inheriting its record-shaped criteria."""

    def story(ref: str, number: int, title: str, want: str) -> dict[str, Any]:
        return {
            "ref": ref,
            "item_type": "user_story",
            "title": title,
            "as_a": "student",
            "i_want": want,
            "so_that": "the uploaded record's ask is met",
            "acceptance_criteria": [
                {"given": "the platform", "when": f"I {want}", "then": f"{title} works"}
            ],
            "priority": "must",
            "story_points": 2,
            "derived_from": [f"REQ-00{number}"],
            "depends_on": [],
        }

    # BacklogItemContent fields per the schema; delivery_status set by user.
    return {
        "definition_of_done": [
            "Every acceptance criterion of the item passes.",
            "The change is reviewed by a second person.",
        ],
        "product_goal": "Answer the uploaded record: find, book, stay private.",
        "prioritization_notes": "One story per requirement of the record.",
        "items": [
            story("B1", 1, "Search mentors", "search mentors by skill and field"),
            story("B2", 2, "Book a session", "book a short mentoring session in a few taps"),
            story("B3", 3, "Keep questions private", "keep my questions private"),
        ],
    }


def _backlog(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The product backlog (BacklogOutput); pass two adds the fixed story."""
    if "uploaded record" in user:
        return _upload_flow_backlog()

    def story(
        ref: str,
        title: str,
        as_a: str,
        i_want: str,
        so_that: str,
        criteria: list[tuple[str, str, str]],
        priority: str,
        points: int,
        derived_from: list[str],
        depends_on: list[str],
    ) -> dict[str, Any]:
        return {
            "ref": ref,
            "item_type": "user_story",
            "title": title,
            "as_a": as_a,
            "i_want": i_want,
            "so_that": so_that,
            "acceptance_criteria": [
                {"given": given, "when": when, "then": then} for given, when, then in criteria
            ],
            "priority": priority,
            "story_points": points,
            "derived_from": derived_from,
            "depends_on": depends_on,
        }

    def frame(items: list[dict[str, Any]]) -> dict[str, Any]:
        return {
            "definition_of_done": [
                "Every acceptance criterion of the item passes.",
                "The change is reviewed by a second person.",
                "The screens work on a phone as well as on a laptop.",
            ],
            "product_goal": "Students find, book and learn from verified mentors.",
            "prioritization_notes": "Discovery and booking first; verification "
            "keeps the platform trusted.",
            "items": items,
        }

    items_v1 = [
        story(
            "US-1",
            "Search mentors by skill",
            "student",
            "to search mentors by skill",
            "I can find someone relevant.",
            [
                (
                    "the student is on the search page",
                    "they filter mentors by a skill tag",
                    "only mentors with that skill are listed",
                ),
                (
                    "the student runs a search",
                    "the results render",
                    "results are ranked by relevance",
                ),
            ],
            "must",
            3,
            ["REQ-001"],
            [],
        ),
        story(
            "US-2",
            "Book a mentor session",
            "student",
            "to request a 30-minute session with an agenda",
            "the mentor knows what to prepare.",
            [
                (
                    "the student has found an available mentor",
                    "they send a booking request with an agenda",
                    "the mentor sees the agenda and accepts or declines",
                )
            ],
            "must",
            5,
            ["REQ-002"],
            ["US-1"],
        ),
        story(
            "US-3",
            "Verify mentor profiles",
            "administrator",
            "to review and verify mentor profiles",
            "only vetted mentors are visible.",
            [
                (
                    "a new mentor profile is submitted",
                    "the administrator opens the review queue",
                    "the profile is pending and can be approved or rejected",
                )
            ],
            "must",
            5,
            ["REQ-003"],
            [],
        ),
        story(
            "US-4",
            "Weekly mentor cap",
            "mentor",
            "my weekly booking capacity capped",
            "I control my time commitment.",
            [
                (
                    "a mentor has reached the weekly cap",
                    "a student requests another session that week",
                    "the scheduler rejects the booking",
                )
            ],
            "should",
            3,
            ["REQ-005"],
            ["US-2"],
        ),
    ]
    if call_number <= 1:
        return frame(items_v1)
    # Rework pass (§2.3): only the NEW story returns; the unchanged four stay.
    return frame(
        [
            story(
                "US-5",
                "Fast, simple booking flow",
                "student",
                "core screens to load quickly and booking to take few steps",
                "the platform stays simple and fast to use.",
                [
                    (
                        "a new student opens the platform on a standard connection",
                        "they navigate the booking flow",
                        "screens load within 2 s (P95) and booking takes at most 5 steps",
                    )
                ],
                "should",
                3,
                ["REQ-004"],
                [],
            ),
        ]
    )


_CHECKS_PASSED = [
    {
        "check": "Every requirement can be tested",
        "result": "passed",
        "note": "Each one has criteria that a tester can run.",
    },
    {
        "check": "Every story implements a requirement",
        "result": "passed",
        "note": "All the stories are linked to a requirement.",
    },
]
_CHECKS_FAILED = [
    {
        "check": "Every requirement can be tested",
        "result": "partly",
        "note": "One requirement has no measurable criterion.",
    },
    {
        "check": "Every story implements a requirement",
        "result": "passed",
        "note": "All the stories are linked to a requirement.",
    },
]


def _validation(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The validator: one backlog-category failure, then a pass."""
    if "uploaded record" in user:
        return {"status": "pass", "checks": _CHECKS_PASSED, "issues": []}
    if call_number <= 1:
        return {
            "status": "fail",
            "checks": _CHECKS_FAILED,
            "issues": [
                {
                    "ref": "V1",
                    "category": "backlog",
                    "severity": "high",
                    "description": "No user story inherits measurable "
                    "acceptance criteria from the "
                    "non-functional requirement REQ-004 "
                    "('The user interface of the platform "
                    "shall be simple and fast to use').",
                    "suggestion": "Add a user story that derives measurable "
                    "acceptance criteria from REQ-004.",
                    "flags": ["REQ-004"],
                }
            ],
        }
    return {"status": "pass", "checks": _CHECKS_PASSED, "issues": []}


def _intent_directive(system: str, user: str, call_number: int) -> dict[str, Any]:
    """A plausible routing answer for later runs (IntentDirectiveOutput)."""
    return {
        "target_node": "requirement_engineer",
        "instruction": "Adapt the specification to the new message from the user.",
        "about": [],
    }


_SEARCHES = [
    {"query": "students mentoring platform booking complaints", "source_type": "complaint_log"},
    {"query": "mentors volunteer time decline requests survey", "source_type": "survey"},
]


def _search_web(system: str, user: str, call_number: int) -> dict[str, Any] | None:
    """The corpus builder searches twice, then answers without a tool call."""
    return dict(_SEARCHES[call_number - 1]) if call_number <= len(_SEARCHES) else None


class DemoData:
    """Method-per-schema dataset; the fake model calls `demo.<SchemaName>(...)`.

    Subclass and override one method to vary the scenario (for example a
    validator that never passes). The `calls` history lives on the instance
    and every model clone shares this object, so a method's call number
    counts the run's questions, not the clones that answer them.
    """

    def __init__(self) -> None:
        self.calls = DemoCalls()

    PlannerOutput = staticmethod(_plain)
    # The idea settles what matters, so the planner has nothing to ask before it plans.
    PlannerQuestionsOutput = staticmethod(_no_questions)
    CorpusBuilderOutput = staticmethod(_corpus)
    MinerOutput = staticmethod(_mined)
    GeneratorOutputV2 = staticmethod(_personas)
    InterviewerTurnOutput = staticmethod(_interviewer_turn)
    PersonaAnswerOutput = staticmethod(_persona_answer)
    AnalystOutput = staticmethod(_analyst)
    EngineerOutput = staticmethod(_engineer)
    BacklogOutput = staticmethod(_backlog)
    ValidatorOutput = staticmethod(_validation)
    IntentDirectiveOutput = staticmethod(_intent_directive)
    SearchWeb = staticmethod(_search_web)


class AlwaysFailValidatorData(DemoData):
    """A dataset whose validator never passes, for the iteration-guard tests."""

    ValidatorOutput = staticmethod(
        lambda system, user, call_number: {
            "status": "fail",
            "checks": _CHECKS_FAILED,
            "issues": [
                {
                    "ref": "V1",
                    "category": "analysis",
                    "severity": "medium",
                    "description": "Persistent unresolved analysis-level issue (dataset variant).",
                    "suggestion": "Return to the requirements analysis.",
                    "flags": [],
                }
            ],
        }
    )


def make_demo_data(name: str) -> DemoData:
    """The dataset of one fake provider name (`fake:<name>`)."""
    if name == "always-fail-validation":
        return AlwaysFailValidatorData()
    return DemoData()
