"""A value of an artifact names the plan term it stands for."""

from __future__ import annotations

from khoailanggraph.agents.requirements_engineering.nodes import match_plan_value


def test_a_plan_term_carries_its_reason_and_is_matched_by_its_name() -> None:
    allowed = [
        "People who use older or low-cost Android phones, because efficiency must hold.",
        "People who pay for music, video or news subscriptions, because accounts shape it.",
    ]

    assert (
        match_plan_value("People who use older or low-cost Android phones", allowed)
        == allowed[0]
    )
    assert (
        match_plan_value("People who pay for music, video or news subscriptions", allowed)
        == allowed[1]
    )


def test_a_value_that_names_no_plan_term_still_matches_none() -> None:
    allowed = ["People who use older or low-cost Android phones, because efficiency."]

    assert match_plan_value("People who repair boats for a living", allowed) is None
