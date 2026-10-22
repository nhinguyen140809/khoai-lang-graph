# ruff: noqa: S310 - every urlopen in this module targets one of the fixed
# https endpoints above; the audited risk (file:/custom schemes) cannot occur.
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
import html
import json
import re
import time
import urllib.error
import urllib.parse
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
        with urllib.request.urlopen(request, timeout=30) as response:
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
    """The run's search tool: the demo corpus in demo mode, else real search.

    Live mode prefers Tavily (richer pages, needs `TAVILY_API_KEY` of .env)
    and falls back to the keyless DuckDuckGo HTML endpoint, so a live run
    needs no key anyone has to sign up for. Never None — a network failure
    surfaces as an exception the safe node turns into a failed run (an
    honest error, never a fabricated corpus).
    """
    if settings.demo_mode:
        return demo_research_search
    if settings.tavily_api_key:
        return lambda queries: tavily_research_search(
            queries, api_key=settings.tavily_api_key or ""
        )
    return live_research_search


_DDG_URL = "https://html.duckduckgo.com/html/"
_DDG_DELAY_S = 0.8
_DDG_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
_PAGE_TEXT_LIMIT = 8000
_MIN_SNIPPET = 220

_RESULT_ANCHOR = re.compile(
    r'<a[^>]*class="[^"]*\bresult__a\b[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
    re.DOTALL,
)
_RESULT_SNIPPET = re.compile(
    r'<a[^>]*class="[^"]*\bresult__snippet\b[^"]*"[^>]*>(.*?)</a>',
    re.DOTALL,
)
_AD_ROW = "result--ad"


def _strip_tags(markup: str) -> str:
    """Visible text of one HTML fragment: tags dropped, entities decoded."""
    text = re.sub(r"<[^>]+>", " ", markup)
    return " ".join(html.unescape(text).split())


def _unwrap_ddg_href(href: str) -> str:
    """The real URL behind a DuckDuckGo redirect link (`uddg=` parameter)."""
    if "uddg=" not in href:
        return ""
    encoded = href.split("uddg=", 1)[1].split("&", 1)[0]
    try:
        return urllib.parse.unquote(encoded, errors="strict")
    except UnicodeError:
        return ""


def parse_duckduckgo_html(page: str) -> list[tuple[str, str, str]]:
    """The (title, url, snippet) rows of one DuckDuckGo HTML results page.

    Pure and offline-testable: ad rows are skipped, redirect hrefs unwrapped,
    markup stripped from titles and snippets. Rows without a usable URL are
    dropped — the corpus builder needs real destinations.
    """
    rows: list[tuple[str, str, str]] = []
    for match in _RESULT_ANCHOR.finditer(page):
        start, end = match.span()
        if _AD_ROW in page[max(0, start - 400) : start]:
            continue
        url = _unwrap_ddg_href(html.unescape(match.group(1)))
        if not url or url.startswith("https://duckduckgo.com"):
            continue
        title = _strip_tags(match.group(2))
        snippet_match = _RESULT_SNIPPET.search(page, end)
        snippet = _strip_tags(snippet_match.group(1)) if snippet_match is not None else ""
        if title:
            rows.append((title, url, snippet))
    return rows


def extract_page_text(page: str) -> str:
    """Readable text of one fetched page: script/style bodies dropped, tags
    stripped, whitespace collapsed — the first `text` the miner can quote
    word for word."""
    without_noise = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", page)
    return " ".join(_strip_tags(without_noise).split())[:_PAGE_TEXT_LIMIT]


