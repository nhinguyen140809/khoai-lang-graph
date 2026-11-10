"""Rate limits of the API: requests per minute for a user, attempts per minute for an address.

The windows live in the memory of the process, which is the deployment the runtime document
assumes (one API process); a second process would count its own requests.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import TYPE_CHECKING

from khoailanggraph.api.errors import ApiError, problem_response

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

    from fastapi import FastAPI, Request, Response

WINDOW_SECONDS = 60.0
AUTH_PATHS = frozenset({"/api/v1/auth/login", "/api/v1/auth/register"})


class SlidingWindow:
    """Counts the hits of each key in the last minute."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def hit(self, key: str, limit: int, now: float | None = None) -> int | None:
        """Count one hit; the seconds to wait when the key is over its limit, else None."""
        moment = time.monotonic() if now is None else now
        hits = self._hits[key]
        while hits and hits[0] <= moment - WINDOW_SECONDS:
            hits.popleft()
        if len(hits) >= limit:
            return max(int(hits[0] + WINDOW_SECONDS - moment) + 1, 1)
        hits.append(moment)
        return None


def install(app: FastAPI) -> None:
    """Answer `429 rate_limited` with `Retry-After` to a user or an address over its limit."""
    windows = SlidingWindow()

    async def middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        settings = request.app.state.settings
        path = request.url.path
        wait: int | None = None
        if request.method == "POST" and path in AUTH_PATHS:
            address = request.client.host if request.client else "unknown"
            wait = windows.hit(f"ip:{address}", settings.auth_attempts_per_minute)
        elif path.startswith("/api/v1/") and getattr(request.state, "user", None) is not None:
            wait = windows.hit(f"user:{request.state.user.id}", settings.requests_per_minute)
        if wait is not None:
            response = problem_response(
                ApiError(429, "rate_limited", "Rate limited", "Too many requests; try again soon.")
            )
            response.headers["Retry-After"] = str(wait)
            return response
        return await call_next(request)

    app.middleware("http")(middleware)
