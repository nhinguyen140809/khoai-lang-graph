"""drop the stored run status of a thread: the status of its latest run is read from its runs

Revision ID: e8a2d4c61b97
Revises: c4b7e1a90d52
Create Date: 2026-11-09 23:20:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e8a2d4c61b97"
down_revision: str | None = "c4b7e1a90d52"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("threads", schema=None) as batch_op:
        batch_op.drop_column("active_run_status")


def downgrade() -> None:
    with op.batch_alter_table("threads", schema=None) as batch_op:
        batch_op.add_column(sa.Column("active_run_status", sa.String(), nullable=True))
