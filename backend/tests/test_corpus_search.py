"""The search tool of the corpus builder and the loop in which the agent uses it."""

from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessage
from pydantic import ValidationError

from khoailanggraph.agents.requirements_engineering import corpus_search
from khoailanggraph.agents.requirements_engineering.corpus_search import SearchWeb, run_search_loop

PAGE = {"title": "T", "url": "https://a.test/1", "publisher": "a.test", "text": "Words."}


def _call(call_id: str, **args: Any) -> dict[str, Any]:
    return {"name": "SearchWeb", "args": args, "id": call_id}


class Script:
    """A model that answers with the given messages in turn."""

    def __init__(self, *replies: AIMessage) -> None:
        self.replies = list(replies)
        self.seen: list[int] = []

    def __call__(self, messages: list[Any]) -> AIMessage:
        self.seen.append(len(messages))
        return self.replies.pop(0)


def test_the_tool_tells_the_agent_how_to_search_and_lists_the_kinds() -> None:
    schema = SearchWeb.model_json_schema()

    assert "Search for voices, not for rules" in schema["description"]
    assert set(schema["properties"]) == {
        "query",
        "source_type",
        "allowed_domains",
        "blocked_domains",
        "news",
        "max_results",
    }
    assert "forum_thread" in str(schema["properties"]["source_type"])


def test_a_call_that_breaks_the_schema_is_refused() -> None:
    for args in ({"query": "ab"}, {"query": "valid words", "max_results": 50}):
        try:
            SearchWeb.model_validate(args)
        except ValidationError:
            continue
        raise AssertionError(args)


def test_the_agent_searches_until_it_calls_no_tool_and_every_page_counts_once() -> None:
    searches: list[tuple[Any, ...]] = []

    def search(*args: Any) -> list[dict[str, Any]]:
        searches.append(args)
        return [dict(PAGE)]

    chat = Script(
        AIMessage(content="", tool_calls=[_call("1", query="students room complaints")]),
        AIMessage(
            content="",
            tool_calls=[_call("2", query="staff survey", source_type="survey", news=True)],
        ),
        AIMessage(content="Enough."),
    )
    told: list[str] = []

    pages = run_search_loop(chat, search, [], on_search=told.append)

    assert [page["url"] for page in pages] == ["https://a.test/1"]
    assert told == ["students room complaints", "staff survey"]
    assert searches[0] == (["students room complaints"],)
    assert searches[1] == (["staff survey"], {"news": True})
    assert pages[0].get("searched_as") is None
    assert chat.seen == [0, 2, 4]


def test_a_kind_marks_the_pages_it_found_and_adds_its_words() -> None:
    chat = Script(
        AIMessage(
            content="", tool_calls=[_call("1", query="room booking", source_type="forum_thread")]
        ),
        AIMessage(content="Done."),
    )
    queries: list[str] = []

    def search(batch: list[str], *_: Any) -> list[dict[str, Any]]:
        queries.extend(batch)
        return [dict(PAGE)]

    pages = run_search_loop(chat, search, [])

    assert queries == ["room booking forum discussion"]
    assert pages[0]["searched_as"] == "forum_thread"


def test_the_agent_gets_the_error_of_a_bad_call_and_the_loop_is_bounded() -> None:
    def search(*_: Any) -> list[dict[str, Any]]:
        return []

    chat = Script(
        *[
            AIMessage(content="", tool_calls=[_call(str(index), query="x")])
            for index in range(corpus_search.MAX_ROUNDS)
        ]
    )

    assert run_search_loop(chat, search, []) == []
    assert chat.replies == []
