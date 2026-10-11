"""FastAPI application factory: no side effects until the lifespan runs."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import TYPE_CHECKING, Any

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

import khoailanggraph.api.models_registry  # noqa: F401 - registers every table
from khoailanggraph.api import deps
from khoailanggraph.api.errors import ApiError, api_error_handler
from khoailanggraph.api.router import api_router
from khoailanggraph.features.me import service as me_service
from khoailanggraph.platform.db import (
    ensure_schema,
    make_async_engine,
    make_session_factory,
    make_sync_engine,
)
from khoailanggraph.settings import Settings, get_settings
from khoailanggraph.settings.logging import configure_logging

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

logger = structlog.get_logger(__name__)


async def readiness_check(settings: Settings) -> None:
    """Raise when the process is up but its backing stores are not reachable."""
    if not settings.models_config_file.exists():  # pragma: no cover - config error
        msg = f"models config not found: {settings.models_config_file}"
        raise RuntimeError(msg)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Start the engine and session factory; dispose them on shutdown."""
    settings: Settings = app.state.settings
    configure_logging(settings)
    await readiness_check(settings)
    engine = make_async_engine(settings)
    if settings.app_env in {"local", "test", "dev"}:
        await ensure_schema(engine)
    app.state.sync_engine = make_sync_engine(settings)
    app.state.session_factory = make_session_factory(engine)
    structlog.contextvars.bind_contextvars(app_env=settings.app_env)
    logger.info(
        "khoailanggraph backend started",
        env=settings.app_env,
        database=settings.database_url.split("///", maxsplit=1)[-1],
    )
    try:
        yield
    finally:
        await engine.dispose()
        logger.info("khoailanggraph backend stopped")


def _has_factory(request: Request) -> bool:
    """True once the lifespan has created the session factory."""
    return getattr(request.app.state, "session_factory", None) is not None


async def session_middleware(
    request: Request,
    call_next: Any,
) -> Any:
    """Resolve the session cookie once, onto request.state, before routing."""
    request.state.user = None
    token = request.cookies.get(deps.SESSION_COOKIE)
    if token is not None and _has_factory(request):
        factory = request.app.state.session_factory
        session = factory()
        try:
            resolved = await me_service.user_by_session_token(session, token)
            if resolved is not None:
                request.state.user = resolved[0]
                await session.commit()
        finally:
            await session.close()
    return await call_next(request)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Build the FastAPI app; importing this module runs no server, no I/O."""
    resolved = settings if settings is not None else get_settings()
    # The interactive docs are developer tooling: served outside production
    # by default, absent in production unless explicitly enabled (§security).
    docs_on = resolved.api_docs_enabled
    if docs_on is None:
        docs_on = resolved.app_env != "production"
    app = FastAPI(
        title="Khoailanggraph API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if docs_on else None,
        redoc_url="/redoc" if docs_on else None,
        openapi_url="/openapi.json" if docs_on else None,
    )
    app.state.settings = resolved

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/ready")
    async def ready() -> dict[str, str]:
        await readiness_check(resolved)
        return {"status": "ready"}

    app.middleware("http")(session_middleware)
    app.include_router(api_router)

    app.add_exception_handler(ApiError, api_error_handler)

    async def validation_handler(_request: Request, exc: Exception) -> Response:
        """Render a request-body validation failure as Problem Details."""
        if not isinstance(exc, RequestValidationError):
            raise exc
        errors = [
            {
                "field": ".".join(str(part) for part in item.get("loc", [])[1:]),
                "message": item.get("msg", "Enter a value."),
            }
            for item in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "type": "about:blank",
                "title": "Validation failed",
                "status": 422,
                "code": "validation_failed",
                "errors": errors,
            },
            media_type="application/problem+json",
        )

    app.add_exception_handler(RequestValidationError, validation_handler)
    return app


app = create_app()
