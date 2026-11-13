"""Content models of the artifact kinds of workflow definition version 2."""

from khoailanggraph.domain.artifacts.elicitation_plan import ElicitationPlanContent
from khoailanggraph.domain.artifacts.interview_transcript import InterviewTranscriptContent
from khoailanggraph.domain.artifacts.persona_catalog import (
    PersonaCatalogContent,
    StakeholderGroupContent,
)
from khoailanggraph.domain.artifacts.product_backlog import ProductBacklogContent
from khoailanggraph.domain.artifacts.requirement_specification import (
    Definition,
    RequirementSpecificationContent,
)
from khoailanggraph.domain.artifacts.requirements_analysis import RequirementsAnalysisContent
from khoailanggraph.domain.artifacts.research_corpus import ResearchCorpusContent
from khoailanggraph.domain.artifacts.validation_report import ValidationReportContent

__all__ = [
    "Definition",
    "ElicitationPlanContent",
    "InterviewTranscriptContent",
    "PersonaCatalogContent",
    "ProductBacklogContent",
    "RequirementSpecificationContent",
    "RequirementsAnalysisContent",
    "ResearchCorpusContent",
    "StakeholderGroupContent",
    "ValidationReportContent",
]
