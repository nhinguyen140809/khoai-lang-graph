#!/usr/bin/env python3
"""Build notebooks/demo_thesis.ipynb — API-based demo notebook chuẩn publication.

Mỗi endpoint được in HAI LỚP:
  1. Raw JSON nguyên vẹn (show)   — đúng shape Frontend nhận và parse.
  2. Bảng / thẻ format (fmt_*)    — hàm hỗ trợ diễn giải từng trường.
Chạy lại:  python3 notebooks/build_notebook.py
"""
import json
from pathlib import Path

cells = []


def md(text):
    return {"cell_type": "markdown", "metadata": {}, "source": [text]}


def code(text):
    return {"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [], "source": [text]}


# ════════════════════════════════ Title ════════════════════════════════
cells.append(md(r"""# KHOAI LANG-GRAPH — Demo Pipeline cho Luận Văn

Notebook chạy **toàn bộ pipeline elicitation qua HTTP API thật** của backend —
không import graph, không in-memory sink, không fixture. Mọi thứ đều **thật**:
LLM qua gateway (`config/models.yaml`), search thật (DuckDuckGo → Wikipedia),
tài liệu do bạn upload.

Mỗi endpoint được in **hai lớp**:
1. **Raw JSON nguyên vẹn** — đúng shape mà Frontend nhận và parse (`show()`).
2. **Bảng / thẻ format** — hàm hỗ trợ (`table()`, `box()`, `fmt_*`) diễn giải
   từng trường để đọc hiểu được, thay vì một khối JSON khó nuốt.

**Yêu cầu môi trường:**
```bash
# Terminal 1 — backend (backend/.env cần OPENAI_BASE_URL + OPENAI_API_KEY)
cd khoai-lang-graph/backend
uv run uvicorn khoailanggraph.main:app --port 8001

# Terminal 2 — notebook (kernel "Khoai Backend (Python 3.12)")
uv run jupyter lab ../notebooks/demo_thesis.ipynb
```

**Lưu ý thời gian:** Cell 4 gửi ý tưởng và **chờ workflow chạy xong bằng LLM thật
trên gateway — 15–45 phút** (đây là điểm chuẩn publication: pipeline thật, không
còn chế độ demo). Các cell còn lại chỉ đọc dữ liệu nên chạy nhanh.

**Mục lục**
| Cell | Nội dung | Endpoint |
|---|---|---|
| 1 | Kết nối + đăng nhập | POST /auth/register, /auth/login |
| 2 | Bộ helper hiển thị (format đẹp) | — |
| 3 | Tạo project + upload tài liệu | POST /projects, /documents |
| 4 | Gửi ý tưởng → chạy run thật | POST /threads, /messages |
| 5 | Các bước chạy (steps) | GET /runs/{id}/steps |
| 6 | 8 loại artifact | GET /artifacts |
| 7 | Tài liệu nguồn (SRC) | GET /items?kind=source_document |
| 8 | Quan sát (OBS) | GET /items?kind=stakeholder_observation |
| 9 | Nhân vật (PER) — trái tim MAJ-EVAL | GET /items?kind=persona |
| 10 | Phỏng vấn stakeholder | GET /items?kind=interview_message |
| 11 | Phân tích yêu cầu (AR) | GET /items?kind=analyzed_requirement |
| 12 | Đặc tả (REQ) + Backlog (US) | GET /items?kind=spec_requirement, backlog_item |
| 13 | Chuỗi bằng chứng (trace links) | GET /trace-links |
| 14 | Truy vết 1 nhân vật 2 chiều | GET /items/{id}/trace |
| 15 | 5 Honesty Gates — kiểm trực tiếp | (tổng hợp) |
| 16 | Tổng kết | (tổng hợp) |
"""))

# ══════════════════════════ Cell 1: connect + login ══════════════════════════
cells.append(md(r"""## Cell 1 — Kết nối + Đăng nhập

**Endpoint:** `POST /api/v1/auth/register` + `POST /api/v1/auth/login`

Đăng ký tài khoản mới (email unique theo thời gian chạy — chạy notebook bao
nhiêu lần cũng được) rồi đăng nhập. Server trả cookie
`khoailanggraph_session`; mọi request sau phải kèm cookie này **và** header
`Origin` — quy tắc CSRF của API (docs/API.md §3).

`timeout=3600` vì Cell 4 sẽ chờ run thật kéo dài 15–45 phút trong một request.
"""))
cells.append(code(r'''import httpx, json, time

BASE = "http://localhost:8001"
HEADERS = {"Origin": "http://localhost:3000", "Content-Type": "application/json"}
client = httpx.Client(base_url=BASE, headers=HEADERS, timeout=3600.0, trust_env=False)
# trust_env=False: localhost không bao giờ đi qua proxy (httpx honoured
# http_proxy/HTTP_PROXY của shell — nguyên nhân Cell 1 treo khi bật VPN/proxy)

EMAIL = f"demo.{int(time.time())}@thesis.vn"

r = client.post("/api/v1/auth/register", json={
    "email": EMAIL, "password": "secret", "display_name": "Demo Thesis",
})
print(f"Register: {r.status_code}  ({EMAIL})")

r = client.post("/api/v1/auth/login", json={"email": EMAIL, "password": "secret"})
print(f"Login: {r.status_code}  → cookie: {list(client.cookies.keys())}")

assert list(client.cookies.keys()), "Chưa có cookie session — backend có đang chạy ở :8001?"
print("Sẵn sàng.")
'''))

# ══════════════════════════ Cell 2: helper formatters ══════════════════════════
cells.append(md(r"""## Cell 2 — Bộ helper hiển thị (format cho người đọc)

**Không phải endpoint** — đây là các hàm hỗ trợ format dùng cho toàn notebook:

| Hàm | Công dụng |
|---|---|
| `show(label, response)` | In **raw JSON nguyên vẹn** — đúng shape FE nhận và parse |
| `table(headers, rows, caps)` | Bảng ASCII, ô dài tự xuống dòng |
| `box(title, lines)` | Thẻ ASCII cho một object (persona, nguồn, user story…) |
| `fmt_steps / fmt_artifacts / fmt_sources / fmt_observations / fmt_personas / fmt_interview / fmt_analyzed / fmt_specs / fmt_backlog / fmt_links / fmt_trace` | Format riêng cho từng loại item của pipeline |

Chạy cell này một lần; cuối cell có demo mini để thấy style in ra.
"""))
cells.append(code(r'''import textwrap

def _w(text, width):
    """Ngắt dòng tại `width`, luôn trả về ít nhất 1 dòng."""
    return textwrap.wrap(str(text), width=width) or [""]

def show(label, response):
    """Lớp 1 — raw JSON nguyên vẹn, đúng shape FE nhận và parse."""
    print(f"━━━ {label} ━━━  (raw JSON)")
    print(json.dumps(response.json(), ensure_ascii=False, indent=2))
    print()

def table(headers, rows, caps=None):
    """Lớp 2 — bảng ASCII; `caps` giới hạn độ rộng từng cột, ô dài tự xuống dòng."""
    caps = list(caps or [34] * len(headers))
    grid = [[_w(c, caps[i]) for i, c in enumerate(row)] for row in rows]
    widths = []
    for i in range(len(headers)):
        w = len(headers[i])
        for g in grid:
            for line in g[i]:
                w = max(w, len(line))
        widths.append(w)
    def bar(l, m, r):
        return l + m.join("─" * (w + 2) for w in widths) + r
    def line(cells_):
        h = max(len(c) for c in cells_)
        out = []
        for j in range(h):
            out.append("│" + "│".join(
                " " + (c[j] if j < len(c) else "").ljust(w) + " "
                for c, w in zip(cells_, widths)) + "│")
        return "\n".join(out)
    print(bar("┌", "┬", "┐"))
    print(line([[h] for h in headers]))
    print(bar("├", "┼", "┤"))
    for g in grid:
        print(line(g))
    print(bar("└", "┴", "┘"))

def box(title, lines, width=96):
    """Lớp 2 — thẻ ASCII cho một object: tiêu đề + thân tự ngắt dòng."""
    inner = width - 4
    body = []
    for x in lines:
        body.extend(_w(x, inner))
    print("╔═" + "═" * inner + "═╗")
    print("║ " + title[:inner].ljust(inner) + " ║")
    print("╟─" + "─" * inner + "─╢")
    for x in body:
        print("║ " + x.ljust(inner) + " ║")
    print("╚" + "═" * (inner + 2) + "╝")

# ── fmt_* — format riêng cho từng loại item của pipeline ──────────────

def fmt_steps(items):
    """GET /runs/{id}/steps — từng node đã chạy, theo thứ tự."""
    rows = [[s.get("sequence", ""), s.get("node", ""), s.get("stage", ""), s.get("status", "")]
            for s in items]
    table(["#", "Node", "Stage", "Status"], rows, caps=[4, 22, 18, 12])

def fmt_artifacts(items):
    """GET /artifacts — 8 loại artifact workflow đã viết ra DB."""
    rows = [[a.get("kind", ""), a.get("title", ""), a.get("version", ""),
             a.get("item_count", "")] for a in items]
    table(["Kind (loại artifact)", "Title", "Ver", "Items"], rows, caps=[30, 42, 5, 7])

def fmt_sources(items):
    """GET /items?kind=source_document — thẻ cho từng tài liệu nguồn."""
    for it in items:
        c = it.get("content", {})
        text = str(c.get("text", ""))
        badge = "UPLOAD — tài liệu bạn gửi, được mining TRƯỚC" if c.get("origin") == "upload" \
            else "WEB — kết quả search thật (DDG/Wikipedia)"
        box(f'{it.get("key","")} — {c.get("title","")}', [
            f'origin    : {c.get("origin","")}  ({badge})',
            f'url       : {c.get("url","")}',
            f'publisher : {c.get("publisher","")}   year: {c.get("year","")}',
            f'relevance : {c.get("relevance_reason","")}',
            f'text ({len(text)} ký tự, máy chủ đã extract):  {text[:300]}'
              + ("…" if len(text) > 300 else ""),
        ])
    print()

def fmt_observations(items):
    """GET /items?kind=stakeholder_observation — bằng chứng mining từ SRC."""
    rows = []
    for it in items:
        c = it.get("content", {})
        rows.append([it.get("key", ""), c.get("stakeholder_name", ""),
                     c.get("dimension", ""), c.get("evidence", ""), c.get("source", "")])
    table(["Key", "Stakeholder", "Dimension (chiều đánh giá)", "Evidence (trích NGUYÊN VĂN)", "Nguồn"],
          rows, caps=[8, 14, 20, 46, 9])

def fmt_personas(items):
    """GET /items?kind=persona — thẻ nhân vật đầy đủ các trường MAJ-EVAL."""
    for it in items:
        c = it.get("content", {})
        lines = [
            f'stakeholder_type   : {c.get("stakeholder_type","")}',
            f'evaluative_dimension: {c.get("evaluative_dimension","")}',
            "",
            f'background          : {c.get("background","")}',
            f'expertise           : {c.get("expertise","")}',
            f'behavioral_tendencies: {c.get("behavioral_tendencies","")}',
            "",
            f'goals      : {"; ".join(c.get("goals", []))}',
            f'interests  : {"; ".join(c.get("interests", []))}',
            f'priorities : {"; ".join(c.get("priorities", []))}',
            f'constraints : {"; ".join(c.get("constraints", []))}',
            f'concerns   : {"; ".join(c.get("concerns", []))}',
            "",
            f'grounded_in (OBS)   : {", ".join(c.get("grounded_in", []))}',
            "evidence (truy về đúng câu trong tài liệu gốc):",
        ]
        for ev in c.get("evidence", []):
            lines.append(f'  • {ev.get("observation","")} ← {ev.get("source","")}: "{ev.get("quote","")}"')
        lines.append(f'interview_status    : {c.get("interview_status","")}')
        box(f'{it.get("key","")} — {c.get("name","")}', lines)
    print()

def fmt_interview(items):
    """GET /items?kind=interview_message — hội thoại theo từng cuộc phỏng vấn."""
    groups = {}
    for it in items:
        k = str(it.get("key", "")).split("#")[0]
        groups.setdefault(k, []).append(it)
    for k in sorted(groups):
        print(f"\n──── Cuộc phỏng vấn {k} ────")
        for it in sorted(groups[k], key=lambda m: m.get("content", {}).get("turn", 0)):
            c = it.get("content", {})
            who = "INTERVIEWER" if c.get("role") == "interviewer" else "PERSONA    "
            print(f'  [{c.get("turn","")}] {who}: {c.get("content","")}')
    print()

def fmt_analyzed(items):
    """GET /items?kind=analyzed_requirement — yêu cầu đã phân tích."""
    rows = []
    for it in items:
        c = it.get("content", {})
        rows.append([it.get("key", ""), c.get("statement", ""), c.get("type", ""),
                     c.get("priority", ""), c.get("rationale", "")])
    table(["Key", "Statement", "Type", "Priority", "Rationale"], rows,
          caps=[8, 42, 14, 10, 34])

def fmt_specs(items):
    """GET /items?kind=spec_requirement — đặc tả yêu cầu."""
    rows = []
    for it in items:
        c = it.get("content", {})
        rows.append([it.get("key", ""), it.get("review_status", ""), c.get("title", ""),
                     c.get("type", ""), c.get("priority", ""), c.get("verification_method", "")])
    table(["Key", "Review", "Title", "Type", "Priority", "Verify"], rows,
          caps=[8, 11, 36, 14, 10, 13])

def fmt_backlog(items):
    """GET /items?kind=backlog_item — epic + user story (Given/When/Then)."""
    for it in items:
        c = it.get("content", {})
        if c.get("item_type") == "user_story":
            lines = [
                f'as_a    : {c.get("as_a","")}',
                f'i_want  : {c.get("i_want","")}',
                f'so_that : {c.get("so_that","")}',
                "",
                "acceptance_criteria (Given/When/Then):",
            ]
            for ac in c.get("acceptance_criteria", []):
                lines.append(f'  • GIVEN {ac.get("given","")}')
                lines.append(f'    WHEN  {ac.get("when","")}')
                lines.append(f'    THEN  {ac.get("then","")}')
        else:
            lines = [f'item_type: {c.get("item_type","")}']
        lines += ["", f'priority: {c.get("priority","")}    story_points: {c.get("story_points","")}'
                     f'    delivery_status: {c.get("delivery_status","")}']
        box(f'{it.get("key","")} — {c.get("title","")}  [{c.get("item_type","")}]', lines)
    print()

def fmt_links(items):
    """GET /trace-links — toàn bộ link truy vết của project."""
    rows = []
    for l in items:
        s, t = l.get("source", {}), l.get("target", {})
        rows.append([l.get("link_type", ""), str(s.get("key", s.get("id", ""))),
                     str(t.get("key", t.get("id", ""))), (l.get("quote") or "")])
    table(["Link type", "Từ", "Đến", "Quote"], rows, caps=[15, 9, 9, 48])

def fmt_trace(data):
    """GET /items/{id}/trace — chuỗi truy vết 2 chiều của 1 item."""
    nodes = data.get("nodes", [])
    links = data.get("links", [])
    print(f"{len(nodes)} node, {len(links)} link trong chuỗi truy vết\n")
    kinds = {}
    for n in nodes:
        kinds.setdefault(n.get("kind", "?"), []).append(str(n.get("key", "")))
    print("── Các node trong chuỗi (theo loại) ──")
    for k in kinds:
        print(f"  {k:26s}: {', '.join(kinds[k])}")
    rows = []
    for l in links:
        s, t = l.get("source", {}), l.get("target", {})
        rows.append([l.get("link_type", ""), str(s.get("key", s.get("id", ""))),
                     str(t.get("key", t.get("id", "")))])
    if rows:
        print("\n── Các link ──")
        table(["Link", "Từ", "Đến"], rows, caps=[16, 10, 10])

# ── Demo mini: style in ra của table() và box() ──
print("DEMO — bảng:")
table(["Cột A", "Cột B dài tự xuống dòng khi vượt cap"],
      [["1", "giá trị rất dài là một câu chứng cứ evidence nguyên văn từ tài liệu nguồn"],
       ["2", "giá trị ngắn"]], caps=[6, 40])
print("\nDEMO — thẻ:")
box("PER-001 — Demo Persona", [
    "stakeholder_type   : Student",
    'evidence: OBS-001 ← SRC-001: "70% câu hỏi mentoring lặp lại hằng tuần."',
])
'''))

# ══════════════════════════ Cell 3: project + upload ══════════════════════════
cells.append(md(r"""## Cell 3 — Tạo Project + Upload tài liệu

**Endpoint:** `POST /api/v1/projects` + `POST /api/v1/projects/{id}/documents` (multipart)

1. **Project** — không gian làm việc; `output_language: "vi"` ngôn ngữ kết quả.
2. **Upload** — gửi file `.md` (hỗ trợ `.md .txt .html .json`, ≤ 10MB). Server
   extract text (strip HTML, cap 20.000 ký tự) rồi đưa vào **research corpus**
   với `origin: "upload"` — tài liệu của bạn **đứng trước** kết quả web search,
   mining quote nguyên văn từ chính file này.

*Upload dùng `httpx.post` trực tiếp (không qua `client`) vì multipart cần để
httpx tự đặt `Content-Type` + boundary — header JSON cài sẵn sẽ phá multipart.*
"""))
cells.append(code(r'''r = client.post("/api/v1/projects", json={
    "name": "Demo Thesis", "description": None, "output_language": "vi",
})
show("POST /api/v1/projects", r)
project_id = r.json()["id"]

UPLOAD = """# Ghi nho co van — Truong DH Bach Khoa

## Phu huynh bao cao
70% cau hoi mentoring lap lai hang tuan. Muon danh sach FAQ tim duoc.

## Sinh vien can
- Tim co van theo nganh nghe va gio ranh
- Book lich nhanh trong vai cu bam

## Co van muon
- Loc yeu cau truoc khi nhan
- Lich ro rang, khong trung
"""
print("── Nội dung file upload (mentoring-notes.md) ──")
print(UPLOAD)

r = httpx.post(
    trust_env=False,
    url=f"{BASE}/api/v1/projects/{project_id}/documents",
    files={"file": ("mentoring-notes.md", UPLOAD.encode("utf-8"), "text/markdown")},
    data={"title": "Ghi nho co van DH Bach Khoa"},
    headers={"Origin": "http://localhost:3000"},
    cookies=dict(client.cookies),
)
show("POST /documents (upload)", r)

doc = r.json()
box("TÀI LIỆU ĐÃ UPLOAD", [
    f'id       : {doc.get("id","")}',
    f'title    : {doc.get("title","")}',
    f'filename : {doc.get("filename","")}   format: {doc.get("format","")}',
    f'versions : {len(doc.get("versions", []))} — version hiện tại: v{doc.get("latest_version","")}',
    f'text servers extract ({len(doc.get("text",""))} ký tự):  {doc.get("text","")[:200]}…',
])
print("→ FE render: Sources tab — document card với badge origin + text đã extract")
'''))

# ══════════════════════════ Cell 4: thread + start run ══════════════════════════
cells.append(md(r"""## Cell 4 — Gửi ý tưởng → chạy run THẬT (15–45 phút)

**Endpoint:** `POST /api/v1/projects/{id}/threads` + `POST /api/v1/threads/{id}/messages`

Workflow v3 = **17 node / 27 cạnh** chạy bằng LLM thật trên gateway:
`intent_router → planner → corpus_builder → stakeholder_miner → persona_generator
→ checkpoint_personas → interviewer ⇄ persona_agent → analyst → checkpoint_analysis
→ requirement_engineer → checkpoint_spec → backlog_manager → validator`.

Executor chạy **synchronous**: response chỉ về khi workflow **chạy xong** (hoặc
gặp lỗi rõ ràng). `review_checkpoints` mặc định rỗng → checkpoint auto-approve.
Search corpus là search thật (DuckDuckGo → Wikipedia fallback, keyless).

⏳ **Chờ 15–45 phút.** Nếu gateway bận (504) run sẽ fail rõ ràng — chạy lại cell
này để tạo run mới, dữ liệu cũ vẫn được đọc ở các cell sau.
"""))
cells.append(code(r'''r = client.post(f"/api/v1/projects/{project_id}/threads", json={"title": None})
thread_id = r.json()["id"]
print(f"Thread: {thread_id}")

print("⏳ Run thật trên gateway — chờ 15-45 phút (response về khi workflow xong)…")
print(f"   bắt đầu: {time.strftime('%H:%M:%S')}")
r = client.post(f"/api/v1/threads/{thread_id}/messages", json={
    "content": "Tai xay nen tang giup sinh vien dai hoc tim co van nghe nghiep.",
    "run_config": {
        "review_checkpoints": [],
        "output_language": "vi",
        "parameters": {"target_sources_num": 3, "target_personas_num": 3,
                       "max_turns": 6, "max_iterations": 2},
    },
})
print(f"   kết thúc: {time.strftime('%H:%M:%S')}  ({r.status_code})")

show("POST /messages (start run)", r)
run = r.json()["run"]
run_id = run["id"]

box("RUN", [
    f'id               : {run_id}',
    f'status           : {run.get("status","")}',
    f'current_stage    : {run.get("current_stage","")}',
    f'workflow_version : v{run.get("workflow_version","")}',
    f'step_count       : {run.get("step_count","")}',
    f'cost_usd         : {run.get("usage",{}).get("cost_usd","")}',
    f'error            : {(run.get("error") or {}).get("message", "—")}',
])
if run.get("status") != "succeeded":
    print("⚠ Run chưa succeeded (gateway có thể bận — 504).")
    print("  Chạy lại CELL NÀY để tạo run mới; các cell sau vẫn đọc được dữ liệu đã có.")
print("→ FE render: chat panel với run log từng bước + thanh trạng thái")
'''))

# ══════════════════════════ Cell 5: steps ══════════════════════════
cells.append(md(r"""## Cell 5 — Các bước chạy của run

**Endpoint:** `GET /api/v1/runs/{run_id}/steps`

Từng node đã chạy theo thứ tự: `planner` lập kế hoạch research → `corpus_builder`
thu thập tài liệu → `stakeholder_miner` mining quan sát → `persona_generator`
dựng nhân vật → phỏng vấn → `analyst` phân tích → `requirement_engineer` viết
đặc tả → `backlog_manager` dựng backlog → `validator` kiểm tra chất lượng.
`status` từng bước + `stage` cho biết run đi tới đâu.
"""))
cells.append(code(r'''r = client.get(f"/api/v1/runs/{run_id}/steps")
show("GET /runs/{id}/steps", r)
fmt_steps(r.json()["items"])
print(f"→ {len(r.json()['items'])} bước — FE render: workflow graph highlight từng node khi chạy")
'''))

# ══════════════════════════ Cell 6: artifacts ══════════════════════════
cells.append(md(r"""## Cell 6 — 8 loại Artifact

**Endpoint:** `GET /api/v1/projects/{project_id}/artifacts`

Mỗi giai đoạn workflow viết ra một artifact (bản ghi kết quả, có version):

| Kind | Node tạo ra | Nội dung |
|---|---|---|
| `elicitation_plan` | planner | mục tiêu, topics, stakeholder types cần research |
| `research_corpus` | corpus_builder | tập tài liệu nguồn đã chọn lọc |
| `persona_catalog` | persona_generator | danh sách nhân vật theo nhóm |
| `interview_transcript` | interviewer | hội thoại phỏng vấn từng nhân vật |
| `requirements_analysis` | analyst | yêu cầu thô đã phân tích |
| `requirement_specification` | requirement_engineer | đặc tả yêu cầu |
| `product_backlog` | backlog_manager | epic + user story |
| `validation_report` | validator | kết quả kiểm tra chất lượng |
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/artifacts")
show("GET /artifacts", r)
fmt_artifacts(r.json()["items"])
print("→ FE render: cây thư mục tab Artifacts, bấm vào xem items của từng artifact")
'''))

# ══════════════════════════ Cell 7: SRC ══════════════════════════
cells.append(md(r"""## Cell 7 — Tài liệu nguồn (SRC)

**Endpoint:** `GET /api/v1/projects/{id}/items?kind=source_document`

Các trường quan trọng:
- `origin` — `upload` (file bạn gửi, mining trước) hoặc `web` (search thật).
- `url` — `upload://…` hoặc `https://…` **thật, mở được trong trình duyệt**.
- `text` — văn bản server đã extract; mọi evidence sau này phải là **substring
  nguyên văn** của text này (Honesty Gate G1).
- `relevance_reason` — corpus_builder giải thích tại sao chọn tài liệu này.
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "source_document"})
show("GET /items?kind=source_document", r)
fmt_sources(r.json()["items"])
print("→ FE render: document card với origin badge (UPLOAD/WEB) + link mở url thật")
'''))

# ══════════════════════════ Cell 8: OBS ══════════════════════════
cells.append(md(r"""## Cell 8 — Quan sát stakeholder (OBS)

**Endpoint:** `GET /api/v1/projects/{id}/items?kind=stakeholder_observation`

Lõi phương pháp **MAJ-EVAL** (arXiv:2507.21028): mỗi quan sát là một **evidence
quote nguyên văn** mined từ một tài liệu nguồn, gắn với một chiều đánh giá:

- `stakeholder_name` — ai nói (sinh viên, cố vấn, quản trị…)
- `dimension` — chiều đánh giá (privacy, booking speed, verification…)
- `evidence` — câu trích **nguyên văn** từ `text` của SRC (Gate G1)
- `source` — key của SRC (SRC-001…) (Gate G2)

Personas sau này chỉ được dựng từ các OBS này — không được bịa thêm.
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "stakeholder_observation"})
show("GET /items?kind=stakeholder_observation", r)
fmt_observations(r.json()["items"])
print("→ FE render: evidence card — quote nổi bật + chuỗi OBS ← SRC xem được")
'''))

