# Design contract — Artifacts / Workflow / Traceability tabs

Working note extracted VERBATIM from the repo design docs (2026-10-11 session):
docs/ui/skeletons.md, docs/architecture/web-app.md, docs/ui/reference-apps.md,
docs/API.md, docs/DATA_SHAPE.md, docs/schemas/**, docs/workflow/*.v1.json.
The rule: implement what they say, nothing invented. Remedies in order:
backend endpoints first, then the FE against them.

## A. Artifacts

Tree (§5): artifacts → sections → items, `v`/`>` expand-collapse (use the
headless-tree `ui/tree`, pattern in design-system/ArtifactTree.tsx); rows =
key + `x-ui-title-field`; artifact without sections grouped by item kind
(demo data has NO sections — fallback is the real case; section items +
parent_item_id are the designed storage); superseded/deleted hidden.
APIs: `GET /projects/{id}/artifacts` (order: stage that produces the kind),
`GET /artifacts/{artifact_id}/items` (outline order + `number` + `depth`,
`?shape=tree` nests; filters kind/review_status/parent_item_id).

Document (§6): artifact header (title, vN, review_status) + artifact content
fields in artifact `x-ui-field-order` (all artifact kinds are x-ui-display
"document") + items by item-kind `x-ui-display`:
- `heading` (section): number + title + contains items
- `table` (spec/backlog/raw/analyzed/latent/assumption/ambiguity/conflict/
  validation): columns = `x-ui-list-fields`, title-field cell = link
- `cards` (persona), `transcript` (interview_message): conversation order;
  highlighted quote with citing items in the margin (`quote` on an
  `evidenced_by` link).

Item view: breadcrumb "artifact > section chain > KEY"; header
`KEY title vN status`; fields in `x-ui-field-order` with `x-ui-widget`
(text/textarea/select/number/list/tags/object-list), readOnly shown not
editable, nullable select empty→null, `x-value-from` reads values from named
artifact field. `Edit` → inputs; save `PATCH /items/{id}` with `If-Match`;
409 version_conflict / 409 invalid_state (409 while a run is running).
Field schemas from `GET /artifact-kinds` (enums value-list-filled).

Bottom panel per item (EditorWithPanel): tabs TRACE / TIMELINE.
- TRACE: links of the item by type, outgoing + incoming; `!` = link whose
  `target_version` < target's current version OR target is `superseded`
  ("made from v{n}"). Data: project links (`GET /projects/{id}/trace-links`,
  filters link_type/source/target) filtered client-side per item.
- TIMELINE: `GET /items/{item_id}/revisions` (version desc): snapshot,
  changed_by Origin {actor: agent|user, agent_role?, user_id?, run_id?,
  step_id?}, change_reason generated|user_edit|rework|restored|deleted,
  human_decision_id; render rows like "v2 approved at specification_review /
  v1 created by requirement_engineer · run 1, step 70"; "Compare with vN"
  reads `GET /items/{id}?version=`; supersedes predecessors listed at the end.

Export: side panel + document header button; dialog asks template + format
from `GET /workflow/definition` export_templates (requirement_specification
md/pdf/docx, product_backlog md/csv/json, traceability_matrix csv/md,
interview_transcripts md/pdf, full_project json/md);
`POST /projects/{id}/exports` (202, Idempotency-Key) → poll
`GET /exports/{id}` until ready → download_url. BACKEND MISSING.

## B. Workflow

Side panel: RUNS (runs of the conversation thread) with steps nested:
"v Run 3 waiting review / 1 planner done / 2 persona_gen done / > 4-27
PER-001" — consecutive interview steps grouped under the persona
(subject_item_id), expand on click; other runs collapsed with status.

Editor graph (web-app §3): `GET /workflow/definition?version=` (TanStack key
['workflow-definition', version]) → React Flow nodes (component by `kind`:
start/end, agent [ ], checkpoint < >, control ( )) label from `label`; edges
label + id `source:target:option`; elkjs layered layout, computed once per
definition version. Status per web-app §4: reducer replays steps + pending
interrupt, then live SSE; NodeStatus idle|running|waiting|done|failed; visits
count (x31); last edge highlighted; message_delivered at node;
RunProgress {nodes: Record, lastEdge, lastEventId}.

Step/node panel (below editor): `STEP {seq} {node} {stage} iter {i}`; model,
usage, produced ItemRefs (keys open items); [Open review] when
`GET /runs/{id}/interrupts?status=pending`; [Retry from this step] →
`POST /runs/{run_id}/retry {from_step_id}` (BACKEND MISSING; 409
run_already_active while a run is unfinished); [Open trace in Langfuse] from
run.trace_id (URL scheme SILENT — link out only).
Named FE files (web-app §9): features/workflow/components/WorkflowGraph.tsx,
TerminalNode/AgentNode/CheckpointNode/ControlNode.tsx, graph-layout.utils.ts
(elkjs), node-status.reducer.ts, NodeDetailsPanel.tsx, StateTree.tsx.

## C. Traceability

Editor: Matrix columns `Backlog | Spec | Analyzed | Source | Evidence`, one
row per `derived_from` chain from backlog item down to raw requirement or
latent need + `evidenced_by` message keys; multi-value cells comma-joined;
`-` for gaps; every key opens the item; `[ Only gaps ]` toggle.
SERVER-SIDE endpoints (API.md, BACKEND MISSING): 
- `GET /projects/{id}/traceability/matrix` — rows of derived_from chains
- `GET /projects/{id}/traceability/coverage` — counts AND lists: requirements
  with no backlog item (SpecRequirement with no incoming derived_from),
  requirements with no source (Spec/Analyzed with no outgoing derived_from),
  items that need review after a source changed (staleness: target_version <
  current version or target superseded). Click filters the matrix.
- Links at `GET /projects/{id}/trace-links` (NOT /links; filters
  link_type/source/target), `POST` manual link, `DELETE /trace-links/{id}`
  (soft delete), `GET /items/{id}/trace` (?direction/depth → {nodes,links}).
Side panel VIEWS: [Matrix] / Issues; Issues = open ambiguity/conflict/
validation issues (status enums open|resolved|dismissed / open|fixed|dismissed)
with the items they concern/flag.
Items filters to add: kind, review_status, run_id on GET /projects/{id}/items.

## D. Backend gaps to close (API.md path names exactly)

1. Item payload: add parent_item_id (+ position/number/depth on the artifact
   items endpoint). Missing v1 demo writes NO sections; endpoints must still
   serve the shape.
2. Rename `/projects/{id}/links` → `/projects/{id}/trace-links` + filters.
3. `GET /items/{id}/revisions`, `GET /items/{id}/trace`.
4. `GET /projects/{id}/traceability/matrix` + `/coverage`.
5. `GET /artifacts/{artifact_id}/items` (+number/depth, ?shape=tree).
6. Exports trio; `POST /runs/{id}/retry`; run state endpoints; directives;
   `GET /content-schemas/{kind}/{version}`; `GET /artifacts/{id}`,
   PATCH/restore — larger follow-ups (mark which stay deferred).
7. FE switch: my current client-side matrix/coverage/links code moves to the
   server endpoints; trace-links fixtures/handlers follow the new path.

SILENT in docs (do not invent): matrix/coverage response field names (choose
minimal {rows}/{...} per skeleton labels; document choice), Langfuse URL,
diff payload, Only-gaps filtering side (client is fine), TIMELINE prose
beyond the example, styles/colors.
