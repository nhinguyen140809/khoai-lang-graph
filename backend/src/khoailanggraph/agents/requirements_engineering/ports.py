"""The ports the graph needs from the world outside it (ports.py of the docs).

`ArtifactSink` and `DirectiveSink` are Protocols: the graph declares what it
needs and never imports a feature. The product wires the database-backed
implementations of the artifacts feature at run start; the research harness
and the tests wire in-memory ones. The same domain rules govern both, so what
an agent produces and what the API validates cannot disagree.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Protocol, TypedDict, runtime_checkable

if TYPE_CHECKING:
    from khoailanggraph.agents.requirements_engineering.state import ArtifactRef, ItemRef


class LinkRecord(TypedDict):
    """One outgoing trace link of an item, in prompt-view form."""

    link_type: str
    """The keys of the linked items (or {message, quote} objects for evidence)."""
    targets: list[str]
    """Exact words on the target side for evidence links (else empty)."""
    quotes: dict[str, str]


class ItemRecord(TypedDict):
    """An item as the graph reads it: identity, content and outgoing links."""

    item_id: str
    kind: str
    key: str
    version: int
    review_status: str
    content: dict[str, object]
    links: list[LinkRecord]


class ArtifactRecord(TypedDict):
    """An artifact as the graph reads it, with its items in outline order."""

    artifact_id: str
    kind: str
    title: str
    version: int
    review_status: str
    content: dict[str, object]
    items: list[ItemRecord]


class ArtifactDirectiveRecord(TypedDict):
    """One recorded directive as a re-entering node reads it (§2.1)."""

    id: str
    kind: str
    target_node: str
    instruction: str
    iteration: int
    item_ids: list[str]


@runtime_checkable
class ArtifactSink(Protocol):
    """Everything the workflow writes into, or reads from, the artifact store.

    Implementations validate every write through `domain.rules` and reject it
    with `domain.errors.IntegrityError` when a rule fails; keys are assigned
    from the project counters and never reused; every write produces a
    revision. `ref`s are unique per node response and are resolved by
    `add_item`, so an agent never sees a generated key before it exists.

    `agent_role` is the role of the node that writes: the node wrapper sets it
    before a node runs, and the sink credits the writes of the node to it.
    """

    agent_role: str | None

    def create_artifact(
        self,
        project_id: str,
        kind: str,
        *,
        title: str,
        content: dict[str, object],
        summary: str | None = None,
        subject_id: str | None = None,
    ) -> ArtifactRef:
        """A new artifact of `kind` (one artifact for a `one-per-project` kind)."""
        ...

    def read_artifact(
        self,
        project_id: str,
        kind: str,
        *,
        subject_id: str | None = None,
    ) -> ArtifactRecord | None:
        """The current artifact of `kind` (of the given subject), or None."""
        ...

    def read_item(self, item_id: str) -> ItemRecord:
        """One item at its current version."""
        ...

    def read_items(self, artifact_id: str) -> list[ItemRecord]:
        """All items of one artifact, in outline order."""
        ...

    def update_artifact_content(
        self,
        artifact_id: str,
        content: dict[str, object],
    ) -> ArtifactRef:
        """Replace writable content fields of an artifact (a new version)."""
        ...

    def add_item(
        self,
        artifact_id: str,
        kind: str,
        content: dict[str, object],
        *,
        ref: str | None = None,
        subject_id: str | None = None,
        parent_id: str | None = None,
    ) -> ItemRef:
        """A new item inside `artifact_id`; `ref` becomes its response ref."""
        ...

    def mark_item_superseded(self, item_id: str) -> ItemRef:
        """Flip an item's review status to superseded (a rework replacement)."""
        ...

    def update_item_content(self, item_id: str, content: dict[str, object]) -> ItemRef:
        """Replace the content of an item after a checkpoint edit (a new version)."""
        ...

    def add_link(
        self,
        *,
        source_id: str,
        target_id: str,
        link_type: str,
        source_quote: str | None = None,
        target_quote: str | None = None,
        note: str | None = None,
    ) -> None:
        """One trace link, checked against the pairs of the definition in use."""
        ...

    def approve_artifact(self, artifact_id: str) -> ArtifactRef:
        """Set an artifact and its draft items to approved (approve option)."""
        ...

    def plan_values(self, project_id: str, reference: str) -> list[str]:
        """The values of the field an `x-value-from` reference names (top of the
        referenced artifact), for the plan-values integrity rule."""
        ...


@runtime_checkable
class DirectiveSink(Protocol):
    """Where node-issued directives are recorded, so the UI can explain loops."""

    def create_directive(
        self,
        run_id: str,
        kind: str,
        *,
        target_node: str,
        iteration: int,
        instruction: str,
        item_ids: list[str],
    ) -> str:
        """Record one directive (`rework` or `intent`); returns its id."""
        ...

    def read_directive(self, directive_id: str) -> ArtifactDirectiveRecord | None:
        """One directive, for the nodes that re-enter a stage."""
        ...
