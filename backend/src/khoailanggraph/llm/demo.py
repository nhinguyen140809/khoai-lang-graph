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

import re
from typing import Any

from khoailanggraph.llm.fake import DemoCalls
from khoailanggraph.tools.research import DEMO_SEARCH_HITS

DEMO_INTENT = "I want to build an online platform for university students to find mentors."

# The fixture texts the demo dataset keeps as the corpus; entries in the
# exact order the corpus builder keeps them: students, mentors, admins.
_STUDENT_TEXT = str(DEMO_SEARCH_HITS[0]["text"])
_MENTOR_TEXT = str(DEMO_SEARCH_HITS[1]["text"])
_ADMIN_TEXT = str(DEMO_SEARCH_HITS[2]["text"])

_STUDENT_Q1 = (
    "61% said they would stop using a tool that needs more than a few taps to book a chat."  # noqa: E501
)
_STUDENT_Q2 = (
    '"I don\'t want my career questions visible to everyone," wrote one third-year respondent.'  # noqa: E501
)
_MENTOR_Q1 = (
    '"Spam requests with no agenda make me decline everything," one senior engineer reported.'  # noqa: E501
)
_MENTOR_Q2 = '"If I cannot say no without an awkward exchange, I just stop logging in."'
_ADMIN_Q1 = "Every mentoring profile must be verified before it goes live."
_ADMIN_Q2 = (
    '"I will not approve the platform without verification and reporting," the review states.'  # noqa: E501
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


def _corpus(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The curated corpus (CorpusBuilderOutput): the three documents that
    carry stakeholder voices, texts verbatim from the demo search hits."""
    relevance = (
        "Student survey on discovery, booking and privacy",
        "Mentor perspective on filtering, agendas and declining",
        "Administrator needs: verification, moderation and reporting",
    )
    kept = DEMO_SEARCH_HITS[: len(relevance)]
    sources: list[dict[str, Any]] = []
    for number, hit in enumerate(kept, start=1):
        sources.append(
            {
                "ref": f"S{number}",
                "title": str(hit["title"]),
                "url": str(hit["url"]),
                "publisher": str(hit["publisher"]),
                "year": str(hit["year"]),
                "excerpt": f"SRC excerpt {number}: {kept[number - 1]['title']}.",
                "text": str(hit["text"]),
                "relevance_reason": relevance[number - 1],
            }
        )
    return {
        "selection_rationale": (
            "Three documents cover the three stakeholder types of the plan, "
            "each quoting its stakeholders directly; the vendor page and the "
            "matching report were left out — the first has no stakeholder voice."
        ),
        "sources": sources,
    }


# Shared descriptions of the mined stakeholder groups, worded per source.
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


def _mined(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The observations of one source document (MinerOutput), keyed by the
    SRC key the node's `<source>` carries; unknown sources fail loudly."""
    match = re.search(r"SRC-\d{3}", user)
    key = match.group(0) if match is not None else ""
    if key not in _MINED_BY_SOURCE:
        msg = f"the demo miner has no fixture for source '{key}'"
        raise LookupError(msg)
    return {"observations": [dict(entry) for entry in _MINED_BY_SOURCE[key]]}


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
        "information_gaps": [
            "How students judge mentor quality before contacting them",
            "What verification steps administrators require",
            "Which usage metrics matter for semester reports",
        ],
        "stakeholder_types": ["Student", "Mentor", "Administrator"],
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


def _personas(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The three evidence-grounded personas (GeneratorOutputV2).

    The observations arrive in the prompt sorted by key — OBS-001..006
    exactly as the demo miner minted them (two per source, sources in
    insertion order) — so the fixture keys stay in sync with the store.
    """
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
                "evaluative_dimension": "simplicity and speed of booking",
                "grounded_in": ["OBS-001", "OBS-002"],
                "background": (
                    "A busy undergraduate who wants career guidance and "
                    "internship preparation, prefers quick asynchronous steps."
                ),
                "expertise": "Basic programming, no industry experience",
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
                "evidence": student_evidence,
            },
            {
                "ref": "P2",
                "name": "Dr. Lan — senior engineer, part-time mentor",
                "stakeholder_type": "Mentor",
                "evaluative_dimension": "filtering low-effort requests, clear agendas",
                "grounded_in": ["OBS-003", "OBS-004"],
                "background": (
                    "An experienced engineer willing to mentor a few students "
                    "per month if requests are well-prepared and bounded."
                ),
                "expertise": "10 years industry experience, career coaching",
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
                "evidence": mentor_evidence,
            },
            {
                "ref": "P3",
                "name": "Mr. Bao — platform administrator",
                "stakeholder_type": "Administrator",
                "evaluative_dimension": "verification and reporting before go-live",
                "grounded_in": ["OBS-005", "OBS-006"],
                "background": (
                    "Responsible for the platform's safe operation and its "
                    "acceptance by the university administration."
                ),
                "expertise": "Academic IT operations, compliance processes",
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
                "evidence": admin_evidence,
            },
        ],
    }


_QUESTS_PER_PERSONA = 3
_QUESTIONS = [
    "What would you personally want to achieve with this mentoring platform, "
    "and what does success look like for you?",
    "When you imagine using it in a typical week, what steps would you expect "
    "to go through, and where could it go wrong for you?",
    "Are there limits, rules, or constraints on your side that the platform must respect?",
    "What problems or risks would make you stop using the platform entirely?",
]


def _interviewer_turn(system: str, user: str, call_number: int) -> dict[str, Any]:
    """One interviewer question, or the stop signal after three turns.

    The node renders each transcript line as `<key> interviewer: <content>`
    (views.transcript_lines); this counts exactly those markers, so the flow
    stops deterministically after the plan's three questions per persona.
    """
    asked = user.count(" interviewer:")
    if asked >= _QUESTS_PER_PERSONA:
        return {"question": "", "stop": True}
    index = min(asked, len(_QUESTIONS) - 1)
    return {"question": _QUESTIONS[index], "stop": False}


_ANSWERS: dict[str, str] = {
    "Student": (
        "Honestly, I barely have time between classes, so the system should "
        "be simple and fast to use. I want to search for mentors by skill or "
        "career field, see a short profile, and book a 30-minute chat without "
        "a complicated process. I also worry about privacy — I don't want my "
        "questions visible to everyone."
    ),
    "Mentor": (
        "I'm willing to guide two or three students per month, but I can "
        "only offer about two hours a week. I'm concerned about spam requests "
        "and unclear expectations — I don't want students to treat this as a "
        "homework-solving service. A clear agenda before each session and an "
        "easy way to decline requests would help."
    ),
    "Administrator": (
        "From my side, safety and oversight come first. Administrators need "
        "detailed configuration, approval workflows, and audit reports. Every "
        "mentor profile must be verified before it goes live, sessions should "
        "be moderated or at least reportable, and I need usage reports each "
        "semester. A matching algorithm sounds nice, but I will not approve "
        "the platform without verification and reporting."
    ),
}


def _persona_answer(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The persona's answer, chosen by the persona in the prompt."""
    for role, answer in _ANSWERS.items():
        if f'stakeholder_type": "{role}' in user:
            return {"answer": answer}
    for role, answer in _ANSWERS.items():
        if role in user:
            return {"answer": answer}
    return {"answer": _ANSWERS["Student"]}


_EVIDENCE = {
    "Student": [
        (
            "The platform shall let students search for mentors by skill or career field.",
            "mentor discovery and search",
            "I want to search for mentors by skill or career field",
        ),
        (
            "Students shall be able to book a 30-minute session with a mentor.",
            "session booking and scheduling",
            "book a 30-minute chat without a complicated process",
        ),
        (
            "Student questions shall remain private and not visible to other users.",
            "privacy of student interactions",
            "I don't want my questions visible to everyone",
        ),
    ],
    "Mentor": [
        (
            "Mentors shall be able to limit the number of students they mentor per month.",
            "mentor availability limits",
            "two or three students per month",
        ),
        (
            "Mentors shall have a way to decline requests without penalty.",
            "session booking and scheduling",
            "an easy way to decline requests",
        ),
        (
            "Each session shall have a clear agenda agreed before it starts.",
            "session booking and scheduling",
            "A clear agenda before each session",
        ),
    ],
    "Administrator": [
        (
            "Every mentor profile shall be verified by an administrator before publication.",
            "verification and moderation",
            "Every mentor profile must be verified before it goes live",
        ),
        (
            "The platform shall provide usage reports to administrators each semester.",
            "usage reporting",
            "usage reports each semester",
        ),
        (
            "Sessions shall be reportable and subject to moderation.",
            "verification and moderation",
            "moderated or at least reportable",
        ),
    ],
}


def _analyst(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The full analysis of the three interviews (AnalystOutput)."""
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
                            "message": f"PER-00{index}#{position + 1}",
                            "quote": statement[2],
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
            "evidenced_by": [{"message": message, "quote": quote}],
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
                "Mentors who never reply",
            ),
            latent(
                "L2",
                "Administrators need automated moderation support to keep their workload feasible.",
                "PER-003",
                "PER-003#6",
                "Limited moderation staff",
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
                "validation_status": "unverified",
                "concerns": ["AR-003"],
            },
            {
                "ref": "S2",
                "statement": "A typical mentoring session lasts about 30 minutes.",
                "reasoning": "The student persona specified 30-minute chats.",
                "impact_if_wrong": "Booking granularity and mentor capacity "
                "rules would need new limits.",
                "validation_status": "unverified",
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


def _engineer(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The specification (EngineerOutput); the rework pass supersedes REQ-004."""

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


def _backlog(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The product backlog (BacklogOutput); pass two adds the fixed story."""

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


def _validation(system: str, user: str, call_number: int) -> dict[str, Any]:
    """The validator: one backlog-category failure, then a pass."""
    if call_number <= 1:
        return {
            "status": "fail",
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
    return {"status": "pass", "issues": []}


def _intent_directive(system: str, user: str, call_number: int) -> dict[str, Any]:
    """A plausible routing answer for later runs (IntentDirectiveOutput)."""
    return {
        "target_node": "requirement_engineer",
        "instruction": "Adapt the specification to the new message from the user.",
        "about": [],
    }


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


class AlwaysFailValidatorData(DemoData):
    """A dataset whose validator never passes, for the iteration-guard tests."""

    ValidatorOutput = staticmethod(
        lambda system, user, call_number: {
            "status": "fail",
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
