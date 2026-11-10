"""Who made a change: the `Origin` value object and the columns that store it.

An origin is `actor` (`agent` or `user`), the agent role, the user, the run and
the step. A row keeps it as five columns under a prefix: `created_` and
`updated_` on an artifact or an item, `changed_` on a revision. The three
mixins give a model those columns; `read` and `write` move an origin between a
row and the value object.
"""

from __future__ import annotations

import uuid  # noqa: TC003 - SQLAlchemy resolves the `Mapped[...]` annotations at run time
from dataclasses import dataclass
from typing import Any, Literal

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

Actor = Literal["agent", "user"]


@dataclass(frozen=True)
class Origin:
    """The actor of a change and where it came from."""

    actor: Actor
    agent_role: str | None = None
    user_id: uuid.UUID | None = None
    run_id: uuid.UUID | None = None
    step_id: uuid.UUID | None = None

    @classmethod
    def of_user(cls, user_id: uuid.UUID) -> Origin:
        return cls(actor="user", user_id=user_id)

    @classmethod
    def of_agent(
        cls,
        agent_role: str | None = None,
        run_id: uuid.UUID | None = None,
        step_id: uuid.UUID | None = None,
    ) -> Origin:
        return cls(actor="agent", agent_role=agent_role, run_id=run_id, step_id=step_id)


class CreatedOriginMixin:
    created_actor: Mapped[str] = mapped_column(String, default="agent", nullable=False)
    created_agent_role: Mapped[str | None] = mapped_column(String, nullable=True)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    created_run_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    created_step_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)


class UpdatedOriginMixin:
    updated_actor: Mapped[str] = mapped_column(String, default="agent", nullable=False)
    updated_agent_role: Mapped[str | None] = mapped_column(String, nullable=True)
    updated_by_user_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    updated_run_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    updated_step_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)


class ChangedOriginMixin:
    changed_actor: Mapped[str] = mapped_column(String, default="agent", nullable=False)
    changed_agent_role: Mapped[str | None] = mapped_column(String, nullable=True)
    changed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    changed_run_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    changed_step_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)


def write(row: Any, prefix: str, origin: Origin) -> None:
    """Store `origin` in the columns `<prefix>_actor`, `<prefix>_agent_role`, ... of `row`."""
    setattr(row, f"{prefix}_actor", origin.actor)
    setattr(row, f"{prefix}_agent_role", origin.agent_role)
    setattr(row, f"{prefix}_by_user_id", origin.user_id)
    setattr(row, f"{prefix}_run_id", origin.run_id)
    setattr(row, f"{prefix}_step_id", origin.step_id)


def read(row: Any, prefix: str) -> Origin:
    """The origin stored under `prefix` in `row`."""
    return Origin(
        actor=getattr(row, f"{prefix}_actor"),
        agent_role=getattr(row, f"{prefix}_agent_role"),
        user_id=getattr(row, f"{prefix}_by_user_id"),
        run_id=getattr(row, f"{prefix}_run_id"),
        step_id=getattr(row, f"{prefix}_step_id"),
    )
