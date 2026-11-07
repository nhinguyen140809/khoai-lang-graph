# Frontend S4: Trace, the chain of an item as a graph, with the gaps and the open issues

The plan of S4 of the [Frontend implementation plan](frontend-implementation-plan.md), for the user view first. The feature of the activity bar is "Trace" (B2 English, the word of the domain; the developer view names the trace of a run "Run trace", so the two never meet). Its side panel has two sections: an overview of what needs attention (the gaps of the links and the open issues, with their counts) and the tree of the documents and their items, marked where something needs attention. Choosing an item shows, in a tab, its whole chain from the interviews to the backlog as a graph that the user reads and acts on: the nodes name each item by its kind and its title, the edges carry the title of their link and show the quoted words of both items on demand, and a menu on a node or an edge holds the actions. The open issues get a page that states each problem and where it sits, with the quoted words. The page of an item gains an icon button with a menu that holds Edit, "See its trace" and "Link to another item". The traceability matrix moves to the developer view and to a later PR. Section 11.1 maps every visible part to the component, the props, the icon and the tone of the design system that draw it; the wireframe only fixes the layout. Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md); this version replaces the matrix-first draft after the reviews of the user (2026-11-07).

S4 does not need S2b: it reads the links, the chains and the coverage of `trace/entities` (E3, #41, and S1b), the pages and the outline of Documents (S1a, S1b), and the split of `trace/entities` by topic of S2a.0 (`e2a3121f`). It shares three pieces with S2b (`RecordName`, `lowerFirst`, `listSentenceParts`); the PR that merges second takes them from the first (section 17). This plan is checked against `feat/fe/activity` at `5db9bb25` (the top of the S2a stack), on `main` at `36063353`. Once S2a merges, check every path and name of sections 7 to 9 again against `main`. When the code differs from this plan, the agent stops and reports the difference instead of choosing.

Short paths: `trace/...`, `traceability/...`, `artifact/...`, `workflow/...`, `documents/...`, `project/...` are under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`; `lint/...` under `frontend/`. `app/.../[projectId]/...` is `app/(project)/projects/[projectId]/...`.

## Contents

1. [Row in the PR table](#1-row-in-the-pr-table)
2. [What was read](#2-what-was-read)
3. [Architecture: the layers and the data flow](#3-architecture-the-layers-and-the-data-flow)
4. [Decisions](#4-decisions)
5. [Scope](#5-scope)
6. [Naming](#6-naming)
7. [Shared code first](#7-shared-code-first)
8. [Changes to existing modules](#8-changes-to-existing-modules)
9. [The slices, file by file](#9-the-slices-file-by-file)
10. [State and data flow](#10-state-and-data-flow)
11. [The look of each part, in the design system](#111-the-look-of-each-part-in-the-design-system), then [Behavior of each component](#11-behavior-of-each-component)
12. [Screen states and words](#12-screen-states-and-words)
13. [Mocks and screenshots](#13-mocks-and-screenshots)
14. [Tests](#14-tests)
15. [Docs to update](#15-docs-to-update)
16. [Left for the next PRs](#16-left-for-the-next-prs)
17. [Commits and checks](#17-commits-and-checks)
18. [Checklist](#18-checklist)

Section 3 is added to the sections of the prompt, as the user asked for the architecture and the data flow through the layers.

## 1. Row in the PR table

| Id | Branch | PR title | Based on |
|---|---|---|---|
| S4.D | `docs/fe/trace-link-changes` | `docs(api): change a link only while the document of its source takes changes, follow a chain one way, and name the gaps in the words of the user` | `main` |
| S4.0 | `chore/fe/maintenance-before-trace` | `chore(frontend): name an item by its kind and title before its key, and move the trace graph to the entity` | `main` once S2a merges (or `feat/fe/activity`) |
| S4.1 | `feat/fe/trace-screen-entities` | `feat(frontend): read the chain of an item as a graph with its attention, the open issues with their words, and what a project needs` | S4.0; needs S4.D |
| S4.2 | `feat/fe/trace-links` | `feat(frontend): link two items, remove a link, and gather the actions of an item in one menu` | S4.1 |
| S4.3 | `feat/fe/trace-screen` | `feat(frontend): show Trace, with the overview, the tree of the documents, the chain of an item, the gaps and the open issues` | S4.2 |

| | |
|---|---|
| Needs | E3 (#41), S1a (#57, #58), S1b (#62, #63), S2a.0 (the trace topics); `ProjectRunStreams` of P7 (#49) |
| After it | The matrix in the developer view (section 16), S5, S6 (which reuses the graph layout) |
| Docs first | (1) When a link may change (A1). (2) That `direction=both` of the trace of an item is two walks, one each way, never a walk that changes direction (A2). (3) The titles and descriptions of the gaps in natural language, from the definition when it names the gap, else from the server (A6). S4.D (`4a84de16`) writes the three. (4) What Trace shows, which Usability does not describe (A3 to A12): the answers go to `docs/ui/usability.md` on `frontend-plan` before S4.2 |
| Sketch | [`docs/ui/wireframes/s4-trace.html`](ui/wireframes/s4-trace.html): the layout of the side panel, the chain graph with a chosen link and a node menu, a gap, the open issues, the item menu, the add and remove dialogs. It is a layout only: the look of each part is section 11.1, and where the sketch writes a word in place of an icon (the tree marks, the menu button, the legend button), the icon of section 11.1 is built |

### Questions to the user

The agent builds the proposal; the user confirms or changes each before the PR that shows it (A1, A2, A6 before S4.D; the others before S4.2).

| Id | Question | Proposal (built) | Decision |
|---|---|---|---|
| A1 | When may the user add or remove a link: while the document of its source is under review, or of its target? | Answered by the user (2026-11-07): the source. A link is a statement about its source ("Layered booking flow is based on Students book a session at once"): the source is the item that claims where it comes from, and the review of its document is where the user checks those claims. The requirement tools (IBM DOORS, Jama Connect, Polarion) work the same way: an outgoing link is part of the item that holds it, changing it needs the right to change that item, and the target does not change. A gap is then fixed in the document that lacks the link: a requirement without a source is fixed while the analysis is under review. Otherwise `409 invalid_state` | 11 |
| A2 | "End to end, along one direction of the arrows": may a chain go up and then down (from a requirement to its source, then to the other requirements of that source)? | Answered by the user (2026-11-07): no. The chain of an item is what it is based on, followed backward to the interviews, and what was built from it, followed forward to the backlog; a walk never turns. Siblings (other requirements of the same source) are not in the chain; their own chain shows them. S4.D writes it for `direction=both` | 4 |
| A3 | What is the feature called on the activity bar? | Answered by the user (2026-11-07): "Trace", with `WaypointsIcon`. Usability 2 drops "trace" from the words the user does not know, and says that in the user view it means following a requirement to where it comes from and to what was built from it; the developer view says "Run trace" for the trace of a run | 15 |
| A4 | What does the user view call a link and its actions? | Answered in part by the user (2026-11-07: "connect" does not fit). "Link", a basic word (A2), in both views: "Link to another item", "Remove this link", "See its trace"; the titles of the link types of the definition ("Based on", "Concerns") on the edges. One set of words, no `Wording` for these | 19 |
| A5 | How do the graph columns read, and where do the arrows point? | The interviews on the left, the backlog on the right; an arrow goes from an item to the item it is based on, so the title of the link reads along the arrow ("Layered booking flow", Based on, "Students book a session at once"), pointing left | 21 |
| A6 | How do the gaps read? The API gives "No backlog item", "No source", "Needs review" | Answered by the user (2026-11-07): the API gives them in the words of the user, since they show on screen. When the workflow definition version names a gap, its words come from it; otherwise the server writes them in natural language (version 1 names none): "Requirements without a user story", "Requirements without a source", "Links to check", each with a one-sentence description (S4.D). The client shows what the API gives, so a gap that a version adds needs no client change | 15 |
| A7 | How does an edge show how much it needs the user? | By the level of attention, not by good or bad. Act (the item it is based on changed after the link was made): solid, thick, in the warning tone. Follow (the link comes from an open issue): dashed, regular, in the primary tone. None: solid, thin, muted. Quiet (an end is rejected or replaced): dotted, thin, muted | 5, 22 |
| A8 | What does a click on an edge do? | It selects the link: the edge takes its selected stroke, and the quoted words of each side show inside the node of that side, only on a side that has words. They stay while the link is selected and hide when the selection leaves it (a click elsewhere, Escape, another link or node) | 23 |
| A9 | What is in the menu of a node (right click, or its "..." button)? | "Open", "Open in a new tab", "See its trace" (the chain of that item, in this tab), "Link to another item" (disabled with the reason when its document cannot change). The menu of an edge: "Show the quoted words", "Remove this link" (disabled the same way) | 24 |
| A10 | What does the item page hold? | One icon button (`MoreHorizontalIcon`, no visible text, its name "More actions" for assistive technology and in its tooltip) in place of Edit, opening a menu with icons: "Edit", "See its trace", "Link to another item"; the document page gets the same button with "Edit" (Export joins it in S1d). The user (2026-11-07) asked for the icon alone | 13 |
| A11 | How does an open issue read? | One card per issue: the kind and the title, its status; "The problem" with the main text of the issue; "Where it applies" with each item it concerns (its kind, its title, its key last, its document) and the words of that item it quotes; for a conflict, "Between" with the people it involves; then "See its trace" | 7, 18 |
| A12 | What does a click on a gap show? | A page in a tab with the description of the gap and its items, each with its kind, title, key last and its document; a click shows its chain | 17 |

## 2. What was read

| Source | What it gave |
|---|---|
| `docs/ui/usability.md` 2 (the words the user does not know, trace among them), 4 (rows Traceability matrix, Coverage counts, Bottom panel TRACE), 5.1, 5.4 (links of an item), open point 12 | Trace in both views, the coverage in user words in the side panel; the user does not know "trace" |
| `docs/ui/skeletons.md` 8 | The side panel with COVERAGE and VIEWS; the matrix; Issues; the developer view starting point |
| The user's review of the first draft (2026-11-07) | A table reads as a dashboard and is hard to picture; the graph of one chain for the user view, the matrix to the developer view and later; the side panel as an overview plus a tree like the one of Documents, with its layout and colors but not its meanings or letters; nodes by kind and title, the key small and last; edges with arrows, attention by how much to act, the link title on the edge, the quotes on click; menus on right click; the actions of an item in a "..." menu with icons and friendly words; issues that state the problem and the quotes |
| `docs/API.md` Traceability, Trace body, Quote rules, Matrix body, Coverage body, editing rule | The endpoints of section 5; `direction` and `depth`; quotes on the source and target sides; the gaps of version 1 |
| `docs/DATA_SHAPE.md` 8 | The link types of version 1, their pairs and quote sides; `involves` from a conflict to the personas; the integrity rules |
| `lint/lib/modules/module-imports.constants.js`; `docs/architecture/web-app-modules.md` 2, 5, 9 | `trace` reads `workflow` and `artifact`; `documents` reads `trace`; a screen module above what it reads |
| Code of `feat/fe/activity` | `trace/entities` (`chains`, `links`, `traceability`, `item-links`), `traceModuleKeys`, `useItemTrace(itemId, query, options)`, `useTraceabilityCoverage`, `useProjectTraceLinks`, `createTraceLink`, `deleteTraceLink`, `isLinkOutOfDate`, `LinkedItemsPopover`; `trace/widgets/graph/traceGraphOf` (no reader); `artifact/entities` (`attentionLevels` act, follow, none, quiet with their tones; `issuesWithSubjects`; `ItemKeyLine`, key first); `workflow` (`canLinkTypeConnect`, `targetKindsOf`, `useLinkTitleOf`, `useIssueKinds`, `mainField`, `useKindTitleOf`); `documents` (`useDocumentList`, `useDocumentOutline`, `useEditLockReason`, `DocumentTree` and `row-look.utils.ts`); `shared/components/ui` (`Tree`, `Flow`, `Node` with `variant` and `color`, `Edge` with `variant` solid, dashed, dotted and `color`, `ContextMenu`, `DropdownMenu`, `Tooltip`, `Badge`); `@xyflow/react`, `elkjs` |
| `origin/feat/fe/mock`: `features/traceability/`, `features/workflow/graph-layout.utils.ts` | The old nav, matrix and issues; `layoutGraph` with elk loaded on first use |
| `mocks/trace/` | Handlers of every endpoint; `mock-traceability`, `mock-trace-links`, `mock-create-trace-link`, `mock-delete-trace-link`, `mock-traces`; no refusal outside a review |
| Skills of the prompt | FSD (a screen module above `documents`; a pure rule of the trace graph moves to the entity, so that a widget of another module reads it); Clean Review; React Best Practices (`bundle-dynamic-imports` for elk, the derived graph with `useMemo`, the layout cached as a query); Composition Patterns (menus composed from feature items, an explicit `menu` variant instead of a boolean); Web Design Guidelines (a graph needs a keyboard path and a text alternative; a menu opened by right click also opens with the menu key); React Foundation Review; the Fowler catalog (Move Function: `traceGraphOf` to the entity; Replace Constant with Query: the issue link types from the definition) |

## 3. Architecture: the layers and the data flow

### The modules and what each holds

```text
app/(project)/projects/[projectId]/
  layout.tsx                       traceDestination, TraceDialogs, TraceCommands
  trace/page.tsx                   -> TraceHomePage   (traceability/widgets/home)
  trace/items/[itemId]/            -> ItemTracePage         (traceability/widgets/chain)
  trace/gaps/[gapKey]/             -> GapPage               (traceability/widgets/gap)
  trace/issues/                    -> OpenIssuesPage        (traceability/widgets/issues)
  items/[itemId]/page.tsx          -> ItemPage   (documents/widgets/item: the menu of actions)
  documents/[artifactId]/page.tsx  -> DocumentPage (documents/widgets/document: the same menu)

traceability  (new module, widgets only: the screen Trace)
  panel   TracePanel = OverviewSection + TraceTree; traceDestination
  home, chain, gap, issues, commands
      reads: trace, artifact, workflow, documents, project
documents     widgets/item, widgets/document: the menu of actions
trace         entities: links, chains, traceability, item-links, issues (new topic), graph (moved here)
              features: add-link, remove-link (new)
              widgets: dialogs (new)
      reads: workflow, artifact
artifact      features/edit: EditRecordMenuItem (new beside EditRecordButton)
shared        RecordName (S2b), Tree, Flow, Node, Edge (+ weight), ContextMenu, DropdownMenu,
              ConfirmDialog, createPendingActionStore, fetchAllPages, layoutLayered (new)
```

`traceability` sits above `documents` because the lock of a link (A1) is the lock of the document of its source, which `documents/entities` reads from the run, the review and the project. `trace` stays under `run` and `review`; its features take the lock as a prop (FSD strategy C), as the features of `artifact` do. The pure rule that turns a trace into a graph moves from `trace/widgets/graph` to `trace/entities/graph`, since the chain page of `traceability` reads it and a widget never imports another widget.

### The layers, from the API to the screen

```text
HTTP               GET /items/{item_id}/trace?direction=both&depth=10
  |
*.api.ts           getItemTrace(itemId, query)          apiRequest and zod (traceSchema): a bad answer fails here
  |
*.keys.ts          chainKeys.ofItem(itemId, query)       under traceModuleKeys.all()
  |
query hooks        useItemTrace(itemId, query)           TanStack Query: cache, retry, refetchInterval
  |
pure rules         chainGraphOf(trace, context)          nodes and edges with their attention and quotes
  |                linkAttention, itemAttention          data-driven tests; no React
entity hooks       useItemChain(projectId, itemId)       joins the trace, the kinds, the titles, the coverage
  |                                                      and the issues; a union with `state`
features           useAddLink, useRemoveLink  mutations; on success invalidate traceModuleKeys.all()
  |                AddLinkMenuItem, ...             menu items that open the dialogs through their stores
widgets            ItemTracePage                         lays out (useChainLayout), draws (Flow), puts the
  |                                                      feature items in the menus with the lock; no rule
app                page.tsx, layout.tsx                  mount pages, destination, dialogs, commands
```

### The data flow of each part

```text
Side panel: OverviewSection
  useTraceabilityCoverage(projectId) --> gaps[] {key, title, description, items[]}     (titles from S4.D)
  useOpenIssues(projectId).count     --> "Open issues  3"
  click a gap   --> openPage(routes.project(id).traceGap(key))
  click issues  --> openPage(routes.project(id).traceIssues())

Side panel: TraceTree
  useDocumentList(projectId)            --> documents (kind title and document title)
  useDocumentOutline(artifactId)        --> items of an open document (loaded on expand)
  useProjectAttention(projectId)        --> Map<itemId, ItemAttention>   (coverage and open issues)
  document row: the count of its items at act and at follow (two badges)
  item row: the icon of its level and the reasons in its tooltip
  click an item --> openPage(routes.project(id).traceItem(itemId))

Chain page: ItemTracePage
  useItemChain(projectId, itemId):
    useItemTrace(itemId, { direction: 'both', depth: chainDepth })   items and links of both walks
    useContentSchemas(), useKindTitleOf(), useLinkTitleOf()          words of nodes and edges
    useProjectAttention(projectId)                                   the level of each node
    chainGraphOf(trace, { focusId, titleOf, kindTitleOf, linkTitleOf, attentionOf })
  useChainLayout(graph)   --> layoutLayered (elk, imported on first use), cached by the graph ids
  Flow draws ChainNode and ChainEdge; the chosen link is a state of the page
  node menu  --> useOpenPage, traceItem(id) in place, AddLinkMenuItem(lock)
  edge menu  --> show the quotes, RemoveLinkMenuItem(lock)
  lock       --> useEditLockReason(projectId, source.artifact_id) for the item of the menu

Link two items (from the item page menu or a node menu)
  AddLinkDialog: the source item, linkTypesFrom(definition, source.kind),
  useLinkTargets(projectId, { kinds, text }) --> POST /projects/{id}/trace-links
  success --> invalidate traceModuleKeys.all(): chains, item links, coverage, issues load again

Remove a link (from an edge menu or a chip card)
  RemoveLinkDialog --> DELETE /trace-links/{id} --> invalidate traceModuleKeys.all()

Open issues page
  useOpenIssues(projectId) --> openIssueEntries(items, links, context)
    every page of the project items; every page of the links of the issue link types and of
    `involves`; each entry: the issue, its problem text, its subjects with the quoted words, its sides

While the agents write
  the coverage, the issues and the chain read with refetchInterval = liveTraceMs (5000 ms) while
  useIsProjectWriting(projectId); ProjectRunStreams reloads traceModuleKeys.all() on a status change
```

### What reloads what

| Event | Reloads | How |
|---|---|---|
| A link added or removed by the user | Every query of the trace module: chains, item links, coverage, issues | `invalidateQueries({ queryKey: traceModuleKeys.all() })` in the mutation |
| An item edited (S1b) | The traces, as today (`useReloadTraces`), so an edge that becomes out of date shows it | Unchanged |
| The agents write | The coverage, the issues and the chain on screen, every 5 s | `refetchInterval` given by the widgets |
| The run stops writing | One last load | `ProjectRunStreams` adds `traceModuleKeys.all()` to what it reloads |
| The graph data changes | The layout, once per set of node and edge ids | `useChainLayout` keyed by those ids |

## 4. Decisions

### Modules and maintenance (S4.0)

1. **A screen module `traceability`, apart from the module `trace`.** The module `trace` holds the links as objects: their entities, and the features that change them. The screen Trace puts together the data of several modules (`trace`, `artifact`, `workflow`, the lock of `documents`, the run of `project`), as Activity and Documents do, so it is a module of its own above them (Web App Modules 9), and `trace` does not grow a screen. `trace` may not read `documents`, which reads `trace`, so the screen could not sit in `trace` anyway. `traceability` holds widgets only: `panel`, `home`, `chain`, `gap`, `issues`, `commands`. `moduleImports` gains `traceability: ['workflow', 'artifact', 'trace', 'run', 'review', 'thread', 'project', 'documents']` in a `build` commit (first in S4.1), with its case in `lint/configs/__tests__/configs.test.js`. Its name is the one of the API (`/traceability`) and differs from `trace`, so that an import says which one it means; the screen reads "Trace".
2. **The trace graph moves to the entity.** `trace/widgets/graph/` (`traceGraphOf`, its types and test) moves with `git mv` to `trace/entities/graph/`, a topic of `trace` that reads `chains` and `links`; `trace/widgets/graph` is removed. The rule names no screen, so it belongs to the entity; the chain page of `traceability` reads it there.
3. **An item names itself by its kind and its title; a key is optional and always last** (the user, 2026-11-07, S2b decision 17). The key is shown only where it helps: in the search results of the add dialog (a user may type a key), on the key line of the item page, and in the tooltip of a node. Elsewhere it is left out, since it adds a word the user does not read: the nodes, the rows of the tree, the rows of a gap, the cards of the issues and the chips show the kind and the title only. The screens of S1b that put the key first change in S4.0: `ItemKeyLine` reads "Analyzed requirement, Draft, version 2" and then the key, small and muted, at the end; the chips of the link line show the title, and the card of a chip the kind and the title. They use `RecordName` and `RecordNameTooltip` of `shared/components/ui/record-name.tsx` (S2b decision 17), whose `code` is optional; when S2b has not merged, S4.0 adds that file with its test and S2b takes it.

### Entities (S4.1)

4. **The chain is two walks, one each way** (A2). `useItemTrace(itemId, { direction: 'both', depth: chainDepth })`, `chainDepth = 10`: version 1 has at most five levels from a message to a backlog item, plus the issues that concern them, so 10 reaches both ends. The API answers both walks with the items and links found; S4.D states that a walk never turns. The client adds no walk of its own.
5. **Attention of a link and of an item, by how much to act** (A7). Pure rules in `trace/entities/graph/attention.utils.ts`, on the levels of `attentionLevels` of `artifact/entities` (act, follow, none, quiet, with their tones), read through `artifact/entities/@x/trace`. Only the scale is shared with Documents; the rules that put a link or an item on a level are those below.
   - `linkAttention(link, ends, issueKinds)`: `act` when `isLinkOutOfDate(link, target)` (the item it is based on changed after the link was made); `quiet` when either end is `rejected` or `superseded`; `follow` when the source is an open issue (`isOpenIssue`); `none` otherwise. The first rule that holds, in this order: act, quiet, follow, none.
   - `itemAttention(item, context)`: `act` when the item is in a gap whose key is in `actGapKeys` (`['needs_review']`) or an open issue concerns or flags it; `follow` when the item is in another gap (a missing source or user story) or is itself an open issue; `quiet` when it is `rejected` or `superseded`; `none` otherwise. Each level carries its reasons in user words (the description of the gap, or "An open conflict concerns this item."), for the tooltips.
   - `useProjectAttention(projectId, options)` in `trace/entities/graph/hooks/useGraphQueries.ts`: joins `useTraceabilityCoverage` and `useOpenIssues` and gives `Map<itemId, ItemAttention>` with `state`.
6. **The chain as a graph.** `chainGraphOf(trace, context)` in `trace/entities/graph/trace-graph.utils.ts` replaces `traceGraphOf`: nodes with `kindTitle`, `title`, `key`, `reviewStatus`, `attention`, `isFocus`; edges with `linkTitle`, `attention`, `sourceQuote`, `targetQuote`, `madeFromVersion` (when out of date). `useItemChain(projectId, itemId, options)` in `hooks/useGraphQueries.ts` gives an `ItemChainResult`: `pending`, `error` with `retry`, `notFound`, `success` with `graph` and `focus` (the node of the item).
7. **Open issues with their words** (A11). `trace/entities/issues/`: `openIssueEntries(items, links, context)`: for each open issue (`isOpenIssue` with the kinds of the definition), in kind order then key order, the issue, its problem text (`mainField` of its schema), its subjects (the targets of its links of the issue link types, each with the link and its `target_quote`), and its sides (the targets of its `involves` links). `issueLinkTypesOf(definition, issueKinds)` (workflow): the link types with a pair whose source lists an issue kind and whose target is not an `interview_message` (version 1: `concerns`, `flags`). `useOpenIssues(projectId, options)`: one query under `issueKeys.ofProject`, reading in parallel every page of the items of the project and of the links of each issue link type and of `involves`, giving an `OpenIssuesResult` with `groups` and `count`. `artifact/entities/issues/issuesWithSubjects` stays for the attention counts of Documents.
8. **Live while the agents write.** `useTraceabilityCoverage`, `useOpenIssues` and `useItemTrace` take `refetchInterval?: number | false`; the widgets give `liveTraceMs` (5000) while `useIsProjectWriting(projectId)` (new, `project/entities/run-status/hooks/useProjectRunResult.ts`) is true. `ProjectRunStreams` reloads `traceModuleKeys.all()` on a status change.
9. **The link types from a source and the targets.** `linkTypesFrom(definition, sourceKind)` (workflow): the link types with a pair whose source lists the kind, without `duplicates` and `supersedes` (the rework of the agents), each with its title and target kinds. `useLinkTargets(projectId, { kinds, text, excludeId })` (trace links hooks): the first page (20) of `listProjectItems(projectId, { kind: kinds, text })` without the source.
10. **The layout is shared code.** `layoutLayered({ nodes, edges }, { width, height, direction })` in `shared/lib/graph/layout.utils.ts`: elk `layered`, loaded with `import()` on the first call, giving positions by node id; it names no object of the product, and S6 uses it for the workflow. `Edge` of `shared/components/ui/edge.tsx` gains `weight: 'thin' | 'regular' | 'strong'` (1, 1.5 and 2.5 px through `--xy-edge-stroke-width`), added the way its `variant` is (a map, a `data-weight` attribute), and shown on the design system page. `edge.tsx` exports its two maps (`edgeLineStyles`, `edgeWeights`), so that the legend of the trace page draws its samples from the same values (section 11.1).

### Features (S4.2)

11. **When a link may change** (A1). Every action on a link takes `lockedReason: string | null` of the document of its source: the caller gives `useEditLockReason(projectId, source.artifact_id)`. The words are those of `editAccessMessages`. The mock refuses a link change outside that state with `409 invalid_state` (section 13).
12. **Link two items**: `trace/features/add-link`. `AddLinkMenuItem({ source, lockedReason, menu })` (with `LinkIcon`) opens `AddLinkDialog` through `useOpenAddLinkDialog(sourceItemId)`. The form (`add-link.schema.ts`): `linkType` (required), `targetItemId` (required), `note` (optional, at most 500 characters; an empty note sends null). No quote (section 16). It sends `createTraceLink`; success: the toast, `invalidateQueries(traceModuleKeys.all())`, the dialog closes; a `422` on the field it names; a `409` shows the lock reason.
13. **The actions of an item in one menu** (A10). `documents/widgets/item` replaces `EditRecordButton` with `ItemActionsMenu` (in the file of `ItemPage`), shaped as `ProjectActionsMenu` of `project/widgets/list`: a `DropdownMenu` on `Button variant="ghost" size="icon-sm"` with `MoreHorizontalIcon` and a `sr-only` name the menu button, inside a `Tooltip` with the same words. Its items, each an icon and words (section 11.1): `EditRecordMenuItem` (new in `artifact/features/edit`, beside `EditRecordButton`, the same rule and lock), "See its trace" (a navigation to `traceItem(itemId)`), `AddLinkMenuItem`. `DocumentPage` gets `DocumentActionsMenu` with `EditRecordMenuItem`. When the edit mode ends, the focus goes back to the menu button, the role that `EditRecordButton` had.
14. **Remove a link**: `trace/features/remove-link`. `RemoveLinkMenuItem({ link, lockedReason, menu })` (destructive tone, `UnlinkIcon`) opens `RemoveLinkDialog` (`ConfirmDialog destructive`) through `useOpenRemoveLinkDialog(linkKeyOf(sourceItemId, linkId))`; only the dialog calls `useRemoveLink`. It sits in the menu of an edge, and in the card of an outgoing chip of the item page (the card of `LinkedItemsPopover` gains an `actions` slot). The dialogs are mounted once by `trace/widgets/dialogs` (`TraceDialogs`) in the project layout.

### Widgets (S4.3)

15. **The side panel** (A3, A6). `TracePanel` in `traceability/widgets/panel`: `SidePanel` with two `SidePanelSection`.
    - "Overview": one row per gap of the coverage (its title from the API, a `Badge` with the count, `variant="soft"` in the tone of the level of the gap above zero and `neutral` at zero, its description in the tooltip), then "Open issues" with its count. A row opens its page in the preview tab; a double click keeps it.
    - "Documents": `TraceTree`, the documents of the project and their items, on `Tree` of `shared/components/ui` with the row layout and the colors of the tree of Documents (indentation, chevrons, row height, selected fill) but its own marks. A document row shows the kind and the title of its document and up to two count badges (its items at act, its items at follow), never a letter. An item row shows its title, with the icon of its level (`CircleAlertIcon` for act, `CircleDashedIcon` for follow) and the reasons in its tooltip; a row at none shows no mark. A click on an item opens its chain; the item of the chain on screen is selected.
    - `traceDestination(projectId)` in `trace-frame.config.tsx`: `id: 'trace'`, `label: 'Trace'`, `icon: <WaypointsIcon />`, `href: routes.project(projectId).trace()`, `paths: ['/projects/<id>/trace']`.
16. **The start page.** `TraceHomePage`, in a tab "Trace": a sentence that says what the feature shows, "Choose an item in the side panel to follow where it comes from and what was built from it.", and the overview of the side panel repeated as a short list of links, for a narrow window where the side panel is closed.
17. **A gap** (A12). `GapPage({ projectId, gapKey })`, in a tab named after the gap: its description, then its items, each a row with `RecordName layout="line"` (kind, title, key last) and the kind and title of its document, muted; a click opens its chain in the preview tab. A key that the coverage no longer lists: `NotFoundState` "This list is not shown anymore." with a link to the start page.
18. **The open issues** (A11). `OpenIssuesPage`, in a tab "Open issues": one section per issue kind with its count; one `Item variant="outline"` per issue: the kind (small, muted) and the title as a heading, its status value as a `Badge`; "The problem" with the problem text; "Where it applies" with each subject (`RecordName`, its document, the quoted words in a `blockquote`); "Between" with the sides (personas) for a conflict; the buttons "Open" and "See its trace". Empty: `EmptyState` with the sentence of section 12.
19. **One set of words for a link** (A4). Both views say "link": "Link to another item", "Remove this link", "See its trace". The developer view adds nothing of its own here; the trace of a run, which is another object, is "Run trace" in S6.

### The chain page (S4.3)

20. **The page.** `ItemTracePage({ projectId, itemId })` at `/projects/[projectId]/trace/items/[itemId]`, in a tab named after the item ("Trace of Layered booking flow"); `useEditorTab` keeps one tab per item. Over the graph: the heading, the sentence of section 12, and a legend of the edge looks (four short lines, each a sample stroke and its sentence). Under the graph, for a screen reader and for a user who prefers text, a `details` "Read the links as a list": one sentence per link ("Layered booking flow is based on Students book a session at once.").
21. **The layout** (A5). `useChainLayout(graph)` (`traceability/widgets/chain/hooks/`): a `useQuery` keyed by the ids of the nodes and the edges, calling `layoutLayered(graph, { width: chainNodeWidth, height: chainNodeHeight, direction: 'LEFT' })`, so the targets (the interviews) sit on the left and the arrows of the links point left. While it lays out: `LoadingState`; a failure: `ErrorState` with Try again.
22. **A node and an edge.** `ChainNode` (a custom node of `Flow`, in the file of the page) shows the kind, the title and, when the item is not a draft, its review status; the key is not in the node (decision 3) but in its tooltip with the kind and the title. A "more" icon button shows on hover and on focus. The node of the item of the page is marked. `ChainEdge` draws the link with the line of its level (A7), an arrow at its target, and its link title as the label in the middle, cut with "..." past `max-w-32`. Section 11.1 gives the component and the props of each part.
23. **Choosing a link** (A8). The page keeps `selectedLinkId` in a `useState` of `useChainSelection`. A click on an edge or its label selects it; the edge takes its selected stroke; `ChainNode` of its source shows `sourceQuote`, and the node of its target `targetQuote`, each in a `blockquote` with the quote color of `quoteMarkColors`, under the title; a side without words shows nothing. The selection clears on a click on the canvas, on Escape, on a node, or moves to another edge. A link that is out of date also shows "made from version N" in its label while it is chosen.
24. **Menus on a node and on an edge** (A9). `ContextMenu` of `shared/components/ui` on each node and edge, opened by a right click, the menu key or Shift+F10, and by the "..." button of a node. Node: "Open" (preview tab), "Open in a new tab" (`useOpenPage` with `keep`), "See its trace" (this tab, `inPlace`), `AddLinkMenuItem` with the lock of the document of that item. Edge: "Show the quoted words" (chooses the link; disabled when neither side has words), `RemoveLinkMenuItem` with the lock of the document of the source. A click on a node opens the item page in the preview tab; a double click shows its chain in this tab.

## 5. Scope

| | |
|---|---|
| Endpoints | `POST /projects/{project_id}/trace-links`, `DELETE /trace-links/{link_id}` |
| Queries | `GET /items/{item_id}/trace?direction=both&depth=10`, `GET /projects/{project_id}/traceability/coverage`, `GET /projects/{project_id}/items` (all pages for the issues; the first page with `kind` and `q` for the targets), `GET /projects/{project_id}/trace-links?link_type=` (all pages, for the issues), `GET /projects/{project_id}/artifacts`, `GET /artifacts/{artifact_id}/items` (the tree), `GET /items/{item_id}`, `GET /workflow/definition`, `GET /artifact-kinds` |
| Copied | From `origin/feat/fe/mock`: the shape of `TraceabilityNav` (rewritten as the overview) and `layoutGraph` (as `layoutLayered`) |
| Written new | Section 9 |
| Not copied | `MatrixView`, `rowsWithItems`, `ItemRefLinks` (the matrix waits, section 16); `IssuesView` (rewritten with the problem and the quotes) |
| Not built | The matrix (developer view); quotes chosen by hand; the note of a link edited; the trace in the bottom panel of the developer view; a link drawn by dragging from node to node |

## 6. Naming

| Part | Rule | Name |
|---|---|---|
| Screen module | The subject, as the API names it | `traceability` |
| Widget slices | The block | `panel`, `home`, `chain`, `gap`, `issues`, `commands` (`traceability`); `dialogs` (`trace`) |
| Feature slices | The action | `add-link`, `remove-link` |
| Components of an action | `<Verb><Object><Role>` | `AddLinkMenuItem`, `AddLinkDialog`, `RemoveLinkMenuItem`, `RemoveLinkDialog`, `EditRecordMenuItem` |
| Components of a block | `<Object><Block>` | `TracePanel`, `OverviewSection`, `TraceTree`, `TraceHomePage`, `ItemTracePage`, `ChainNode`, `ChainEdge`, `GapPage`, `OpenIssuesPage`, `IssueCard`, `ItemActionsMenu`, `DocumentActionsMenu` |
| Components that render nothing in place | `...Dialogs`, `...Commands` | `TraceDialogs`, `TraceCommands` |
| Mutation hooks | `use<Verb><Object>` | `useAddLink`, `useRemoveLink` |
| Dialog store hooks | As the prompt names them | `useOpenAddLinkDialog`, `useAddLinkDialog`, `useOpenRemoveLinkDialog`, `useRemoveLinkDialog` |
| Entity hooks | What they give | `useItemChain`, `useProjectAttention`, `useOpenIssues`, `useLinkTargets`, `useIsProjectWriting` |
| Widget hooks | `use<Block><What>` | `useChainLayout`, `useChainSelection` |
| Results | `<Object><What>Result` | `ItemChainResult`, `OpenIssuesResult`, `ProjectAttentionResult` |
| Pure rules | What they give | `chainGraphOf`, `linkAttention`, `itemAttention`, `openIssueEntries`, `issueLinkTypesOf`, `linkTypesFrom`, `linkKeyOf`, `parseLinkKey`, `linkSentence`, `layoutLayered` |
| Types | The object and what it is | `ChainGraph`, `ChainNodeData`, `ChainEdgeData`, `ItemAttention`, `OpenIssueEntry`, `LinkTypeChoice` |
| Words | `<topic>Messages` | `tracePanelMessages`, `traceHomeMessages`, `itemTraceMessages`, `gapPageMessages`, `openIssuesMessages`, `addLinkMessages`, `removeLinkMessages`, `itemActionsMessages` |
| Constants | camelCase | `chainDepth`, `liveTraceMs`, `actGapKeys`, `chainNodeWidth`, `chainNodeHeight`, `linkTargetsPageSize`, `noteMaxLength` |
| Routes | What they open | `trace()`, `traceItem(itemId)`, `traceGap(gapKey)`, `traceIssues()` |
| Command ids | `<module>.<action>` | `trace.issues`, `trace.addLink` |

## 7. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `SidePanel`, `SidePanelSection`, `useOpenPage`, `useEditorTab`, `PageLink`, `useCommands` | `@/shared/components/frame` | The panel, the pages, the commands |
| `Tree`, `TreeItem`, `TreeItemLabel`, `Flow`, `Node`, `NodeHeader`, `NodeContent`, `Edge`, `ContextMenu`, `DropdownMenu`, `Tooltip`, `Badge`, `Item`, `KeyText`, `ConfirmDialog`, `Dialog`, `Combobox`, `Select`, `Textarea`, `PendingButton`, `DisabledReason` | `shared/components/ui/` | Every block |
| `RecordName`, `RecordNameTooltip` | `shared/components/ui/record-name.tsx` (S2b) | Every item on screen |
| `lowerFirst`, `listSentenceParts`, `pluralForm` | `@/shared/lib/text` (S2b for the first two) | Sentences |
| `LoadingState`, `ErrorState`, `EmptyState`, `NotFoundState` | `@/shared/components/state` | The states |
| `createPendingActionStore`, `fetchAllPages`, `debounce`, `errorMessageOf` | `shared/lib`, `shared/api` | Dialogs, issues, search, errors |
| `getItemTrace`, `useItemTrace`, `useTraceabilityCoverage`, `createTraceLink`, `deleteTraceLink`, `listProjectTraceLinks`, `isLinkOutOfDate`, `quoteMarkColors`, `LinkedItemsPopover`, `traceModuleKeys` | `trace/entities` | The chain, the actions |
| `attentionLevels`, `AttentionLevel`, `listProjectItems`, `useItem`, `useItemHref`, `reviewStatus` | `artifact/entities` | Levels, items, addresses |
| The hooks of `EditRecordButton` | `artifact/features/edit` | `EditRecordMenuItem` |
| `canLinkTypeConnect`, `targetKindsOf`, `useLinkTitleOf`, `useIssueKinds`, `isOpenIssue`, `mainField`, `itemTitle`, `useKindTitleOf`, `useContentSchemas`, `useWorkflowDefinition` | `workflow/entities` | Link types, issues, words |
| `useDocumentList`, `useDocumentOutline`, `useEditLockReason`, `editAccessMessages` | `documents/entities` | The tree, the lock |
| `shownRun`, `useProjectRunResult` | `project/entities` | `useIsProjectWriting` |

### New in shared code

| Helper | Path | Users | Replaces |
|---|---|---|---|
| `layoutLayered` | `shared/lib/graph/layout.utils.ts` | The chain page; S6 | `layoutGraph` of `origin/feat/fe/mock`, which named the workflow |
| `weight` of `Edge` | `shared/components/ui/edge.tsx` | `ChainEdge` | Nothing |

### Checked, kept in the module

| Candidate | Rule it holds | Stays in |
|---|---|---|
| `linkAttention`, `itemAttention`, `actGapKeys` | How much a link or an item asks of the user | `trace/entities/graph` |
| `chainGraphOf` | What a chain shows | `trace/entities/graph` |
| `openIssueEntries` | What an open issue is about | `trace/entities/issues` |
| `linkTypesFrom`, `issueLinkTypesOf` | The pairs of the link types | `workflow/entities` |
| The tree marks | Which counts a document row shows | `traceability/widgets/panel`, from `useProjectAttention` |

## 8. Changes to existing modules

| File | Change | PR / commit |
|---|---|---|
| `trace/widgets/graph/*` to `trace/entities/graph/*` | `git mv` alone | S4.0 / 1 |
| `artifact/entities/components/ArtifactItemDetails.tsx` (`ItemKeyLine`), `documents/widgets/item/components/ItemLinkLine.tsx`, `trace/entities/item-links/components/LinkedItemCard.tsx` | Kind and title first, key last (decision 3) | S4.0 / 2 |
| `shared/components/ui/record-name.tsx` | Only when S2b has not merged (decision 3) | S4.0 / 2 |
| `lint/lib/modules/module-imports.constants.js`, `lint/lib/file-names/file-kinds.constants.js`, `lint/configs/__tests__/configs.test.js` | `traceability`; the topics `issues` and `graph` of `trace` | S4.1 / 1 |
| `workflow/entities/definition/link-types.utils.ts`, `@x/trace.ts` | `linkTypesFrom`, `issueLinkTypesOf` | S4.1 / 2 |
| `artifact/entities/@x/trace.ts` | `attentionLevels`, `AttentionLevel`, `listProjectItems`, `reviewStatus` | S4.1 / 3 |
| `trace/entities/graph/` | `chainGraphOf`, `linkAttention`, `itemAttention`, `useItemChain`, `useProjectAttention` | S4.1 / 3 |
| `trace/entities/issues/` (new) | `openIssueEntries`, `useOpenIssues`, `issueKeys` | S4.1 / 4 |
| `trace/entities/links/` | `useLinkTargets`, `linkKeyOf`, `parseLinkKey`, `linkSentence` | S4.1 / 5 |
| `trace/entities/chains/hooks/useChainQueries.ts`, `traceability/hooks/useTraceabilityQueries.ts` | `refetchInterval` | S4.1 / 5 |
| `project/entities/run-status/hooks/useProjectRunResult.ts`, `run-status/components/ProjectRunStreams.tsx`, `@x/traceability.ts` (new) | `useIsProjectWriting`; the reload of the trace module | S4.1 / 6 |
| `shared/lib/graph/layout.utils.ts` (new), `shared/components/ui/edge.tsx`, the design system page | `layoutLayered`; `weight` | S4.1 / 7 |
| `shared/routes/project-routes.utils.ts` | The four routes | S4.1 / 8 |
| `mocks/trace/handlers/trace-links.handlers.ts` | `409 invalid_state` outside a review that takes changes of the document of the source (`refuseOutsideReview` of `mocks/artifacts/artifacts.problems.ts`) | S4.2 / 1 |
| The gaps of `mocks/trace/lookup/coverage.lookup.ts` | The titles and descriptions of S4.D | S4.2 / 1 |
| `artifact/features/edit/components/EditRecordMenuItem.tsx` (new), `index.ts` | Decision 13 | S4.2 / 2 |
| `trace/entities/item-links/components/LinkedItemsPopover.tsx` | `actions` slot | S4.2 / 3 |
| `documents/widgets/item/components/ItemPage.tsx`, `documents/widgets/document/components/DocumentPage.tsx` | `ItemActionsMenu`, `DocumentActionsMenu`; the Remove in the card | S4.2 / 5 |
| `app/.../[projectId]/layout.tsx` | `TraceDialogs` (S4.2), `traceDestination` and `TraceCommands` (S4.3) | S4.2 / 4, S4.3 / 6 |
| `app/.../[projectId]/trace/...` (new) | The four pages | S4.3 / 6 |
| `tests/screenshots/projects/trace.spec.ts` (new) | Section 13 | S4.3 / 7 |

## 9. The slices, file by file

### `trace/entities/graph` (S4.0 move, S4.1)

```ts
// trace-graph.types.ts
export interface ItemAttention { level: AttentionLevel; reasons: string[] }
export interface ChainNodeData {
  id: string
  kindTitle: string
  title: string
  key: string
  reviewStatus: ReviewStatus
  attention: ItemAttention
  isFocus: boolean
}
export interface ChainEdgeData {
  id: string
  source: string
  target: string
  linkType: string
  linkTitle: string
  attention: AttentionLevel
  sourceQuote: string | null
  targetQuote: string | null
  /** The version of the target that the link was made from, when it is out of date. */
  madeFromVersion: number | null
}
export interface ChainGraph { nodes: ChainNodeData[]; edges: ChainEdgeData[] }

