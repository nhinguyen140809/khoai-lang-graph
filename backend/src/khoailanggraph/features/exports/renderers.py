"""The files of the exports, rendered from plain data: no database, no files.

A document is an artifact with its items in outline order, both as the API gives them. A
template of the workflow definition names the artifact kinds it takes, and each format is one
function of the documents (or of the matrix of the project).
"""

from __future__ import annotations

import csv
import io
import json
import os
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

from khoailanggraph.domain.registry import schema_dict

# The formats that can be generated; the definition may list more (docx), which are refused.
SUPPORTED_FORMATS = ("markdown", "csv", "json", "txt", "pdf")
MEDIA_TYPES = {
    "markdown": "text/markdown; charset=utf-8",
    "csv": "text/csv; charset=utf-8",
    "json": "application/json",
    "txt": "text/plain; charset=utf-8",
    "pdf": "application/pdf",
}
EXTENSIONS = {"markdown": "md", "csv": "csv", "json": "json", "txt": "txt", "pdf": "pdf"}


@dataclass(frozen=True)
class Document:
    """An artifact and its items, as the API gives them."""

    artifact: dict[str, Any]
    items: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True)
class ExportData:
    """What an export draws on: the project, its documents of the template, its matrix."""

    project_name: str
    template_title: str
    documents: list[Document]
    matrix: dict[str, Any] | None = None


# - values -


def _fields(kind: str) -> list[tuple[str, str]]:
    """The fields of a kind as `(name, title)`, in the order of the detail view."""
    schema = schema_dict(kind)
    order = schema.get("x-ui-field-order") or list(schema["properties"])
    return [(name, str(schema["properties"][name].get("title") or name)) for name in order]


def _text(value: Any) -> str:
    """A value of a field on one line of text."""
    if value is None:
        return ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, list):
        return "; ".join(_text(entry) for entry in value)
    if isinstance(value, dict):
        return ", ".join(f"{key}: {_text(entry)}" for key, entry in value.items())
    return str(value)


def _lines(label: str, value: Any, indent: str = "") -> list[str]:
    """A field as markdown: one line, or a list of lines for a list."""
    if value in (None, "", [], {}):
        return []
    if isinstance(value, list) and all(isinstance(entry, str) for entry in value):
        return [f"{indent}- **{label}**:", *(f"{indent}  - {entry}" for entry in value)]
    return [f"{indent}- **{label}**: {_text(value)}"]


# - markdown -


def _heading(depth: int, text: str) -> str:
    return f"{'#' * min(depth, 6)} {text}"


def _transcript(document: Document) -> list[str]:
    people = {
        str(person["key"]): str(person["name"])
        for person in document.artifact["content"].get("participants", [])
    }
    return [
        f"**{people.get(str(item['content']['speaker']), item['content']['speaker'])}:** "
        f"{item['content']['content']}\n"
        for item in document.items
    ]


def _document_markdown(document: Document) -> list[str]:
    artifact = document.artifact
    out = [_heading(2, str(artifact["title"])), ""]
    if artifact.get("summary"):
        out += [f"_{artifact['summary']}_", ""]
    for name, title in _fields(str(artifact["kind"])):
        out += _lines(title, artifact["content"].get(name))
    if out[-1] != "":
        out.append("")
    if artifact["kind"] == "interview_transcript":
        return [*out, *_transcript(document)]
    for item in document.items:
        label = f"{item['outline_number']} {_item_title(item)} ({item['key']})"
        out += [_heading(int(item["depth"]) + 2, label), ""]
        for name, title in _fields(str(item["kind"])):
            if name != _title_field(str(item["kind"])):
                out += _lines(title, item["content"].get(name))
        out.append("")
    return out


def _title_field(kind: str) -> str | None:
    field_name = schema_dict(kind).get("x-ui-title-field")
    return None if field_name is None else str(field_name)


def _item_title(item: dict[str, Any]) -> str:
    name = _title_field(str(item["kind"]))
    value = item["content"].get(name) if name else None
    return str(value) if isinstance(value, str) and value.strip() else str(item["key"])


def markdown(data: ExportData) -> str:
    """The documents as one Markdown file, an artifact after another."""
    out = [f"# {data.template_title}", "", f"Project: {data.project_name}", ""]
    if data.matrix is not None:
        return "\n".join([*out, *_matrix_markdown(data.matrix)]).rstrip() + "\n"
    for document in data.documents:
        out += _document_markdown(document)
    return "\n".join(out).rstrip() + "\n"


def _cell(entries: list[dict[str, Any]]) -> str:
    return "; ".join(f"{entry['key']} {entry['title']}".strip() for entry in entries)


def _matrix_markdown(matrix: dict[str, Any]) -> list[str]:
    titles = [column["title"] for column in matrix["columns"]]
    keys = [column["key"] for column in matrix["columns"]]
    out = ["| " + " | ".join(titles) + " |", "|" + "---|" * len(titles)]
    for row in matrix["rows"]:
        out.append(
            "| "
            + " | ".join(_cell(row["cells"].get(key, [])).replace("|", "/") for key in keys)
            + " |"
        )
    return [*out, ""]


# - plain text -


_BOLD = re.compile(r"\*\*(.+?)\*\*")
_ITALIC = re.compile(r"_(.+?)_")


def _plain_line(line: str) -> str:
    """One line of the markdown as a reader of plain text sees it."""
    without_bold = _BOLD.sub(r"\1", line)
    without_marks = _ITALIC.sub(r"\1", without_bold)
    if without_marks.startswith("#"):
        return without_marks.lstrip("#").strip()
    return without_marks


