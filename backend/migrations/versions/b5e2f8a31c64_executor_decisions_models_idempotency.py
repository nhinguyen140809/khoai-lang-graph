"""edited items of a decision, model settings and idempotency keys

Revision ID: b5e2f8a31c64
Revises: a9d1c3e5f720
Create Date: 2026-11-10 14:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b5e2f8a31c64"
down_revision: str | None = "a9d1c3e5f720"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("human_decisions", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "modified_items_json", sa.LargeBinary(), nullable=False, server_default="[]"
            )
        )
    op.create_table(
        "user_model_settings",
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("agent_role", sa.String(), primary_key=True),
        sa.Column("model_id", sa.String(), nullable=False),
        sa.Column("temperature", sa.Double(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "idempotency_keys",
        sa.Column("user_id", sa.Uuid(), primary_key=True),
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("scope", sa.String(), nullable=False),
        sa.Column("response_status", sa.Integer(), nullable=False),
        sa.Column("response_json", sa.LargeBinary(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("idempotency_keys")
    op.drop_table("user_model_settings")
    with op.batch_alter_table("human_decisions", schema=None) as batch_op:
        batch_op.drop_column("modified_items_json")