// attention.utils.ts
export const actGapKeys = ['needs_review'] as const
export function linkAttention(link: TraceLink, ends: { source: TraceItem; target: TraceItem }, issueKinds: readonly IssueKind[]): AttentionLevel
export function itemAttention(item: Pick<TraceItem, 'id' | 'kind' | 'review_status' | 'content'>, context: AttentionContext): ItemAttention

// trace-graph.utils.ts
export function chainGraphOf(trace: Trace, context: ChainContext): ChainGraph

// hooks/useGraphQueries.ts
export function useProjectAttention(projectId: string, options?: LiveTraceOptions): ProjectAttentionResult
export function useItemChain(projectId: string, itemId: string, options?: LiveTraceOptions): ItemChainResult
```

### `trace/entities/issues` (S4.1)

```ts
export interface OpenIssueEntry {
  issue: ArtifactItem
  /** The main text of the issue: what the problem is. */
  problem: string
  subjects: { item: ArtifactItem; link: TraceLink }[]
  /** The people of a conflict, the targets of its `involves` links. */
  sides: ArtifactItem[]
}
export function openIssueEntries(items: readonly ArtifactItem[], links: readonly TraceLink[], context: IssueContext): { kind: string; entries: OpenIssueEntry[] }[]
export function useOpenIssues(projectId: string, options?: LiveTraceOptions): OpenIssuesResult
```

### `trace/features/add-link`, `trace/features/remove-link`, `trace/widgets/dialogs` (S4.2)

```text
trace/features/add-link/
├── components/
│   ├── AddLinkMenuItem.tsx
│   ├── AddLinkDialog.tsx
│   └── __tests__/
├── hooks/
│   ├── useAddLink.ts
│   ├── useOpenAddLinkDialog.ts
│   └── __tests__/
├── add-link.store.ts
├── add-link.schema.ts
├── add-link.constants.ts
├── add-link.utils.ts           addLinkBody
└── index.ts

