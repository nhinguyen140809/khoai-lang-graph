"""Kind + schema version -> content model and canonical JSON Schema.

The canonical schema files of workflow definition version 1 live beside this
module (`content_schemas/*.v1.json`); the typed content models mirror them and
a unit test fails when the two drift apart. This module is the single place
that knows which model and which schema file belong to a kind.
"""

from __future__ import annotations

import json
from importlib import resources
from typing import TYPE_CHECKING, Any, cast

from khoailanggraph.domain.artifacts import (
    ElicitationPlanContent,
    InterviewTranscriptContent,
    PersonaCatalogContent,
    ProductBacklogContent,
    RequirementsAnalysisContent,
    RequirementSpecificationContent,
    ValidationReportContent,
)
from khoailanggraph.domain.items import (
    AmbiguityIssueContent,
    AnalyzedRequirementContent,
    AssumptionContent,
    BacklogItemContent,
    ConflictContent,
    InterviewMessageContent,
    LatentNeedContent,
    PersonaContent,
    RawRequirementContent,
    SectionContent,
    SpecRequirementContent,
    ValidationIssueContent,
)

if TYPE_CHECKING:
    from pydantic import BaseModel

SCHEMA_VERSION = 1

ARTIFACT_CONTENT_MODELS: dict[str, type[BaseModel]] = {
    "elicitation_plan": ElicitationPlanContent,
    "persona_catalog": PersonaCatalogContent,
    "interview_transcript": InterviewTranscriptContent,
    "requirements_analysis": RequirementsAnalysisContent,
    "requirement_specification": RequirementSpecificationContent,
    "product_backlog": ProductBacklogContent,
    "validation_report": ValidationReportContent,
}

ITEM_CONTENT_MODELS: dict[str, type[BaseModel]] = {
    "section": SectionContent,
    "persona": PersonaContent,
    "interview_message": InterviewMessageContent,
    "raw_requirement": RawRequirementContent,
    "analyzed_requirement": AnalyzedRequirementContent,
    "latent_need": LatentNeedContent,
    "assumption": AssumptionContent,
    "ambiguity_issue": AmbiguityIssueContent,
    "conflict": ConflictContent,
    "spec_requirement": SpecRequirementContent,
    "backlog_item": BacklogItemContent,
    "validation_issue": ValidationIssueContent,
}

CONTENT_MODELS: dict[str, type[BaseModel]] = {**ARTIFACT_CONTENT_MODELS, **ITEM_CONTENT_MODELS}


def content_model(kind: str) -> type[BaseModel]:
    """The typed content model of a kind; KeyError means the kind is unknown."""
    return CONTENT_MODELS[kind]


def is_artifact(kind: str) -> bool:
    return kind in ARTIFACT_CONTENT_MODELS


def schema_filename(kind: str) -> str:
    """The canonical schema file name of a kind, e.g. `spec_requirement.v1.json`."""
    return f"{kind}.v{SCHEMA_VERSION}.json"


def schema_bytes(kind: str) -> bytes:
    """The exact bytes of a kind's canonical content schema file."""
    return (
        resources.files("khoailanggraph.domain") / "content_schemas" / schema_filename(kind)
    ).read_bytes()


def schema_dict(kind: str) -> dict[str, Any]:
    """A kind's canonical content schema, parsed."""
    return cast("dict[str, Any]", json.loads(schema_bytes(kind)))


def all_kinds() -> list[str]:
    """Every kind that has a canonical schema, artifact and item kinds alike."""
    return sorted(CONTENT_MODELS)
