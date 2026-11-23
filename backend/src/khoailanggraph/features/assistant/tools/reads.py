"""The reads the assistant may make, and nothing else.

Each one answers one kind of question about the project in a few lines: what an item says, what a
document holds, how the last run ended, what is still open, where an item came from, what a stage
does, and what is left of the month's budget. The answer is capped, because it goes back into the
prompt of the next round.
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import func, select

from khoailanggraph.agents import workflows
from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.domain.run_config import DEFAULT_MAX_STEPS, RunParameters
from khoailanggraph.features.artifacts.models import ArtifactItemRow, ArtifactRow
from khoailanggraph.features.artifacts.service import (
    item_trace,
    list_artifact_items,
    list_project_artifacts,
)
from khoailanggraph.features.assistant.models import AssistantTurnRow
from khoailanggraph.features.runs import usage as run_usage
from khoailanggraph.features.runs.models import RunRow, RunStepRow
from khoailanggraph.settings import get_settings

from .registry import Tool, ToolContext

if TYPE_CHECKING:
    from collections.abc import Mapping

# The caps that keep an answer short enough to read in the prompt of the next round.
ANSWER_LIMIT = 1800
LIST_LIMIT = 40
FIELD_LIMIT = 220

# One item that a person names is read whole, so it has room that a list does not: a profile or a
# requirement says its priorities and its background in the last fields.
ITEM_LIMIT = 6000
ITEM_FIELD_LIMIT = 1500
ISSUE_LIMIT = 20

# How many items a search looks through, newest first.
SEARCH_SCAN_LIMIT = 500

# The kinds of item that say something is still open, and the field that says whether it is.
ISSUE_KINDS = ("validation_issue", "conflict", "ambiguity_issue", "assumption")
_TITLE_FIELDS = ("title", "name", "statement", "description", "check")
_OPEN_STATUS = {"open", "unverified"}


def _loads(blob: bytes | None) -> Any:
    try:
        return json.loads((blob or b"{}").decode("utf-8"))
    except ValueError:
        return {}


def _cap(text: str, limit: int = ANSWER_LIMIT) -> str:
    return text if len(text) <= limit else text[:limit].rstrip() + " …"


def _one_line(value: Any) -> str:
    if isinstance(value, str):
        return " ".join(value.split())
    return json.dumps(value, ensure_ascii=False)


def _fields_of(content: Any) -> list[tuple[str, str]]:
    """The fields of one item as named lines, the ones a person reads first at the top."""
    if not isinstance(content, dict):
        return [("", _cap(_one_line(content), ITEM_FIELD_LIMIT))]
    named = [name for name in _TITLE_FIELDS if name in content]
    rest = [name for name in content if name not in named]
    return [
        (name, f"- {name}: {_cap(_one_line(content[name]), ITEM_FIELD_LIMIT)}")
        for name in [*named, *rest]
        if content[name] not in (None, "", [], {})
    ]


def _fit(head: str, fields: list[tuple[str, str]], limit: int) -> str:
    """The head and as many whole fields as fit, naming the fields that are left out."""
    lines = [head]
    used = len(head)
    for index, (_, line) in enumerate(fields):
        if used + len(line) + 1 > limit and index > 0:
            left = ", ".join(name for name, _ in fields[index:] if name)
            lines.append(f"(not shown, too long: {left})")
            break
        lines.append(line)
        used += len(line) + 1
    return "\n".join(lines)


def _title_of(content: Any) -> str:
    if not isinstance(content, dict):
        return ""
    return next((_one_line(content[name]) for name in _TITLE_FIELDS if content.get(name)), "")[
        :FIELD_LIMIT
    ]


async def _latest_artifact(ctx: ToolContext, kind: str) -> ArtifactRow | None:
    """The newest document of `kind`: the one a person means when they name the document."""
    return await ctx.session.scalar(
        select(ArtifactRow)
        .where(
            ArtifactRow.project_id == ctx.project.id,
            ArtifactRow.kind == kind,
            ArtifactRow.deleted_at.is_(None),
        )
        .order_by(ArtifactRow.created_at.desc(), ArtifactRow.version.desc())
        .limit(1)
    )


async def _item_by_key(ctx: ToolContext, key: str) -> ArtifactItemRow | None:
    return await ctx.session.scalar(
        select(ArtifactItemRow)
        .where(
            ArtifactItemRow.project_id == ctx.project.id,
            ArtifactItemRow.key == key,
            ArtifactItemRow.deleted_at.is_(None),
        )
        .order_by(ArtifactItemRow.updated_at.desc())
        .limit(1)
    )


async def read_item(ctx: ToolContext, key: str | None) -> str:
    """One item by its key: what it says, in its own fields."""
    if key is None or not key.strip():
        return "No key was given. Name the item by its key, such as REQ-003 or PER-001."
    row = await _item_by_key(ctx, key.strip())
    if row is None:
        return f"This project has no item with the key {key.strip()}."
    ctx.reads.note_item(row)
    content = _loads(row.content_json)
    head = f"{row.key} ({row.kind}), id {row.id}, version {row.version}, {row.review_status}"
    return _fit(head, _fields_of(content), ITEM_LIMIT)


async def read_document(ctx: ToolContext, kind: str | None) -> str:
    """One document of the project: its head and the list of its items."""
    if kind is None or not kind.strip():
        kinds = sorted({row.kind for row in await _artifacts_of(ctx)})
        return "Name the kind of the document. This project has: " + ", ".join(kinds) + "."
    artifact = await _latest_artifact(ctx, kind.strip())
    if artifact is None:
        return f"This project has no {kind.strip()} document yet."
    items, _next = await list_artifact_items(
        ctx.session,
        UUID(str(artifact.id)),
        kind=None,
        review_status=None,
        parent_item_id=None,
        limit=LIST_LIMIT,
        cursor=0,
    )
    ctx.reads.note_artifact(artifact)
    head = (
        f"{artifact.title} ({artifact.kind}), version {artifact.version}, "
        f"{artifact.review_status}, {len(items)} items listed"
    )
    lines = [f"{item.outline_number} {item.key}: {_title_of(item.content)}" for item in items]
    return _cap("\n".join([head, *lines]))


async def _artifacts_of(ctx: ToolContext) -> list[Any]:
    artifacts, _next = await list_project_artifacts(
        ctx.session, UUID(str(ctx.project.id)), limit=100, cursor=0
    )
    return list(artifacts)


async def latest_run(ctx: ToolContext, key: str | None) -> str:
    """How the last run of the project stands, and why it failed when it did."""
    run = await ctx.session.scalar(
        select(RunRow)
        .where(
            RunRow.project_id == ctx.project.id,
            RunRow.workflow_name == workflows.MAIN_WORKFLOW.name,
        )
        .order_by(RunRow.created_at.desc(), RunRow.number.desc())
        .limit(1)
    )
    if run is None:
        return "This project has not run yet."
    lines = [f"run {run.number}: {run.status}, stage {run.current_stage}, {run.step_count} steps"]
    if run.error_message:
        lines.append(f"error {run.error_code} at {run.error_stage}: {run.error_message}")
    failed = await ctx.session.scalar(
        select(RunStepRow)
        .where(RunStepRow.run_id == run.id, RunStepRow.status == "failed")
        .order_by(RunStepRow.sequence.desc())
        .limit(1)
    )
    if failed is not None and failed.error:
        lines.append(f"the step that failed: {failed.node} ({failed.stage}): {failed.error}")
    return _cap("\n".join(lines))


def _is_open(row: ArtifactItemRow) -> bool:
    content = _loads(row.content_json)
    if not isinstance(content, dict):
        return False
    status = content.get("status", content.get("validation_status"))
    return isinstance(status, str) and status in _OPEN_STATUS


async def open_issues(ctx: ToolContext, key: str | None) -> str:
    """What still blocks the work: the open findings and the last validation verdict."""
    report = await _latest_artifact(ctx, "validation_report")
    lines: list[str] = []
    if report is not None:
        content = _loads(report.content_json)
        verdict = content.get("status") if isinstance(content, dict) else None
        iteration = content.get("iteration") if isinstance(content, dict) else None
        lines.append(f"the last validation report (iteration {iteration}): {verdict}")
    rows = (
        await ctx.session.scalars(
            select(ArtifactItemRow)
            .where(
                ArtifactItemRow.project_id == ctx.project.id,
                ArtifactItemRow.kind.in_(ISSUE_KINDS),
                ArtifactItemRow.deleted_at.is_(None),
            )
            .order_by(ArtifactItemRow.updated_at.desc())
            .limit(200)
        )
    ).all()
    opened = [row for row in rows if _is_open(row)][:ISSUE_LIMIT]
    if not opened:
        lines.append("nothing is open")
        return _cap("\n".join(lines))
    lines.append(f"{len(opened)} open:")
    for row in opened:
        ctx.reads.note_item(row)
        content = _loads(row.content_json)
        severity = content.get("severity") if isinstance(content, dict) else None
        title = _title_of(content)
        lines.append(f"- {row.key} ({row.kind}, {severity or 'no severity'}): {title}")
    return _cap("\n".join(lines))


async def trace_item(ctx: ToolContext, key: str | None) -> str:
    """Where an item came from: the links and the quotes that carry the evidence."""
    if key is None or not key.strip():
        return "No key was given. Name the item by its key, such as REQ-003."
    row = await _item_by_key(ctx, key.strip())
    if row is None:
        return f"This project has no item with the key {key.strip()}."
    ctx.reads.note_item(row)
    trace = await item_trace(ctx.session, UUID(str(row.id)), direction="both", depth=2)
    if not trace.links:
        return f"{row.key} has no trace link."
    by_id = {item.id: item for item in trace.items}
    lines = [f"{len(trace.links)} links reach {len(trace.items)} items:"]
    for link in trace.links:
        source = by_id.get(link.source_item_id)
        target = by_id.get(link.target_item_id)
        left = source.key if source else "?"
        right = target.key if target else "?"
        names = f"{left} -{link.link_type}-> {right}"
        quote = link.source_quote or link.target_quote
        lines.append(f"- {names}" + (f' | "{quote[:FIELD_LIMIT]}"' if quote else ""))
    return _cap("\n".join(lines))


async def stage_info(ctx: ToolContext, key: str | None) -> str:
    """What a stage of the workflow does, from the definition of the workflow."""
    nodes = wf.nodes()
    if key is None or not key.strip():
        return "The steps are: " + ", ".join(sorted(nodes)) + "."
    name = key.strip()
    node = nodes.get(name)
    if node is None:
        return f"There is no step called {name}. The steps are: " + ", ".join(sorted(nodes)) + "."
    parts = [f"{name}: {node.get('label') or name}"]
    if node.get("purpose"):
        parts.append(str(node["purpose"]))
    if node.get("stage"):
        parts.append(f"stage: {node['stage']}")
    if node.get("agent_role"):
        parts.append(f"agent role: {node['agent_role']}")
    return _cap("\n".join(parts))


async def budget_left(ctx: ToolContext, key: str | None) -> str:
    """What the month cost so far, against the budget of the user."""
    start, end = run_usage.month_bounds()
    runs = (await ctx.session.scalars(run_usage.runs_of_user_in(ctx.user.id, start, end))).all()
    spent = run_usage.total_usage(list(runs))["cost_usd"]
    turns = (
        await ctx.session.scalars(
            select(AssistantTurnRow.usage_json).where(
                AssistantTurnRow.user_id == ctx.user.id,
                AssistantTurnRow.created_at >= start.replace(tzinfo=None),
                AssistantTurnRow.created_at < end.replace(tzinfo=None),
            )
        )
    ).all()
    spent += sum(run_usage.usage_of(blob)["cost_usd"] for blob in turns)
    budget = (
        ctx.user.monthly_budget_usd
        if ctx.user.monthly_budget_usd is not None
        else get_settings().default_monthly_budget_usd
    )
    if budget is None:
        return f"spent {spent:.2f} US dollars this month, with no budget set"
    return f"spent {spent:.2f} of {float(budget):.2f} US dollars this month"


async def list_documents(ctx: ToolContext, key: str | None) -> str:
    """The documents of the project, each with the id that a command may open it by."""
    documents = await _artifacts_of(ctx)
    if not documents:
        return "This project has no document yet."
    for document in documents[:LIST_LIMIT]:
        ctx.reads.note_artifact(document)
    return _cap(
        "\n".join(
            f"- id {row.id} | {row.kind} | {row.title} | version {row.version} | "
            f"{row.review_status}"
            for row in documents[:LIST_LIMIT]
        )
    )


async def project_overview(ctx: ToolContext, key: str | None) -> str:
    """What the project is, what it holds and where its work stands."""
    counted = (
        await ctx.session.execute(
            select(ArtifactItemRow.kind, func.count())
            .where(
                ArtifactItemRow.project_id == ctx.project.id,
                ArtifactItemRow.deleted_at.is_(None),
            )
            .group_by(ArtifactItemRow.kind)
        )
    ).all()
    documents = await _artifacts_of(ctx)
    lines = [
        f"name: {ctx.project.name or 'not named yet'}",
        f"language of the documents: {ctx.project.output_language}",
        f"documents: {len(documents)}",
    ]
    lines += [f"- {kind}: {int(count)}" for kind, count in counted] or ["nothing written yet"]
    return _cap("\n".join(lines))


async def search_items(ctx: ToolContext, key: str | None) -> str:
    """The items of the project whose key, kind or words hold the text that was asked for."""
    if key is None or not key.strip():
        return "No text was given. Name a word or a phrase to look for in the items."
    wanted = key.strip().lower()
    rows = (
        await ctx.session.scalars(
            select(ArtifactItemRow)
            .where(
                ArtifactItemRow.project_id == ctx.project.id,
                ArtifactItemRow.deleted_at.is_(None),
            )
            .order_by(ArtifactItemRow.updated_at.desc())
            .limit(SEARCH_SCAN_LIMIT)
        )
    ).all()
    found = [
        row
        for row in rows
        if wanted in f"{row.key} {row.kind} {(row.content_json or b'').decode('utf-8')}".lower()
    ][:LIST_LIMIT]
    if not found:
        return f"No item of this project holds '{key.strip()}'."
    for row in found:
        ctx.reads.note_item(row)
    return _cap(
        "\n".join(
            f"- {row.key} ({row.kind}): {_title_of(_loads(row.content_json))}" for row in found
        )
    )


async def run_settings(ctx: ToolContext, key: str | None) -> str:
    """The limits the workflow of this project runs under, the effective value of each one.

    A limit the project does not set falls back to the server default, so the answer names the
    number that a run would really use.
    """
    config = _loads(ctx.project.run_config_json)
    if not isinstance(config, dict):
        config = {}
    values = RunParameters().model_dump()
    setted = config.get("parameters")
    if isinstance(setted, dict):
        values.update(setted)
    cost = config.get("max_cost_usd")
    lines = [
        f"- max steps in one run: {config.get('max_steps', DEFAULT_MAX_STEPS)}",
        f"- cost limit in one run: {'none' if cost is None else f'{cost} US dollars'}",
        *[f"- {name.replace('_', ' ')}: {value}" for name, value in values.items()],
    ]
    return "\n".join(lines)


READ_TOOLS: tuple[Tool, ...] = (
    Tool(
        name="project_overview",
        description="what the project is and holds, by kind of item, and where its work stands",
        arg="nothing",
        run=project_overview,
    ),
    Tool(
        name="list_documents",
        description="the documents of the project, each with the id that a command opens it by",
        arg="nothing",
        run=list_documents,
    ),
    Tool(
        name="search_items",
        description="the items of the project whose key, kind or words hold a text",
        arg="a word or a phrase to look for, such as export or REQ-003",
        run=search_items,
    ),
    Tool(
        name="run_settings",
        description="the limits that the runs of this project work under",
        arg="nothing",
        run=run_settings,
    ),
    Tool(
        name="read_item",
        description="one item of the project by its key, with the fields it holds",
        arg="the item key, such as REQ-003",
        run=read_item,
    ),
    Tool(
        name="read_document",
        description="one document of the project, its head and the list of its items",
        arg="the kind of the document, such as requirement_specification",
        run=read_document,
    ),
    Tool(
        name="latest_run",
        description="how the last run of the project ended, and why it failed",
        arg="nothing; leave it empty",
        run=latest_run,
    ),
    Tool(
        name="open_issues",
        description="what still blocks the work: the open findings and the last validation verdict",
        arg="nothing; leave it empty",
        run=open_issues,
    ),
    Tool(
        name="trace_item",
        description="where an item came from, with the quote of the link that grounds it",
        arg="the item key, such as REQ-003",
        run=trace_item,
    ),
    Tool(
        name="stage_info",
        description="what one step of the workflow does",
        arg="the step name, such as analyst; empty lists every step",
        run=stage_info,
    ),
    Tool(
        name="budget_left",
        description="what this month cost so far against the budget of the user",
        arg="nothing; leave it empty",
        run=budget_left,
    ),
)

_TOOLS = {tool.name: tool for tool in READ_TOOLS}


async def run_tool(name: str, ctx: ToolContext, key: str | None) -> str:
    """Run one tool by the name the model gave. An unknown name reads nothing."""
    tool = _TOOLS.get(name)
    if tool is None:
        return f"There is no tool called {name}."
    return await tool.run(ctx, key)


def known_tools() -> Mapping[str, Tool]:
    return _TOOLS