trace/features/remove-link/
├── components/
│   ├── RemoveLinkMenuItem.tsx
│   ├── RemoveLinkDialog.tsx
│   └── __tests__/
├── hooks/
│   ├── useRemoveLink.ts
│   ├── useOpenRemoveLinkDialog.ts
│   └── __tests__/
├── remove-link.store.ts
├── remove-link.constants.ts
└── index.ts

trace/widgets/dialogs/
├── TraceDialogs.tsx
└── index.ts
```

```tsx
export function AddLinkMenuItem(props: { source: Pick<ArtifactItem, 'id' | 'kind'>; lockedReason: string | null; menu: 'dropdown' | 'context' })
export function AddLinkDialog(props: { projectId: string })
export function RemoveLinkMenuItem(props: { link: Pick<TraceLink, 'id' | 'source_item_id'>; lockedReason: string | null; menu: 'dropdown' | 'context' })
export function RemoveLinkDialog(props: { projectId: string })
export function TraceDialogs(props: { projectId: string })
```

`menu` picks `DropdownMenuItem` or `ContextMenuItem`, the two menus of `shared/components/ui` that the item can sit in; it is an explicit variant, not a boolean.

### `traceability/widgets` (S4.3, new module)

```text
traceability/widgets/
├── panel/
│   ├── components/
│   │   ├── TracePanel.tsx
│   │   ├── OverviewSection.tsx
│   │   ├── TraceTree.tsx
│   │   └── __tests__/
│   ├── trace-frame.config.tsx     traceDestination
│   ├── trace-panel.constants.ts
│   └── index.ts
├── home/
│   ├── TraceHomePage.tsx
│   └── index.ts
├── chain/
│   ├── components/
│   │   ├── ItemTracePage.tsx            ChainNode, ChainEdge, ChainLegend, ChainAsText in the file
│   │   └── __tests__/
│   ├── hooks/
│   │   ├── useChainLayout.ts
│   │   ├── useChainSelection.ts
│   │   └── __tests__/
│   ├── item-trace.constants.ts
│   └── index.ts
├── gap/
│   ├── GapPage.tsx
│   ├── gap-page.constants.ts
│   └── index.ts
├── issues/
│   ├── components/OpenIssuesPage.tsx    IssueCard in the file
│   ├── open-issues.constants.ts
│   └── index.ts
└── commands/
    ├── TraceCommands.tsx
    └── index.ts
