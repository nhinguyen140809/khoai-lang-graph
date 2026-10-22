"""The research search tool: DuckDuckGo parsing and provider selection."""

from __future__ import annotations

from khoailanggraph.settings import Settings
from khoailanggraph.tools import research

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
        "University students seeking mentorship mentoring platform needs",
        "mentoring platform Mentor profiles vetting verification",
    ]


def test_demo_mode_serves_fixtures_offline() -> None:
    tool = research.make_research_search(Settings(app_env="test"))

    assert tool is research.demo_research_search


def test_live_mode_prefers_tavily_then_the_keyless_chain() -> None:
    with_key = research.make_research_search(
        Settings(app_env="test", demo_mode=False, tavily_api_key="test-key")
    )
    without_key = research.make_research_search(Settings(app_env="test", demo_mode=False))

    assert with_key is not research.live_research_search
    assert without_key is research.live_research_search


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
