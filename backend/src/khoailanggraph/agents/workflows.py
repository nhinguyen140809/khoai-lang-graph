"""The workflows the app runs, behind one interface.

`Workflow` is what every workflow has in common: its name, its current version, the definition it
serves for any published version, and its kind. What a workflow does to execute a run is its own:
`requirements_engineering` walks a graph in the background and may pause at a review, and
`assistance` answers within the request that asked. A new workflow is a definition file, a
subclass of `Workflow` and a line in `WORKFLOWS`; see `docs/architecture/assistance.md`.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Literal

from khoailanggraph.agents.assistance import definition as assistance_definition
from khoailanggraph.agents.requirements_engineering import definition as requirements_definition

# `work` is the work of a project, which a thread follows live and waits for; `answer` is a run that
# answers one message and is over when the request answers.
WorkflowKind = Literal["work", "answer"]


class Workflow(ABC):
    """What a client and the server need of a workflow, whatever it does."""

    @property
    @abstractmethod
    def name(self) -> str:
        """The name that its runs store as `workflow_name`."""

    @property
    @abstractmethod
    def version(self) -> int:
        """The version that a new run uses."""

    @property
    @abstractmethod
    def kind(self) -> WorkflowKind:
        """Whether its runs are the work of a thread or the answer to one message."""

    @abstractmethod
    def definition_bytes_for(self, version: int | None = None) -> bytes | None:
        """The exact bytes of one published version of its definition, the current one without a
        version; None when the version was never published."""


class RequirementsEngineeringWorkflow(Workflow):
    """The requirements work of a project: a graph that runs in the background."""

    @property
    def name(self) -> str:
        return requirements_definition.WORKFLOW_NAME

    @property
    def version(self) -> int:
        return requirements_definition.WORKFLOW_VERSION

    @property
    def kind(self) -> WorkflowKind:
        return "work"

    def definition_bytes_for(self, version: int | None = None) -> bytes | None:
        if version is None or version == self.version:
            return requirements_definition.definition_bytes()
        return requirements_definition.definition_bytes_for(version)


class AssistanceWorkflow(Workflow):
    """The answer to a message about the app: one agent, finished within the request."""

    @property
    def name(self) -> str:
        return assistance_definition.WORKFLOW_NAME

    @property
    def version(self) -> int:
        return assistance_definition.WORKFLOW_VERSION

    @property
    def kind(self) -> WorkflowKind:
        return "answer"

    def definition_bytes_for(self, version: int | None = None) -> bytes | None:
        return assistance_definition.definition_bytes_for(version)


REQUIREMENTS_ENGINEERING = RequirementsEngineeringWorkflow()
ASSISTANCE = AssistanceWorkflow()

WORKFLOWS: dict[str, Workflow] = {
    workflow.name: workflow for workflow in (REQUIREMENTS_ENGINEERING, ASSISTANCE)
}


def workflow_named(name: str) -> Workflow | None:
    """The workflow of a name, None for a name that no workflow has."""
    return WORKFLOWS.get(name)


def answer_workflow_names() -> list[str]:
    """The names of the workflows whose runs answer one message."""
    return [name for name, workflow in WORKFLOWS.items() if workflow.kind == "answer"]