```

```ts
// chain/hooks/useChainSelection.ts
/** The link chosen on the graph, whose quoted words show in its two nodes; null when none is. */
export function useChainSelection(): {
  selectedLinkId: string | null
  select: (linkId: string) => void
  clear: () => void
}
// chain/hooks/useChainLayout.ts
export function useChainLayout(graph: ChainGraph | undefined):
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; positions: Record<string, { x: number; y: number }> }
```

## 10. State and data flow

| State | Where | Name |
|---|---|---|
| The trace, the coverage, the issues, the items, the documents | Query hooks of the entities | `useItemTrace`, `useTraceabilityCoverage`, `useOpenIssues`, `useDocumentList`, `useDocumentOutline` |
| The chain, the attention | Derived, unions with `state` | `useItemChain`, `useProjectAttention` |
| The positions | A cached query of a pure layout | `useChainLayout` |
| The chosen link | `useState` of the page | `useChainSelection` |
| The item a dialog acts on | Pending action stores | `useAddLinkDialogStore` (the source id), `useRemoveLinkDialogStore` (`linkKeyOf`) |
| The form of the add link dialog | `react-hook-form` | `AddLinkFormValues` |
| The text of the target search | `useState`, debounced | `searchText` |
| Whether the agents write | Derived | `useIsProjectWriting` |
| The open rows of the tree | The state of `Tree` | - |

Flow. The user chooses Trace: the side panel loads the coverage, the open issues and the documents; the start page opens. Expanding a document loads its outline (cached with Documents). Choosing an item opens its chain: the trace loads, the graph is derived, elk is loaded once and lays it out; the nodes show their levels from the coverage and the issues already loaded. A click on an edge shows the quotes from the data already there; nothing loads. Add or Remove sends, then the trace module loads again in the background, and the graph, the tree marks and the overview follow; the toast says it.

## 11.1 The look of each part, in the design system

The wireframe fixes the layout; this table fixes the look. Every part is drawn by a component of `shared/components/ui` (or the frame) with the props named here; a color is a tone of `shared/lib/tone`, never a class of its own; an icon is of `lucide-react`. Where the wireframe writes a word or a sign ("(!)", "...", "[pencil]"), the icon of this table is built. Classes are added only to place parts (gap, width, line clamp).

### The levels of attention

| Level | Tone (`attentionLevels`) | Tree mark | Count badge | Node | Edge |
|---|---|---|---|---|---|
| act | `warning` | `CircleAlertIcon` in `ColoredText color="warning"` | `Badge variant="soft" color="warning"` | `Node variant="outline" color="warning"` | `Edge variant="solid" color="warning" weight="strong"` |
| follow | `primary` | `CircleDashedIcon` in `ColoredText color="primary"` | `Badge variant="soft" color="primary"` | `Node variant="outline" color="primary"` | `Edge variant="dashed" color="primary" weight="regular"` |
| none | none | No mark | No badge | `Node variant="outline" color="neutral"` | `Edge variant="solid" color="neutral" weight="thin"` |
| quiet | `muted` | `CircleSlashIcon` in `ColoredText color="muted"` | No badge | `Node variant="outline" color="muted"`, the title in `text-muted-foreground` | `Edge variant="dotted" color="muted" weight="thin"` |

`CircleAlertIcon` is the icon that already says "needs you" (the pending review, the waiting stage). Every icon mark has its meaning as words: the reasons in its `Tooltip`, and the same words in `sr-only`.

### The side panel

| Part | Component and props | Icon | Notes |
|---|---|---|---|
| The feature on the activity bar | `FeatureDestination` of the frame | `WaypointsIcon` | The tab icon of every Trace page is the same (`useTabIcon`) |
| Section headings | `SidePanelSection` with its `title` | - | As Activity and Documents |
| Overview rows | A flat `Tree` with `TreeItem` and `TreeItemLabel`, so the rows hover, select and move with the arrow keys as the tree of Documents | Gap rows: none; "Open issues": `MessageCircleWarningIcon` | The count at the end: `Badge variant="soft"` in the tone of the level of the gap (`actGapKeys` act, the others follow), `color="neutral"` at zero; the description in a `Tooltip` |
| Document rows | `TreeItem` with `TreeItemLabel`; the kind in `text-xs text-muted-foreground`, then the title (`RecordName layout="line"`, no code) | The icon of the display of the document, as the tree of Documents (`documentTabIconName`) | Up to two `Badge variant="soft"`: act (`warning`) then follow (`primary`); no letter |
| Item rows | `TreeItem`, the title only | The tree mark of its level (table above), at the end | The selected row is the item of the trace on screen |
| States | `LoadingState size="compact"`, `ErrorState size="compact"` | - | - |

### The trace page

| Part | Component and props | Icon | Notes |
|---|---|---|---|
| Heading | `h1` `text-2xl font-semibold`, the description in `text-muted-foreground` | - | As the document page |
| The canvas | `Flow` of `shared/components/ui/flow.tsx`, its `Controls` and, from 40 nodes, its `MiniMap` | The zoom buttons of `Controls` | `fitView` on load |
| Legend button | `Button variant="ghost" size="icon-sm"` in a `FloatingSurface` at `top-right` of the canvas, `sr-only` and `Tooltip` "How to read the lines" | `InfoIcon` | Opens a `Popover` with four rows: an `EdgeSample` and the sentence of its level |
| `EdgeSample` | A small `svg` line in the file of the page, drawn with the line styles and weights that `edge.tsx` exports (`edgeLineStyles`, `edgeWeights`) and the tone classes, so the legend and the edges read one source | - | `aria-hidden`; the sentence beside it says the meaning |
| A node | `Node variant="outline"` with the `color` of its level; `NodeHeader` with the kind in `text-xs text-muted-foreground`; `NodeHeaderTitle` with the title, `line-clamp-2`; `NodeContent` with the quote of the chosen link | - | The review status, when not draft: `Badge variant="outline" color="neutral"` with `reviewStatusLabels` in `NodeFooter` |
| The node of the page | The same `Node`, with `data-focus` that adds the `ring-2 ring-primary` of the focus style | - | `aria-current="page"` |
| Node tooltip | `RecordNameTooltip` on the title (kind, title, key) | - | The only place of the key in the graph |
| Node "more" button | `Button variant="ghost" size="icon-xs"` in `NodeHeader`, shown on hover and focus (`opacity-0 group-hover:opacity-100 focus-visible:opacity-100`) | `MoreHorizontalIcon` | `sr-only` "More actions for Layered booking flow"; opens the same `ContextMenu` content |
| An edge | `Edge` with the variant, color and weight of its level; `markerEnd` an arrow (`MarkerType.ArrowClosed` of `@xyflow/react`) in the stroke color | - | Selected: the selected stroke that `Edge` already sets |
| Edge label | `EdgeLabelRenderer` with `Badge variant="outline"` in the tone of the level (`neutral` for none), `variant="soft"` while chosen | `HistoryIcon` before "made from version N" while chosen and out of date | `max-w-32 truncate`, the whole title in its `title` |
| Quoted words | `HighlightMark variant="soft"` with `color={quoteMarkColors.source}` in the source node and `quoteMarkColors.target` in the target node, in a `p text-xs`, as the card of a link (`LinkedItemsPopover`) draws them | - | Only on a side that has words |
| Node menu | `ContextMenu`, `ContextMenuContent`, `ContextMenuItem` with an icon each | "Open" `ArrowRightIcon`; "Open in a new tab" `ExternalLinkIcon` (the icon of Open in the card of a link); "See its trace" `WaypointsIcon`; "Link to another item" `LinkIcon` | A disabled item sits in `DisabledReason` with the lock reason |
| Edge menu | The same | "Show the quoted words" `QuoteIcon`; "Remove this link" `UnlinkIcon`, `variant="destructive"` of `ContextMenuItem` | A `ContextMenuSeparator` before the destructive item |
| The links as a list | `Collapsible` with a `Button variant="link" size="sm"` trigger, `ChevronRightIcon` that turns | `ChevronRightIcon` | Each sentence a `p`; each title a `PageLink` |
| States | `LoadingState`, `ErrorState`, `NotFoundState`, `EmptyState` (`WaypointsIcon`) | - | - |

### The item page and the document page

| Part | Component and props | Icon | Notes |
|---|---|---|---|
| The menu button | `Button variant="ghost" size="icon-sm"`, `sr-only` "More actions", in a `Tooltip` | `MoreHorizontalIcon` | As `ProjectActionsMenu` |
| The menu | `DropdownMenu`, `DropdownMenuContent align="end"`, `DropdownMenuItem` with an icon each | "Edit" `PencilIcon`; "See its trace" `WaypointsIcon`; "Link to another item" `LinkIcon` | A disabled item sits in `DisabledReason` |
| Remove in a chip card | `Button variant="ghost" color="destructive" size="xs"` in the `actions` slot of the card | `UnlinkIcon` | - |

### The gap page and the open issues

| Part | Component and props | Icon | Notes |
|---|---|---|---|
| A row of a gap | `Item variant="outline" size="sm"`: `ItemContent` with `ItemTitle` (the title as a `PageLink`) and `ItemDescription` (the kind, then "in", then the kind and title of the document, `RecordName layout="line"`) | - | No key (decision 3) |
| An issue | `Item variant="outline"`: `ItemHeader` with the kind (`text-xs text-muted-foreground`) and the title as `h3` `text-base font-semibold`; the status `Badge variant="soft" color="warning"` | `ItemMedia` with `MessageCircleWarningIcon` in `ColoredText color="warning"` | - |
| "The problem", "Where it applies", "Between" | `h4` `text-sm font-semibold`, then the text | - | A nested heading at the size of its body, set apart by `font-semibold` |
| A subject | `Item variant="muted" size="xs"`: the kind and the title (`RecordName layout="line"`, no code) as a `PageLink`, the document in `ItemDescription`, the quoted words in `HighlightMark variant="soft" color={quoteMarkColors.target}` | - | - |
| The sides | Each persona as `Badge variant="outline" color="neutral"` | `UserRoundIcon` in the badge | - |
| Actions | `Button variant="outline" size="sm"` "Open", "See its trace" | `ArrowRightIcon`, `WaypointsIcon` | In `ItemFooter` |
| Empty | `EmptyState` | `CircleCheckIcon` | - |

### The dialogs

| Part | Component and props | Icon | Notes |
|---|---|---|---|
| Add a link | `Dialog` with `Form`, `FormField`; `Select` for the kind of link; `Combobox` for the other item, each result `RecordName layout="stacked"` with the key; the preview in `Item variant="muted" size="xs"`; `Textarea` for the note; `PendingButton` | `LinkIcon` in the title | - |
| Remove a link | `ConfirmDialog destructive` | Its default warning sign | - |

## 11. Behavior of each component

### The side panel (`TracePanel`)

| Component | Shows; disabled or hidden | User does | What follows | Focus and keys |
|---|---|---|---|---|
| Trace on the activity bar | `WaypointsIcon`, "Trace" | Click | The side panel; the last Trace page of the tab group, or the start page | As every destination |
| Overview: a gap row | Its title, a count badge in the tone of its level (neutral at zero), its description in the tooltip | Click; double click | The gap page in the preview tab; kept on double click | Arrow keys between rows; Enter opens; `aria-current="page"` on the page on screen |
| Overview: Open issues | "Open issues" and its count | As a gap row | The open issues page | As above |
| Overview loading, error | `LoadingState size="compact" rows={3}`; `ErrorState size="compact"` with Try again | Try again | Loads again | - |
| Documents: a document row | The kind (small, muted) and the title of the document; up to two count badges (act, follow), their meaning in the tooltip ("2 items need your check. 1 item is missing a link or concerned by an open issue."); no letter | Click the chevron or the row; Arrow right and left | Opens or closes its items (loads the outline once) | The keys of `Tree` |
| Documents: an item row | The title; the icon of its level with the reasons in its tooltip; no mark at level none; the item of the chain on screen selected | Click; double click; Enter | Its chain in the preview tab; kept on double click | As above |
| Documents: an outline that fails | One row "The items could not load." with Try again | Try again | Loads again | - |

### The chain page (`ItemTracePage`)

| Component | Shows; disabled or hidden | User does | What follows | Focus and keys |
|---|---|---|---|---|
| The heading and the sentence | "Trace of Layered booking flow", section 12 | - | - | - |
| The legend | Four sample strokes with their sentences (A7) | - | - | - |
| The graph | Nodes and edges laid out (A5); pan, zoom, fit view at load; a minimap from 40 nodes; the item of the page in view and marked | Drag the canvas; the zoom buttons; Ctrl or Cmd with the wheel | Moves and zooms | Tab moves through the nodes in the order of the items, then the edges; the zoom buttons have labels |
| `ChainNode` | Decision 22; the quote of the chosen link on its side | Click; double click; right click, the menu key or "..." | Click: the item page in the preview tab; double click: its chain in this tab; the menu of A9 | Enter is the click; Shift+Enter is the double click; the menu key opens the menu |
| `ChainEdge` | Decision 22; its label; the selected stroke when chosen | Click the edge or its label; right click | Chooses it (decision 23); the menu of A9 | Enter chooses; Escape clears; one link is chosen at a time |
| The menu of a node | "Open", "Open in a new tab", "See its trace", "Link to another item" (disabled with the lock reason through `DisabledReason`) | Choose | As A9; "Link to another item" opens its dialog | Arrow keys; Escape closes and gives the focus back to the node |
| The menu of an edge | "Show the quoted words" (disabled when neither side has words), "Remove this link" (destructive tone, disabled with the lock reason) | Choose | Show chooses the link; Remove opens the confirm | As above, back to the edge |
| The list of the links | A `details` "Read the links as a list", one sentence per link (`linkSentence`), each item a link | Open it; click an item | The item page | Tab through it |
| States | Loading the trace or the layout: `LoadingState`; an error: `ErrorState` with Try again; the item does not exist: `NotFoundState`; no link: the node alone and "This item has no link yet." | Try again | Loads again | - |

### The item page and the document page

| Component | Shows; disabled or hidden | User does | What follows | Focus and keys |
|---|---|---|---|---|
| The menu button | `Button variant="ghost" size="icon-sm"` with `MoreHorizontalIcon`, its name "More actions" in `sr-only` and in its tooltip, where Edit was; hidden in edit mode | Click; Enter; the menu key | Opens the menu | The first item takes the focus |
| The menu of an item | "Edit" (`PencilIcon`, disabled with the lock reason), "See its trace" (`WaypointsIcon`), "Link to another item" (`LinkIcon`, disabled with the lock reason; hidden for a kind from which no link starts) | Choose | Edit: the edit mode, as S1b; See its trace: the trace page in the preview tab; Link to another item: the dialog | After the edit mode ends, the focus goes to the menu button |
| The menu of a document | "Edit" | As above | As above | As above |
| The card of an outgoing chip | Its words of S1b, then "Remove this link" in the destructive tone, disabled with the lock reason | Click | The confirm | - |

### Link two items (`AddLinkDialog`)

| Component | Shows | User does | What follows | Focus and keys |
|---|---|---|---|---|
| The dialog | Title "Link Layered booking flow to another item"; the description of section 12 | - | - | The focus goes to the kind of link |
| Kind of link | `Select` of the titles of `linkTypesFrom`; the first is chosen | Choose | The search starts again for its target kinds; a chosen item of another kind is cleared | - |
| Other item | `Combobox`: typing searches (250 ms after the last key); each result `RecordName layout="stacked"` (kind over title, key last: a user may search by key); at most 20, then "Type more words to narrow the results."; none: "No item matches these words." | Type; Arrow keys; Enter | Chooses it | Escape closes the list |
| The preview | Once both are chosen, the sentence of the link (`linkSentence`, section 12) | - | - | - |
| Note | `Textarea`, optional, at most 500 characters, a counter from 400 | Write | - | - |
| "Add the link" | `PendingButton` | Click; Enter in a field once both are chosen | Checks on submit, then on each change (the focus to the first wrong field); sends; success: the toast, the dialog closes; failure: the message on its field or under the form, the dialog stays | Closing is blocked while sending; afterwards the focus goes back to the button or the node that opened it |
| Cancel, Escape | - | - | Closes without asking | As above |

### Remove a link (`RemoveLinkDialog`)

| Component | Shows | User does | What follows | Focus and keys |
|---|---|---|---|---|
| The dialog | `ConfirmDialog destructive`, the title and the sentence of section 12, "Remove the link" | Confirm; Cancel; Escape | Confirm: sends; success: the toast, the edge or the chip leaves after the reload; failure: the toast, the dialog stays | The focus starts on Cancel; after it closes, it goes to the source node (graph) or to the link line (item page) |

### A gap and the open issues

| Component | Shows | User does | What follows | Focus and keys |
|---|---|---|---|---|
| `GapPage` | Decision 17; empty: "No item is in this list now." | Click a row | The chain of the item in the preview tab | Tab through the rows |
| `OpenIssuesPage` | Decision 18 | Click "Open", "See its trace", a subject | The item page; the chain; the page of the subject | Tab through the cards |

## 12. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| The start page and the panel | The overview and the tree of the mentor platform | `/projects/90aa0000-0000-4000-8000-000000000001/trace` |
| The chain of an item | The graph of `AR-003` with both walks | `.../trace/items/<AR-003 id>` |
| An out of date link | A strong warning edge, "made from version N" when chosen | The chain of `AR-007` |
| An open issue in the chain | A dashed primary edge from the issue | The chain of an item that a conflict concerns |
| A link chosen | Its quotes in both nodes | Click a "Based on" edge of `AR-003` |
| Chain error, loading | The states | `?mock-traces=error`, `=loading` |
| A gap | Its items | `.../trace/gaps/no_backlog_item` |
| No item in a gap | The empty line | `?mock-traceability=empty` on a gap page |
| The open issues | The cards with problem and quotes | `.../trace/issues` |
| Issues error | The state | `?mock-trace-links=error` on the issues page |
| Add a link allowed | The dialog | The menu of `AR-003` while the analysis waits for review (default) |
| Add a link locked | Disabled with the reason | `?mock-run-status=running` |
| Add fails, remove fails | The message, the toast | `?mock-create-trace-link=error`, `?mock-delete-trace-link=error` |

Words. Basic formal English; descriptions are full sentences; items by kind and title, the key last.

```ts
export const tracePanelMessages = {
  title: 'Trace',
  overview: 'Overview',
  documents: 'Documents',
  openIssues: 'Open issues',
  actCount: (count: number) => `${String(count)} ${pluralForm(count, { one: 'item needs', other: 'items need' })} your check.`,
  followCount: (count: number) => `${String(count)} ${pluralForm(count, { one: 'item is', other: 'items are' })} missing a link or concerned by an open issue.`,
  itemsLoadError: 'The items could not load.',
} as const

