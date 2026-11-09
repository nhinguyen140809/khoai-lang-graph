"""In-memory sinks for the tests (and the research harness pattern).

Every write goes through `domain.rules` with the version-1 definition — the
same checks the SQLite-backed feature sink will run — and keys come from
project key counters that never reuse a number. Superseding marks the old
item; revisions append; artifacts of a `per_project: many` kind are created
afresh (a new validation report per iteration).
"""

from __future__ import annotations

from typing import Any, cast

from khoailanggraph.agents.requirements_engineering import definition as wf
from khoailanggraph.agents.requirements_engineering.ports import (
    ArtifactDirectiveRecord,
    ArtifactRecord,
    ItemRecord,
    LinkRecord,
)
from khoailanggraph.agents.requirements_engineering.state import ArtifactRef, ItemRef
from khoailanggraph.domain import links as link_rules
from khoailanggraph.domain import rules as domain_rules
from khoailanggraph.domain.errors import IntegrityError, Violation
from khoailanggraph.domain.keys import (
    KEY_PREFIXES,
    backlog_key,
    interview_message_key,
    key,
)
from khoailanggraph.domain.rules import LinkCandidate

ARTIFACT_KINDS = wf.artifact_kinds()
LINK_TYPES = wf.link_types()
VALUE_LISTS = wf.value_lists()
ITEM_KINDS = sorted(wf.item_kinds())


