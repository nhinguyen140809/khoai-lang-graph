"""the workflow state after each step of a run, and the items a directive refers to

Revision ID: f3c9a7b52d18
Revises: e8a2d4c61b97
Create Date: 2026-11-10 09:30:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f3c9a7b52d18"
down_revision: str | None = "e8a2d4c61b97"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("run_steps", schema=None) as batch_op:
        batch_op.add_column(sa.Column("state_json", sa.LargeBinary(), nullable=True))
    with op.batch_alter_table("directives", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("items_json", sa.LargeBinary(), nullable=False, server_default="[]")
        )


def downgrade() -> None:
    with op.batch_alter_table("directives", schema=None) as batch_op:
        batch_op.drop_column("items_json")
    with op.batch_alter_table("run_steps", schema=None) as batch_op:
        batch_op.drop_column("state_json")