def _fetch_page_text(url: str) -> str:
    """The body text of one already-known https URL, '' when unreachable."""
    request = urllib.request.Request(url, headers={"User-Agent": _DDG_AGENT}, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            page = response.read(200_000).decode("utf-8", errors="replace")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return ""
    return extract_page_text(page)


def duckduckgo_research_search(queries: Sequence[str]) -> list[dict[str, Any]]:
    """The keyless live answer: DuckDuckGo's HTML endpoint, one page per query.

    A browser User-Agent and a short pause between queries keep the endpoint
    answering. Snippets alone are too thin to mine, so the first kept hits
    carry the body text of their page — the quotes the miner extracts still
    trace verbatim to a real, resolvable URL.
    """
    hits: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for index, query in enumerate(queries):
        if index:
            time.sleep(_DDG_DELAY_S)
        request = urllib.request.Request(
            f"{_DDG_URL}?{urllib.parse.urlencode({'q': str(query)})}",
            headers={"User-Agent": _DDG_AGENT},
            method="GET",
        )
        try:
            with urllib.request.urlopen(
                request,
                timeout=15,
            ) as response:
                page = response.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
            continue
        for title, url, snippet in parse_duckduckgo_html(page):
            if url in seen_urls:
                continue
            seen_urls.add(url)
            hits.append(
                {
                    "title": title,
                    "url": url,
                    "publisher": url.removeprefix("https://").split("/")[0],
                    "year": "",
                    "text": snippet,
                }
            )

    # Thinner snippets are replaced by the page's own text, capped so a run
    # never spends its whole budget on fetching.
    for hit in hits[:10]:
        if len(str(hit["text"])) < _MIN_SNIPPET:
            hit["text"] = _fetch_page_text(str(hit["url"])) or hit["text"]
    return hits


_WIKI_API = "https://en.wikipedia.org/w/api.php"
_WIKI_DELAY_S = 0.3
_WIKI_TEXT_HITS = 8
_WIKI_AGENT = "khoailanggraph-research/0.1 (capstone student project)"


def wikipedia_research_search(queries: Sequence[str]) -> list[dict[str, Any]]:
    """The keyless encyclopedia answer: the MediaWiki search API.

    DuckDuckGo rate-limits aggressive callers to an anomaly page; the
    Wikipedia API is the stable keyless fallback — every hit is a real page
    with a full-text extract, so the miner quotes real, resolvable sources
    even when the open web is closed to us.
    """
    hits: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for index, query in enumerate(queries):
        if index:
            time.sleep(_WIKI_DELAY_S)
        params = urllib.parse.urlencode(
            {
                "action": "query",
                "list": "search",
                "srsearch": str(query),
                "srlimit": 6,
                "format": "json",
            }
        )
        try:
            with urllib.request.urlopen(
                urllib.request.Request(
                    f"{_WIKI_API}?{params}", headers={"User-Agent": _WIKI_AGENT}
                ),
                timeout=15,
            ) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
            continue
        for result in payload.get("query", {}).get("search", []):
            title = str(result.get("title", ""))
            url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
            if not title or url in seen_urls:
                continue
            seen_urls.add(url)
            hits.append(
                {
                    "title": title,
                    "url": url,
                    "publisher": "en.wikipedia.org",
                    "year": "",
                    "text": _strip_tags(str(result.get("snippet", ""))),
                }
            )

    for hit in hits[:_WIKI_TEXT_HITS]:
        hit["text"] = _wiki_page_text(str(hit["title"])) or str(hit["text"])
    return hits


def _wiki_page_text(title: str) -> str:
    """The plain-text extract of one Wikipedia page, '' when unreachable."""
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "prop": "extracts",
            "explaintext": 1,
            "exintro": 0,
            "titles": title,
            "format": "json",
        }
    )
    try:
        with urllib.request.urlopen(
            urllib.request.Request(f"{_WIKI_API}?{params}", headers={"User-Agent": _WIKI_AGENT}),
            timeout=15,
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return ""
    pages = payload.get("query", {}).get("pages", {})
    for page in pages.values():
        extract = str(page.get("extract", ""))
        if extract:
            return " ".join(extract.split())[:_PAGE_TEXT_LIMIT]
    return ""


def live_research_search(queries: Sequence[str]) -> list[dict[str, Any]]:
    """The keyless live chain: DuckDuckGo's web results, Wikipedia when the
    open web answers with nothing (its anomaly page, a captive portal, ...)."""
    hits = duckduckgo_research_search(queries)
    if hits:
        return hits
    return wikipedia_research_search(queries)


def research_search_of(config: Mapping[str, Any]) -> ResearchSearch:
    """The tool the run injected through its configurable — fail loudly if absent."""
    tool = (dict(config).get("configurable") or {}).get("research_search")
    if tool is None:
        msg = "no research_search tool in the run's configurable"
        raise RuntimeError(msg)
    return tool  # type: ignore[no-any-return]


def _head_keywords(sentence: str, limit: int = 4) -> str:
    """The leading content words of one plan sentence — plans type their
    terms as whole sentences, and search engines answer keywords, not prose."""
    stopwords = frozenset(
        "a an and are as at be both by for from in into of on or that the "
        "their them these they this to under who would with such".split()
    )
    words = re.findall(r"[A-Za-z][A-Za-z'’-]{2,}", sentence)
    kept = [word for word in words if word.casefold() not in stopwords][:limit]
    return " ".join(kept)


def research_queries(topics: Sequence[str], stakeholder_types: Sequence[str]) -> list[str]:
    """The queries the corpus builder node builds from the plan.

    Deterministic node-side query building (no LLM round trip): one query
    per stakeholder type and one per topic, reduced to leading keywords —
    the plan names what to research, the keywords make engines find it.
    """
    queries: list[str] = []
    for stakeholder in stakeholder_types:
        queries.append(f"{_head_keywords(stakeholder)} mentoring platform needs")
    for topic in topics:
        queries.append(f"mentoring platform {_head_keywords(topic)}")
    return queries or ["mentoring platform stakeholder needs"]
