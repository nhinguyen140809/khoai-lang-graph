#!/usr/bin/env python3
"""Build notebooks/benchmark_run.ipynb — cross-domain benchmark runner.

Chạy 8 scenario từ cross_domain.yaml.txt qua pipeline thật, lưu output
JSON cho từng scenario (requirements + product_backlogs) để so sánh benchmark."""
import json
from pathlib import Path

cells = []


def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": [text]}


def code(text):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": [text]}


# ════════════════════════════════ Title ════════════════════════════════
cells.append(md(r"""# Benchmark Run — Cross-Domain Scenarios

Chạy pipeline khoai-lang-graph trên 8 scenario đa ngành, lưu output JSON
(requirements + product_backlogs) cho từng scenario để so sánh benchmark.

**Yêu cầu:** Backend chạy `localhost:8001` (key OpenAI + DECISION_PROVIDER=jev).

**Output:** `benchmark_output/{scenario_id}.json` — mỗi file chứa:
`scenario_id`, `method`, `run_at`, `run_duration_s`, `project_id`, `run_id`,
`requirements` (dict key → fields), `product_backlogs` (dict key → fields).
"""))

# ════════════════════════════════ Cell 1: Config ════════════════════════════════
cells.append(md(r"""## Cell 1 — Cấu hình + đăng nhập

Chọn scenario để chạy qua `running_scenario`. Mặc định chạy 1 cái đầu để test."""))
cells.append(code(r'''import httpx, json, time, os
from pathlib import Path

try:
    import yaml
except ImportError:
    os.system("pip install pyyaml")
    import yaml

# ════════════════════════════════════════════════════════════════════
# SCENARIOS — comment/uncomment để chọn
# ════════════════════════════════════════════════════════════════════
# running_scenario = [
#     "it_incident_response",
#     "healthcare_care_coordination",
#     "finance_small_business_books",
#     "education_feedback",
#     "ecommerce_circular_marketplace",
#     "government_permit_portal",
#     "mobility_fleet_charging",
#     "hr_onboarding",
# ]
running_scenario = ["it_incident_response"]

# ════════════════════════════════════════════════════════════════════
# CONFIG
# ════════════════════════════════════════════════════════════════════
BASE = "http://localhost:8001"
H = {"Origin": "http://localhost:3000", "Content-Type": "application/json"}
OUTPUT_DIR = Path("../benchmark_output")
OUTPUT_DIR.mkdir(exist_ok=True)

YAML_PATH = Path("cross_domain.yaml.txt")
scenarios_data = yaml.safe_load(YAML_PATH.read_text(encoding="utf-8"))
ALL_SCENARIOS = {s["id"]: s for s in scenarios_data["scenarios"]}

# Verify all scenario IDs exist
for sid in running_scenario:
    assert sid in ALL_SCENARIOS, f"Scenario '{sid}' not found in YAML. Available: {list(ALL_SCENARIOS.keys())}"

# ════════════════════════════════════════════════════════════════════
# LOGIN
# ════════════════════════════════════════════════════════════════════
client = httpx.Client(base_url=BASE, headers=H, timeout=600.0, trust_env=False)
ts = int(time.time())
EMAIL = f"bench.{ts}@test.vn"

client.post("/api/v1/auth/register", json={
    "email": EMAIL, "password": "secret", "display_name": "Benchmark"})
r = client.post("/api/v1/auth/login", json={"email": EMAIL, "password": "secret"})
assert r.status_code == 204, f"Login failed: {r.status_code}"

print(f"Logged in — {len(running_scenario)} scenario(s) to run")
print(f"Output dir: {OUTPUT_DIR.resolve()}")
for sid in running_scenario:
    s = ALL_SCENARIOS[sid]
    print(f"  • {sid}: {s['title']}")
'''))

