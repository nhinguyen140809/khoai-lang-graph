from khoailanggraph.agents.requirements_engineering.nodes import _group_name


def test_a_name_that_differs_in_case_or_spacing_is_the_known_group() -> None:
    known = ["Commuter students"]

    assert _group_name("commuter  students", known) == "Commuter students"
    assert known == ["Commuter students"]


def test_a_new_name_is_remembered_once_and_trimmed() -> None:
    known: list[str] = []

    assert _group_name("  Parking office   staff ", known) == "Parking office staff"
    assert _group_name("parking office staff", known) == "Parking office staff"
    assert known == ["Parking office staff"]