# ══════════════════════════ Cell 9: personas ══════════════════════════
cells.append(md(r"""## Cell 9 — Personas (PER) — trái tim MAJ-EVAL

**Endpoint:** `GET /api/v1/projects/{id}/items?kind=persona`

Mỗi nhân vật **grounded trong OBS** — mọi đặc điểm đều truy về được bằng chứng:

| Trường | Ý nghĩa |
|---|---|
| `name` / `stakeholder_type` | tên + loại stakeholder (Student, Mentor, Administrator) |
| `evaluative_dimension` | chiều đánh giá chính của nhân vật này |
| `background` / `expertise` / `behavioral_tendencies` | bối cảnh, chuyên môn, khuynh hành vi |
| `goals` / `interests` / `priorities` / `constraints` / `concerns` | mục tiêu, hứng thú, ưu tiên, ràng buộc, lo ngại |
| `grounded_in` | các OBS (PER-xxx ← OBS-xxx) mà nhân vật dựa trên |
| `evidence[{observation, source, quote}]` | quote **đúng byte** với OBS — Gate G4 |
| `interview_status` | trạng thái phỏng vấn (not_started / in_progress / completed) |

Đây là **đúng shape** FE render persona card.
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "persona"})
show("GET /items?kind=persona", r)
fmt_personas(r.json()["items"])
print("→ FE render: persona card với evidence chips truy về OBS → SRC")
'''))

# ══════════════════════════ Cell 10: interview ══════════════════════════
cells.append(md(r"""## Cell 10 — Phỏng vấn stakeholder

**Endpoint:** `GET /api/v1/projects/{id}/items?kind=interview_message`

Hội thoại giữa `interviewer` (agent đặt câu hỏi) và `persona` (agent đóng vai
nhân vật, **trả lời theo đúng evidence đã mine** — không được bịa):
- `turn` — thứ tự lượt trong một cuộc phỏng vấn
- `role` — `interviewer` hoặc `persona`
- `content` — câu hỏi / câu trả lời
- `topic` — chủ đề lượt hỏi; `iteration` — vòng lặp refine
- key dạng `PER-001#3` — nhân vật PER-001, lượt thứ 3
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "interview_message"})
show("GET /items?kind=interview_message", r)
fmt_interview(r.json()["items"])
print("→ FE render: transcript panel Q/A theo từng persona")
'''))

# ══════════════════════════ Cell 11: analyzed requirements ══════════════════════════
cells.append(md(r"""## Cell 11 — Yêu cầu đã phân tích (AR)

**Endpoint:** `GET /api/v1/projects/{id}/items?kind=analyzed_requirement`

Analyst tổng hợp các câu nói (raw_requirement — liên kết `stated_by` với PER)
thành yêu cầu có cấu trúc:
- `statement` — phát biểu yêu cầu
- `type` — `functional` / `non_functional` / `constraint`
- `priority` — mức ưu tiên
- `rationale` — lý do, gắn với quan sát của ai
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "analyzed_requirement"})
show("GET /items?kind=analyzed_requirement", r)
fmt_analyzed(r.json()["items"])
print("→ FE render: requirements table với type/priority badge")
'''))