# ════════════════════════════════ Cell 2: Run function ════════════════════════════════
cells.append(md(r"""## Cell 2 — Hàm chạy 1 scenario

Tạo project → upload evidence → gửi intent → đợi pipeline xong → extract output → lưu JSON."""))
cells.append(code(r'''def build_scenario_document(scenario):
    """Đóng gói toàn bộ thông tin scenario thành markdown để pipeline mining."""
    lines = [f"# {scenario['title']}", ""]

    if scenario.get("context"):
        lines.append("## Context")
        lines.append(scenario["context"])
        lines.append("")

    if scenario.get("stakeholders"):
        lines.append("## Stakeholders")
        for s in scenario["stakeholders"]:
            lines.append(f"- {s}")
        lines.append("")

    if scenario.get("constraints"):
        lines.append("## Constraints")
        for c in scenario["constraints"]:
            lines.append(f"- {c}")
        lines.append("")

    lines.append("## Evidence")
    for ev in scenario.get("evidence", []):
        lines.append(f"### {ev['id']}")
        lines.append(ev["text"])
        lines.append("")

    return "\n".join(lines)


def run_scenario(scenario_id):
    """Chạy 1 scenario end-to-end, trả về summary + lưu JSON output."""
    scenario = ALL_SCENARIOS[scenario_id]
    intent = scenario["intent"]
    doc_text = build_scenario_document(scenario)
    t_start = time.time()

    # ── 1. Tạo project ──
    r = client.post("/api/v1/projects", json={
        "name": scenario["title"],
        "description": scenario.get("context", "")[:500],
        "output_language": "en",
    })
    if r.status_code != 201:
        return {"scenario_id": scenario_id, "status": "failed",
                "error": f"create project: {r.status_code} {r.text[:200]}"}
    project_id = r.json()["id"]

    # ── 2. Upload evidence document ──
    r = httpx.post(
        f"{BASE}/api/v1/projects/{project_id}/documents",
        files={"file": (f"{scenario_id}.md", doc_text.encode("utf-8"), "text/markdown")},
        data={"title": f"Evidence — {scenario['title']}"},
        headers={"Origin": "http://localhost:3000"},
        cookies=dict(client.cookies),
    )
    if r.status_code != 201:
        return {"scenario_id": scenario_id, "status": "failed",
                "error": f"upload: {r.status_code} {r.text[:200]}"}

    # ── 3. Thread + message (chạy pipeline) ──
    r = client.post(f"/api/v1/projects/{project_id}/threads", json={"title": None})
    thread_id = r.json()["id"]

    print(f"  ⏳ Running pipeline…")
    r = client.post(f"/api/v1/threads/{thread_id}/messages", json={
        "content": intent,
        "run_config": {
            "review_checkpoints": [],
            "output_language": "en",
            "parameters": {
                "target_sources_num": 3,
                "target_personas_num": 3,
                "max_turns": 6,
                "max_iterations": 2,
            },
        },
    })
    run = r.json().get("run", {})
    elapsed = time.time() - t_start

    if run.get("status") != "succeeded":
        error = run.get("error", {}).get("message", "unknown")
        return {"scenario_id": scenario_id, "status": "failed",
                "error": error, "elapsed_s": round(elapsed),
                "steps": run.get("step_count", 0)}

    # ── 4. Extract requirements (filter superseded + renumber) ──
    requirements = {}
    r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "spec_requirement"})
    for item in r.json()["items"]:
        if item.get("review_status") == "superseded":
            continue
        c = item["content"]
        requirements[item["key"]] = {
            "title": c.get("title", ""),
            "statement": c.get("statement", ""),
            "type": c.get("type", ""),
            "priority": c.get("priority", ""),
            "acceptance_criteria": c.get("acceptance_criteria", []),
            "verification_method": c.get("verification_method", ""),
        }
    # Renumber: REQ-001, REQ-002, ... (loại gap do supersede)
    requirements = {f"REQ-{i+1:03d}": v for i, v in enumerate(requirements.values())}

    # ── 5. Extract product backlogs (filter superseded + renumber) ──
    product_backlogs = {}
    r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "backlog_item"})
    for item in r.json()["items"]:
        if item.get("review_status") == "superseded":
            continue
        c = item["content"]
        product_backlogs[item["key"]] = {
            "title": c.get("title", ""),
            "item_type": c.get("item_type", ""),
            "as_a": c.get("as_a"),
            "i_want": c.get("i_want"),
            "so_that": c.get("so_that"),
            "acceptance_criteria": c.get("acceptance_criteria", []),
            "priority": c.get("priority", ""),
        }
    # Renumber: ITEM-001, ITEM-002, ... (loại gap do supersede)
    product_backlogs = {f"ITEM-{i+1:03d}": v for i, v in enumerate(product_backlogs.values())}

    # ── 6. Lưu benchmark output ──
    output = {
        "scenario_id": scenario_id,
        "method": "khoai-lang-graph",
        "run_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "run_duration_s": round(elapsed),
        "project_id": project_id,
        "run_id": run.get("id"),
        "run_status": "succeeded",
        "steps": run.get("step_count", 0),
        "requirements": requirements,
        "product_backlogs": product_backlogs,
    }

    out_file = OUTPUT_DIR / f"{scenario_id}.json"
    out_file.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "scenario_id": scenario_id,
        "status": "succeeded",
        "reqs": len(requirements),
        "backlogs": len(product_backlogs),
        "elapsed_s": round(elapsed),
        "steps": run.get("step_count", 0),
        "file": str(out_file),
    }

print("run_scenario() ready")
'''))

