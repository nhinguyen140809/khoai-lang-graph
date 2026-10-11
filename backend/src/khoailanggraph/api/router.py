"""The single v1 API router: every feature router mounts under here.

The catch-all comes last (§3): an unknown path answers 401 without a
session, 404 with one — ids stay unprobeable either way.
"""

from __future__ import annotations

from fastapi import APIRouter, Request

from khoailanggraph.api.errors import ApiError, unauthenticated
from khoailanggraph.features.artifacts.router import router as artifacts_router
from khoailanggraph.features.me.router import router as me_router
from khoailanggraph.features.projects.router import router as projects_router
from khoailanggraph.features.runs.router import router as runs_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(me_router)
api_router.include_router(projects_router)
api_router.include_router(runs_router)
api_router.include_router(artifacts_router)

# Routes of the feature routers, resolved once, so the catch-all below can
# answer correctly for anything they do not cover.
PUBLIC_PATHS = frozenset({"/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/logout"})


@api_router.api_route(
    "/{rest:path}",
    methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    include_in_schema=False,
)
async def require_session(rest: str, request: Request) -> None:
    """Auth guard of §3 for every endpoint this build has not defined."""
    user = getattr(request.state, "user", None)
    if user is None:
        raise unauthenticated()
    raise ApiError(404, "not_found", "Not found", "The page does not exist.")
