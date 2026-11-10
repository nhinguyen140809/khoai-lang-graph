"""The integrity rules fire the way the docs promise (docs/DATA_SHAPE §8)."""

from __future__ import annotations

from typing import Any

import pytest

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.domain.errors import IntegrityError, Violation
from khoailanggraph.domain.links import has_cycle, link_pair_allowed
from khoailanggraph.domain.rules import (
    LinkCandidate,
    check_item_in_artifact,
    check_item_tree,
    check_link,
    check_parent,
    check_section_placement,
    validate_content,
)

VALID_PERSONA: dict[str, Any] = {
    "name": "Minh — 3rd-year CS student",
    "stakeholder_type": "Student",
    "occupation": "Student",
    "age_range": "20-22",
    "evaluative_dimension": "simplicity and speed of booking",
    "grounded_in": ["OBS-001"],
    "background": "A busy undergraduate.",
    "typical_day": "Lectures all day.",
    "expertise": "Basic programming",
    "current_workarounds": ["Asks seniors"],
    "vocabulary": ["quick chat"],
    "goals": ["Find a mentor"],
    "interests": ["Internships"],
    "constraints": ["Full course load"],
    "priorities": ["Relevant matches"],
    "concerns": ["Mentors who never reply"],
    "behavioral_tendencies": "Direct, concise answers.",
    "scores": [
        {"aspect": "tech_comfort", "score": 5, "rationale": "Uses his phone for everything."}
    ],
    "evidence": [
        {
            "observation": "OBS-001",
            "source": "SRC-001",
            "quote": (
                "61% said they would stop using a tool that needs more "
                "than a few taps to book a chat."
            ),
        }
    ],
    "interview_status": "not_started",
}


def make_link(
    source_id: str,
    target_id: str,
    *,
    link_type: str = "derived_from",
    source_kind: str = "spec_requirement",
    target_kind: str = "spec_requirement",
) -> LinkCandidate:
    return LinkCandidate(
        link_type=link_type,
        source_id=source_id,
        source_kind=source_kind,
        target_id=target_id,
        target_kind=target_kind,
    )


@pytest.fixture
def value_lists() -> dict[str, Any]:
    return wf.value_lists()


@pytest.fixture
def link_types() -> dict[str, Any]:
    return wf.link_types()


class TestValidateContent:
    def test_accepts_a_valid_persona(self, value_lists: dict[str, Any]) -> None:
        assert validate_content("persona", VALID_PERSONA, value_lists=value_lists) == []

    def test_rejects_an_unknown_field(self, value_lists: dict[str, Any]) -> None:
        content = {**VALID_PERSONA, "mood": "cheerful"}

        violations = validate_content("persona", content, value_lists=value_lists)

        assert any("mood" in violation.message for violation in violations)

    def test_rejects_a_wrong_enum_value(self, value_lists: dict[str, Any]) -> None:
        content = {**VALID_PERSONA, "interview_status": "paused"}

        violations = validate_content("persona", content, value_lists=value_lists)

        assert any(violation.path == "interview_status" for violation in violations)

    def test_value_list_fields_take_the_keys_of_their_list(
        self, value_lists: dict[str, Any]
    ) -> None:
        spec = {
            "statement": "The system shall search mentors.",
            "type": "functional",
            "quality_category": None,
            "priority": "not-a-priority",
            "rationale": "The core need.",
        }

        violations = validate_content("analyzed_requirement", spec, value_lists=value_lists)

        assert any(violation.path == "priority" for violation in violations)

    def test_value_from_fields_take_the_values_of_the_named_artifact(
        self, value_lists: dict[str, Any]
    ) -> None:
        plan_values = {"elicitation_plan.stakeholder_types": ["Student", "Mentor"]}
        content = {**VALID_PERSONA, "stakeholder_type": "Wizard"}

        violations = validate_content(
            "persona", content, value_lists=value_lists, plan_values=plan_values
        )

        assert any(violation.rule == "plan values" for violation in violations)

    def test_a_missing_referenced_artifact_accepts_only_null(
        self, value_lists: dict[str, Any]
    ) -> None:
        content = {**VALID_PERSONA, "stakeholder_type": "Student"}

        violations = validate_content("persona", content, value_lists=value_lists, plan_values={})

        assert any(violation.rule == "plan values" for violation in violations)


