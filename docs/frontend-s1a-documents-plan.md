# Frontend S1a: the documents, a document and an item

The plan of the PR S1a of the [Frontend implementation plan](frontend-implementation-plan.md), the first of the four PRs of the screen Documents (S1), written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md). An agent implements from it; every decision is made.

Short paths: `documents/...` is `frontend/src/modules/documents/...`, `artifact/...`, `workflow/...`, `run/...`, `review/...`, `project/...` the same under `frontend/src/modules/`, `shared/...` is `frontend/src/shared/...`, `mocks/...` is `frontend/src/mocks/...`, `test/...` is `frontend/src/test/...`, `app/...` is `frontend/src/app/...`, `lint/...` is `frontend/lint/...`.

## Contents

1. [Row in the PR table](#1-row-in-the-pr-table)
2. [What was read](#2-what-was-read)
3. [Decisions](#3-decisions)
4. [Scope](#4-scope)
5. [Naming](#5-naming)
6. [Shared code first](#6-shared-code-first)
7. [Changes to existing modules](#7-changes-to-existing-modules)
8. [The slices, file by file](#8-the-slices-file-by-file)
9. [State and data flow](#9-state-and-data-flow)
10. [Screen states and words](#10-screen-states-and-words)
11. [Mocks and screenshots](#11-mocks-and-screenshots)
12. [Tests](#12-tests)
13. [Docs to update](#13-docs-to-update)
14. [Left for the next PRs](#14-left-for-the-next-prs)
15. [Commits and checks](#15-commits-and-checks)
16. [Checklist](#16-checklist)

## 1. Row in the PR table

| | |
|---|---|
| Branch | `feat/fe/documents`, from `origin/main` once B1 (#54) is merged |
| Title | `feat(frontend): show the documents of a project, a document and an item in tabs` |
| Needs | E0 (#37), E1 (#38), E4 (#42), E5 (#43), E6 (#45), P7 (#49), all merged; B1 (#54) for the project layout it changes too |
| After it | S1b `feat/fe/edit-artifacts`: edit an item and an artifact, the history with restore, Source, Based on and used by, the `!` mark. S1c `feat/fe/item-peek`: the right panel of the frame and the peek. S1d `feat/fe/export`: export a document. Then S2 to S6 |
| Docs-first | The answers of the user of 2026-11-01 (decision 1) go to the local copy of `docs/ui/usability.md`, which git excludes, so no commit carries them. The module `documents` changes Web App Modules and `moduleImports` in the first commits (decision 2). The API needs nothing new: the item page uses the id, as every path of the API does |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| Implementation plan, sections 4, 8, 9, 10, 11 | S1 is "the side panel of documents with the outline, the document tab, the item page and peek", module `artifact`, features `edit`, `restore`, export; no copy from `feat/fe/mock` |
| `docs/ui/usability.md` 5.1 to 5.6, 6.4, 7.4, 8.1, 8.3, open points 1, 6, 7, 8 | The list of documents built from the definition; the marks `(>)`, `(!)`, `(v)`, `( )`; the outline under the open document, its counts and marks; the item page with breadcrumb, position, Previous and Next, `J` and `K`; the preview tab; the sizes of the user view; the user words |
| `docs/ui/documents-tree-reference.png` (given by the user on 2026-11-01, renamed from `image.png`) | The tree of the side panel: lines that guide each level, a color and a variant for the status of each row, a tooltip with the location and the status in full text, a summary of the statuses |
| `docs/ui/skeletons.md` 5, 6 | The document drawn by `x-ui-display`; the item fields in `x-ui-field-order` with a breadcrumb |
| `docs/architecture/web-app.md` 6 | The five displays; `contentFields`; a field without a title reads its name |
| `docs/architecture/web-app-modules.md` 2 to 9 | A block of one object goes to its entity; a block that reads several modules goes to the highest one or to a module of its own above them, as `activity`; `@x` files; topics |
| `docs/API.md`, artifacts and items | Paths use ids, the key is for display; `GET /artifacts/{id}/items` in outline order with `outline_number` and `depth`; superseded and deleted items; `artifact_created` and `artifact_delta` events |
| `docs/schemas/*` | The displays and the title fields of the 7 artifact kinds and 12 item kinds: every artifact is `document`; `section` is `heading`; `persona` is `cards`; `interview_message` is `transcript` with `turn`, `role`, `content`; the rest are `table` |
| `main` (`bd1a54b`) | `artifact/entities` (queries, keys, `itemHierarchy`, `reviewStatusLabels`, `useItemSchema`); `workflow/entities` (`contentFields`, `summaryFields`, `itemTitle`, `contentDisplayOf`, `useArtifactKinds`, `useWorkflowDefinition`, `findValueList`); `run/entities/events` (`useRunStatusEvents`, the reducer that ignores the artifact events); `review/entities` (`usePendingInterrupt`, `review_artifacts`); `project/entities` (`useProjectRunResult`); the frame (destinations, `useOpenPage`, `useEditorTab`, the preview tab, `SidePanel`, `useCommands` with hotkeys); `shared/components/ui/tree.tsx` (Origin UI, on `@headless-tree`), used only by the design system; no feature on the activity bar of a project yet |
| `reui.io/r/c-tree-2.json`, `reui.io/r/tree.json` | `c-tree-2` is a usage example of the reui tree, which is the same Origin UI component as `tree.tsx` with Base UI in place of Radix; the guides are one class on `Tree`: a repeating gradient that draws a line every `--tree-indent` |
| `origin/feat/fe/mock`, `features/artifacts/` | A reference for the tree, the document and the item page of the old frame (about 2000 lines); nothing is copied |
| Skills `feature-sliced-design`, `clean-review` | Placement by object; composition from the layer above; no rule in a widget |

## 3. Decisions

1. **Answers of the user (2026-11-01).** Written in the local copy of `docs/ui/usability.md`:
   - S1 is cut in four PRs: S1a this plan, S1b edit and restore, S1c peek, S1d export.
   - The item page has the id of the item in its address (open point 7 closed: "by `id`, as every path of the API").
   - The artifact kinds without an artifact are listed, muted, while the project has an unfinished run, and hidden once it has none (open point 1 closed, the proposal).
   - A document without sections groups its items by item kind in the order of the definition (open point 8 closed: no rule in the web app; a change of order is a change of the definition).
   - A click on a document in the tree opens the whole document in a tab; a click on an item opens the item in a tab of its own (already 5.4; no change).
   - The tree of the side panel follows `documents-tree-reference.png`: a line guides each level; a state shows as the color of the title and one letter at the end of the row, no icon, and only for the states that ask something of the user or change while the user looks (decision 9a); the marks `(>)`, `(!)`, `(v)`, `( )` and the `*` of 5.3 become these colors and words; a tooltip on each row gives its location and its state in full text; a footer of the side panel counts only what needs the attention of the user in the open document (decision 13). Add these to 5.3, and the reference image as a link.
   - Previous and Next of the item page float over the page at its bottom right, show while the user acts and hide after a moment without action (decision 11a); the skeleton of 7.4 changes from the breadcrumb line to this. 
2. **A module `documents`, above `project`.** Documents is a feature of the activity bar, a subject of the product as Activity is (Web App Modules, section 9), and its side panel reads `workflow` (the kinds, their order and titles), `artifact`, `run` (the artifacts that a step writes), `review` (the artifacts under review) and `project` (whether the project has an unfinished run). `moduleImports` gets `documents: ['workflow', 'artifact', 'trace', 'run', 'review', 'thread', 'project']`; `trace` is listed now for S1b. S1b, S1c and S3 add their widgets to this module. The implementation plan names `artifact` as the module of S1 and S3; it changes in the docs commit.
3. **What goes where.** Each piece in the module of its object, at the lowest layer:

   | Piece | Where | Why |
   |---|---|---|
   | The title of a value of a value list, and the component that shows the value of a content field | `workflow/entities` (`content-fields`, `components/`) | A content field is an object of `workflow` |
   | The outline of an artifact (sections, groups by kind, transcript turns, field headings, counts), the status of an item and its look, the counts of the statuses, the blocks of a document | `artifact/entities` | Rules that read the items of one artifact and the kinds |
   | The view of a document and the view of an item, without actions | `artifact/entities/components/` | A block of one object goes to its entity (Web App Modules, section 2); S1b and S1d add their actions in the widgets that place these views |
   | The artifacts that the node in progress writes, from the event stream of a run | `run/entities/events` | The life of a stream goes to the entity of its object; the module above gives its reaction as a callback |
   | The list of the documents of a project and the mark of each | `documents/entities` | A document is one artifact or the group of the artifacts of one kind, built from four modules |
   | The tree, the summary, the destination | `documents/widgets/panel` | The block of the side panel |
   | The page of a document, the page of an item | `documents/widgets/document`, `documents/widgets/item` | They place the views of `artifact` with the tab, the scroll, Previous and Next; S1b adds Edit, S2 the review bar |

4. **No new `@x` for widgets.** The widgets of `documents` read the entities of the modules below through their `index.ts`. The entities of `documents` read the entities below through new `@x/documents.ts` files in `workflow`, `artifact`, `run`, `review` and `project`, each exporting only what `documents/entities` reads (section 7).
5. **The tree is `shared/components/ui/tree.tsx`, with guides.** The reui component is the same component on Base UI, and `c-tree-2` adds only a class, so nothing is installed: no `@base-ui/react`, no second tree. `Tree` gets a prop `guides`; when it is set, `Tree` adds the class of `c-tree-2` (`relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(...)]` with `var(--border)` and `var(--tree-indent)`) in `tree.tsx` itself. `app/styles.css` does not change: CONTRIBUTING and the ESLint group `bracketClasses` forbid a value in brackets outside `src/shared/components/ui/`, and allow it inside, where the shadcn components keep theirs. The panel writes `<Tree guides>`, with no class of its own.
6. **Rows of the tree.** One `Tree` holds the documents, the groups, and the outline of the open document under its row:
   - The start of a row holds its chevron, or the room of one for a leaf, so that the titles of one level line up; the end holds, right-aligned, a count, then the letter of the state.
   - A document row: its title in the color of its mark, then for a group the count of its documents, then the letter of its mark (decision 9a).
   - A section or a group of items: chevron, outline number and title, then the count of the items under it while collapsed; while collapsed, its title takes the color of the highest level under it (decision 9a).
   - An item row: the title of the item in the color of its status, then its letter, only for a state that has one (decision 9a).
   - A field heading row, for an artifact without items (the elicitation plan).
   - A turn row, for a transcript: the first message of each `turn`, the question of the interviewer.
   - Every row has a tooltip: the location (the titles from the document down to the parent of the row, joined by " > ") and the status in full text ("Approved, version 3", "Waiting for your review").
   - Single click opens the page in the preview tab, double click keeps it (`useOpenPage`, `{ keep: true }`); a group or a section only expands and collapses. Arrows, Enter and the type-ahead come from `hotkeysCoreFeature`.
   - Expanded at the start: every group and section of the open document, and the groups of documents. The state lives in the tree instance of the panel (`useTree`), not stored.
7. **Routes and tabs.**
   - `routes.project(id).documents()` is `/projects/{id}/documents`, the start page of the feature: an empty state that asks to choose a document.
   - `routes.project(id).document(artifactId)` is `/projects/{id}/documents/{artifactId}`; its tab has the id `document:<artifactId>`, the title of the artifact, and the icon `documents.review` while the document waits for the review of the user, else `documents.document`.
   - `routes.project(id).item(itemId)` is `/projects/{id}/items/{itemId}`, independent of the artifact, so that a reference to an item from a message or a review opens it; its tab has the id `item:<itemId>`, the title of the item, and the icon `documents.item`. The destination lists `/projects/{id}/items` in `paths`.
8. **The mark of a document** (`documentMark`), in this order: `writing` when the node in progress wrote it; `review` when the pending interrupt lists it in `review_artifacts`; `approved` when its `review_status` is `approved`; `notStarted` for a kind or a subject without an artifact; else `draft`. A group takes the first of `writing`, `review` that one of its documents has, else `approved` when all are, else `notStarted` when it has no document, else `draft` (`groupMark`). The looks are in `documentMarkLooks` (decision 9a).
9. **The status of an item** (`itemStatus(item, issueKinds)`), the first that holds: `openIssue` when `isOpenIssue(item, issueKinds)` of `workflow` holds (a disagreement or an unclear point still to settle); `edited` when `updated_by.actor` is `user` and `review_status` is `draft` (the user changed it and no review has seen the change); else its `review_status`: `draft`, `approved` or `rejected`. Superseded items never reach the tree or the document (the outline drops them).
   - What it asks of the user depends on its document: `attentionLevel(status, { isUnderReview })` (decision 9a), where `isUnderReview` is true when the mark of the document of the item is `review`. The item page always writes the full label in its key line, in the color of its level.
   - Labels: `reviewStatusLabels` in the view of the app for `draft`, `approved`, `rejected`; "Edited by you" for `edited`; "Open" for `openIssue`. Read through `useItemStatusLook(status)`, as `useRunStatusLook`.
   - The issue kinds come from `useIssueKinds()` of `workflow`, which `useOutlineItems` reads with the kinds.
9a. **Ordered by attention, not by meaning** (answers of the user of 2026-11-01). The color says how much the row asks of the user now; one letter at the end of the row says which state, as the `M`, `U` and `D` of the explorer of VS Code, and only where the color alone would leave a doubt. No icons, as the explorer of VS Code. Three levels and a muted one:

    | Level | Color (tone) | Document rows | Item rows |
    |---|---|---|---|
    | `act`: the user is asked to act now | `warning` | `review`, letter `R` | In a document under review: `openIssue`, letter `?`; `draft`, color only (to read before approving) |
    | `follow`: it changes, or the user changed it, and a review will see it | `primary` | `writing`, letter `W` | `edited`, letter `E`, in any document |
    | `none`: nothing to do | none | `approved`, `draft` | `approved`; `draft` and `openIssue` in a document that is not under review: the run is working on it or has moved on, and the user cannot act on it outside a review |
    | `quiet`: not there, or set aside | muted (`text-muted-foreground`) | `notStarted` | `rejected`, letter `X` |

    - The letter is one character in `font-mono text-xs`, in a column of fixed width at the end of the row, so that the letters of all rows line up and the titles truncate before them. Each letter is distinct (`W`, `R`, `E`, `?`, `X`); `R` is the review, so the rejected item takes `X`, the sign of a refusal, and the open issue `?`, a question still to settle. The letter is `aria-hidden`: the row carries its label for assistive technology, and the tooltip gives it in full, which the user reads to learn a letter.
    - A draft stands out only when the user can act on it: while its document waits for the review of the user. Outside a review a draft is the work of the agents in progress, so coloring it would color most of the tree and nothing would stand out.
    - The drafts of a document under review get the color without a letter: the document row already shows `R`, and a letter on each of 24 rows would hide the few `?`.
    - Rejected is muted, not red: it asks nothing of the user, the agents redo it. Red stays for errors.
    - The colors are the tones of `@/shared/lib/tone`, which keep their contrast in light and dark; the chart colors are not used, since they name series, not levels.
    - The tooltip of every row gives the state in full ("Waiting for your review", "To read before you approve", "Edited by you, not reviewed yet", "Approved, version 3"), so a row without a color or a letter still tells its state on demand.
    - A collapsed section or group takes the color of the highest level under it, without a letter; its tooltip counts the items of that level ("3 to read, 1 open").
    - The tab of a document under review keeps the tab icon `documents.review` (`CircleAlertIcon`, tone `warning`), since a tab shows an icon and no color.
    - `attentionLevels` (`artifact/entities/constants/item-status-looks.constants.ts`) gives each level its tone and its order (`act`, `follow`, `none`, `quiet`); `itemStatusLooks` and `documentMarkLooks` give each state its letter (or null) and its label. `useItemStatusLook(status, { isUnderReview })` and `useDocumentMarkLook(mark)` return `{ level, tone, letter, label }`.

10. **The order and the parts of an artifact.**
    - The items load whole: `useOutlineItems(artifactId)` reads every page of `useArtifactItems(artifactId)` (200 each), drops the superseded ones, and returns a union with `state`.
    - `artifactOutline` builds the nodes of the tree: sections nest by `parent_item_id`; under a parent, the items that are not sections group by kind, in the order of `item_kinds` of the defined artifact kind, each group named by the `title` of the item kind schema; a kind whose display is `transcript` gives one row per `turn`; an artifact without items gives one row per filled field of its content.
    - `documentBlocks` builds the parts of the document page in the same order: a heading for each section (its depth gives `h2` to `h5`), a group heading with its count for each group, and one block per run of items of one kind drawn by the display of the kind: `table` (columns `summaryFields`, the title field a link to the item page), `cards` (one card per item with `summaryFields`), `transcript` (each message with its role and its text).
    - The document and the outline draw every item with the current schema of its kind. An item written with an older schema is drawn with its own schema on its item page (`useItemSchema`); a field that the current schema lacks does not show in the table of the document. Said in the JSDoc of `documentBlocks`.
11. **The item page of S1a.** The first line holds the breadcrumb (the document, then each section above the item, links). Below it: the title, a line with the key, the status label in the color of the state and the version, then every filled field in `x-ui-field-order`, the label above the value, lists as lists. Empty fields are hidden. No Edit, Source, links or history (S1b). The page container is `relative`, so that the navigator of decision 11a floats over it.
11a. **Previous and Next float over the page** (`ItemNavigator`, answer of the user of 2026-11-01). A `FloatingSurface` (`corner="bottom-right"`, `variant="glass"`, `size="sm"`) holds the position "3 of 18" in the order of the outline across sections, then two icon buttons, Previous (`ChevronLeftIcon`) and Next (`ChevronRightIcon`), each with its label and a tooltip with its hotkey ("Previous item (K)"); Previous is disabled on the first item, Next on the last. It sits apart from the document and stays at its corner while the page scrolls.
    - It shows when the page opens, and again on a move of the pointer over the page, a scroll, a touch or a key press; it hides after `navigatorIdleMs` (2500 ms) without any of them. It stays while the pointer is over it or the focus is inside it.
    - Hidden, it fades out (`opacity-0`, `pointer-events-none`, no transition under `motion-reduce`) but stays in the page and in the order of Tab: the focus that reaches a button shows it, so a keyboard user never meets a hidden control. `J` and `K` work while it is hidden, and show it with the new position.
    - The state lives in `useShownWhileActive(ref, idleMs)` of the slice: a timer and the listeners of the page container, which the cleanup removes with the timer. One reader, so it stays in `documents/widgets/item/hooks/`.
    - S2 places the review bar at the bottom of the item pages of a document under review; the navigator then sits above the bar (section 14).
12. **Previous and Next stay in the tab.** The frame gets a generic option: `useOpenPage()(href, { inPlace: true })` opens the page in the tab on screen. The store keeps `replaceNext: { href, tabId }`, as it keeps `keepNext`, and `openTab` puts the new tab in the place of `tabId`, kept or preview as that tab was. Previous and Next of the navigator call it, and palette commands `documents.nextItem` (`J`) and `documents.previousItem` (`K`) registered by the item page with `useCommands`.
13. **The footer counts what asks something of the user**, in the open document: the items of level `act`, then `follow`, one entry per state, each a short text in the color of its level ("18 to read", "2 open", "1 edited by you"); `none` and `quiet` are not counted. With nothing to count, the footer does not render. A click on an entry opens the first item of that state, in the order of the outline, in the preview tab. `SidePanel` gets a prop `footer`, a row of 40 px with a top border, under the scroll area. Reason: the tree is where the states show, and the footer stays in view while the tree scrolls.
14. **Live marks and reload.** The panel takes the run of the project from `useProjectRunResult` (`shownRun`). While it is `running`, `useArtifactsInProgress(run, reloadArtifacts)` follows its stream from the start and keeps the artifacts written since the last `node_start`; `node_end`, `interrupt`, `error` and `done` empty the set. The callback runs after `artifact_created` and after `node_end`, coalesced with `coalescedTask`, and loads the artifacts and the items again (`useReloadArtifacts` of `artifact/entities`). Its effect keeps an `isClosed` flag that the cleanup sets. Deltas change the set only: no reload per delta.
15. **Not started rows.** `useDocumentList(projectId)` lists one entry per artifact kind of the definition, in the order of `artifact_kinds`, titled by the schema of the kind. `one`: the artifact, or a not started row. `one_per_subject` and `many`: a group with its artifacts by `title`; for `one_per_subject`, each subject item without an artifact is a not started row, read by `useSubjectsWithoutArtifact(projectId, kind)` in the component of the group, only while the project has an unfinished run. A kind or a group without any artifact shows only while the project has an unfinished run.
16. **States.** The panel: `LoadingState` and `ErrorState` (`size` small) for the list; the outline under the open document has its own loading row and error row with Try again. The pages: loading, error with Try again, not found (`NotFoundState`, a deleted artifact or item answers 404), an empty document ("This document has no content yet").
17. **Words** in `documentsMessages` (`documents/entities/documents.constants.ts`) for the marks and the panel, `documentPageMessages` and `itemPageMessages` in the widgets, `artifactViewMessages` in `artifact/entities/constants/artifact-view.constants.ts` for the views.
18. **`'use client'`.** The project layout imports `documentsDestination` from `documents/widgets/panel`; every hook that this reaches and that imports React state or effects starts with `'use client'`: `useDocumentList`, `useSubjectsWithoutArtifact`, `useArtifactsInProgress`, `useOutlineItems`, the hooks of the panel.

## 4. Scope

| | |
|---|---|
| Endpoints read | `GET /workflow/definition`, `GET /artifact-kinds`, `GET /content-schemas/{kind}/{version}` (older items), `GET /projects/{id}/artifacts`, `GET /artifacts/{id}`, `GET /artifacts/{id}/items`, `GET /items/{id}`, `GET /projects/{id}/items?kind=` (subjects), `GET /projects/{id}/threads`, `GET /threads/{id}/runs?latest`, `GET /runs/{id}/interrupts?status=pending` |
| Endpoints called | None: S1a has no action |
| Streams | `GET /runs/{id}/stream` of a running run, from its first event, for the artifacts in progress |
| Written new | Everything in section 8 |
| Copied | Nothing; `feat/fe/mock` is a reference |
| Not built | Section 14 |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Module | The feature of the activity bar | `documents` |
| Widget slices | The block | `panel`, `document`, `item` |
| Destination config | `<feature>-frame.config.tsx` | `documents-frame.config.tsx` with `documentsDestination(projectId)`, `documentTabIcons`, `DocumentTabIcon` |
| Components of a block | `<Object><Block>` | `DocumentsPanel`, `DocumentTree`, `DocumentAttentionSummary`, `DocumentPage`, `ChooseDocument`, `ItemPage`, `ItemNavigator` |
| Entity components | The object | `ArtifactDocument`, `ArtifactItemDetails`, `ContentFieldValue` |
| Values and looks | `<value>Looks`, `use<Value>Look` | `documentMarkLooks`, `useDocumentMarkLook`, `itemStatusLooks`, `useItemStatusLook` |
| Pure rules | What they give | `documentEntries`, `documentMark`, `groupMark`, `itemStatus`, `attentionCounts`, `artifactOutline`, `documentBlocks`, `outlineSequence`, `valueTitle`, `artifactsInProgress` |
| Hooks | `use<What it gives>` | `useDocumentList`, `useSubjectsWithoutArtifact`, `useOutlineItems`, `useReloadArtifacts`, `useArtifactsInProgress`, `useOpenDocument`, `useItemNeighbors` |
| Types | The value | `DocumentEntry`, `DocumentMark`, `DocumentListResult`, `ItemStatus`, `OutlineNode`, `DocumentBlock`, `OutlineItemsResult` |
| Command ids | `<module>.<action>` | `documents.nextItem`, `documents.previousItem` |
| Words | `<topic>Messages` | `documentsMessages`, `documentPageMessages`, `itemPageMessages`, `artifactViewMessages` |
| Route params | none | The ids are in the path |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `Tree`, `TreeItem`, `TreeItemLabel`, `useTree`, `syncDataLoaderFeature`, `hotkeysCoreFeature` | `shared/components/ui/tree`, `@headless-tree/*` | The tree |
| `SidePanel`, `useOpenPage`, `useEditorTab`, `useCommands`, `FeatureDestination`, `TabIcons` | `@/shared/components/frame` | The panel, the pages, the tabs, `J` and `K` |
| `Tooltip` | `shared/components/ui/tooltip` | The location and the status of a row |
| `Breadcrumb` | `shared/components/ui/breadcrumb` | The breadcrumb of the item page |
| `Table`, `Card`, `Badge` | `shared/components/ui` | The table, the cards, the values of tags |
| `LoadingState`, `ErrorState`, `EmptyState`, `NotFoundState` | `@/shared/components/state` | The states |
| `toneClasses`, `Tone` | `@/shared/lib/tone` | The colors of marks and statuses |
| `useWording`, `Wording` | `@/shared/lib/view` | The labels of the statuses in the view of the app |
| `toNested`, `ancestorsOf` | `@/shared/lib/hierarchy` with `itemHierarchy` | The sections of an outline, the breadcrumb, the location |
| `groupBy` | `@/shared/lib/collections` | The items by kind |
| `coalescedTask` | `@/shared/lib/timing` | One reload for a burst of events |
| `pageItems` | `@/shared/api/query-client` | The pages of the items |
| `contentFields`, `summaryFields`, `itemTitle`, `contentDisplayOf`, `kindSchemasByKind`, `findValueList` | `workflow/entities` | The fields, the columns, the titles, the displays, the value titles |
| `useProjectRunResult`, `shownRun`, `isUnfinishedRunStatus`, `usePendingInterrupt` | `project`, `run`, `review` entities | The run of the project, the review |
| `reviewStatusLabels`, `useItem`, `useArtifact`, `useArtifactItems`, `useProjectArtifacts`, `useProjectItems`, `useItemSchema`, `artifactKeys`, `itemKeys` | `artifact/entities` | The data |
| `renderWorkbench`, `renderWithProviders`, `renderHookWithProviders`, `EventSourceStub`, `expectNoAccessibilityViolations`, `openPage` | `@/test/*` | The tests |

### Extract before new code

| What | To | Why |
|---|---|---|
| The `inPlace` option of `useOpenPage` and `replaceNext` of the tabs store | `shared/components/frame` | Generic: any page that reads through a list (search results in S3) |
| `guides` of `Tree` | `shared/components/ui/tree.tsx` | No object of the product; the design system shows it |
| `footer` of `SidePanel` | `shared/components/frame` | Generic; Search (S3) shows its count of results there |

### Checked, not extracted

| Candidate | Copies now | Why it stays |
|---|---|---|
| A generic "load every page" hook | 1 (`useOutlineItems`) | One user; extract at the second |
| A scroll helper | 0 | S1a does not scroll to an item: items open in their own tab |
| The reui tree | 0 | Decision 5 |
| `useShownWhileActive` | 1 (`ItemNavigator`); the results of S3 may add a second | One reader; it moves to `shared/lib/viewport` with the second |
| A component for a letter in a tone | 2 (the panel, the item page) | A `span` with `toneClasses`; nothing to share |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `docs/ui/usability.md` (local) | Decision 1 | none |
| `docs/ui/documents-tree-reference.png` | Committed with the docs; linked from `docs/ui/skeletons.md` 5 | 8 |
| `lint/lib/modules/module-imports.constants.js` | `documents` (decision 2) | 1 |
| `lint/lib/file-names/file-kinds.constants.js` | `topicEntityModules.workflow['content-fields']` reads `definition` too | 1 |
| `lint/configs/__tests__/configs.test.js`, `lint/lib/modules/__tests__/module-names.utils.test.js` | Cases of the new module and the topic, if a case lists the modules | 1 |
| `workflow/entities/content-fields/content-fields.types.ts`, `.utils.ts` | `ContentField.valueList: string \| null` from `x-value-list` | 2 |
| `workflow/entities/content-fields/content-values.utils.ts` | `valueTitle(field, value, definition)` | 2 |
| `workflow/entities/artifact-kinds/artifact-kinds.types.ts` | `'x-value-list': z.string().optional()` on `schemaPropertySchema` | 2 |
| `workflow/entities/components/ContentFieldValue.tsx` (new), `index.ts`, `@x/documents.ts` (new) | Section 8 | 2 |
| `artifact/entities/utils/outline.utils.ts`, `document-blocks.utils.ts`, `item-status.utils.ts` (new) with tests | Decisions 9, 10, 13 | 3 |
| `artifact/entities/constants/item-status-looks.constants.ts`, `artifact-view.constants.ts` (new) | Decisions 9, 17 | 3 |
| `artifact/entities/types/outline.types.ts` (new) | `OutlineNode`, `DocumentBlock`, `ItemStatus`, `OutlineItemsResult` | 3 |
| `artifact/entities/hooks/useItemQueries.ts` | `useOutlineItems`; `useItemSchema` takes `Pick<ArtifactItem, 'kind' \| 'schema_version'>`, so that an artifact uses it too | 3 |
| `artifact/entities/hooks/useArtifactQueries.ts` | `useReloadArtifacts` | 3 |
| `artifact/entities/hooks/useItemStatusLook.ts` (new) | Decision 9 | 3 |
| `artifact/entities/components/` (new): `ArtifactDocument.tsx`, `DocumentBlocks.tsx`, `ArtifactItemDetails.tsx`, with tests | Sections 8 and 10 | 3 |
| `artifact/entities/index.ts`, `@x/documents.ts` (new) | The exports of section 8 | 3 |
| `run/entities/events/artifacts-in-progress.utils.ts`, `hooks/useArtifactsInProgress.ts` (new) with tests; `run-events.constants.ts` | Decision 14; `artifactProgressEvents` | 4 |
| `run/entities/@x/documents.ts` (new) | `useArtifactsInProgress`, `isUnfinishedRunStatus`, `type Run` | 4 |
| `review/entities/@x/documents.ts`, `project/entities/@x/documents.ts` (new) | `usePendingInterrupt`; `useProjectRunResult`, `shownRun` | 6 |
| `shared/components/frame/tabs/editor-tabs.store.ts`, `hooks/useOpenPage.ts` and their tests | Decision 12 | 5 |
| `shared/components/frame/panels/components/SidePanel.tsx` | `footer` (decision 13) | 5 |
| `shared/components/ui/tree.tsx`, design system `ExplorerTreeCard.tsx` and `ArtifactTree.tsx` | Decision 5; the card shows the guides | 5 |
| `shared/routes/project-routes.utils.ts` and its test | `documents`, `document`, `item` (decision 7) | 7 |
| `app/(project)/projects/[projectId]/documents/page.tsx`, `documents/[artifactId]/page.tsx`, `items/[itemId]/page.tsx` (new) | The pages render the widgets | 7 |
| `app/(project)/projects/[projectId]/layout.tsx` | `destinations={[documentsDestination(projectId)]}` and `tabIcons={documentTabIcons}` on the Workbench of a found project; the JSDoc names the documents | 7 |
| `mocks/runs/handlers/run-stream.handlers.ts`, `mocks/runs/lookup/runs.lookup.ts` | Section 11 | 7 |
| `tests/screenshots/projects/documents.spec.ts` (new) | Section 11 | 7 |
| Web App Modules, Web App, frontend README, mocks README, skeletons, implementation plan | Section 13 | 8 |

Files that two commits change: `artifact/entities/index.ts` (commit 3 only), `run/entities/index.ts` (not changed: `documents/entities` reads `run` through `@x/documents`, the widgets need nothing more from `run`). `workflow/entities/index.ts` changes in commit 2 only.

## 8. The slices, file by file

### `workflow/entities`

```text
workflow/entities/
├── @x/documents.ts                       new: kindSchemasByKind, contentSchemasByKind, useArtifactKinds,
│                                         useWorkflowDefinition, type DefinedArtifactKind
├── components/
│   ├── ContentFieldValue.tsx             new
│   └── __tests__/ContentFieldValue.test.tsx, .data.ts
└── content-fields/
    ├── content-fields.types.ts           + valueList
    ├── content-fields.utils.ts           + valueList from x-value-list
    └── content-values.utils.ts           + valueTitle
```

```ts
/**
 * The title that the definition gives a value of a value list, such as "Must" for `must`; the
 * value itself when the field names no list or the list lacks it.
 */
export function valueTitle(
  field: Pick<ContentField, 'valueList'>,
  value: string,
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined,
): string
```

```tsx
/**
 * The value of one content field, read only: a text as paragraphs, a select as the title of its
 * value, a number, yes or no, a list as a list, tags as badges, an object list as a list of its
 * entries with their own fields. Renders nothing for an empty value; the caller hides the label.
 */
export function ContentFieldValue({ field, value }: { field: ContentField; value: unknown })
```

`isEmptyValue(value)` (null, a text of whitespace, an empty list) goes in `content-values.utils.ts` beside the rules that already treat a text of whitespace as missing, with cases in its data file.

### `artifact/entities`

```text
artifact/entities/
├── @x/documents.ts                     new: useProjectArtifacts, useProjectItems, useOutlineItems,
│                                       useReloadArtifacts, itemTitle helpers, types Artifact, ArtifactItem
├── components/                         new
│   ├── ArtifactDocument.tsx            the document page body: header, fields, blocks
│   ├── DocumentBlocks.tsx              heading, group heading, table, cards, transcript
│   ├── ArtifactItemDetails.tsx         the fields of one item, with its key line
│   └── __tests__/
├── constants/item-status-looks.constants.ts, artifact-view.constants.ts
├── hooks/useItemStatusLook.ts
├── types/outline.types.ts
└── utils/outline.utils.ts, document-blocks.utils.ts, item-status.utils.ts (+ __tests__)
```

```ts
/** The status an item shows (decision 9): its review status, `edited` or `openIssue`. */
export type ItemStatus = Exclude<ReviewStatus, 'superseded'> | 'edited' | 'openIssue'

/** A row of the outline of an artifact. `id` is unique in the tree of the panel. */
export type OutlineNode =
  | { type: 'section'; id: string; item: OutlineItem; title: string; count: number; level: AttentionLevel; children: OutlineNode[] }
  | { type: 'group'; id: string; kind: string; title: string; count: number; level: AttentionLevel; children: OutlineNode[] }
  | { type: 'item'; id: string; item: OutlineItem; title: string; status: ItemStatus }
  | { type: 'turn'; id: string; item: OutlineItem; title: string }
  | { type: 'field'; id: string; name: string; title: string }

/** What a kind needs to be placed and drawn: its title, display and schema, by kind name. */
export interface KindView { title: string; display: ContentDisplay; schema: ContentSchema }

/** The outline of an artifact, in the order of the document (decision 10). */
export function artifactOutline(input: {
  artifact: Pick<Artifact, 'id' | 'content'>
  artifactSchema: ContentSchema | undefined
  items: readonly OutlineItem[]
  itemKinds: readonly string[]
  kinds: ReadonlyMap<string, KindView>
  issueKinds: readonly IssueKind[]
}): OutlineNode[]

/** The items of the outline that a reader goes through, in order: the rows of type `item`. */
export function outlineSequence(nodes: readonly OutlineNode[]): OutlineItem[]

/** One part of the page of a document. Each item block holds consecutive items of one kind. */
export type DocumentBlock =
  | { type: 'heading'; item: OutlineItem; title: string; level: 2 | 3 | 4 | 5 }
  | { type: 'group'; kind: string; title: string; count: number }
  | { type: 'items'; kind: string; display: Exclude<ContentDisplay, 'document' | 'heading'>; items: OutlineItem[] }

export function documentBlocks(input: Omit<Parameters<typeof artifactOutline>[0], 'artifact' | 'artifactSchema'>): DocumentBlock[]

export function itemStatus(item: Pick<ArtifactItem, 'kind' | 'content' | 'review_status' | 'updated_by'>, issueKinds: readonly IssueKind[]): ItemStatus

/**
 * How many items have each status that needs the attention of the user, in the order of
 * the levels `act` then `follow`, without the absent ones, with the first item of each in the given order.
 */
export function attentionCounts(statuses: readonly { item: OutlineItem; status: ItemStatus }[], options: { isUnderReview: boolean }): { status: ItemStatus; level: AttentionLevel; count: number; first: OutlineItem }[]

export type AttentionLevel = 'act' | 'follow' | 'none' | 'quiet'

/** How much an item status asks of the user now (decision 9a). */
export function attentionLevel(status: ItemStatus, options: { isUnderReview: boolean }): AttentionLevel
```

`transcriptTurnField = 'turn'` sits in `artifact-view.constants.ts`, with a comment: the transcript display numbers its messages by this field, so the outline gives one row per turn. `attentionLevels` sits in `item-status-looks.constants.ts`, beside the looks.

```ts
/**
 * The items of an artifact in outline order without the superseded ones, every page loaded, with
 * the kinds that draw them. Loads the next page as long as there is one.
 */
export function useOutlineItems(artifactId: string): OutlineItemsResult

/** Loads again every list of artifacts and items, and every artifact and item, after a run wrote them. */
export function useReloadArtifacts(): () => Promise<void>
```

`OutlineItemsResult` is `{ state: 'pending' } | { state: 'error'; retry } | { state: 'success'; items; itemKinds; kinds }`, `itemKinds` from the defined artifact kind, `kinds` built from `useArtifactKinds` and `contentDisplayOf`.

Components:

- `ArtifactDocument({ artifactId, itemHref })`: reads `useArtifact`, `useItemSchema(artifact)`, `useOutlineItems`; shows the title (`h1`, `text-2xl` semibold in the user view), the line "Approved, version 4" (`reviewStatusLabels`), the summary, each filled field of the artifact under its label (`h2`), then `DocumentBlocks`. `itemHref(itemId)` comes from the page, since the entity does not know the routes of `documents`.
- `ArtifactItemDetails({ item, schema })`: the key, the label of its status in its color, "version N", then the filled fields in `x-ui-field-order`, label above value, 24 px between fields, the column capped at 760 px. The title is the page's.
- The text column of the document is capped at 70 characters (`max-w-prose` or a token of `@theme`, no bracket value).

### `run/entities/events`

```ts
/** The events that change which artifacts the node in progress writes. */
export const artifactProgressEvents = ['node_start', 'node_end', 'interrupt', 'error', 'done', 'artifact_created', 'artifact_delta'] as const satisfies readonly RunEventType[]

/** The artifacts written since the last `node_start`; a node that ends, or the run, empties them. */
export function artifactsInProgress(ids: ReadonlySet<string>, event: Pick<RunEvent, 'type' | 'data'>): ReadonlySet<string>
```

```ts
/**
 * Follows the stream of a running run from its first event and gives the artifacts that the node
 * in progress writes. Calls `onWritten` after an artifact is created and after a node ends; the
 * calls of a burst share one. Closed when the run is not running; the cleanup sets `isClosed` so
 * that a reload in progress calls nothing.
 */
export function useArtifactsInProgress(
  run: Pick<Run, 'id' | 'status'> | null | undefined,
  onWritten: () => Promise<void> | void,
): ReadonlySet<string>
```

### `documents/entities`

```text
documents/entities/
├── documents.constants.ts        documentsMessages, documentMarkLooks
├── documents.types.ts            DocumentMark, DocumentEntry, DocumentListResult
├── documents.utils.ts            documentEntries, documentMark, groupMark
├── hooks/
│   ├── useDocumentList.ts
│   ├── useDocumentMarkLook.ts
│   └── useSubjectsWithoutArtifact.ts
├── __tests__/documents.utils.test.ts, .data.ts
├── hooks/__tests__/...
└── index.ts
```

```ts
export type DocumentMark = 'writing' | 'review' | 'approved' | 'draft' | 'notStarted'

/** A row of the list of documents: one artifact, or the group of the artifacts of one kind. */
export type DocumentEntry =
  | { type: 'document'; kind: string; title: string; artifact: Artifact | null; mark: DocumentMark }
  | { type: 'group'; kind: string; title: string; subjectItemKind: string | null; documents: { artifact: Artifact; mark: DocumentMark }[]; mark: DocumentMark }

export type DocumentListResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; entries: DocumentEntry[]; hasUnfinishedRun: boolean; markOf: (artifactId: string) => DocumentMark }
```

```ts
/**
 * The documents of a project with their marks. With `isFollowing`, it also follows the stream of
 * the running run for the documents being written; one caller follows it, the side panel.
 */
export function useDocumentList(projectId: string, { isFollowing = true }: { isFollowing?: boolean } = {}): DocumentListResult
```

It reads the definition, the kinds, `useProjectArtifacts(projectId)`, `useProjectRunResult(projectId)`, `usePendingInterrupt` of the shown run, and `useArtifactsInProgress(isFollowing ? run : null, reload)`. The panel calls it with the default; the document page calls it with `{ isFollowing: false }` for the icon of its tab, so the stream opens once and the queries are shared. The pure part is `documentEntries`.

### `documents/widgets/panel`

```text
documents/widgets/panel/
├── documents-frame.config.tsx    documentsDestination(projectId), DocumentTabIcon, documentTabIcons
├── document-tree.utils.ts        documentTreeNodes, rowLocation (pure helpers of the block)
├── components/
│   ├── DocumentsPanel.tsx        SidePanel "Documents" with the tree and the footer
│   ├── DocumentTree.tsx          the Tree with its rows (DocumentRow, OutlineRow stay in the file)
│   └── DocumentAttentionSummary.tsx the footer: what needs the user
├── hooks/
│   ├── useOpenDocument.ts        the artifact and the item of the page on screen, from the params
│   └── useDocumentTree.ts        the tree instance, its data, and the open actions
├── __tests__/, components/__tests__/, hooks/__tests__/
└── index.ts
```

- `useOpenDocument()` reads `useParams()`: `artifactId` on a document page; `itemId` on an item page, whose `artifact_id` comes from `useItem(itemId)` (the cached query of the page). Gives `{ artifactId, itemId }`, each possibly undefined.
- `documentTreeNodes(entries, openArtifactId, outline)` gives the flat record of nodes that `syncDataLoaderFeature` reads: id, name, children, and what the row shows. The outline nodes sit under the row of the open document. `rowLocation(nodes, id)` gives the titles above a row for the tooltip.
- The row of the item on screen has `aria-current="page"` and stays in view (`scrollIntoView({ block: 'nearest' })` when it changes).

### `documents/widgets/document` and `documents/widgets/item`

```text
documents/widgets/document/
├── components/DocumentPage.tsx, ChooseDocument.tsx (+ __tests__)
├── document-page.constants.ts     documentPageMessages
└── index.ts
documents/widgets/item/
├── components/ItemPage.tsx, ItemNavigator.tsx (+ __tests__)
├── hooks/useItemNeighbors.ts, useItemCommands.ts, useShownWhileActive.ts (+ __tests__)
├── item-page.constants.ts         itemPageMessages
└── index.ts
```

- `DocumentPage({ projectId, artifactId })`: `useEditorTab` (decision 7), `ArtifactDocument` with `itemHref = (id) => routes.project(projectId).item(id)`; a click on an item title opens it in the preview tab, a double click keeps it.
- `ItemPage({ projectId, itemId })`: `useItem`, `useItemSchema`, the breadcrumb from `ancestorsOf` over the outline of its artifact, `ItemNavigator` (decision 11a), `ArtifactItemDetails`.
- `useItemNeighbors(item)`: from `outlineSequence(artifactOutline(...))`, the index, the count, and the previous and next items.
- `useItemCommands(neighbors)`: registers `documents.nextItem` (`J`) and `documents.previousItem` (`K`) while the page is on screen; each opens with `{ inPlace: true }`.

## 9. State and data flow

| State | Where | Name |
|---|---|---|
| Definition, kinds, artifacts, items, run, interrupt | Query hooks of the entities | as section 6 |
| Artifacts in progress | `useState` inside `useArtifactsInProgress` | `ids` |
| Expanded rows | The `useTree` instance of `DocumentTree` | - |
| Open document and item | The address (`useParams`) | - |
| Replace the tab on screen | The tabs store | `replaceNext` |

Flow: the panel loads the definition, the kinds, the artifacts and the run of the project, then shows the documents with their marks; the outline of the open document loads its items. While the run is running, a created artifact or an ended node loads the artifacts and the items again, and the mark `(>)` follows the node. An interrupt loads the run (stream of the status item), whose status turns `interrupted`, so `usePendingInterrupt` reads the review and the documents under review show `(!)`.

## 10. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| Panel loading | `LoadingState` small | `?mock-artifacts=loading` |
| Panel error | `ErrorState` with Try again | `?mock-artifacts=error` |
| No artifact, run finished | `EmptyState` "No documents yet" | `?mock-artifacts=empty&mock-run-status=done` |
| No artifact, run unfinished | Every kind not started | `?mock-artifacts=empty&mock-run-status=running` |
| Documents of the mentor platform waiting at the analysis review | `(v)` plan, personas, interviews; `(!)` analysis; `( )` specification, backlog, validation | default |
| A document being written | `(>)` on the analysis | `?mock-run-status=running` |
| Outline loading or failed | A loading row; an error row with Try again | `?mock-artifact=loading`, `error` |
| Document page | Title, status line, fields, blocks | `/projects/90aa...0001/documents/<analysis id>` |
| Empty document | "This document has no content yet" | an artifact without fields and items, from `buildArtifact` in the unit tests |
| Not found | `NotFoundState` | `?mock-artifact=error` with 404, or an unknown id |
| Item page | Breadcrumb, "3 of 18", fields | `/projects/90aa...0001/items/<REQ-001 id>` |

```ts
export const documentsMessages = {
  title: 'Documents',
  marks: {
    writing: { letter: 'W', label: 'Being written' },
    review: { letter: 'R', label: 'Waiting for your review' },
    approved: { letter: null, label: 'Approved' },
    draft: { letter: null, label: 'Draft' },
    notStarted: { letter: null, label: 'Not started' },
  },
  empty: { title: 'No documents yet', description: 'The documents of the project show here once the agents write them.' },
  outlineError: 'The outline could not load.',
  location: (titles: readonly string[]) => titles.join(' > '),
  statusWithVersion: (status: string, version: number) => `${status}, version ${version}`,
  count: (count: number, label: string) => `${count} ${label.toLowerCase()}`,
}
export const documentPageMessages = { choose: { title: 'Choose a document', description: 'Open a document from the side panel of Documents.' } }
export const itemPageMessages = {
  navigator: 'Go through the items',
  position: (index: number, count: number) => `${index} of ${count}`,
  previous: 'Previous item',
  next: 'Next item',
}
// item-page.constants.ts also holds navigatorIdleMs = 2_500: how long the navigator stays after the last action of the user.
export const artifactViewMessages = {
  empty: 'This document has no content yet.',
  version: (version: number) => `version ${version}`,
  statuses: {
    edited: { letter: 'E', label: 'Edited by you, not reviewed yet' },
    openIssue: { letter: '?', label: 'Open issue' },
    rejected: { letter: 'X', label: 'Rejected' },
    draftInReview: { letter: null, label: 'To read before you approve' },
  },
  attention: { draft: (count: number) => `${count} to read`, openIssue: (count: number) => `${count} open`, edited: (count: number) => `${count} edited by you` },
}
```

## 11. Mocks and screenshots

- `runs.lookup.ts`: `artifactInProgress(run)`, the artifact of the project of the run whose kind the definition gives the stage `current_stage` of the run; null when there is none.
- `run-stream.handlers.ts`: for a run that is `running` and has an artifact in progress, send `node_start`, `artifact_delta` for that artifact a few times, and keep the stream open, without `node_end` or `done`; the other runs keep the events of today. Only the browser worker loads this file, so the unit tests use `EventSourceStub`.
- No new scenario: `mock-artifacts`, `mock-artifact`, `mock-run-status` cover the states.
- `tests/screenshots/projects/documents.spec.ts`: the panel with the analysis open and its outline; the document page of the analysis; the item page of REQ-001; the panel while the run is running; the not started kinds with `mock-artifacts=empty&mock-run-status=running`. Use the helpers of `screenshot.utils.ts`.

## 12. Tests

| File | Cases |
|---|---|
| `workflow/.../content-values.utils.test.ts` | `valueTitle` (title, no list, missing value), `isEmptyValue` |
| `workflow/.../content-fields.utils.test.ts` | `valueList` read from `x-value-list` |
| `workflow/entities/components/__tests__/ContentFieldValue.test.tsx` | Each widget, empty renders nothing, axe |
| `artifact/.../outline.utils.test.ts` | Sections nested with counts; groups in definition order with kind titles; superseded dropped; transcript turns; field rows; `outlineSequence` across sections |
| `artifact/.../document-blocks.utils.test.ts` | Heading levels; runs of items by kind and display; groups for an artifact without sections |
| `artifact/.../item-status.utils.test.ts` | `itemStatus` (each status, open issue before edited, a closed issue reads as its review status), `attentionLevel` (every status in and out of a review), `attentionCounts` (levels in order, absent states, the first item) |
| `artifact/.../useItemQueries.test.ts` | `useOutlineItems` loads two pages (page size reduced with a mock of 201 items), drops superseded, error and retry |
| `artifact/.../components/__tests__/ArtifactDocument.test.tsx`, `ArtifactItemDetails.test.tsx` | Each display with the mentor fixtures, the title links, empty and loading states, axe |
| `run/.../artifacts-in-progress.utils.test.ts` | Each event type |
| `run/.../useArtifactsInProgress.test.ts` | Opens only while running; set follows the events; `onWritten` coalesced after `artifact_created` and `node_end`; nothing after close (fails without `isClosed`) |
| `documents/entities/__tests__/documents.utils.test.ts` | `documentEntries` for `one`, `one_per_subject`, `many`, unfinished and finished run; `documentMark` order; `groupMark` |
| `documents/entities/hooks/__tests__/useDocumentList.test.ts` | Pending, error, success with the mentor fixtures, `(!)` with the pending interrupt |
| `documents/widgets/panel/__tests__/document-tree.utils.test.ts` | Nodes with the outline under the open document, `rowLocation` |
| `documents/widgets/panel/components/__tests__/DocumentsPanel.test.tsx` | States; marks; click opens the preview tab, double click keeps; the outline of the open document; the color and the letter at the end of the rows (`aria-hidden`, the label read in its place), drafts colored only in a document under review, rejected muted; a collapsed section takes the color of the highest level under it; tooltip; the footer counts the levels `act` and `follow` only, renders nothing without them, and opens the first item of a status; axe |
| `documents/widgets/document/components/__tests__/DocumentPage.test.tsx` | Tab title and icon; item link opens the item page |
| `documents/widgets/item/components/__tests__/ItemPage.test.tsx` | Breadcrumb; the navigator shows on open, hides after the idle time (fake timers), shows again on a pointer move, a scroll and a key, stays while hovered or focused, shows when Tab reaches a button; Previous disabled on the first item, Next on the last; Previous and Next open in place; `J` and `K`; the label of the status in its color; not found; axe |
| `shared/components/frame/tabs/__tests__/editor-tabs.store.test.ts`, `hooks/__tests__/useOpenPage.test.ts` | `inPlace` replaces a kept tab and a preview tab, in place, keeping its state |
| `shared/routes/__tests__` | The three routes |

Helpers: `renderDocumentsFrame(page, address)` in `test/render/render-documents-frame.utils.ts` opens `address` with `openPage`, then renders `renderWorkbench` with the destination of Documents, its tab icons and the tabbed workspace of the mentor project around `page`. The tests of the three widgets of `documents` import it; it sits in `test/render/` because three slices use it and a widget may not import another widget.

## 13. Docs to update

- `docs/architecture/web-app-modules.md`: section 4 order with `documents` above `project`; section 6 a row `documents` (entities: the list of documents and their marks; widgets `panel`, `document`, `item`; S1b, S1c, S3 later), the row `artifact` (the views of a document and an item, the outline, the item status; the `panel` placeholder stays until section 14 removes it), the row `workflow` (`ContentFieldValue`); section 5 the new `@x/documents` links; section 9 the three blocks; section 3 `content-fields` reads `definition`.
- `docs/architecture/web-app.md`: section 6, the outline and the blocks of a document, the item status; section 9, the files.
- `docs/ui/skeletons.md` 5: link the reference image of the tree.
- `frontend/src/mocks/README.md`: a section "Documents" with the addresses of section 10, and the stream of a running run.
- `frontend/README.md`: nothing, unless its list of screens names them.
- Implementation plan (branch `frontend-plan`): section 4 `documents`; section 8 rows S1a to S1d and S3 in `documents`; section 9 rows; D8 unchanged; checklist.

## 14. Left for the next PRs

| Item | Where |
|---|---|
| Edit an item and an artifact, the history and restore, Source, Based on and used by, the `!` mark | S1b |
| The right panel of the frame and the peek | S1c |
| Export of a document, the Export button on the document | S1d |
| The review bar under a document and its items, with the navigator of an item page above it | S2 |
| `artifact/widgets/panel` (`ArtifactPanel`, a placeholder used by no page) | Removed in S1b when `artifact` gets its first feature, or in the maintenance PR |
| Open point 6 of usability: the group of validation reports shows every report | Kept as it is; a change waits for tests with users |
| Several groups side by side, `Open to the side` | The frame, after S1 |

## 15. Commits and checks

1. `build(frontend): add the documents module and let the content fields read the definition`
2. `feat(frontend): show the value of a content field with the title of its value list`
3. `feat(frontend): read the outline and the parts of an artifact, and show a document and an item`
4. `feat(frontend): follow the artifacts that the node in progress of a run writes`
5. `feat(frontend): open a page in the tab on screen, guide the levels of a tree, and give a side panel a footer`
6. `feat(frontend): list the documents of a project with their marks`
7. `feat(frontend): show the documents in the side panel, and a document and an item in tabs`
8. `docs(frontend): describe the documents module and the documents screen`

Each file goes in the commit of its row in section 7. The plan and the prompt stay local.

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on `modules/workflow`, `modules/artifact`, `modules/run/entities/events`, `modules/documents`, `shared/components/frame`, `shared/components/ui`, `shared/routes`, `lint`; typecheck once, since routes and types change. A test that times out only with the others is run again alone. No full suite, E2E, screenshots or build locally; the screenshots run in CI. `grep -nP '[^\x00-\x7F]'` on the docs and the new comments, and `grep -rnE 'backend|frontend|UI|FR-[0-9]|docs/'` on the new comments.

## 16. Checklist

- [x] The split of S1, the item address, the not started rows and the order of the groups answered (2026-11-01)
- [x] The module of the screen answered: `documents` (2026-11-01)
- [x] Items open in a tab of their own; the tree follows the reference image (2026-11-01)
- [ ] `usability.md` updated in the working copy (decision 1)
- [ ] B1 merged; branch `feat/fe/documents` from `origin/main`
- [ ] Commits 1 to 8, each checked
- [ ] The marks and the tree checked once in `pnpm dev:mock` (a new screen: one dev server, one page at a time, stopped after)
- [ ] The description of the PR written from this plan; the endpoints checked against the `*.api.ts` functions that the hooks call
