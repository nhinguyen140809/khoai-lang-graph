"""The frozen per-run configuration and its parameters (DATA_SHAPE: RunConfig).

The executor resolves a `RunConfig` field by field when a run starts, and it
never changes again: `models` is a map for every agent role of the workflow
definition version, `parameters` are the limits of the workflow. Storing it
as a plain JSON object in the run row and validating it here gives both the
run record and the graph the same, typed view of the frozen copy.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RunParameters(BaseModel):
    """The parameter set of workflow definition version 2, resolved per run."""

    model_config = ConfigDict(extra="forbid")

    target_sources_num: int = Field(default=3, ge=1, le=10)
    target_personas_num: int = Field(default=3, ge=1, le=10)
    max_personas: int = Field(default=3, ge=1, le=10)
    max_turns: int = Field(default=6, ge=1, le=20)
    max_iterations: int = Field(default=2, ge=0, le=5)


class RunConfig(BaseModel):
    """The frozen operating parameters of one run (docs/DATA_SHAPE §6)."""

    model_config = ConfigDict(extra="forbid")

    models: dict[str, str]
    review_checkpoints: list[str]
    output_language: Literal["en", "vi"] = "en"
    max_steps: int = Field(default=80, ge=1)
    max_cost_usd: float | None = None
    parameters: RunParameters = Field(default_factory=RunParameters)
