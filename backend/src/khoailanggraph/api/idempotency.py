"""Idempotency keys: a request that starts work can be repeated safely.

A repeated request with the same key within 24 hours gets the first response back and does the
work no second time. A key belongs to the user who sent it and to one request (method and path);
using it for another request is a `422 validation_failed`.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

from fastapi.responses import JSONResponse

from khoailanggraph.api.errors import ApiError
from khoailanggraph.platform.idempotency import IdempotencyKeyRow

if TYPE_CHECKING:
    import uuid

    from fastapi import Request
    from sqlalchemy.ext.asyncio import AsyncSession

KEY_LIFETIME = timedelta(hours=24)


async def find_response(
    session: AsyncSession, user_id: uuid.UUID, key: str | None, scope: str
) -> tuple[int, Any] | None:
    """The status and body stored for this key, when it was used for this request in the last 24
    hours; None when the key is absent, unknown or expired."""
    if not key:
        return None
    row = await session.get(IdempotencyKeyRow, (user_id, key))
    if row is None:
        return None
    if row.created_at < datetime.now(UTC).replace(tzinfo=None) - KEY_LIFETIME:
        await session.delete(row)
        await session.flush()
        return None
    if row.scope != scope:
        raise ApiError(
            422,
            "validation_failed",
            "Validation failed",
            "The key was used for another request.",
            errors=[{"field": "Idempotency-Key", "message": "Use a new key for this request."}],
        )
    return row.response_status, json.loads(row.response_json.decode("utf-8"))


async def store_response(  # noqa: PLR0913, PLR0917
    session: AsyncSession,
    user_id: uuid.UUID,
    key: str | None,
    scope: str,
    status: int,
    body: Any,
) -> None:
    """Remember the response of a request that carried a key."""
    if not key:
        return
    session.add(
        IdempotencyKeyRow(
            user_id=user_id,
            key=key,
            scope=scope,
            response_status=status,
            response_json=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        )
    )
    await session.flush()


async def replay(
    request: Request, session: AsyncSession, user_id: uuid.UUID
) -> JSONResponse | None:
    """The stored response when the request repeats one that carried the same key."""
    stored = await find_response(
        session, user_id, request.headers.get("Idempotency-Key"), f"POST {request.url.path}"
    )
    return None if stored is None else JSONResponse(status_code=stored[0], content=stored[1])


async def remember(  # noqa: PLR0913, PLR0917
    request: Request,
    session: AsyncSession,
    user_id: uuid.UUID,
    status: int,
    body: Any,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    """Store the response of a request that carries a key and send it."""
    await store_response(
        session,
        user_id,
        request.headers.get("Idempotency-Key"),
        f"POST {request.url.path}",
        status,
        body,
    )
    return JSONResponse(status_code=status, content=body, headers=headers)
