"""The quote rules of a link, and what an agent's quote becomes when it breaks them."""

from __future__ import annotations

import pytest

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering import nodes
from khoailanggraph.agents.requirements_engineering.outputs import ItemLink, MessageLink
from khoailanggraph.domain import rules
from support.quote_cases import CASES, QuoteCase


@pytest.mark.parametrize("case", CASES, ids=[case.name for case in CASES])
def test_a_quote_holds_or_breaks_a_rule(case: QuoteCase) -> None:
    violations = rules.check_quote(
        case.side,
        case.quote,
        link_type=case.link_type,
        link_type_definition=wf.link_types()[case.link_type],
        kind=case.kind,
        content=case.content,
    )

    if case.problem is None:
        assert violations == []
    else:
        assert [case.problem in violation.message for violation in violations] == [True]


def test_an_agent_names_a_link_by_a_key_or_an_object() -> None:
    by_key = "R1"
    by_object = ItemLink(item="R2", source_quote="a", target_quote="b")
    by_message = MessageLink(message="M1", target_quote="c")

    assert [nodes._key_of(ref) for ref in (by_key, by_object, by_message)] == ["R1", "R2", "M1"]
    assert [nodes._quotes_of(ref) for ref in (by_key, by_object, by_message)] == [
        (None, None),
        ("a", "b"),
        (None, "c"),
    ]
