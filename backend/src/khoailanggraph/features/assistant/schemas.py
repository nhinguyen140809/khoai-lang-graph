"""Shapes of the assistant: what the model answers, and the UI commands that the client receives.

The model answers one structured object that says which of the two things a message is, the words
to show when it is a question about the application, and the commands for the client to run. A
command is named by a key of the catalog (`commands.catalog.json`), which says what each one needs
checked; the key is checked against that catalog when the answer is finished, so a new command is a
line in the catalog and not a change here.

A second shape, `AssistantStep`, is how the model asks to read one more thing before answering: the
tools it may name are closed too, so a name it invents fails at validation.

The assistant is given the head of the project and the reads it may make, not the whole project at
once: what it needs it looks at with its tools.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class UiCommand(BaseModel):
    """One thing the client does after the answer, such as opening a document or an item.

    `command` is a key of the catalog. `artifact_id` and `item_id` name a record of the project,
    which the server resolves and checks before the command leaves, as the `needs` of the catalog
    says; the client never receives an id it may not open. `label` is the short phrase the answer
    uses for the command, in the language of the conversation.
    """

    model_config = ConfigDict(extra="forbid")

    command: str
    artifact_id: str | None = None
    item_id: str | None = None
    label: str | None = None


class AssistantDecision(BaseModel):
    """What the model decides for one message: the workflow, or an answer of the assistant."""

    model_config = ConfigDict(extra="forbid")

    kind: Literal["workflow", "general"]
    text: str = ""
    commands: list[UiCommand] = Field(default_factory=list)


# The reads the model may ask for before it answers. Closed, so a name it invents fails here rather
# than reaching a lookup at run time.
ToolName = Literal[
    "project_overview",
    "list_documents",
    "search_items",
    "run_settings",
    "read_item",
    "read_document",
    "latest_run",
    "open_issues",
    "trace_item",
    "stage_info",
    "budget_left",
]


class AssistantStep(BaseModel):
    """One move of the model: either a read to make, or the answer.

    Splitting them keeps the loop honest — the model names at most one read `max_reads` times,
    and answers only with `answer`. A step that names a read and no answer is a read, never a guess.
    """

    model_config = ConfigDict(extra="forbid")

    tool: ToolName | None = None
    key: str | None = None
    answer: AssistantDecision | None = None