class InMemoryArtifactSink:
    """An `ArtifactSink` over plain dicts, enforcing the domain rules."""

    def __init__(self) -> None:
        self.project_counters: dict[tuple[str, str], int] = {}
        self.artifacts: list[dict[str, Any]] = []
        self.items: list[dict[str, Any]] = []
        self.links: list[dict[str, Any]] = []
        self.written: list[str] = []  # references of the current response pass

    # — keys —
    def _next(self, project_id: str, prefix: str) -> int:
        counter_key = (project_id, prefix)
        self.project_counters[counter_key] = self.project_counters.get(counter_key, 0) + 1
        return self.project_counters[counter_key]

    def _raise(self, violations: list[Violation]) -> None:
        if violations:
            raise IntegrityError(violations)

    # — artifact side —
    def create_artifact(
        self,
        project_id: str,
        kind: str,
        *,
        title: str,
        content: dict[str, Any],
        summary: str | None = None,
        subject_id: str | None = None,
    ) -> ArtifactRef:
        spec = ARTIFACT_KINDS.get(kind)
        if spec is None:
            msg = f"unknown artifact kind {kind}"
            raise ValueError(msg)
        if spec["per_project"] == "one" and self.read_artifact(project_id, kind) is not None:
            self._raise([Violation("one artifact", f"the project already has a {kind}")])
        self._raise(domain_rules.validate_content(kind, content, value_lists=VALUE_LISTS))
        artifact = {
            "artifact_id": f"artifact-{len(self.artifacts) + 1:04d}",
            "project_id": project_id,
            "kind": kind,
            "title": title,
            "summary": summary,
            "content": dict(content),
            "subject_id": subject_id,
            "version": 1,
            "review_status": "draft",
        }
        self.artifacts.append(artifact)
        return self._artifact_ref(artifact)

    @staticmethod
    def _artifact_ref(artifact: dict[str, Any]) -> ArtifactRef:
        return ArtifactRef(
            artifact_id=artifact["artifact_id"],
            kind=artifact["kind"],
            title=artifact["title"],
            version=artifact["version"],
        )

    def _artifact_row(self, artifact_id: str) -> dict[str, Any]:
        for artifact in self.artifacts:
            if artifact["artifact_id"] == artifact_id:
                return artifact
        msg = f"no artifact {artifact_id}"
        raise KeyError(msg)

    def read_artifact(
        self,
        project_id: str,
        kind: str,
        *,
        subject_id: str | None = None,
    ) -> ArtifactRecord | None:
        found = None
        for artifact in self.artifacts:
            if artifact["project_id"] != project_id or artifact["kind"] != kind:
                continue
            if subject_id is None and ARTIFACT_KINDS[kind]["per_project"] == "one":
                found = artifact
                break
            if subject_id is not None and artifact["subject_id"] == subject_id:
                found = artifact
                break
        if found is None:
            return None
        return ArtifactRecord(
            artifact_id=found["artifact_id"],
            kind=found["kind"],
            title=found["title"],
            version=found["version"],
            review_status=found["review_status"],
            content=dict(found["content"]),
            items=[
                self._item_record(entry)
                for entry in self.items
                if entry["artifact_id"] == found["artifact_id"]
            ],
        )

    def update_artifact_content(self, artifact_id: str, content: dict[str, Any]) -> ArtifactRef:
        artifact = self._artifact_row(artifact_id)
        merged = {**artifact["content"], **content}
        self._raise(
            domain_rules.validate_content(str(artifact["kind"]), merged, value_lists=VALUE_LISTS)
        )
        artifact["content"] = merged
        artifact["version"] += 1
        return self._artifact_ref(artifact)

    def approve_artifact(self, artifact_id: str) -> ArtifactRef:
        artifact = self._artifact_row(artifact_id)
        artifact["review_status"] = "approved"
        for item in self.items:
            if item["artifact_id"] == artifact_id and item["review_status"] == "draft":
                item["review_status"] = "approved"
        return self._artifact_ref(artifact)

    # — item side —
    def _item_record(self, entry: dict[str, Any]) -> ItemRecord:
        outgoing = [
            {
                "link_type": link["link_type"],
                "targets": [link["target_key"]],
                "quotes": {link["target_key"]: link["quote"]} if link["quote"] else {},
            }
            for link in self.links
            if link["source_id"] == entry["item_id"]
        ]
        merged: dict[str, dict[str, list[Any]]] = {}
        for link in outgoing:
            slot = merged.setdefault(link["link_type"], {"targets": [], "quotes": []})
            slot["targets"].extend(link["targets"])
            slot["quotes"].extend(list(link["quotes"].items()) or [])
        quotes_typed = {
            name: {quote_key: quote_value for quote_key, quote_value in slot["quotes"]}
            for name, slot in merged.items()
        }
        records = [
            LinkRecord(
                link_type=name,
                targets=list(slot["targets"]),
                quotes=quotes_typed[name],
            )
            for name, slot in merged.items()
        ]
        return ItemRecord(
            item_id=entry["item_id"],
            kind=entry["kind"],
            key=entry["key"],
            version=entry["version"],
            review_status=entry["review_status"],
            content=dict(entry["content"]),
            links=records,
        )

    @staticmethod
    def _item_ref(entry: dict[str, Any]) -> ItemRef:
        return ItemRef(
            item_id=entry["item_id"],
            kind=entry["kind"],
            key=entry["key"],
            version=entry["version"],
        )

    def read_item(self, item_id: str) -> ItemRecord:
        for entry in self.items:
            if entry["item_id"] == item_id:
                return self._item_record(entry)
        msg = f"no item {item_id}"
        raise KeyError(msg)

    def read_items(self, artifact_id: str) -> list[ItemRecord]:
        return [
            self._item_record(entry) for entry in self.items if entry["artifact_id"] == artifact_id
        ]

    def _item_key(
        self,
        project_id: str,
        kind: str,
        content: dict[str, Any],
        artifact_id: str,
    ) -> str:
        """The key of a new item: persona-anchored for interview messages."""
        if kind == "interview_message":
            return self._transcript_persona_key(project_id, artifact_id)
        if kind == "backlog_item":
            number = self._next(project_id, "backlog")
            return backlog_key(number, epic=bool(content["item_type"] == "epic"))
        prefix = KEY_PREFIXES.get(kind, kind.upper()[:3])
        return key(prefix, self._next(project_id, prefix))

    def _transcript_persona_key(self, project_id: str, artifact_id: str) -> str:
        """The transcript artifact is one per persona (§2.3): the key of its
        messages is the persona's key, `#` and the position in the artifact."""
        artifact = self._artifact_row(artifact_id)
        subject = artifact.get("subject_id")
        if subject is None:
            msg = "an interview transcript artifact needs its persona subject"
            raise ValueError(msg)
        subject_entry = next((entry for entry in self.items if entry["item_id"] == subject), None)
        if subject_entry is None:
            msg = "the transcript's persona does not exist yet"
            raise ValueError(msg)
        position = 1 + len([entry for entry in self.items if entry["artifact_id"] == artifact_id])
        return interview_message_key(str(subject_entry["key"]), position)

    def add_item(
        self,
        artifact_id: str,
        kind: str,
        content: dict[str, Any],
        *,
        ref: str | None = None,
        subject_id: str | None = None,
        parent_id: str | None = None,
    ) -> ItemRef:
        artifact = self._artifact_row(artifact_id)
        self._raise(
            domain_rules.check_item_in_artifact(kind, str(artifact["kind"]), ARTIFACT_KINDS)
        )
        plan_values = {
            "elicitation_plan.topics": self.plan_values(artifact["project_id"], "topics"),
            "elicitation_plan.stakeholder_types": self.plan_values(
                artifact["project_id"], "stakeholder_types"
            ),
        }
        self._raise(
            domain_rules.validate_content(
                kind, content, value_lists=VALUE_LISTS, plan_values=plan_values
            )
        )
        entry_key = self._item_key(str(artifact["project_id"]), kind, content, artifact_id)
        entry = {
            "item_id": f"item-{len(self.items) + 1:04d}",
            "artifact_id": artifact_id,
            "project_id": artifact["project_id"],
            "kind": kind,
            "key": entry_key,
            "content": dict(content),
            "version": 1,
            "review_status": "draft",
            "parent_id": parent_id,
        }
        artifact["version"] += 1
        self.items.append(entry)
        return self._item_ref(entry)

    def update_item_content(self, item_id: str, content: dict[str, Any]) -> ItemRef:
        for entry in self.items:
            if entry["item_id"] == item_id:
                merged = {**entry["content"], **content}
                self._raise(
                    domain_rules.validate_content(
                        str(entry["kind"]), merged, value_lists=VALUE_LISTS
                    )
                )
                entry["content"] = merged
                entry["version"] += 1
                return self._item_ref(entry)
        msg = f"no item {item_id}"
        raise KeyError(msg)

    def mark_item_superseded(self, item_id: str) -> ItemRef:
        for entry in self.items:
            if entry["item_id"] == item_id:
                entry["review_status"] = "superseded"
                entry["version"] += 1
                return self._item_ref(entry)
        msg = f"no item {item_id}"
        raise KeyError(msg)

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
        source = next((e for e in self.items if e["item_id"] == source_id), None)
        target = next((e for e in self.items if e["item_id"] == target_id), None)
        if source is None or target is None:
            msg = "link endpoints must both exist"
            raise ValueError(msg)
        violations = domain_rules.check_link(
            LinkCandidate(
                link_type=link_type,
                source_id=source_id,
                source_kind=str(source["kind"]),
                target_id=target_id,
                target_kind=str(target["kind"]),
            ),
            link_types=LINK_TYPES,
        )
        self._raise(violations)
        if link_type in link_rules.ACYCLIC_LINK_TYPES:
            links_as_rows = [
                (str(row["source_id"]), str(row["target_id"]), str(row["link_type"]))
                for row in self.links
            ]
            links_as_rows.append((source_id, target_id, link_type))
            if link_rules.has_cycle(links_as_rows, link_type):
                self._raise(
                    [Violation("no cycle", f"{link_type} would loop back to {source['key']}")]
                )
        if any(
            row["source_id"] == source_id
            and row["target_id"] == target_id
            and row["link_type"] == link_type
            for row in self.links
        ):
            self._raise([Violation("no duplicate", f"{link_type} already links these items")])
        self.links.append(
            {
                "source_id": source_id,
                "source_key": source["key"],
                "target_id": target_id,
                "target_key": target["key"],
                "link_type": link_type,
                "source_quote": source_quote,
                "quote": target_quote,
                "note": note,
            }
        )

    def plan_values(self, project_id: str, reference: str) -> list[str]:
        plan = self.read_artifact(project_id, "elicitation_plan")
        if plan is None:
            return []
        field = reference.split(".", maxsplit=1)[1] if "." in reference else reference
        content = cast("dict[str, Any]", plan["content"])
        values = content.get(field, [])
        return [str(value) for value in list(values)]


class InMemoryDirectiveSink:
    """A `DirectiveSink` over a list, for tests and the demo."""

    def __init__(self) -> None:
        self.rows: list[dict[str, Any]] = []

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
        directive_id = f"directive-{len(self.rows) + 1:04d}"
        self.rows.append(
            {
                "id": directive_id,
                "run_id": run_id,
                "kind": kind,
                "target_node": target_node,
                "iteration": iteration,
                "instruction": instruction,
                "item_ids": list(item_ids),
            }
        )
        return directive_id

    def read_directive(self, directive_id: str) -> ArtifactDirectiveRecord | None:
        row = next((row for row in self.rows if row["id"] == directive_id), None)
        if row is None:
            return None
        return ArtifactDirectiveRecord(
            id=str(row["id"]),
            kind=str(row["kind"]),
            target_node=str(row["target_node"]),
            instruction=str(row["instruction"]),
            iteration=int(row["iteration"]),
            item_ids=[str(entry) for entry in row["item_ids"]],
        )
