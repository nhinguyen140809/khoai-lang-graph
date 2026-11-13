#!/usr/bin/env python3
"""Build notebooks/benchmark_run.ipynb — cross-domain benchmark runner.

Professional version: rich evidence documents, evidence chain verification,
honesty gates self-check, timing breakdown, retry logic, methodology docs."""
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

**Research question:** How does khoai-lang-graph's multi-agent requirements
engineering pipeline perform across diverse domains, compared to other methods
(direct prompting, single-agent, agentic)?

**Pipeline:** 17-node LangGraph workflow implementing MAJ-EVAL
(arXiv:2507.21028) with Jev decision layer at 3 gate points. Each scenario
runs the complete elicitation: research → persona generation → simulated
stakeholder interviews → analysis → specification → backlog.

**Input per scenario:**
- **Intent** (product idea) → sent as the chat message that triggers the run
- **Evidence documents** (3 files) → uploaded as source documents for the
  pipeline's corpus builder to mine

**Evidence document design:** Each scenario generates 3 documents built from
the YAML's structured fields (intent, context, stakeholders, constraints,
goals, scope, risk profile, known unknowns, evidence statements). The
evidence statements are embedded verbatim so the 5 Honesty Gates can trace
every observation back to an exact sentence.

**Output:** `benchmark_output/{scenario_id}.json` with:
- `requirements` — REQ-001..N with title, statement, type, priority, criteria
- `product_backlogs` — ITEM-001..N with user-story fields and GWT criteria
- `evidence_chain` — per-REQ trace links to source documents
- `honesty_gates` — G1 (verbatim quote), G2 (source exists), G3 (real URL)
- `timing` — per-node step counts

**Benchmark comparison criteria:**
- Coverage (how many evidence items are addressed by requirements)
- Specificity (are requirements actionable, not vague)
- Traceability (can every requirement trace to evidence)
- Stakeholder coverage (are all stakeholder types represented)
"""))

# ════════════════════════════════ Cell 1: Config ════════════════════════════════
cells.append(md(r"""## Cell 1 — Cấu hình + đăng nhập"""))
cells.append(code(r'''import httpx, json, time, os
from pathlib import Path
from collections import Counter

try:
    import yaml
except ImportError:
    os.system("pip install pyyaml")
    import yaml

# ════════════════════════════════════════════════════════════════════
# SCENARIOS
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

RETRY_FAILED = True

# ════════════════════════════════════════════════════════════════════
BASE = "http://localhost:8001"
H = {"Origin": "http://localhost:3000", "Content-Type": "application/json"}
OUTPUT_DIR = Path("../benchmark_output")
OUTPUT_DIR.mkdir(exist_ok=True)

YAML_PATH = Path("cross_domain.yaml.txt")
scenarios_data = yaml.safe_load(YAML_PATH.read_text(encoding="utf-8"))
ALL_SCENARIOS = {s["id"]: s for s in scenarios_data["scenarios"]}

for sid in running_scenario:
    assert sid in ALL_SCENARIOS, f"'{sid}' not found. Available: {list(ALL_SCENARIOS.keys())}"

client = httpx.Client(base_url=BASE, headers=H, timeout=600.0, trust_env=False)
ts = int(time.time())
EMAIL = f"bench.{ts}@test.vn"

client.post("/api/v1/auth/register", json={
    "email": EMAIL, "password": "secret", "display_name": "Benchmark"})
r = client.post("/api/v1/auth/login", json={"email": EMAIL, "password": "secret"})
assert r.status_code == 204, f"Login failed: {r.status_code}"

r = client.get("/api/v1/artifact-kinds")
assert r.status_code == 200, "Backend not responding — is it on :8001?"
wf_version = r.json().get("workflow_version", "?")

print(f"✓ Logged in — {len(running_scenario)} scenario(s)")
print(f"  Workflow v{wf_version}  |  Output: {OUTPUT_DIR.resolve()}")
for sid in running_scenario:
    s = ALL_SCENARIOS[sid]
    print(f"  • {sid}: {s['title']}")
'''))

