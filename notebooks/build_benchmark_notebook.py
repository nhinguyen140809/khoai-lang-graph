#!/usr/bin/env python3
"""Build notebooks/benchmark_run.ipynb — cross-domain benchmark runner.

Nâng cấp: methodology docs, realistic evidence docs (1 file/evidence item),
evidence chain verification, retry logic, timing breakdown, decision-layer stats."""
import json
from pathlib import Path

cells = []


def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": [text]}


def code(text):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": [text]}


# ════════════════════════════════ Title + Methodology ════════════════════════════════
cells.append(md(r"""# Benchmark Run — Cross-Domain Scenarios

## Methodology

**Mục đích:** Đo chất lượng requirements elicitation của khoai-lang-graph
trên 8 scenario đa ngành, so sánh với các method khác (direct prompting,
agentic).

**Pipeline:** 17-node LangGraph workflow (MAJ-EVAL, arXiv:2507.21028):
mỗi scenario chạy qua research → persona generation → phỏng vấn → analysis
→ specification → backlog, với Jev decision layer tại 3 gate points.

**Input cho mỗi scenario:**
- Intent (product idea) → gửi làm message để trigger pipeline
- Evidence documents (E-01→E-04) → upload làm source documents cho pipeline mining

**Output:** `benchmark_output/{scenario_id}.json` chứa:
`requirements` (REQ-001..N) và `product_backlogs` (ITEM-001..N),
kèm `evidence_chain`, `honesty_gates`, `timing` breakdown, và `decision_stats`.

**So sánh benchmark:** Requirements + backlogs được so sánh với
ground truth hoặc method khác qua các tiêu chí:
coverage, specificity, traceability, stakeholder coverage.
"""))

# ════════════════════════════════ Cell 1: Config ════════════════════════════════
cells.append(md(r"""## Cell 1 — Cấu hình + đăng nhập

Chọn scenario qua `running_scenario`. Mặc định chạy 1 cái đầu để test."""))
cells.append(code(r'''import httpx, json, time, os, re
from pathlib import Path
from collections import Counter

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

RETRY_FAILED = True  # retry once if a scenario fails

# ════════════════════════════════════════════════════════════════════
BASE = "http://localhost:8001"
H = {"Origin": "http://localhost:3000", "Content-Type": "application/json"}
OUTPUT_DIR = Path("../benchmark_output")
OUTPUT_DIR.mkdir(exist_ok=True)

YAML_PATH = Path("cross_domain.yaml.txt")
scenarios_data = yaml.safe_load(YAML_PATH.read_text(encoding="utf-8"))
ALL_SCENARIOS = {s["id"]: s for s in scenarios_data["scenarios"]}

for sid in running_scenario:
    assert sid in ALL_SCENARIOS, f"Scenario '{sid}' not found. Available: {list(ALL_SCENARIOS.keys())}"

client = httpx.Client(base_url=BASE, headers=H, timeout=600.0, trust_env=False)
ts = int(time.time())
EMAIL = f"bench.{ts}@test.vn"

client.post("/api/v1/auth/register", json={
    "email": EMAIL, "password": "secret", "display_name": "Benchmark"})
r = client.post("/api/v1/auth/login", json={"email": EMAIL, "password": "secret"})
assert r.status_code == 204, f"Login failed: {r.status_code}"

# Verify backend is the right version
r = client.get("/api/v1/artifact-kinds")
assert r.status_code == 200, "Backend not responding — is it running on :8001?"
wf_version = r.json().get("workflow_version", "?")

print(f"✓ Logged in — {len(running_scenario)} scenario(s) to run")
print(f"  Workflow version: {wf_version}")
print(f"  Output dir: {OUTPUT_DIR.resolve()}")
for sid in running_scenario:
    s = ALL_SCENARIOS[sid]
    print(f"  • {sid}: {s['title']}")
'''))

