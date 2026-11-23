"""personas and persona catalogs written with the current content schema

Revision ID: a7c3e5d19f40
Revises: e1f7a4c9b206
Create Date: 2026-11-24 13:00:00.000000
"""

from __future__ import annotations

import json
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a7c3e5d19f40"
down_revision: str | None = "e1f7a4c9b206"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Rows were written with version 1 whatever their kind. A row of these kinds whose content holds
# the field that version 2 added was written with that version, so it takes it.
_VERSION_TWO = (
    (
        sa.table(
            "artifact_items",
            *(sa.column(n) for n in ("id", "kind", "schema_version", "content_json")),
        ),
        "persona",
        "scores",
    ),
    (
        sa.table(
            "artifacts", *(sa.column(n) for n in ("id", "kind", "schema_version", "content_json"))
        ),
        "persona_catalog",
        "stakeholder_groups",
    ),
)


def _move_version(from_version: int, to_version: int) -> None:
    connection = op.get_bind()
    for table, kind, field in _VERSION_TWO:
        rows = connection.execute(
            sa.select(table.c.id, table.c.content_json).where(
                table.c.kind == kind, table.c.schema_version == from_version
            )
        ).all()
        for row in rows:
            if field in json.loads(bytes(row.content_json)):
                connection.execute(
                    sa.update(table).where(table.c.id == row.id).values(schema_version=to_version)
                )


def upgrade() -> None:
    _move_version(1, 2)


def downgrade() -> None:
    _move_version(2, 1)