class TestPlacementRules:
    def test_an_item_kind_outside_its_artifact_is_rejected(self) -> None:
        artifacts = wf.artifact_kinds()

        assert check_item_in_artifact("spec_requirement", "requirements_analysis", artifacts) != []
        assert check_item_in_artifact("raw_requirement", "requirements_analysis", artifacts) == []

    def test_a_section_is_never_created_in_a_transcript(self) -> None:
        assert check_section_placement("interview_transcript", "section") != []
        assert check_section_placement("requirements_analysis", "section") == []

    def test_parents_are_sections_or_epics(self) -> None:
        assert check_parent("section", "raw_requirement", "requirements_analysis") == []
        assert check_parent("backlog_item", "backlog_item", "product_backlog") == []
        assert check_parent("persona", "raw_requirement", "requirements_analysis") != []
        assert check_parent(None, "raw_requirement", "requirements_analysis") == []

    def test_a_transcript_has_no_parents_at_all(self) -> None:
        assert check_parent("section", "interview_message", "interview_transcript") != []


class TestTreeRule:
    def test_a_parent_chain_may_not_cycle(self) -> None:
        items: list[dict[str, Any]] = [
            {"id": "a", "parent": "b"},
            {"id": "b", "parent": "a"},
        ]

        violations = check_item_tree(items)

        assert any("own ancestor" in violation.message for violation in violations)
        assert all("nests deeper" not in violation.message for violation in violations)

    def test_sections_may_not_nest_deeper_than_four(self) -> None:
        items: list[dict[str, Any]] = [
            {"id": "s1", "parent": None},
            {"id": "s2", "parent": "s1"},
            {"id": "s3", "parent": "s2"},
            {"id": "s4", "parent": "s3"},
            {"id": "s5", "parent": "s4"},
            {"id": "s6", "parent": "s5"},
        ]

        violations = check_item_tree(items)

        assert any("nests deeper" in violation.message for violation in violations)


class TestLinks:
    def test_pairs_of_the_definition(self, link_types: dict[str, Any]) -> None:
        kinds = sorted(wf.item_kinds())

        assert link_pair_allowed(
            "evidenced_by", "raw_requirement", "interview_message", link_types, kinds
        )
        assert not link_pair_allowed(
            "evidenced_by", "interview_message", "raw_requirement", link_types, kinds
        )
        assert link_pair_allowed(
            "supersedes", "spec_requirement", "spec_requirement", link_types, kinds
        )
        assert not link_pair_allowed("supersedes", "spec_requirement", "section", link_types, kinds)
        assert link_pair_allowed("flags", "validation_issue", "spec_requirement", link_types, kinds)

    def test_self_link_and_sections_are_rejected(self, link_types: dict[str, Any]) -> None:
        violations = check_link(make_link("REQ-001", "REQ-001"), link_types=link_types)
        assert any(violation.rule == "no self link" for violation in violations)

        violations = check_link(
            make_link("SEC-001", "REQ-001", source_kind="section"),
            link_types=link_types,
        )
        assert any(violation.rule == "link endpoints" for violation in violations)

    def test_derived_from_chains_may_not_cycle(self) -> None:
        links = [
            ("AR-001", "RAW-001", "derived_from"),
            ("REQ-001", "AR-001", "derived_from"),
            ("RAW-001", "REQ-001", "derived_from"),
        ]
        assert has_cycle(links, "derived_from")

        clean = [
            ("AR-001", "RAW-001", "derived_from"),
            ("REQ-001", "AR-001", "derived_from"),
        ]
        assert not has_cycle(clean, "derived_from")


def test_integrity_error_joins_violations() -> None:
    raiseable = IntegrityError(
        [Violation("content", "enum mismatch", path="priority"), Violation("plan values", "no")]
    )
    message = str(raiseable)

    assert "content at priority" in message
    assert "plan values" in message
