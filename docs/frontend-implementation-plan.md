# Frontend implementation plan

How the rest of the frontend gets built on the module structure of [Web App Modules](architecture/web-app-modules.md) and the frame of option D in [Usability](ui/usability.md): the entities of every module first, each with its mock handlers and tests, then the screens. Code from `feat/fe/mock` is copied only where it carries over almost unchanged; the rest is written new, with that branch as a reference. This plan replaces the path cut of [Frontend review plan](frontend-review-plan.md) from P7 on.

## Contents

- [1. Method and decision drivers](#1-method-and-decision-drivers)
- [2. Context](#2-context)
- [3. Decisions](#3-decisions)
- [4. Order of the modules](#4-order-of-the-modules)
- [5. Cleanup before the entities](#5-cleanup-before-the-entities)
- [6. Entities, module by module](#6-entities-module-by-module)
- [7. The frame](#7-the-frame)
- [8. Screens](#8-screens)
- [9. PR sequence](#9-pr-sequence)
- [10. Open points](#10-open-points)
- [11. Checklist](#11-checklist)

## 1. Method and decision drivers

The method stays GitHub Flow with one reviewable slice per PR, but the slices are cut by layer first: the entities of one module, with their endpoints, mock handlers and tests, are a slice; a screen, with its features, widgets and route, is a slice after them.

| Driver | Consequence for the plan |
|---|---|
| `main` is green after every merge | Each PR compiles and passes its tests alone: an entity PR brings the mock handlers of its endpoints |
| One logical change per commit; small fixes, refactors and docs share one PR; a feature, an entity or a large move has a PR of its own | The move to modules is reviewed apart from new code where it can be cut ([D6](#d6-the-current-branch)); the stored tabs, the contributing guide and the cleanup share C1, one commit each ([section 9](#9-pr-sequence)) |
| The screens are drawn only as the skeletons of option D | The entities, which follow `docs/API.md` and `docs/DATA_SHAPE.md` and no drawing, come first; a widget waits for its drawing |
| An entity or a feature is built in full, not only the part that a screen uses at once | An entity PR covers every endpoint of its module; a widget PR comes after the entities it reads ([D8](#d8-complete-entities-and-the-parts-of-p7)) |
| The frame names no feature and holds no rule of the product | The changes of [section 7](#7-the-frame) land in R1, before the screens add features to it |
| Copy only what carries over almost unchanged from `feat/fe/mock` | [Section 6](#6-entities-module-by-module) lists each copy and what changes in it; nothing else is copied |
| `docs/API.md` may lack an endpoint or a field that a screen needs | A gap goes to `docs/API.md` first and to [section 10](#10-open-points); no code and no mock answers an endpoint that the API does not describe |
| The machine has 8 GB | Checks run one at a time: lint of the changed files, tests of the touched folders, typecheck when types or routes change; the full lint and the full test run belong to CI |

## 2. Context

State on 2026-10-20.

| Branch | State |
|---|---|
| `main` | P0, P1, P2b, P3, P4, P5 and P6 of the review plan are merged (#9, #13, #11, #12, #17, #20, #25), with six PRs outside it: #15 (API calls in hooks only, the routes factory, the mocks in folders), #16 (form fields, confirm dialog), #19 (data-driven unit tests), #22 (radix-nova components, sign-in pages), #23 (screenshots of the mock states, fonts), #24 (tidy before the project screens) |
| `refactor/fe/modules` | R1, the move to modules: merged as #27 (`c15b568`), the branch deleted |
| `feat/fe/threads` | Deleted. P7 (threads, the run on the status bar, Stop, the labels of the stages, the budget of the month, a new chat), restored on `main` and placed, is kept in `refs/backup/feat-fe-threads-2026-10-20-placed` (pushed as `origin/feat/fe/artifacts-backup`, the same commit `d8dd52e`); its parts go to the PRs of [D8](#d8-complete-entities-and-the-parts-of-p7) |
| `docs/fe/api-fields` | P2, not merged: 8 files under `docs/` differ from `main` |
| `feat/fe/mock` | The source of the copies. Features in flat folders (`features/<name>/`), the mocks in one folder, the console UI |

How `feat/fe/mock` differs from this branch, which decides what can be copied:

- The API helpers are the same (`apiRequest`, `apiCommand`, `ApiError`), except lists: `fetchAllPages` there, `fetchPage` here.
- The mock helpers are the same (`mock-db`, `problem`, `pagination`, and `findProject`, `allRuns`, `findMockRun`, `stepsOfRun`, `changeRun`, `meRecord`), except the scenario helper: `answerScenario(mockScenario(name))` returns a response or null there, and `answerScenario(name)` throws or returns the scenario here. A handler changes three lines per route.
- The unit tests are not data-driven there: their cases are reused, in a `<file>.data.ts` with `it.each`.
- Each feature declares its own schemas of shared objects: an item in `artifacts`, `search`, `traceability` and `console`; `listRunSteps` in `console` and `workflow`; the definition in both settings features. The entities declare each object once, so these merge instead of being copied side by side.
- The console UI, the review page and the artifact pages follow the old frame. Option D replaces them: Activity, Documents, Search, Trace and Settings on the activity bar, Workflow in the developer view. Their components are not copied.

### Branches and backups

State on 2026-10-26, written before the work moved to another machine. In the order to use them for the next PRs, the most important first:

| # | Where | What it holds | Used by |
|---|---|---|---|
| 1 | `origin/chore/fe/entities-temp-2026-10-26` | The working tree of E0 (the whole `workflow` entity: kinds, content schemas, definition), E1 (`artifact`) and E1b (exports), not committed before, with the local-only docs below. One WIP commit above `main` of 2026-10-26 (`2588404f`) | Start here: check it out, then cut E0, E1 and E1b from it into their own branches from `origin/main` |
| 2 | `origin/feat/fe/artifacts-backup` (the same commit `d8dd52e` as `refs/backup/feat-fe-threads-2026-10-20-placed`) | P7: the threads, the runs, the status bar, Stop, the usage of the month, the budget, the new chat, on `main` of 2026-10-20 | E4 (runs), E6 (threads), E9 (usage), P7 and B1, as the table of [D8](#d8-complete-entities-and-the-parts-of-p7) says; read a file with `git show origin/feat/fe/artifacts-backup:frontend/<path>`. Its names predate C1 and M1 to M4 (`PROJECT_IDS`, flat `shared/` paths), so rename as commits 4 and 5 of C1 did |
| 3 | `origin/chore/fe/cleanup-steps-backup` (`4109d6a`) | C1: the seven commits of [section 9](#9-pr-sequence), not merged | The PR C1, which E4 and E8 need |
| 4 | `origin/feat/fe/mock` | The source of the copies ([D1](#d1-what-is-copied-from-featfemock)): the old features, the old mocks, the console UI | Every entity row that says "Copy"; delete it when nothing is left to copy |
| 5 | `origin/docs/fe/api-fields` | P2, the API and data shape docs of the fields that the screens read, and the diagram of the frontend architecture | Merge it before E1; the entities follow `docs/API.md` and `docs/DATA_SHAPE.md` |

For reading only, not for use: `origin/feat/fe/artifacts-backup-2` (the whole working tree on 2026-10-19, before the split into modules), `origin/feat/fe/artifact-entities-temp` (three throwaway commits of 2026-10-24, replaced by row 1), `origin/feat/fe/workflow-review`, `origin/feat/frontend/temp` and `origin/docs/study-notes` (older work that this plan does not use).

Not pushed, and left on the first machine: about 60 `refs/backup/*`. The names `lint-*`, `m2-*`, `m3-*`, `m4-*`, `new-*`, `old-*`, `rebuild-*` and `v10-*` are the steps of the PRs that are merged now (#30 to #35), kept as history. `artifact-entities-temp-2026-10-24`, `-2026-10-25`, `-2026-10-25-b` and `entities-before-branch` are older snapshots of the work in row 1. Nothing in them is needed for the next PRs.

The three local-only docs (`docs/frontend-implementation-plan.md`, `docs/frontend-review-plan.md`, `docs/ui/usability.md`) are in row 1 because it was committed with `git add -f`. They are listed in `.git/info/exclude` on the first machine so that no PR holds them. On the other machine, add the same three lines to `.git/info/exclude` after checking out row 1, and cut each PR branch from `origin/main`, then copy only the files of that PR from row 1 (`git checkout origin/chore/fe/entities-temp-2026-10-26 -- <paths>`), never the three docs.

## 3. Decisions

### D1. What is copied from `feat/fe/mock`

| Option | Evaluation |
|---|---|
| a. Path cut (`git checkout feat/fe/mock -- <paths>`), as in the review plan | The paths, the scenario helper, the paging, the test form and the UI all differ: every file would be edited after the cut |
| b. Copy the files and blocks that carry over almost unchanged; write the rest | Keeps the tested code: the content field rules (254 lines, 12 tests), about 1300 lines of artifact fixtures, the 19 content schemas |
| c. Write everything new | Repeats tested code and fixtures |

Decision: b. A file or a block is copied when only these change: its imports, the names of the types it reads (`WorkflowStep` becomes `RunStep`), the paging of a list, and the scenario helper of a handler. Its tests keep their cases in the data-driven form. Everything else is written new, reading the branch as a reference.

### D2. Entities of every module first

| Option | Evaluation |
|---|---|
| a. Screen by screen, each PR with the entities it needs | The screens are not drawn yet, and a screen reads several modules: the entities would land in pieces, in the order of the drawings |
| b. The entities of every module, in the order of [section 4](#4-order-of-the-modules), each PR with its mock handlers and tests; the screens after | Independent of the drawings, since every option of the frame reads the same data (D0 of Usability); every screen finds its data ready |
| c. Only the entities of the next screen | As a, with less code waiting on `main` |

Decision: b, for every module, since which screen reads which entities is not known yet. Trade-offs: entities wait on `main` without a screen, as the mocks of P5 did; the hand-written schemas grow, so the switch to the generated client replaces more of them; an entity holds the API function of every endpoint of its objects, writes included, but the mutation hooks belong to features and come with the screens.

### D3. Settings

Requirements: one Settings feature on the activity bar, inside a project and outside it, where the user chooses the scope: the user or the project, as the User and Workspace settings of VS Code. A value set on the project wins over the default of the user. The values are stored by different objects: UserSettings (`/me/settings`: theme, language of the UI, output language and run defaults for new projects, notifications), ModelSettings (`/me/model-settings`), Project (`output_language`, `run_config`, `model_overrides`), and the profile, password and sessions of the user.

| Option | Evaluation |
|---|---|
| a. No settings module: a settings page in each module (`user/widgets/settings`, `project/widgets/settings`) | A setting of both scopes is drawn on two pages, and the rule that a project value wins over the user default has no single place |
| b. A module `settings` above `project`, `user`, `llm-model` and `usage`, as `activity` is: the Settings feature (the side panel of its sections, the scope switch, the page of a section), the list of settings with their scopes, and the rule of the effective value. The values stay in the entities of the modules that store them, and the actions that save them in the features of those modules | One place for the screen and the scope rule; each object keeps one owner |
| c. One module that owns every setting, UserSettings and the settings of a project included | An object would have two owners, and `project` would read `settings` to create a project with the defaults of the user |

Decision: b. Consequences:

- RunDefaults and RunConfig, value objects of the runs, move to `run/entities`; RunDefaults sits in `project/entities` today. The fields that edit RunDefaults, which the dialog that creates a project and Settings both show, are a component of `run/entities`: the fields of a form, without its submit.
- The theme is `theme` of UserSettings, so changing it is a feature of `user` that the Settings page places. The theme buttons of the settings page of today move there.
- The account section (profile, password, sessions) is part of the user scope, as features of `user`.
- The server computes the effective value of a setting (the project value, else the default of the user, else the default of the definition) and answers it; the web app shows it and does not compute it. `docs/API.md` does not describe that answer yet ([D5](#d5-endpoints-that-the-api-lacks)).

### D4. The frame stays generic

The frame (`src/shared/components/frame/`) imports no module, which ESLint checks. A read of its code on 2026-10-19 finds what ESLint does not check:

| Finding | Change |
|---|---|
| `ProjectWorkspace` takes `projectId`, and `projectTabGroup` makes it the key of a tab strip; the tabs store says "a group is one project" | A workspace with tabs that takes the key of its tab strip from the layout; the project layout passes the project id |
| The command palette describes itself as "Go to a page or a project, or run a command." | Words without a product object, or given by the layout |
| `TopBar` imports `routes` for the link of the logo | The layout gives the address |
| The frame called an item of the activity bar `Activity` (`FeatureActivity`, `PlannedActivity`, `activities/`), the name of the feature of the module `activity` | `Destination`, the word of Material for the items of a navigation rail: `FeatureDestination`, `PlannedDestination`, `destinations/`; the region keeps the name of VS Code, `ActivityBar` |

The examples in the comments of the frame ("such as the run of the project") name no code and stay.

Done on `feat/fe/threads` (2026-10-19), part of R1: `Workspace` takes `tabGroup` from the layout and gives it to the pages through `TabGroupContext`, so `useEditorTab(tab)` takes no group and a page outside a workspace with tabs opens none; `projectTabGroup` is gone; `Workbench` and `TopBar` take `homeHref` from the layout; the palette reads "Go to a page or run a command."; the items of the activity bar are destinations.

### D5. Endpoints that the API lacks

The entities and the mocks follow `docs/API.md` and `docs/DATA_SHAPE.md`. A need found while drawing a screen goes to `docs/API.md` first, then to the entity. Found while writing this plan:

- `POST /threads/{thread_id}/runs` has a mock and `createRun` on this branch but is not in the API: a message starts a run. It goes with the first chat.
- `GET /exports/{export_id}/file` has a mock on `feat/fe/mock` but is not in the API, which gives a `download_url`. Not copied.
- The effective settings of a project, which the server computes ([D3](#d3-settings)), have no answer in the API yet: for example the resolved run config and model choices on `GET /projects/{project_id}`, with where each value comes from.
- `message_delivered` is an event of the API and of `feat/fe/mock`, missing from `runEventSchemas` here. Copied with the run entities.
- No mock on either branch: `GET /runs/{run_id}/directives`, `PATCH` and `DELETE /threads/{thread_id}`, `PATCH /artifacts/{artifact_id}`, `POST /artifacts/{artifact_id}/restore`, `POST /artifacts/{artifact_id}/items`, `POST /artifacts/{artifact_id}/items/reorder`, `POST /items/{item_id}/move`, `DELETE /items/{item_id}`, `POST /projects/{project_id}/trace-links`, `DELETE /trace-links/{link_id}`. Their handlers are written with their entities.

### D6. The current branch

| Option | Evaluation |
|---|---|
| a. One PR, P7 with the move to modules, read in order: the ESLint config and the docs, then the renames, then the new files | GitHub shows the 154 renames as renames; the PR mixes moves with new code |
| b. Two PRs: R1 moves the code of `main`, shared code included, and adds nothing, or very little; P7 then adds what `main` lacks | Follows the driver; about 30 files are cut by hunk |

Decision: b (2026-10-19). A comparison of every top-level statement of the working tree with `main` sorts the files:

| Files | Count | Goes to |
|---|---|---|
| Only code of `main`, moved | 309 | R1 |
| Code of `main` split or renamed by the move: the words of the project actions, the stores of the Rename and Delete dialogs, `auth` and `user`, `recordRequests`, the frame changes of [D4](#d4-the-frame-stays-generic) | about 25 | R1 |
| Code of `main` changed by P7, or a mix of both | about 30, among them the two project layouts, `runs.api.ts`, `threads.types.ts`, `threads.api.ts`, the mocks of runs, threads and the user, `vitest.setup.ts`, the frontend README | Cut by hunk: R1 takes the move, P7 the rest |
| New code: the entities of `thread`, `run` and `workflow`, the status of a project, Stop, `usage`, the cost helpers, the new chat, the mock of the workflow | 100 | P7 |

Cut on 2026-10-19 on `refactor/fe/modules`: R1 then changed 299 files against `main` (170 of them moves), and P7 changes 164 files on top of it; the whole state before the cut is kept in `refs/backup/feat-fe-threads-2026-10-19-b`. Besides the moves, R1 leaves out what P7 changed in the code of `main`: the rule of the reducer that skips the events applied already, the error message of `useStartRun`, the `value` that `Progress` gives its root, and the removal of the `caret-block` utility. The first chat of `main` moves in R1 to the modules (`run/entities` for the stream and its reducer, `run/features/start`, and its page to `activity/widgets/chat`); P7 replaces its page with the new chat. R1 is checked alone: typecheck, lint, the full unit tests.

After the cut, R1 also got: the toast of an archived project stays 10 seconds, for time to reach Undo, as every toast with an action does (`actionToastDuration`); `EditorTabs` reads its tab group from `TabGroupContext`, through `useTabGroup`, as the pages do; CONTRIBUTING states the duration of a toast with an action and the names of identifiers. The state of R1 at the cut is `refs/backup/refactor-fe-modules-r1-2026-10-19`, so P7 goes back on `main` once R1 is merged, as the diff from that ref to backup b, applied with `git apply -3` since the files that R1 changed after the cut can conflict; not as a copy of backup b, which would undo these changes.

R1 is committed on 2026-10-20 in eight commits, in the order to read them: the docs; the ESLint config and `lint.mjs`; the frame and the shared code; then one commit for each group of modules (`run`, `thread` and `activity`; `project`; `auth` and `user`; `artifact` and `design-system`); last, the routes, the mocks and the test setup. Each commit holds both ends of its moves, so that GitHub shows the 170 renames. A commit alone does not compile; the PR is merged as one squashed commit. The state as staged before the commits is `refs/backup/refactor-fe-modules-r1-staged-2026-10-20`.

### D7. Idempotency keys

`docs/API.md` gives an `Idempotency-Key` header to the `POST` requests that start work: send message, resume, retry and create export. A repeat with the same key within 24 hours answers the first response without doing the work again; the same key with another body answers `409 idempotency_conflict`. Most other writes give the same result when repeated and need no key: a `PUT`, a `DELETE`, a `PATCH` checked with `If-Match`, cancel, reorder and move. A repeated creation without a key (a project, a thread, an item, a trace link) leaves a copy that the user can delete; [section 10](#10-open-points) keeps the case of a project.

On 2026-10-20 no request of the web app sends the header and no mock reads it. The frontend has only the code `ApiErrorCode.IdempotencyConflict`, and `sendFirstMessage`, which the creation of a project calls, sends its message without a key. TanStack Query retries no mutation by default, so a request repeats today only when the user sends it again.

| Option | Evaluation |
|---|---|
| a. The API function makes a key at each call | A retry calls the function again, with a new key: the server does the work twice, as without a key |
| b. The key is made once for each action of the user, before the mutation, and goes in its variables to the API function, which takes it as a parameter | A retry of the action, by the mutation or by a Retry button, sends the same key; the hook decides what one action is |
| c. A key computed from the body | Two equal messages sent on purpose, such as "yes" twice, would count as one |

Decision: b (2026-10-20). Consequences:

- `apiRequest` and `apiCommand` take an `idempotencyKey` option and send it as the `Idempotency-Key` header. The key is `crypto.randomUUID()`.
- The mutations of these four actions retry once after a network error or a 5xx answer, with the same key, as the queries do. The other mutations keep no retry.
- A message that failed keeps its key, so that sending it again from the chat starts no second run; a message edited before it is sent again gets a new key.
- `409 idempotency_conflict` means that the web app sent a key again with another body, which is a bug: the screen shows the generic message of the error, with no words of its own.
- The creation of a project does not retry: a retry would also create a second project and a second thread, whose requests take no key ([section 10](#10-open-points)). Its message sends a key made when the form is submitted, as every request that starts work does.
- The mock handlers of the four endpoints keep the answer of each key: a repeated key gets the stored answer, and the same key with another body `409 idempotency_conflict`. One helper of `mocks/shared/` does this for every handler.
- Tests: the request carries the header; a retry after a network error sends the same key; the mock answers a repeated key with the first answer, and another body with `409`.

I1 adds the option, the mock helper, and the key of `sendFirstMessage` with its handler, on `main`. Then E4 (`retryFromStep`), E5 (`resumeRun`), E6 (the function that sends a message to a thread) and S1 (the export) take the key in their API functions and their handlers.

### D8. Complete entities, and the parts of P7

P7 built only the parts of the thread, run, workflow and usage entities that the status bar reads at once: `listProjectThreads` and `sendFirstMessage`; `getLatestRun`, `cancelRun` and `runEventsUrl`; `listWorkflowStages`; `getMonthlyUsage`. The folder structure before R1 grouped the code by screen, which led there. Requirement: an entity holds every endpoint of its module, with its schemas, keys, query hooks, mock handlers and tests, and a feature holds its whole action, so that the next screens extend them instead of finishing them.

| Option | Evaluation |
|---|---|
| a. P7 as one PR, with the thread, run and workflow entities completed in it | P7 waits on C1, I1 and part of E1 anyway (the run config, the keys of retry and send message, the item refs and the fixtures of the workflow state), and holds E4 and E6 besides the status: one very large PR |
| b. The entity parts of P7 go into the complete entity PRs; the status and Stop, and the budget of the month, come after the entities they read | Each PR holds one module or one block; the code of P7 waits in a backup until its PR |

Decision: b (2026-10-20). The working tree went back to `main`. Each PR takes its part from `refs/backup/feat-fe-threads-2026-10-20-placed` (or `origin/feat/fe/artifacts-backup`, which the other machine pushed; `git show <ref>:<path>`, or the diff of its paths from `main`), with the docs of that part:

| Part of P7 | PR |
|---|---|
| The stages of the definition and their labels: `listWorkflowStages`, `useWorkflowQueries`, `workflow.keys`, `@x/run`, the workflow mock with `requirements_engineering.v1.json` and its `.prettierignore` line | E0 |
| The runs: `getLatestRun`, `useLatestRun`, `useRunStageLabel`, `runs.keys`, `runs.utils`, `cancelRun`, `runEventsUrl` and `run-events.constants.ts`, the rule of the reducer that skips the events applied already, `@x/project` and `@x/thread`, the run mocks | E4 |
| The threads: `listProjectThreads`, `useThreadQueries`, `threads.keys`, `threads.utils`, `Message`, `@x/project`, the thread and message mocks | E6 |
| The status of a project: `useProjectRun`, `ProjectRun` and `project-run.utils`, `useRunStatusStream`, `ProjectRunStreams`, `project/widgets/status`, Stop (`run/features/stop`), `shared/lib/cost`, `coalescedTask`, the EventSource of the unit tests, the screenshot data of the status | P7 |
| The usage of the month: `getMonthlyUsage`, `useMonthlyBudget`, the usage keys and types, the mock of `/me/usage` | E9 |
| The budget of the month on the status bar: `MonthlyBudgetItem`, `CostMeter`, the formatters of currency and percentage, `query-meta.utils` with the reload of the costs in `useRunStatusStream`, the `value` that `Progress` gives its root | B1 |
| The new chat (`ActivityPage`, `ActivityEntry`, `RunEntry`, `useActivity`, the actions of an entry), with the message of `useStartRun` and the removal of `caret-block`; `ThreadStatusList` | Not merged: no route shows them, the chat starts its runs with `POST /threads/{thread_id}/runs`, which the API lacks, and S2 rebuilds the chat with `send-message`. They stay as references for S2, and for a project with several threads |

## 4. Order of the modules

`moduleImports` of `frontend/lint/lib/modules.js` after this plan; the rows marked new change today's list:

| Module | May import | Change |
|---|---|---|
| `workflow` | none | |
| `artifact` | `workflow` | Reads the artifact kinds and their content schemas |
| `trace-link` | `workflow`, `artifact` | New |
| `run` | `workflow`, `artifact` | |
| `review` | `workflow`, `artifact`, `run` | |
| `thread` | `workflow`, `artifact`, `run`, `review` | |
| `project` | `workflow`, `artifact`, `run`, `review`, `thread` | `user` too, once the dialog that creates a project reads the defaults of the user |
| `activity` | `workflow`, `artifact`, `run`, `review`, `thread` | |
| `auth` | none | |
| `llm-model` | none | New |
| `user` | `auth`, `run` | New: `run`, for RunDefaults in UserSettings |
| `usage` | none | |
| `settings` | every module except `activity` and `design-system` | New ([D3](#d3-settings)) |
| `design-system` | none | |

`itemRefSchema` moves from `run` to `artifact` with the artifact entities, as section 4 of Web App Modules plans.

## 5. Cleanup before the entities

From a read of the placement of the code on 2026-10-19, beyond what ESLint checks. A change to code that only P7 adds is made in its backup, so that the code lands in its place once, with the PR that takes it ([D8](#d8-complete-entities-and-the-parts-of-p7)). A change to code of `main` goes into C1.

| Change | Why | PR |
|---|---|---|
| The names of the events that the status stream follows (`RUN_STATUS_EVENTS`, `COST_EVENTS`) move from `project/entities` to `run/entities`, checked with `satisfies readonly RunEventType[]`; `STREAM_REOPEN_MS` stays | They are words of the run events, written as bare strings today | E4 |
| One address of the event stream: `runEventsUrl(runId, after)`; `runStreamUrl` goes | `runStreamUrl(id)` is the stream after event 0; P7 adds `runEventsUrl` | E4 |
| `ProjectRunStreams` moves from `project/widgets/status` to `project/entities`, beside `useRunStatusStream` | It holds no action: it keeps the queries of a project fresh | P7 |
| `EntryAuthor` of the new chat reads `Message['author']` | Same three values | S2a, with the chat: no `EntryAuthor`, the looks of an author are `messageAuthorLooks` of `thread/entities` |
| `isFiltered` moves from `project/entities` to `project-filters.utils.ts` of `project/widgets/list`; `noProjectFilters` stays | Only the list reads it; the API reads `noProjectFilters` | C1 |
| `runDefaultsSchema` moves to `run/entities`, and the run config of `runs.types.ts` becomes a named `runConfigSchema` | Value objects of the runs ([D3](#d3-settings)) | C1 |
| `useModelOverridesStore` is deleted | Nothing reads it, and the API has no one-off model override: the overrides of a project are `model_overrides` | C1 |
| The theme buttons of `user/widgets/settings` become a feature of `user` | [D3](#d3-settings) | C1 |
| `rollupRunStatus` moves from `run/entities` to `src/mocks/projects/run-status-rollup.utils.ts`, with its test | Only the mock server rolls up the runs of a project; the API returns `rollup_run_status` | C1 |
| `shownKey` moves from `useCommands.ts` to `command.utils.ts`, with a test | A pure helper of the palette | C1 |
| `noProjectFilters` moves from `projects.utils.ts` to `projects.constants.ts` | A default, not a rule | C1 |
| `BottomPanelSection` moves from `BottomPanelSections.tsx` to `panels/panel.types.ts` | The index of the frame and other files read it | C1 |
| `mockId` and `createdId` move to `mock-ids.utils.ts`, and `stepId` into `runs.fixtures.ts`, its only user | A constants file holds no function | C1 |
| The lists of values and their types move from `constants` to `types` files (`run-status`, `output-language`, `view`, `status-bar`, `panel`, `api-error`, `tone`, `mock-scenario`), the type of `extra-project-specs` leaves its constants file (that of `run-status-look` stays in it, unexported), and `editor-tabs.schema.ts` becomes `editor-tabs.types.ts` | A `types` file defines the values of its subject; a `constants` file holds only the words of the screens and the settings (frontend CONTRIBUTING: Types and constants) | C1 |

The four rows of P7 are done in its backup on 2026-10-20. The exported names follow the identifier naming of CONTRIBUTING: `runStatusEvents` and `runCostEvents` in `run/entities/constants/run-events.constants.ts`, given to `project` through `@x/project.ts`, and `streamReopenMs`. `useRunStatusStream` leaves the public API of `project/entities`, since only `ProjectRunStreams` beside it reads it.

### Conventions that ESLint does not check

From a read of `eslint.config.js` against CONTRIBUTING on 2026-10-20. C1 adds these rules after its changes: it deletes `useModelOverridesStore`, changes the three classes below and renames the exported values in UPPER_SNAKE_CASE first, so that the rules pass when they turn on.

| Rule | Convention | Code on 2026-10-20 |
|---|---|---|
| A `persist` store passes `storage: persistStorage(...)` and names its key with `storageKey` | Browser storage goes through `browser-storage.utils.ts`. The rule on `localStorage` does not see the default storage of zustand, which reads it directly | `model-overrides.store.ts`, which C1 deletes |
| Outside `src/shared/components/ui/`, a class has no CSS value of its own in brackets; state selectors such as `data-[state=open]:` stay allowed | CONTRIBUTING: UI components | Three classes to change to a token or a utility: `max-h-[80dvh]` in `NewProjectDialog`, `sm:pt-[18vh]` in `ProjectListPage`, `grid-rows-[minmax(0,1fr)_auto]` in `NewProjectForm`. `tone.constants.ts` sets the variables of each tone in brackets (`[--tone:var(--primary)]`) and is exempted: it is the one place that maps tokens to tones, only `ui/` reads it, and `satisfies Record<Tone, string>` checks that every tone has its classes. Moving the tones to `@utility` classes in `styles.css` loses that check, and `cn` keeps two tone utilities side by side where it keeps the last of two `[--tone:...]` |
| No `dangerouslySetInnerHTML` | CONTRIBUTING: untrusted content | `ui/chart.tsx` of shadcn, exempted |
| No `queryKey` or `mutationKey` written as an inline array | CONTRIBUTING: query keys | One unit test; the tests are exempted |
| No hook (`use*`) declared in a `.tsx` file, outside `ui/` and the tests | CONTRIBUTING: hooks of a slice | None |
| No `export default` in `src/`, outside the Next.js routing files | CONTRIBUTING: components | None |
| A `constants` file exports no type and declares no function, and a `types` file imports no `constants` file | CONTRIBUTING: types and constants (added on 2026-10-21) | The last six rows of the placement table above, which commit 5 of C1 moves |
| An exported value is camelCase or PascalCase, never UPPER_SNAKE_CASE | CONTRIBUTING: identifier naming | `RUN_EVENT_TYPES` and `DEFAULT_AFTER_SIGN_IN`, and the ids of the mocks in `mock-ids.constants.ts`: `PROJECT_IDS` (16 files), `THREAD_IDS`, `RUN_IDS`, `USER_ID`, `MOCK_RUN_ID`, `PERSONA_IDS`. C1 renames them in camelCase |

The first seven are `no-restricted-syntax` selectors: built into ESLint, with no new package and no type information. A later block replaces the whole option list of a rule, as for `no-restricted-imports`, so the selectors live in one array that each block spreads, as `restrictImports` does. The seventh is `@typescript-eslint/naming-convention` on the variables with the `exported` modifier, from typescript-eslint, which is installed already; without its `types` filter it needs no type information either.

The other row of identifier naming stays a convention: a setting private to its file is UPPER_SNAKE_CASE, but ESLint cannot tell a setting from a schema or from sample data. C1 renames the private settings in camelCase that it finds: `indent` of `ArtifactTree`, and `columnWidth`, `edgeLength`, `rowHeight` of `GraphCard`, in the design system.

These can wait:

- No page path as a literal (`href="/..."`, `router.push('/...')`). None today, and the `Route` type already catches most of them.
- The layers of the frame for the slices and shared code too: a pure file without React or zustand, a store without another store or a hook, a hook without a component. None breaks them today; the README states them for the frame only.
- `react/jsx-key`, which needs `eslint-plugin-react` as a new dev dependency. A missing `key` only warns on the console, and no test fails on it.

### The contributing guide of the frontend

`CONTRIBUTING.md` is about 38 KB, and its section TypeScript / React (frontend) about 20 KB of it. The first commit of C1 moves the conventions of the frontend to `frontend/CONTRIBUTING.md`:

- `frontend/CONTRIBUTING.md` takes the section TypeScript / React (frontend) and the points of the frontend in Testing and in Logging & Errors: Vitest and Testing Library, the data-driven tests, Playwright, the `__tests__/` folders, the error boundary of each route.
- The root keeps the workflow, the branches, the commits, the pull requests, the review, the backend, the API contract and the security, and links to `frontend/CONTRIBUTING.md`. GitHub links only the root file from issues and pull requests.
- The references follow: the messages and comments `CONTRIBUTING: ...` of `eslint.config.js`, `frontend/README.md`, `openapi-ts.config.ts`, this plan, and the anchors of the moved sections.

The commit moves the text without changing it, so that its diff shows only moved lines (`git diff --color-moved`); changes of content go in later commits. The rules that C1 adds after it cite `frontend/CONTRIBUTING.md`.

## 6. Entities, module by module

Each module is one PR, in this order: the whole `workflow` entity first (E0: the artifact kinds with their content schemas, and the definition), since `artifact` reads the kinds and every later module reads the stages and the names of the definition; then `artifact` (E1), which needs only E0. The state of a run is read by `run` (E4), whose mock reads the artifact fixtures. "Copy" lists only what carries over almost unchanged ([D1](#d1-what-is-copied-from-featfemock)); paths on the left are under `frontend/src/` of `feat/fe/mock`. "Write" is new code. Every entity gets its key factory, its query hooks in `hooks/use<Resource>Queries.ts`, and data-driven tests, for every endpoint of its module ([D8](#d8-complete-entities-and-the-parts-of-p7)). "From P7" lists the part of P7 that an entity takes from its backup.

### E0. `workflow`: the artifact kinds, their content schemas and the definition

Endpoints: `GET /artifact-kinds`, `GET /content-schemas/{kind}/{schema_version}`, `GET /workflow/definition`. The state of a run (`GET /runs/{run_id}/state`) is read by `run` (E4); it follows the `state_schema` of the definition.

From P7: the stages of the definition and their labels, with the workflow mock.

| Copy | To | What changes |
|---|---|---|
| `schemaPropertySchema`, `contentSchemaSchema`, `KindSchema`, `artifactKindsSchema` of `features/artifacts/artifacts.types.ts` | `workflow/entities/types/` | Imports |
| `getArtifactKinds`, `getContentSchema` of `features/artifacts/artifacts.api.ts` | `workflow/entities/` | Imports |
| `features/artifacts/field-view.utils.ts`, `schemasByKind` of `kinds.utils.ts`, with the cases of `__tests__/field-view.utils.test.ts` | `workflow/entities/utils/` | Imports; tests data-driven |
| The body of `useArtifactKinds` | `workflow/entities/hooks/useArtifactKindQueries.ts` | Key from the key factory |
| `mocks/artifact-kinds.fixtures.ts`, `artifact-kinds.handlers.ts`, `__tests__/artifact-kinds.fixtures.test.ts`, `data/content-schemas/*.json` (19 files) | `mocks/workflow/` | Types from `workflow/entities`; scenario helper |

Write: `requirements_engineering.v1.json` in `mocks/workflow/`, since the kinds are built from its value lists (the handler of the definition reads the same file), and the `.prettierignore` lines of both data files; `definitionStaleTime` in `shared/api/stale-time.config.ts`, which the later queries of the definition use too; `workflow/entities/@x/artifact.ts`, which gives `useArtifactKinds`, `useContentSchema` and `ContentSchema` to the entities of `artifact`; `artifact: ['workflow']` in `moduleImports`; `displays`, `Display` and `displayOf`.

As built (2026-10-21, in the working tree of `feat/fe/artifact-entities`, not committed): the kinds were first part of E1, which exported 69 names; they moved after the review, since the definition decides them, and `artifact` now exports 45 and `workflow` 24. The files sit in `api/`, `keys/`, `hooks/`, `types/` and `utils/`, as in `artifact`. `useItemSchema`, `isNested`, `groupByKind` and `ancestorsOf` stay in `artifact`, since they read items. The schema of the fields of an entry (`items.properties`, `items.required`) is typed, so `fieldViews` casts nothing, and `isRecord` in `shared/lib/guards.utils.ts` replaces the three guards that the entity and the mocks each wrote.

### E1. `artifact`

Endpoints: `GET /projects/{project_id}/artifacts`, `GET`, `PATCH /artifacts/{artifact_id}`, `GET /artifacts/{artifact_id}/revisions`, `POST /artifacts/{artifact_id}/restore`, `GET`, `POST /artifacts/{artifact_id}/items`, `POST /artifacts/{artifact_id}/items/reorder`, `GET /projects/{project_id}/items`, `GET`, `PATCH`, `DELETE /items/{item_id}`, `GET /items/{item_id}/revisions`, `POST /items/{item_id}/restore`, `POST /items/{item_id}/move`.

| Copy | To | What changes |
|---|---|---|
| `originSchema`, `reviewStatuses`, `artifactSchema`, `itemSchema`, `outlineItemSchema`, `changeReasons`, `revisionSchema` of `features/artifacts/artifacts.types.ts` | `artifact/entities/types/` | Imports |
| `getArtifact`, `getItem`, `updateItem`, `restoreItem` of `features/artifacts/artifacts.api.ts` | `artifact/entities/` | Imports |
| `listProjectArtifacts`, `listArtifactItems`, `listItemRevisions` of the same file | `artifact/entities/` | `fetchPage` instead of `fetchAllPages` |
| `isNested`, `groupByKind`, `ancestorsOf` of `features/artifacts/kinds.utils.ts`, with their cases | `artifact/entities/utils/item-hierarchy.utils.ts` (`groupByKind` in `item-groups.utils.ts`) | Renamed; tests data-driven |
| The bodies of `useArtifact`, `useArtifactItems`, `useItem`, `useItemSchema`, `useProjectArtifacts`, `useValueOptions`, `useItemRevisions` | `artifact/entities/hooks/use<Resource>Queries.ts` | Keys from the key factory |
| `mocks/artifacts.fixtures.ts`, `mentor-artifacts.fixtures.ts`, `artifact-builder.utils.ts`, `mock-artifacts.store.ts`, `artifacts.handlers.ts` | `mocks/artifacts/` | Types from `artifact/entities`; scenario helper; the kinds come from `mocks/workflow/` (E0) |
| The id prefixes `Artifact`, `Item`, `TraceLink`, `Interrupt`, `Export`, `Session` and `itemId` of `mocks/mock-ids.constants.ts` | `mocks/shared/mock-ids.constants.ts` | `Artifact` and `Item` only, in E1; the others with the PR that reads them |

Write: one `listProjectItems(projectId, filters)` for the items of a project, which `search`, `traceability` and the mentions of the console each declared apart; the functions and the mock handlers of the endpoints without a mock ([D5](#d5-endpoints-that-the-api-lacks)); `itemRefSchema` moved from `run`.

As built (2026-10-21, in the working tree of `feat/fe/artifact-entities`, not committed): the files are split by resource under `api/`, `keys/`, `types/`, `utils/` and `hooks/` of `artifact/entities/`; the lists of artifacts, items and revisions read one page with `fetchPage` (the hooks of the items and revisions are infinite queries, the artifacts of a project are read whole with `fetchAllPages`, in pages of 200). `listProjectItems` takes the filters `kind`, `reviewStatus`, `runId` and `text`. The mocks sit in `mocks/artifacts/` and serve all 15 endpoints of the entity, with a store for what the user adds, changes, moves, reorders and deletes. Differences from the rows above:

- Only the prefixes `Artifact` and `Item` are added to `mock-ids.constants.ts`, and not `itemId` (nothing reads it); each later PR adds its own prefix.
- The builder of the fixtures makes artifacts and items only. `LinkSpec`, the link specs of the mentor platform (`evidence`, `derivations`, `concerns`) and the trace links of the fixtures go to E3, with `traceFrom` of the handlers.
- The exports (`exportSchema`, `createExport`, `getExport`, their handlers) are in E1b.
- `initialValue` lost its three equal branches; the other field rules are copied as they were.
- `cursorPages` in `api-fetch.utils.ts` holds the two options that every infinite query over a list repeats (the first page, the next cursor); the project list uses it too. The request bodies of the entity (`UpdateArtifactBody`, `UpdateItemBody`, `CreateItemBody`, `MoveItemBody`) carry the field names of the API, as `CreateProjectBody` does, and the filters are camelCase; `listProjectItems` takes the cursor and the limit before the filters, as `listProjects` does.
- `displays` and `Display` sit beside `widgets` in `field-view.types.ts` of `workflow/entities`, and `displayOf(schema)` returns the display a schema names, else `document` for an artifact and `table` for an item. The screens that follow build a registry of widget to input and of display to layout from these two types; a kind or a field that the API adds needs no client change, a new widget or display does.
- `definitionStaleTime` (`shared/api/cache/stale-time.config.ts`, E0) is how long the kinds and their schemas stay fresh: an hour in a production build, ten minutes in any other. `useArtifactKinds` uses it; a schema of one version stays fresh for ever. The next queries that read what the workflow definition decides, such as the definition itself, use it too.
- Second review of E1: `useItemSchema` also answers `isError`, so a failed kinds query no longer reads as pending for ever; `useValueOptions` keeps one list until the artifacts change; `changedFields` compares objects whatever the order of their keys. In the mock, `findKind` and `itemKindsOf` sit with the kinds fixtures, the fixtures take their `schema_version` from the definition, `findRecordedItem` replaces the flag of `findItem`, `requestedVersion` and `noSuchVersion` are shared by the handlers, and a created item goes after the last position of its parent, also when an item before it was deleted. In the mock, the records util is split in two: `artifact-lookup.utils.ts` reads the artifacts and the items as they are now, `artifact-changes.utils.ts` changes them. Left as they are: the `id = encodeURIComponent` alias of the three api files, the `'If-Match'` header of the two updates, and the `roleOfKind` map of the builder.
- Third review of E1 (2026-10-22): the mock checks a content against the keywords of its schema with `schemaProblems` of `mocks/shared/http/json-schema.utils.ts`, and against the lists that a field takes its values from, instead of the rules of the forms; a new item takes its key prefix from `newKeyPrefix` (`EP` or `US` by `item_type` for a backlog item) and a message of an interview cannot be added; every change of an item gives its artifact a new version (`touchArtifact`); `toStoredContent` leaves out the fields that the content does not hold, `changedFields` skips the read-only fields and `validateContent` checks `minItems`.
- `openPage` of `src/test/page-address.utils.ts` is the one copy; the seven older tests of `src/mocks` use it too.
- Test helpers added: `recordRequests(headerNames)` records the query and chosen headers, `callApi` of `src/test/api-call.utils.ts`.
- Helpers added to `shared/lib`, one feature each, with data-driven tests: `guards.utils.ts` (`isRecord`, `isOneOf`), `string.utils.ts` (`hasText`: a string with more than whitespace; `includesText`: a text holds a part in any case) and `search.utils.ts` (`search`: the query from parameters, numbers too; `searchOf`: the query of a `URLSearchParams`), `assert.utils.ts` (`required`: a value that must exist, or an error with a message), `object.utils.ts` (`omit`: a record without some keys) and `debounce.utils.ts` (`debounce` with `cancel` and `flush`, not used yet; the search of S1 will). `search` replaces the one of `route-builder.utils.ts`, the end of `filterSearch` and the `queryString` of the first draft of E1; `paramMatches` sits in `mocks/shared/request-query.utils.ts`. The rules of `fieldViews` take a text of whitespace as missing (`validateContent`, `toStoredContent`, `formatValue`, `itemTitle`).
- Fourth review of E1 (2026-10-24): `content-fields.utils.ts` and `content-fields.types.ts` (`ContentField`, `contentFields`, `summaryFields`) replace `field-view`, since they read a content schema, and `content-schemas.utils.ts` (`kindSchemasByKind`) replaces `kinds.utils.ts`; `shared/lib/data` splits `value.utils.ts` into `presence.utils.ts` (`isBlank`, `isEmpty`, `hasText`) and `equality.utils.ts` (`sameValue`), and `isString` moves to `guards.utils.ts`; `auth-redirect.utils.ts` moves to `shared/config/routes/auth/` beside `sign-in.utils.ts`, `routes/project/` folds into the root of `routes/`, and `createQueryClient` takes the function to call on a 401 instead of importing the redirect; the mocks of `artifacts/` and `projects/` and `mocks/shared/` group their files in folders of their kind (`handlers/`, `fixtures/`, `utils/`, `stores/`, and `db/`, `http/`, `scenario/`); the answers to a missing record used by two handler files are `projectNotFound()`, `threadNotFound()`, `artifactNotFound()` and `versionNotFound()`, `findProject` and `changeProject` sit in `projects/utils/project-lookup.utils.ts`, and every time that a handler stamps on a record comes from `mockNow()` of `mocks/shared/db/mock-clock.utils.ts`; the fixture revisions carry no marker in their content; the ESLint rule that keeps a component from calling the API names `apiRequest`, `apiCommand`, `fetchPage` and `cursorPages` of `@/shared/api/client`.
- Fifth review of E1 (2026-10-24): the mock files take the kinds `lookup`, `changes` and `problems` (`projects.lookup.ts`, `artifacts.changes.ts`, `artifacts.problems.ts`), and the mock folders follow the layout of "Files of a mock folder" in the frontend README; the state of every resource is in a `<resource>.store.ts` with `created<Things>` and `<thing>Edits`, `mockRecord` is `mockState`, the fixtures are named `<thing>Fixtures` and `build<Thing>`, `extra-*` is `generated-*`, `bulk*` is `many*`, `mentor-artifacts` is `mentor-platform-artifacts`, the builder of the artifact fixtures sits in `fixtures/` and `userOrigin` in `artifacts.constants.ts`, and `recordedItems`, `withoutRuns`, `neverAnswer` and `pageParam` are `itemsWithDeleted`, `threadsBeforeAnyRun`, `pendingForever` and `addressParam`.
- Sixth review of E1 (2026-10-24): `src/mocks/generated/` holds the projects made from specs with their threads, runs and steps, and `generated.constants.ts` the size of the `many` list; ESLint checks the direction of the imports between the kinds of `src/mocks` (fixtures, constants and types, then store, lookup, changes and problems, then handlers) and reports an exported type in a `utils` file, and in a `lookup`, `changes`, `problems` or `handlers` file of the mocks; `FieldProblem` and `ErrorMessages` moved to `api-error.types.ts`, `ListPage` to `api-fetch.types.ts`, `Hotkey` to `hotkey.types.ts`, `GroupOfCommands` to `command.types.ts`, `ApiCall` to `api-call.types.ts`, and the mock types `PlacedItem`, `ItemEdit`, `ArtifactEdit`, `ArtifactChangeSet` and `NewItemRecord` to `artifacts.types.ts`, which also holds `ArtifactSpec`, `ItemSpec` and `BuiltProject`; the exports have their own folder, `src/mocks/exports/`.
- Seventh review of E1 (2026-10-24): `shared/api/client` is `shared/api/request/` (`apiRequest`, `fetchPage`, `ApiError`), `shared/api/cache` is `shared/api/query-client/` and also holds `retryOnce` (`query-retry.utils.ts`) and `cursorPages` (`cursor-pages.config.ts`), `shared/lib/browser` is split into `shared/lib/hotkey/` and `shared/lib/browser-storage.utils.ts`, and `shared/lib/data` is `shared/lib/values/`.
- Eighth review of E1 (2026-10-24): `shared/lib/timing/` holds `debounce` and `sleep`, `shared/lib/formatters/` adds `formatNumber`, `formatPercent`, `formatCurrency`, `formatDate`, `formatDateTime` and `formatDuration` in the fixed locale `en-US`, and `shared/lib/values/` adds `capitalize`; the table "Helpers of `shared/lib/`" of the frontend CONTRIBUTING lists what each folder holds and what is left to the platform or to a library on purpose (`throttle`, `retry`, `pick`, `mapValues`, `groupBy`, `shallowEqual`, `joinPath`, `parseQuery`, `readJson` and `writeJson`, `withTimeout`).
- Ninth review of E1 (2026-10-24): `NumberInput` and `NumberField` (`shared/components/form/number/`) for the numbers of a form, with the rules of the input beside them in `number-input.utils.ts` (`stepNumber`, `sanitizeNumberText`, `numberFromText`, `numberToText`, and later `keyAction`, `stepTimesOf` and `canStep`, with the draft text in the hook `number/hooks/useNumberDraft.ts`, so that the component only wires them) and the two rules that any code may use, `clamp` and `decimalsOf`, in `shared/lib/values/number.utils.ts`; the widget `number` of a content field and the run defaults take them. The design system page has a card of them, and the screenshot spec of the page takes it.
- Tenth review of E1 (2026-10-24): `api-fetch` of `shared/api/request/` is split into `api-request.{utils,types}` (`apiRequest`, `apiCommand`) and `api-page.{utils,types}` (`fetchPage`, `ListPage`, the envelope of a list), and the ESLint rule that keeps a component from calling the API refuses any import into `@/shared/api/request/` other than its index.
- Eleventh review of E1 (2026-10-24): `shared/lib/values` is five files (`guards`, `presence` with `required`, `object` with `sameValue`, `string`, `number`); `content-fields.utils.ts` is split into `content-fields.utils.ts` (the fields of a schema, the title of an item) and `content-values.utils.ts` (the value of a field: empty, written, checked, stored, compared); `persist-storage.utils.ts` takes `persistStorage`, `persistStorageByEntry` and `parseStored` out of `browser-storage.utils.ts`, which gains `browserStorage.keysStartingWith`; the mocks take the kind `validators` (`artifacts.validators.ts`, `projects.validators.ts`) for `validateNewItem`, `validateItemMove`, `validateArtifactChange`, `validateNewProject`, `contentProblems`, `changeProblems` and `newKeyPrefix`; five hand-written guards use `isOneOf`, `typeof x === 'string'` checks use `isString`, `trim() === ''` checks use `hasText`, and every API path writes its ids with `encodeId`. Helpers with no user yet: `debounce`, `formatDate`, `formatDateTime`, `formatDuration`, `formatNumber`, `formatPercent`.
- Twelfth review of E1 (2026-10-24): `browser-storage.utils.ts` and `persist-storage.utils.ts` are in `shared/lib/storage/`, used through its `index.ts` (ESLint reports a deeper import), and `pick` stays out of `values` until code needs it.
- Thirteenth review of E1 (2026-10-24): `mocks/api.setup.ts` lists the handlers once for the worker and the server of the tests; the tests use `openPage` of `src/test`; `routeOfAddress` of `routes/route-params` and `routes/typed-route` types an address that comes from data, and `checkedRoute` stays for an address written in the code (it checks the path, so it cannot take a string); the status bar and the activity bar share `frame/registry/` (`createRegistryStore`, `useRegisterItem`, `useRegisteredItems`), and the commands store takes its map updates from `setEntry` and `removeEntry` of `shared/lib/values/map.utils.ts`. Afterwards (the editor tabs keep their own pair, now `setGroupTab` and `clearGroupTab`): a store of the frame may import another store (never a hook), so `createRegistryStore` replaces `registryState`; `routes.utils.ts` moved out of `routes/builder/` to the root of `routes/`, so `builder/` holds only the low layer and `auth` imports it through its barrel without a cycle.
- Fourteenth review of E1 (2026-10-26): the request bodies end in `Body` (`CreateItemBody`, `UpdateItemBody`, `MoveItemBody`, `UpdateArtifactBody`, `CreateExportBody`), and `createExport` takes `(projectId, body, idempotencyKey)`; `exportFormats` and `ExportFormat` come from the vocabulary of the definition and type `Export.format` and the body; `ContentValues` and `contentValuesSchema` (workflow) type the content of artifacts, items and revisions; `kindSchemasByKind` keeps the version beside the schema, so `useItemSchema` reads one map, and `contentSchemasByKind` gives the schema alone; both sit in `kind-schemas.utils.ts`; `listWidgets` is the one list of widgets whose value is a list, read by `initialValue` and `toStoredContent` (an emptied nullable `object-list` stays `[]`); `ArtifactFilters` and `ItemFilters` carry the `kind` and `review_status` filters of the three list calls, and `artifactFilterParams` and `itemFilterParams` turn them into the parameters of the API; the keys of one record at a version are `detail(id, version?)` with `currentVersionKey` (`shared/api/query-client`) for no version, and `itemKeys.ofArtifact` takes its filters; `useExport(exportId, isEnabled)`. In the mocks: `pathParam(params, name)`, `queryOf(request)` and `msSince(time)` replace the hand-written reads, `itemAtVersion` and `atVersion(.., null)` read the current record, and `exports.lookup.ts`, `exports.constants.ts` hold what `exports.handlers.ts` computed. `pathWithQuery` (`shared/lib/url`) joins a path and its query; `itNestsQueryKeys` and `itTellsQueryKeysApart` (`@/test/suites`) test the key factories. Left for their own PRs: the rename of `Origin` and the words revision and version.
- The maintenance items of E1 (`isOneOf`, `isString`, `hasText`, `omit`, `paramMatches`, `encodeId` in place of hand-written checks) are done in the working tree, with the unused `export` of values that only their file reads removed (2026-10-24).

### E1b. `export`, in `artifact`

Endpoints: `POST /projects/{project_id}/exports`, `GET /projects/{project_id}/exports`, `GET /exports/{export_id}`. An export is the document that the user asks for from the artifacts of a project, so its entity files sit in `artifact/entities/` beside the artifacts, as resource `exports`; the action that asks for it and downloads it is the feature `artifact/features/export` of S1 ([Web App Modules](architecture/web-app-modules.md#7-objects-without-an-entity)).

| Copy | To | What changes |
|---|---|---|
| `exportSchema` of `features/artifacts/artifacts.types.ts` | `artifact/entities/types/exports.types.ts` | Imports; the statuses (`pending`, `ready`, `failed`) become a list of values with its type |
| `createExport`, `getExport` of `features/artifacts/artifacts.api.ts` | `artifact/entities/api/exports.api.ts` | Imports; `createExport` takes the idempotency key ([D7](#d7-idempotency-keys)) |
| `createdExports`, `fileOf`, `served` and the handlers of the three endpoints in `mocks/artifacts.handlers.ts`, `mocks/mock-artifacts.store.ts` | `mocks/artifacts/exports.handlers.ts` and `exports.store.ts` | Scenario helper; the `Export` id prefix of `mock-ids.constants.ts`; `idempotent` of I1 on the `POST`; the templates read the definition that E1 placed in `mocks/workflow/` |

Write: `listProjectExports` with `fetchPage`, the key factory `exports.keys.ts`, `useExportQueries.ts` with `useProjectExports` and `useExport(exportId)`, which reads again while the export is `pending`; data-driven tests. The hook that asks and follows an export (`useExport` of the branch) is a feature hook and waits for S1. `GET /exports/{export_id}/file` is not in the API ([D5](#d5-endpoints-that-the-api-lacks)): the mock gives `download_url` an address that only the mock serves, and S1 decides what the download does.

The definition (2026-10-26, in the working tree of `feat/fe/artifact-entities`, not committed). The definition decides the names that every other module stores or shows, so the whole entity is built before `artifact`. One request serves every part of a version: `getWorkflowDefinition(version?)` reads it, `workflowKeys.definition(version?)` is its key (`'current'` without a version), and a hook picks its part with `select` (`useWorkflowDefinition`, `useStageTitle`), so that the stages, the labels, the graph and the summary of a version share one cache entry. A read with `?version=` stays fresh for ever, since a version never changes once a run has used it; the current one uses `workflowDefinitionStaleTime`.

| Copy | To | What changes |
|---|---|---|
| `nodeKinds`, `definitionNodeSchema`, `definitionEdgeSchema`, `workflowDefinitionSchema` of `features/workflow/workflow.types.ts` | `workflow/entities/types/workflow-graph.types.ts`, `workflow-definition.types.ts` | Written again from `docs/workflow/definition.schema.json`: the nodes are a union told apart by `kind`, so a checkpoint carries its options and questions, and every part of the definition (roles, stages, kinds, link types, value lists, directive kinds, export templates, run parameters, state) has a type in `workflow-vocabulary.types.ts` |
| `definitionSummarySchema` (export templates, link types) of `features/artifacts/artifacts.types.ts` | `workflow/entities/types/workflow-vocabulary.types.ts` | Part of the definition schema |
| `getWorkflowDefinition` of `features/workflow/workflow.api.ts` | `workflow/entities/api/workflow.api.ts` | Takes the version; the stages are read from the same answer by `select`, so there is no `listWorkflowStages` |
| `useStageTitle` of the backup of P7 | `workflow/entities/hooks/useWorkflowQueries.ts`, `@x/run.ts` | Reads the definition at the version of the run |

Write: `utils/workflow-definition.utils.ts` (`stageTitles`, `findNode`, `checkpointNodes`, `edgesFrom`, `findValueList`) with data-driven tests; the handler of `/workflow/definition` in `mocks/workflow/workflow.handlers.ts`, which answers `404` for a version it does not have and `Cache-Control: public, max-age=31536000, immutable` for a read that names one; `workflowDefinitionFixture`; `HttpHeader.CacheControl`. The options and questions of a checkpoint are typed here, in `workflow`, because the interrupts of `review` (E5) are made from them and `review` sits above `workflow`: E5 imports these types and does not repeat them. The state of a run is E4.

### E3. `trace-link`

Endpoints: `GET /items/{item_id}/trace`, `GET`, `POST /projects/{project_id}/trace-links`, `DELETE /trace-links/{link_id}`, `GET /projects/{project_id}/traceability/matrix`, `GET /projects/{project_id}/traceability/coverage`.

| Copy | To | What changes |
|---|---|---|
| `traceNodeSchema`, `traceLinkSchema`, `traceSchema` of `features/artifacts/artifacts.types.ts`; `matrixSchema`, `coverageSchema` of `features/traceability/traceability.types.ts` | `trace-link/entities/types/` | `linkSchema` of traceability merges with `traceLinkSchema` |
| `getItemTrace` of `artifacts.api.ts`; `getMatrix`, `getCoverage` of `traceability.api.ts` | `trace-link/entities/` | Imports |
| `features/traceability/issues.utils.ts`, `issue-kinds.constants.ts`, with the cases of their test | `trace-link/entities/` | Imports; tests data-driven |
| `mocks/traceability.handlers.ts` | `mocks/traceability/` | Scenario helper |

Write: the list of links with `fetchPage`, creating and removing a link with their handlers, keys, hooks.

### E4. `run`

Endpoints: `GET /threads/{thread_id}/runs`, `GET /runs/{run_id}`, `GET /runs/{run_id}/steps`, `GET /runs/{run_id}/stream`, `GET /runs/{run_id}/state`, `GET /runs/{run_id}/steps/{step_id}/state`, `GET /runs/{run_id}/directives`, `POST /runs/{run_id}/cancel`, `POST /runs/{run_id}/retry`. `POST /threads/{thread_id}/runs` stays with the first chat ([D5](#d5-endpoints-that-the-api-lacks)).

From P7: the latest run of a thread, `cancelRun`, the address of the stream and the names of its events, the rule of the reducer that skips the events applied already, the run mocks.

| Copy | To | What changes |
|---|---|---|
| The `message_delivered` event of `runEventSchemas` in `features/console/console.types.ts` | `run/entities/events/run-events.types.ts` | None |
| `features/workflow/step-groups.utils.ts` (`groupSteps`: the steps of one subject together, such as the turns of one interview) and `run-progress.utils.ts` (`runProgress`: the state of each node from the steps), with the cases of their tests | `run/entities/steps/` | `WorkflowStep` and `WorkflowRun` become `RunStep` and `Run` |
| `retryFromStep` of `features/workflow/workflow.api.ts` | `run/entities/runs/runs.api.ts` | Imports; takes the idempotency key ([D7](#d7-idempotency-keys)) |
| `workflowStateSchema` of `features/workflow/workflow.types.ts` | `run/entities/state/run-state.types.ts` | Renamed `runStateSchema`; `values` follows the state schema of the definition |
| `getWorkflowState` of `features/workflow/workflow.api.ts` | `run/entities/runs.api.ts` | Renamed `getRunState`; with a step, the state after it |
| `mocks/workflow-state.handlers.ts` | `mocks/runs/` | Scenario helper; it reads the artifact fixtures of E1 |
| `shared/components/run-config/run-config.types.ts` and `run-form.utils.ts`, with the cases of `run-form.utils.test.ts` | `run/entities/` | Imports; tests data-driven |

Write: the directives with their mock; the key of the state of a run, with and without a step; the fields of RunDefaults with the shared form components, reading `RunConfigFields.tsx` of the branch. `groupSteps` and `runProgress` are what the tree of the steps of Activity reads.

### E5. `review`

Endpoints: `GET /runs/{run_id}/interrupts`, `POST /runs/{run_id}/resume`.

| Copy | To | What changes |
|---|---|---|
| `optionSchema`, `answerSchema`, `questionTypes`, `questionSchema`, `interruptSchema`, `ResumeBody`, `reviewedItemSchema`, `resumedRunSchema` of `features/review/review.types.ts` | `review/entities/review.types.ts` | `pendingReviewSchema` of the console merges into `interruptSchema` |
| `resumeRun`, `listReviewedItems` of `features/review/review.api.ts` | `review/entities/` | Imports; `resumeRun` takes the idempotency key ([D7](#d7-idempotency-keys)) |
| `mocks/interrupts.handlers.ts` | `mocks/interrupts/` | Scenario helper |

Write: the pending interrupt with `fetchPage`, keys, hooks.

As built (2026-10-29, on `e5-zcode`, not merged), following the [E5 plan](frontend-e5-review-plan.md) (5 commits: `artifactRefOf` for the artifact references of the mocks; the endpoints and the three `@x/review` files with `interrupts.types.ts`; the mock folder `mocks/interrupts/`; the entity; the docs). What differs from this row and follows the E5 plan instead:

- One resource, so the files sit by kind at the root of the slice: `interrupts.api.ts`, `interrupts.types.ts`, `interrupts.keys.ts`, `interrupts.constants.ts`, `hooks/useInterruptQueries.ts`, `__tests__/`. The options, questions and answers of a checkpoint come from `workflow` through `@x/review` files (one per module that gives them: `workflow`, `artifact`, `run`); `review` declares only `InterruptQuestion` (a checkpoint question with `source`), `Interrupt`, `ResumeRunBody` and `ModifiedItem`.
- The index of the slice was born with the type exports in the commit of the types (not the last one), so that the mocks, which import the slice through its index, compile on every commit.
- The mock derives every interrupt from the steps of the run at the checkpoint nodes of the definition, with `interruptEdits` in the store for the answers; the scenarios `mock-interrupts`, `mock-agent-questions` (`only`, `added`) and `mock-resume-run` serve its states. An approval writes `change_reason` `reviewed` on the artifacts under review and their draft items.
- The refusal of edits on an interrupt that does not allow them is tested in the validators only: every checkpoint of definition version 1 allows edits, so no interrupt the mock serves refuses them; the handler test keeps the refusals the mock can serve.
- The two open docs gaps of the E5 plan (section 11) are left to the user, on `docs/fe/api-fields`: the order of the interrupts by `created_at`, and the pending interrupt set to `cancelled` when a run is cancelled.

### E6. `thread`

Endpoints: `GET /projects/{project_id}/threads`, `GET /threads`, `POST /projects/{project_id}/threads`, `GET`, `PATCH`, `DELETE /threads/{thread_id}`, `GET`, `POST /threads/{thread_id}/messages`.

From P7: the threads of a project, `Thread` and `Message`, newer than on the branch, with the thread and message mocks.

| Copy | To | What changes |
|---|---|---|
| `mocks/threads.fixtures.ts` (89 lines) | `mocks/threads/fixtures/` | Types from `thread/entities`; `sentMessages` moves to the store |
| `mocks/threads.handlers.ts` (108 lines) | `mocks/threads/handlers/` | Scenario helper; split per endpoint |
| `mocks/messages.fixtures.ts` (89 lines) | `mocks/messages/fixtures/` | Types from `thread/entities` |
| `mocks/messages.handlers.ts` (72 lines) | `mocks/messages/handlers/` | Scenario helper; the mock already keeps created messages in a store |

Write: the list of messages and its handler, the changes of a thread with their handlers, and the function that sends a message to a thread with its idempotency key ([D7](#d7-idempotency-keys)), which `sendFirstMessage` then calls. On `main`, `thread/entities` already has `threads.api.ts` and `threads.types.ts` (listThreads, sendFirstMessage); `mocks/threads/` and `mocks/messages/` already serve their endpoints with a store for created messages.

### E7. `llm-model`

Endpoints: `GET /models`, `GET`, `PUT /me/model-settings`.

| Copy | To | What changes |
|---|---|---|
| `catalogModelSchema`, `modelChoiceSchema` of `features/settings/settings.types.ts` | `llm-model/entities/` | `modelEntrySchema` of project settings is the same object and goes |
| `listCatalog`, `listModelChoices`, `replaceModelChoices` of `features/settings/settings.api.ts` | `llm-model/entities/` | Paging where it lists |
| `mocks/models.fixtures.ts`, `models.handlers.ts` | `mocks/models/` | Scenario helper |

Write: keys and hooks.

### E8. `user`

Endpoints added: `PATCH /me`, `POST /me/password`, `GET /me/sessions`, `DELETE /me/sessions/{session_id}`, `GET`, `PUT /me/settings`.

| Copy | To | What changes |
|---|---|---|
| `userSettingsSchema`, `profileSchema`, `sessionSchema` of `features/settings/settings.types.ts` | `user/entities/user.types.ts` | RunDefaults from `run/entities` |
| `getUserSettings`, `replaceUserSettings`, `changeProfile`, `changePassword`, `listSessions`, `revokeSession` of `features/settings/settings.api.ts` | `user/entities/user.api.ts` | Paging for the sessions |
| `mocks/account.fixtures.ts`, `account.handlers.ts` | `mocks/account/` | Scenario helper; already on `main` for the auth and me endpoints |

Write: keys in `userKeys`, hooks. The hooks of the branch (`useAccountQueries.ts`) write their keys by hand and mix queries with mutations, so they are not copied. On `main`, `mocks/account/` already has `auth.handlers.ts`, `me.fixtures.ts`, `me.handlers.ts` and `me.problems.ts`; the user PR extends them.

### E9. `usage`

Endpoint: `GET /me/usage` with `?group_by=`.

From P7: the usage of the month, with the mock of `/me/usage`.

| Copy | To | What changes |
|---|---|---|
| `usageGroups`, `usageGroupLabels`, `usageSchema` of `features/settings/settings.types.ts`; `getUsage` of `settings.api.ts` | `usage/entities/` | Merged with the usage of the month of P7 |

### Not copied

The components, the frame configs and the pages of every feature; the console model (`event-log.utils.ts`, `input.utils.ts`, `commands.constants.ts`, `command-history.store.ts`), whose slash commands option D replaces; the settings hooks and sections. Pure helpers of the screens are copied with their screen in [section 8](#8-screens).

## 7. The frame

The changes of [D4](#d4-the-frame-stays-generic), all in R1:

1. Done, in R1: `Workspace` with `tabGroup` and `TabGroupContext`, instead of `ProjectWorkspace` and `projectTabGroup`; the pages and the tab strip read the group with `useTabGroup`.
2. Done, in R1: the description of the command palette without a product object.
3. Done, in R1: `homeHref` given by the layout.
4. Done, in R1: the items of the activity bar are destinations.

Check after the PR: no object of the product in the code or the words of the frame (`grep -rniE "project|thread|artifact|review" src/shared/components/frame`, comments aside; the frame uses `item` and `run` for its own bar items and commands), and the Settings feature shows on a screen outside a project, where `PageWorkspace` holds its side panel.

### Stored tabs across browser tabs

The stored editor tabs of a project can be lost while several browser tabs are open, on `main` as in R1. The `editor-tabs` store reads the browser storage once, after the first render, and every change writes back the whole `{ groups, preview }`; a browser tab does not hear the writes of another. A browser tab on project A thus writes its copy of the group of project B, as it was when the tab loaded, over the tabs that another browser tab has opened in B since; after a reload, those tabs are gone.

| Option | Evaluation |
|---|---|
| a. On the `storage` event of the key, read the stored value again (`persist.rehydrate()`) | About ten lines; each browser tab reads the latest value before it writes. Two browser tabs on the same project share one strip: closing a tab in one removes it from the other, even while its page is on screen there |
| b. One storage key per group (`editor-tabs:<group>`), and each browser tab writes only the groups it changed | Two projects never write over each other; two browser tabs on the same project stay last write wins. Needs a storage of its own for the store |

Decision: b, in C1 ([section 9](#9-pr-sequence)), with tests in which another browser tab writes to the storage between two changes. The `panels` and side feature stores keep last write wins: they hold sizes and the feature chosen, which cost little to lose.

## 8. Screens

After the entities, one screen at a time, each drawn first from the skeletons of option D, then built. The order follows what links to what: the review bar sits in a document, and Activity links to documents and items.

| # | Screen | Module of the screen | Features | Copy with the screen |
|---|---|---|---|---|
| S1 | Documents: the side panel of documents with the outline, the document tab, the item page and peek | `documents` | `artifact/features/edit`, `restore`, `export` | None |
| S2a | Activity: Progress (the stages of the definition as a stepper of steps and sub-steps) and Outline (the messages of the user as a timeline) in the side panel, the chat in a tab with its work in plain words, its reviews and the prompt that it shares with a new project ([S2a plan](frontend-s2a-activity-plan.md)) | `activity` | `thread/features/send-message`, `activity/features/choose-run-settings`, `review/features/answer`, `run/features/stop` | `features/review/review-form.utils.ts`, `review.schema.ts`, `QuestionField.tsx` to `review/features/answer` |
| S2b | The review bar of a document and of its item pages, with the edited items | `documents`, `review` | `review/features/answer` (S2a) | None |
| S3 | Search, in its side panel and in the command palette | `artifact` | None | None |
| S4 | Trace: the matrix, the gaps and issues | `trace` | Creating and removing a link | `features/traceability/matrix-filter.utils.ts` |
| S5 | Settings, both scopes | `settings` | The saves of `user`, `project` and `llm-model` | None |
| S6 | Workflow, in the developer view: the graph of a run, its steps and its state | `run` | `run/features/retry` | `features/workflow/graph-layout.utils.ts` to `run/widgets/graph` |

The features of each screen are those of section 6 of Web App Modules; a screen adds its route, its feature item in `<feature>-frame.config.tsx` and its entry in the layout. S2a reads the new chat of P7 in its backup as a reference ([D8](#d8-complete-entities-and-the-parts-of-p7)).

### Dialogs opened from several places

Rename and Delete of a project each have a store of the same shape (`projectId`, `open`, `openDialog`, `setOpen`, `closed`) and the same two hooks, one that opens the dialog and one that `ProjectDialogs` reads. The Stop dialog of P7 sits beside its button, the one place on the screen that shows it, and keeps only `runId`, so it shares nothing with them. Two copies cost less than a shared layer that hides the names of the domain (`projectId` becomes `targetId`).

The screen PR that adds a third dialog opened from several places also moves that store to shared code:

- `createPendingActionStore()` in `src/shared/lib/pending-action/pending-action.store.ts`, with `useSetPendingAction(store)` and `usePendingAction(store)`.
- A unit test of the order of closing: `setOpen(false)` keeps the id while the dialog closes with its animation, and `closed()` forgets it.
- Rename and Delete use it and keep their named hooks, so the places that open them and the rules of ESLint do not change.
- The component that mounts the dialogs stays one for each object, as `ProjectDialogs`, since it reads its object with the query of its module.

## 9. PR sequence

Branch names are `<type>/fe/<name>`.

The PRs go one at a time, in the order of the rows: each branch starts from `origin/main` once the PR of the row above is merged. The column Needs gives the PRs whose code a row uses; a change of the order keeps each row after them.

| # | Branch | PR title | Needs |
|---|---|---|---|
| R1 | `refactor/fe/modules` | `refactor(frontend): divide the code by module` ([D6](#d6-the-current-branch)) | P6 |
| C1 | `refactor/fe/cleanup` | `refactor(frontend): place the code in its modules, move and check the conventions, and keep the stored tabs of each project` (commits below) | R1 |
| I1 | `feat/fe/idempotency-keys` | `feat(frontend): send an idempotency key with the requests that start work` ([D7](#d7-idempotency-keys)) | R1 |
| P2 | `docs/fe/api-fields` | `docs(api): add the fields that the screens read` | none |
| M1 | `refactor/fe/move-shared-and-mocks` | `refactor(frontend): move shared and mock files into folders by topic` (#30, merged; [four PRs](#the-refactor-of-shared-code-and-the-mocks-m1-to-m4)) | P2 |
| M2 | `refactor/fe/rename-files` | `refactor(frontend): rename the files of login, the request helper, the layouts and the mocks` (#31, merged) | M1 |
| M3 | `refactor/fe/extract-helpers-and-rename-code` | `refactor(frontend): extract the shared helpers and the test setup, and rename the code` (#32, merged) | M2 |
| M4 | `feat/fe/number-input-and-shared-helpers` | `feat(frontend): add NumberInput and more shared helpers` (#33, merged) | M3 |
| E0 | `feat/fe/workflow-entities` | `feat(frontend): read the workflow definition, the artifact kinds and their content schemas` | none (M4 merged) |
| E1 | `feat/fe/artifact-entities` | `feat(frontend): read and change artifacts and items` | P2, E0 |
| E1b | `feat/fe/export-entities` | `feat(frontend): read and request the exports of a project` | E1, I1 |
| E3 | `feat/fe/trace-link-entities` | `feat(frontend): read and change the trace links` | E0, E1 |
| E4 | `feat/fe/run-entities` | `feat(frontend): read the runs, their steps and their directives, and stop or retry a run` | C1, E1, I1 |
| E5 | `feat/fe/review-entities` | `feat(frontend): read the interrupts of a run and answer them` | E4 |
| E6 | `feat/fe/thread-entities` | `feat(frontend): read and change the threads and their messages` | E1, E4, I1 |
| P7 | `feat/fe/project-status` | `feat(frontend): show the run of a project in the status bar, and stop it` ([D8](#d8-complete-entities-and-the-parts-of-p7)) | E0, E4, E6 |
| E7 | `feat/fe/model-entities` | `feat(frontend): read the model catalog and the model choices` | R1 |
| E8 | `feat/fe/user-entities` | `feat(frontend): read and change the profile, the sessions and the settings of the user` | C1 |
| E9 | `feat/fe/usage-entities` | `feat(frontend): read the usage of the user by group` | R1 |
| B1 | `feat/fe/monthly-budget` | `feat(frontend): show the budget of the month in the status bar` ([D8](#d8-complete-entities-and-the-parts-of-p7)) | P7, E9 |
| S1a | merged | #55 `refactor(frontend): group the artifact entities by topic and fix small issues`, #56 `docs(schemas): add a short title and x-ui-navigable to the items`, #57 `feat(frontend): read the outline and the status of the documents, and the content values in words`, #58 `feat(frontend): show the documents of a project in the side panel and in tabs` ([plan](frontend-s1a-documents-plan.md)) | E0 to E6, P7 |
| S1b.D | `docs/fe/api-fields` | `docs(api): accept a change of a document only during a review, and quote the words of both items of a link` ([S1b plan](frontend-s1b-edit-artifacts-plan.md)) | S1a |
| S1b.0 | `chore/fe/maintenance-before-edit` | `chore(frontend): move the page link to the frame, drop the artifact panel placeholder, fix the transcript links, refuse a change outside a review in the mock, and place the documents files in the folders of their kind` | S1b.D |
| S1b.1 | `feat/fe/edit-entities` | `feat(frontend): read the inputs of the content fields, the history of a record, the links and the origin of an item, and when a document can change` | S1b.0 |
| S1b.2 | `feat/fe/edit-artifacts` | `feat(frontend): edit an item and a document during a review, browse and restore their versions, and show the links and the origin of an item` | S1b.1 |
| S1e | `feat/fe/document-layouts` | `feat(frontend): lay out an interview as a conversation of its participants and the personas as profiles, from their schemas` ([S1e plan](frontend-s1e-document-layouts-plan.md)) | S1b.2 |
| S1c.1 | `feat/fe/aside-panel` | `feat(frontend): add a right panel to the frame, which the side panel gives way to on a narrow window` ([S1c plan](frontend-s1c-item-peek-plan.md)) | S1e |
| S1c.2 | `feat/fe/item-peek` | `feat(frontend): peek at an item in the right panel from the keys of a document` | S1c.1 |
| S1d | `feat/fe/export` | `feat(frontend): export a document from its page and from the command palette, and download it when it is ready` ([S1d plan](frontend-s1d-export-plan.md)) | S1c.2 |
| S2a.D | `docs/fe/activity` | `docs: describe the activity, the decision of a review and the rule of shared code` ([S2a plan](frontend-s2a-activity-plan.md)) | None |
| S2a.0 | `chore/fe/maintenance-before-activity` | `chore(frontend): remove the first chat and the start of a run that the API lacks, and move the code without business to shared` | S1d |
| S2a.1 | `feat/fe/activity-entities` | `feat(frontend): read the progress of the stages, the work of a run in words, the decision of a review and the thread of the activity` | S2a.0, S2a.D |
| S2a.2 | `feat/fe/prompt-input` | `feat(frontend): add the stepper, the timeline, the trace, the entry of a feed, and one prompt input for every prompt that starts work` | S2a.1 |
| S2a.3 | `feat/fe/send-message-and-answer` | `feat(frontend): send a message, choose the settings of the run it starts, and answer a review` | S2a.2 |
| S2a.4 | `feat/fe/activity` | `feat(frontend): show the activity of a project, its progress and its outline in the side panel and the chat in its tab` | S2a.3 |
| S2b | `feat/fe/review-bar` | The review bar of a document (plan to write from S2a as built) | S2a.4 |
| S3 to S6 | `feat/fe/<screen>` | One per screen of [section 8](#8-screens) | Their entities |

For every PR: a branch from `origin/main`; copy the files of its row from `feat/fe/mock` with `git show feat/fe/mock:<path>`, then apply the changes of its row; run the checks one at a time (typecheck when imports, types or routes change, lint of the changed files, tests of the touched folders; the full lint and the full test run in CI on the PR); search the diff for a non-ASCII character in prose and a leftover `console.log`; one-line Conventional Commits message, no AI attribution; open as a draft.

Small fixes, refactors and docs share one PR, one commit each, so that each commit reads alone in the review. The repository merges by squash only, so `main` gets one commit per PR, under the title of the PR, and a revert takes the whole PR. C1 holds these commits, in this order:

1. `docs(frontend): move the conventions of the frontend to frontend/CONTRIBUTING.md` ([contributing guide](#the-contributing-guide-of-the-frontend)), first, so that the rules of the last commit cite the new file
2. `fix(frontend): keep the stored tabs of each project when several browser tabs are open` ([stored tabs](#stored-tabs-across-browser-tabs))
3. `refactor(frontend): place the run defaults, the filters of the list and the theme in their modules`, with the deletion of `useModelOverridesStore` ([section 5](#5-cleanup-before-the-entities))
4. `refactor(frontend): rename the values that break the identifier naming`: the exported values in UPPER_SNAKE_CASE and the private settings in camelCase
5. `refactor(frontend): move the declarations to the files of their kind and place`: the types and constants rule of the frontend CONTRIBUTING, with the last six rows of the placement table of [section 5](#5-cleanup-before-the-entities); after commit 4, which renames the ids of `mock-ids.constants.ts` that it moves
6. `refactor(frontend): replace the class values in brackets with theme tokens`: the three classes of [section 5](#conventions-that-eslint-does-not-check), `grid-rows-[auto_minmax(0,1fr)]` of `NewProjectDialog` and `max-w-[calc(100vw-2rem)]` of `FilterMenu`, which the rule found, become `max-h-dialog`, `grid-rows-header-body`, `grid-rows-body-footer`, `sm:pt-prompt-top` and `max-w-popover`, from a `@theme` block of `styles.css`
7. `build(frontend): check more conventions with ESLint` ([ESLint](#conventions-that-eslint-does-not-check)), with the check of `moduleImports`: the config does not load when the lists form a cycle or name a module without a list

C1 is done in the working tree on 2026-10-20, not committed: each step is a commit of `refs/backup/refactor-fe-cleanup-steps`, so that the seven commits are made from it after review. The backup of P7 still uses the names before C1 in 44 files (`PROJECT_IDS`, `RUN_EVENT_TYPES`, `isFiltered` from `project/entities`, ...); each PR that takes a part of it renames them as commit 4 did, and moves the types and the functions out of its constants files as commit 5 did.

### The refactor of shared code and the mocks (M1 to M4)

Decided on 2026-10-24 and cut again on 2026-10-25, after M1 was merged (#30). M2, M3 and M4 were opened as stacked drafts on 2026-10-26 (#31 to #33) and merged; the text below describes the cut as it was planned, and the commits of the merged PRs are the final record. The work of `feat/fe/artifact-entities-temp` (three throwaway commits above `a95e094`) holds, besides E0 to E1b, a refactor of `shared/`, `mocks/`, `src/test/` and the tooling. It goes in four PRs that stack: each branch starts from the one above until that one is merged, then it is rebased on `origin/main` (`git rebase --onto origin/main <last commit of the merged branch> <branch>`).

The working tree of that branch is saved in `refs/backup/artifact-entities-temp-2026-10-25-b` (all of it), the tree of M3 in `refs/backup/m2b-final-tree-2026-10-25`, with the index in `.git/backup/`. The refs are local; push them only on request. The first cut (M2 with the helpers, M3 with the features) stays in the branches `refactor/fe/rename-and-split-shared-code` and `feat/fe/number-input-env-and-coverage`; both can be deleted now that the stack is merged.

**What each PR holds.**

- **M2, `refactor/fe/move-files-to-new-names`**: only moves. `git mv` of the files that change name or folder, with the specifiers that follow and no other change, so that git shows them as renames and `git log --follow` keeps their history. The identifiers keep their old names (`useLogin.ts` still exports `useSignIn`).
- **M3, `refactor/fe/rename-and-split-code`**: the rename and the split, which keep the behavior (apart from the texts of the login pages: Log in, Log out, Register): the vocabulary of HTTP, the paths of the API, the errors and the pages of a request, the layers of the mocks, the helpers of the unit tests, the E2E steps, the registry of the frame, `pending-action`, the names, and the ESLint rules that keep them.
- **M4, `feat/fe/shared-helpers-and-number-input`**: the helpers for collections, text, timing and number formats, and the features that change behavior: the environment check, the screen width of `useIsMobile`, the search of the palette without the accents, `NumberInput` and `NumberField`, and the coverage report.
- **E0, E1, E1b** take the files of the entities from the backup, on `main` after M4. They add their endpoints to `apiEndpoints`, their ids to `mock-ids.constants.ts`, their handlers to `mocks/api.setup.ts`, and the module lists of `eslint.config.js`.

**How M3 is cut.** The layers of the code depend on each other: a change of an export of `shared/api` changes its users, so a commit by layer does not compile (the groups were tried one by one and in sequence: only all of them together build). M3 is cut in these steps:

1. the file kinds in ESLint;
2. three commits of files that are only added and compile on their own (the vocabulary of HTTP and the paths of the API; the helpers by topic, the registry of the frame and the parameters of an address; the helpers of the unit tests and of the mock server);
3. one commit of the switch (297 files: every file that changes, and the new files that need them), which does not split;
4. the E2E steps and the screenshots; the ESLint rules; the docs.

**M3 commits** (8 above M2): `build ... accept the file kinds ...`, `refactor ... add the vocabulary of HTTP, the paths of the API and the page of a list`, `refactor ... add the shared helpers by topic, the registry of the frame and the parameters of an address`, `refactor ... add the helpers of the unit tests and of the mock server`, `refactor ... rename and split the shared code, the mocks and the modules with the new helpers`, `test ... share the steps of the E2E tests and write the screenshots as tests`, `build ... check the names, the layers and the vocabulary with ESLint`, `docs ... describe the names, the folders and the helpers`.

**M4 commits** (9 above M3): `feat ... add the shared helpers for collections, text, timing and number formats`, `refactor ... use the shared helpers in place of the code written by hand`, `refactor ... move useIsMobile to a file named after it`, `feat ... read the screen width of useIsMobile as an external store`, `feat ... check the environment variables when the app starts`, `feat ... match the search of the command palette without the accents`, `feat ... add NumberInput and NumberField`, `feat ... show the number inputs in the design system`, `build ... report the coverage on the pull request`.

The registry `apiEndpoints` holds the endpoints that `main` uses; E0, E1 and E1b add theirs. The helpers `guards`, `url`, `registry` and `pending-action` are in M3 because the new names use them.

Changes of behavior to say in the text of the PRs. M3: the buttons read "Log in", "Log out" and "Register"; a revision of a fixture has no milliseconds in `created_at`. M4: the search of the palette ignores accents and case; the app stops at start when a variable is wrong; `useIsMobile` is rewritten; the CI posts a coverage comment on a pull request of the same repository.

**Moves that `git status` does not show as `R`.** A move that changes more than half of a file shows as an add and a delete in the tab of the files of a PR. In M2 they are renames (the content is the old one), so the history is kept; in M3 the same files are modified in place. What stays as an add and a delete: `sign-out/index.ts` (one line), and the real deletions `idempotency.constants.ts` (now `HttpHeader.IdempotencyKey`) and the `*.data.ts` files of the screenshots (the cases are in the specs).

## 10. Open points

| Point | Options | Leaning |
|---|---|---|
| Settings in Usability | Option D shows the user settings behind the gear of the activity bar; [D3](#d3-settings) puts both scopes in the Settings feature | Update section 5.1 and the skeletons of option D |
| Projects in the command palette | Usability lets the palette find projects by name; `GET /projects` has no text filter | Filter the loaded list, or add `q` to the API |
| `docs/fe/api-fields` | Merge before E1, whose fields it may add | Merge first |
| The body of the revisions | `docs/API.md` gave no body for the revisions and no answer for create, reorder, move, delete and restore. Written in P2 on 2026-10-21 (commit `fc8b29d` of `docs/fe/api-fields`): the entries of a history have `version`, `change_reason`, `changed_by`, `created_at` and `content`; create answers `201`, reorder and delete `204`, move and restore the record | Done in P2 |
| Restoring an artifact to a version | The mock keeps the version of each item when the user makes a new version of an artifact, and restore brings each item back to it (an item deleted since comes back; an item added since stays). The API tells nothing of an item added after the version, and the revision of an artifact has no `item_versions` in the API body (the data shape has it) | Ask in `docs/API.md` what restore does to such an item, then change the mock; a fixture version restores the items to the content of the fixtures |
| `outline_number` of an item | Decided on 2026-10-26: always a string, the outline number (`3.2.1`) or the place (`1`, `2`) in an artifact without sections, also at a version and for a deleted item (`docs/DATA_SHAPE.md` of `docs/fe/api-fields` says so); the entity and the mock no longer allow null | Done in E1 |
| `updated_at` of an export | The common fields give it to every entity that is not append-only; the API has no body for an export | Left out until a screen reads it |
| Exports | Row E1b holds them; the API lacks the file endpoint ([D5](#d5-endpoints-that-the-api-lacks)) | Done in E1b, the file with S1 |
| `POST /projects` without an idempotency key ([D7](#d7-idempotency-keys)) | Decided on 2026-10-21: `docs/API.md` lets the creation of a project take the header (commit `e11355b` of `docs/fe/api-fields`). The web app still creates a project without a retry, since the thread that follows takes no key; it sends the key with the creation when that mutation can retry | Done in P2 |
| `frontend/eslint.config.js` is long (about 890 lines) | Split it into `frontend/lint/` | Done on 2026-10-26 in `feat/fe/artifact-entities`: `eslint.config.js` joins the blocks of `lint/configs/` (one file for each concern), `lint/lib/` holds the shared lists and functions in a folder for each topic, `lint/plugin/` the local rules. The resolved config of all 841 files that existed before is identical (only the message that names `moduleImports` changed its file) |
| Hooks and files below full coverage (`pnpm test:coverage`, 2026-10-24) | `useRunStream` and `useIsMobile` are at 0%, `useStartRun` at 66.7%, `useExportQueries` at 16.7% (E1b); `useIsMobile` is used only by `components/ui/sidebar.tsx`, which no screen uses | `useStartRun` and `useRunStream` are tested (100% statements, 2026-10-30, on `refactor/fe/mock-ids-and-test-helpers`, not merged); still open: decide if `ui/sidebar.tsx` and `useIsMobile` go; a hook that only calls the API needs no test of its own when the component tests run it |
| State shared between the test files (found on 2026-10-31, PR #52) | The unit tests run with `isolate: true`, one fresh module graph for each file, which costs about 4 seconds of start for each of the 286 files; the unit tests took 997 s on CI after E7, and #52 splits them into four parts. A run of the whole suite with `isolate: false` fails 21 tests in 9 files, because state outlives a file: the editor tabs store (`frame/tabs/editor-tabs.store`, `useEditorTab`, `TabbedWorkspace`, `useOpenPage`), the commands of the palette (`CommandPalette`, `useStopRunCommand`), `ProjectSwitcher`, `ProjectListPage`, `highlight`; and the `vi.mock('@/shared/lib/url')` of `UserMenu.test.tsx` | A maintenance PR (`fix` or `test`): the setup puts back each store and registry of module state after each test, as it does for zustand and the mock data, and `UserMenu` reads `reloadTo` through a stand-in of `@/test/next-stubs` instead of `vi.mock`; then `isolate: false` for the `app` project, checked with the whole suite run twice in a different order (`--sequence.shuffle`) |

## 11. Checklist

- [x] D6 decided: R1 then P7
- [x] R1 cut and reviewed
- [x] R1 committed (eight commits, 2026-10-20)
- [x] R1 opened as a draft (#27)
- [x] R1 merged (#27)
- [x] P7 restored on `main`, its code placed (section 5), and kept in its backup ([D8](#d8-complete-entities-and-the-parts-of-p7))
- [x] F1, G1 and C1 joined in C1 (2026-10-20)
- [x] C1 done in the working tree, each step in `refs/backup/refactor-fe-cleanup-steps` (2026-10-20)
- [x] Types and constants rule, and the declarations moved to the files of their kind, as commit 5 of C1 (2026-10-21)
- [x] C1 committed (eight commits) and opened as a draft (#28, 2026-10-21)
- [x] C1 reviewed and merged (#28, 2026-10-21): contributing guide of the frontend, stored tabs, placement, naming, types and constants, bracket classes, ESLint rules
- [x] I1 idempotency keys sent, committed (two commits) and opened as a draft (#29, 2026-10-21)
- [ ] P2 API docs merged
- [x] M1 moves (#30), M2 file renames (#31), M3 shared helpers and renames (#32), M4 NumberInput and more helpers (#33): cut from the backup, merged (2026-10-26; plan in section 9)
- [x] E0, E1 and E1b implemented in the working tree of `feat/fe/artifact-entities` (2026-10-21; restored from `refs/backup/artifact-entities-temp-2026-10-25-b` onto `origin/main` on 2026-10-26): the kinds in `workflow/entities`, the artifact and export entities, mocks, tests, docs; not committed, to be split into the three PRs
- [ ] E0 workflow entities merged
- [ ] E1 artifact entities merged
- [ ] E1b export entities merged
- [ ] E3 trace-link entities merged
- [ ] E4 run entities merged
- [ ] E5 review entities merged
- [ ] E6 thread entities merged
- [ ] P7 status of a project and Stop merged
- [ ] E7 model entities merged
- [ ] E8 user entities merged
- [ ] E9 usage entities merged
- [ ] B1 budget of the month merged
- [ ] Usability updated for Settings, and the screens drawn
- [ ] S1 to S6 merged
- [ ] `feat/fe/mock` holds nothing left to copy; then delete it
- Errors of the API move out of `shared/api/request/` into `shared/api/error/` (`api-error.types.ts`, `api-error.utils.ts`: `ApiError`, `ApiErrorCode`, `HttpStatus`, `FieldProblem`, `ErrorMessages`, `errorMessageOf`, `isNotFoundError`, `toApiError`), since the query client and the forms read them without calling anything; `request/` keeps `apiRequest`, `apiCommand`, `apiUrl` and `fetchPage`, and imports `error/`. `loadPage` is `reloadTo` in `shared/lib/url/reload.utils.ts`, so that it is not read as a page of a list and does not sit with the sign-in code, and `NumberInput`, `NumberField` and their files sit in `shared/components/form/number/`.
- Shared barrels match their names: the number rules (`clamp`, `decimalsOf`, `NumberLimits`) leave `lib/values` for `lib/numbers/`; `useModifierKeyName` moves to `lib/hotkey/hooks/` and `useNow` to `lib/timing/hooks/`, beside the topic they serve, so that `shared/hooks/` keeps only `useIsHydrated` and `use-mobile`; `toast.constants.ts` moves from the root of `lib/` into `lib/timing/`.
