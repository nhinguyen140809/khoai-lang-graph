# ruff: noqa: S310 - every urlopen in this module targets one of the fixed
# https endpoints above; the audited risk (file:/custom schemes) cannot occur.
"""Research document search for the corpus builder node (MAJ-EVAL corpus step).

One callable per run, injected through the run's LangGraph configurable as
`research_search` — the same pattern as `artifact_sink`. It takes the search
queries the node built from the plan and returns raw search hits:

    [{"title": ..., "url": ..., "publisher": ..., "year": ..., "text": ...}]

Plain data the corpus_builder prompt receives inside `<search_results>`; the
node treats it as data, never as instructions. The web part is the Tavily
tool (real API, `TAVILY_API_KEY` of `.env`, never committed) or, without a key,
the keyless chain (DuckDuckGo HTML, then Wikipedia). Next to it the academic
part adds paper abstracts from OpenAlex (optional `OPENALEX_API_KEY`) and arXiv,
which need no sign-up; a failing academic source only contributes nothing.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections.abc import Callable, Mapping, Sequence
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from khoailanggraph.settings.base import Settings

ResearchSearch = Callable[[Sequence[str]], list[dict[str, Any]]]

_HITS_PER_QUERY = 8
_TAVILY_URL = "https://api.tavily.com/search"


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
    """The run's search tool: the web part plus the academic part.

    The web part is Tavily with a key (`TAVILY_API_KEY` of .env), else the
    keyless DuckDuckGo HTML endpoint with Wikipedia behind it. Unless
    `research_academic` is off, paper abstracts from OpenAlex and arXiv are
    added to its hits. Never None - a Tavily failure surfaces as an exception
    the safe node turns into a failed run (an honest error, never a fabricated
    corpus).
    """
    web: ResearchSearch = live_research_search
    if settings.tavily_api_key:
        tavily_key = settings.tavily_api_key
        web = lambda queries: tavily_research_search(queries, api_key=tavily_key)  # noqa: E731
    if not settings.research_academic:
        return web
    openalex_key = settings.openalex_api_key

    def search(queries: Sequence[str]) -> list[dict[str, Any]]:
        hits = web(queries)
        seen = {str(hit["url"]) for hit in hits}
        for hit in academic_research_search(queries, openalex_api_key=openalex_key):
            if str(hit["url"]) not in seen:
                seen.add(str(hit["url"]))
                hits.append(hit)
        return hits

    return search


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
        {
            "a",
            "an",
            "and",
            "are",
            "as",
            "at",
            "be",
            "both",
            "by",
            "for",
            "from",
            "in",
            "into",
            "of",
            "on",
            "or",
            "that",
            "the",
            "their",
            "them",
            "these",
            "they",
            "this",
            "to",
            "under",
            "who",
            "would",
            "with",
            "such",
        }
    )
    words = re.compile("[A-Za-z][A-Za-z'\\u2019-]{2,}").findall(sentence)
    kept = [word for word in words if word.casefold() not in stopwords][:limit]
    return " ".join(kept)


def research_queries(
    topics: Sequence[str], stakeholder_types: Sequence[str], intent: str = ""
) -> list[str]:
    """The queries the corpus builder node builds from the plan.

    Deterministic node-side query building (no LLM round trip): one query
    per stakeholder type and one per topic, reduced to leading keywords -
    the plan names what to research, the keywords make engines find it. A
    plan without terms falls back to the leading keywords of the intent.
    """
    queries: list[str] = []
    for stakeholder in stakeholder_types:
        queries.append(f"{_head_keywords(stakeholder)} needs")
    for topic in topics:
        queries.append(_head_keywords(topic))
    queries = [query for query in queries if query.strip() != "needs" and query.strip()]
    return queries or [f"{_head_keywords(intent, 6)} stakeholder needs".strip()]


_OPENALEX_URL = "https://api.openalex.org/works"
_OPENALEX_FIELDS = "title,publication_year,abstract_inverted_index,doi,id,primary_location"
_ARXIV_URL = "https://export.arxiv.org/api/query"
_ARXIV_DELAY_S = 3.0  # arXiv asks for at most one request every three seconds
_ATOM = "{http://www.w3.org/2005/Atom}"
_ACADEMIC_HITS_PER_QUERY = 3
_ABSTRACT_LIMIT = 3000
_ACADEMIC_AGENT = "khoailanggraph-research/0.1 (capstone student project)"


def _abstract_of(inverted: Mapping[str, Sequence[int]] | None) -> str:
    """The abstract text of an OpenAlex work, rebuilt from its inverted index."""
    if not inverted:
        return ""
    words = {pos: word for word, positions in inverted.items() for pos in positions}
    return " ".join(words[pos] for pos in sorted(words))[:_ABSTRACT_LIMIT]


def openalex_research_search(
    queries: Sequence[str], *, api_key: str | None = None
) -> list[dict[str, Any]]:
    """Paper abstracts from OpenAlex, a few per query, works without abstract skipped.

    Works without a key on a small daily budget shared by the network; the free
    `OPENALEX_API_KEY` gives its own budget. Any network failure yields no hits.
    """
    hits: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for query in queries:
        params = {
            "search": str(query),
            "filter": "has_abstract:true",
            "per-page": _ACADEMIC_HITS_PER_QUERY,
            "select": _OPENALEX_FIELDS,
        }
        if api_key:
            params["api_key"] = api_key
        request = urllib.request.Request(
            f"{_OPENALEX_URL}?{urllib.parse.urlencode(params)}",
            headers={"User-Agent": _ACADEMIC_AGENT},
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
            continue
        for work in payload.get("results", []):
            url = str(work.get("doi") or work.get("id") or "")
            text = _abstract_of(work.get("abstract_inverted_index"))
            if not url or not text or url in seen_urls:
                continue
            seen_urls.add(url)
            source = (work.get("primary_location") or {}).get("source") or {}
            hits.append(
                {
                    "title": str(work.get("title") or ""),
                    "url": url,
                    "publisher": str(source.get("display_name") or "OpenAlex"),
                    "year": str(work.get("publication_year") or ""),
                    "text": text,
                }
            )
    return hits


def parse_arxiv_atom(feed: str) -> list[dict[str, Any]]:
    """The hits of one arXiv Atom feed: title, abstract page, year, abstract."""
    try:
        root = ET.fromstring(feed)  # noqa: S314 - the feed comes from the fixed arXiv endpoint
    except ET.ParseError:
        return []
    hits: list[dict[str, Any]] = []
    for entry in root.findall(f"{_ATOM}entry"):
        url = (entry.findtext(f"{_ATOM}id") or "").strip()
        text = " ".join((entry.findtext(f"{_ATOM}summary") or "").split())[:_ABSTRACT_LIMIT]
        if not url or not text:
            continue
        hits.append(
            {
                "title": " ".join((entry.findtext(f"{_ATOM}title") or "").split()),
                "url": url,
                "publisher": "arxiv.org",
                "year": (entry.findtext(f"{_ATOM}published") or "")[:4],
                "text": text,
            }
        )
    return hits


def arxiv_research_search(queries: Sequence[str]) -> list[dict[str, Any]]:
    """Paper abstracts from arXiv, a few per query, every keyword required."""
    hits: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    for index, query in enumerate(queries):
        words = str(query).split()
        if not words:
            continue
        if index:
            time.sleep(_ARXIV_DELAY_S)
        params = urllib.parse.urlencode(
            {
                "search_query": " AND ".join(f"all:{word}" for word in words),
                "max_results": _ACADEMIC_HITS_PER_QUERY,
            }
        )
        request = urllib.request.Request(
            f"{_ARXIV_URL}?{params}", headers={"User-Agent": _ACADEMIC_AGENT}
        )
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                feed = response.read().decode("utf-8", errors="replace")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
            continue
        for hit in parse_arxiv_atom(feed):
            if hit["url"] not in seen_urls:
                seen_urls.add(hit["url"])
                hits.append(hit)
    return hits


def academic_research_search(
    queries: Sequence[str], *, openalex_api_key: str | None = None
) -> list[dict[str, Any]]:
    """The paper abstracts of every academic source for one set of queries."""
    return [
        *openalex_research_search(queries, api_key=openalex_api_key),
        *arxiv_research_search(queries),
    ]