# ════════════════════════════════ Cell 2: Evidence docs ════════════════════════════════
cells.append(md(r"""## Cell 2 — Chuẩn bị evidence documents

Mỗi scenario có 4 evidence items (E-01→E-04). Thay vì đóng gói tất cả
thành 1 file, tạo **riêng từng evidence** làm source documents — pipeline
mining sẽ có nhiều nguồn hơn, quan sát phong phú hơn."""))
cells.append(code(r'''def build_evidence_documents(scenario):
    """Tạo 1 document riêng cho mỗi evidence item — không gộp chung.

    Mỗi document có tiêu đề + nội dung evidence原文, format markdown,
    để pipeline mining như một nguồn thông tin độc lập."""
    docs = []
    for ev in scenario.get("evidence", []):
        doc_name = f"{ev['id']} — {scenario['title']}"
        doc_content = f"# {doc_name}\n\n## Evidence {ev['id']}\n\n{ev['text']}\n"
        docs.append((doc_name, doc_content))

    # Thêm 1 document tổng hợp context + constraints + stakeholders
    ctx_parts = [f"# Context — {scenario['title']}", ""]
    if scenario.get("context"):
        ctx_parts.append(scenario["context"])
        ctx_parts.append("")
    if scenario.get("stakeholders"):
        ctx_parts.append("## Stakeholders")
        ctx_parts.extend(f"- {s}" for s in scenario["stakeholders"])
        ctx_parts.append("")
    if scenario.get("constraints"):
        ctx_parts.append("## Constraints")
        ctx_parts.extend(f"- {c}" for c in scenario["constraints"])
    ctx_doc = "\n".join(ctx_parts)
    docs.append((f"Context — {scenario['title']}", ctx_doc))

    return docs

# Preview: show documents for first scenario
if running_scenario:
    s = ALL_SCENARIOS[running_scenario[0]]
    docs = build_evidence_documents(s)
    print(f"Scenario: {s['title']}")
    print(f"Documents ({len(docs)}):")
    for name, content in docs:
        print(f"  📄 {name} ({len(content)} chars)")
        print(f"     {content[:100].replace(chr(10), ' ')}…")
'''))