# ════════════════════════════════ Cell 3: Run all ════════════════════════════════
cells.append(md(r"""## Cell 3 — Chạy tất cả scenarios

Mỗi scenario mất ~2-5 phút (pipeline thật: LLM + search + Jev)."""))
cells.append(code(r'''results = []
for i, sid in enumerate(running_scenario, 1):
    s = ALL_SCENARIOS[sid]
    print(f"\n{'═'*60}")
    print(f"[{i}/{len(running_scenario)}] {sid}: {s['title']}")
    print(f"{'═'*60}")

    result = run_scenario(sid)
    results.append(result)

    if result["status"] == "succeeded":
        print(f"  ✓ {result['reqs']} requirements, {result['backlogs']} backlogs")
        print(f"  ⏱ {result['elapsed_s']}s  ({result['steps']} steps)")
        print(f"  📄 {result['file']}")
    else:
        print(f"  ✗ FAILED: {result['error'][:100]}")

print(f"\n{'═'*60}")
print(f"Done: {sum(1 for r in results if r['status']=='succeeded')}/{len(results)} succeeded")
print(f"{'═'*60}")
'''))

# ════════════════════════════════ Cell 4: Summary ════════════════════════════════
cells.append(md(r"""## Cell 4 — Tổng kết"""))
cells.append(code(r'''print(f"{'Scenario':<40s} {'Reqs':>5s} {'Backlogs':>8s} {'Time':>6s} {'Status':>8s}")
print("─" * 75)
for r in results:
    if r["status"] == "succeeded":
        print(f"{r['scenario_id']:<40s} {r['reqs']:>5d} {r['backlogs']:>8d} {r['elapsed_s']:>5d}s {'✓':>8s}")
    else:
        print(f"{r['scenario_id']:<40s} {'—':>5s} {'—':>8s} {r.get('elapsed_s',0):>5d}s {'✗':>8s}")

# List output files
print(f"\nOutput files in {OUTPUT_DIR.resolve()}:")
for f in sorted(OUTPUT_DIR.glob("*.json")):
    data = json.loads(f.read_text())
    n_reqs = len(data.get("requirements", {}))
    n_bl = len(data.get("product_backlogs", {}))
    print(f"  {f.name:<45s} {n_reqs:>3d} reqs  {n_bl:>3d} backlogs")
'''))

# ════════════════════════════════ Cell 5: Preview output ════════════════════════════════
cells.append(md(r"""## Cell 5 — Xem thử output 1 scenario

Mở file JSON đầu tiên để kiểm tra format."""))
cells.append(code(r'''if results and results[0]["status"] == "succeeded":
    f = OUTPUT_DIR / f"{results[0]['scenario_id']}.json"
    data = json.loads(f.read_text())

    print("Keys:", list(data.keys()))
    print(f"\nscenario_id: {data['scenario_id']}")
    print(f"method:     {data['method']}")
    print(f"run_at:     {data['run_at']}")
    print(f"duration:   {data['run_duration_s']}s")
    print(f"requirements: {len(data['requirements'])} items")
    print(f"backlogs:     {len(data['product_backlogs'])} items")

    # Show first requirement
    if data["requirements"]:
        k = list(data["requirements"])[0]
        print(f"\n── First requirement ({k}) ──")
        print(json.dumps(data["requirements"][k], indent=2)[:500])

    # Show first backlog
    if data["product_backlogs"]:
        k = list(data["product_backlogs"])[0]
        print(f"\n── First backlog ({k}) ──")
        print(json.dumps(data["product_backlogs"][k], indent=2)[:500])
'''))

# ════════════════════════════════ write notebook ════════════════════════════════
nb = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Khoai Backend (Python 3.12)",
            "language": "python",
            "name": "khoai-backend",
        },
        "language_info": {"name": "python", "version": "3.12.0"},
    },
    "nbformat": 4,
    "nbformat_minor": 4,
}

out = Path(__file__).resolve().parent / "benchmark_run.ipynb"
out.write_text(json.dumps(nb, ensure_ascii=False, indent=1), encoding="utf-8")

code_count = sum(1 for c in cells if c["cell_type"] == "code")
md_count = sum(1 for c in cells if c["cell_type"] == "markdown")
print(f"notebook: {len(cells)} cells ({code_count} code + {md_count} markdown)")
print(f"written: {out}")
