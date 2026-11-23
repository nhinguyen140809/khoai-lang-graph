"""Shapes of the assistant: what the client receives, and what the model answers.

The model answers one structured object that says which of the two things a message is, the words
to show when it is a question about the application, and the UI actions to run. The client only
knows the actions it is allowed to run, so the type is a closed set.

A second shape, `AssistantStep`, is how the model asks to read one more thing before answering: the
tools it may name are closed too, so a name it invents fails at validation.

An item is reached through its document or by the key the tools read: the assistant is given the
documents of the project and the reads it may make, not the whole project at once.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ActionType = Literal[
    "open_document",
    "open_item",
    "open_review",
    "open_settings",
    "send_to_workflow",
]


class AssistantAction(BaseModel):
    """One thing the client does after the answer, such as opening a document or an item.

    `artifact_id` and `item_id` name a record of the project, which the server resolves and checks
    before the action leaves it; the client never receives an id it may not open. `label` is the
    short phrase the answer uses for the action, in the language of the conversation.

    `open_review` takes no id: the client scrolls to the card of the review that waits, and there is
    at most one at a time.
    """

    model_config = ConfigDict(extra="forbid")

    type: ActionType
    artifact_id: str | None = None
    item_id: str | None = None
    label: str | None = None


class AssistantReply(BaseModel):
    """The answer of the assistant: what it says, and what the client does next."""

    model_config = ConfigDict(extra="forbid")

    text: str
    actions: list[AssistantAction] = Field(default_factory=list)


class AssistantDecision(BaseModel):
    """What the model decides for one message: the workflow, or an answer of the assistant."""

    model_config = ConfigDict(extra="forbid")

    kind: Literal["workflow", "general"]
    text: str = ""
    actions: list[AssistantAction] = Field(default_factory=list)


# The reads the model may ask for before it answers. Closed, so a name it invents fails here rather
# than reaching a lookup at run time.
ToolName = Literal[
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

    Splitting them keeps the loop honest — the model names at most one read `MAX_TOOL_STEPS` times,
    and answers only with `answer`. A step that names a read and no answer is a read, never a guess.
    """

    model_config = ConfigDict(extra="forbid")

    tool: ToolName | None = None
    key: str | None = None
    answer: AssistantDecision | None = None

