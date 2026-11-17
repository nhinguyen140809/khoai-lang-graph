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
- [11b. V6: the frame of the chat, refined](#11b-v6-the-frame-of-the-chat-refined)
- [12. State and data flow](#12-state-and-data-flow)
- [13. Tests](#13-tests)
- [14. Docs to update](#14-docs-to-update)
- [15. Left for later](#15-left-for-later)
- [16. Commits and checks](#16-commits-and-checks)
- [17. Questions](#17-questions)
- [18. Checklist](#18-checklist)

---

## 1. The PRs

Three PRs, each based on the one before. The first holds three parts, V1 to V3, which change nothing a person does on screen; each part is a run of commits that stands alone, in the order below, so that the workbench never shows the developer words of today. All three parts are built in the working area of `feat/fe/two-views` and not committed.

| PR | Branch | Title | Parts | Changes on screen | State |
|---|---|---|---|---|---|
| A | `feat/fe/two-views` | The pages of each view and the host that shows them | V1, the words of today become the developer words ([section 8](#8-v1-the-words-of-today-become-the-developer-words)); V2, the areas, the proxy and the view from the area ([section 7](#7-v2-built-the-pages-of-each-view-and-the-host-that-shows-them)); V3, the chat leaves the workbench ([section 9](#9-v3-the-chat-leaves-the-workbench)) | The app answers at `dev.localhost`; `localhost` shows a placeholder | Built, not committed |
| B | `feat/fe/chat-frame` | The chat frame and the pages of the user view | V4 ([section 10](#10-v4-the-chat-frame-and-the-pages-of-the-user-view)) | The user host shows projects and their chat | Built, not committed |
| D | `feat/fe/chat-frame-refined` | The frame of the chat refined: the bar of a project, the sections and the search of the side list, the account across it, the list of the documents, and export | V6 ([section 11b](#11b-v6-the-frame-of-the-chat-refined)) | The user host gets the bar, the rail, the search, the archived projects and the export | Built, not committed, in the working area of `feat/fe/chat-frame` |
| C | `feat/fe/reference-reader` | The read-only reader beside the chat | V5 ([section 11](#11-v5-the-read-only-sheet-beside-the-chat)) | A reference of the chat opens its document | Built, not committed, in the working area of `feat/fe/chat-frame` |

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
| Frame | The layout around a page | `Workbench`, `Desk` | `shared/components/frame/` (`layouts/`, and `sidebar/` for the side list of the chat) |
| Area | The pages of one view | `app/developer/`, `app/user/` | `src/app/`, named after the view |

A area states its view and mounts its frame. Nothing below the app layer knows the area or the host.

## 4. Decisions

1. **The host chooses the area, in one file.** `src/proxy.ts` rewrites a request to the area of the view of its host. A host whose first label is `dev` shows the developer view; any other host shows the user view. No view override: local work uses `localhost` and `dev.localhost`.
2. **The area states the view.** `app/developer/layout.tsx` and `app/user/layout.tsx` each mount `ViewProvider` with their view. `Providers` does not. `useView()` reads that context; no component reads the host.
3. **A view branch changes words and content, never the frame or an address.** `useView()` may choose a label or which lines show. What a click opens is given from the app layer (decision 6). A different layout is a different component (decision 5).
4. **The modules are not split by view.** There is no module, layer or folder named after a view inside `src/modules/`. A slice with no view in its name serves both views. A slice that one area mounts is known by that: the lint rule of [section 10](#10-v4-the-chat-frame-and-the-pages-of-the-user-view) keeps the other area from importing it.
5. **Two forms of one block are two widgets, each named after its form.** The projects are a table in the workbench (`project/widgets/list`) and a side list in the chat frame (`project/widgets/sidebar`). What both read stays in the entities and the features of `project`. A component never takes a view as a prop (`variant="user"`, `isDeveloper`).
6. **A shared block gets what differs by frame from above.** The chat does not import the workbench or a route map. The app layer wraps it in a provider that says what opening a reference does. This is composing from the layer above, as the slices of one layer may not import each other.
7. **Words.** A value that reads differently by view is a `ByView<string>`: `{ developer: string; user?: string }`. A missing `user` reads the `developer` text. The words on screen today are the developer words; the user view starts with the same and is refined screen by screen.
8. **Addresses.** One route map per area. A leaf writes the path of its page as the folders of `src/app/` write it, with the folder of the area, and `checkedRoute` returns the address without it. Shared slices import no route map.
9. **Kept as it is:** the workbench and every hook of `shared/components/frame`, the module order of `moduleImports`, the layers inside a module, the `@x` files, the mocks, `PromptInput`, `FeedEntry`, the states, the command palette, `useRunCost`.

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Area folder | The view | `app/developer/`, `app/user/` |
| Area layout | `<View>Layout` | `DeveloperLayout`, `UserLayout` |
| Frame | A proper noun of the layout, never the view | `Workbench` (exists), `Desk` |
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
| `View`, `views`, `useView`, `useWording`, `ViewProvider` | `shared/lib/view` | The view of a area and the words of a value |
| `Workbench`, `TabbedWorkspace`, `UntabbedWorkspace`, `useEditorTab`, `useOpenPage` | `shared/components/frame` | The developer area, unchanged |
| `Sidebar` and its parts | `shared/components/ui/sidebar.tsx` | The side list of `Desk` |
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
| `viewOfHost`, `areaPathOf`, `isAreaPath`, `addressOfAreaPath` | `shared/routes/hosts/hosts.utils.ts` | V2, built | `src/proxy.ts`, `checkedRoute` |
| `proxy` | `src/proxy.ts` | V2, built | Next.js |
| `userRoutes` | `shared/routes/routes.utils.ts` | V2, built | The user area |
| `ByView<T>`, `inView` | `shared/lib/view/view.types.ts`, `shared/lib/view/wording.utils.ts` | V1 | Every labels file and the pure rules that take a view |
| `Desk` | `shared/components/frame/layouts/`, with its bar in `frame/bars/` and its side list in `frame/sidebar/` | V4 | `app/user/` |
| `hostOfView` | `shared/routes/hosts/` | Later, with the first link across views | - |

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
        ├── routes/hosts/                 # new: hosts.utils.ts, index.ts, __tests__/
        └── routes/                        # checkedRoute, routes, userRoutes, defaultAfterLogin
```

**What changed in existing code**

| File | Change |
|---|---|
| `shared/routes/typed-route/typed-route.utils.ts` | `checkedRoute` takes the path of the page with the folder of its area and returns the address without it |
| `shared/routes/routes.utils.ts`, `project-routes.utils.ts` | Each leaf writes `/developer/...`; the addresses they return are the same as before. `userRoutes` with `home` |
| `shared/routes/auth/auth-hrefs.utils.ts` | `defaultAfterLogin` is `routeOfAddress('/')`: no page sits at `/` in the folders any more, and every view has a home there |
| `app/developer/**/page.tsx`, `layout.tsx` | `PageProps<'/developer/projects/...'>`; `export const instant = false` on the layouts and pages that lacked it |
| Four test files (`TopBar.test.tsx`, `useOpenPage.data.ts`, `render-workbench.utils.ts`, `render-documents-frame.utils.ts`) | `routes.home()` in place of the literal `'/'` |

**Checked**

| Check | Result |
|---|---|
| Typecheck, ESLint and Prettier on the changed files, Vitest on `shared/routes`, `shared/lib/view`, `shared/routes/hosts`, `shared/components/frame`, `test/` (36 files, 291 tests) | Pass |
| Dev server with mocks, headless Chromium: `localhost/` shows the user area; `localhost/projects`, `/user`, `/developer/projects` are 404; `/login` is the same page on both hosts; `dev.localhost/` redirects to `/projects`; a click on a project opens `/projects/<id>/activity` with the tabs | Pass |
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
    └── tab/                                     # new slice, mounted by the developer area only
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

The page of the developer area joins the two slices, since a widget does not import a widget:

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
│   ├── page.tsx                                 # NewProjectPrompt
│   └── settings/page.tsx
└── (project)/projects/[projectId]/
    ├── layout.tsx                               # ChatFrame, ProjectGate
    └── page.tsx                                 # ActivityChat
```

`userRoutes`: `home`, `settings`, `project(id)`.

**Rename in its own commit:** `routes` becomes `developerRoutes`, with `login` and `register` staying in a map of the pages every host has (`authRoutes`). About 62 files import `routes`; do it when no other branch of the stack is open on them.

**Lint**, in a `build` commit before the pages: `lint/lib/imports/area-patterns.constants.js` and a block in a new `lint/configs/imports-areas.js`.

| Files | May not import |
|---|---|
| `src/app/user/**` | `@/shared/components/frame`, `@/modules/traceability/**`, `@/modules/documents/widgets/{panel,document,item}`, `@/modules/activity/widgets/{panel,tab}`, `@/modules/project/widgets/{list,menu,status}` |
| `src/app/developer/**` | `@/shared/components/chat-frame`, `@/modules/project/widgets/sidebar`, `@/modules/documents/widgets/sheet` |
| `src/modules/**`, `src/shared/**` | `@/shared/routes/hosts` (only the proxy and the route helper read it) |

**As built**

| Plan | Built | Why |
|---|---|---|
| `ProjectSidebar` gets `hrefOf(projectId)` as a prop from the app layer | `useProjectPages` of `project/entities` says where the frame on show opens a project and starts one; the workbench is the default (`workbenchProjectPages`), and `ChatProjectPagesProvider` of `project/widgets/sidebar`, mounted by `app/user/layout.tsx`, gives the pages of the chat | A layout is a Server Component and cannot hand a function to a Client Component. The shared parts needed the same seam: the dialog that creates a project opens it, the dialog that cannot delete a project leads to it, `ProjectNotFound` leads to the other projects, and `useOpenProjectPrompt` opens the page where a project starts. They read `useProjectPages` instead of `routes` |
| `app/user/(home)/page.tsx` places `NewProjectPrompt` | `ProjectStartPage` of the new slice `project/widgets/start` | The page keeps the state of the dialog that creates a project, which a Server Component cannot; the slice is the one Decision 6 of Web App Views names |
| `ProjectSidebar` | Takes `activeProjectId`, which the layout of a project gives, and `footer`, where the layouts place `UserMenu` | A widget does not import a widget, so the layout composes the two |
| The layout of a project | `ProjectGate` sits inside `ChatFrame`, and the layout also mounts `ActivityDialogs` | The side list stays when a project is not found; the run settings button of the prompt opens its dialog |
| `routes` becomes `developerRoutes` in its own commit | Not done | `refactor/fe/misc-cleanups` is open on four files that import `routes` |
| Lint of the areas | `lint/lib/imports/area-patterns.constants.js` and `lint/configs/imports-areas.js`, with the rows of the table above; the pattern of `hosts` joins the patterns of the modules and of shared code, and a last block of `imports-shared.js` lets `typed-route` read it; `@/shared/components/chat-frame` is imported from its index | As planned; the index rule matches the one of the workbench |

Checked: typecheck, ESLint and Prettier on the changed files, Vitest on the touched folders and on the lint configs, the E2E spec of the user host, and one run of the dev server with mocks in a headless browser (the start page, the chat of a project, the side list on a phone, and the developer host unchanged).

## 11. V5: the read-only sheet beside the chat

| Part | Where |
|---|---|
| `DocumentSheet`: a document or an item, read-only, in a `Sheet` at the side of the chat | `documents/widgets/sheet` (new) |
| Which reference is open | The address: `?document=<artifactId>` or `?item=<itemId>`, read with `useRouteParam`, so that Back closes the sheet and a link opens it |
| The opener of the user area | `ReferenceSheetOpener` in `documents/widgets/sheet`: a `ReferenceOpenerProvider` whose opener sets the parameter |
| The page | `app/user/(project)/projects/[projectId]/page.tsx` wraps `ActivityChat` in it and renders `DocumentSheet` beside it |

`documents` sits above `activity` in no list of `moduleImports`; `documents` may read `activity` only if its list gets it. V5 adds `activity` to the list of `documents`, since the opener context is an entity of `activity`.

Editing items before answering stays in the developer view.

**As built**

- **A split, not a sheet (decided by the user, 2026-11-13).** A modal sheet covers the chat, and the review that the document is read for is answered in the chat. On a wide screen the reader opens beside the chat in a `ResizablePanelGroup`, with a handle between them and a button that closes it; the chat keeps its place, its scroll and the text of its prompt. On a narrow screen it opens in a `Sheet` over the chat, as planned. The slice is `documents/widgets/reader`, and its one export, `ReaderSplit`, takes the chat as its children and gives it the opener; `DocumentSheet` and `ReferenceSheetOpener` are gone, and the lint of the developer area names `documents/widgets/reader`.
- `RouteParam.Document` (`document`) is new; the reader reads `item` too, the parameter that a document page scrolls to. A document wins when the address names both.
- `useReaderReference` of the slice reads the reference, opens another with `router.push` (Back closes the reader) and closes it with `router.replace` to the address of the chat. It keeps the last reference while the sheet of a narrow screen slides away.
- The reader draws a document with `ArtifactDocument`; an item that the document names is a link that opens the item in the reader, and Back returns to the document. An item shows the title of its kind, its title, its status and its filled fields under their titles, the fields that the item page shows; its key line, links and history stay in the developer view.
- `moduleImports.documents` gets `activity`.

Checked in the headless browser: a reference of the chat opens its document beside the chat, which still takes a message, an item of the document opens in its place, Back returns to the document and then closes the reader, a phone opens it in a sheet, and on the developer host the same reference still opens the page of the document in a tab.

## 11b. V6: the frame of the chat, refined

Asked by the user on 2026-11-14, after V5: a bar at the top of the page of a project, sections in the side list, a search, a wider account menu, and the export. It follows the rules of this plan: a block whose layout differs by frame is two components, each named after its form, and what both forms do sits below them, in a hook, an entity component or a feature. No component reads the view to choose its layout.

**Where each part goes**

| Part | Where | Shared with the workbench |
|---|---|---|
| The mark and the name of the app (`LogoMark`, `AppName`) | `shared/components/brand/` (`LogoMark` moved from the frame with `git mv`) | The top bar and the login screen use the same two |
| The frame: a side list that folds to a rail of icons, its first row with the button that folds it and the name of the app, and the page beside it | `ChatFrame` of `shared/components/frame/layouts/`, mounted once by `app/user/layout.tsx`, so that the side list keeps its state from page to page | - |
| The bar at the top of a page and the page under it | `ChatScreen` of the same folder: the title at the left, the actions at the right, and the button that opens the side list on a narrow screen | - |
| A section of the side list that folds, with the action that shows while it is hovered | `SidebarSection` and `SidebarSectionAction` of the same folder | - |
| The search box of the side list | `SidebarSearch` of the same folder; on the rail it is a button that unfolds the list and puts the focus in the box | - |
| The items of the menu of a project: Rename, Archive or Restore, Delete | `ProjectActionItems` of `project/entities`, which takes what each item does | The rows of the project table and the side list, and the bar of a project |
| The name of a project by its id, while it loads and when it fails | `ProjectName` of `project/entities`, taken out of `ProjectSwitcher` | `ProjectSwitcher` of the top bar |
| The side list of the projects: the search, the button that starts a project under it, the section Projects with View all | `project/widgets/sidebar` | - |
| The page of every project, `/recents`: the tabs Active and Archived at the left, the search and Create project at the right, the projects under them | `project/widgets/recents` | The menu items (`ProjectActionItems`), the search of a list by name (`useProjectSearch`) and the words of an empty list (`emptyProjectListMessage`) of `project/entities` |
| The name of the open project in the bar, with the menu of its actions | `ProjectHeading` of the new slice `project/widgets/heading` | Its menu items; the workbench shows `ProjectSwitcher` instead |
| The account at the bottom of the side list, across its width, with the menu above it and a Settings item | `SidebarAccountMenu` of `user/widgets/menu`; the items of both menus are `AccountMenuContent`, and the dialog that asks before logging out is shared | `UserMenu` of the activity bar |
| The list of the documents of a project in the reader | `documents/widgets/reader`, opened by `DocumentsButton` in the bar | The marks of `documents/entities` (`useDocumentList`, `documentMarkLooks`) |
| Export | `artifact/features/export` and `artifact/widgets/export`, as plan S1d writes them; `ExportProjectButton` in the bar | The dialog and the downloads |

**Rules of the side list**

- A project shows its status only when it asks for something or changes: Waiting for you, Failed, Working, Starting and Stopped. Done and Not started show nothing. The icon of the status sits at the end of the row, and gives its place to the button of the menu while the row is hovered or holds the focus.
- The section Projects lists the 10 active projects with the latest activity, from the one that needs the user most, and ends with View all, which opens `/recents`; its action, shown on hover, starts a project. The archived projects are on the tab Archived of `/recents`, each with Restore and Delete.
- The search of the side list loads the whole list of the active projects, and keeps those whose name holds it, whatever its case and accents (`hasTextPart`); without a search, only the 10 latest load.
- The edge of the side list resizes it when dragged, between 224 and 384 pixels, and folds it to its rail once the pointer goes nearer than 144 pixels to its left side; dragged back from the rail, it opens again, and a click on the edge folds or opens it. The widths are `sidebarWidths`, the rules `useResizableSidebar`, and the width and the state are kept in the browser, read after the first render as the panels of the workbench are.
- The first row shows the name of the app alone, a size larger than the text, without the mark.
- Folded, the side list is a rail with the button that unfolds it, Search, Create project and the account; the button keeps its place at the top left in both states.

**What is new in the address:** `RouteParam.Reader` (`reader=documents`) opens the reader on the list of the documents.

**As built**

| Plan | Built | Why |
|---|---|---|
| V4: each group of `app/user/` mounts its own `ChatFrame` | `app/user/layout.tsx` mounts it once; the layout of `(home)` and of a project only place a `ChatScreen`; `ProjectSidebar` marks the open project from the address and takes no id | Two frames remounted the side list from page to page: it lost its folded state, its sections and its search |
| A side list that hides | `collapsible="icon"` of `Sidebar`: a rail with the toggle, Search, Create project and the avatar | The toggle keeps its place at the top left, as asked, and the rail keeps the actions in reach |
| Export as plan S1d writes it | The feature and the widget of S1d, with the dialog, the downloads, the stores and the toasts, plus `ExportProjectButton`, which opens the dialog on the first template; `ExportDialogs` is mounted by the layout of a project of the user area | The bar exports the project, not one document. `ExportButton` on the page of a document and the commands of the palette, which S1d also writes, and the mount in the workbench are left for the PR of S1d |
| - | `downloadFile` of `shared/lib/url`, the one file that touches `document` for a download (listed in `restricted-access.js`); `canRetryOnce` given by the index of `shared/api/query-client`; `exportKeys.create` | S1d needs them; each goes where its kind of code lives |
| - | `LogoMark` moved to `shared/components/brand/` with `git mv` | The frame of the chat may not import the workbench; the move can be a commit of its own |
| V4: the start page lists the recent projects under its prompt; the side list starts with Create project, then the search | Asked on 2026-11-16: the start page holds only the prompt, a little above the middle of the screen, and Create project sits under the search | The side list already lists every project, with its status and its menu |
| A side list of one width, with the mark and the name of the app in its first row | Asked on 2026-11-17: the edge resizes the side list and folds it to the rail past a width (`useResizableSidebar`); the first row shows the name alone, larger | The hook follows the drag to resize of the community sidebars (a press that moves 5 pixels is a drag, a fold width past the narrowest, the width stored when the drag ends), with pointer capture on the edge instead of listeners on the document, and the store of the workbench panels instead of a cookie. The workbench keeps `AppName`, with the mark |
| The section Archived in the side list, and all the active projects in the section Projects | Asked on 2026-11-17: the side list loads the 10 latest active projects and ends with View all; `/recents` (`project/widgets/recents`) lists every project, with the tabs Active and Archived, a search and Create project. The search of the side list loads the whole list of the active projects | The list of projects has no search of its own on the API, so both searches keep the loaded projects whose name holds the search. The menu of a row joins three features, so the side list, the page and the project table each write it; a widget may not import another |
| A folder of its own for the frame of the chat, `shared/components/chat-frame/`, and the rows, the menus and the states of the side list written in `project/widgets/sidebar` | Asked on 2026-11-17: `ChatFrame` and `ChatScreen` in `frame/layouts/`, the side list in `frame/sidebar/` beside the parts of the workbench; the rows and the states that name no object (`SidebarLinkItem`, `SidebarItemMenu`, `SidebarActionItem`, `SidebarRetryItem`, `SidebarNote`, `useSidebarLink`) moved there from the module, which keeps which projects, their statuses and their actions | `ui/sidebar.tsx` stays in `ui/`, as `ui/tabs` and `ui/resizable` do for the workbench: the rules of the code outside `ui/` (names, classes in brackets, access to `window` and `document`) do not hold for the code of shadcn/ui. The lint of the areas restricts the names of the frame index instead of the folder |
| `ChatFrame`, and `ChatScreen` placed by each layout with a title and actions | Asked on 2026-11-17: the frame is `Desk`, a proper noun of the layout as `Workbench` is, and `DeskProjectPagesProvider` follows it; `ChatScreen` is gone: the desk draws the bar, with two sides and no content of its own, and a page places its items with `useDeskBarItem` or `DeskBarItem`, on the registry of the status bar. `useRegisteredItems` takes the side of a bar as an argument, so both bars read their sides with it | A page that places nothing, such as Recents or the start page, has no bar on a wide screen; on a narrow one the bar keeps the button that opens the side list |
| `DeskProjectPagesProvider` in `project/widgets/sidebar`; `useRegisteredItems(store, side)`; on a phone, the button of the side list inside the bar | Asked on 2026-11-17: the provider and `deskProjectPages` sit in `project/entities` beside `workbenchProjectPages` and `ProjectPagesProvider`, and ESLint keeps the provider out of the developer area; `useRegisteredItems(store, { filters })` takes options, with a list of filters that an item must all pass, so the registry knows nothing of the fields of an item, and each bar filters by its side; on a phone the desk has the button of the side list at the top left of the page and the bar beside it only when the page places items, the side list opens over the page and has no edge (`SidebarEdge` renders nothing there) | The provider names where the projects open, a rule of the product, so it stays in the module; the side list does not use it. An option object leaves room for more options than the filters |
| Three stores kept in the browser, each writing the same options of `persist` | `browserPersistOptions` of `shared/lib/storage`, used by the panels, the side feature and the side list | The editor tabs keep their own options: their storage splits by entry, and their merge differs |
| The tooltip of the toggle wrote the modifier and a letter of its own | `sidebarHotkey` (a `Hotkey`) of the sidebar of the UI kit, which its listener checks with `isHotkeyPressed`, and which the tooltip names with `hotkeyKeys` and `aria-keyshortcuts` with `ariaKeyShortcuts`; the motion of the side list eases in and out, and stops for reduced motion | One hotkey, named as on the keyboard of the platform |

Checked: typecheck, ESLint and Prettier on the changed files, Vitest on every touched folder and on the lint configs, the E2E spec of the user host, and a dev server with mocks in a headless browser: the start page, a row hovered, the bar and the menu of a project, the documents in the reader, the export dialog and its toast, the account menu above its row, the rail, a phone with its side list, and the top bar of the workbench.

Proposed commits for PR D: `refactor: move the mark of the app out of the workbench` (the move and `AppName`); `feat(project): share the menu items and the name of a project between the frames` (`ProjectActionItems`, `ProjectName`, their use in the workbench); `feat(artifact): export the documents of a project` (S1d core, `downloadFile`, `canRetryOnce`, `exportKeys.create`); `feat(app): refine the frame of the chat` (frame, screen, sections, search, side list, heading, account menu, reader list, layouts, lint); `docs: the refined frame of the chat`.

## 12. State and data flow

| State | Where | Note |
|---|---|---|
| The view | `ViewContext`, set by the layout of the area | Never in a store, a cookie or a setting |
| The host of each view | The rule of `viewOfHost` | One constant, `DEVELOPER_HOST_LABEL` |
| Open tabs, panels, side feature | The stores of `shared/components/frame` | Workbench only |
| The reference the sheet shows | The address | V5 |
| Data of the server | The query hooks of the entities | The same cache for both frames |

A request: the proxy reads the host, rewrites the path to the area; the layout of the area gives the view; the layout of the group mounts the frame; the page places the widgets. A click on a link asks the address without the folder, and the proxy rewrites it the same way.

## 13. Tests

| PR | Test | Cases |
|---|---|---|
| V2, built | `shared/routes/hosts/__tests__/hosts.utils.test.ts` | Host to view (8), address to page of each view (3), area paths and their addresses (8) |
| V2, built | `shared/routes/__tests__/routes.utils.test.ts` | The addresses of today are unchanged; `userRoutes.home()` |
| V1, built | `shared/lib/view/hooks/__tests__/useWording.test.ts` | Own words in the user view, the developer words in the developer view, the fallback for a value without user words, the developer view under no provider |
| V1 | The tests of each labels file and each rule of [section 8](#8-v1-the-words-of-today-become-the-developer-words) | The words of today, without a view |
| V3, built | `activity/widgets/chat/components/__tests__/MessageEntry.test.tsx` | A card is a button with an opener and only reads without one; the opener gets the document and the item |
| V3, built | `activity/widgets/tab/__tests__/ActivityTab.test.tsx` | A document and an item of the chat each open their page |
| V4, built | `lint/configs/__tests__/configs.test.js` | A file of each area and the imports it may not have; the files that may and may not read `hosts` |
| V4, built | `tests/e2e/projects/chat-frame.spec.ts` | The user host opens a project in the chat frame; the developer host is covered by the specs of today |
| V4, built | `project/widgets/sidebar` (utils, `ProjectSidebar`), `project/widgets/start` (`ProjectStartPage`), `project/entities` (`useProjectPages`), `shared/components/chat-frame` (`ChatFrame`) | The order by attention, the links to the chats, the open project marked, the start of a project, a rename from the menu, a failed load; a project created from the start page that opens its chat; the default pages and a provider; the side list folded |
| V6, built | `shared/components/chat-frame` (`ChatFrame`, `SidebarSection`, `SidebarSearch`), `project/widgets/sidebar` (utils: order, search, the statuses shown, the empty words; `ProjectSidebar`), `project/widgets/heading`, `user/widgets/menu` (`SidebarAccountMenu`), `documents/widgets/reader` (the views, the list), `artifact/features/export` (utils, the dialog with the downloads), `workflow/entities/definition` (`exportTemplatesOf`) | The rail and the toggle; a section that folds and its action; the search and Escape; the order, the search, the archived section with Restore, the statuses; the menu of the open project and no other project; the account above its row with Settings and the log out; the list of the documents with the review that waits; the first template and its formats, Preparing, the file that downloads, the failed export |
| V5, built | `documents/widgets/reader` (utils, `ReaderSplit`) | The reference of a query, the address and the key of a reference; beside the chat on a wide screen: the chat stays, a document, an item, a document not found, the close; a sheet on a narrow screen; a reference of the chat that opens the reader |

## 14. Docs to update

| Doc | With | Change |
|---|---|---|
| `docs/architecture/web-app-views.md` | V2 | Committed as the decision record |
| `docs/architecture/web-app-modules.md` | V2 | Section 1 (the areas of `src/app/`), section 8 (`hosts`, the view comes from the area) |
| `frontend/README.md` | V2, V1 | The two hosts in "Run it"; "Words of the screens": one text, the user word when it differs |
| `frontend/CONTRIBUTING.md` | V1, V4 | The naming rules of [section 5](#5-naming); the lint of the areas |
| `frontend/lint/README.md` | V4 | The row "Ban an import for one place" gets `imports-areas` |

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

PR B, proposed commits, in order:

1. `build(lint): keep each area of the app to the slices of its own frame` (the area patterns, `imports-areas.js`, the `hosts` pattern, the index of `chat-frame`, their tests)
2. `feat(project): let the frame on show say where a project opens` (`useProjectPages` and its readers)
3. `feat(app): the chat frame and the pages of the user view` (`ChatFrame`, `userRoutes`, `project/widgets/sidebar` and `start`, `UserMenu`, `app/user/`, the E2E spec)
4. `docs: the two areas of the app in the README, the contributing guide and the modules`

PR C: `feat(documents): open a reference of the chat read-only beside it` (`documents/widgets/reader`, `RouteParam.Document`, the page of a project in the user area, `moduleImports`, the stub of `next/link` that keeps `scroll`).

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
- [ ] Each area imports only what the lint of the areas allows (after V4)
- [ ] The answers to the questions are written in `web-app-views.md`
