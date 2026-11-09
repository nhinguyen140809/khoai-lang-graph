"""A small project graph for the traceability tests.

Items are `(key, kind)` and links `(source key, target key, link type)`.
"""

from __future__ import annotations

from khoailanggraph.features.artifacts.traceability import Edge, Graph, Node


def graph(
    items: list[tuple[str, str]],
    links: list[tuple[str, str, str]],
    *,
    versions: dict[str, int] | None = None,
    link_versions: dict[tuple[str, str, str], int] | None = None,
    superseded: frozenset[str] = frozenset(),
) -> Graph:
    """Items named by key (the key is the id too) and the links between them."""
    versions = versions or {}
    link_versions = link_versions or {}
    nodes = {
        key: Node(
            id=key,
            key=key,
            kind=kind,
            version=versions.get(key, 1),
            review_status="superseded" if key in superseded else "draft",
            title=f"title of {key}",
        )
        for key, kind in items
    }
    edges = [
        Edge(
            id=f"{source}>{target}:{link_type}",
            source=source,
            target=target,
            link_type=link_type,
            target_version=link_versions.get((source, target, link_type), 1),
        )
        for source, target, link_type in links
    ]
    return Graph(nodes=nodes, edges=edges)


# The chain of the definition: a story is built from a requirement, which is built from a need
# that was said in a message.
ITEMS = [
    ("US1", "backlog_item"),
    ("US2", "backlog_item"),
    ("REQ1", "spec_requirement"),
    ("REQ2", "spec_requirement"),
    ("AR1", "analyzed_requirement"),
    ("RAW1", "raw_requirement"),
    ("LN1", "latent_need"),
    ("MSG1", "interview_message"),
]
LINKS = [
    ("US1", "REQ1", "derived_from"),
    ("US2", "REQ1", "derived_from"),
    ("REQ1", "AR1", "derived_from"),
    ("AR1", "RAW1", "derived_from"),
    ("AR1", "LN1", "derived_from"),
    ("RAW1", "MSG1", "evidenced_by"),
    ("LN1", "MSG1", "evidenced_by"),
]
