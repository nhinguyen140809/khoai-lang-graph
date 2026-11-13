"""the short notes of a step

Revision ID: c8d4a2f6b913
Revises: b5e2f8a31c64
Create Date: 2026-11-10 21:30:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c8d4a2f6b913"
down_revision: str | None = "b5e2f8a31c64"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("run_steps", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("notes_json", sa.LargeBinary(), nullable=False, server_default="[]")
        )


def downgrade() -> None:
    with op.batch_alter_table("run_steps", schema=None) as batch_op:
        batch_op.drop_column("notes_json")
