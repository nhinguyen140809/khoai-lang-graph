"""The Alembic revisions build the schema of the models, and carry old data over."""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import TYPE_CHECKING

import pytest
import sqlalchemy as sa
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext

from khoailanggraph.api import models_registry  # noqa: F401 - registers the tables
from khoailanggraph.platform.db import Base
from khoailanggraph.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Iterator

BACKEND_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def database(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[tuple[Config, str]]:
    url = f"sqlite:///{tmp_path / 'migrations.db'}"
    monkeypatch.setenv("DATABASE_URL", url)
    get_settings.cache_clear()
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "migrations"))
    yield config, url
    get_settings.cache_clear()


def test_upgrade_to_head_gives_the_schema_of_the_models(database: tuple[Config, str]) -> None:
    config, url = database

    command.upgrade(config, "head")

    engine = sa.create_engine(url)
    with engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"render_as_batch": True})
        assert compare_metadata(context, Base.metadata) == []


def test_downgrade_to_the_first_revision_and_up_again(database: tuple[Config, str]) -> None:
    config, url = database

    command.upgrade(config, "head")
    command.downgrade(config, "a3f1c2d84e01")
    command.upgrade(config, "head")

    engine = sa.create_engine(url)
    with engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"render_as_batch": True})
        assert compare_metadata(context, Base.metadata) == []


def test_the_quote_of_a_link_becomes_the_quote_of_its_target(
    database: tuple[Config, str],
) -> None:
    config, url = database
    command.upgrade(config, "a3f1c2d84e01")
    project, source, target, link = (str(uuid.uuid4()) for _ in range(4))
    engine = sa.create_engine(url)
    with engine.begin() as connection:
        connection.execute(
            sa.text(
                "INSERT INTO trace_links (id, project_id, link_type, source_item_id,"
                " target_item_id, target_version, quote) VALUES"
                " (:id, :project, 'evidenced_by', :source, :target, 1, 'the exact words')"
            ).bindparams(id=link, project=project, source=source, target=target)
        )

    command.upgrade(config, "head")

    with engine.connect() as connection:
        row = connection.execute(
            sa.text("SELECT source_quote, target_quote FROM trace_links WHERE id = :id").bindparams(
                id=link
            )
        ).one()
    assert row.source_quote is None
    assert row.target_quote == "the exact words"
