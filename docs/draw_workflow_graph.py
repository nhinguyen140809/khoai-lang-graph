#!/usr/bin/env python3
"""Sinh docs/workflow-graph.svg — MAIN FLOW, nền trắng, tối giản.

Node/cạnh đọc từ definition.v3.json; cạnh hiển thị được chọn theo main path
(mỗi cặp chọn phải TỒN TẠI trong JSON — chọn cặp không có là lỗi). Tự kiểm
overlap hình học trước khi ghi. Chỉ stdlib.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEF = ROOT / "backend/src/khoailanggraph/agents/requirements_engineering/definition.v3.json"
OUT = ROOT / "docs/workflow-graph.svg"

# Main flow: (source, target) — mọi cặp phải có trong edges của JSON.
MAIN_FLOW = [
    ("__start__", "planner"),
    ("planner", "corpus_builder"),
    ("corpus_builder", "stakeholder_miner"),
    ("stakeholder_miner", "persona_generator"),
    ("persona_generator", "checkpoint_personas"),
    ("checkpoint_personas", "interviewer"),
    ("interviewer", "persona_agent"),
    ("persona_agent", "interviewer"),
    ("interviewer", "analyst"),
    ("analyst", "checkpoint_analysis"),
    ("checkpoint_analysis", "requirement_engineer"),
    ("requirement_engineer", "checkpoint_spec"),
    ("checkpoint_spec", "backlog_manager"),
    ("backlog_manager", "validator"),
    ("validator", "__end__"),
]
LOOPS = [  # vẽ mảnh, nét đứt — cấu trúc lặp
    ("validator", "requirement_engineer"),
]

# Hàng: danh sách node mỗi hàng, theo thứ tự hiển thị.
ROWS = [
    ["__start__"],
    ["planner"],
    ["corpus_builder", "stakeholder_miner"],
    ["persona_generator"],
    ["checkpoint_personas"],
    ["interviewer", "persona_agent"],
    ["analyst"],
    ["checkpoint_analysis"],
    ["requirement_engineer"],
    ["checkpoint_spec"],
    ["backlog_manager"],
    ["validator"],
    ["__end__"],
]

# Tham số bố cục
W = 860
NODE_W, NODE_H = 190, 44
GAP_X = 70
ROW_H = 92
TOP = 36
BOTTOM = 66

INK, BOX_FILL, BOX_LINE = "#1f2328", "#f6f8fa", "#d0d7de"
GREEN, BLUE, GRAY = "#1a7f37", "#0969da", "#8c959f"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def load():
    d = json.loads(DEF.read_text(encoding="utf-8"))
    nodes = {n["id"]: n for n in d["nodes"]}
    edge_pairs = {(e["source"], e["target"]) for e in d["edges"]}
    return d, nodes, edge_pairs, d["nodes"], d["edges"]


def place():
    rects = {}
    for r, row in enumerate(ROWS):
        total = len(row) * NODE_W + (len(row) - 1) * GAP_X
        x0 = (W - total) / 2
        y = TOP + r * ROW_H + (ROW_H - NODE_H) / 2
        for k, nid in enumerate(row):
            rects[nid] = (x0 + k * (NODE_W + GAP_X), y, NODE_W, NODE_H)
    return rects


def center(rc):
    return rc[0] + rc[2] / 2, rc[1] + rc[3] / 2


def border_point(rc, tx, ty):
    cx, cy = center(rc)
    dx, dy = tx - cx, ty - cy
    hw, hh = rc[2] / 2 + 1, rc[3] / 2 + 1
    t = min(hw / abs(dx) if dx else 9e9, hh / abs(dy) if dy else 9e9)
    return cx + dx * t, cy + dy * t


def two_lines(text):
    if len(text) <= 20 or " " not in text:
        return [text.replace("_", " ")]
    parts = text.replace("_", " ").split(" ")
    if len(parts) < 2:
        return [text]
    return [" ".join(parts[:-1]).title(), parts[-1].title()]


def node_svg(nid, nodes, rects, parts):
    nd = nodes[nid]
    x, y, w, h = rects[nid]
    kind = nd["kind"]
    if kind in ("start", "end"):
        stroke, rx, extra, tc = GREEN, NODE_H / 2, "", "#1a7f37"
    elif kind == "checkpoint":
        stroke, rx, extra, tc = BLUE, 8, 'stroke-dasharray="6 4"', "#0969da"
    elif kind == "control":
        stroke, rx, extra, tc = GRAY, 8, 'stroke-dasharray="6 4"', "#57606a"
    else:
        stroke, rx, extra, tc = BOX_LINE, 8, "", INK
    parts.append(
        f'<g id="n-{esc(nid)}"><rect x="{x:.0f}" y="{y:.0f}" width="{w}" height="{h}" '
        f'rx="{rx}" fill="{"#fff" if kind in ("start","end","checkpoint") else BOX_FILL}" '
        f'stroke="{stroke}" stroke-width="1.5" {extra}/>'
    )
    lines = two_lines(nd.get("label") or nid)
    ty = y + h / 2 + 4.5 - (len(lines) - 1) * 8
    for i, ln in enumerate(lines):
        parts.append(
            f'<text x="{x + w / 2:.0f}" y="{ty + i * 16:.0f}" font-size="13.5" '
            f'fill="{tc}" text-anchor="middle">{esc(ln)}</text>'
        )
    parts.append("</g>")


def edge_svg(src, tgt, rects, parts, thin=False):
    scx, scy = center(rects[src])
    tcx, tcy = center(rects[tgt])
    # cùng hàng → cung dưới hàng
    if abs(rects[src][1] - rects[tgt][1]) < 1:
        x1, x2 = sorted([scx, tcx])
        yb = rects[src][1] + rects[src][3]
        d = f"M {x1:.0f} {yb:.0f} Q {(x1 + x2) / 2:.0f} {yb + 30:.0f} {x2:.0f} {yb:.0f}"
    else:
        p1 = border_point(rects[src], tcx, tcy)
        p2 = border_point(rects[tgt], scx, scy)
        d = f"M {p1[0]:.0f} {p1[1]:.0f} L {p2[0]:.0f} {p2[1]:.0f}"
    style = (
        f'stroke="{GRAY}" stroke-width="1.4" stroke-dasharray="5 4"' if thin
        else f'stroke="#57606a" stroke-width="1.7"'
    )
    parts.append(
        f'<path d="{d}" fill="none" {style} stroke-linejoin="round" marker-end="url(#{"am2" if thin else "am"})"/>'
    )


def main():
    d, nodes, edge_pairs, all_nodes, all_edges = load()

    problems = []
    shown = [n for row in ROWS for n in row]
    for nid in shown:
        if nid not in nodes:
            problems.append(f"node '{nid}' không có trong JSON")
    for pair in MAIN_FLOW + LOOPS:
        if pair not in edge_pairs:
            problems.append(f"main-flow edge {pair} không có trong JSON")
    if problems:
        print("VI PHẠM dữ liệu nguồn:")
        for p in problems:
            print("  -", p)
        sys.exit(1)

    rects = place()
    # kiểm overlap hình học (nới 4px mỗi bên)
    ids = list(rects)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = rects[ids[i]], rects[ids[j]]
            if (a[0] - 4 < b[0] + b[2] + 4 and b[0] - 4 < a[0] + a[2] + 4
                    and a[1] - 4 < b[1] + b[3] + 4 and b[1] - 4 < a[1] + a[3] + 4):
                problems.append(f"overlap: {ids[i]} × {ids[j]}")
    if problems:
        print("VI PHẠM bố cục:")
        for p in problems:
            print("  -", p)
        sys.exit(1)

    H = TOP + len(ROWS) * ROW_H + BOTTOM
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'font-family="system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif">',
        '<defs>',
        f'<marker id="am" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7.5" '
        f'markerHeight="7.5" orient="auto-start-reverse">'
        f'<path d="M 0 0 L 10 5 L 0 10 z" fill="#57606a"/></marker>',
        f'<marker id="am2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
        f'markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{GRAY}"/></marker>',
        '</defs>',
        f'<rect width="{W}" height="{H}" fill="#ffffff"/>',
    ]
    for src, tgt in MAIN_FLOW:
        edge_svg(src, tgt, rects, parts)
    for src, tgt in LOOPS:
        edge_svg(src, tgt, rects, parts, thin=True)
    # nhãn duy nhất: "rework" cạnh lặp validator → engineer
    vx = rects["validator"]
    ex = rects["requirement_engineer"]
    rx = (vx[0] + vx[2] + ex[0] + ex[2]) / 2 + 34
    parts.append(
        f'<text x="{rx:.0f}" y="{(vx[1] + ex[1]) / 2 + 14:.0f}" font-size="11" '
        f'fill="{GRAY}" text-anchor="middle" font-style="italic">rework</text>'
    )
    for nid in shown:
        node_svg(nid, nodes, rects, parts)
    parts.append(
        f'<text x="{W / 2}" y="{H - 26}" font-size="11.5" fill="{GRAY}" '
        f'text-anchor="middle">Main flow · {len(shown)}/{len(all_nodes)} nodes · '
        f"{len(MAIN_FLOW)}+{len(LOOPS)}/{len(all_edges)} edges · definition.v3.json</text>"
    )
    parts.append("</svg>")

    OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
    print("── BÁO CÁO ──")
    print(f"JSON: {len(all_nodes)} nodes · {len(all_edges)} edges")
    print(f"hiển thị: {len(shown)} nodes · {len(MAIN_FLOW) + len(LOOPS)} edges (main flow + loops)")
    print(f"bỏ: intent_router, rework_elicitation (nhánh phụ) · các nhánh review-reject")
    print("overlap-check: PASS")
    print(f"written: {OUT}")


if __name__ == "__main__":
    main()