export const traceHomeMessages = {
  title: 'Trace',
  description: 'Every requirement is linked to the words of the interviews that it comes from, and to the user stories that are built from it.',
  choose: 'Choose an item in the side panel to follow where it comes from and what was built from it.',
} as const

export const itemTraceMessages = {
  title: (itemTitle: string) => `Trace of ${itemTitle}`,
  description: 'The items on the left are what this item is based on, down to the interviews. The items on the right were built from it.',
  legendButton: 'How to read the lines',
  legend: {
    act: 'The item it is based on changed after the link was made. Check that both still agree.',
    follow: 'The link comes from an open issue that is not settled yet.',
    none: 'The link needs nothing from you.',
    quiet: 'The link touches an item that was rejected or replaced.',
  },
  madeFrom: (version: number) => `made from version ${String(version)}`,
  noLink: 'This item has no link yet.',
  asList: 'Read the links as a list',
  menu: {
    open: 'Open',
    openInNewTab: 'Open in a new tab',
    seeTrace: 'See its trace',
    showQuotes: 'Show the quoted words',
    more: (itemTitle: string) => `More actions for ${itemTitle}`,
  },
  loading: 'Loading the trace',
  loadError: 'The trace could not load.',
} as const

export const gapPageMessages = {
  empty: 'No item is in this list now.',
  notFound: { title: 'This list is not shown anymore.', description: 'The project no longer has this kind of gap.' },
  /** Before the name of the document, which `RecordName` draws: its kind small and muted, then its title. */
  inDocument: 'in',
} as const

