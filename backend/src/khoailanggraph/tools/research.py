"""Research document search for the corpus builder node (MAJ-EVAL corpus step).

One callable per run, injected through the run's LangGraph configurable as
`research_search` — the same pattern as `artifact_sink`. It takes the search
queries the node built from the plan and returns raw search hits:

    [{"title": ..., "url": ..., "publisher": ..., "year": ..., "text": ...}]

Plain data the corpus_builder prompt receives inside `<search_results>`; the
node treats it as data, never as instructions. Two implementations: the demo
tool serves fixed documents offline (keyless runs and tests), the Tavily tool
calls the real API with the `TAVILY_API_KEY` of `.env` — never committed.
"""

from __future__ import annotations

import copy
import json
import urllib.error
import urllib.request
from collections.abc import Callable, Mapping, Sequence
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from khoailanggraph.settings.base import Settings

ResearchSearch = Callable[[Sequence[str]], list[dict[str, Any]]]

_HITS_PER_QUERY = 8
_TAVILY_URL = "https://api.tavily.com/search"


# The offline corpus of the mentor platform scenario — the same texts the
# demo dataset's miner and generator fixtures quote, so the verbatim-evidence
# gates hold end to end on a keyless run.
DEMO_SEARCH_HITS: list[dict[str, Any]] = [
    {
        "title": "Survey: what students want from campus mentoring",
        "url": "https://forum.example.edu/threads/mentoring-survey",
        "publisher": "University student forum",
        "year": "2025",
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
        "title": "Volunteer mentors on why they quit coaching programs",
        "url": "https://engineering-blogs.example.org/mentoring-workload",
        "publisher": "Engineering blog collective",
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
        "title": "Running a university platform: safety, verification, reporting",
        "url": "https://it-policy.example.edu/reports/mvp-platform-oversight",
        "publisher": "University IT policy office",
        "year": "2025",
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
        "title": "Mentor matching in three student projects: a field report",
        "url": "https://teaching-centre.example.edu/reports/matching-field-report",
        "publisher": "Teaching and learning centre",
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
        "title": "Vendor whitepaper: mentoring platform engagement metrics",
        "url": "https://vendor.example.com/whitepapers/engagement",
        "publisher": "Vendor marketing",
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


def tavily_research_search(
    queries: Sequence[str],
    *,
    api_key: str,
) -> list[dict[str, Any]]:
    """The live answer: Tavily search, one call per query, URLs deduplicated.

    Stdlib HTTP only — no new production dependency for one provider call;
    a network failure surfaces as an exception the safe node turns into a
    failed run (an honest error, never a fabricated corpus).
    """
    hits: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for query in queries:
        request = urllib.request.Request(
            _TAVILY_URL,
            data=json.dumps(
                {
                    "api_key": api_key,
                    "query": str(query),
                    "search_depth": "basic",
                    "max_results": _HITS_PER_QUERY,
                }
            ).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=30) as response:  # noqa: S310 - fixed https endpoint
            payload = json.loads(response.read().decode("utf-8"))
        for result in payload.get("results", []):
            url = str(result.get("url", ""))
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            hits.append(
                {
                    "title": str(result.get("title", "")),
                    "url": url,
                    "publisher": url.removeprefix("https://").split("/")[0],
                    "year": "",
                    "text": str(result.get("content", "")),
                }
            )
    return hits


def make_research_search(settings: Settings) -> ResearchSearch:
    """The run's search tool: the demo corpus in demo mode, Tavily otherwise.

    Never None — a live run without a key gets a tool whose first call names
    the missing setting (`TAVILY_API_KEY` of `.env`), so the failed run says
    what to fix instead of pointing at a wiring gap.
    """
    if settings.demo_mode:
        return demo_research_search
    if not settings.tavily_api_key:

        def _missing_key_research_search(queries: Sequence[str]) -> list[dict[str, Any]]:
            msg = "live runs need TAVILY_API_KEY in .env for the research corpus"
            raise RuntimeError(msg)

        return _missing_key_research_search
    return lambda queries: tavily_research_search(queries, api_key=settings.tavily_api_key or "")


def research_search_of(config: Mapping[str, Any]) -> ResearchSearch:
    """The tool the run injected through its configurable — fail loudly if absent."""
    tool = (dict(config).get("configurable") or {}).get("research_search")
    if tool is None:
        msg = "no research_search tool in the run's configurable"
        raise RuntimeError(msg)
    return tool  # type: ignore[no-any-return]


def research_queries(topics: Sequence[str], stakeholder_types: Sequence[str]) -> list[str]:
    """The queries the corpus builder node builds from the plan.

    Deterministic node-side query building (no LLM round trip): one query
    per stakeholder type and one per topic, both restricted to what the plan
    named, so the corpus follows the plan instead of the model's mood.
    """
    queries: list[str] = []
    for stakeholder in stakeholder_types:
        queries.append(f"{stakeholder} needs complaints mentoring platform")
    for topic in topics:
        queries.append(f"university mentoring platform {topic}")
    return queries or ["university mentoring platform stakeholder needs"]
