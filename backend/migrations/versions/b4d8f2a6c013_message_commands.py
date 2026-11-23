"""the commands that an answer of the assistant asks the client to run

Revision ID: b4d8f2a6c013
Revises: a7c3e5d19f40
Create Date: 2026-11-24 14:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b4d8f2a6c013"
down_revision: str | None = "a7c3e5d19f40"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("messages") as batch:
        batch.add_column(
            sa.Column("commands_json", sa.LargeBinary(), nullable=False, server_default="[]")
        )


def downgrade() -> None:
    with op.batch_alter_table("messages") as batch:
        batch.drop_column("commands_json")
