"""The traceability views: the chain of the definition, the matrix, the coverage, a trace."""

from __future__ import annotations

from typing import Any

import pytest

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.features.artifacts import traceability
from khoailanggraph.features.artifacts.traceability import Chain, Direction
from support.traceability_graph import ITEMS, LINKS, graph

CHAIN = Chain.of(wf.link_types())


def test_the_levels_of_the_chain_come_from_the_pairs_of_derived_from() -> None:
    assert CHAIN.levels == [
        ["backlog_item"],
        ["spec_requirement"],
        ["analyzed_requirement"],
        ["raw_requirement", "latent_need"],
    ]
    assert CHAIN.top_kinds == ["backlog_item"]
    assert CHAIN.built_from_top_kinds == ["spec_requirement"]
    assert CHAIN.derived_kinds == ["spec_requirement", "analyzed_requirement"]


def test_the_interview_column_holds_every_kind_that_evidenced_by_leads_to() -> None:
    assert CHAIN.evidence_kinds == ["interview_message", "source_document"]


def test_a_kind_is_named_in_sentence_case() -> None:
    assert traceability.sentence_case("raw_requirement") == "Raw requirement"


def test_the_matrix_has_a_column_for_each_level_then_the_interview() -> None:
    result = traceability.matrix(graph(ITEMS, LINKS), CHAIN)

    assert [column["key"] for column in result["columns"]] == [
        "backlog_item",
        "spec_requirement",
        "analyzed_requirement",
        "raw_requirement",
        "interview_message",
    ]
    assert result["columns"][3] == {
        "key": "raw_requirement",
        "title": "Raw requirement / Latent need",
        "kinds": ["raw_requirement", "latent_need"],
    }


def _cells(row: dict[str, Any]) -> dict[str, list[str]]:
    return {key: [cell["key"] for cell in cells] for key, cells in row["cells"].items()}


def test_each_story_starts_a_row_and_the_last_level_is_one_cell() -> None:
    rows = traceability.matrix(graph(ITEMS, LINKS), CHAIN)["rows"]

    assert [_cells(row) for row in rows][:2] == [
        {
            "backlog_item": ["US1"],
            "spec_requirement": ["REQ1"],
            "analyzed_requirement": ["AR1"],
            "raw_requirement": ["RAW1", "LN1"],
            "interview_message": ["MSG1"],
        },
        {
            "backlog_item": ["US2"],
            "spec_requirement": ["REQ1"],
            "analyzed_requirement": ["AR1"],
            "raw_requirement": ["RAW1", "LN1"],
            "interview_message": ["MSG1"],
        },
    ]


def test_a_requirement_no_row_reaches_starts_a_row_of_its_own() -> None:
    rows = traceability.matrix(graph(ITEMS, LINKS), CHAIN)["rows"]

    orphan = _cells(rows[-1])
    assert orphan["spec_requirement"] == ["REQ2"]
    assert orphan["backlog_item"] == []
    assert len(rows) == 3


def test_the_coverage_lists_what_has_no_story_and_no_source() -> None:
    gaps = {gap["key"]: gap for gap in traceability.coverage(graph(ITEMS, LINKS), CHAIN)["gaps"]}

    assert [item["key"] for item in gaps["no_backlog_item"]["items"]] == ["REQ2"]
    assert [item["key"] for item in gaps["no_source"]["items"]] == ["REQ2"]
    assert gaps["needs_review"]["items"] == []


def test_a_link_made_from_an_older_version_needs_a_check() -> None:
    changed = graph(
        ITEMS,
        LINKS,
        versions={"REQ1": 3},
        link_versions={("US1", "REQ1", "derived_from"): 2, ("US2", "REQ1", "derived_from"): 3},
    )

    gaps = {gap["key"]: gap for gap in traceability.coverage(changed, CHAIN)["gaps"]}

    [item] = gaps["needs_review"]["items"]
    assert item["key"] == "US1"
    assert item["changed_targets"] == [
        {
            "target": {
                "item_id": "REQ1",
                "key": "REQ1",
                "kind": "spec_requirement",
                "title": "title of REQ1",
            },
            "link_type": "derived_from",
            "made_from_version": 2,
            "current_version": 3,
        }
    ]


def test_a_link_to_a_replaced_item_needs_a_check() -> None:
    replaced = graph(ITEMS, LINKS, superseded=frozenset({"RAW1"}))

    gaps = {gap["key"]: gap for gap in traceability.coverage(replaced, CHAIN)["gaps"]}

    assert [item["key"] for item in gaps["needs_review"]["items"]] == ["AR1"]


TRACES: list[tuple[str, str, Direction, int | None, list[str]]] = [
    (
        "backward from a requirement goes to what it came from",
        "REQ1",
        "backward",
        None,
        ["AR1", "LN1", "MSG1", "RAW1", "REQ1"],
    ),
    (
        "forward from a requirement goes to what was built from it",
        "REQ1",
        "forward",
        None,
        ["REQ1", "US1", "US2"],
    ),
    (
        "both gives the two walks",
        "REQ1",
        "both",
        None,
        ["AR1", "LN1", "MSG1", "RAW1", "REQ1", "US1", "US2"],
    ),
    (
        "both does not reach the siblings of an item",
        "US1",
        "both",
        None,
        ["AR1", "LN1", "MSG1", "RAW1", "REQ1", "US1"],
    ),
    ("depth limits the walk", "US1", "backward", 2, ["AR1", "REQ1", "US1"]),
    ("depth one reaches the next item only", "US1", "backward", 1, ["REQ1", "US1"]),
    ("an item without links is alone", "REQ2", "both", None, ["REQ2"]),
]


@pytest.mark.parametrize(
    ("name", "start", "direction", "depth", "expected"), TRACES, ids=[case[0] for case in TRACES]
)
def test_a_trace_walks_in_one_direction(
    name: str, start: str, direction: Direction, depth: int | None, expected: list[str]
) -> None:
    nodes, _links = traceability.trace(graph(ITEMS, LINKS), [start], direction, depth)

    assert [node.key for node in nodes] == expected


def test_the_links_of_a_trace_join_the_items_found() -> None:
    nodes, links = traceability.trace(graph(ITEMS, LINKS), ["US1"], "backward", 2)

    found = {node.id for node in nodes}
    assert [link.id for link in links] == ["REQ1>AR1:derived_from", "US1>REQ1:derived_from"]
    assert all(link.source in found and link.target in found for link in links)
