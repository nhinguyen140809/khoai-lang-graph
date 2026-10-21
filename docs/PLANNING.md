# Project Planning

Living document: goals, decisions and rationale, designs, risks, open questions, and the setup checklist.
Once a decision here is finalized, move it into an ADR (`docs/adr/`).

- Owners: <TODO>
- Last reviewed: <TODO YYYY-MM-DD>

## Contents

- [Project Planning](#project-planning)
  - [Contents](#contents)
  - [1. Goals \& scope](#1-goals--scope)
  - [2. What the project needs beyond frontend + backend](#2-what-the-project-needs-beyond-frontend--backend)
  - [3. Key decisions \& rationale (to become ADRs)](#3-key-decisions--rationale-to-become-adrs)
  - [4. UI component library](#4-ui-component-library)
    - [Requirements](#requirements)
    - [Why shadcn/ui](#why-shadcnui)
    - [Companion libraries](#companion-libraries)
    - [First frontend milestone](#first-frontend-milestone)
    - [Backend implications](#backend-implications)
  - [5. Flexible model / provider configuration](#5-flexible-model--provider-configuration)
  - [6. Agent run lifecycle](#6-agent-run-lifecycle)
  - [7. Research methodology](#7-research-methodology)
  - [8. Risks \& mitigations](#8-risks--mitigations)
  - [9. Open questions](#9-open-questions)
  - [10. Setup checklist (Phase 0)](#10-setup-checklist-phase-0)
    - [Repository](#repository)
    - [Backend](#backend)
    - [Frontend](#frontend)
    - [Research](#research)
    - [Infra \& CI](#infra--ci)
  - [11. Suggested timeline (adjust to the semester)](#11-suggested-timeline-adjust-to-the-semester)

---

## 1. Goals & scope

Fill this in with the team and the supervisor first: everything else depends on it.

**Vision** (one sentence): <TODO: who is the user, what problem, why multi-agent>

**MVP (what the final demo must show)** - draft:

- [ ] User starts a thread and gives a task
- [ ] The multi-agent workflow runs with live streaming of tokens and agent steps
- [ ] User sees the agent graph with the currently running node highlighted
- [ ] Agents produce artifacts (structured documents such as the requirement specification) that the user can open, edit and export
- [ ] User approves or rejects at least one human-in-the-loop step
- [ ] User can switch models / providers per role
- [ ] <TODO: domain-specific features>

**Non-goals (for now)** - draft, to avoid scope creep:

- Mobile app, offline mode
- Multi-tenant organizations, billing, payments
- Fine-tuning or training our own models
- Real-time collaboration between multiple users on one thread

**Success criteria**

| Track | Criteria |
|---|---|
| Engineering | All MVP flows work end-to-end on a deployed URL; CI green on `main`; coverage target met for `features/*/service.py`, `agents/`, `tools/`; documented setup works on a fresh machine |
| Research | Each RQ answered with a pre-defined metric, compared against a baseline, with repeated runs and reported variance; results reproducible from the repo |

**Non-functional targets** (initial guesses, adjust once measured):

| Metric | Target |
|---|---|
| Time to first streamed token | < 2 s (p95) |
| Full workflow run | < <TODO> min (p95) |
| LLM cost per run | < $<TODO> on the default models |
| Concurrent users (demo) | ~10-20 |
| Availability | Stable during demo and defense; no hard SLA |

## 2. What the project needs beyond frontend + backend

| Component | Why it's needed | Priority |
|---|---|---|
| **`research/`** | The research track needs a home for experiments, evals, datasets, and the paper, kept separate from product code but importing it | Must |
| **Evaluation harness** (`research/evals/`) | Links both tracks: product changes get measured, research findings are backed by numbers. Probably the single most valuable piece for a capstone | Must |
| **LLM observability** (Langfuse / LangSmith) | Multi-agent systems are very hard to debug without step-by-step traces; also produces research data (latency, tokens, cost per agent) | Must |
| **`infra/` (Docker Compose)** | One command brings up Postgres, pgvector, Langfuse, so every teammate has the same environment | Must |
| **`docs/` + ADRs** | The thesis/report needs to explain *why* you chose things. ADRs make that nearly free to write up at the end | Must |
| **CI (GitHub Actions)** | Enforces lint/type/test for every PR, so quality doesn't depend on discipline alone | Must |
| **`scripts/`** | Seeding data, codegen, dataset download | Should |
| **Prompt management** | Prompts are "code that changes behavior". Versioned in Git at first; later maybe Langfuse prompt management | Should |
| **Auth** | Needed if this becomes a real product (start simple: Clerk / Supabase Auth / FastAPI + JWT) | Later |
| **Deployment** | Demo day needs a public URL (Railway / Render / Fly.io / a VPS + Docker Compose) | Later |
| **Monitoring** (Sentry, uptime) | Product maturity; nice to show in a defense | Later |

## 3. Key decisions & rationale (to become ADRs)

| # | Decision | Chosen | Alternatives | Why |
|---|---|---|---|---|
| 1 | Repo layout | **Monorepo** (`backend/`, `frontend/`, `research/`) | Separate repos | Small team; atomic PRs across API + UI; research imports backend directly |
| 2 | Python tooling | **uv + Ruff + mypy** | Poetry, black+isort+flake8, pyright | uv/Ruff are fast and cover many tools in one; the current de facto standard |
| 3 | API layer | **FastAPI** self-hosted around LangGraph | LangGraph Platform / `langgraph dev` server | Full control over auth, schema, and business logic; still use LangGraph Studio for debugging |
| 4 | Streaming | **SSE** | WebSocket | One-directional token streaming is enough; simpler, works through proxies |
| 5 | Database | **PostgreSQL + pgvector** | Separate vector DB (Qdrant, Chroma) | One database for app data, checkpoints, and vectors = less infra |
| 6 | Logging | **structlog** | stdlib logging, loguru | Structured JSON logs, context binding (request_id / thread_id) |
| 7 | Frontend framework | **Next.js (App Router)**, used as the web app in front of the FastAPI API; no business logic in Next.js server code | Vite + React SPA, TanStack Start, React Router framework mode | Largest ecosystem and documentation; statically rendered pages with metadata for a future public landing page; shadcn/ui documentation targets it first. Trade-offs we accept: a heavier dev server, a Node.js server in deployment, and browser-only libraries need `'use client'` or dynamic import |
| 8 | Component library | **shadcn/ui on Tailwind v4**, see [section 4](#4-ui-component-library) | HeroUI, React Aria Components, Headless UI, Ark UI, DaisyUI, Flowbite | Tailwind-native, you own the code; the chat and graph libraries (assistant-ui, AI Elements, React Flow UI) are built on it; artifact viewers are headless or themeable |
| 9 | API typing | **OpenAPI -> generated TS client** | Hand-written types | Frontend and backend types can't drift apart |
| 10 | Tracing | **Langfuse** (self-hosted) | LangSmith | Free & open source, works in Docker; LangSmith has a free tier and tighter LangGraph integration. Pick one |
| 11 | Git flow | **GitHub Flow + squash merge + Conventional Commits** | Git Flow | Simple for a small team; clean history; automatic changelog |
| 12 | Model abstraction | **`init_chat_model` + role-based registry** (see [section 5](#5-flexible-model--provider-configuration)) | LiteLLM SDK/proxy, OpenRouter, hand-written wrappers | Native to LangGraph, no extra service; LiteLLM/OpenRouter can be plugged in later as just another provider |
| 13 | Run execution | **Runs as background tasks** with resumable SSE (see [section 6](#6-agent-run-lifecycle)) | Run inside the HTTP request; arq / Celery + Redis; LangGraph Agent Server | Workflows can take minutes and must survive client disconnects; start with an in-process task manager, move to a queue only when needed |
| 14 | File storage | **S3-compatible object storage** (MinIO locally) for exported documents and uploaded files, with their metadata in Postgres. Artifacts and items are structured data in Postgres, see [Data shape](DATA_SHAPE.md) | Local disk only, blobs in Postgres | Same code in dev and prod; large files stay out of the DB |
| 15 | API versioning | **`/api/v1` prefix** | Header-based versioning | Simple and explicit; lets us make breaking changes behind `/api/v2` |
| 16 | Backend structure | **Modular monolith**: `features/<name>/` vertical slices + shared `agents/`, `llm/`, `tools/`, `platform/`, `domain/`, `settings/`; `domain/` holds the business rules that need no infrastructure (content schemas, integrity rules, domain errors) and imports no other package; dependency rules enforced by import-linter; ports (`Protocol`) only at planned replacement points | Layered by technical type (`api/`, `services/`, `db/`); full Clean Architecture (entities, use cases, adapters, DTO mapping per layer) | Adding a feature touches one folder; graphs stay free of HTTP/DB so `research/` can import them; full Clean Architecture adds ceremony a small team cannot afford and LangGraph is already a framework we cannot abstract away |
| 17 | Session & deployment origin | **httpOnly session cookie set by FastAPI** (`HttpOnly; Secure; SameSite=Lax`); frontend and API served from the **same origin** (Next.js rewrite of `/api` in dev, reverse proxy routing `/api` in prod) | Token in `localStorage`; cross-origin API with CORS credentials | JavaScript cannot read the session; the cookie is sent automatically on REST and SSE requests; no CORS or third-party cookie issues. Requires CSRF protection on state-changing requests (CSRF token or `Origin` check) |

## 4. UI component library

**Decision: shadcn/ui on Tailwind CSS v4**, with the companion libraries below.

### Requirements

- **Tailwind CSS** is a given, so the library must be Tailwind-native.
- The UI will be complex, with several surfaces:
  - **Chat** with streaming tokens, tool calls, and per-agent steps
  - **Graph view** of the agent workflow (which node is running, what each node produced)
  - **Artifact / file viewer**: read code, Markdown, PDF, tables, images, HTML produced by agents
  - **Multi-step workflows** with progress, human-in-the-loop approvals, and retry of a step

Target layout (like Claude / ChatGPT canvas, plus a workflow view):

```text
+------------+---------------------------+----------------------------+
| Sidebar    | Chat / Workflow           | Artifact panel             |
| - threads  | - messages (streaming)    | tabs: file | graph | trace |
| - projects | - agent step timeline     | - code / md / pdf / table  |
| - settings | - approve / retry step    | - live agent graph         |
+------------+---------------------------+----------------------------+
               (panels are resizable and collapsible)
```

### Why shadcn/ui

- Tailwind-native, built on Radix or Base UI primitives; components are copied into the repo (`src/shared/components/ui/`), so we own and can edit them.
- Largest ecosystem: the chat and graph libraries we need (assistant-ui, AI Elements, React Flow UI) are built on it; the rest are headless or themeable.
- Ships the building blocks for our layout: Sidebar, Resizable, Tabs, Command, Data Table, Charts.
- Custom components for agent steps and artifacts fit in naturally.
- Trade-offs we accept: we maintain the copied components, and there is no built-in stepper or tree view (covered by companions below).

Alternatives considered (Tailwind-compatible): HeroUI (fewer complex components), React Aria Components (best accessibility but lower-level), Headless UI (too small), Ark UI / Park UI (smaller community), DaisyUI / Flowbite (limited for complex widgets). Mantine, Ant Design, MUI, and Chakra UI were excluded because they are not Tailwind-first.

### Companion libraries

| Surface | Choice | Alternative | Notes |
|---|---|---|---|
| App shell | shadcn Sidebar, Resizable (`react-resizable-panels`), Tabs, Command (`cmdk`) | - | Chat and artifact panels side by side, command palette |
| Chat | **assistant-ui** (LangGraph runtime) | AI Elements | Headless core + shadcn-styled components, follows our theme |
| Streaming Markdown | **Streamdown** | `react-markdown` + `remark-gfm` + `rehype-katex` | Handles half-finished Markdown while tokens stream |
| Agent graph / workflow view | **React Flow** (`@xyflow/react`) + React Flow UI + **elkjs** auto-layout | dagre (simpler layout) | Highlight the running node, click a node to see its input/output. Graph structure comes from LangGraph's `graph.get_graph()` exported by the API. Used from day one (also useful for research demos) |
| Multi-step flows | **Stepperize** (`@stepperize/react`) + shadcn Accordion / Collapsible (step timeline) + Dialog / Card (approvals) | - | Maps to LangGraph `interrupt()` for human-in-the-loop |
| Code viewer | **Shiki** | - | Read-only highlighting, light and fast |
| Code editor / diff | **CodeMirror 6** | Monaco (`@monaco-editor/react`) | CodeMirror is lighter and modular; switch to Monaco only if we need a full VS Code feel |
| PDF | **react-pdf** (pdf.js) | - | |
| Tables / CSV | **TanStack Table** (shadcn Data Table) + Papa Parse | - | Virtualize large files |
| File tree | **`@headless-tree/react`** | `react-arborist` | shadcn has no tree view |
| HTML artifacts | Sandboxed `<iframe sandbox>` | - | LLM-generated HTML is untrusted, never inject it into the app DOM |
| Large lists / logs / traces | **TanStack Virtual** | - | Long chats and step logs |
| Charts | **Recharts** (shadcn Charts) | - | Research dashboards, cost / latency views |
| Icons, toasts, motion | **lucide-react**, **sonner**, **motion** | - | |

How they relate to shadcn/ui (not all are built on it):

- **Built on shadcn/ui** (installed through the shadcn CLI / registry, reuse our components and theme): shadcn's own wrappers (Sidebar, Resizable, Command, Data Table, Charts, Sonner), React Flow UI, AI Elements, assistant-ui's styled components.
- **Headless** (logic only, we style them with Tailwind): TanStack Table / Virtual, Stepperize, headless-tree, assistant-ui core. elkjs has no UI at all (layout algorithm only).
- **Own styling system** (not Tailwind; wrap in a Tailwind container and sync the theme manually, e.g. dark mode): React Flow core (base CSS, customizable), Shiki (theme-based highlighting), CodeMirror / Monaco, react-pdf (text/annotation layer CSS).

### First frontend milestone

Build the core surfaces early to catch integration issues: app shell + streaming chat + a small React Flow graph + a code/Markdown artifact panel.

### Backend implications

- The chat, graph, and artifact panels all update from one SSE stream per run, so events must cover more than tokens (event types in [section 6](#6-agent-run-lifecycle)).
- Artifacts and items get their own API, identified by id and version; exported files use the file storage of decision 14.

## 5. Flexible model / provider configuration

Goal: switch model **and** provider via `.env` or from the UI, without touching agent code.

The core mechanism (single entry point `get_chat_model(role, config)`, `provider:model` strings, roles in `models.yaml`, resolution order, allowlist and capability checks, traceability) is documented in [README: Model Configuration](../README.md#model-configuration). This section covers only the remaining design points.

**Resilience**: retries and `.with_fallbacks([...])` configured per profile, so one provider outage does not break the app.

**How the UI plugs in**

```text
GET  /api/v1/models                -> allowlisted models + capabilities
GET  /api/v1/me/model-settings     -> user's current choices per role
PUT  /api/v1/me/model-settings     -> save choices (validated against allowlist)
POST /api/v1/threads/{id}/messages -> body may include one-off "models" override (see section 6)
```

The backend merges these into `config["configurable"]["models"]` before invoking the graph.

**API keys**: Phase 1 keeps keys server-side only (see README). Later (optional) "bring your own key": store encrypted at rest (e.g. Fernet with a key from `.env`), never return it to the client, never log it.

**Options to add later**

- **OpenRouter**: one API key, hundreds of models (OpenAI-compatible) -> good for students with limited budget and for research comparisons.
- **LiteLLM proxy**: self-hosted gateway with unified API, budgets, rate limits, and cost tracking. Plugs in as an OpenAI-compatible provider, so no agent code changes.

**Why this matters for research**: comparing models/providers per role becomes a config change (`research/experiments/.../config.yaml`), which directly enables experiments like "does a cheap supervisor hurt quality?".

## 6. Agent run lifecycle

Multi-step workflows can take minutes and may pause for human approval, so a run must not be tied to a single HTTP request.

**Run as a resource**

```text
POST /api/v1/threads/{thread_id}/messages  -> send a message: starts a run, or is delivered into the unfinished run
GET  /api/v1/runs/{run_id}                 -> status + summary
GET  /api/v1/runs/{run_id}/stream          -> SSE, resumable with Last-Event-ID
POST /api/v1/runs/{run_id}/resume          -> answer an interrupt (human-in-the-loop)
POST /api/v1/runs/{run_id}/cancel          -> cancel a running run
POST /api/v1/runs/{run_id}/retry           -> re-run from a checkpoint (retry a step)
```

Status: `queued` -> `running` -> (`interrupted` <-> `running`) -> `succeeded` | `failed` | `cancelled`. Each transition and its trigger is listed in [Runtime: lifecycle](architecture/runtime.md#3-lifecycle).

**Design points**

- **Background execution:** runs execute outside the request handler. Start with an in-process task manager (asyncio tasks + a `runs` table in Postgres); move to a queue (arq / Celery + Redis) if we need multiple workers or restarts without losing runs. With the in-process manager, a restart fails the runs that were in a step (error `server_restarted`), restarts the queued ones and leaves the interrupted ones waiting; the user retries a failed run from its last completed step. Details: [Runtime: failures, cancellation and restarts](architecture/runtime.md#7-failures-cancellation-and-restarts).
- **Event stream:** one SSE stream per run carries `node_start`, `node_end`, `token`, `tool_call`, `artifact_created`, `artifact_delta`, `interrupt`, `message_delivered`, `error`, `done`. The payload of each type is defined in [API design: run event stream](API.md#6-run-event-stream).
- **Resumable streaming:** every SSE event has an incrementing `id`; events are persisted (or buffered) so a client that reconnects with `Last-Event-ID` gets what it missed. Page reloads do not lose progress.
- **Human-in-the-loop:** a node calls LangGraph `interrupt()`, the run becomes `interrupted`, the UI shows the approval, and `/resume` continues with `Command(resume=...)`.
- **Retry / time travel:** LangGraph checkpoints let us re-run from any earlier step (fork from a checkpoint), which powers "retry this step" in the UI.
- **Concurrency:** one unfinished run per thread. A message sent while it is unfinished is not rejected: at the next safe point the intent router decides which node handles it; see [Runtime: messages during a run](architecture/runtime.md#5-messages-during-a-run).
- **Limits:** `recursion_limit`, per-node and per-tool timeouts, max tokens / cost per run; exceeding them fails the run with a clear error event.
- **Trade-off:** LangGraph Agent Server provides much of this out of the box. We chose FastAPI for control (decision 3); if building this ourselves costs too much, revisit that decision.

## 7. Research methodology

Rules that make results defensible in a thesis. Complements the experiment workflow in `CONTRIBUTING.md`.

- **RQ -> hypothesis -> metric -> experiment.** Define metrics and baselines before running experiments, not after seeing results.
- **Dataset splits:** keep a **dev set** for iterating on prompts/agents and a **frozen test set** used only for reported numbers, so we do not overfit prompts to the test set. Version datasets (Git or DVC) and document sources and licenses.
- **Baselines & ablations:** always compare against simple baselines (e.g. single-agent, plain prompting). Ablations remove one component at a time (e.g. no reflection, no supervisor).
- **Metrics:** measure more than quality:
  - Quality: task-specific metrics (exact match, F1, pass rate) or LLM-as-judge with a rubric
  - Cost: tokens and $ per run, per agent
  - Latency: time to first token, total run time
  - Reliability: failure rate, number of steps, loops, tool errors
- **Repeated runs & statistics:** LLMs are nondeterministic. Run each configuration several times (e.g. n >= 3, fixed temperature and seeds where supported), report mean and standard deviation or confidence intervals, and use paired tests (e.g. bootstrap, Wilcoxon) when claiming one setup is better.
- **LLM-as-judge validation:** pin the judge model version, prefer a different model family from the one being judged, and check agreement with human labels on a sample (e.g. Cohen's kappa) before trusting the judge.
- **Pinned model versions:** use dated model snapshots where providers offer them; providers silently update aliases.
- **Human evaluation / user study** (if any): write the protocol up front, collect consent, and check whether the university requires ethics approval.
- **Regression evals:** a small smoke eval set runs on PRs that touch `agents/`, `llm/`, or prompts (triggered by a `run-eval` label to control cost); the full eval runs before releases.
- **Reproducible reporting:** tables and figures in the paper are generated by scripts from saved results, never copied by hand.

## 8. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| LLM costs exceed budget | High | Provider spending limits; cheap models in dev; response caching for dev and evals; cost logged per run; estimate before large experiments |
| Provider outage, model deprecation, or behavior change | Medium | Model layer with fallbacks (section 5); pinned model versions; can switch provider by config |
| LangGraph / LangChain breaking changes | Medium | Pin versions in `uv.lock`; grouped dependency updates via Renovate; integration tests on the compiled graphs |
| Scope creep; product and research compete for time | High | Agreed MVP and non-goals (section 1); milestone reviews with the supervisor; RQs fixed early |
| Research results negative or inconclusive | Medium | Pre-defined metrics and baselines; negative results are still valid findings; keep a backup RQ |
| Dataset unavailable or license issues | Medium | Decide datasets by week 4; check licenses early; synthetic or self-built dataset as backup |
| Team availability / bus factor | Medium | At least 2 people familiar with each area (`CODEOWNERS`); docs and ADRs; pair programming |
| Security: prompt injection, leaked keys, unsafe tool use | High | gitleaks; tool allowlists and validated arguments; sandbox for any code execution; LLM output treated as untrusted |
| Demo fails on the day | High | Stable deployed environment; seeded demo data; recorded demo video as backup; feature freeze before the defense |

## 9. Open questions

- [ ] **Product:** Who is the user? What is the core use case? What does "done" look like for the demo?
- [ ] **Research:** What are the research questions? Examples of multi-agent research directions:
  - Agent topology comparison (single vs. supervisor vs. hierarchical vs. swarm) on quality / cost / latency
  - Effect of reflection / self-critique loops
  - Memory strategies (short-term vs. long-term) and their impact
  - Reliability: error propagation between agents, failure recovery
  - Evaluation methodology: LLM-as-judge vs. human agreement
- [ ] **Datasets:** Is there a public benchmark, or do we build our own? Labeling budget?
- [ ] **LLM providers & budget:** Which models (OpenAI / Anthropic / Gemini / local via Ollama)? Monthly budget? Does the school provide credits?
- [ ] **Team roles:** Who owns backend, frontend, research, DevOps?
- [ ] **University requirements:** Report format, required docs (SRS, UML?), milestones, license/IP policy.
- [ ] **Language of the UI and the paper:** Vietnamese, English, or both (i18n)?
- [ ] **Hosting for the demo:** Where, and who pays?
- [ ] **Code execution:** Will agents run code? If yes, which sandbox (Docker, E2B, ...)?
- [ ] **Artifact types:** Which file types must the viewer support for the MVP?
- [ ] **User data:** Do users upload private files? Retention and deletion policy?
- [ ] **Tracing tool:** Confirm Langfuse vs LangSmith (decision 10).

## 10. Setup checklist (Phase 0)

### Repository
- [x] Create GitHub repo, protect `main` (require PR, squash merge only, linear history, no force push or deletion, no bypass)
- [ ] Add CI jobs as required status checks on `main` once `ci.yml` exists
- [ ] `LICENSE`, `CODE_OF_CONDUCT.md` (Contributor Covenant), `SECURITY.md`, `CITATION.cff`
- [ ] `.editorconfig`, `.gitignore`, `.gitattributes` (LF endings), `.env.example`
- [ ] Issue templates (bug, feature, experiment), PR template, `CODEOWNERS`
- [ ] Labels (`type:*`, `area:*`, `priority:*`), GitHub Project board, milestones
- [ ] `.pre-commit-config.yaml`: ruff, mypy, prettier, eslint, commitlint, gitleaks, nbstripout, check-yaml, end-of-file-fixer
- [ ] (Optional) Dev container config for a consistent environment across machines
- [ ] `justfile` with `setup`, `dev`, `lint`, `fmt`, `test`, `codegen`, `infra-up`, `eval`

### Backend
- [ ] `uv init --package backend`, `src/khoailanggraph` layout
- [ ] Ruff + mypy config in `pyproject.toml`
- [ ] import-linter contracts in `pyproject.toml` for the dependency rules (decision 16)
- [ ] FastAPI app factory with `/api/v1` prefix, `/health` and `/ready` endpoints, settings, structlog setup, exception handlers
- [ ] SQLAlchemy async + Alembic, Postgres checkpointer
- [ ] `llm/` model layer: `models.yaml`, resolver, `get_chat_model`, `GET /api/v1/models`
- [ ] Hello-world LangGraph graph + SSE streaming endpoint
- [ ] Run manager: `runs` table, background execution, resumable SSE, cancel (section 6)
- [ ] Artifact API + object storage client
- [ ] LLM response cache for dev and tests
- [ ] pytest config, fake LLM fixture, first tests
- [ ] Dockerfile (multi-stage, non-root user)

### Frontend
- [x] Next.js app (App Router, Turbopack) in `frontend/`
- [x] Strict `tsconfig`, ESLint flat config, Prettier, path alias `@/`
- [x] Tailwind CSS v4 setup (+ `prettier-plugin-tailwindcss`)
- [x] Init shadcn/ui and companion libraries (section 4)
- [x] App shell: sidebar + resizable chat / artifact panels
- [x] App Router routes + TanStack Query, API client codegen script (writes `frontend/openapi.json` + `src/shared/api/generated/`)
- [ ] Generate the first client once the backend exports `openapi.json`, then replace the hand-written types in `features/chat/chat.types.ts`
- [x] Zustand store for user settings (model choices, theme, etc.)
- [x] Chat page consuming the SSE endpoint (against MSW mocks until the backend exists)
- [x] Vitest + MSW + Playwright setup
- [x] File and folder naming rules enforced by ESLint (frontend/CONTRIBUTING: TypeScript / React)

### Research
- [ ] `research/README.md` with RQs and reproduction steps
- [ ] Experiment folder template + experiment issue template
- [ ] Dev / test split and at least one baseline defined (section 7)
- [ ] Minimal eval runner: dataset -> graph -> metrics -> results table, logging git SHA + config
- [ ] Tracing project set up for experiments (separate from product traces)
- [ ] Overleaf project linked to `research/paper/`

### Infra & CI
- [ ] `infra/docker-compose.yml`: postgres (+pgvector), langfuse (+ its deps), MinIO (S3-compatible storage); Redis only if we adopt a queue
- [ ] GitHub Actions `ci.yml`: path-filtered jobs for backend (ruff, mypy, import-linter, pytest) and frontend (eslint, tsc, vitest, build)
- [ ] Codegen drift check in CI: rerun `just codegen`, then `git diff --exit-code` on `frontend/openapi.json` and `src/shared/api/generated/`
- [ ] Smoke eval workflow triggered by the `run-eval` label
- [ ] Secrets in GitHub Actions secrets, never in workflow files
- [ ] Renovate/Dependabot, release-please

## 11. Suggested timeline (adjust to the semester)

| Weeks | Engineering | Research |
|---|---|---|
| 1-2 | **Phase 0 - Foundation:** repo, tooling, CI, Docker Compose, skeleton apps | Literature review, define RQs |
| 3-4 | **Phase 1 - Walking skeleton:** one simple graph end-to-end (UI -> API -> LangGraph -> UI streaming) | Choose/build dataset, define metrics |
| 5-8 | **Phase 2 - Core agents:** multi-agent workflow, tools, persistence, tracing | **Phase 3 - Evaluation:** eval harness, baseline results |
| 9-12 | **Phase 5 - Product polish:** features, UX, auth | **Phase 4 - Research iterations:** experiments & ablations |
| 13-14 | Phase 5 (cont.): deployment, hardening, monitoring | Phase 4 (cont.): analysis, figures, writing |
| 15+ | **Phase 6 - Delivery:** demo polish | Phase 6: paper/thesis finalization |

> Keep 1-2 weeks of buffer before the defense, with a feature freeze about 2 weeks before it. Map milestones to the university's checkpoints.

> Principle: **get the walking skeleton + eval harness working early**. Everything afterwards is iteration you can measure.
