"""The search tool of the corpus builder, and the loop in which the agent uses it.

The agent thinks of its own queries and passes them to the tool, reads what comes back and searches
again until the plan is covered by documents of different kinds. The guidance for searching well
is the description of the tool, which the model reads with the schema, the way it reads a tool
description of any other kind. The loop is plain code around the model: it runs the calls, hands
back a compact list of what was found and stops after a few rounds.
"""

from __future__ import annotations

import json
from importlib import resources
from typing import TYPE_CHECKING, Any, Literal

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from pydantic import BaseModel, Field, ValidationError, create_model

from khoailanggraph.agents.requirements_engineering import definition as workflow_definition
from khoailanggraph.llm.note_stream import fit_note

if TYPE_CHECKING:
    from collections.abc import Callable, Mapping, Sequence

MAX_ROUNDS = 6
MAX_CALLS_PER_ROUND = 3
MAX_SEARCHES = 10
SNIPPET_LENGTH = 300
HITS_SHOWN_PER_SEARCH = 8

# Words that real voices use for each kind of document. The search adds them to a query that does
# not carry them yet, so that naming a kind steers the engine without the agent knowing its tricks.
KIND_WORDS = {
    "study": "study findings",
    "survey": "survey results",
    "interview": "interview",
    "forum_thread": "forum discussion",
    "complaint_log": "complaints reviews",
    "news": "news",
    "vendor": "product comparison",
}

SEARCH_TASK = """\
You are collecting documents for a stakeholder study. The documents will be mined for what real
stakeholders say, do, need, fear or value, so you are looking for their voices, not for the
rules or the advertising of the organization that runs a service.

Use the tool `SearchWeb` to find them. Think of your own queries, read what comes back, and search
again with a different angle until the plan is covered. Cover each stakeholder type of the plan
and look for documents of different kinds. The kinds are:
{kinds}

A plain query mostly returns what organizations wrote about themselves. To reach the voices of
people, name the places where they talk in `allowed_domains`, such as a forum for a forum thread.

When you have enough, or when more searches would find nothing new, answer with one short
sentence and no tool call. A later step chooses the documents to keep, so collect more than the
{target} that will be kept."""

BRIEF = """\
Product idea:
{intent}

Elicitation plan:
{plan}

Documents that will be kept at the end: {target}."""


def _source_types() -> list[dict[str, Any]]:
    return list(workflow_definition.value_lists().get("source_type", []))


def _search_web_schema() -> type[BaseModel]:
    """The tool schema, with the kinds of document taken from the value list of the definition."""
    keys = tuple(str(entry["key"]) for entry in _source_types()) or tuple(KIND_WORDS)
    kind: Any = Literal[keys]  # type: ignore[valid-type]
    return create_model(
        "SearchWeb",
        __doc__=SEARCH_TOOL_DESCRIPTION,
        query=(
            str,
            Field(
                min_length=3,
                description=(
                    "What to search for, written the way you would type it into a search engine: "
                    "three to eight keywords naming the people and the situation, not a sentence."
                ),
            ),
        ),
        note=(
            str | None,
            Field(
                default=None,
                description=(
                    "One short sentence for the user, in your own words and different every "
                    'time, about what this search looks for and why, such as "Checking how '
                    'students talk about rooms that stay empty." It may join two or three '
                    "ideas. Do not repeat the query word for word, and do not start it with "
                    '"I am searching".'
                ),
            ),
        ),
        source_type=(
            kind | None,
            Field(
                default=None,
                description=(
                    "The kind of document you hope to find with this query. The search adds the "
                    "words that such documents usually carry, and the result is marked with it."
                ),
            ),
        ),
        allowed_domains=(
            list[str],
            Field(
                default_factory=list,
                description=(
                    "Only return pages from these domains, such as `reddit.com`. Name the places "
                    "where the people of the plan talk, for a forum thread, a complaint record or "
                    "news. Leave empty only to search the whole web."
                ),
            ),
        ),
        blocked_domains=(
            list[str],
            Field(
                default_factory=list,
                description="Never return pages from these domains. Leave empty for none.",
            ),
        ),
        news=(
            bool,
            Field(
                default=False,
                description="True to look in news articles only, for recent events or reporting.",
            ),
        ),
        max_results=(
            int,
            Field(
                default=5,
                ge=1,
                le=10,
                description="How many pages to return, from 1 to 10.",
            ),
        ),
    )


# The key of the tool in the `tools` of the definition: its title, its words and its mark.
SEARCH_TOOL = "search"

SEARCH_TOOL_DESCRIPTION = (
    (resources.files(__package__) / "tools" / "search_web.md").read_text(encoding="utf-8").strip()
)


SearchWeb = _search_web_schema()


def kind_lines() -> str:
    """The kinds of document the agent may look for, one line each."""
    return "\n".join(
        f"- {entry['key']}: {entry.get('description', '')}"
        for entry in _source_types()
        if entry["key"] != "other"
    )


def task_messages(intent: str, plan: str, target: int) -> list[BaseMessage]:
    """The first messages of the search conversation."""
    return [
        SystemMessage(content=SEARCH_TASK.format(kinds=kind_lines(), target=target)),
        HumanMessage(content=BRIEF.format(intent=intent, plan=plan, target=target)),
    ]


