"""The knowledge of a persona: what its stakeholder group said in the research documents."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

from khoailanggraph.agents.requirements_engineering import nodes

if TYPE_CHECKING:
    from khoailanggraph.agents.requirements_engineering.state import REState


class _Sink:
    def __init__(self, records: dict[str, dict[str, Any]]) -> None:
        self.records = records

    def read_item(self, item_id: str) -> dict[str, Any]:
        return self.records[item_id]


def _observation(key: str, group: str, dimension: str, evidence: str) -> dict[str, Any]:
    return {
        "key": key,
        "content": {
            "stakeholder_name": group,
            "dimension": dimension,
            "description": f"{group} in a survey.",
            "evidence": evidence,
            "source": "SRC-001",
        },
    }


RECORDS = {
    "i1": _observation(
        "OBS-001", "commuter students", "time to find a spot", "I circle for 15 minutes."
    ),
    "i2": _observation("OBS-002", "commuter students", "price", "Permits cost too much."),
    "i3": _observation(
        "OBS-003", "parking office staff", "enforcement", "We cannot check every lot."
    ),
}
PERSONA: Any = {"key": "PER-001", "content": {"grounded_in": ["OBS-001"]}}


def _knowledge(observations: list[str], persona: Any = PERSONA) -> str:
    state = cast("REState", {"observations": [{"item_id": item} for item in observations]})
    return nodes._persona_knowledge(state, cast("Any", _Sink(RECORDS)), persona)


def test_a_persona_knows_what_its_group_said_and_nothing_of_the_other_groups() -> None:
    knowledge = _knowledge(["i1", "i2", "i3"])

    assert "I circle for 15 minutes." in knowledge
    assert "Permits cost too much." in knowledge, (
        "the same group, though not the ones it is built on"
    )
    assert "We cannot check every lot." not in knowledge


def test_the_observations_it_is_built_on_come_first() -> None:
    knowledge = _knowledge(["i2", "i1"])

    assert knowledge.index("I circle") < knowledge.index("Permits cost")


def test_without_mined_observations_the_persona_has_only_its_profile() -> None:
    assert _knowledge([]) == "(none)"


def test_what_a_persona_knows_is_one_line_for_each_observation_and_never_carries_keys() -> None:
    knowledge = _knowledge(["i1", "i2"])

    assert len(knowledge.splitlines()) == 2
    assert "OBS-" not in knowledge