# ══════════════════════════ Cell 12: specs + backlog ══════════════════════════
cells.append(md(r"""## Cell 12 — Đặc tả yêu cầu (REQ) + Backlog (US)

**Endpoint:** `GET /items?kind=spec_requirement` + `GET /items?kind=backlog_item`

**spec_requirement** — đặc tả đầy đủ: `title`, `statement`, `type`,
`priority`, `rationale`, `acceptance_criteria` (danh sách), `fit_criterion`,
`verification_method` (test / inspection / demonstration / analysis).
Version cũ sau rework được đánh `review_status: "superseded"`.

**backlog_item** — epic + user story: `as_a / i_want / so_that`,
`acceptance_criteria` dạng **Given / When / Then**, `priority`,
`story_points`, `delivery_status`.
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "spec_requirement"})
show("GET /items?kind=spec_requirement", r)
fmt_specs(r.json()["items"])

r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "backlog_item"})
show("GET /items?kind=backlog_item", r)
fmt_backlog(r.json()["items"])
print("→ FE render: spec table + backlog kanban; criteria GWT render thành checklist")
'''))

# ══════════════════════════ Cell 13: trace links ══════════════════════════
cells.append(md(r"""## Cell 13 — Chuỗi bằng chứng (Trace Links)

**Endpoint:** `GET /api/v1/projects/{id}/trace-links`

Toàn bộ link truy vết của project — **US → REQ → AR → RAW → PER → OBS → SRC**,
từ user story truy ngược về đúng câu nói nguyên văn trong tài liệu gốc:

| link_type | Ý nghĩa |
|---|---|
| `grounded_in` | PER ← OBS (nhân vật dựa trên quan sát nào) |
| `evidenced_by` | OBS ← SRC (quan sát trích từ tài liệu nào) |
| `stated_by` | RAW ← PER (câu nói của nhân vật nào) |
| `involves` | AR ↔ PER (yêu cầu liên quan nhân vật nào) |
| `derived_from` | REQ ← AR / AR ← RAW (phái sinh từ phân tích nào) |
| `supersedes` | REQ ← REQ (rework thay thế yêu cầu cũ) |
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/trace-links")
show("GET /trace-links", r)
fmt_links(r.json()["items"])
print("→ FE render: traceability matrix + evidence chain graph")
'''))

# ══════════════════════════ Cell 14: trace one persona ══════════════════════════
cells.append(md(r"""## Cell 14 — Truy vết 1 nhân vật (2 chiều)

**Endpoint:** `GET /api/v1/items/{persona_id}/trace?direction=both`

Lấy persona đầu tiên (PER-001) rồi truy vết **hai chiều**:
- **Ngược dòng (upstream):** PER → OBS → SRC — về đúng câu nói trong tài liệu.
- **Xuôi dòng (downstream):** PER → RAW → AR → REQ → US — câu nói đó trở thành
  user story nào trong backlog.
"""))
cells.append(code(r'''r = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": "persona"})
per_items_ = r.json()["items"]
if not per_items_:
    print("Chưa có persona (run chưa tới giai đoạn này) — chạy lại Cell 4 rồi quay lại.")
else:
    persona = per_items_[0]
    persona_key = persona["key"]
    print(f"Truy vết: {persona_key}\n")

    r = client.get(f"/api/v1/items/{persona['id']}/trace", params={"direction": "both"})
    show(f"GET /items/{persona_key}/trace?direction=both", r)
    fmt_trace(r.json())
    print("→ FE render: trace panel — cây truy vết 2 chiều từ card persona")
'''))

# ══════════════════════════ Cell 15: honesty gates ══════════════════════════
cells.append(md(r"""## Cell 15 — 5 Honesty Gates: kiểm tra TRỰC TIẾP trên dữ liệu run

Backend **thực thi bằng code** 5 cổng trung thực (không phải chỉ prompt).
Cell này lấy dữ liệu run vừa chạy và tự kiểm lại từng gate phía client:

| Gate | Kiểm tra | Nghĩa |
|---|---|---|
| **G1** | OBS `evidence` là substring của `text` SRC | quote phải **nguyên văn**, không diễn giải |
| **G2** | OBS `source` là key của một SRC tồn tại | không trích nguồn không có thật |
| **G3** | SRC web có url `https://` thật, không domain ví dụ | URL mở được trong trình duyệt |
| **G4** | persona `evidence.quote` khớp **đúng byte** OBS tương ứng | nhân vật không bịa bằng chứng |
| **G5** | persona `stakeholder_type` nằm trong stakeholder types của plan | từ vựng bám kế hoạch elicitation |
"""))
cells.append(code(r'''print("═" * 62)
print("5 HONESTY GATES — kiểm trực tiếp trên dữ liệu run này")
print("═" * 62)

def items_of(kind):
    return client.get(f"/api/v1/projects/{project_id}/items", params={"kind": kind}).json()["items"]

src_items, obs_items, per_items = items_of("source_document"), items_of("stakeholder_observation"), items_of("persona")
src_by_key = {it["key"]: it.get("content", {}) for it in src_items}
obs_by_key = {it["key"]: it.get("content", {}) for it in obs_items}

def verdict(name, bad, total, detail=""):
    mark = "PASS ✔" if not bad else "FAIL ✘"
    print(f"  {mark}  {name}: {total - len(bad)}/{total} đạt"
          + (f"  — {detail}: {bad[:3]}" if bad else ""))
    return not bad

ok = True

# G1 — evidence nguyên văn trong text nguồn
bad = [o["key"] for o in obs_items
       if o["content"].get("evidence", "…") not in str(src_by_key.get(o["content"].get("source"), {}).get("text", ""))]
ok &= verdict("G1  quote nguyên văn (OBS evidence ⊆ SRC text)", bad, len(obs_items))

# G2 — source key tồn tại
bad = [o["key"] for o in obs_items if o["content"].get("source") not in src_by_key]
ok &= verdict("G2  nguồn tồn tại (OBS source ∈ SRC keys)", bad, len(obs_items))

# G3 — url thật
bad = [s["key"] for s in src_items if s["content"].get("origin") == "web"
       and (not str(s["content"].get("url", "")).startswith("https://")
            or "example." in str(s["content"].get("url", "")))]
ok &= verdict("G3  URL thật (https://, không domain ví dụ)", bad, len(src_items))

# G4 — persona evidence khớp đúng byte OBS
if not per_items:
    print("  SKIP    G4: chưa có persona (run chưa tới giai đoạn này)")
else:
    bad = []
    for p in per_items:
        for ev in p["content"].get("evidence", []):
            o = obs_by_key.get(ev.get("observation", ""), {})
            if ev.get("quote") != o.get("evidence") or ev.get("source") != o.get("source"):
                bad.append(f'{p["key"]}→{ev.get("observation","")}')
    total_ev = sum(len(p["content"].get("evidence", [])) for p in per_items)
    ok &= verdict("G4  persona evidence khớp OBS đúng byte", bad, total_ev)

# G5 — từ vựng bám plan (stakeholder_type ∈ plan.stakeholder_types)
if not per_items:
    print("  SKIP    G5: chưa có persona (run chưa tới giai đoạn này)")
else:
    try:
        arts = client.get(f"/api/v1/projects/{project_id}/artifacts").json()["items"]
        plan_art = next(a for a in arts if a["kind"] == "elicitation_plan")
        plan = client.get(f"/api/v1/artifacts/{plan_art['id']}").json().get("content", {})
        allowed = set(plan.get("stakeholder_types", []))
        bad = [p["key"] for p in per_items if p["content"].get("stakeholder_type") not in allowed]
        ok &= verdict("G5  từ vựng bám plan (persona type ∈ plan types)", bad, len(per_items))
    except Exception as exc:
        print(f"  SKIP    G5: không đọc được plan artifact — {type(exc).__name__}: {exc}")

print("─" * 62)
print(("  ✅ TẤT CẢ GATES ĐẠT — bằng chứng của run này là THẬT, kiểm được."
       if ok and per_items else
       "  ⚠ Chưa đủ dữ liệu persona (run chưa tới giai đoạn đó) — gates G1–G3 vẫn đã kiểm ở trên."))
'''))

# ══════════════════════════ Cell 16: summary ══════════════════════════
cells.append(md(r"""## Cell 16 — Tổng kết

Đếm mọi loại item run đã viết ra, và nhìn lại toàn bộ hành trình:
ý tưởng → tài liệu + search thật → quan sát nguyên văn → nhân vật grounded →
phỏng vấn → phân tích → đặc tả → backlog → validation.
"""))
cells.append(code(r'''rows = []
for kind in ["source_document", "stakeholder_observation", "persona", "interview_message",
             "raw_requirement", "analyzed_requirement", "spec_requirement",
             "backlog_item", "validation_issue"]:
    rs = client.get(f"/api/v1/projects/{project_id}/items", params={"kind": kind})
    rows.append([kind, len(rs.json()["items"])])
table(["Loại item (kinds)", "Số lượng"], rows, caps=[28, 10])

print("""
Chuỗi bằng chứng đã đi qua notebook này:

  US (user story)
   └─ derived_from → AR (yêu cầu phân tích)
        └─ derived_from → RAW (câu nói) ─ stated_by → PER (nhân vật)
             └─ grounded_in → OBS (quan sát) ─ evidenced_by → SRC (tài liệu)
                  └─ text: "…câu nói nguyên văn, truy về được…"

→ FE render: toàn bộ chuỗi này hiển thị ở tab Traceability + evidence chain.""")
'''))

# ═══════════════════════════ write notebook ═══════════════════════════
nb = {
    "cells": cells,
    "metadata": {
        "kernelspec": {"display_name": "Khoai Backend (Python 3.12)", "language": "python", "name": "khoai-backend"},
        "language_info": {"name": "python", "version": "3.12.0"},
    },
    "nbformat": 4,
    "nbformat_minor": 4,
}

out = Path(__file__).resolve().parent / "demo_thesis.ipynb"
out.write_text(json.dumps(nb, ensure_ascii=False, indent=1), encoding="utf-8")

code_count = sum(1 for c in cells if c["cell_type"] == "code")
md_count = sum(1 for c in cells if c["cell_type"] == "markdown")
print(f"notebook: {len(cells)} cells ({code_count} code + {md_count} markdown)")
print(f"written: {out}")
