# Frontend plan: two views (developer and user)

How the web app gets two views, each with its own host, frame and pages: what is built already, what each PR after it adds, what stays as it is, the helpers it uses and adds, the folders, and the names. The decisions behind it are in [Web App Views](architecture/web-app-views.md); this plan applies them.

The plan was checked against `feat/fe/activity-and-ratings` at `02b1ff73`, not against `main`: the view, the wording and the module `activity` it changes are on that branch only. When the code differs from the plan (a name, a path, a signature), stop and report the difference instead of choosing.

Short paths: `activity/widgets/chat/...` means `frontend/src/modules/activity/widgets/chat/...`, `shared/...` means `frontend/src/shared/...`, `app/...` means `frontend/src/app/...`, `lint/...` means `frontend/lint/...`.

## Contents

- [1. The PRs](#1-the-prs)
- [2. What was read](#2-what-was-read)
- [3. Vocabulary](#3-vocabulary)
- [4. Decisions](#4-decisions)
- [5. Naming](#5-naming)
- [6. Shared code first](#6-shared-code-first)
- [7. V2, built: the pages of each view and the host that shows them](#7-v2-built-the-pages-of-each-view-and-the-host-that-shows-them)
- [8. V1: the words of today become the developer words](#8-v1-the-words-of-today-become-the-developer-words)
- [9. V3: the chat leaves the workbench](#9-v3-the-chat-leaves-the-workbench)
- [10. V4: the chat frame and the pages of the user view](#10-v4-the-chat-frame-and-the-pages-of-the-user-view)
- [11. V5: the read-only sheet beside the chat](#11-v5-the-read-only-sheet-beside-the-chat)
- [12. State and data flow](#12-state-and-data-flow)
- [13. Tests](#13-tests)
- [14. Docs to update](#14-docs-to-update)
- [15. Left for later](#15-left-for-later)
- [16. Commits and checks](#16-commits-and-checks)
- [17. Questions](#17-questions)
- [18. Checklist](#18-checklist)

---

## 1. The PRs

Three PRs, each based on the one before. The first holds three parts, V1 to V3, which change nothing a person does on screen; each part is a run of commits that stands alone, in the order below, so that the workbench never shows the developer words of today. All three parts are built in the working tree of `feat/fe/two-views` and not committed.

| PR | Branch | Title | Parts | Changes on screen | State |
|---|---|---|---|---|---|
| A | `feat/fe/two-views` | The pages of each view and the host that shows them | V1, the words of today become the developer words ([section 8](#8-v1-the-words-of-today-become-the-developer-words)); V2, the trees, the proxy and the view from the tree ([section 7](#7-v2-built-the-pages-of-each-view-and-the-host-that-shows-them)); V3, the chat leaves the workbench ([section 9](#9-v3-the-chat-leaves-the-workbench)) | The app answers at `dev.localhost`; `localhost` shows a placeholder | Built, not committed |
| B | `feat/fe/chat-frame` | The chat frame and the pages of the user view | V4 ([section 10](#10-v4-the-chat-frame-and-the-pages-of-the-user-view)) | The user host shows projects and their chat | Planned |
| C | `feat/fe/reference-sheet` | The read-only sheet beside the chat | V5 ([section 11](#11-v5-the-read-only-sheet-beside-the-chat)) | A reference of the chat opens its document | Planned |

Size of PR A: V1 touches about 50 source files and 19 test files, V2 about 35 (most of them moves), V3 about 10. A reviewer reads it commit by commit: the commits of V1 only rewrite words and delete variants, the first commit of V2 only moves files.

Checked in a running app after the three parts: the developer host reads "Waiting for you" and "Not started" as the app does today, the chat shows no run number, and a document that a review names opens as a page in a tab of the workbench.

## 2. What was read

| Source | What it gave |
|---|---|
| `docs/architecture/web-app.md`, `web-app-modules.md` | The layers inside a module, the order of the modules, what shared code holds, where a block that reads several modules goes |
| `frontend/lint/README.md`, `lint/lib/modules/module-imports.constants.js`, `lint/lib/imports/*-patterns.constants.js`, `lint/configs/` | Where an import rule for one place goes (a `*-patterns.constants.js` file and a block of `imports-*.js`), and that a later block replaces the whole rule |
| `docs/prompt-create-frontend-feature-plan.md` and the plan of S2a (branch `frontend-plan`) | Which sections a plan has. Their level of detail per component is not followed: this plan fixes folders, names, helpers and seams, and leaves the look of a component to its PR |
| `shared/lib/view/`, `providers/Providers.tsx` | The view was one global value with the default `user`; nothing set `developer` |
| `shared/components/frame/` | The workbench holds no object of the product and is filled by `app/` through `crumb`, `destinations`, `contributions` |
| `shared/routes/` | Every address is written once and checked by the route types |
| `activity/widgets/chat`, `activity/entities` | Three couplings of the chat to the workbench ([section 9](#9-v3-the-chat-leaves-the-workbench)); five places that change content by view |
| The skill Feature-Sliced Design | Two slices of one layer that need each other are joined from the layer above (the app layer here), not by one importing the other |
| A run of the app, dev server and production build, in a headless browser | [Section 7](#7-v2-built-the-pages-of-each-view-and-the-host-that-shows-them), "Checked" |

## 3. Vocabulary

Three words, never mixed:

| Word | Means | Values | Lives in |
|---|---|---|---|
| View | Who reads the screen. It decides words and content | `developer`, `user` | `shared/lib/view/` (`View`, `useView`) |
| Frame | The layout around a page | `Workbench`, `ChatFrame` | `shared/components/frame/`, `shared/components/chat-frame/` |
| Tree | The pages of one view | `app/developer/`, `app/user/` | `src/app/`, named after the view |

A tree states its view and mounts its frame. Nothing below the app layer knows the tree or the host.

## 4. Decisions

1. **The host chooses the tree, in one file.** `src/proxy.ts` rewrites a request to the tree of the view of its host. A host whose first label is `dev` shows the developer view; any other host shows the user view. No view override: local work uses `localhost` and `dev.localhost`.
2. **The tree states the view.** `app/developer/layout.tsx` and `app/user/layout.tsx` each mount `ViewProvider` with their view. `Providers` does not. `useView()` reads that context; no component reads the host.
3. **A view branch changes words and content, never the frame or an address.** `useView()` may choose a label or which lines show. What a click opens is given from the app layer (decision 6). A different layout is a different component (decision 5).
4. **The modules are not split by view.** There is no module, layer or folder named after a view inside `src/modules/`. A slice with no view in its name serves both views. A slice that one tree mounts is known by that: the lint rule of [section 10](#10-v4-the-chat-frame-and-the-pages-of-the-user-view) keeps the other tree from importing it.
5. **Two forms of one block are two widgets, each named after its form.** The projects are a table in the workbench (`project/widgets/list`) and a side list in the chat frame (`project/widgets/sidebar`). What both read stays in the entities and the features of `project`. A component never takes a view as a prop (`variant="user"`, `isDeveloper`).
6. **A shared block gets what differs by frame from above.** The chat does not import the workbench or a route map. The app layer wraps it in a provider that says what opening a reference does. This is composing from the layer above, as the slices of one layer may not import each other.
7. **Words.** A value that reads differently by view is a `ByView<string>`: `{ developer: string; user?: string }`. A missing `user` reads the `developer` text. The words on screen today are the developer words; the user view starts with the same and is refined screen by screen.
8. **Addresses.** One route map per tree. A leaf writes the path of its page as the folders of `src/app/` write it, with the folder of the tree, and `checkedRoute` returns the address without it. Shared slices import no route map.
9. **Kept as it is:** the workbench and every hook of `shared/components/frame`, the module order of `moduleImports`, the layers inside a module, the `@x` files, the mocks, `PromptInput`, `FeedEntry`, the states, the command palette, `useRunCost`.

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Tree folder | The view | `app/developer/`, `app/user/` |
| Tree layout | `<View>Layout` | `DeveloperLayout`, `UserLayout` |
| Frame | A noun of the layout, never the view | `Workbench` (exists), `ChatFrame` |
| Route map | `<view>Routes`; the map of today keeps its name until V4 | `routes` (developer and shared pages), `userRoutes`; V4 renames `routes` to `developerRoutes` in one commit |
| Value by view | `ByView<T>`; `Wording` stays as the name of `ByView<string>` | `ByView`, `Wording` |
| Reading a value by view | Pure: `inView(value, view)`. Hook: `useWording(wording)` (exists) | `inView` |
| Slice for both views | No view and no frame in the name | `activity/widgets/chat`, `review/features/answer` |
| Slice of one frame | The block it is | `activity/widgets/panel`, `activity/widgets/tab`, `project/widgets/list`, `project/widgets/sidebar`, `documents/widgets/sheet` |
| Component with two forms | `<Object><Block>`, the block differs | `ProjectTable` and `ProjectSidebar`; `DocumentPage` and `DocumentSheet` |
| Two forms with no noun to tell them apart | The frame as a prefix, never the view | `WorkbenchSettings`, `ChatSettings` |
| Never | `User...` or `Developer...` as a prefix of a component or a hook for the view: `User` is an object of the product (`UserMenu`, `UserSettings`) | - |
| Provider of what a frame gives a shared block | `<What>Provider`, with `use<What>` | `ReferenceOpenerProvider`, `useReferenceOpener` |
| Words of a slice | `<topic>Messages` (rule of today); a text that differs by view is a `Wording` inside it | `activityChatMessages` |
| Test case of a view | `in the developer view`, `in the user view` at the end of the case name | - |

## 6. Shared code first

**Reuse**

| What | From | For |
|---|---|---|
| `View`, `views`, `useView`, `useWording`, `ViewProvider` | `shared/lib/view` | The view of a tree and the words of a value |
| `Workbench`, `TabbedWorkspace`, `UntabbedWorkspace`, `useEditorTab`, `useOpenPage` | `shared/components/frame` | The developer tree, unchanged |
| `Sidebar` and its parts | `shared/components/ui/sidebar.tsx` | The side list of `ChatFrame` |
| `Sheet` | `shared/components/ui/sheet.tsx` | The read-only sheet |
| `PromptInput`, `NewProjectPrompt` | `shared/components/prompt`, `project/features/create` | The start page of the user view |
| `UserMenu` | `user/widgets/menu` | The footer of the side list; today only `AccountMenuItem` is exported, V4 exports `UserMenu` too |
| `CommandPalette`, `useCommands` | `shared/components/frame` | Kept in the workbench only until [question Q2](#17-questions) is answered |
| `ArtifactDocument` and the item views | `artifact/entities` | The content of the sheet |
| `useRouteParam`, `RouteParam` | `shared/routes` | Which reference the sheet shows |
| `renderWithProviders`, `TestProviders` | `test/render` | Gets a `view` option in V1 |

**New in shared code**

| What | Path | PR | Users |
|---|---|---|---|
| `viewOfHost`, `treePathOf`, `isTreePath`, `addressOfTreePath` | `shared/lib/view-tree/view-tree.utils.ts` | V2, built | `src/proxy.ts`, `checkedRoute` |
| `proxy` | `src/proxy.ts` | V2, built | Next.js |
| `userRoutes` | `shared/routes/routes.utils.ts` | V2, built | The user tree |
| `ByView<T>`, `inView` | `shared/lib/view/view.types.ts`, `shared/lib/view/wording.utils.ts` | V1 | Every labels file and the pure rules that take a view |
| `ChatFrame` | `shared/components/chat-frame/` | V4 | `app/user/` |
| `hostOfView` | `shared/lib/view-tree/` | Later, with the first link across views | - |

**Checked, kept in its module**

| Candidate | Stays in | Why |
|---|---|---|
| What opening a reference does | `activity/entities` (the context) and the app layer (the value) | It names documents and items |
| The side list of projects | `project/widgets/sidebar` | It reads projects and their actions |
| The sheet | `documents/widgets/sheet` | It reads artifacts and items |

## 7. V2, built: the pages of each view and the host that shows them

**Files**

```text
frontend/
├── next.config.ts                         # allowedDevOrigins: + dev.localhost
├── playwright.config.ts                   # the specs run at dev.localhost
├── tests/shared/backend-env.constants.ts  # frontendUrl at dev.localhost
└── src/
    ├── proxy.ts                           # new
    ├── app/
    │   ├── layout.tsx, error.tsx, global-error.tsx, not-found.tsx, styles.css   # unchanged
    │   ├── (auth)/                        # unchanged: the same pages on every host
    │   ├── developer/
    │   │   ├── layout.tsx                 # new: ViewProvider value="developer"
    │   │   ├── page.tsx                   # moved from app/page.tsx
    │   │   ├── (dev)/ (home)/ (project)/  # moved with git mv, content unchanged
    │   └── user/
    │       ├── layout.tsx                 # new: ViewProvider value="user"
    │       └── page.tsx                   # new: a placeholder until V4
    ├── providers/Providers.tsx            # ViewProvider removed
    └── shared/
        ├── lib/view/ViewProvider.tsx      # value is required
        ├── lib/view-tree/                 # new: view-tree.utils.ts, index.ts, __tests__/
        └── routes/                        # checkedRoute, routes, userRoutes, defaultAfterLogin
```

**What changed in existing code**

| File | Change |
|---|---|
| `shared/routes/typed-route/typed-route.utils.ts` | `checkedRoute` takes the path of the page with the folder of its tree and returns the address without it |
| `shared/routes/routes.utils.ts`, `project-routes.utils.ts` | Each leaf writes `/developer/...`; the addresses they return are the same as before. `userRoutes` with `home` |
| `shared/routes/auth/auth-hrefs.utils.ts` | `defaultAfterLogin` is `routeOfAddress('/')`: no page sits at `/` in the folders any more, and every view has a home there |
| `app/developer/**/page.tsx`, `layout.tsx` | `PageProps<'/developer/projects/...'>`; `export const instant = false` on the layouts and pages that lacked it |
| Four test files (`TopBar.test.tsx`, `useOpenPage.data.ts`, `render-workbench.utils.ts`, `render-documents-frame.utils.ts`) | `routes.home()` in place of the literal `'/'` |

**Checked**

| Check | Result |
|---|---|
| Typecheck, ESLint and Prettier on the changed files, Vitest on `shared/routes`, `shared/lib/view`, `shared/lib/view-tree`, `shared/components/frame`, `test/` (36 files, 291 tests) | Pass |
| Dev server with mocks, headless Chromium: `localhost/` shows the user tree; `localhost/projects`, `/user`, `/developer/projects` are 404; `/login` is the same page on both hosts; `dev.localhost/` redirects to `/projects`; a click on a project opens `/projects/<id>/activity` with the tabs | Pass |
| Production build (`next build`, `next start`), same script | Pass. The pages stay static or partly prerendered; the prefetch of each project link asks the address without the folder and gets 200 through the proxy |
| The dev error "Could not validate that a segment in your UI has instant navigation" | Gone. It showed before this work too: with the mocks, `MockingProvider` renders nothing on the server, so every layout and page under it must opt out, and six pages and the layout of `(home)` did not |

**Not done in V2:** a unit test of `proxy` itself (its rules are the tested helpers; the browser run covers the wiring), the E2E run, and the docs of [section 14](#14-docs-to-update).

## 8. V1: the words of today become the developer words

**Goal:** after V1 and V2, the developer host shows exactly what the app shows today, and the developer variants of today are gone from the code.

**Shared code**

```ts
// shared/lib/view/view.types.ts
/** A value in each view. The user view reads the developer value until it has its own. */
export type ByView<T> = { developer: T; user?: T }
export type Wording = ByView<string>

// shared/lib/view/wording.utils.ts
/** The value of a view: its own, or the one of the developer view. */
export function inView<T>(value: ByView<T>, view: View): T
```

`useWording(wording)` returns `inView(wording, useView())`. The default of `ViewContext` becomes `developer`. `TestProviders` takes `view`, default `developer`.

**Labels: every `Wording` of today.** In each file below, the `user` text moves to `developer` and the `user` key is dropped. Every reader that indexes a label (`labels[status][view]`) calls `inView(labels[status], view)` or `useWording`.

| Module | Files |
|---|---|
| `run` | `status/run-status.constants.ts`, `stages/stage-status.constants.ts`, `work/work.constants.ts`, `runs/run-error.constants.ts` |
| `thread` | `messages/messages.constants.ts` |
| `review` | `interrupts.constants.ts` |
| `artifact` | `artifacts/artifacts.constants.ts`, `exports/exports.constants.ts`, `revisions/revisions.constants.ts`, `status/item-status.constants.ts` |
| `workflow` | `content/value-labels/*.constants.ts` (five files) |
| `project` | `projects/projects.constants.ts` |

**Content: every branch on the view.** Each keeps what the user view does today, for both views, and the code of the developer variant is deleted. A rule that no longer reads the view loses its `view` parameter; it gets one back when the user view differs.

| File | Today | After V1 |
|---|---|---|
| `activity/entities/activity-entries.utils.ts` | A phase of an internal stage is kept in the developer view (`phaseEntries`, `shownWork`) | Always dropped; `view` leaves `PhaseTitles`, `shownWork` and `runEntries` |
| `activity/entities/hooks/useRunEntries.ts` | Passes the view | No view |
| `activity/widgets/chat/components/PhaseEntryView.tsx` | Node ids in the developer view | The stage title and the subject |
| `activity/widgets/chat/components/RunActivity.tsx` | The run number in the developer view | No run number |
| `activity/widgets/chat/components/WrittenEntryView.tsx` | The developer view lists each item by key and version | One group per kind of item, as the user branch draws |
| `activity/widgets/panel/components/ProgressSection.tsx` | The key of a subject beside its title in the developer view | Removed |
| `run/entities/work/work-notes.utils.ts` | Thinking notes in the developer view | Never shown |
| `run/entities/work/work-items.utils.ts`, `hooks/useWorkWords.ts` | Words and items by view | The user form; `workWords` entries become plain functions |
| `artifact/entities/status/item-status.utils.ts`, `documents/widgets/panel/document-tree.utils.ts`, `row-look.utils.ts` | Take a view for a label | `inView`, the parameter stays (a label) |
| The other readers of `useView` (revisions, outline, trace chain, item layout, design system card) | A word or a small variant | The user form |

About 50 source files and 19 test files name a view today. The tests of a developer variant are deleted with it; the others drop the view from their cases.

**As built:** `WorkWords` lost `details`, and `workMessages` lost `iteration`, `counts` and `steps`, which only the developer variants read. A rule that still takes a view (`itemStatusLook`, the rows of Documents) takes it for a label.

**Not in V1:** the sentences of the widgets (`activityChatMessages` and the like) stay plain strings. They are already the words on screen.

## 9. V3: the chat leaves the workbench

**Goal:** `activity/widgets/chat` imports neither `shared/components/frame` nor `shared/routes` for an address of a page.

**As built**

| Before | After |
|---|---|
| `ActivityPage` called `useEditorTab`, then drew the chat | `ActivityChat` is the export of the chat slice and knows no frame. The tab is `ActivityTab` of the new slice `activity/widgets/tab` |
| `MessageEntry`, `WrittenEntryView`, `PendingReview` called `useOpenPage(routes.project(id).document(...))` | Each control calls `useReferenceOpener(reference)`, which gives what opens it, or null where the page gives no opener; then the reference is text, not a button |
| `MessageEntry` took `projectId` only to build an address | The prop is gone |

**Not done, on purpose:** the run settings button stays in `ActivityPrompt`. Whether the user view offers run settings is [question Q7 of Web App Views](architecture/web-app-views.md#14-open-questions); a page is a Server Component and cannot hand the chat a function, so the seam is chosen once that is answered.

**Files**

```text
activity/
├── entities/
│   ├── reference-opener.types.ts                # ChatReference, ReferenceOpener
│   ├── components/ReferenceOpenerProvider.tsx   # the context and its provider
│   ├── hooks/useReferenceOpener.ts              # what opens one reference, or null
│   └── index.ts
└── widgets/
    ├── chat/
    │   ├── components/ActivityChat.tsx          # ActivityPage.tsx renamed; no useEditorTab
    │   └── index.ts                             # exports ActivityChat
    └── tab/                                     # new slice, mounted by the developer tree only
        ├── ActivityTab.tsx
        ├── activity-tab.constants.ts
        ├── __tests__/
        └── index.ts
```

```ts
// activity/entities/reference-opener.types.ts
export type ChatReference =
  | { kind: 'document'; artifactId: string }
  | { kind: 'item'; itemId: string }

export type ReferenceOpener = (reference: ChatReference) => void

// activity/entities/hooks/useReferenceOpener.ts
export function useReferenceOpener(reference: ChatReference): (() => void) | null
```

The page of the developer tree joins the two slices, since a widget does not import a widget:

```tsx
// app/developer/(project)/projects/[projectId]/activity/page.tsx
<ActivityTab projectId={projectId}>
  <ActivityChat projectId={projectId} />
</ActivityTab>
```

`RunActivityContext` stays as it is: it holds what belongs to one run. The opener is one value for the whole chat, so it has its own context.

## 10. V4: the chat frame and the pages of the user view

**Shared code**

```text
shared/components/chat-frame/
├── components/ChatFrame.tsx
└── index.ts
```

```tsx
interface ChatFrameProps {
  /** The side list, top to bottom: what starts new work, the list, the account. */
  sidebar: ReactNode
  /** Components that render nothing in place: dialogs mounted once. */
  contributions?: ReactNode
  children: ReactNode
}
```

It is built on `Sidebar` of `shared/components/ui/sidebar.tsx`, with design-system props and no new color.

**Widgets**

| Slice | Component | Reads |
|---|---|---|
| `project/widgets/sidebar` (new) | `ProjectSidebar`: "New project", the projects by attention with their status, the menu of a project | `project` entities; the features `create`, `rename`, `archive`, `delete`; the address of a project comes as a prop `hrefOf(projectId)` from the app layer |
| `user/widgets/menu` | `UserMenu`, exported beside `AccountMenuItem` | As today |
| `project/widgets/dialogs`, `activity/widgets/chat` | Unchanged | - |

**Pages**

```text
app/user/
├── layout.tsx                                   # built
├── (home)/
│   ├── layout.tsx                               # ChatFrame with ProjectSidebar
│   ├── page.tsx                                 # NewProjectPrompt and the recent projects
│   └── settings/page.tsx
└── (project)/projects/[projectId]/
    ├── layout.tsx                               # ChatFrame, ProjectGate
    └── page.tsx                                 # ActivityChat
```

`userRoutes`: `home`, `settings`, `project(id)`.

**Rename in its own commit:** `routes` becomes `developerRoutes`, with `login` and `register` staying in a map of the pages every host has (`authRoutes`). About 62 files import `routes`; do it when no other branch of the stack is open on them.

**Lint**, in a `build` commit before the pages: `lint/lib/imports/tree-patterns.constants.js` and a block in a new `lint/configs/imports-trees.js`.

| Files | May not import |
|---|---|
| `src/app/user/**` | `@/shared/components/frame`, `@/modules/traceability/**`, `@/modules/documents/widgets/{panel,document,item}`, `@/modules/activity/widgets/{panel,tab}`, `@/modules/project/widgets/{list,menu,status}` |
| `src/app/developer/**` | `@/shared/components/chat-frame`, `@/modules/project/widgets/sidebar`, `@/modules/documents/widgets/sheet` |
| `src/modules/**`, `src/shared/**` | `@/shared/lib/view-tree` (only the proxy and the route helper read it) |

## 11. V5: the read-only sheet beside the chat

| Part | Where |
|---|---|
| `DocumentSheet`: a document or an item, read-only, in a `Sheet` at the side of the chat | `documents/widgets/sheet` (new) |
| Which reference is open | The address: `?document=<artifactId>` or `?item=<itemId>`, read with `useRouteParam`, so that Back closes the sheet and a link opens it |
| The opener of the user tree | `ReferenceSheetOpener` in `documents/widgets/sheet`: a `ReferenceOpenerProvider` whose opener sets the parameter |
| The page | `app/user/(project)/projects/[projectId]/page.tsx` wraps `ActivityChat` in it and renders `DocumentSheet` beside it |

`documents` sits above `activity` in no list of `moduleImports`; `documents` may read `activity` only if its list gets it. V5 adds `activity` to the list of `documents`, since the opener context is an entity of `activity`.

Editing items before answering stays in the developer view.

## 12. State and data flow

| State | Where | Note |
|---|---|---|
| The view | `ViewContext`, set by the layout of the tree | Never in a store, a cookie or a setting |
| The host of each view | The rule of `viewOfHost` | One constant, `DEVELOPER_HOST_LABEL` |
| Open tabs, panels, side feature | The stores of `shared/components/frame` | Workbench only |
| The reference the sheet shows | The address | V5 |
| Data of the server | The query hooks of the entities | The same cache for both frames |

A request: the proxy reads the host, rewrites the path to the tree; the layout of the tree gives the view; the layout of the group mounts the frame; the page places the widgets. A click on a link asks the address without the folder, and the proxy rewrites it the same way.

## 13. Tests

| PR | Test | Cases |
|---|---|---|
| V2, built | `shared/lib/view-tree/__tests__/view-tree.utils.test.ts` | Host to view (8), address to page of each view (3), tree paths and their addresses (8) |
| V2, built | `shared/routes/__tests__/routes.utils.test.ts` | The addresses of today are unchanged; `userRoutes.home()` |
| V1, built | `shared/lib/view/hooks/__tests__/useWording.test.ts` | Own words in the user view, the developer words in the developer view, the fallback for a value without user words, the developer view under no provider |
| V1 | The tests of each labels file and each rule of [section 8](#8-v1-the-words-of-today-become-the-developer-words) | The words of today, without a view |
| V3, built | `activity/widgets/chat/components/__tests__/MessageEntry.test.tsx` | A card is a button with an opener and only reads without one; the opener gets the document and the item |
| V3, built | `activity/widgets/tab/__tests__/ActivityTab.test.tsx` | A document and an item of the chat each open their page |
| V4 | `lint/configs/__tests__/configs.test.js` | A file of each tree and the imports it may not have |
| V4 | `tests/e2e/` | One spec per host: the user host opens a project in the chat frame; the developer host is covered by the specs of today |

## 14. Docs to update

| Doc | With | Change |
|---|---|---|
| `docs/architecture/web-app-views.md` | V2 | Committed as the decision record |
| `docs/architecture/web-app-modules.md` | V2 | Section 1 (the trees of `src/app/`), section 8 (`view-tree`, the view comes from the tree) |
| `frontend/README.md` | V2, V1 | The two hosts in "Run it"; "Words of the screens": one text, the user word when it differs |
| `frontend/CONTRIBUTING.md` | V1, V4 | The naming rules of [section 5](#5-naming); the lint of the trees |
| `frontend/lint/README.md` | V4 | The row "Ban an import for one place" gets `imports-trees` |

## 15. Left for later

| Item | Why |
|---|---|
| A link from one view to the other, `hostOfView` | No screen needs it yet |
| The session on both hosts (the cookie `Domain`) | A deployment setting of the backend |
| Refining the user words | Screen by screen, once a screen is in the user view |
| The export at the end of a run in the user view | After V5 |
| The command palette in the chat frame | [Question Q2](#17-questions) |

## 16. Commits and checks

PR A, as committed, in order:

1. `refactor: make the words on screen the words of the developer view` (V1, whole: the type, the labels, their readers and the content that only the developer view showed depend on each other, so one commit compiles and three would not)
2. `refactor(app): move the pages of today under the folder of the developer view` (V2; moves only, so it shows as renames; it does not typecheck alone, the next commit gives the addresses)
3. `feat(app): choose the pages of a view by the host of the request` (V2: the proxy, the helpers, the addresses, the layouts that state the view)
4. `fix(app): let every layout and page block, so that the mocks pass the instant check` (V2)
5. `test(e2e): run the specs at the host of the developer view` (V2)
6. `refactor(activity): let the page of the chat say what opening a reference does` (V3, whole)
7. `docs: describe the two views of the web app`
8. `docs: plan the two views of the web app` (this file; drop the commit if the plan goes to the branch of the plans instead)

Checks for each PR: ESLint and Prettier on the changed files, Vitest on the touched folders, typecheck once. V2 also had one dev server run and one production build, since the host rule can only be seen in a running app; no later PR needs the build again.

## 17. Questions

| Id | Question | The plan builds |
|---|---|---|
| Q1 | (Answered, 2026-11-11) In V1, six developer variants are content, not words: thinking notes, the run number, the phases of internal stages, node ids as the title of a phase, the items written listed by key and version, and the key of a subject in Progress. Are they dropped too? | All six are dropped; the developer view shows what the app shows today |
| Q2 | Does the chat frame have the command palette? | No |
| Q3 | Does the user view show threads, or one conversation per project? | One per project, as Activity does |
| Q4 | Is the production host of the user view the bare domain, and the developer view `dev.`? | Yes; the rule is one constant |
| Q5 | Does the CI runner resolve `dev.localhost`? | Assumed yes (it does on this laptop); the first E2E run on the PR confirms it |

## 18. Checklist

- [ ] In PR A, the commits of V1 come before the commits of V2
- [ ] No address on screen names a view
- [ ] Only `src/proxy.ts` reads the host
- [ ] No component chooses a frame, an address or a layout by `useView()`
- [ ] No component or hook is named `User...` or `Developer...` for the view
- [ ] `activity/widgets/chat` imports neither `shared/components/frame` nor a route map (after V3)
- [ ] Each tree imports only what the lint of the trees allows (after V4)
- [ ] The answers to the questions are written in `web-app-views.md`
