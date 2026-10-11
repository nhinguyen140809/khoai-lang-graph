"""Domain exceptions of the content model and the integrity rules.

The domain layer raises these; one place in the API layer maps them to HTTP
responses (docs/architecture: domain exceptions raised in code, mapped to HTTP
in one place).
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Sequence


class DomainError(Exception):
    """Base class of every error the domain layer raises."""


class Violation:
    """One failed check: where it happened, in words a developer reads."""

    __slots__ = ("message", "path", "rule")

    def __init__(self, rule: str, message: str, path: str = "") -> None:
        self.rule = rule
        self.message = message
        self.path = path

    def __str__(self) -> str:
        location = f" at {self.path}" if self.path else ""
        return f"{self.rule}{location}: {self.message}"


class IntegrityError(DomainError):
    """One or more integrity rules rejected a write.

    The violations are pure data, so callers (a unit test, the artifact
    feature, a failing agent step) can report each one where it belongs.
    """

    def __init__(self, violations: Sequence[Violation]) -> None:
        self.violations = list(violations)
        super().__init__("; ".join(str(violation) for violation in self.violations))
