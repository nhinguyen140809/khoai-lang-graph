"""The traceability views of a project, computed from its items and links.

Everything here is a pure function of plain values, so the rules can be tested
without a database. The kinds of the views come from the workflow definition: the
chain of `derived_from` links gives the levels of the matrix (from the backlog down
to the raw requirements), and the `evidenced_by` links tie its last level to the
interview. A definition with other kinds needs no change here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

DERIVATION = "derived_from"
EVIDENCE = "evidenced_by"
CHAIN_LINK_TYPES = (DERIVATION, EVIDENCE)

Direction = Literal["backward", "forward", "both"]


@dataclass(frozen=True)
class Node:
    """An item as the views read it."""

    id: str
    key: str
    kind: str
    version: int
    review_status: str
    title: str


@dataclass(frozen=True)
class Edge:
    """A current link between two live items."""

    id: str
    source: str
    target: str
    link_type: str
    target_version: int


# - the kinds of the chain -


def _listed_pairs(link_type: dict[str, Any]) -> list[tuple[list[str], list[str]]]:
    """The pairs that list their kinds: `any` and `same` name no kind."""
    return [
        (list(pair["source"]), list(pair["target"]))
        for pair in link_type["pairs"]
        if isinstance(pair["source"], list) and isinstance(pair["target"], list)
    ]


def target_kinds(link_type: dict[str, Any]) -> list[str]:
    """The kinds that the pairs of a link type lead to, without a repeat, in listed order."""
    return list(dict.fromkeys(kind for _s, targets in _listed_pairs(link_type) for kind in targets))


def kind_levels(link_type: dict[str, Any]) -> list[list[str]]:
    """The kinds of a chain of links, level by level: the top is a kind that only starts links,
    and each level holds the kinds that the level above links to."""
    pairs = _listed_pairs(link_type)
    receivers = {kind for _s, targets in pairs for kind in targets}
    level = [
        kind
        for kind in dict.fromkeys(kind for sources, _t in pairs for kind in sources)
        if kind not in receivers
    ]
    placed = set(level)
    levels: list[list[str]] = []
    while level:
        levels.append(level)
        current = set(level)
        following = dict.fromkeys(
            kind for sources, targets in pairs if current & set(sources) for kind in targets
        )
        level = [kind for kind in following if kind not in placed]
        placed.update(level)
    return levels


def sentence_case(key: str) -> str:
    """`raw_requirement` as `Raw requirement`."""
    text = key.replace("_", " ")
    return text[:1].upper() + text[1:]


@dataclass(frozen=True)
class Chain:
    """What the views follow in a definition."""

    levels: list[list[str]]
    evidence_kinds: list[str]

    @classmethod
    def of(cls, link_types: dict[str, dict[str, Any]]) -> Chain:
        return cls(
            levels=kind_levels(link_types[DERIVATION]),
            evidence_kinds=target_kinds(link_types[EVIDENCE]),
        )

    @property
    def top_kinds(self) -> list[str]:
        return self.levels[0]

    @property
    def built_from_top_kinds(self) -> list[str]:
        return self.levels[1]

    @property
    def derived_kinds(self) -> list[str]:
        """The kinds between the top and the last level."""
        return [kind for level in self.levels[1:-1] for kind in level]


def _column(kinds: list[str]) -> dict[str, Any]:
    return {
        "key": kinds[0],
        "title": " / ".join(sentence_case(kind) for kind in kinds),
        "kinds": kinds,
    }


def summary(node: Node) -> dict[str, str]:
    return {"item_id": node.id, "key": node.key, "kind": node.kind, "title": node.title}


# - the project graph -


@dataclass
class Graph:
    """The items of a project and the links between them, for the views to walk."""

    nodes: dict[str, Node]
    edges: list[Edge]
    out: dict[str, list[Edge]] = field(init=False, default_factory=dict)
    inc: dict[str, list[Edge]] = field(init=False, default_factory=dict)

    def __post_init__(self) -> None:
        for edge in self.edges:
            self.out.setdefault(edge.source, []).append(edge)
            self.inc.setdefault(edge.target, []).append(edge)

    def targets_of(self, node: Node, link_type: str) -> list[Node]:
        """The items that `node` links to with a link type, in link order."""
        return [
            self.nodes[edge.target]
            for edge in self.out.get(node.id, [])
            if edge.link_type == link_type
        ]

    def sources_of(self, node: Node, link_type: str) -> list[Node]:
        """The items that link to `node` with a link type, in link order."""
        return [
            self.nodes[edge.source]
            for edge in self.inc.get(node.id, [])
            if edge.link_type == link_type
        ]

    def of_kinds(self, kinds: list[str]) -> list[Node]:
        return [node for node in self.nodes.values() if node.kind in kinds]


def _distinct(nodes: list[Node]) -> list[Node]:
    return list({node.id: node for node in nodes}.values())


# - the matrix -

Cells = dict[str, list[dict[str, str]]]


def matrix(graph: Graph, chain: Chain) -> dict[str, Any]:
    """One row for each chain from the top of the derivation down to the interview."""
    columns = [*(_column(level) for level in chain.levels), _column(chain.evidence_kinds)]
    evidence_key = columns[-1]["key"]
    last = len(chain.levels) - 1
    empty: Cells = {column["key"]: [] for column in columns}

    def rows_from(node: Node, level: int) -> list[Cells]:
        own: Cells = {columns[level]["key"]: [summary(node)]}
        below = level + 1
        derived = [
            target
            for target in graph.targets_of(node, DERIVATION)
            if target.kind in chain.levels[below]
        ]
        if below == last:
            messages = _distinct(
                [message for item in derived for message in graph.targets_of(item, EVIDENCE)]
            )
            return [
                {
                    **own,
                    columns[below]["key"]: [summary(item) for item in derived],
                    evidence_key: [summary(message) for message in messages],
                }
            ]
        if not derived:
            return [own]
        return [{**own, **rest} for item in derived for rest in rows_from(item, below)]

    rows = [cells for node in graph.of_kinds(chain.levels[0]) for cells in rows_from(node, 0)]
    for level in range(1, last):
        placed = {cell["item_id"] for row in rows for cell in row.get(columns[level]["key"], [])}
        rows += [
            cells
            for node in graph.of_kinds(chain.levels[level])
            if node.id not in placed
            for cells in rows_from(node, level)
        ]
    return {"columns": columns, "rows": [{"cells": {**empty, **cells}} for cells in rows]}


# - the coverage -


def _isout_of_date(edge: Edge, target: Node) -> bool:
    return edge.target_version < target.version or target.review_status == "superseded"


def coverage(graph: Graph, chain: Chain) -> dict[str, Any]:
    """The items that need attention, by the reason: each gap is a list of items and the
    words that say why, as the user reads them."""
    top = chain.top_kinds[0]
    no_backlog = [
        node
        for node in graph.of_kinds(chain.built_from_top_kinds)
        if not any(source.kind in chain.top_kinds for source in graph.sources_of(node, DERIVATION))
    ]
    no_source = [
        node
        for node in graph.of_kinds(chain.derived_kinds)
        if not graph.targets_of(node, DERIVATION)
    ]
    stale: dict[str, list[dict[str, Any]]] = {}
    for edge in graph.edges:
        target = graph.nodes[edge.target]
        if edge.link_type in CHAIN_LINK_TYPES and _isout_of_date(edge, target):
            stale.setdefault(edge.source, []).append(
                {
                    "target": summary(target),
                    "link_type": edge.link_type,
                    "made_from_version": edge.target_version,
                    "current_version": target.version,
                }
            )
    needs_review = [node for node in graph.nodes.values() if node.id in stale]
    return {
        "gaps": [
            {
                "key": f"no_{top}",
                "title": "Requirements without a user story",
                "description": (
                    "These specified requirements have no user story in the backlog that is "
                    "built from them yet."
                ),
                "items": [summary(node) for node in no_backlog],
            },
            {
                "key": "no_source",
                "title": "Requirements without a source",
                "description": "These requirements are not based on any need from the interviews.",
                "items": [summary(node) for node in no_source],
            },
            {
                "key": "needs_review",
                "title": "Links to check",
                "description": (
                    "The item that each of these links is based on changed after the link was "
                    "made, or was replaced."
                ),
                "items": [
                    {**summary(node), "changed_targets": stale[node.id]} for node in needs_review
                ],
            },
        ]
    }


# - the chain of an item -


def trace(
    graph: Graph, starts: list[str], direction: Direction, depth: int | None
) -> tuple[list[Node], list[Edge]]:
    """The items and the links that a walk from `starts` reaches.

    `backward` follows each link from its source to its target (where an item came from),
    `forward` from its target to its source (what was built from it), and `both` gives the two
    walks together. A walk keeps its direction to the end, so `both` does not reach the other
    items built from the same source. A link whose other end is beyond `depth` is left out;
    without a depth the walk goes to the end.
    """
    walks: list[dict[str, list[Edge]]] = []
    if direction in {"backward", "both"}:
        walks.append(graph.out)
    if direction in {"forward", "both"}:
        walks.append(graph.inc)
    reached: set[str] = set(starts)
    found: dict[str, Edge] = {}
    for adjacent in walks:
        distance = dict.fromkeys(starts, 0)
        queue = list(starts)
        for current in queue:
            if depth is not None and distance[current] >= depth:
                continue
            for edge in adjacent.get(current, []):
                found[edge.id] = edge
                other = edge.target if adjacent is graph.out else edge.source
                if other not in distance:
                    distance[other] = distance[current] + 1
                    queue.append(other)
        reached.update(distance)
    nodes = sorted((graph.nodes[node_id] for node_id in reached), key=lambda node: node.key)
    links = sorted(found.values(), key=lambda edge: edge.id)
    return nodes, links