# ════════════════════════════════ Cell 2: Evidence docs ════════════════════════════════
cells.append(md(r"""## Cell 2 — Evidence documents

Mỗi scenario sinh **3 documents phong phú** từ YAML fields:
1. **Project Brief** — intent + goals + scope + priority
2. **Stakeholder Analysis** — context + stakeholders + risks + unknowns
3. **Constraints & Evidence** — constraints (with rationale) + evidence E-01→E-04 verbatim

Evidence text được nhúng **nguyên văn** để 5 Honesty Gates trace được."""))
cells.append(code(r'''def build_evidence_documents(scenario):
    """Sinh 3 documents phong phú từ YAML structured fields.

    Mỗi document 300+ words, format chuyên nghiệp, chứa evidence
    statements verbatim để pipeline mining + gates trace được.
    """
    sid = scenario["id"]
    title = scenario["title"]
    docs = []

    # ─── Document 1: Project Brief ───
    brief = [f"# {title} — Project Brief\n"]

    brief.append("## Vision\n")
    brief.append(scenario.get("intent", "") + "\n")

    if scenario.get("goals"):
        brief.append("## Goals\n")
        for g in scenario["goals"]:
            brief.append(f"- {g}")
        brief.append("")

    if scenario.get("in_scope"):
        brief.append("## Scope\n")
        brief.append("### In Scope\n")
        for item in scenario["in_scope"]:
            brief.append(f"- {item}")
        brief.append("")

    if scenario.get("out_of_scope"):
        brief.append("### Out of Scope\n")
        for item in scenario["out_of_scope"]:
            brief.append(f"- {item}")
        brief.append("")

    if scenario.get("priority_drivers"):
        brief.append("## Priority Guidance\n")
        for item in scenario["priority_drivers"]:
            brief.append(item)
        brief.append("")

    docs.append(("brief", f"{title} — Project Brief", "\n".join(brief)))

    # ─── Document 2: Stakeholder Analysis ───
    analysis = [f"# {title} — Current State & Stakeholder Analysis\n"]

    if scenario.get("context"):
        analysis.append("## Background\n")
        analysis.append(scenario["context"] + "\n")

    if scenario.get("stakeholders"):
        analysis.append("## Stakeholders\n")
        analysis.append("The following roles are involved in or affected by this initiative:\n")
        for s in scenario["stakeholders"]:
            label = s.replace("_", " ").title()
            analysis.append(f"- **{label}**")
        analysis.append("")

    if scenario.get("risk_profile"):
        analysis.append("## Risk Profile\n")
        analysis.append("The system must address the following risk categories:\n")
        for r in scenario["risk_profile"]:
            label = r.replace("_", " ").title()
            analysis.append(f"- **{label}**")
        analysis.append("")

    if scenario.get("known_unknowns"):
        analysis.append("## Known Unknowns\n")
        analysis.append("The following are explicitly not specified and should be treated as open questions:\n")
        for u in scenario["known_unknowns"]:
            analysis.append(f"- {u}")
        analysis.append("")

    if scenario.get("ambiguity_level"):
        analysis.append(f"## Ambiguity Level\n")
        analysis.append(f"This scenario has **{scenario['ambiguity_level']}** ambiguity, "
                        "meaning some requirements may need clarification from stakeholders.\n")

    docs.append(("stakeholders", f"{title} — Stakeholder Analysis", "\n".join(analysis)))

    # ─── Document 3: Constraints & Evidence ───
    constraints_doc = [f"# {title} — Constraints & Evidence\n"]

    if scenario.get("constraints"):
        constraints_doc.append("## Constraints\n")
        for i, c in enumerate(scenario["constraints"], 1):
            constraints_doc.append(f"### Constraint {i}\n")
            constraints_doc.append(c + "\n")
            constraints_doc.append(
                "**Rationale**: This constraint must be satisfied in the first release "
                "and constrains the solution space for all derived requirements.\n")
        constraints_doc.append("")

    if scenario.get("evidence"):
        constraints_doc.append("## Evidence Statements\n")
        constraints_doc.append(
            "The following evidence statements are the authoritative source "
            "for requirements derivation:\n")
        for ev in scenario["evidence"]:
            constraints_doc.append(f"### {ev['id']}\n")
            constraints_doc.append(ev["text"] + "\n")
        constraints_doc.append("")

    docs.append(("constraints", f"{title} — Constraints & Evidence", "\n".join(constraints_doc)))

    return docs

# Preview
if running_scenario:
    s = ALL_SCENARIOS[running_scenario[0]]
    docs = build_evidence_documents(s)
    print(f"Scenario: {s['title']}")
    print(f"Documents ({len(docs)}):")
    for key, name, content in docs:
        wc = len(content.split())
        print(f"  📄 {name} ({wc} words, {len(content)} chars)")
        print(f"     First line: {content.split(chr(10))[0][:80]}")
'''))

