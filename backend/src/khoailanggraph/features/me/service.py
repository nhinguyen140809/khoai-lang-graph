"""Account use cases: register, log in, the profile and the settings.

Pure business logic over the ORM rows — routers call these, they never
touch HTTP objects. Password verifications never leak which part failed:
register answers "an account with this email exists", login answers "the
email or the password is wrong".
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import select, update

from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.me import hashing, schemas
from khoailanggraph.features.me.models import SessionRow, UserRow, UserSettingsRow

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

SESSION_DAYS = 30


def _now() -> datetime:
    return datetime.now(UTC)


async def _settings_row(session: AsyncSession, user_id: str) -> UserSettingsRow:
    # Uuid columns take UUID objects; hex conversion is automatic.
    """The settings row of a user, created on first read (callers await it)."""
    row = await session.get(UserSettingsRow, UUID(user_id))
    if row is None:
        row = UserSettingsRow(user_id=UUID(user_id))
        session.add(row)
        await session.flush()
    return row


async def register(
    session: AsyncSession,
    body: schemas.RegisterBody,
) -> UserRow:
    """Create an account (no session); the email must be new."""
    statement = select(UserRow).where(UserRow.email == body.email.lower())
    if await session.scalar(statement) is not None:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            errors=[{"field": "email", "message": "An account with this email exists."}],
        )
    user = UserRow(
        id=uuid4(),
        email=body.email.lower(),
        password_hash=hashing.hash_password(body.password),
        display_name=body.display_name,
    )
    session.add(user)
    settings = await _settings_row(session, str(user.id))
    session.add(settings)
    await session.flush()
    return user


async def authenticate(
    session: AsyncSession,
    email: str,
    password: str,
) -> UserRow | None:
    """The user when the credentials hold; None when they do not."""
    statement = select(UserRow).where(UserRow.email == email.lower())
    user = await session.scalar(statement)
    stored = user.password_hash.strip() if user and user.password_hash else ""
    if user is None or not stored or not hashing.verify_password(password, stored):
        return None
    return user


async def open_session(
    session: AsyncSession,
    user: UserRow,
    *,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[SessionRow, str]:
    """One new session row and its raw token (the cookie value)."""
    token = hashing.new_session_token()
    row = SessionRow(
        token_hash=hashing.session_token_hash(token),
        user_id=user.id,
        expires_at=_now() + timedelta(days=SESSION_DAYS),
        user_agent=user_agent,
        ip_address=ip_address,
    )
    session.add(row)
    user.last_login_at = _now()
    await session.flush()
    return row, token


async def user_by_session_token(
    session: AsyncSession,
    token: str,
) -> tuple[UserRow, SessionRow] | None:
    """The user behind a session cookie, when it is live and unrevoked."""
    token_hash = hashing.session_token_hash(token)
    statement = select(SessionRow).where(
        SessionRow.token_hash == token_hash,
        SessionRow.revoked_at.is_(None),
        SessionRow.expires_at > _now(),
    )
    session_row = await session.scalar(statement)
    if session_row is None:
        return None
    user = await session.get(UserRow, session_row.user_id)
    if user is None or user.deleted_at is not None or user.status != "active":
        return None
    session_row.last_seen_at = _now()
    return user, session_row


async def close_session(session: AsyncSession, token: str) -> bool:
    """Revoke the session of a cookie; True when one was open."""
    token_hash = hashing.session_token_hash(token)
    statement = (
        update(SessionRow)
        .where(SessionRow.token_hash == token_hash, SessionRow.revoked_at.is_(None))
        .values(revoked_at=_now())
        .execution_options(synchronize_session=False)
    )
    result = await session.execute(statement)
    return bool(getattr(result, "rowcount", 0))


def me_view(user: UserRow) -> schemas.Me:
    """The Me response of GET /me and register (§5, exactly the fields)."""
    return schemas.Me(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        role=user.role,
        status=user.status,
        email_verified_at=user.email_verified_at,
        last_login_at=user.last_login_at,
        monthly_budget_usd=user.monthly_budget_usd,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def settings_view(row: UserSettingsRow) -> schemas.UserSettings:
    """The settings response with the six server-managed fields (§5)."""
    defaults = json.loads(row.default_run_config_json.decode("utf-8") or b"{}")
    return schemas.UserSettings(
        user_id=str(row.user_id),
        theme=row.theme,
        ui_language=row.ui_language,
        default_output_language=row.default_output_language,
        default_run_config=schemas.RunDefaultsShape.model_validate(defaults),
        notify_on_interrupt=row.notify_on_interrupt,
        notify_on_run_finished=row.notify_on_run_finished,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


async def load_settings(session: AsyncSession, user_id: str) -> UserSettingsRow:
    """The settings row for GET (created on first read)."""
    return await _settings_row(session, user_id)


async def replace_settings(
    session: AsyncSession,
    user_id: str,
    body: schemas.UserSettingsBody,
) -> UserSettingsRow:
    """PUT /me/settings: replace exactly the six client fields (§5)."""
    row = await _settings_row(session, user_id)
    row.theme = body.theme
    row.ui_language = body.ui_language
    row.default_output_language = body.default_output_language
    row.default_run_config_json = json.dumps(
        body.default_run_config.model_dump(mode="json")
    ).encode("utf-8")
    row.notify_on_interrupt = body.notify_on_interrupt
    row.notify_on_run_finished = body.notify_on_run_finished
    row.updated_at = _now()
    await session.flush()
    return row


async def patch_me(
    session: AsyncSession,
    user: UserRow,
    body: schemas.PatchMeBody,
) -> UserRow:
    """PATCH /me: display name and avatar only (§5)."""
    if body.display_name is not None:
        user.display_name = body.display_name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    user.updated_at = _now()
    await session.flush()
    return user
