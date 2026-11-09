"""RFC 9457 Problem Details responses, with the stable `code` of the API design.

One shape for every error (docs/API.md §3): `type`, `title`, `status`, `code`,
`detail` and `errors` for validation field problems. Feature code raises
ApiError; this module is the single place that turns it into a response.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from fastapi.responses import JSONResponse

if TYPE_CHECKING:
    from fastapi import Request

MEDIA_TYPE = "application/problem+json"


class ApiError(Exception):
    """Any error the API answers with; carries the stable `code` itself."""

    def __init__(
        self,
        status: int,
        code: str,
        title: str,
        detail: str | None = None,
        errors: list[dict[str, str]] | None = None,
    ) -> None:
        super().__init__(title if detail is None else detail)
        self.status = status
        self.code = code
        self.title = title
        self.detail = detail
        self.errors = errors

    def body(self) -> dict[str, Any]:
        response: dict[str, Any] = {
            "type": "about:blank",
            "title": self.title,
            "status": self.status,
            "code": self.code,
        }
        if self.detail is not None:
            response["detail"] = self.detail
        if self.errors:
            response["errors"] = self.errors
        return response


def unauthenticated() -> ApiError:
    """The one answer every protected endpoint gives without a session."""
    return ApiError(401, "unauthenticated", "Unauthenticated", "Sign in to continue.")


def problem_response(error: ApiError) -> JSONResponse:
    """Render an ApiError as a Problem Details response."""
    return JSONResponse(status_code=error.status, content=error.body(), media_type=MEDIA_TYPE)


async def api_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    """The FastAPI exception handler that renders ApiError."""
    if not isinstance(exc, ApiError):
        raise exc
    return problem_response(exc)