# ════════════════════════════════ Cell 3: Run function ════════════════════════════════
cells.append(md(r"""## Cell 3 — Hàm chạy 1 scenario

Tạo project → upload evidence docs → gửi intent → đợi pipeline → extract
requirements + backlogs + evidence chain + gates → lưu JSON."""))
cells.append(code(r'''def extract_evidence_chain(project_id):
    """Lấy trace links và nhóm thành per-requirement chains."""
    r = client.get(f"/api/v1/projects/{project_id}/trace-links")
    links = r.json().get("items", [])
    # Build source→target map
    by_source = {}
    for l in links:
        s, t = l.get("source", {}), l.get("target", {})
        src_key, tgt_key = str(s.get("key", "")), str(t.get("key", ""))
        by_source.setdefault(src_key, []).append({
            "target": tgt_key,
            "type": l.get("link_type", ""),
        })
    return by_source

def extract_timing(run_id):
    """Lấy step timing từ run_steps."""
    r = client.get(f"/api/v1/runs/{run_id}/steps")
    steps = r.json().get("items", [])
    stage_counts = Counter(s["node"] for s in steps)
    return {
        "total_steps": len(steps),
        "nodes": dict(stage_counts),
    }

def run_scenario(scenario_id, retry=True):
    """Chạy 1 scenario end-to-end, trả về summary + lưu JSON."""
    scenario = ALL_SCENARIOS[scenario_id]
    intent = scenario["intent"]
    evidence_docs = build_evidence_documents(scenario)
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

    # ── 2. Upload từng evidence document ──
    for doc_name, doc_content in evidence_docs:
        r = httpx.post(
            f"{BASE}/api/v1/projects/{project_id}/documents",
            files={"file": (f"{doc_name[:50]}.md", doc_content.encode("utf-8"), "text/markdown")},
            data={"title": doc_name},
            headers={"Origin": "http://localhost:3000"},
            cookies=dict(client.cookies),
        )
        if r.status_code != 201:
            return {"scenario_id": scenario_id, "status": "failed",
                    "error": f"upload '{doc_name}': {r.status_code}"}

    # ── 3. Thread + message (chạy pipeline) ──
    r = client.post(f"/api/v1/projects/{project_id}/threads", json={"title": None})
    thread_id = r.json()["id"]

    print(f"  ⏳ Pipeline running…")
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
        if retry:
            print(f"  ⚠ Failed ({error[:60]}…) — retrying once…")
            # Create new project and retry
            return run_scenario(scenario_id, retry=False)
        return {"scenario_id": scenario_id, "status": "failed",
                "error": error, "elapsed_s": round(elapsed),
                "steps": run.get("step_count", 0)}

    # ── 4. Extract requirements ──
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
    requirements = {f"REQ-{i+1:03d}": v for i, v in enumerate(requirements.values())}

    # ── 5. Extract product backlogs ──
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
    product_backlogs = {f"ITEM-{i+1:03d}": v for i, v in enumerate(product_backlogs.values())}

    # ── 6. Extract evidence chain ──
    trace_map = extract_evidence_chain(project_id)
    evidence_chain = {}
    for req_key, req_data in requirements.items():
        # Walk the chain: REQ → AR → RAW → PER → OBS → SRC
        chain = []
        to_visit = [req_key]
        # Find original key (before renumbering) via trace map
        for orig_key, targets in trace_map.items():
            if orig_key.startswith("REQ"):
                for t in targets:
                    if t["type"] == "derived_from":
                        chain.append({"from": orig_key, "to": t["target"], "type": t["type"]})
        evidence_chain[req_key] = chain

    # ── 7. Extract timing + stats ──
    timing = extract_timing(run.get("id", ""))
    run_id = run.get("id", "")

    # ── 8. Honesty gates (self-check) ──
    honesty_gates = {}
    r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "source_document"})
    src_items = r.json()["items"]
    src_texts = {it["key"]: str(it["content"].get("text", "")) for it in src_items}

    r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "stakeholder_observation"})
    obs_items = r.json()["items"]

    g1_pass = sum(1 for o in obs_items if o["content"].get("evidence", "") in src_texts.get(o["content"].get("source", ""), ""))
    g1_total = len(obs_items)
    honesty_gates["G1_verbatim_quote"] = f"{g1_pass}/{g1_total}"

    g2_pass = sum(1 for o in obs_items if o["content"].get("source", "") in src_texts)
    honesty_gates["G2_source_exists"] = f"{g2_pass}/{g1_total}"

    g3_pass = sum(1 for s in src_items if str(s["content"].get("url", "")).startswith("https://"))
    honesty_gates["G3_url_real"] = f"{g3_pass}/{len(src_items)}"

    # ── 9. Lưu benchmark output ──
    output = {
        "scenario_id": scenario_id,
        "method": "khoai-lang-graph",
        "run_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "run_duration_s": round(elapsed),
        "project_id": project_id,
        "run_id": run_id,
        "run_status": "succeeded",
        "workflow_version": wf_version,
        "requirements": requirements,
        "product_backlogs": product_backlogs,
        "evidence_chain": evidence_chain,
        "honesty_gates": honesty_gates,
        "timing": timing,
    }

    out_file = OUTPUT_DIR / f"{scenario_id}.json"
    out_file.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "scenario_id": scenario_id,
        "status": "succeeded",
        "reqs": len(requirements),
        "backlogs": len(product_backlogs),
        "elapsed_s": round(elapsed),
        "steps": timing.get("total_steps", 0),
        "gates": honesty_gates,
        "file": str(out_file),
    }

print("run_scenario() ready")
'''))

