"""The account routes beyond the profile: password, sessions, model settings and usage (§5)."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID  # noqa: TC003 - FastAPI reads the annotation at run time

from fastapi import APIRouter, Depends, Query, Request, Response

from khoailanggraph.api import deps
from khoailanggraph.api.schemas import Page
from khoailanggraph.features.me import account
from khoailanggraph.features.me import account_schemas as schemas

router = APIRouter()


@router.post("/me/password", status_code=204)
async def change_password(
    body: schemas.PasswordBody,
    request: Request,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Response:
    """Change the password; the session of the request stays and every other one is revoked."""
    await account.change_password(
        db, user, account.current_session_id(getattr(request.state, "session_id", None)), body
    )
    return Response(status_code=204)


@router.get("/me/sessions")
async def list_sessions(
    request: Request, user: deps.CurrentUser, db: deps.DbSession
) -> Page[schemas.SessionView]:
    """The sessions of the user that are not revoked and not expired."""
    current = account.current_session_id(getattr(request.state, "session_id", None))
    return Page(items=await account.list_sessions(db, user, current), next_cursor=None)


@router.delete("/me/sessions/{session_id}", status_code=204)
async def revoke_session(
    session_id: UUID,
    request: Request,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Response:
    """Revoke one session; revoking the current one signs the user out."""
    await account.revoke_session(db, user, session_id)
    response = Response(status_code=204)
    if session_id == getattr(request.state, "session_id", None):
        response.delete_cookie(key=deps.SESSION_COOKIE, path="/")
    return response


@router.get("/me/model-settings")
async def get_model_settings(
    user: deps.CurrentUser, db: deps.DbSession
) -> Page[schemas.ModelSetting]:
    """The model the user chose for each agent role."""
    return Page(items=await account.model_settings(db, user), next_cursor=None)


@router.put("/me/model-settings")
async def put_model_settings(
    body: schemas.ModelSettingsBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> Page[schemas.ModelSetting]:
    """Replace the model settings of the user."""
    return Page(items=await account.replace_model_settings(db, user, body), next_cursor=None)


@router.get("/me/usage")
async def get_usage(
    user: deps.CurrentUser,
    db: deps.DbSession,
    month: Annotated[str | None, Query()] = None,
    group_by: Annotated[str | None, Query()] = None,
) -> schemas.UsageView:
    """The tokens and the cost of the user in a calendar month, in total and by group."""
    return await account.usage_of_month(db, user, month, group_by)
