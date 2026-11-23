"""a thread holds at most one unfinished run of each workflow; its active run is read from its runs

Revision ID: d6e3b8a1f452
Revises: b7c41f2d9e30
Create Date: 2026-11-24 10:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d6e3b8a1f452"
down_revision: str | None = "b7c41f2d9e30"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_UNFINISHED = "status IN ('queued', 'running', 'interrupted')"


def upgrade() -> None:
    op.create_index(
        "uq_runs_one_unfinished_per_workflow",
        "runs",
        ["thread_id", "workflow_name"],
        unique=True,
        sqlite_where=sa.text(_UNFINISHED),
        postgresql_where=sa.text(_UNFINISHED),
    )
    with op.batch_alter_table("threads", schema=None) as batch_op:
        batch_op.drop_constraint("uq_threads_active_run_id", type_="unique")
        batch_op.drop_column("active_run_id")


def downgrade() -> None:
    with op.batch_alter_table("threads", schema=None) as batch_op:
        batch_op.add_column(sa.Column("active_run_id", sa.Uuid(), nullable=True))
        batch_op.create_unique_constraint("uq_threads_active_run_id", ["active_run_id"])
    op.execute(
        "UPDATE threads SET active_run_id = (SELECT id FROM runs "
        "WHERE runs.thread_id = threads.id "
        "AND runs.status IN ('queued', 'running', 'interrupted') "
        "ORDER BY runs.number DESC LIMIT 1)"
    )
    op.drop_index("uq_runs_one_unfinished_per_workflow", table_name="runs")
