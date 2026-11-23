"""What a tool of the assistant is: one entry per tool, so a new one is a line, not a branch.

A tool reads one thing of the project and returns a short text for the model. It never writes, never
calls a model, and never receives a project id from the model: the context holds the project and the
user the server already resolved, so a tool cannot reach another project's data.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable, Sequence

    from sqlalchemy.ext.asyncio import AsyncSession

    from khoailanggraph.features.artifacts.models import ArtifactItemRow, ArtifactRow
    from khoailanggraph.features.me.models import UserRow
    from khoailanggraph.features.projects.models import ProjectRow


# How many documents and items one answer may point at: the ones read first.
MAX_REFS = 10


@dataclass
class ReadLog:
    """The documents and items the tools looked at while one message was answered.

    They become the references of the answer, so that what it was read from shows under it, the way
    the messages of an agent name what they were written from. Each is kept once, in the order it
    was first read, up to `MAX_REFS` of each.
    """

    artifacts: dict[str, dict[str, Any]] = field(default_factory=dict)
    items: dict[str, dict[str, Any]] = field(default_factory=dict)

    def note_artifact(self, row: ArtifactRow) -> None:
        if len(self.artifacts) < MAX_REFS:
            self.artifacts.setdefault(
                str(row.id),
                {
                    "artifact_id": str(row.id),
                    "kind": row.kind,
                    "title": row.title,
                    "version": row.version,
                },
            )

    def note_item(self, row: ArtifactItemRow) -> None:
        if len(self.items) < MAX_REFS:
            self.items.setdefault(
                str(row.id),
                {
                    "item_id": str(row.id),
                    "kind": row.kind,
                    "key": row.key,
                    "version": row.version,
                },
            )


@dataclass(frozen=True)
class ToolContext:
    """What every tool reads with: the open session, the project, who asked, and what was read."""

    session: AsyncSession
    project: ProjectRow
    user: UserRow
    reads: ReadLog = field(default_factory=ReadLog)


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
