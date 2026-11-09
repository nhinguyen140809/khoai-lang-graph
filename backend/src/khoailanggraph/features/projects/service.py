"""Project use cases over the ORM rows (§5): the shape the FE client reads.

Parity notes (matching the current Zod on one side and API.md on the other):
`run_config` and `model_overrides` always appear (objects, never omitted),
`item_counts` is derived from live items of the project, and the
`unfinished_run_counts` count runs in `queued`, `running`, `interrupted` —
`interrupted` being the ones waiting on a review, exactly what the badge on
the activity bar shows. Nothing here touches HTTP.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, cast
from uuid import UUID, uuid4

from sqlalchemy import func, select

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.me.models import UserRow

from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.artifacts.models import ArtifactItemRow
from khoailanggraph.features.me.models import UserSettingsRow
from khoailanggraph.features.projects import schemas
from khoailanggraph.features.projects.models import ProjectRow
from khoailanggraph.features.projects.validation import model_problems, run_defaults_problems
from khoailanggraph.features.runs.models import RunRow

UNFINISHED_STATUSES = ("queued", "running", "interrupted")
# The status a project shows, from the one that needs the user most to the one that needs least.
ROLLUP_ORDER = ("interrupted", "failed", "running", "queued", "cancelled", "succeeded")


def _now() -> datetime:
    return datetime.now(UTC)


async def get_project_row(session: AsyncSession, project_id: UUID) -> ProjectRow:
    """The project row or a 404 Problem (the one answer for missing ids)."""
    row = await session.get(ProjectRow, project_id)
    if row is None or row.deleted_at is not None:
        raise ApiError(404, "not_found", "Not found", "The project does not exist.")
    return row


async def _item_counts(session: AsyncSession, project_id: UUID) -> dict[str, int]:
    """Grouped live item counts of one project, censoring zero-sized keys? No—
    zero-sized keys stay (breaks nothing in TS; keeps the bootstrap cheap)."""
    statement = (
        select(ArtifactItemRow.kind, func.count())
        .where(
            ArtifactItemRow.project_id == project_id,
            ArtifactItemRow.deleted_at.is_(None),
        )
        .group_by(ArtifactItemRow.kind)
    )
    return {kind: int(count) for kind, count in (await session.execute(statement)).all()}


async def _unfinished_counts(session: AsyncSession, project_id: UUID) -> dict[str, int]:
    statement = (
        select(RunRow.status, func.count())
        .where(
            RunRow.project_id == project_id,
            RunRow.status.in_(UNFINISHED_STATUSES),
        )
        .group_by(RunRow.status)
    )
    rows = {status: int(count) for status, count in (await session.execute(statement)).all()}
    return {status: rows.get(status, 0) for status in UNFINISHED_STATUSES}


async def rollup_run_status(session: AsyncSession, project_id: UUID) -> schemas.RunStatus | None:
    """The status that the latest run of each thread of the project rolls up to: the one that
    needs the user most. A run that a later run of its thread replaced no longer counts; null
    before the first run."""
    rows = (
        await session.execute(
            select(RunRow.thread_id, RunRow.number, RunRow.status).where(
                RunRow.project_id == project_id
            )
        )
    ).all()
    latest: dict[UUID, tuple[int, str]] = {}
    for thread_id, number, status in rows:
        if thread_id not in latest or number > latest[thread_id][0]:
            latest[thread_id] = (number, str(status))
    statuses = {status for _number, status in latest.values()}
    return cast(
        "schemas.RunStatus | None",
        next((status for status in ROLLUP_ORDER if status in statuses), None),
    )


def _run_defaults(raw: bytes) -> schemas.RunDefaults:
    payload = json.loads(raw.decode("utf-8") or b"{}")
    if not isinstance(payload, dict):
        payload = {}
    return schemas.RunDefaults.model_validate(payload)


async def project_view(
    session: AsyncSession,
    row: ProjectRow,
) -> schemas.ProjectSummary:
    """Every field of GET /projects/{id} (§5), derived fresh per read."""
    item_counts = await _item_counts(session, row.id)
    unfinished = await _unfinished_counts(session, row.id)
    return schemas.ProjectSummary(
        id=str(row.id),
        owner_id=str(row.owner_id),
        name=row.name,
        description=row.description,
        status=row.status,
        output_language=row.output_language,
        run_config=_run_defaults(row.run_config_json),
        initial_message_id=(str(row.initial_message_id) if row.initial_message_id else None),
        model_overrides={
            k: v
            for k, v in json.loads(
                (row.model_overrides_json or b"{}").decode("utf-8") or "{}"
            ).items()
        },
        item_counts=item_counts,
        unfinished_run_counts=schemas.UnfinishedRunCounts(
            queued=unfinished.get("queued", 0),
            running=unfinished.get("running", 0),
            interrupted=unfinished.get("interrupted", 0),
        ),
        rollup_run_status=await rollup_run_status(session, row.id),
        last_activity_at=row.last_activity_at,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


@dataclass(frozen=True)
class ProjectFilters:
    """What a project list keeps: a status, some rollup run statuses (`none` matches a project
    without a run) and the projects with activity after a time."""

    status: str = "active"
    rollup_run_statuses: list[str] | None = None
    last_activity_after: datetime | None = None


async def list_projects(
    session: AsyncSession,
    owner_id: UUID,
    filters: ProjectFilters,
    *,
    cursor: int,
    limit: int,
) -> tuple[list[schemas.ProjectSummary], int | None]:
    """The projects of the owner that the filters keep, the latest activity first."""
    conditions = [
        ProjectRow.owner_id == owner_id,
        ProjectRow.status == filters.status,
        ProjectRow.deleted_at.is_(None),
    ]
    if filters.last_activity_after is not None:
        after = filters.last_activity_after.astimezone(UTC).replace(tzinfo=None)
        conditions.append(ProjectRow.last_activity_at > after)
    rows = list(
        (
            await session.scalars(
                select(ProjectRow)
                .where(*conditions)
                .order_by(ProjectRow.last_activity_at.desc(), ProjectRow.id)
            )
        ).all()
    )
    views = [await project_view(session, row) for row in rows]
    if filters.rollup_run_statuses:
        wanted = {None if value == "none" else value for value in filters.rollup_run_statuses}
        views = [view for view in views if view.rollup_run_status in wanted]
    window = views[cursor : cursor + limit]
    next_cursor = cursor + len(window) if cursor + len(window) < len(views) else None
    return window, next_cursor


async def _default_output_language(session: AsyncSession, owner: UserRow) -> str:
    """The `default_output_language` of the settings of the user; English without settings."""
    language = await session.scalar(
        select(UserSettingsRow.default_output_language).where(
            UserSettingsRow.user_id == UUID(str(owner.id))
        )
    )
    return language or "en"


async def create_project(
    session: AsyncSession,
    owner: UserRow,
    body: schemas.ProjectBody,
) -> ProjectRow:
    """Create one project; name whitespace is a 422 at the router, robust even here."""
    row = ProjectRow(
        id=uuid4(),
        owner_id=UUID(str(owner.id)),
        name=body.name,
        description=body.description,
        output_language=body.output_language or await _default_output_language(session, owner),
        run_config_json=b"{}",
        model_overrides_json=b"{}",
        last_activity_at=_now(),
    )
    session.add(row)
    await session.flush()
    return row


def _problems(*groups: list[dict[str, str]]) -> None:
    """Answer `422 validation_failed` for the problems of a body, when there are any."""
    problems = [problem for group in groups for problem in group]
    if problems:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            "The body has fields that are not valid.",
            errors=problems,
        )


def patch_problems(body: schemas.ProjectPatch) -> list[dict[str, str]]:
    """The problems of a PATCH body: the name is a text with more than whitespace, the settings
    follow the rules of run settings, and each model override is a model of the catalog that
    serves its role."""
    given = body.model_fields_set
    problems: list[dict[str, str]] = []
    if "name" in given and (body.name is None or not body.name.strip()):
        problems.append({"field": "name", "message": "Enter a name."})
    if "status" in given and body.status is None:
        problems.append({"field": "status", "message": "Choose a status."})
    if "run_config" in given:
        problems += (
            [{"field": "run_config", "message": "Give the settings."}]
            if body.run_config is None
            else run_defaults_problems("run_config", body.run_config)
        )
    if "model_overrides" in given:
        problems += (
            [{"field": "model_overrides", "message": "Give the models."}]
            if body.model_overrides is None
            else model_problems("model_overrides", body.model_overrides)
        )
    return problems


async def update_project(
    session: AsyncSession, row: ProjectRow, body: schemas.ProjectPatch
) -> ProjectRow:
    """Change the fields of a project that the body names, after checking all of them."""
    _problems(patch_problems(body))
    given = body.model_fields_set
    if "name" in given and body.name is not None:
        row.name = body.name.strip()
    if "description" in given:
        row.description = body.description
    if "status" in given and body.status is not None:
        row.status = body.status
    if "run_config" in given and body.run_config is not None:
        row.run_config_json = body.run_config.model_dump_json().encode("utf-8")
    if "model_overrides" in given and body.model_overrides is not None:
        row.model_overrides_json = json.dumps(body.model_overrides).encode("utf-8")
    row.updated_at = _now()
    await session.flush()
    return row


async def has_unfinished_run(session: AsyncSession, project_id: UUID) -> bool:
    """Whether a run of the project is queued, running or waiting for a review."""
    return bool(
        await session.scalar(
            select(func.count()).where(
                RunRow.project_id == project_id, RunRow.status.in_(UNFINISHED_STATUSES)
            )
        )
    )


async def delete_project(session: AsyncSession, row: ProjectRow) -> None:
    """Soft delete: the project is left out of lists and its endpoints answer 404. A project
    with an unfinished run is refused: the run is stopped first."""
    if await has_unfinished_run(session, row.id):
        raise ApiError(
            409,
            "invalid_state",
            "Invalid state",
            "A run of the project is not finished; stop it first.",
        )
    row.deleted_at = _now()
    await session.flush()


async def has_unfinished_thread_run(session: AsyncSession, thread_id: UUID) -> bool:
    """Whether a run of the thread is queued, running or waiting for a review."""
    return bool(
        await session.scalar(
            select(func.count()).where(
                RunRow.thread_id == thread_id, RunRow.status.in_(UNFINISHED_STATUSES)
            )
        )
    )
