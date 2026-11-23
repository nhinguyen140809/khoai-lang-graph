"""What a request hands to the server to go on after it has answered: the executor of the runs and
the engine its jobs write with, both kept on the application."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

from khoailanggraph.features.runs.executor import RunExecutor, run_job
from khoailanggraph.platform.db import make_sync_engine

if TYPE_CHECKING:
    from uuid import UUID

    from fastapi import FastAPI


def sync_engine_of(app: FastAPI) -> Any:
    """The worker engine on app.state, created on first use when missing."""
    engine = getattr(app.state, "sync_engine", None)
    if engine is None:
        engine = make_sync_engine(app.state.settings)
        app.state.sync_engine = engine
    return engine


def executor_of(app: FastAPI) -> RunExecutor:
    """The executor on app.state, created on first use when missing."""
    executor = getattr(app.state, "executor", None)
    if executor is None:
        executor = RunExecutor(app.state.settings.run_execution)
        app.state.executor = executor
    return cast("RunExecutor", executor)


async def start_job(app: FastAPI, run_id: UUID, resume_interrupt: UUID | None = None) -> None:
    """Start the job of a run: it goes on in the background, or is waited for in inline mode."""
    engine = sync_engine_of(app)
    await executor_of(app).submit(
        lambda: run_job(engine, run_id, resume_interrupt=resume_interrupt)
    )
