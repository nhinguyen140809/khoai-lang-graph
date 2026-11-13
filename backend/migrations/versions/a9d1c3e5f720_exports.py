"""the exports of a project

Revision ID: a9d1c3e5f720
Revises: f3c9a7b52d18
Create Date: 2026-11-10 10:30:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a9d1c3e5f720"
down_revision: str | None = "f3c9a7b52d18"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "exports",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("project_id", sa.Uuid(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("requested_by", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("template", sa.String(), nullable=False),
        sa.Column("format", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("included_artifacts_json", sa.LargeBinary(), nullable=False),
        sa.Column("file_name", sa.String(), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("storage_key", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    with op.batch_alter_table("exports", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_exports_project_id"), ["project_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("exports", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_exports_project_id"))
    op.drop_table("exports")
