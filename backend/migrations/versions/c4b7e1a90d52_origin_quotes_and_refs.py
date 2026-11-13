"""origin of changes, quotes on both sides of a link, refs of a message, project without a name

Revision ID: c4b7e1a90d52
Revises: a3f1c2d84e01
Create Date: 2026-11-09 22:10:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c4b7e1a90d52"
down_revision: str | None = "a3f1c2d84e01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_ORIGIN_TABLES = {
    "artifacts": ("created", "updated"),
    "artifact_items": ("created", "updated"),
    "artifact_revisions": ("changed",),
    "item_revisions": ("changed",),
}


def _origin_columns(prefix: str) -> list[sa.Column]:
    return [
        sa.Column(f"{prefix}_actor", sa.String(), nullable=False, server_default="agent"),
        sa.Column(f"{prefix}_agent_role", sa.String(), nullable=True),
        sa.Column(f"{prefix}_by_user_id", sa.Uuid(), nullable=True),
        sa.Column(f"{prefix}_run_id", sa.Uuid(), nullable=True),
        sa.Column(f"{prefix}_step_id", sa.Uuid(), nullable=True),
    ]


def upgrade() -> None:
    # A project may have no name until its first run names it.
    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.alter_column("name", existing_type=sa.String(), nullable=True)

    # Who created, updated or changed what: rows that exist were written by agents.
    for table, prefixes in _ORIGIN_TABLES.items():
        with op.batch_alter_table(table, schema=None) as batch_op:
            for prefix in prefixes:
                for column in _origin_columns(prefix):
                    batch_op.add_column(column)

    # A link may quote words on each side; the one quote that existed was of the target.
    with op.batch_alter_table("trace_links", schema=None) as batch_op:
        batch_op.add_column(sa.Column("source_quote", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("target_quote", sa.Text(), nullable=True))
    op.execute("UPDATE trace_links SET target_quote = quote")
    with op.batch_alter_table("trace_links", schema=None) as batch_op:
        batch_op.drop_column("quote")

    # The artifacts and items a message refers to.
    with op.batch_alter_table("messages", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("artifact_refs_json", sa.LargeBinary(), nullable=False, server_default="[]")
        )
        batch_op.add_column(
            sa.Column("item_refs_json", sa.LargeBinary(), nullable=False, server_default="[]")
        )


def downgrade() -> None:
    with op.batch_alter_table("messages", schema=None) as batch_op:
        batch_op.drop_column("item_refs_json")
        batch_op.drop_column("artifact_refs_json")

    with op.batch_alter_table("trace_links", schema=None) as batch_op:
        batch_op.add_column(sa.Column("quote", sa.Text(), nullable=True))
    op.execute("UPDATE trace_links SET quote = COALESCE(target_quote, source_quote)")
    with op.batch_alter_table("trace_links", schema=None) as batch_op:
        batch_op.drop_column("target_quote")
        batch_op.drop_column("source_quote")

    for table, prefixes in _ORIGIN_TABLES.items():
        with op.batch_alter_table(table, schema=None) as batch_op:
            for prefix in prefixes:
                for suffix in ("actor", "agent_role", "by_user_id", "run_id", "step_id"):
                    batch_op.drop_column(f"{prefix}_{suffix}")

    op.execute("UPDATE projects SET name = '' WHERE name IS NULL")
    with op.batch_alter_table("projects", schema=None) as batch_op:
        batch_op.alter_column("name", existing_type=sa.String(), nullable=False)