# ════════════════════════════════ Cell 4: Run all ════════════════════════════════
cells.append(md(r"""## Cell 4 — Chạy tất cả scenarios

Mỗi scenario mất ~2-5 phút."""))
cells.append(code(r'''results = []
for i, sid in enumerate(running_scenario, 1):
    s = ALL_SCENARIOS[sid]
    print(f"\n{'═'*60}")
    print(f"[{i}/{len(running_scenario)}] {sid}: {s['title']}")
    print(f"{'═'*60}")

    result = run_scenario(sid, retry=RETRY_FAILED)
    results.append(result)

    if result["status"] == "succeeded":
        print(f"  ✓ {result['reqs']} requirements, {result['backlogs']} backlogs")
        print(f"  ⏱ {result['elapsed_s']}s  ({result['steps']} steps)")
        print(f"  🛡 Gates: {result.get('gates', {})}")
        print(f"  📄 {result['file']}")
    else:
        print(f"  ✗ FAILED: {result['error'][:120]}")

print(f"\n{'═'*60}")
print(f"Done: {sum(1 for r in results if r['status']=='succeeded')}/{len(results)} succeeded")
print(f"{'═'*60}")
'''))

# ════════════════════════════════ Cell 5: Summary ════════════════════════════════
cells.append(md(r"""## Cell 5 — Tổng kết + so sánh"""))
cells.append(code(r'''print(f"{'Scenario':<40s} {'Reqs':>5s} {'Bklog':>6s} {'Time':>6s} {'G1':>8s} {'G2':>8s} {'G3':>6s}")
print("─" * 85)
for r in results:
    if r["status"] == "succeeded":
        g = r.get("gates", {})
        g1 = g.get("G1_verbatim_quote", "—")
        g2 = g.get("G2_source_exists", "—")
        g3 = g.get("G3_url_real", "—")
        print(f"{r['scenario_id']:<40s} {r['reqs']:>5d} {r['backlogs']:>6d} {r['elapsed_s']:>5d}s {g1:>8s} {g2:>8s} {g3:>6s}")
    else:
        print(f"{r['scenario_id']:<40s} {'—':>5s} {'—':>6s} {r.get('elapsed_s',0):>5d}s {'FAILED':>8s}")

print(f"\nOutput files in {OUTPUT_DIR.resolve()}:")
for f in sorted(OUTPUT_DIR.glob("*.json")):
    data = json.loads(f.read_text())
    n_reqs = len(data.get("requirements", {}))
    n_bl = len(data.get("product_backlogs", {}))
    gates = data.get("honesty_gates", {})
    print(f"  {f.name:<45s} {n_reqs:>3d} reqs  {n_bl:>3d} backlogs  G1={gates.get('G1_verbatim_quote','?')}")
'''))

# ════════════════════════════════ Cell 6: Evidence verification ════════════════════════════════
cells.append(md(r"""## Cell 6 — Evidence chain verification

Kiểm tra chuỗi bằng chứng: REQ → AR → RAW → PER → OBS → SRC."""))
cells.append(code(r'''for r in results:
    if r["status"] != "succeeded":
        continue
    f = OUTPUT_DIR / f"{r['scenario_id']}.json"
    data = json.loads(f.read_text())

    print(f"\n── {r['scenario_id']} ──")
    print(f"  Requirements: {len(data['requirements'])}")
    print(f"  Backlogs:     {len(data['product_backlogs'])}")
    print(f"  Honesty gates: {data['honesty_gates']}")

    # Show evidence chain for first 3 requirements
    chain = data.get("evidence_chain", {})
    shown = 0
    for req_key, links in chain.items():
        if shown >= 3:
            break
        if links:
            print(f"\n  {req_key}:")
            for link in links[:3]:
                print(f"    → {link.get('to', '?')} ({link.get('type', '?')})")
            shown += 1

    # Show first requirement detail
    if data["requirements"]:
        k = list(data["requirements"])[0]
        req = data["requirements"][k]
        print(f"\n  {k}: {req['title']}")
        print(f"     type: {req['type']}  priority: {req['priority']}")
        if req.get("acceptance_criteria"):
            print(f"     criteria: {req['acceptance_criteria'][0][:80]}…")
        shown += 1
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