def _query_of(call: BaseModel) -> str:
    """The query with the words of its kind, unless it already carries them."""
    query = str(call.query)  # type: ignore[attr-defined]
    kind = call.source_type  # type: ignore[attr-defined]
    words = KIND_WORDS.get(str(kind), "") if kind else ""
    if words and not any(word in query.lower() for word in words.split()):
        query = f"{query} {words}"
    return query


def _options_of(call: BaseModel) -> dict[str, Any]:
    """The options of a search that differ from the plain search."""
    options: dict[str, Any] = {}
    allowed = list(call.allowed_domains)  # type: ignore[attr-defined]
    blocked = list(call.blocked_domains)  # type: ignore[attr-defined]
    if allowed:
        options["allowed_domains"] = allowed
    if blocked:
        options["blocked_domains"] = blocked
    if call.news:  # type: ignore[attr-defined]
        options["news"] = True
    if call.max_results != 5:  # type: ignore[attr-defined]  # noqa: PLR2004
        options["max_results"] = call.max_results  # type: ignore[attr-defined]
    return options


def _shown(hits: Sequence[Mapping[str, Any]]) -> str:
    """What the agent reads of the hits of one search."""
    if not hits:
        return "No page matched. Try other words, another kind of document or another place."
    lines = []
    for index, hit in enumerate(hits[:HITS_SHOWN_PER_SEARCH], start=1):
        text = " ".join(str(hit.get("text", "")).split())[:SNIPPET_LENGTH]
        title, publisher, url = hit.get("title", ""), hit.get("publisher", ""), hit.get("url", "")
        lines.append(f"[{index}] {title} | {publisher} | {url}\n    {text}")
    return "\n".join(lines)


def note_of(note: str | None, query: str) -> dict[str, str]:
    """The note that tells the user what is being searched: the sentence of the agent, or, when
    it wrote none, the query on its own after a short fixed word. It is a note of the tool, so
    that the searches of a step can be shown together."""
    text = " ".join((note or "").split()) or f"Searching: {query}"
    return {"kind": "tool", "tool": SEARCH_TOOL, "text": fit_note(text)}


def run_search_loop(
    chat: Callable[[list[BaseMessage]], AIMessage],
    search: Callable[..., list[dict[str, Any]]],
    messages: list[BaseMessage],
    on_search: Callable[[dict[str, str]], None] | None = None,
) -> list[dict[str, Any]]:
    """Let the agent search until it stops, and return every distinct page it found.

    `chat` asks the model (bound to `SearchWeb`) for its next message, `search` runs one search.
    A call that breaks the schema is answered with the error so that the agent can correct it. The
    loop ends when the agent calls no tool, after `MAX_ROUNDS` rounds or `MAX_SEARCHES` searches.
    """
    found: dict[str, dict[str, Any]] = {}
    searches = 0
    for _round in range(MAX_ROUNDS):
        reply = chat(messages)
        calls = [call for call in reply.tool_calls if call["name"] == "SearchWeb"]
        if not calls:
            break
        messages.append(reply)
        for call in calls:
            result = _answer_call(call, search, found, on_search, allowed=searches < MAX_SEARCHES)
            searches += 1 if result[1] else 0
            messages.append(ToolMessage(content=result[0], tool_call_id=call["id"]))
        for call in reply.tool_calls:
            if call["name"] != "SearchWeb":
                messages.append(
                    ToolMessage(content="Unknown tool. Use SearchWeb.", tool_call_id=call["id"])
                )
        if searches >= MAX_SEARCHES:
            break
    return list(found.values())


def _answer_call(
    call: Mapping[str, Any],
    search: Callable[..., list[dict[str, Any]]],
    found: dict[str, dict[str, Any]],
    on_search: Callable[[dict[str, str]], None] | None,
    *,
    allowed: bool,
) -> tuple[str, bool]:
    """Run one call of the tool; the text for the agent, and whether a search was made."""
    if not allowed:
        return "No more searches: collect what you have and answer.", False
    try:
        parsed = SearchWeb.model_validate(call["args"])
    except ValidationError as exc:
        return f"The call was refused: {exc.errors()[0]['msg']}. Correct it and call again.", False
    query = _query_of(parsed)
    if on_search is not None:
        on_search(note_of(parsed.note, str(parsed.query)))  # type: ignore[attr-defined]
    options = _options_of(parsed)
    hits = search([query], options) if options else search([query])
    fresh = []
    for hit in hits:
        url = str(hit.get("url", ""))
        if not url:
            continue
        if url not in found:
            marked = dict(hit)
            if parsed.source_type:  # type: ignore[attr-defined]
                marked["searched_as"] = str(parsed.source_type)  # type: ignore[attr-defined]
            found[url] = marked
            fresh.append(marked)
    shown = _shown(fresh)
    return f"{len(hits)} pages, {len(fresh)} new.\n{shown}", True


def hits_as_json_lines(hits: Sequence[Mapping[str, Any]]) -> str:
    """The pages as the curation step reads them: one JSON object per line."""
    return "\n".join(json.dumps(hit, ensure_ascii=False) for hit in hits)
