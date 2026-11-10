"""The account use cases beyond the profile: password, sessions, model settings and usage."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import delete, select, update

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.me import account_schemas as schemas
from khoailanggraph.features.me import hashing
from khoailanggraph.features.me.models import ModelSettingsRow, SessionRow, UserRow
from khoailanggraph.features.projects.validation import model_problems
from khoailanggraph.features.runs import usage as run_usage
from khoailanggraph.features.runs.models import RunRow, RunStepRow
from khoailanggraph.llm.usage import Usage, add_usage, zero_usage
from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

MIN_PASSWORD_LENGTH = 8
GROUPS = ("day", "project", "agent_role", "model")
MONTH_PATTERN = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _now() -> datetime:
    return datetime.now(UTC)


def _invalid(field: str, message: str) -> ApiError:
    return ApiError(
        422,
        "validation_failed",
        "Validation failed",
        "The body has fields that are not valid.",
        errors=[{"field": field, "message": message}],
    )


async def change_password(
    session: AsyncSession,
    user: UserRow,
    current_session_id: UUID | None,
    body: schemas.PasswordBody,
) -> None:
    """Change the password and revoke every other session of the user."""
    stored = user.password_hash or ""
    if not stored or not hashing.verify_password(body.current_password, stored):
        raise _invalid("current_password", "The password is wrong.")
    if len(body.new_password) < MIN_PASSWORD_LENGTH:
        raise _invalid("new_password", f"Use at least {MIN_PASSWORD_LENGTH} characters.")
    if body.new_password == body.current_password:
        raise _invalid("new_password", "Use a password that differs from the current one.")
    user.password_hash = hashing.hash_password(body.new_password)
    user.updated_at = _now()
    statement = update(SessionRow).where(
        SessionRow.user_id == user.id, SessionRow.revoked_at.is_(None)
    )
    if current_session_id is not None:
        statement = statement.where(SessionRow.id != current_session_id)
    await session.execute(
        statement.values(revoked_at=_now()).execution_options(synchronize_session=False)
    )


async def list_sessions(
    session: AsyncSession, user: UserRow, current_session_id: UUID | None
) -> list[schemas.SessionView]:
    """The sessions that are not revoked and not expired, the most recently seen first."""
    rows = (
        await session.scalars(
            select(SessionRow)
            .where(
                SessionRow.user_id == user.id,
                SessionRow.revoked_at.is_(None),
                SessionRow.expires_at > _now(),
            )
            .order_by(SessionRow.last_seen_at.desc())
        )
    ).all()
    return [
        schemas.SessionView(
            id=str(row.id),
            expires_at=row.expires_at,
            last_seen_at=row.last_seen_at,
            user_agent=row.user_agent,
            ip_address=row.ip_address,
            created_at=row.created_at,
            current=row.id == current_session_id,
        )
        for row in rows
    ]


async def revoke_session(session: AsyncSession, user: UserRow, session_id: UUID) -> None:
    """Revoke one session of the user; a session that is revoked, expired or not theirs is 404."""
    row = await session.get(SessionRow, session_id)
    if (
        row is None
        or row.user_id != user.id
        or row.revoked_at is not None
        or row.expires_at <= _now().replace(tzinfo=None)
    ):
        raise ApiError(404, "not_found", "Not found", "The session does not exist.")
    row.revoked_at = _now()


async def model_settings(session: AsyncSession, user: UserRow) -> list[schemas.ModelSetting]:
    rows = (
        await session.scalars(
            select(ModelSettingsRow)
            .where(ModelSettingsRow.user_id == user.id)
            .order_by(ModelSettingsRow.agent_role)
        )
    ).all()
    return [
        schemas.ModelSetting(
            agent_role=row.agent_role, model_id=row.model_id, temperature=row.temperature
        )
        for row in rows
    ]


async def replace_model_settings(
    session: AsyncSession, user: UserRow, body: schemas.ModelSettingsBody
) -> list[schemas.ModelSetting]:
    """Replace the model of each role the user chose; every role is a role of the workflow, given
    once, with a model of the catalog that may serve it."""
    roles = set(wf.agent_roles())
    problems: list[dict[str, str]] = []
    seen: set[str] = set()
    for index, item in enumerate(body.items):
        prefix = f"items.{index}"
        if item.agent_role not in roles:
            problems.append({"field": f"{prefix}.agent_role", "message": "Not an agent role."})
        elif item.agent_role in seen:
            problems.append({"field": f"{prefix}.agent_role", "message": "Given more than once."})
        seen.add(item.agent_role)
        if item.agent_role in roles:
            for problem in model_problems("models", {item.agent_role: item.model_id}):
                problems.append({"field": f"{prefix}.model_id", "message": problem["message"]})
        if item.temperature is not None and not 0 <= item.temperature <= 1:
            problems.append({"field": f"{prefix}.temperature", "message": "From 0 to 1."})
    if problems:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            "The body has fields that are not valid.",
            errors=problems,
        )
    await session.execute(delete(ModelSettingsRow).where(ModelSettingsRow.user_id == user.id))
    for item in body.items:
        session.add(
            ModelSettingsRow(
                user_id=user.id,
                agent_role=item.agent_role,
                model_id=item.model_id,
                temperature=item.temperature,
            )
        )
    await session.flush()
    return await model_settings(session, user)


def _totals(usage: Usage) -> schemas.UsageTotals:
    return schemas.UsageTotals(**usage)


async def usage_of_month(
    session: AsyncSession, user: UserRow, month: str | None, group_by: str | None
) -> schemas.UsageView:
    """The tokens and the cost of the user in a month: the total and, when asked, the groups."""
    if month is not None and not MONTH_PATTERN.match(month):
        raise ApiError(400, "invalid_request", "Invalid request", "The month is not YYYY-MM.")
    if group_by is not None and group_by not in GROUPS:
        raise ApiError(
            400, "invalid_request", "Invalid request", f"group_by is one of {', '.join(GROUPS)}."
        )
    start, end = run_usage.month_bounds(month)
    rows = (
        await session.execute(
            select(RunStepRow, RunRow.project_id)
            .join(RunRow, RunRow.id == RunStepRow.run_id)
            .where(
                RunRow.started_by == user.id,
                RunStepRow.started_at >= start.replace(tzinfo=None),
                RunStepRow.started_at < end.replace(tzinfo=None),
            )
        )
    ).all()
    total = zero_usage()
    groups: dict[str, Usage] = {}
    for step, project_id in rows:
        usage = run_usage.usage_of(step.usage_json)
        total = add_usage(total, usage)
        key: Any = {
            "day": step.started_at.strftime("%Y-%m-%d"),
            "project": str(project_id),
            "agent_role": step.agent_role,
            "model": step.model_id,
        }.get(group_by or "")
        if key is not None:
            groups[key] = add_usage(groups.get(key, zero_usage()), usage)
    ordered = sorted(
        groups.items(),
        key=(lambda pair: pair[0])
        if group_by == "day"
        else (lambda pair: (-pair[1]["cost_usd"], pair[0])),
    )
    budget = (
        user.monthly_budget_usd
        if user.monthly_budget_usd is not None
        else get_settings().default_monthly_budget_usd
    )
    return schemas.UsageView(
        month=start.strftime("%Y-%m"),
        budget_usd=budget,
        total=_totals(total),
        groups=[schemas.UsageGroup(key=key, usage=_totals(usage)) for key, usage in ordered],
    )


def current_session_id(value: object) -> UUID | None:
    return value if isinstance(value, UUID) else None
