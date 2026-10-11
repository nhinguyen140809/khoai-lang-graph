# Gap report — backend port (khoai-lang-graph)

Status: **Resolved in backend** vs **Pending decision**. Everything the
frontend reads is live (Phase E walked login → projects → new project →
chat run → SSE terminal log → status bar → search → item page against the
real server); the items below are the deviations and open follow-ups.

## 1. Resolved during Phase E (backend-side only, no frontend change)

### 1.1 CSRF origin behind the Next.js proxy — fixed
`api/deps.py` compared `Origin` against the request host. In dev the Next
server on `:3000` proxies `/api` to the backend on `:8001`, so the
application origin (the one the browser sends) is not the backend host and
every state-changing call answered `403 Origin check failed`. Added
`Settings.csrf_allowed_origins` (default `["http://localhost:3000"]`,
documented in `settings/base.py`); `check_origin` now accepts the request
host plus that list. The rule of `docs/API.md` §3 ("Origin equals the
application origin") is unchanged; production sets its own list.

### 1.2 Response contracts drifted from the frontend Zod schemas — fixed
`GET /projects` lacked `initial_message_id`, `created_at`, `updated_at`,
and every timestamp serialized as `…+00:00` while the frontend reads
`z.iso.datetime()` (offset strictly `Z`). Fixed by:
- `platform/serialization.py` — `IsoDatetime`, a runtime `Annotated`
  serializer emitting `…Z`; applied to every datetime field of the response
  schemas (projects, threads, runs, steps, messages, me, settings, items).
- `ProjectSummary` gained the three fields; `project_view` fills them.
- `initial_message_id` was a column no writer ever set: `append_message`
  and the run executor now set it on the first message of a project (the
  seed path gets it for free because the executor records the intent as
  the initial message).

### 1.3 `import-linter` layered contract vs FastAPI adapters — declared
Feature routers/services are the HTTP adapter of their use case
(`docs/API.md` §4): they raise `ApiError`, take `require_user`, return
`Page`. The layer contract (api above features) sees those imports as
upward. All 16 pairs are enumerated in `pyproject.toml` as
`ignore_imports` (no wildcards) with the reason in the config comment.
**Follow-up (nice-to-have):** translate domain exceptions in an api-level
handler and delete the exceptions; ~10 call sites, deferred to keep the
port minimal.

### 1.4 Real-model runs caught two hidden failures — fixed
Wiring the gateway (`DEMO_MODE=false`) exposed bugs the scripted runs
could never hit:

1. **Controlled-vocabulary drift** — glm-5.2 wrote a persona whose
   `stakeholder_type` was a sentence ("Student drivers (commuter and
   resident) …"), the domain rule (plan-values layering) rejected it,
   `safe_node` swallowed the failure and the run drained to the exit.
   Fixed: `nodes.match_plan_value` normalizes a model answer to the
   plan's term (verbatim → casefold → longest contained term, else an
   honest failure), and `prompts/persona_generator.v1.md` now demands the
   exact term. Other plan-linked fields will likely need the same
   treatment as real failures appear — pattern is in place.
2. **The executor masked failures as successes** — `start_run_blocking`
   kept only the LAST stream chunk, so a `status: failed` written by an
   early node (whose plain edge still leads onward) was buried under the
   later checkpoint's chunk: runs answered `succeeded` at
   `persona_review` with zero artifacts. Fixed: chunks merge into the
   state; a merged `failed` sets `run.status/error_code/error_message/
   error_stage`, marks the failing step `failed`, and appends an SSE
   `error` event (the frontend renders `✖ message`).

## 2. Not ported (per the mission brief, remaining follow-ups)

- **decisions.py (PARK)** — the decision catalogue of the source backend
  stays parked intentionally. Nothing references it.
- **checkpoint_validation node / checkpoint_personas reject branches /
  business_rule / embedded traceability / regenerate-all-id-restart** —
  out of scope by the mission; the definition-driven vocabulary does not
  include them.

## 3. Open gaps (need a decision or a later version)

1. **Later runs: a second chat message on a worked project.** The
   executor builds a fresh state per run, so `route_start` always enters
   at the planner; `persona_generator` then hits the one-artifact-per-kind
   rule ("the project already has a persona_catalog") and — since the
   fix §1.4.2 — the run now fails honestly with `✖` instead of faking a
   success. The definition's own answer (§2.1) is the intent router:
   preload the project's personas into the initial state (so
   `route_start` picks `intent_router`), pass the new message as
   `configurable.pending_messages`, let `intent_router_node` classify a
   target, and run only the targeted stages on the existing artifacts.
   A `planner` re-elicit is deliberately impossible in v1 (one catalog
   per project; revisions version it). This is the top follow-up.
2. **Executor-side interrupt recording.** The resume routes exist and are
   tested (§5), but the executor does not mark a run `interrupted` or
   write an `InterruptRow` when the stream yields `__interrupt__` — demo
   runs configure `review_checkpoints: []`, so nothing ever interrupts.
   Flipping a checkpoint on needs this plus the state freeze semantics.
3. **Usage aggregation.** `fake:demo` emits no token counts and the
   executor records zeros; `ChatOpenAI` already returns `usage_metadata`,
   summing it per run/step is a small follow-up.
4. **The synchronous executor** — `POST /threads/{id}/messages` runs the
   whole workflow before answering (documented in `runs/service.py`); a
   real 15-node run holds the POST for minutes and the terminal log
   renders only after it finishes. Moving the walk to a background task
   keeps the same contract (the SSE endpoint replays whatever was
   recorded while it runs).
5. **Real-model vocabulary guards beyond persona generation** — the same
   `match_plan_value` normalization will likely be wanted for
   interviewer/persona_agent topic lists and analyzer enumerations as
   real runs exercise them.
6. **`PATCH /items/{id}` conflict behavior vs. an active run** — answers
   `409 invalid_state` while a run of the project is unfinished; the mock
   handlers have no equivalent scenario, so no frontend path covers it.
7. **Seed parity notes** — the seed mirrors the fixture ids for the user,
   4 projects, and the thread; `initial_message_id` and `item_counts` come
   from the real entities instead of the fixture constants (only Mentor
   platform has a run). The dorm-laundry project is `archived` like the
   fixture; switching to the "Archived" tab shows it.
8. **Frontend placeholders found while reviewing (frontend/ is read-only,
   listed for awareness)** — the run view page is an intentional stub
   ("The run view is not built yet"), the Sources tab is disabled by
   design, and the frontend keeps chat turns in local state (a reload
   starts an empty log; history lives in Workflow/Search). Nothing was
   changed there.

## 4. Docs observations (no edits made to docs/)

- `docs/API.md` §5 describes `PATCH /projects/{id}` with a replaceable
  `run_config`; no direct endpoint was ported beyond the FE-shim needs
  (`POST /projects`, settings, items). No frontend path calls it.
- The SSE section of `docs/API.md` §6 matches the 10 event types
  implemented; `heartbeat :ping` (15s) and `Last-Event-ID` replay added
  per the same section.
- The traps table (§ appendix) already contains the `403` CSRF row;
  behavior now matches it through the proxy setup documented in
  `frontend/README.md`.