export const openIssuesMessages = {
  title: 'Open issues',
  description: 'Each issue is a question that the agents could not settle alone. Each card says what the problem is, where it applies, and which words of the requirements it is about.',
  problem: 'The problem',
  whereItApplies: 'Where it applies',
  between: 'Between',
  open: 'Open',
  seeTrace: 'See its trace',
  empty: {
    title: 'No issue is open.',
    description: 'The agents record an issue when the interviews disagree, when a need is not clear, or when a check finds a problem.',
  },
} as const

export const addLinkMessages = {
  open: 'Link to another item',
  title: (itemTitle: string) => `Link ${itemTitle} to another item`,
  description: 'A link records that this item is based on another item, or that it is about another item. The agents read the links when they work again.',
  linkType: 'Kind of link',
  target: 'Other item',
  targetPlaceholder: 'Search by words of the title or by key',
  moreResults: 'Type more words to narrow the results.',
  noResults: 'No item matches these words.',
  note: 'Note',
  noteHint: 'Optional. Say why the two items are linked.',
  noteTooLong: `Write at most ${String(noteMaxLength)} characters.`,
  chooseLinkType: 'Choose the kind of link.',
  chooseTarget: 'Choose the other item.',
  add: 'Add the link',
  adding: 'Adding the link',
  added: 'The link is added.',
  notAdded: 'The link was not added.',
} as const

