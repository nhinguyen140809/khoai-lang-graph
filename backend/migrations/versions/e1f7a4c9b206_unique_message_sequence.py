"""no two messages of a thread share a sequence

Revision ID: e1f7a4c9b206
Revises: d6e3b8a1f452
Create Date: 2026-11-24 12:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "e1f7a4c9b206"
down_revision: str | None = "d6e3b8a1f452"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_messages_thread_sequence", "messages", ["thread_id", "sequence"], unique=True
    )


def downgrade() -> None:
    op.drop_index("uq_messages_thread_sequence", table_name="messages")