def txt(data: ExportData) -> str:
    """The documents as one plain-text file: the lines of the markdown, without its marks."""
    return "\n".join(_plain_line(line) for line in markdown(data).splitlines()).rstrip() + "\n"


# - pdf -

# A PDF needs a font that carries the language of the project: the system's Unicode font when it
# has one, DejaVu on a Linux box, or the file named by KHOAI_PDF_FONT. Without one, a text of the
# Latin-1 range still renders in Helvetica and anything beyond it is replaced, never garbled.
_FONT_CANDIDATES = (
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
)


@lru_cache(maxsize=1)
def _body_font() -> str:
    """The font the PDF is written in, registered once."""
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    for candidate in (os.environ.get("KHOAI_PDF_FONT"), *_FONT_CANDIDATES):
        if candidate and Path(candidate).exists():
            try:
                pdfmetrics.registerFont(TTFont("KhoaiBody", candidate))
                return "KhoaiBody"
            except Exception:  # noqa: BLE001, S112 - the next font may work
                continue
    return "Helvetica"


def _safe(text: str, font: str) -> str:
    """The text in the characters the font carries; a missing glyph becomes a question mark."""
    if font != "Helvetica":
        return text
    return "".join(char if ord(char) < 256 else "?" for char in text)


def pdf(data: ExportData) -> bytes:
    """The documents as a PDF: headings, bullets and paragraphs of the markdown."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

    font = _body_font()
    buffer = io.BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        title=data.template_title,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )
    styles = {
        level: ParagraphStyle(
            f"h{level}",
            fontName=font,
            fontSize=size,
            leading=size + 4,
            spaceBefore=8 if level > 1 else 4,
            spaceAfter=4,
        )
        for level, size in ((1, 18), (2, 14), (3, 12))
    }
    body_style = ParagraphStyle("body", fontName=font, fontSize=10, leading=15)
    bullet_style = ParagraphStyle("bullet", parent=body_style, leftIndent=14, bulletIndent=4)
    story: list[Any] = []
    for raw in markdown(data).splitlines():
        line = raw.rstrip()
        if not line:
            story.append(Spacer(1, 4))
            continue
        if line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            story.append(Paragraph(_safe(_plain_line(line), font), styles[min(level, 3)]))
        elif line.startswith("- "):
            story.append(
                Paragraph(_safe(_plain_line(line[2:]), font), bullet_style, bulletText="•")
            )
        else:
            story.append(Paragraph(_safe(_plain_line(line), font), body_style))
    document.build(story)
    return buffer.getvalue()


# - json -


def json_file(data: ExportData) -> str:
    """The documents as JSON: the artifacts with their items and what they say."""
    return (
        json.dumps(
            {
                "project": data.project_name,
                "template": data.template_title,
                "artifacts": [
                    {
                        **{
                            key: document.artifact[key]
                            for key in ("id", "kind", "title", "summary", "version", "content")
                        },
                        "items": [
                            {
                                key: item[key]
                                for key in (
                                    "id",
                                    "key",
                                    "kind",
                                    "outline_number",
                                    "depth",
                                    "content",
                                )
                            }
                            for item in document.items
                        ],
                    }
                    for document in data.documents
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )


# - csv -


def _csv(rows: list[list[str]]) -> str:
    buffer = io.StringIO()
    csv.writer(buffer, lineterminator="\n").writerows(rows)
    return buffer.getvalue()


def items_csv(data: ExportData) -> str:
    """The items of the documents as a table: their key, place and every field of their kind."""
    kinds = list(dict.fromkeys(str(item["kind"]) for d in data.documents for item in d.items))
    names = list(dict.fromkeys(name for kind in kinds for name, _title in _fields(kind)))
    rows = [["key", "kind", "outline_number", *names]]
    for document in data.documents:
        for item in document.items:
            rows.append(
                [
                    str(item["key"]),
                    str(item["kind"]),
                    str(item["outline_number"]),
                    *(_text(item["content"].get(name)) for name in names),
                ]
            )
    return _csv(rows)


def matrix_csv(data: ExportData) -> str:
    """The traceability matrix as a table: one column for each level, one row for each chain."""
    matrix = data.matrix or {"columns": [], "rows": []}
    keys = [column["key"] for column in matrix["columns"]]
    rows = [[column["title"] for column in matrix["columns"]]]
    rows += [[_cell(row["cells"].get(key, [])) for key in keys] for row in matrix["rows"]]
    return _csv(rows)


# - the templates -

RENDERERS = {
    ("requirement_specification", "markdown"): markdown,
    ("requirement_specification", "txt"): txt,
    ("requirement_specification", "pdf"): pdf,
    ("product_backlog", "markdown"): markdown,
    ("product_backlog", "txt"): txt,
    ("product_backlog", "pdf"): pdf,
    ("product_backlog", "csv"): items_csv,
    ("product_backlog", "json"): json_file,
    ("traceability_matrix", "markdown"): markdown,
    ("traceability_matrix", "csv"): matrix_csv,
    ("interview_transcripts", "markdown"): markdown,
    ("full_project", "markdown"): markdown,
    ("full_project", "json"): json_file,
}


def render(template: str, fmt: str, data: ExportData) -> bytes:
    """The file of a template in a format; a pair with no renderer is a mistake of the caller."""
    rendered = RENDERERS[(template, fmt)](data)
    return rendered if isinstance(rendered, bytes) else rendered.encode("utf-8")
