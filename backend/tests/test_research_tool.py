"""The research search tool: DuckDuckGo parsing and provider selection."""

from __future__ import annotations

from typing import TYPE_CHECKING

from khoailanggraph.settings import Settings
from khoailanggraph.tools import research

if TYPE_CHECKING:
    import pytest

_DDGL_PAGE = """
<div class="result results_links results_links_deep web-result ">
  <h2 class="result__heading">
    <a rel="nofollow" class="result__a"
       href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.edu%2Fsurvey&amp;rut=abc">
       Student survey &amp; findings</a>
  </h2>
  <a class="result__snippet"
     href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.edu%2Fsurvey&amp;rut=abc">
    61% said they would <b>stop using</b> a tool that needs more taps.</a>
</div>
<div class="result result--ad ad-wrapper">
  <a rel="nofollow" class="result__a" href="//duckduckgo.com/y.js?ad_domain=spam">
     Buy mentoring now</a>
</div>
<div class="result results_links web-result">
  <a rel="nofollow" class="result__a" href="https://duckduckgo.com/internal">Internal page</a>
</div>
"""


def test_parse_duckduckgo_html_keeps_real_rows_only() -> None:
    rows = research.parse_duckduckgo_html(_DDGL_PAGE)

    assert len(rows) == 1
    title, url, snippet = rows[0]
    assert title == "Student survey & findings"
    assert url == "https://example.edu/survey"
    assert snippet == "61% said they would stop using a tool that needs more taps."


def test_research_queries_follow_the_plan() -> None:
    queries = research.research_queries(
        ["Mentor profiles, vetting, and verification expectations."],
        ["University students seeking mentorship, spanning levels."],
    )

    assert queries == [
        "University students seeking mentorship needs",
        "Mentor profiles vetting verification",
    ]


def test_live_mode_prefers_tavily_then_the_keyless_chain(monkeypatch: pytest.MonkeyPatch) -> None:
    web_calls: list[str] = []
    monkeypatch.setattr(
        research,
        "tavily_research_search",
        lambda queries, *, api_key: web_calls.append(api_key) or [],
    )
    monkeypatch.setattr(research, "live_research_search", lambda queries: [])
    monkeypatch.setattr(research, "academic_research_search", lambda queries, **_: [])

    research.make_research_search(Settings(app_env="test", tavily_api_key="test-key"))(["q"])
    assert web_calls == ["test-key"]

    web_only = Settings(app_env="test", research_academic=False)
    assert research.make_research_search(web_only) is research.live_research_search


def test_academic_hits_join_the_web_hits_without_duplicate_urls(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    seen_keys: list[str | None] = []
    web = {
        "title": "Web",
        "url": "https://a.test/x",
        "publisher": "a.test",
        "year": "",
        "text": "w",
    }
    paper = {
        "title": "Paper",
        "url": "https://doi.org/1",
        "publisher": "J",
        "year": "2020",
        "text": "p",
    }
    monkeypatch.setattr(research, "live_research_search", lambda queries: [dict(web)])
    monkeypatch.setattr(
        research,
        "academic_research_search",
        lambda queries, *, openalex_api_key=None: (
            seen_keys.append(openalex_api_key) or [dict(web), dict(paper)]
        ),
    )

    hits = research.make_research_search(Settings(app_env="test", openalex_api_key="oa-key"))(["q"])

    assert [hit["url"] for hit in hits] == ["https://a.test/x", "https://doi.org/1"]
    assert seen_keys == ["oa-key"]


def test_abstract_is_rebuilt_from_the_openalex_inverted_index() -> None:
    inverted = {"Mentors": [0], "need": [1], "clear": [2, 4], "rules": [3]}

    assert research._abstract_of(inverted) == "Mentors need clear rules clear"
    assert research._abstract_of(None) == ""


def test_parse_arxiv_atom_keeps_entries_with_an_abstract() -> None:
    feed = """<feed xmlns="http://www.w3.org/2005/Atom">
      <entry><id>http://arxiv.org/abs/1234.5678v1</id><published>2021-03-04T00:00:00Z</published>
        <title>  Eliciting
          needs </title><summary>  Interviews with   users.  </summary></entry>
      <entry><id>http://arxiv.org/abs/0000.0000v1</id><title>No abstract</title>
        <summary> </summary></entry>
    </feed>"""

    assert research.parse_arxiv_atom(feed) == [
        {
            "title": "Eliciting needs",
            "url": "http://arxiv.org/abs/1234.5678v1",
            "publisher": "arxiv.org",
            "year": "2021",
            "text": "Interviews with users.",
        }
    ]
    assert research.parse_arxiv_atom("not xml") == []


def test_extract_page_text_drops_noise_and_collapses() -> None:
    page = """
    <html><head><style>.x { color: red; }</style><script>alert("x")</script></head>
    <body><nav>Menu Home About</nav>
      <main><p>Commuters report circling lots for 10 to 15 minutes.</p>
      <p>   Second   paragraph.  </p></main>
      <footer>Copyright junk</footer></body></html>
    """
    text = research.extract_page_text(page)

    assert "alert" not in text
    assert "color: red" not in text
    assert "circling lots for 10 to 15 minutes" in text
    assert "Second paragraph." in text
