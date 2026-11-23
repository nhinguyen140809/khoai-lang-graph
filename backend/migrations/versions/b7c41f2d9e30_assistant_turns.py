"""the messages the assistant answered and what they cost

Revision ID: b7c41f2d9e30
Revises: c8d4a2f6b913
Create Date: 2026-11-23 00:20:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b7c41f2d9e30"
down_revision: str | None = "c8d4a2f6b913"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "assistant_turns",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("project_id", sa.Uuid(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("thread_id", sa.Uuid(), sa.ForeignKey("threads.id"), nullable=False),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("model_id", sa.String(), nullable=False),
        sa.Column("usage_json", sa.LargeBinary(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    with op.batch_alter_table("assistant_turns", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_assistant_turns_user_id"), ["user_id"], unique=False)
        batch_op.create_index(
            batch_op.f("ix_assistant_turns_project_id"), ["project_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_assistant_turns_thread_id"), ["thread_id"], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table("assistant_turns", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_assistant_turns_thread_id"))
        batch_op.drop_index(batch_op.f("ix_assistant_turns_project_id"))
        batch_op.drop_index(batch_op.f("ix_assistant_turns_user_id"))
    op.drop_table("assistant_turns")