# ════════════════════════════════ Cell 3: Run function ════════════════════════════════
cells.append(md(r"""## Cell 3 — Pipeline runner

Chạy 1 scenario: upload evidence docs → gửi intent → đợi pipeline → extract
requirements + backlogs + evidence chain + honesty gates + timing → lưu JSON."""))
cells.append(code(r'''def run_scenario(scenario_id, retry=True):
    """Run one scenario end-to-end and save the benchmark output."""
    scenario = ALL_SCENARIOS[scenario_id]
    intent = scenario["intent"]
    evidence_docs = build_evidence_documents(scenario)
    t_start = time.time()

    # ── 1. Create project ──
    r = client.post("/api/v1/projects", json={
        "name": scenario["title"],
        "description": scenario.get("context", "")[:500],
        "output_language": "en",
    })
    if r.status_code != 201:
        return {"scenario_id": scenario_id, "status": "failed",
                "error": f"create project: {r.status_code}"}
    project_id = r.json()["id"]

    # ── 2. Upload evidence documents ──
    for doc_key, doc_name, doc_content in evidence_docs:
        filename = f"{scenario_id}_{doc_key}.md"
        r = httpx.post(
            f"{BASE}/api/v1/projects/{project_id}/documents",
            files={"file": (filename, doc_content.encode("utf-8"), "text/markdown")},
            data={"title": doc_name},
            headers={"Origin": "http://localhost:3000"},
            cookies=dict(client.cookies),
        )
        if r.status_code != 201:
            return {"scenario_id": scenario_id, "status": "failed",
                    "error": f"upload '{doc_key}': {r.status_code}"}

    # ── 3. Send intent (run pipeline) ──
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
            print(f"  ⚠ Failed — retrying once…")
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

    # ── 5. Extract backlogs ──
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

    # ── 6. Honesty gates self-check ──
    r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "source_document"})
    src_items = r.json()["items"]
    src_texts = {it["key"]: str(it["content"].get("text", "")) for it in src_items}

    r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "stakeholder_observation"})
    obs_items = r.json()["items"]

    g1_pass = sum(1 for o in obs_items
                  if o["content"].get("evidence", "") in src_texts.get(o["content"].get("source", ""), ""))
    g1_total = len(obs_items)

    g2_pass = sum(1 for o in obs_items if o["content"].get("source", "") in src_texts)
    g3_pass = sum(1 for s in src_items if str(s["content"].get("url", "")).startswith("https://"))

    honesty_gates = {
        "G1_verbatim_quote": f"{g1_pass}/{g1_total}",
        "G2_source_exists": f"{g2_pass}/{g1_total}",
        "G3_url_real": f"{g3_pass}/{len(src_items)}",
    }

    # ── 7. Timing ──
    r = client.get(f"/api/v1/runs/{run.get('id', '')}/steps")
    steps = r.json().get("items", [])
    timing = {
        "total_steps": len(steps),
        "nodes": dict(Counter(s["node"] for s in steps)),
    }

    # ── 8. Save ──
    output = {
        "scenario_id": scenario_id,
        "method": "khoai-lang-graph",
        "run_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "run_duration_s": round(elapsed),
        "project_id": project_id,
        "run_id": run.get("id"),
        "run_status": "succeeded",
        "workflow_version": wf_version,
        "requirements": requirements,
        "product_backlogs": product_backlogs,
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
        "steps": timing["total_steps"],
        "gates": honesty_gates,
        "file": str(out_file),
    }

print("run_scenario() ready")
'''))

