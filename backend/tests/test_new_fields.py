"""The fields that the documents of a run carry beyond the first version of their schemas."""

from __future__ import annotations

from types import SimpleNamespace
from typing import TYPE_CHECKING, Any

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering import nodes
from khoailanggraph.agents.requirements_engineering.outputs import kind_of_source
from test_workflow import _finished_run

if TYPE_CHECKING:
    from support.in_memory_sinks import InMemoryArtifactSink


def _contents(sink: InMemoryArtifactSink, kind: str) -> list[dict[str, Any]]:
    return [entry["content"] for entry in sink.items if entry["kind"] == kind]


def _artifacts(sink: InMemoryArtifactSink, kind: str) -> list[dict[str, Any]]:
    return [entry["content"] for entry in sink.artifacts if entry["kind"] == kind]


def _keys(list_name: str) -> set[str]:
    entry = next(entry for entry in wf.DEFINITION["value_lists"] if entry["key"] == list_name)
    return {str(value["key"]) for value in entry["values"]}


def test_an_assumption_says_how_much_it_matters_and_how_to_check_it() -> None:
    assumptions = _contents(_finished_run(), "assumption")

    assert assumptions
    for assumption in assumptions:
        assert 1 <= assumption["impact"] <= 5
        assert assumption["validation_plan"].strip()


def test_an_ambiguity_lists_the_readings_that_the_user_can_choose_from() -> None:
    issues = _contents(_finished_run(), "ambiguity_issue")

    assert issues
    assert all(len(issue["interpretations"]) >= 2 for issue in issues)


def test_an_open_conflict_has_no_strategy_yet() -> None:
    conflicts = _contents(_finished_run(), "conflict")

    assert conflicts
    assert all(
        conflict["resolution_strategy"] is None
        for conflict in conflicts
        if conflict["status"] == "open"
    )


def test_a_source_says_what_kind_of_document_it_is() -> None:
    sources = _contents(_finished_run(), "source_document")

    assert sources
    assert {source["source_type"] for source in sources} <= _keys("source_type")


def test_the_backlog_says_what_done_means_and_the_report_what_was_checked() -> None:
    sink = _finished_run()

    (backlog,) = _artifacts(sink, "product_backlog")
    reports = _artifacts(sink, "validation_report")
    assert backlog["definition_of_done"]
    assert reports
    for report in reports:
        assert report["checks"]
        assert {check["result"] for check in report["checks"]} <= _keys("check_result")


def test_the_result_of_a_check_that_is_not_in_the_list_reads_as_the_closest_one() -> None:
    check = SimpleNamespace(check="Testable", result="Passed", note="Fine.")
    odd = SimpleNamespace(check="Testable", result="no idea at all", note="Fine.")

    assert nodes._normalized_check(check)["result"] == "passed"
    assert nodes._normalized_check(odd)["result"] == "partly"


def test_the_value_lists_have_the_new_kinds_of_ambiguity_and_conflict() -> None:
    assert {"pragmatic", "referential"} <= _keys("ambiguity_type")
    assert "organizational" in _keys("conflict_type")


def test_a_kind_of_source_in_other_words_is_read_as_the_kind_of_the_list() -> None:
    assert kind_of_source("news_article") == "news"
    assert kind_of_source("Forum post") == "forum_thread"
    assert kind_of_source("complaint") == "complaint_log"
    assert kind_of_source("blog") == "other"
    assert kind_of_source("survey") == "survey"
