"""The outline number and depth of the items of an artifact."""

from __future__ import annotations

from uuid import UUID, uuid4

import pytest

from khoailanggraph.features.artifacts.models import ArtifactItemRow
from khoailanggraph.features.artifacts.service import outline_in_order, outline_of
from support.outline_cases import CASES, OutlineCase


def _rows(case: OutlineCase) -> tuple[list[ArtifactItemRow], dict[str, UUID]]:
    ids = {name: uuid4() for name, _parent, _position in case.items}
    rows = [
        ArtifactItemRow(
            id=ids[name],
            key=name,
            parent_item_id=None if parent is None else ids[parent],
            position=position,
        )
        for name, parent, position in case.items
    ]
    return rows, ids


@pytest.mark.parametrize("case", CASES, ids=[case.name for case in CASES])
def test_outline_numbers_and_depth(case: OutlineCase) -> None:
    rows, ids = _rows(case)

    numbering = outline_of(rows)

    assert {name: numbering[ids[name]] for name in ids} == case.expected


@pytest.mark.parametrize("case", CASES, ids=[case.name for case in CASES])
def test_outline_order_reads_a_section_before_what_it_contains(case: OutlineCase) -> None:
    rows, _ids = _rows(case)

    assert [row.key for row in outline_in_order(rows)] == case.order
