"""Shared request dependencies: the session, the DB session and CSRF.

Every protected endpoint depends on `current_user` (session cookie). Every
state-changing request passes the origin check: a POST/PATCH/PUT/DELETE with
a foreign `Origin` is rejected with 403, the browser being the only client
and the same origin deployed (docs/API.md §3). A missing Origin passes —
same-origin browser fetches carry it; curl and tests do not.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from khoailanggraph.api.errors import ApiError, unauthenticated
from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

    from khoailanggraph.features.me.models import UserRow

SESSION_COOKIE = "khoailanggraph_session"


async def db_session(request: Request) -> AsyncGenerator[AsyncSession, None]:
    """The request's DB session, committed-or-rolled-back on handler exit."""
    session: AsyncSession = request.app.state.session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


DbSession = Annotated[AsyncSession, Depends(db_session)]


def check_origin(
    request: Request,
    origin: Annotated[str | None, Header()] = None,
) -> None:
    """Reject cross-origin state changes (the CSRF rule of docs/API.md).

    The `Origin` must equal the application origin: the backend's own request
    host, or one of the configured `csrf_allowed_origins` (dev proxies /api
    from the Next.js server, so the application origin is the frontend's).
    §3: every request with a method other than GET or HEAD must carry the
    header — a missing Origin is a 403, not a pass.
    """
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    if origin is None:
        raise ApiError(403, "forbidden", "Forbidden", "Origin check failed.")
    settings = get_settings()
    request_host = request.url.netloc
    origin_host = origin.removeprefix("https://").removeprefix("http://")
    allowed_hosts = {request_host} | {
        allowed.removeprefix("https://").removeprefix("http://")
        for allowed in settings.csrf_allowed_origins
    }
    if origin_host not in allowed_hosts:
        raise ApiError(403, "forbidden", "Forbidden", "Origin check failed.")


async def require_user(request: Request) -> Any:
    """Resolve the signed-in user of the session cookie on the request."""
    if getattr(request.state, "user", None) is None:
        raise unauthenticated()
    return request.state.user


CurrentUser = Annotated["UserRow", Depends(require_user)]
