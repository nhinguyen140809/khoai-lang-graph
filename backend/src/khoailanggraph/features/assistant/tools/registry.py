"""What a tool of the assistant is: one entry per tool, so a new one is a line, not a branch.

A tool reads one thing of the project and returns a short text for the model. It never writes, never
calls a model, and never receives a project id from the model: the context holds the project and the
user the server already resolved, so a tool cannot reach another project's data.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable, Sequence

    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.me.models import UserRow
    from khoailanggraph.features.projects.models import ProjectRow


@dataclass(frozen=True)
class ToolContext:
    """What every tool reads with: the open session, the project, and who asked."""

    session: AsyncSession
    project: ProjectRow
    user: UserRow


@dataclass(frozen=True)
class Tool:
    """One read the model may ask for. `arg` says what the model puts in `key`."""

    name: str
    description: str
    arg: str
    run: Callable[[ToolContext, str | None], Awaitable[str]]


def catalog_of(tools: Sequence[Tool]) -> str:
    """The list of tools as the model reads it: one line each, with what it may put in `key`."""
    return "\n".join(f"- `{tool.name}` ({tool.arg}): {tool.description}" for tool in tools)
