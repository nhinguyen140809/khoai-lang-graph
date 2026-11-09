"""Kind + schema version -> content model and canonical JSON Schema.

The canonical schema files of workflow definition version 2 live beside this
module (`content_schemas/*.v1.json`, and the v2 files of `persona` and
`persona_catalog`), as copies of `docs/schemas/`; the typed content models mirror them and a unit test
fails when the two drift apart. This module is the single place that knows
which model and which schema file belong to a kind. The versions live in one
map so they mirror the `schema_version` of `definition.v2.json` without the
domain importing the agents package.
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
    ResearchCorpusContent,
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
    SourceDocumentContent,
    SpecRequirementContent,
    StakeholderObservationContent,
    ValidationIssueContent,
)

if TYPE_CHECKING:
    from pydantic import BaseModel

_DEFAULT_SCHEMA_VERSION = 1

# The canonical schema version of every kind, mirroring the `schema_version`
# of `definition.v2.json` (persona + persona_catalog moved to v2 there).
SCHEMA_VERSIONS: dict[str, int] = {
    "persona": 2,
    "persona_catalog": 2,
}

ARTIFACT_CONTENT_MODELS: dict[str, type[BaseModel]] = {
    "elicitation_plan": ElicitationPlanContent,
    "research_corpus": ResearchCorpusContent,
    "persona_catalog": PersonaCatalogContent,
    "interview_transcript": InterviewTranscriptContent,
    "requirements_analysis": RequirementsAnalysisContent,
    "requirement_specification": RequirementSpecificationContent,
    "product_backlog": ProductBacklogContent,
    "validation_report": ValidationReportContent,
}

ITEM_CONTENT_MODELS: dict[str, type[BaseModel]] = {
    "section": SectionContent,
    "source_document": SourceDocumentContent,
    "stakeholder_observation": StakeholderObservationContent,
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


def schema_version(kind: str) -> int:
    """The canonical schema version of a kind (default 1)."""
    return SCHEMA_VERSIONS.get(kind, _DEFAULT_SCHEMA_VERSION)


def schema_filename(kind: str) -> str:
    """The canonical schema file name of a kind, e.g. `spec_requirement.v1.json`."""
    return f"{kind}.v{schema_version(kind)}.json"


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
