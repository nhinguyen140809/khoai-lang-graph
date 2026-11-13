"""The files of the exports, rendered from plain data."""

from __future__ import annotations

import csv
import io
import json

import pytest

from khoailanggraph.features.exports import renderers
from khoailanggraph.features.exports.renderers import Document, ExportData

ARTIFACT = {
    "id": "a1",
    "kind": "requirement_specification",
    "title": "Requirement specification",
    "summary": "What the platform must do.",
    "version": 3,
    "content": {"purpose": "Find mentors.", "scope": "", "out_of_scope": ["Payments", "Chat"]},
}


def _item(key: str, number: str, depth: int, **content: object) -> dict[str, object]:
    base = {"title": key, "statement": f"Statement of {key}"}
    return {
        "id": f"id-{key}",
        "key": key,
        "kind": "spec_requirement",
        "outline_number": number,
        "depth": depth,
        "content": {**base, **content},
    }


DATA = ExportData(
    project_name="Mentors",
    template_title="Requirement specification",
    documents=[
        Document(
            ARTIFACT,
            [
                {
                    "id": "s1",
                    "key": "SEC-001",
                    "kind": "section",
                    "outline_number": "1",
                    "depth": 1,
                    "content": {"title": "Booking", "introduction": "How a session is booked."},
                },
                _item("REQ-001", "1.1", 2, rationale="Students lose time", priority="must"),
            ],
        )
    ],
)


def test_markdown_names_the_project_the_document_and_every_item() -> None:
    text = renderers.markdown(DATA)

    lines = text.splitlines()
    assert lines[0] == "# Requirement specification"
    assert "Project: Mentors" in lines
    assert "## Requirement specification" in lines
    assert "_What the platform must do._" in lines
    assert "### 1 Booking (SEC-001)" in lines
    assert "#### 1.1 REQ-001 (REQ-001)" in lines
    assert "- **Statement**: Statement of REQ-001" in lines


def test_markdown_leaves_out_a_field_without_a_value_and_lists_a_list() -> None:
    text = renderers.markdown(DATA)

    assert "**Scope**" not in text
    assert "- **Out of scope**:\n  - Payments\n  - Chat" in text


def test_a_heading_never_goes_deeper_than_six_levels() -> None:
    deep = Document(ARTIFACT, [_item("REQ-009", "1.1.1.1.1.1.1", 9)])

    text = renderers.markdown(ExportData("P", "T", [deep]))

    assert "####### " not in text
    assert "###### 1.1.1.1.1.1.1 REQ-009" in text


def test_json_holds_the_artifact_and_its_items() -> None:
    document = json.loads(renderers.json_file(DATA))

    assert document["project"] == "Mentors"
    [artifact] = document["artifacts"]
    assert artifact["version"] == 3
    assert [item["key"] for item in artifact["items"]] == ["SEC-001", "REQ-001"]
    assert set(artifact["items"][0]) == {"id", "key", "kind", "outline_number", "depth", "content"}


def test_the_items_table_has_a_column_for_every_field_of_the_kinds() -> None:
    rows = list(csv.reader(io.StringIO(renderers.items_csv(DATA))))

    header = rows[0]
    assert header[:3] == ["key", "kind", "outline_number"]
    assert "introduction" in header
    assert "statement" in header
    requirement = dict(zip(header, rows[2], strict=True))
    assert requirement["statement"] == "Statement of REQ-001"
    assert requirement["introduction"] == ""


MATRIX = {
    "columns": [
        {"key": "a", "title": "Story", "kinds": ["x"]},
        {"key": "b", "title": "Need", "kinds": ["y"]},
    ],
    "rows": [
        {
            "cells": {
                "a": [{"item_id": "1", "key": "US-1", "kind": "x", "title": "Book | pay"}],
                "b": [
                    {"item_id": "2", "key": "RAW-1", "kind": "y", "title": "Fast"},
                    {"item_id": "3", "key": "LN-1", "kind": "y", "title": "Safe"},
                ],
            }
        },
        {"cells": {"a": [], "b": []}},
    ],
}


def test_the_matrix_is_a_table_with_the_titles_of_its_columns() -> None:
    data = ExportData("P", "Table", [], MATRIX)

    rows = list(csv.reader(io.StringIO(renderers.matrix_csv(data))))

    assert rows == [
        ["Story", "Need"],
        ["US-1 Book | pay", "RAW-1 Fast; LN-1 Safe"],
        ["", ""],
    ]


def test_the_matrix_in_markdown_does_not_break_its_cells() -> None:
    text = renderers.markdown(ExportData("P", "Table", [], MATRIX))

    assert "| US-1 Book / pay | RAW-1 Fast; LN-1 Safe |" in text.splitlines()


def test_a_transcript_names_each_speaker_by_the_participants() -> None:
    transcript = Document(
        {
            "id": "t",
            "kind": "interview_transcript",
            "title": "Interview with Lan",
            "summary": None,
            "version": 2,
            "content": {
                "participants": [
                    {
                        "key": "interviewer",
                        "name": "Interviewer",
                        "role": "interviewer",
                        "item_id": None,
                    },
                    {"key": "PER-001", "name": "Lan", "role": "persona", "item_id": "p"},
                ],
                "status": "completed",
                "turn_count": 1,
                "stop_reason": "interviewer_stopped",
            },
        },
        [
            {
                "key": "PER-001#1",
                "kind": "interview_message",
                "outline_number": "1",
                "depth": 1,
                "content": {"speaker": "interviewer", "content": "How do you book?", "turn": 1},
            },
            {
                "key": "PER-001#2",
                "kind": "interview_message",
                "outline_number": "2",
                "depth": 1,
                "content": {"speaker": "PER-001", "content": "At the desk.", "turn": 1},
            },
            {
                "key": "PER-001#3",
                "kind": "interview_message",
                "outline_number": "3",
                "depth": 1,
                "content": {"speaker": "stranger", "content": "Hello", "turn": 2},
            },
        ],
    )

    text = renderers.markdown(ExportData("P", "Interviews", [transcript]))

    assert "**Interviewer:** How do you book?" in text
    assert "**Lan:** At the desk." in text
    assert "**stranger:** Hello" in text


@pytest.mark.parametrize(
    ("template", "fmt"),
    [
        ("requirement_specification", "markdown"),
        ("product_backlog", "csv"),
        ("traceability_matrix", "csv"),
        ("full_project", "json"),
    ],
)
def test_a_template_in_a_supported_format_renders_bytes(template: str, fmt: str) -> None:
    content = renderers.render(template, fmt, ExportData("P", "T", DATA.documents, MATRIX))

    assert isinstance(content, bytes)
    assert content.endswith(b"\n")
