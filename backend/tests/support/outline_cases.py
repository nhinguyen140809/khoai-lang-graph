"""Cases of the outline of an artifact: items as `(key, parent key, position)`."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class OutlineCase:
    name: str
    items: list[tuple[str, str | None, int]]
    expected: dict[str, tuple[str, int]]
    order: list[str]


CASES = [
    OutlineCase(
        name="items without sections are numbered by position",
        items=[("B", None, 2), ("A", None, 1), ("C", None, 3)],
        expected={"A": ("1", 1), "B": ("2", 1), "C": ("3", 1)},
        order=["A", "B", "C"],
    ),
    OutlineCase(
        name="an item under a section takes the number of the section",
        items=[
            ("S1", None, 1),
            ("S2", None, 2),
            ("R2", "S1", 2),
            ("R1", "S1", 1),
            ("R3", "S2", 1),
        ],
        expected={
            "S1": ("1", 1),
            "S2": ("2", 1),
            "R1": ("1.1", 2),
            "R2": ("1.2", 2),
            "R3": ("2.1", 2),
        },
        order=["S1", "R1", "R2", "S2", "R3"],
    ),
    OutlineCase(
        name="sections nest to any depth",
        items=[("S1", None, 1), ("S2", "S1", 1), ("S3", "S2", 1), ("R1", "S3", 1)],
        expected={"S1": ("1", 1), "S2": ("1.1", 2), "S3": ("1.1.1", 3), "R1": ("1.1.1.1", 4)},
        order=["S1", "S2", "S3", "R1"],
    ),
    OutlineCase(
        name="ties in position are broken by key",
        items=[("B", None, 1), ("A", None, 1)],
        expected={"A": ("1", 1), "B": ("2", 1)},
        order=["A", "B"],
    ),
    OutlineCase(
        name="positions need not be consecutive",
        items=[("A", None, 10), ("B", None, 30), ("C", None, 20)],
        expected={"A": ("1", 1), "C": ("2", 1), "B": ("3", 1)},
        order=["A", "C", "B"],
    ),
]