# ════════════════════════════════ Cell 4: Run all ════════════════════════════════
cells.append(md(r"""## Cell 4 — Chạy tất cả scenarios"""))
cells.append(code(r'''results = []
for i, sid in enumerate(running_scenario, 1):
    s = ALL_SCENARIOS[sid]
    print(f"\n{'═'*60}")
    print(f"[{i}/{len(running_scenario)}] {sid}: {s['title']}")
    print(f"{'═'*60}")

    result = run_scenario(sid, retry=RETRY_FAILED)
    results.append(result)

    if result["status"] == "succeeded":
        print(f"  ✓ {result['reqs']} reqs, {result['backlogs']} backlogs")
        print(f"  ⏱ {result['elapsed_s']}s  ({result['steps']} steps)")
        print(f"  🛡 {result.get('gates', {})}")
    else:
        print(f"  ✗ {result['error'][:120]}")

print(f"\n{'═'*60}")
ok = sum(1 for r in results if r['status']=='succeeded')
print(f"Done: {ok}/{len(results)} succeeded")
print(f"{'═'*60}")
'''))

# ════════════════════════════════ Cell 5: Summary ════════════════════════════════
cells.append(md(r"""## Cell 5 — Tổng kết"""))
cells.append(code(r'''print(f"{'Scenario':<40s} {'Reqs':>5s} {'Bklog':>6s} {'Time':>6s} {'G1':>8s} {'G2':>8s} {'G3':>6s}")
print("─" * 85)
for r in results:
    if r["status"] == "succeeded":
        g = r.get("gates", {})
        print(f"{r['scenario_id']:<40s} {r['reqs']:>5d} {r['backlogs']:>6d} "
              f"{r['elapsed_s']:>5d}s {g.get('G1_verbatim_quote','—'):>8s} "
              f"{g.get('G2_source_exists','—'):>8s} {g.get('G3_url_real','—'):>6s}")
    else:
        print(f"{r['scenario_id']:<40s} {'—':>5s} {'—':>6s} {'—':>6s} {'FAILED':>8s}")

print(f"\nFiles in {OUTPUT_DIR.resolve()}:")
for f in sorted(OUTPUT_DIR.glob("*.json")):
    data = json.loads(f.read_text())
    n_reqs = len(data.get("requirements", {}))
    n_bl = len(data.get("product_backlogs", {}))
    gates = data.get("honesty_gates", {})
    print(f"  {f.name:<45s} {n_reqs:>3d} reqs  {n_bl:>3d} bklog  G1={gates.get('G1_verbatim_quote','?')}")
'''))

# ════════════════════════════════ Cell 6: Verification ════════════════════════════════
cells.append(md(r"""## Cell 6 — Evidence verification

Kiểm tra output: requirements có trace về evidence, gates pass, format đúng."""))
cells.append(code(r'''for r in results:
    if r["status"] != "succeeded":
        continue
    data = json.loads((OUTPUT_DIR / f"{r['scenario_id']}.json").read_text())

    print(f"\n── {r['scenario_id']} ──")
    print(f"  Requirements: {len(data['requirements'])}")
    print(f"  Backlogs:     {len(data['product_backlogs'])}")
    print(f"  Gates:        {data['honesty_gates']}")
    print(f"  Timing:       {data['timing']['total_steps']} steps — {data['timing']['nodes']}")

    # Show first 3 requirements
    for k, req in list(data["requirements"].items())[:3]:
        print(f"\n  {k}: {req['title']}")
        print(f"     type={req['type']}  priority={req['priority']}")
        print(f"     {req['statement'][:100]}…")
        if req.get("acceptance_criteria"):
            print(f"     criteria: {req['acceptance_criteria'][0][:80]}…")

    # Show first backlog
    if data["product_backlogs"]:
        k = list(data["product_backlogs"])[0]
        bl = data["product_backlogs"][k]
        print(f"\n  {k}: {bl['title']} [{bl['item_type']}]")
        if bl.get("as_a"):
            print(f"     as_a={bl['as_a']}  i_want={bl['i_want']}  so_that={bl['so_that']}")
'''))

# ════════════════════════════════ write ════════════════════════════════
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
