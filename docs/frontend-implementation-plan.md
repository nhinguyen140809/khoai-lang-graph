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
| One logical change per PR; moves in their own PR | The move to modules is reviewed apart from new code where it can be cut ([D6](#d6-the-current-branch)) |
| The screens are drawn only as the skeletons of option D | The entities, which follow `docs/API.md` and `docs/DATA_SHAPE.md` and no drawing, come first; a widget waits for its drawing |
| The frame names no feature and holds no rule of the product | The changes of [section 7](#7-the-frame) land in R1, before the screens add features to it |
| Copy only what carries over almost unchanged from `feat/fe/mock` | [Section 6](#6-entities-module-by-module) lists each copy and what changes in it; nothing else is copied |
| `docs/API.md` may lack an endpoint or a field that a screen needs | A gap goes to `docs/API.md` first and to [section 10](#10-open-points); no code and no mock answers an endpoint that the API does not describe |
| The machine has 8 GB | Checks run one at a time: lint of the changed files, tests of the touched folders, typecheck when types or routes change |

## 2. Context

State on 2026-10-19.

| Branch | State |
|---|---|
| `main` | P0, P1, P2b, P3, P4, P5 and P6 of the review plan are merged (#9, #13, #11, #12, #17, #20, #25), with six PRs outside it: #15 (API calls in hooks only, the routes factory, the mocks in folders), #16 (form fields, confirm dialog), #19 (data-driven unit tests), #22 (radix-nova components, sign-in pages), #23 (screenshots of the mock states, fonts), #24 (tidy before the project screens) |
| `feat/fe/threads` | This checkout, uncommitted: P7 (threads, the run on the status bar, Stop, the labels of the stages) and the move to modules. 381 files changed against `main`, 154 of them renames. The module `activity` holds the code of the first chat, which no route renders |
| `docs/fe/api-fields` | P2, not merged: 8 files under `docs/` differ from `main` |
| `feat/fe/mock` | The source of the copies. Features in flat folders (`features/<name>/`), the mocks in one folder, the console UI |

How `feat/fe/mock` differs from this branch, which decides what can be copied:

- The API helpers are the same (`apiRequest`, `apiCommand`, `ApiError`), except lists: `fetchAllPages` there, `fetchPage` here.
- The mock helpers are the same (`mock-db`, `problem`, `pagination`, and `findProject`, `allRuns`, `findMockRun`, `stepsOfRun`, `changeRun`, `meRecord`), except the scenario helper: `answerScenario(mockScenario(name))` returns a response or null there, and `answerScenario(name)` throws or returns the scenario here. A handler changes three lines per route.
- The unit tests are not data-driven there: their cases are reused, in a `<file>.data.ts` with `it.each`.
- Each feature declares its own schemas of shared objects: an item in `artifacts`, `search`, `traceability` and `console`; `listRunSteps` in `console` and `workflow`; the definition in both settings features. The entities declare each object once, so these merge instead of being copied side by side.
- The console UI, the review page and the artifact pages follow the old frame. Option D replaces them: Activity, Documents, Search, Trace and Settings on the activity bar, Workflow in the developer view. Their components are not copied.

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

The first chat of `main` moves in R1 to the modules (`run/entities` for the stream and its reducer, `run/features/start`, and its page to `activity/widgets/chat`); P7 replaces its page with the new chat. R1 is checked alone: typecheck, lint, the full unit tests.

## 4. Order of the modules

`MODULE_IMPORTS` of `frontend/eslint.config.js` after this plan; the rows marked new change today's list:

| Module | May import | Change |
|---|---|---|
| `workflow` | none | |
| `artifact` | none | |
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

From a read of the placement of the code on 2026-10-19, beyond what ESLint checks. They go into P7 or a small PR after it.

| Change | Why |
|---|---|
| The names of the events that the status stream follows (`RUN_STATUS_EVENTS`, `COST_EVENTS`) move from `project/entities` to `run/entities`, checked with `satisfies readonly RunEventType[]`; `STREAM_REOPEN_MS` stays | They are words of the run events, written as bare strings today |
| One address of the event stream: `runEventsUrl(runId, after)`; `runStreamUrl` goes | `runStreamUrl(id)` is the stream after event 0 |
| `ProjectRunStreams` moves from `project/widgets/status` to `project/entities`, beside `useRunStatusStream` | It holds no action: it keeps the queries of a project fresh |
| `isFiltered` moves from `project/entities` to `project-filters.utils.ts` of `project/widgets/list`; `noProjectFilters` stays | Only the list reads it; the API reads `noProjectFilters` |
| `runDefaultsSchema` moves to `run/entities`, and the run config of `runs.types.ts` becomes a named `runConfigSchema` | Value objects of the runs ([D3](#d3-settings)) |
| `useModelOverridesStore` is deleted | Nothing reads it, and the API has no one-off model override: the overrides of a project are `model_overrides` |
| The theme buttons of `user/widgets/settings` become a feature of `user` | [D3](#d3-settings) |
| `EntryAuthor` of the chat reads `Message['author']` once the chat shows messages | Same three values |

## 6. Entities, module by module

Each module is one PR, in this order; `artifact` comes before `workflow` because the mock of the workflow state reads the artifact fixtures. "Copy" lists only what carries over almost unchanged ([D1](#d1-what-is-copied-from-featfemock)); paths on the left are under `frontend/src/` of `feat/fe/mock`. "Write" is new code. Every entity gets its key factory, its query hooks in `hooks/use<Resource>Queries.ts`, and data-driven tests.

### E1. `artifact`

Endpoints: `GET /artifact-kinds`, `GET /content-schemas/{kind}/{schema_version}`, `GET /projects/{project_id}/artifacts`, `GET`, `PATCH /artifacts/{artifact_id}`, `GET /artifacts/{artifact_id}/revisions`, `POST /artifacts/{artifact_id}/restore`, `GET`, `POST /artifacts/{artifact_id}/items`, `POST /artifacts/{artifact_id}/items/reorder`, `GET /projects/{project_id}/items`, `GET`, `PATCH`, `DELETE /items/{item_id}`, `GET /items/{item_id}/revisions`, `POST /items/{item_id}/restore`, `POST /items/{item_id}/move`.

| Copy | To | What changes |
|---|---|---|
| `schemaPropertySchema`, `contentSchemaSchema`, `KindSchema`, `artifactKindsSchema`, `originSchema`, `reviewStatuses`, `artifactSchema`, `itemSchema`, `outlineItemSchema`, `changeReasons`, `revisionSchema` of `features/artifacts/artifacts.types.ts` | `artifact/entities/types/` | Imports |
| `getArtifactKinds`, `getArtifact`, `getItem`, `updateItem`, `restoreItem`, `getContentSchema` of `features/artifacts/artifacts.api.ts` | `artifact/entities/` | Imports |
| `listProjectArtifacts`, `listArtifactItems`, `listItemRevisions` of the same file | `artifact/entities/` | `fetchPage` instead of `fetchAllPages` |
| `features/artifacts/field-view.utils.ts`, `kinds.utils.ts`, with the cases of `__tests__/field-view.utils.test.ts` | `artifact/entities/utils/` | Imports; tests data-driven |
| The bodies of `useArtifact`, `useArtifactItems`, `useArtifactKinds`, `useItem`, `useItemSchema`, `useProjectArtifacts`, `useValueOptions`, `useItemRevisions` | `artifact/entities/hooks/use<Resource>Queries.ts` | Keys from the key factory |
| `mocks/artifact-kinds.fixtures.ts`, `artifact-kinds.handlers.ts`, `artifacts.fixtures.ts`, `mentor-artifacts.fixtures.ts`, `artifact-builder.utils.ts`, `mock-artifacts.store.ts`, `artifacts.handlers.ts`, `__tests__/artifact-kinds.fixtures.test.ts`, `data/content-schemas/*.json` (19 files) | `mocks/artifacts/` | Types from `artifact/entities`; scenario helper; the routes of the workflow definition, if any, stay in `mocks/workflow/` |
| The id prefixes `Artifact`, `Item`, `TraceLink`, `Interrupt`, `Export`, `Session` and `itemId` of `mocks/mock-ids.constants.ts` | `mocks/shared/mock-ids.constants.ts` | None |

Write: one `listProjectItems(projectId, filters)` for the items of a project, which `search`, `traceability` and the mentions of the console each declared apart; the functions and the mock handlers of the endpoints without a mock ([D5](#d5-endpoints-that-the-api-lacks)); `itemRefSchema` moved from `run`; the `.prettierignore` line of the content schema data.

### E2. `workflow`

Endpoints: `GET /workflow/definition`, `GET /runs/{run_id}/state`, `GET /runs/{run_id}/steps/{step_id}/state`.

| Copy | To | What changes |
|---|---|---|
| `nodeKinds`, `definitionNodeSchema`, `definitionEdgeSchema`, `workflowDefinitionSchema`, `workflowStateSchema` of `features/workflow/workflow.types.ts` | `workflow/entities/workflow.types.ts` | Merged with the stages schema of today |
| `definitionSummarySchema` (export templates, link types) of `features/artifacts/artifacts.types.ts` | `workflow/entities/workflow.types.ts` | Part of the definition schema |
| `getWorkflowDefinition`, `getWorkflowState` of `features/workflow/workflow.api.ts` | `workflow/entities/workflow.api.ts` | `listWorkflowStages` reads the stages of the same answer |
| `mocks/workflow-state.handlers.ts` | `mocks/workflow/` | Scenario helper; it reads the artifact fixtures of E1 |

Write: the keys of the definition by version and of the states; one request per version of the definition, read by the stages, the labels and the summary.

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

Endpoints added to those of today: `GET /runs/{run_id}/directives`, `POST /runs/{run_id}/retry`.

| Copy | To | What changes |
|---|---|---|
| The `message_delivered` event of `runEventSchemas` in `features/console/console.types.ts` | `run/entities/types/run-events.types.ts` | None |
| `features/workflow/step-groups.utils.ts` (`groupSteps`: the steps of one subject together, such as the turns of one interview) and `run-progress.utils.ts` (`runProgress`: the state of each node from the steps), with the cases of their tests | `run/entities/utils/` | `WorkflowStep` and `WorkflowRun` become `RunStep` and `Run` |
| `retryFromStep` of `features/workflow/workflow.api.ts` | `run/entities/runs.api.ts` | Imports |
| `shared/components/run-config/run-config.types.ts` and `run-form.utils.ts`, with the cases of `run-form.utils.test.ts` | `run/entities/` | Imports; tests data-driven |

Write: the directives with their mock; the fields of RunDefaults with the shared form components, reading `RunConfigFields.tsx` of the branch. `groupSteps` and `runProgress` are what the tree of the steps of Activity reads.

### E5. `review`

Endpoints: `GET /runs/{run_id}/interrupts`, `POST /runs/{run_id}/resume`.

| Copy | To | What changes |
|---|---|---|
| `optionSchema`, `answerSchema`, `questionTypes`, `questionSchema`, `interruptSchema`, `ResumeBody`, `reviewedItemSchema`, `resumedRunSchema` of `features/review/review.types.ts` | `review/entities/review.types.ts` | `pendingReviewSchema` of the console merges into `interruptSchema` |
| `resumeRun`, `listReviewedItems` of `features/review/review.api.ts` | `review/entities/` | Imports |
| `mocks/interrupts.handlers.ts` | `mocks/interrupts/` | Scenario helper |

Write: the pending interrupt with `fetchPage`, keys, hooks.

### E6. `thread`

Endpoints added: `GET /threads/{thread_id}/messages`, `PATCH`, `DELETE /threads/{thread_id}`. Thread and Message are here already, newer than on the branch.

| Copy | To | What changes |
|---|---|---|
| `mocks/messages.fixtures.ts` | `mocks/messages/` | Types from `thread/entities` |

Write: the list of messages and its handler, the changes of a thread with their handlers.

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
| `mocks/account.fixtures.ts`, `account.handlers.ts` | `mocks/account/` | Scenario helper |

Write: keys in `userKeys`, hooks. The hooks of the branch (`useAccountQueries.ts`) write their keys by hand and mix queries with mutations, so they are not copied.

### E9. `usage`

Endpoint: `GET /me/usage` with `?group_by=`.

| Copy | To | What changes |
|---|---|---|
| `usageGroups`, `usageGroupLabels`, `usageSchema` of `features/settings/settings.types.ts`; `getUsage` of `settings.api.ts` | `usage/entities/` | Merged with the usage of the month of today |

### Not copied

The components, the frame configs and the pages of every feature; the console model (`event-log.utils.ts`, `input.utils.ts`, `commands.constants.ts`, `command-history.store.ts`), whose slash commands option D replaces; the settings hooks and sections. Pure helpers of the screens are copied with their screen in [section 8](#8-screens).

## 7. The frame

The changes of [D4](#d4-the-frame-stays-generic), all in R1:

1. Done, in R1: `Workspace` with `tabGroup` and `TabGroupContext`, instead of `ProjectWorkspace` and `projectTabGroup`.
2. Done, in R1: the description of the command palette without a product object.
3. Done, in R1: `homeHref` given by the layout.
4. Done, in R1: the items of the activity bar are destinations.

Check after the PR: no object of the product in the code or the words of the frame (`grep -rniE "project|thread|artifact|review" src/shared/components/frame`, comments aside; the frame uses `item` and `run` for its own bar items and commands), and the Settings feature shows on a screen outside a project, where `PageWorkspace` holds its side panel.

## 8. Screens

After the entities, one screen at a time, each drawn first from the skeletons of option D, then built. The order follows what links to what: the review bar sits in a document, and Activity links to documents and items.

| # | Screen | Module of the screen | Features | Copy with the screen |
|---|---|---|---|---|
| S1 | Documents: the side panel of documents with the outline, the document tab, the item page and peek | `artifact` | `edit`, `restore`, export | None |
| S2 | Activity: the tree of the stages in the side panel, the chat in a tab, the review bar of a document | `activity`, `review` | `thread/features/send-message`, `review/features/answer`, `run/features/stop` | `features/review/review-form.utils.ts` to `review/features/answer` |
| S3 | Search, in its side panel and in the command palette | `artifact` | None | None |
| S4 | Trace: the matrix, the gaps and issues | `trace-link` | Creating and removing a link | `features/traceability/matrix-filter.utils.ts` |
| S5 | Settings, both scopes | `settings` | The saves of `user`, `project` and `llm-model` | None |
| S6 | Workflow, in the developer view: the graph of a run, its steps and its state | `run` | `run/features/retry` | `features/workflow/graph-layout.utils.ts` to `run/widgets/graph` |

The features of each screen are those of section 6 of Web App Modules; a screen adds its route, its feature item in `<feature>-frame.config.tsx` and its entry in the layout.

## 9. PR sequence

Branch names are `<type>/fe/<name>`.

| # | Branch | PR title | Depends on |
|---|---|---|---|
| R1 | `refactor/fe/modules` | `refactor(frontend): divide the code by module` ([D6](#d6-the-current-branch)) | P6 |
| P7 | `feat/fe/threads` | `feat(frontend): read the threads of a project and show the run in the status bar` | R1 |
| C1 | `refactor/fe/placement` | `refactor(frontend): place the run events, the run defaults and the project streams in their modules` | P7 |
| P2 | `docs/fe/api-fields` | `docs(api): add the fields that the screens read` | none |
| E1 | `feat/fe/artifact-entities` | `feat(frontend): read and change artifacts and items` | P7 |
| E2 | `feat/fe/workflow-entities` | `feat(frontend): read the workflow definition and the state of a run` | E1 |
| E3 | `feat/fe/trace-link-entities` | `feat(frontend): read and change the trace links` | E2 |
| E4 | `feat/fe/run-entities` | `feat(frontend): add the directives, the retry and the run config to the runs` | C1, E1 |
| E5 | `feat/fe/review-entities` | `feat(frontend): read the interrupts of a run and answer them` | E4 |
| E6 | `feat/fe/thread-entities` | `feat(frontend): read the messages of a thread and change a thread` | E1 |
| E7 | `feat/fe/model-entities` | `feat(frontend): read the model catalog and the model choices` | P7 |
| E8 | `feat/fe/user-entities` | `feat(frontend): read and change the profile, the sessions and the settings of the user` | C1 |
| E9 | `feat/fe/usage-entities` | `feat(frontend): read the usage of the user by group` | P7 |
| S1 to S6 | `feat/fe/<screen>` | One per screen of [section 8](#8-screens) | Their entities |

E6, E7, E8 and E9 do not depend on the row above them: E7 and E9 can go at any time after P7, E6 after E1, E8 after C1.

For every PR: a branch from `origin/main`; copy the files of its row from `feat/fe/mock` with `git show feat/fe/mock:<path>`, then apply the changes of its row; run the checks one at a time (typecheck, lint of the changed files, tests of the touched folders; the full test run before opening); search the diff for a non-ASCII character in prose and a leftover `console.log`; one-line Conventional Commits message, no AI attribution; open as a draft.

## 10. Open points

| Point | Options | Leaning |
|---|---|---|
| Settings in Usability | Option D shows the user settings behind the gear of the activity bar; [D3](#d3-settings) puts both scopes in the Settings feature | Update section 5.1 and the skeletons of option D |
| Projects in the command palette | Usability lets the palette find projects by name; `GET /projects` has no text filter | Filter the loaded list, or add `q` to the API |
| `docs/fe/api-fields` | Merge before E1, whose fields it may add | Merge first |

## 11. Checklist

- [x] D6 decided: R1 then P7
- [ ] R1 cut and opened
- [ ] P7 opened
- [ ] C1 cleanup merged
- [ ] P2 API docs merged
- [ ] E1 artifact entities merged
- [ ] E2 workflow entities merged
- [ ] E3 trace-link entities merged
- [ ] E4 run entities merged
- [ ] E5 review entities merged
- [ ] E6 thread entities merged
- [ ] E7 model entities merged
- [ ] E8 user entities merged
- [ ] E9 usage entities merged
- [ ] Usability updated for Settings, and the screens drawn
- [ ] S1 to S6 merged
- [ ] `feat/fe/mock` holds nothing left to copy; then delete it
