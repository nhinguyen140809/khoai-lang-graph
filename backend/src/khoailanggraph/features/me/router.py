"""The account routes: register, login, logout, me, and the settings (§5)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response

from khoailanggraph.api import deps
from khoailanggraph.api.errors import ApiError
from khoailanggraph.features.me import schemas, service

router = APIRouter()


def _set_session_cookie(response: Response, token: str) -> None:
    """The httpOnly session cookie (§3): the browser holds the raw token."""
    response.set_cookie(
        key=deps.SESSION_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # secure=True in production (HTTPS), see settings
        path="/",
    )


@router.post("/auth/register", status_code=201)
async def register(
    body: schemas.RegisterBody,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Me:
    """201 with the created user (register does not open a session)."""
    user = await service.register(db, body)
    return service.me_view(user)


@router.post("/auth/login", status_code=204)
async def login(
    response: Response,
    body: schemas.LoginBody,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> None:
    """204 with the session cookie; nothing else to read (§5)."""
    user = await service.authenticate(db, body.email, body.password)
    if user is None:
        raise ApiError(
            401, "unauthenticated", "Unauthenticated", "The email or the password is wrong."
        )
    _session_row, token = await service.open_session(db, user)
    _set_session_cookie(response, token)


@router.post("/auth/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> None:
    """204: revoke the current session and drop the cookie."""
    cookie_token = request.cookies.get(deps.SESSION_COOKIE, "")
    if cookie_token:
        await service.close_session(db, cookie_token)
    response.delete_cookie(key=deps.SESSION_COOKIE, path="/")


@router.get("/me")
async def me(
    user: deps.CurrentUser,
) -> schemas.Me:
    """The signed-in user."""
    return service.me_view(user)


@router.patch("/me")
async def patch_me(
    body: schemas.PatchMeBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.Me:
    """Change the display name and the avatar."""
    patched = await service.patch_me(db, user, body)
    return service.me_view(patched)


@router.get("/me/settings")
async def get_settings(
    user: deps.CurrentUser,
    db: deps.DbSession,
) -> schemas.UserSettings:
    """The settings; the theme follows the user across devices."""
    row = await service.load_settings(db, str(user.id))
    return service.settings_view(row)


@router.put("/me/settings")
async def put_settings(
    body: schemas.UserSettingsBody,
    user: deps.CurrentUser,
    db: deps.DbSession,
    _origin: Annotated[None, Depends(deps.check_origin)],
) -> schemas.UserSettings:
    """Replace the six client fields of the settings (§5)."""
    row = await service.replace_settings(db, str(user.id), body)
    return service.settings_view(row)