export const removeLinkMessages = {
  open: 'Remove this link',
  title: 'Remove this link?',
  /** "Layered booking flow will no longer be based on Students book a session at once. ..." */
  description: (sentenceAfterRemoval: string) =>
    `${sentenceAfterRemoval} The link leaves the graph, the lists and the pages of both items.`,
  remove: 'Remove the link',
  removed: 'The link is removed.',
  notRemoved: 'The link was not removed.',
} as const

export const itemActionsMessages = {
  more: 'More actions',
  edit: 'Edit',
  seeTrace: 'See its trace',
} as const
```

`linkSentence(source, linkType, target, { tense })` (`trace/entities/links/trace-links.utils.ts`) writes one sentence of a link with the titles of both items: "Layered booking flow is based on Students book a session at once." (`tense: 'now'`), "... will be based on ..." (the preview), "... will no longer be based on ..." (the removal). It reads the title of the link type through `lowerFirst` when that title reads after "is" (`sentenceLinkTypes`, version 1: `derived_from`, `evidenced_by`, `stated_by`, `resolved_by`); for the others it writes "Layered booking flow has the link Concerns with Students book a session at once." until the definition gives a sentence form (section 16).

## 13. Mocks and screenshots

- S4.2, commit 1: `trace-links.handlers.ts` answers `POST` and `DELETE` with `409 invalid_state` unless the artifact of the source item may change, through `refuseOutsideReview(projectId, artifactId)` of `mocks/artifacts/artifacts.problems.ts`; the gaps of the mock take the titles and descriptions of S4.D. Tests in `mocks/trace/__tests__/`.
- The fixtures hold what the states need: chains with both walks from `AR-003`, the out of date link of `AR-007`, open ambiguity issues and a conflict with `involves` links to two personas and `concerns` links with `target_quote` (`mentor-platform-trace-links.fixtures.ts`). Check that the conflict has its `involves` links; if not, add them in commit 1, with the quote of each side.
- `README.md` of the mocks: the addresses of section 12.
- Screenshots in `tests/screenshots/projects/trace.spec.ts`: the start page with the panel; the chain of `AR-003`; the chain with a link chosen; a node menu open; the open issues; a gap; the add link dialog with a preview; the item page with its menu open.

## 14. Tests

| File | Cases |
|---|---|
| `workflow/entities/definition/__tests__/link-types.utils.test.ts` | `linkTypesFrom` for each kind of version 1; `issueLinkTypesOf` |
| `trace/entities/graph/__tests__/attention.utils.test.ts` (+ data) | `linkAttention` and `itemAttention` for each level and the order of the rules; the reasons |
| `trace/entities/graph/__tests__/trace-graph.utils.test.ts` | `chainGraphOf`: words, levels, quotes on their side, the focus, a link to an item that is not in the trace left out |
| `trace/entities/graph/hooks/__tests__/useGraphQueries.test.ts` | `useItemChain` states and `notFound`; `useProjectAttention` |
| `trace/entities/issues/...` | `openIssueEntries`: subjects with quotes, the sides of a conflict, closed issues left out, kind order; `useOpenIssues` reads every page |
| `trace/entities/links/__tests__/trace-links.utils.test.ts` | `linkKeyOf`, `parseLinkKey`, `linkSentence` in three tenses and for a type without a sentence form |
| `shared/lib/graph/__tests__/layout.utils.test.ts`, `shared/components/ui/__tests__/edge.test.tsx` | Positions for a chain and a lone node; elk loaded once; the three weights |
| `project/entities/run-status/hooks/__tests__/useProjectRunResult.test.ts` | `useIsProjectWriting` |
| `artifact/features/edit/components/__tests__/EditRecordMenuItem.test.tsx` | The lock; the edit mode; the focus back to the menu button |
| `trace/features/add-link/...`, `remove-link/...` | `itAsksForFieldsBeforeSending`; `itAsksBeforeAction`; `itToastsOnResult`; the body; a `422` on its field; the lock; both menus |
| `traceability/widgets/panel/...` | `itShowsQueryStates`; the gap rows and counts; the tree marks without letters; a click opens the chain; `aria-current` |
| `traceability/widgets/chain/...` | `itShowsQueryStates`; nodes by kind and title with the key last; edge looks by level; choosing an edge shows the quotes and Escape hides them; node and edge menus with the lock; click and double click; the list of sentences; `expectNoAccessibilityViolations` |
| `traceability/widgets/gap/...`, `issues/...` | States; the rows; the cards with the problem, the quotes and the sides |
| `documents/widgets/item/...`, `document/...` | The menu button in place of Edit; its items; hidden in edit mode; the Remove in an outgoing card only |

Helpers: `renderTraceScreen(page, { pathname, scenario })` over `renderWorkbench` in `test/render/render-trace-screen.utils.ts`, read by the panel, chain, gap and issues tests; `traceWith({ items, links })` in `trace/entities/graph/__tests__/trace-graph.utils.data.ts`, read by the entity and the chain page tests.

## 15. Docs to update

| Doc | Change | Where |
|---|---|---|
| `docs/API.md` editing rule, `GET /items/{item_id}/trace`, Coverage body; `docs/DATA_SHAPE.md` TraceLink | A1 (a link changes with the document of its source); A2 (`both` is two walks that never turn); A6 (the gap titles and descriptions in the words of the user) | S4.D |
| `docs/ui/usability.md` 2, 4, 5.1, a new 7.8 Trace, open point 12 | The answers of A3 to A12 | `frontend-plan`, before S4.2 |
| `docs/ui/skeletons.md` 8 | Trace as built; the matrix in the developer view, later | `docs` commit of S4.3 |
| `docs/architecture/web-app-modules.md` 2, 9 | The module `traceability`, the topics `graph` and `issues` of `trace`, the features of the links | `docs` commit of S4.3 |
| `docs/architecture/web-app.md` 6, 9 | The chain, the attention of links and items, the actions | `docs` commit of S4.3 |
| `frontend/README.md`, Words of the screens | A link is a link in both views; an item names itself by its kind and title, the key optional and last (A4, decision 3) | `docs` commit of S4.3 |
| `frontend/src/mocks/README.md` | Section 12; the refusal of a link change outside a review | S4.2 / 1, the `docs` commit of S4.3 |
| `docs/frontend-implementation-plan.md` | Rows S4.D to S4.3 | `frontend-plan` |

## 16. Left for the next PRs

| Item | Where |
|---|---|
| The traceability matrix, in the developer view only: the table of the matrix endpoint, filtered by a gap or to the incomplete chains, with the cells by kind and title and the key last | A later PR after S4.3, not a priority (the user, 2026-11-07) |
| Quotes chosen by hand when two items are linked | A later PR of `add-link`, with a selection of words in the fields of both items |
| A sentence form of every link type in the definition, so that "Concerns" and "Flags" read as sentences | A docs PR of the definition, then `linkSentence` reads it |
| Editing the note of a link | When the API has `PATCH /trace-links/{id}` |
| Linking by dragging from a node to another | After tests show that users look for it |
| The trace of an item in the bottom panel of the developer view | S6 |

## 17. Commits and checks

S4.D (`docs/fe/trace-link-changes`): one commit, the title of its row.

S4.0 (`chore/fe/maintenance-before-trace`):

1. `refactor(trace): move the graph of a trace to the entity` (`git mv` alone)
2. `fix(frontend): name an item by its kind and title, with its key last`

S4.1 (`feat/fe/trace-screen-entities`):

1. `build(lint): add the module traceability, and the topics graph and issues of trace`
2. `feat(workflow): read the link types that start at a kind and those of an issue`
3. `feat(trace): read the chain of an item as a graph, with the attention of its items and links`
4. `feat(trace): read the open issues with their problem, their quoted words and their sides`
5. `feat(trace): search the items to link, write a link as a sentence, and follow the agents while they write`
6. `feat(project): tell whether the agents of a project write, and reload the trace when they stop`
7. `feat(shared): lay out a graph in layers, and give an edge a weight`
8. `feat(routes): add the pages of Trace`

S4.2 (`feat/fe/trace-links`):

1. `feat(mocks): refuse a change of a link outside a review, and name the gaps in the words of the user`
2. `feat(edit): edit a record from a menu`
3. `feat(trace): link two items and remove a link, each in its dialog`
4. `feat(app): mount the dialogs of the links in the layout of a project`
5. `feat(documents): gather the actions of an item and of a document in one menu`

S4.3 (`feat/fe/trace-screen`):

1. `feat(traceability): show the overview and the tree of the documents in the side panel`
2. `feat(traceability): show the chain of an item as a graph, with its menus and its quoted words`
3. `feat(traceability): show the items of a gap`
4. `feat(traceability): show the open issues with their problem and where they apply`
5. `feat(traceability): add the start page and the commands of Trace`
6. `feat(app): put Trace on the activity bar, with its pages`
7. `test(screenshots): cover Trace`
8. `docs: describe Trace, its module and the links made by hand`

Files that two commits change: `trace/entities/index.ts` (S4.1 commits 3, 4, 5); `app/.../layout.tsx` (S4.2 / 4, S4.3 / 6). With S2b: `RecordName`, `lowerFirst` and `listSentenceParts`: the PR that merges second takes them from the first. The plan, the wireframe and the prompt stay on `frontend-plan`.

Checks, one at a time, for each PR: ESLint and Prettier on the changed files; Vitest on the touched folders; typecheck once (a new module, routes, props). No full suite, E2E, screenshots or build locally. Then `grep -nP '[^\x00-\x7F]'` on the diff, a search for `console.log`, and the grep that answers nothing when the components of the widgets hold no rule:

```sh
git diff --name-only | grep -E 'modules/traceability/.*/components/' | xargs grep -nE 'useQuery\(|useMutation|link_type ===|review_status ===|isOpenIssue|isLinkOutOfDate|canLinkTypeConnect'
```

## 18. Checklist

- [x] A1, A2, A6 answered by the user (2026-11-07); S4.D committed on `docs/fe/trace-link-changes` (`4a84de16`)
- [ ] S4.D pushed, its PR opened and merged (the user); the server repository follows it (the lock of a link, the two walks of `both`, the words of the gaps)
- [ ] A3 to A12 confirmed or changed, and written in `docs/ui/usability.md` on `frontend-plan` (a new 7.8 Trace) before S4.2
- [ ] S2a merged; this plan checked again against `main`: `trace/entities` by topic, `trace/widgets/graph`, `ItemKeyLine`, `ItemLinkLine`, `LinkedItemsPopover`, `useEditLockReason`, `ProjectRunStreams`, `moduleImports`
- [ ] The order with S2b settled for `RecordName`, `lowerFirst` and `listSentenceParts`
- [ ] Each commit of section 17 checked alone
- [ ] Each row of section 11 checked once in `pnpm dev:mock` (one dev server, one page at a time, stopped after): the panel and the tree, the chain of `AR-003` and of `AR-007`, a chosen link, both menus, add and remove a link with and without the lock, the gap, the open issues, the menu button
- [ ] Each PR opened as a draft, its description written from this plan; the endpoints it lists checked against the `*.api.ts` functions that the hooks call
