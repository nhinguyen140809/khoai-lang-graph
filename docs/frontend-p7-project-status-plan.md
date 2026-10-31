# P7 project status: plan

Draft of 2026-10-31, for an agent to implement. Not committed. Next PR after E6 (`feat/fe/thread-entities`, draft #45), written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md).

Short paths: `project/widgets/status/...` is `frontend/src/modules/project/widgets/status/...`, `run/features/stop/...` is `frontend/src/modules/run/features/stop/...`, `mocks/...` is `frontend/src/mocks/...`, `test/...` is `frontend/src/test/...`; any other path that starts with `modules/` or `shared/` is under `frontend/src/`. "The backup" is `origin/feat/fe/artifacts-backup` (commit `d8dd52e`, the same as `refs/backup/feat-fe-threads-2026-10-20-placed`); read a file with `git show origin/feat/fe/artifacts-backup:frontend/src/<path>`.

## Contents

- [1. Row in the PR table](#1-row-in-the-pr-table)
- [2. What was read](#2-what-was-read)
- [3. Decisions](#3-decisions)
- [4. Scope](#4-scope)
- [5. Naming](#5-naming)
- [6. Shared code first](#6-shared-code-first)
- [7. Changes to existing modules](#7-changes-to-existing-modules)
- [8. The slices, file by file](#8-the-slices-file-by-file)
- [9. State and data flow](#9-state-and-data-flow)
- [10. Screen states and words](#10-screen-states-and-words)
- [11. Mocks and screenshots](#11-mocks-and-screenshots)
- [12. Tests](#12-tests)
- [13. Docs to update](#13-docs-to-update)
- [14. Left for the next PRs](#14-left-for-the-next-prs)
- [15. Commits and checks](#15-commits-and-checks)
- [16. Checklist](#16-checklist)

## 1. Row in the PR table

| Item | Value |
|---|---|
| Branch | `feat/fe/project-status`, from `origin/main` once E6 (#45), the maintenance PR of `refactor/fe/review-and-slice-files` and the PR of `feat/fe/highlight-and-text-helpers` are merged |
| PR title | `feat(frontend): show the run of a project in the status bar, and stop it` |
| Needs | E0 (#37, stages and their titles), E4 (#42, the runs, `useLatestRun`, `cancelRun`, `runEventsUrl`, the run status looks), E5 (#43), E6 (#45, `useProjectThreads`, `latest_run_status`), and the maintenance PR #46 (`refactor/fe/review-and-slice-files`, decision 1), which lets a lone component or hook sit at the root of its slice, and #47 (`feat/fe/highlight-and-text-helpers`, stacked on #46, decision 9), for `useWording` |
| After it | B1 (`feat/fe/monthly-budget`, the budget of the month in the status bar, with the reload of the costs at the events of the streams); S2 (the chat), whose pill link this PR already points to |
| Docs first | No gap in the API: `POST /runs/{run_id}/cancel`, `GET /runs/{run_id}/stream` with `?after=`, the threads of a project with `latest_run_status`, and open point 8 (one stream per unfinished run, the threads read again at each event that changes a status) describe all that P7 does. Two doc fixes go in commit 7: Web App Modules section 9 places the status "on the top bar", which is the status bar; section 5 lacks the links that P7 adds. The open gap of E5 (the pending interrupt set to `cancelled` when its run is cancelled) stays with the user on `docs/fe/api-fields`; the mock does not change for it |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| [Frontend implementation plan](frontend-implementation-plan.md), D8 and row P7 | The parts of the backup that P7 takes: `useProjectRunResult`, `ProjectRunResult` and `project-run-result.utils`, `useRunStatusStream`, `ProjectRunStreams`, `project/widgets/status`, Stop (`run/features/stop`), `coalescedTask`, the EventSource of the unit tests, the screenshot data of the status; and what goes to B1 instead (`shared/lib/cost`, `query-meta.utils`, the reload of the costs) |
| [E6 plan](frontend-e6-thread-plan.md), decisions 6 and 7 | `threadsByAttention` and `thread/entities/@x/project` wait for P7; `useProjectThreads` does not poll, the status reloads it at the events of the run streams |
| [Usability](ui/usability.md), D1, sections 5.2 and the frame table | The status is on every screen of a project, in user words, "Working: Interviewing", "Waiting for you: Analysis review", with Stop; the pill opens the chat of Activity; Open review, Try again and the notification of a review come with their screens |
| [Web App](architecture/web-app.md), section 3 "Visible stages" | An internal stage shows the title of the previous stage that is not; the review stages are stages, so "Analysis review" is the title of the stage the run waits at |
| [Web App Modules](architecture/web-app-modules.md), sections 2, 5, 6 and 9 | `project` holds "the run that its status shows, the streams of its runs"; `project/widgets/status` reads `project`, `thread`, `run`, and Stop of `run/features/stop`; a widget adds no rule |
| `docs/API.md`, Runs, section 6 and open point 8 | Cancel answers 202 and 409 `invalid_state` for a run that has ended; the stream sends `id` = sequence, `?after=` resumes, `done` ends it; one stream per unfinished run |
| `frontend/CONTRIBUTING.md` | Dialogs opened from several places use `createPendingActionStore` ("The Stop dialog of the status works the same way"); destructive actions ask with `ConfirmDialog`, and only the `*Dialog.tsx` calls `useStop*`; words in `constants`; logic out of components |
| `main` after E6: `run/entities` | `runStatusLook` (tone, icon, `needsUser`) and `runStatusLabel` in `status/`, not exported for the look; `useLatestRun(threadId, options)` polls every 3 s while unfinished; `runKeys.latestOfThread`; `runEventsUrl(runId, after: string \| null)`; `cancelRun` |
| `main`: `workflow/entities` | `useStageTitle(version, stage)`, the visible title of a stage, `undefined` while loading |
| `main`: `shared/components/frame` | `useStatusBarItem`, `StatusBarSide`, `useCommands`; `Workbench` mounts the `contributions` of a layout |
| `main`: `mocks/runs`, `mocks/shared/scenario` | Cancel already changes the run to `cancelled`; `?mock-run-status=running|waiting|failed|done`; `?mock-runs=empty` leaves the thread without a run; the stream mock runs in the browser only |
| The backup, files listed in section 4 | The code to copy, read with Clean Review: the changes of each copy are in section 4 |

## 3. Decisions

1. **A lone component or hook sits at the root of its slice; the maintenance PR that allows it comes first.** The user decided (2026-10-31): the slices under `features/` and `widgets/` are named after what they do or show (`stop`, `status`), never after a kind of file, and inside a slice `components/` and `hooks/` hold two files or more, while a lone component or hook stays at the root, as a lone `types` or `utils` file does ([prompt: Folders inside a feature or a widget](prompt-create-frontend-feature-plan.md#folders-inside-a-feature-or-a-widget)). Today CONTRIBUTING and ESLint ask for `components/` and `hooks/` even for one file, and 19 slices hold such a folder with a single file. The change is maintenance, so it does not go in this PR: three commits go on the branch of the review cleanup (`refactor/fe/review-cleanup`, six commits, not pushed), renamed `refactor/fe/review-and-slice-files`, whose PR merges after E6 (#45):

   | Item | Value |
   |---|---|
   | Branch | `refactor/fe/review-and-slice-files` (renamed from `refactor/fe/review-cleanup`) |
   | PR title | `refactor(frontend): tidy the review entity and its mock, and keep a lone component or hook at the root of its slice` |
   | Commit 7 | `docs(frontend): keep a lone component or hook at the root of its slice`: CONTRIBUTING (Inside a slice, Hooks of a slice, Files of a slice) and Web App Modules section 3 |
   | Commit 8 | `build(frontend): allow a component or a hook at the root of a feature or a widget`: in `lint/configs/file-names.js` and `lint/lib/file-names/`, `use<Pascal>.ts` at the root of a slice of `src/modules/*/@(features|widgets)/`, and `use<Pascal>.@(test|data).ts` in the `__tests__/` at its root; the folders at the root of a slice stay the same |
   | Commit 9 | `refactor(frontend): move the lone components and hooks of the features and the widgets to the root of their slices`: `git mv` of the 19 files and of their tests, with the imports that follow |

   In P7, `run/features/stop` has two components and three hooks, so both folders stay; `project/widgets/status` has two components in `components/` and no hook.

2. **The run that the status shows comes from the entities.** Which thread needs the user most is a reading rule of the threads, so `threadsByAttention` goes to `thread/entities/threads.utils.ts`, from the backup, unchanged but for imports: the threads by the place of the status of their latest run in `runStatusesByAttention`, the threads without a run last, ties in the order of the list. `useProjectRunResult(projectId)` and its `ProjectRunResult` union go to `project/entities`, as Web App Modules section 6 says; it reads the loaded pages of `useProjectThreads` with `pageItems` (every thread of a project fits the first page of 50 today), and the latest run of the first thread with `useLatestRun(thread?.id ?? '', { isEnabled: thread !== undefined })`. `shownRun(projectRunResult)` gives the run or null.

3. **The stage of a run is read in the run entity; the widget only writes `label: stage`.** A queued run has no stage yet and a run that succeeded needs none: `hasStageName(status)` goes to `run/entities/status/run-status.utils.ts` (the backup called it `showsStage`, in a file that has since split). Which title the status shows is a reading rule of the run too, so `useRunStageTitle(run: Pick<Run, 'status' | 'workflow_version' | 'current_stage'> | null)` goes to `run/entities/runs/hooks/useRunStageTitle.ts`, in the topic `runs`, since it reads `current_stage` and `workflow_version`, fields of the run, and `runs` may read `status` (the topic `status` may read no other topic); it calls `useStageTitle(run?.workflow_version, run !== null && hasStageName(run.status) ? run.current_stage : null)` and gives the title, or `undefined` without a stage or while the definition loads. The entities of `run` read `workflow` through `@x/run`, so `workflow/entities/@x/run.ts` exports `useStageTitle`. The widget calls `useRunStageTitle(run)` and joins the title to the label; it does not read `hasStageName` or `useStageTitle` itself.

4. **The status follows one stream per unfinished run, as open point 8 of the API says; the stream of a run is a part of the run entity, and the project adds only the reload of its threads.** The `useRunStatusStream` of the backup mixes both, so it is split, without the costs:
   - the events after which a status or a stage may differ, `runStatusEvents` (`node_start`, `node_end`, `interrupt`, `error`, `done`), go to a new `run/entities/events/run-events.constants.ts`, with `streamReopenMs` (5 s); `runCostEvents` and `holdsCost` go to B1;
   - `useRunStatusEvents(run, onReloaded)` goes to `run/entities/events/hooks/useRunStatusEvents.ts`: it opens the stream after `last_event_id` of the run as loaded (`runEventsUrl(runId, String(lastEventId))`, or `null` before the run has loaded), loads `runKeys.latestOfThread` again at each event of `runStatusEvents`, then calls `onReloaded(run)` with the run that loaded; the loads of a burst share one, through `coalescedTask`; it closes after `done`, and opens again `streamReopenMs` after a connection that failed for good; once the cleanup has closed the stream, a load still in progress calls no `onReloaded` (an `isClosed` flag of the effect). `run/entities/@x/project.ts` exports it instead of `runEventsUrl`, `runKeys` and `runStatusEvents`;
   - the threads, their cache and the status that each one shows belong to the thread entity, so two parts go to the thread entity, and `thread/entities/@x/project.ts` exports them. A `*.utils.ts` file holds pure helpers only (CONTRIBUTING; the ESLint group `queriesInUtils` of commit 1 checks it), so the part that reads and reloads the cache is a hook of the threads in `hooks/useThreadQueries.ts`, and the pure one goes beside `threadsByAttention` in `threads.utils.ts`:
     - `useReloadThreadsIfRunStatusChanged()` in `thread/entities/hooks/useThreadQueries.ts`, beside `useProjectThreads`: gives a function of a run, stable for one query client, that reads the threads of `run.project_id` in the cache (an infinite query, read with `pageItems`), and loads them again when the thread of the run shows another status than `run.status`; nothing when the threads are not in the cache;
     - `threadsWithUnfinishedRun(threads)` in `thread/entities/threads.utils.ts`: the threads whose `latest_run_status` is unfinished;
     - the thread entity reads `type Run` and `isUnfinishedRunStatus` through `run/entities/@x/thread.ts`, which is allowed since `thread` sits above `run`;
   - `useProjectRunStream(run)` (the `useRunStatusStream` of the backup, renamed so that its name says it is the stream of the project) stays in `project/entities` and only connects the two: `useRunStatusEvents(run, useReloadThreadsIfRunStatusChanged())`. It reads no cache of the threads and no `threadKeys`;
   - `ProjectRunStreams` stays in `project/entities` and opens one stream for each thread of `threadsWithUnfinishedRun(pageItems(threads.data))`; it calls no `isUnfinishedRunStatus` itself;
   - `useRunStream` (the reducer of the chat) keeps its own listeners and its own end; both hooks call `runEventsUrl`, and nothing else of theirs is the same;
   - the polling of `useLatestRun` (3 s while unfinished, E4) stays: it keeps the status right between two events and while a stream opens again.

5. **Stop is a pending action, mounted once beside the status.** CONTRIBUTING asks for the pattern of Rename and Delete, so the store of the backup (`stop-run.store.ts` with `ask` and `close`) is not copied: `useStopRunDialogStore = createPendingActionStore()`, opened with `useOpenStopRunDialog()(runId)` by the button and by the palette. `StopRunDialog` reads `useStopRunDialog()` and is mounted once by `ProjectRunStatusItem`, in place (outside the content of the status bar), so that it stays while the status changes under it. `useStopRun` loads again every query after the cancel, since the status of a run counts in the threads, the projects and the interrupts, which are modules above `run` whose keys a feature of `run` cannot name; `mutateAsync` settles once they have loaded, so the dialog closes when the status shows the run stopped. `stoppableRun(run)` (the run while it has not finished, else null) stays in the feature, as Web App Modules section 2 says of "which run Stop stops", and only the feature calls it:
   - `StopRunButton` takes `run: Run | null` and renders nothing when `stoppableRun(run)` is null, so the widget passes the run it shows and decides nothing;
   - the palette command is a part of the action, so `useStopRunCommand(run: Run | null)` goes to `run/features/stop/hooks/useStopRunCommand.ts`: it registers `run.stop` (label `stopRunMessages.stopRun`, group `stopRunMessages.commandGroup`, `SquareIcon`, variant `destructive`) while the run is stoppable, and opens the dialog. The widget reads `const projectRunResult = useProjectRunResult(projectId)` and calls `useStopRunCommand(shownRun(projectRunResult))`.

6. **The badge and the pill are two components over one config of the run entity; each chooses only its fill and its size.** The badge of the table (`RunStatusBadge`, `run/entities`) and the pill of the status bar (`RunStatusPill`, the widget) differ in layout, so they stay two components. What they show is the same, so neither reads the look and the label on its own:
   - `useRunStatusLook(status: RunStatus | null)` goes to `run/entities/status/hooks/useRunStatusLook.ts` and gives `{ tone, icon, needsUser, label }`: the look of `runStatusLook(status)` and the label of `runStatusLabel(status)` in the view of the app, through `useWording`. It is exported from `run/entities/index.ts`. The words of the statuses are already on `main` and P7 adds none: `runStatusLabels` and `noRunLabel` in `run/entities/status/run-status.constants.ts`, one word per view ("Working" and "Waiting for you" for a user, "Running" and "Waiting for review" for a developer; "Not started" or "No run yet" without a run). The widget holds only its own words (`projectRunStatusMessages`: loading, failed, retry), and Stop its own (`stopRunMessages`);
   - `RunStatusBadge` reads it and keeps its soft fill and the size of a table row;
   - `RunStatusPill` reads it and `useRunStageTitle(run)` (decision 3), and chooses a solid fill when `needsUser` (waiting for review, failed) and a soft fill otherwise. Its classes (`h-6`, `rounded-md`, `text-sm`, the icon size) stay in `StatusPill` inside `ProjectRunStatus.tsx`, which also shows the loading state;
   - the look holds no fill and no size: they are what each component varies. No class constant, no new tone.

7. **The status bar item registers from a layout.** `ProjectRunStatusItem` is mounted in the `contributions` of the `Workbench` of a found project in `app/(project)/projects/[projectId]/layout.tsx`, after `ProjectDialogs`; it registers `ProjectRunStatus` on the left side, mounts `ProjectRunStreams` and `StopRunDialog`, and calls `useStopRunCommand(shownRun(projectRunResult))` of the feature, with `projectRunResult` from `useProjectRunResult(projectId)`. The project that is not found shows no status.

8. **Not copied from the backup**, each with its reason:

   | Not copied | Why |
   |---|---|
   | `ThreadStatusList`, `threadTitles` | A project has one thread; the list repeats the status. It comes with the screen of a project with several threads |
   | `stop-run.store.ts`, `useStopRunDialog` with `ask` and `close` | Decision 5: the pending action store of CONTRIBUTING |
   | `StopRunCommand` (a component that renders null, in the widget) | A hook of the feature, `useStopRunCommand(run)` (decision 5): logic stays out of components, and the command is a part of the action |
   | `showsStage`, `useRunStageLabel` | Decision 3: `hasStageName` and `useRunStageTitle` in `status/`; the widget joins the title to the label |
   | `runCostEvents`, `holdsCost`, `query-meta.utils`, `useRunCost`, `shared/lib/cost`, `CostMeter`, `MonthlyBudgetItem` | B1, as D8 says; `useRunCost` is kept for B1 |
   | `runKeys.latestRun` | Renamed `runKeys.latestOfThread` on `main` (E4) |
   | The activity chat of the backup (`ActivityPage`, `RunEntry`, ...) | Not merged (D8); S2 rebuilds the chat |

9. **The helpers of `feat/fe/highlight-and-text-helpers` merge before P7, and P7 uses them as they are.** The branch (draft #47, stacked on #46, 11 commits) holds small shared helpers and UI components built ahead of the screens. P7 reads one of them: `useWording(wording)` of `@/shared/lib/view`, which gives the words of a value in the view of the app; `RunStatusPill` calls `useWording(runStatusLabel(status))` instead of `useView()` with `runStatusLabel(status)[view]`, as `RunStatusBadge` and `ProjectRunCell` do on that branch. The branch is a feature PR of its own (UI components and helpers, with the design system page), so it is not picked into P7: its PR merges after #45 and the maintenance PR, and P7 starts after it. Order: #45, `refactor/fe/review-and-slice-files`, `feat/fe/highlight-and-text-helpers`, P7.

   The branch and #45 both add `shared/lib/collections/group.utils.ts`: `groupBy` there, `newestOfEachGroup` in #45, and both change the `collections/` row of the shared code table of CONTRIBUTING. The branch merges second, so it resolves them when it rebases on `main`: one `group.utils.ts` with both functions and both their tests, one line in the index, one row that lists both. The other helpers of the branch (`CopyButton`, `RelativeTime`, `Highlight`, `DiffView`, `KeyText`, `FloatingSurface`, `useClipboard`, `wordDiff`, `rangesOfQuery`, `jsonToPlainText`) are not read by P7; section 14 lists where they go.

## 4. Scope

Endpoints called: `GET /projects/{project_id}/threads`, `GET /threads/{thread_id}/runs?limit=1` (the latest run), `GET /workflow/definition?version=` (the stage titles), `GET /runs/{run_id}/stream?after=`, `POST /runs/{run_id}/cancel`. All have their API function, key and hook on `main`.

| Copy from the backup | To | What changes |
|---|---|---|
| `thread/entities/threads.utils.ts` (`threadsByAttention`) | `thread/entities/threads.utils.ts` | `runStatusesByAttention` from `@x/thread`; `Thread` from `./types/threads.types` |
| `thread/entities/@x/project.ts` | same | `useProjectThreads` and `useReloadThreadsIfRunStatusChanged` from `../hooks/useThreadQueries`, `threadsByAttention`, `threadsWithUnfinishedRun` from `../threads.utils`, `type Thread` from `../types/threads.types` (`ProjectRunResult` holds the threads); no `threadKeys`, since `project` no longer reads the cache of the threads |
| `project/entities/types/project-run.types.ts`, `utils/project-run.utils.ts` | `project/entities/run-status/project-run-result.types.ts`, `project-run-result.utils.ts` | Imports from `@x/project` of `run` and `thread` |
| `project/entities/hooks/useProjectRunQueries.ts` | `project/entities/run-status/hooks/useProjectRunResult.ts` | `pageItems(threads.data)`; `useLatestRun(thread?.id ?? '', { isEnabled: thread !== undefined })` |
| `project/entities/hooks/useRunStatusStream.ts`, `constants/run-status-stream.constants.ts` | `run/entities/events/hooks/useRunStatusEvents.ts`, `run/entities/events/run-events.constants.ts` (`streamReopenMs`), and `project/entities/run-status/hooks/useProjectRunStream.ts` | Split as decision 4: the stream, the reload of the run and the reopening in `run`; the reload of the threads in `thread` (`useReloadThreadsIfRunStatusChanged`); `project` connects them. No cost reload; `runKeys.latestOfThread`; `runEventsUrl(runId, after)` with a string; `coalescedTask` from `@/shared/lib/timing`; `pageItems` for the threads in the cache (an infinite query) |
| `project/entities/components/ProjectRunStreams.tsx` | same | `threadsWithUnfinishedRun` of the thread entity instead of its own filter |
| `shared/lib/coalesced-task.utils.ts` | `shared/lib/timing/coalesced-task.utils.ts` | Exported from `@/shared/lib/timing` |
| `test/event-source.utils.ts`, the lines of `vitest.setup.ts` | `test/event-source/event-source.utils.ts` with `index.ts`; `test/vitest.setup.ts` | Imported from `@/test/event-source` |
| `run/features/stop/*` | `run/features/stop/`, as in section 8 | Decision 5; `errorMessageOf` from `@/shared/api/error`; `StopRunDialog.tsx` a file of its own |
| `project/widgets/status/*` | `project/widgets/status/`, as in section 8 | Decisions 3, 5, 6 and 7; `routes` from `@/shared/routes`; the palette command moves to the feature |
| The status cases of `tests/screenshots/projects/project.data.ts` | `tests/screenshots/projects/project.spec.ts` | The scenarios of section 11, in the shape of the spec on `main` |

Written new: `hasStageName`, `useRunStageTitle`, `useRunStatusLook`; `runStatusEvents`; `useRunStatusEvents`; `useReloadThreadsIfRunStatusChanged`, `threadsWithUnfinishedRun`; the ESLint group `queriesInUtils`; the `@x/project` additions of `run`, `runStatusesByAttention` in `@x/thread`, `useStageTitle` in `@x/run` of `workflow`; `useStopRunCommand`; the scenario `cancel-run` of the cancel handler; the tests of `useProjectRunResult`.

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Feature slice | The action | `run/features/stop` |
| Widget slice | The block | `project/widgets/status` |
| Mutation hook | `use<Verb><Object>` | `useStopRun` |
| Dialog | `<Verb><Object>Dialog` | `StopRunDialog` |
| Button | `<Verb><Object>Button` | `StopRunButton` |
| Dialog store | `<topic>.store.ts`, `use<Topic>Store` | `stop-run-dialog.store.ts`, `useStopRunDialogStore` |
| Hooks of the store | `useOpen<Action>Dialog`, `use<Action>Dialog`, in `useOpen<Action>Dialog.ts` | `useOpenStopRunDialog`, `useStopRunDialog` |
| Rule of the action | What it gives | `stoppableRun` in `stop-run.utils.ts` |
| Words of the action | `<topic>Messages` | `stopRunMessages` in `stop-run.constants.ts` |
| Item of the status bar | `...Item` | `ProjectRunStatusItem` |
| Content of the item | `<Object><Block>` | `ProjectRunStatus` (with `StatusLink`, `RunStatusPill`, `StatusPill` inside its file) |
| Palette command | Hook `use<Verb><Object>Command` in the feature of the action, id `<module>.<action>` | `useStopRunCommand`, `run.stop`, group `stopRunMessages.commandGroup` (`Run`) |
| Words of the block | `<topic>Messages` | `projectRunStatusMessages` in `project-run-status.constants.ts` |
| The run the status shows | Hook that combines queries, a union by `state` | `useProjectRunResult` in `useProjectRunResult.ts`, `ProjectRunResult`, `shownRun` |
| The streams | `use<Object><What>Events` in the entity of the object; `use<What>Stream` and `...Streams` in the module that adds a rule | `useRunStatusEvents` (run), `useProjectRunStream`, `ProjectRunStreams` (project) |
| What a value shows, read by each of its components | `use<Value>Look` in the entity: the look with its label | `useRunStatusLook` |
| The stage title of a run | `useRun<What>` in the entity | `useRunStageTitle` |
| Rules of the entities | What they give | `threadsByAttention`, `hasStageName`, `runStatusEvents` |
| Shared helper | What it gives | `coalescedTask` |
| Test stand-in | What it stands for | `EventSourceStub`, `openedEventSources`, `resetEventSources` |

## 6. Shared code first

| Reuse | From | For |
|---|---|---|
| `useStatusBarItem`, `StatusBarSide` | `@/shared/components/frame` | The status on the left of the status bar |
| `useCommands` | `@/shared/components/frame` | Stop run in the palette |
| `createPendingActionStore`, `useSetPendingAction`, `usePendingAction` | `@/shared/lib/pending-action` | The Stop dialog, opened from the button and the palette |
| `ConfirmDialog` | `shared/components/ui/confirm-dialog.tsx` | Stop asks first; the dialog stays open until `mutateAsync` settles |
| `Badge`, `Button`, `Spinner`, `Tooltip` | `shared/components/ui/` | The pill, Stop, the loading state, the error of a failed run |
| `Tone` | `@/shared/lib/tone` | The props of `StatusPill` |
| `useWording` | `@/shared/lib/view`, from `feat/fe/highlight-and-text-helpers` (decision 9) | The label of a run status in the view of the app |
| `routes.project(id).activity()` | `@/shared/routes` | The pill opens the activity |
| `errorMessageOf` | `@/shared/api/error` | The toast of a failed Stop |
| `pageItems` | `@/shared/api/query-client` | The loaded threads of an infinite query |
| `RunStatusBadge`, `runStatusLook`, `runStatusLabel`, `isUnfinishedRunStatus`, `useLatestRun`, `cancelRun`, `runKeys`, `runEventsUrl` | `run/entities` (index or `@x/project`) | The look and the label (read by `useRunStatusLook`), the rule of an unfinished run, the latest run, the cancel, the stream |
| `useStageTitle` | `workflow/entities`, through `@x/run` | The title of the stage, read by `useRunStageTitle` |
| `itAsksBeforeAction`, `itToastsOnResult`, `renderWithProviders`, `expectNoAccessibilityViolations` | `@/test/suites`, `@/test/render`, `@/test/steps` | The tests of Stop and of the status |

| Extract before new code | Path | Why |
|---|---|---|
| `coalescedTask` | `shared/lib/timing/coalesced-task.utils.ts`, with its test from the backup | Free of the product; a timing helper beside `debounce`, which B1 also calls for the costs |
| `EventSourceStub`, `openedEventSources`, `resetEventSources` | `test/event-source/event-source.utils.ts`, `test/event-source/index.ts` | jsdom has no `EventSource`; every test of a stream needs it, and `test/` holds a folder per topic |
| `renderWorkbench(contributions)`, with `rerenderContributions`; the steps `statusBar()` and `openCommandPalette()` | `test/render/render-workbench.utils.ts`, exported from `@/test/render`; `test/steps/frame.utils.ts`, exported from `@/test/steps` | The tests of Stop in the palette and of the status bar item both render `Workbench` with what a slice contributes; every later item of the status bar, command or dialog of a layout is tested the same way |

| Checked, not extracted | Why |
|---|---|
| `StatusPill`, the larger badge of the status bar | One user: the budget of B1 shows a `CostMeter`, not a pill. It moves to `shared/components/frame/bars/` when a second item of the status bar shows a pill |
| Opening the stream of a run (`new EventSource(runEventsUrl(...))` with its listeners) | Both hooks are in `run/entities/events` (decision 4), but `useRunStream` (the reducer of the chat) and `useRunStatusEvents` (reloads) differ in their listeners, their start and their end; they share `runEventsUrl` only |
| A config shared by the badge and the pill | Not shared code: they show a value of the run, so `useRunStatusLook` sits in the run entity (decision 6) |
| The pending, error and success states of the status | `LoadingState` and `ErrorState` of `@/shared/components/state` fill a page or a panel; the status bar needs one line, so the states stay in `ProjectRunStatus` |
| The order of the items on the left of the status bar | `ProjectRunStatusItem` registers with `order` 0 (the default); B1 registers the budget with `order: 1`, after it |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `project/entities/projects.api.ts`, `projects.keys.ts`, `projects.types.ts`, `projects.utils.ts`, `projects.constants.ts`, `hooks/useProjectQueries.ts` and their tests | `git mv` to the topic `projects/`, since P7 adds the topic `run-status/`: the run of a project changes for other reasons than the projects, and the two read nothing of each other | 2 |
| `lint/lib/file-names/file-kinds.constants.js` and the lint tests that took `project` as a module without topics | `project: { projects: [], 'run-status': [] }` in `topicEntityModules`; the tests take `thread` instead | 1 |
| `run/entities/status/run-status.utils.ts` | `hasStageName(status)` | 3 |
| `run/entities/status/hooks/useRunStatusLook.ts`, `run/entities/runs/hooks/useRunStageTitle.ts` (new) | Decisions 6 and 3 | 3 |
| `run/entities/components/RunStatusBadge.tsx` | Reads `useRunStatusLook` | 3 |
| `workflow/entities/@x/run.ts` | Adds `useStageTitle` | 3 |
| `run/entities/events/hooks/useRunStatusEvents.ts` (new) | Decision 4 | 4 |
| `run/entities/events/run-events.constants.ts` (new) | `runStatusEvents`, `satisfies readonly RunEventType[]` | 3 |
| `run/entities/index.ts` | Exports `useRunStatusLook`, `useRunStageTitle`; `runStatusLook`, `hasStageName` and `runStatusEvents` stay inside the entity, since no module outside it reads them | 3 |
| `run/entities/@x/thread.ts` | Adds `type Run` and `isUnfinishedRunStatus` (`runStatusesByAttention` is there already) | 3 |
| `run/entities/@x/project.ts` | Adds `type Run`, `useLatestRun`, then `useRunStatusEvents` in commit 4 | 3, 4 |
| `thread/entities/threads.utils.ts`, `thread/entities/hooks/useThreadQueries.ts`, `thread/entities/@x/project.ts` | Decision 2; `threadsWithUnfinishedRun` and `useReloadThreadsIfRunStatusChanged` (decision 4) | 3 |
| `lint/lib/syntax/syntax-groups.constants.js`, `lint/configs/syntax.js`, `lint/configs/__tests__/configs.test.js` | The group `queriesInUtils`: a `*.utils.ts` of `src/modules/` imports no `@tanstack/react-query` and no `*.api` module; the helpers that do are hooks | 1 |
| `lint/lib/file-names/file-kinds.constants.js`, `lint/lib/syntax/syntax-groups.constants.js` | The topic `events` of `run` reads `runs` and `status`; a hook named `use...Command` only opens a dialog, so `destructiveActions` lets any file call it | 1 |
| `shared/lib/timing/` | `coalescedTask` and its export | 3 |
| `project/entities/` | `ProjectRunResult`, `shownRun`, `useProjectRunResult`, `useProjectRunStream` (the reload of the threads only), `ProjectRunStreams`; the index exports `ProjectRunStreams`, `useProjectRunResult`, `shownRun`, `type ProjectRunResult` | 4 |
| `test/event-source/`, `test/vitest.setup.ts` | The stand-in, set as `globalThis.EventSource` when absent, and `resetEventSources()` after each test | 4 |
| `mocks/runs/handlers/runs.handlers.ts` | The cancel handler starts with `await answerScenario('cancel-run')` | 5 |
| `app/(project)/projects/[projectId]/layout.tsx` | Mounts `<ProjectRunStatusItem projectId={projectId} />` (decision 7) | 6 |
| `tests/screenshots/projects/project.spec.ts` | The cases of section 11 | 6 |

## 8. The slices, file by file

### The entity parts

```text
modules/
├── run/entities/
│   ├── @x/project.ts               + Run, useLatestRun, useRunStatusEvents
│   ├── @x/thread.ts                + Run, isUnfinishedRunStatus
│   ├── components/RunStatusBadge.tsx    reads useRunStatusLook
│   ├── runs/hooks/useRunStageTitle.ts   new
│   ├── events/
│   │   ├── hooks/useRunStatusEvents.ts  new
│   │   └── run-events.constants.ts      new: runStatusEvents, streamReopenMs
│   └── status/
│       ├── hooks/useRunStatusLook.ts    new
│       └── run-status.utils.ts          + hasStageName
├── workflow/entities/
│   └── @x/run.ts                   + useStageTitle
├── thread/entities/
│   ├── @x/project.ts               Thread, useProjectThreads, useReloadThreadsIfRunStatusChanged, threadsByAttention, threadsWithUnfinishedRun
│   ├── hooks/useThreadQueries.ts   + useReloadThreadsIfRunStatusChanged
│   ├── threads.utils.ts            threadsByAttention, + threadsWithUnfinishedRun
│   └── __tests__/threads.utils.test.ts, threads.utils.data.ts
└── project/entities/
    ├── components/ProjectRunStreams.tsx
    ├── projects/                   the projects, moved in commit 2
    │   ├── hooks/useProjectQueries.ts
    │   └── projects.api.ts, projects.constants.ts, projects.keys.ts, projects.types.ts, projects.utils.ts
    └── run-status/                 new topic
        ├── hooks/useProjectRunResult.ts, useProjectRunStream.ts
        └── project-run-result.types.ts, project-run-result.utils.ts
```

```ts
// run/entities/status/run-status.utils.ts
// A run that has not started has no stage yet, and a run that is done needs none.
const statusesWithoutStage: readonly RunStatus[] = ['queued', 'succeeded']

/** Whether the label of a run status names its stage: where it works, waits, failed or was stopped. */
export function hasStageName(status: RunStatus): boolean {
  return !statusesWithoutStage.includes(status)
}

// run/entities/events/run-events.constants.ts
/**
 * The events of a run after which its status or its stage may differ; the others, such as the
 * text that a step writes, leave them as they are.
 */
export const runStatusEvents = [
  'node_start',
  'node_end',
  'interrupt',
  'error',
  'done',
] as const satisfies readonly RunEventType[]

// run/entities/status/hooks/useRunStatusLook.ts
/**
 * How a run status shows, with its label in the view of the app, or how a project or a thread
 * without a run shows for null. Every component of a run status reads it and chooses only its
 * fill and its size.
 */
export function useRunStatusLook(status: RunStatus | null): RunStatusLook & { label: string }

// run/entities/runs/hooks/useRunStageTitle.ts
/**
 * The title of the stage that the status of a run names; undefined when it names none and while
 * the definition loads.
 */
export function useRunStageTitle(
  run: Pick<Run, 'status' | 'workflow_version' | 'current_stage'> | null,
): string | undefined

// run/entities/events/hooks/useRunStatusEvents.ts
/**
 * Follows the event stream of an unfinished run and loads the run again at each event that may
 * change its status or its stage, then calls `onReloaded` with it.
 */
export function useRunStatusEvents(
  run: Pick<Run, 'id' | 'thread_id' | 'status'> | null | undefined,
  onReloaded: (run: Run) => Promise<void> | void,
)
```

```ts
// project/entities/run-status/project-run-result.types.ts
/**
 * The run that the status of a project shows, null before its first run, with the threads of the
 * project from the one that needs the user most. Not an answer of the API: `useProjectRunResult` builds
 * it from the threads and their latest runs.
 */
export type ProjectRunResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; run: Run | null; threads: Thread[] }

// project/entities/run-status/hooks/useProjectRunResult.ts
/**
 * The status of a project: its threads from the one whose latest run needs the user most, and the
 * latest run of that thread, which the status shows. The streams of the unfinished runs load both
 * again as the runs go on. A status already shown stays when loading it again fails.
 */
export function useProjectRunResult(projectId: string): ProjectRunResult
```

`useRunStatusEvents` keeps the JSDoc of the backup without the sentences on the costs and on the threads; `useReloadThreadsIfRunStatusChanged` says that the threads of the project load again when the status of the run changes; in it, the threads in the cache are an infinite query, so the status that a thread shows is read with `pageItems(queryClient.getQueryData<InfiniteData<ListPage<Thread>>>(threadKeys.ofProject(run.project_id)))`.

```ts
// thread/entities/hooks/useThreadQueries.ts
/**
 * Loads the threads of the project of a run again when the thread of the run shows another status
 * than the run has, such as when the run starts, waits for a review, goes on after it or ends.
 * Nothing when the threads are not loaded.
 */
export function useReloadThreadsIfRunStatusChanged(): (
  run: Pick<Run, 'project_id' | 'thread_id' | 'status'>,
) => Promise<void>

// thread/entities/threads.utils.ts
/** The threads whose latest run has not finished. */
export function threadsWithUnfinishedRun(threads: Thread[]): Thread[]
```

### The feature `run/features/stop`

```text
run/features/stop/
├── index.ts
├── components/
│   ├── StopRunButton.tsx
│   ├── StopRunDialog.tsx
│   └── __tests__/
│       ├── StopRunButton.test.tsx
│       └── StopRunDialog.test.tsx
├── hooks/
│   ├── useStopRun.ts
│   ├── useOpenStopRunDialog.ts
│   ├── useStopRunCommand.ts
│   └── __tests__/useStopRunCommand.test.ts
├── stop-run-dialog.store.ts
├── stop-run.constants.ts
├── stop-run.utils.ts
└── __tests__/
    ├── stop-run.utils.test.ts
    └── stop-run.utils.data.ts
```

| File | Holds | Reuses |
|---|---|---|
| `index.ts` | `StopRunButton`, `StopRunDialog`, `useStopRunCommand` | - |
| `StopRunButton.tsx` | Takes `run: Run \| null` and renders nothing when `stoppableRun(run)` is null; soft destructive `xs` button with `SquareIcon` and "Stop"; opens the dialog for its run; `bg-clip-border` with the comment of the backup | `Button` |
| `StopRunDialog.tsx` | The one dialog of Stop: reads `useStopRunDialog()`, renders nothing without a target, `ConfirmDialog` with `onConfirm={() => stopRun.mutateAsync(targetId)}` and `onCloseAutoFocus` calling `closed` | `ConfirmDialog`, `useStopRun` |
| `useStopRun.ts` | The mutation: `cancelRun`, then `invalidateQueries()` and the toast "Run stopped"; a failure as a toast | `cancelRun`, `errorMessageOf` |
| `useOpenStopRunDialog.ts` | `useOpenStopRunDialog`, `useStopRunDialog` | `useSetPendingAction`, `usePendingAction` |
| `useStopRunCommand.ts` | `useStopRunCommand(run)`: `run.stop` in the palette while `stoppableRun(run)` is not null; it opens the dialog | `useCommands`, `useOpenStopRunDialog`, `stoppableRun` |
| `stop-run-dialog.store.ts` | `useStopRunDialogStore = createPendingActionStore()` | `createPendingActionStore` |
| `stop-run.constants.ts` | `stopRunMessages` (section 10) | - |
| `stop-run.utils.ts` | `stoppableRun(run: Run \| null): Run \| null` | `isUnfinishedRunStatus` |

```ts
// run/features/stop/useStopRun.ts
/**
 * Stops a run, then loads again every query on the screen, since the status of the run counts in
 * the threads, the projects and the reviews; `mutateAsync` settles once they have loaded. A toast
 * says that the run stopped; a failure shows as a toast, and `mutateAsync` rejects.
 */
export function useStopRun()

// run/features/stop/StopRunDialog.tsx
/**
 * Asks before stopping a run, since the step in progress is lost, and waits until the status shows
 * it stopped; a failure leaves it open. One on the screen, opened by Stop and the command palette.
 */
export function StopRunDialog()
```

### The widget `project/widgets/status`

```text
project/widgets/status/
├── index.ts
├── components/
│   ├── ProjectRunStatusItem.tsx
│   ├── ProjectRunStatus.tsx
│   └── __tests__/
│       ├── ProjectRunStatus.test.tsx
│       ├── ProjectRunStatus.data.ts
│       └── ProjectRunStatusItem.test.tsx
└── project-run-status.constants.ts
```

| File | Holds | Reuses |
|---|---|---|
| `index.ts` | `ProjectRunStatusItem` | - |
| `ProjectRunStatusItem.tsx` | Registers `<ProjectRunStatus projectId>` on the left (in `useMemo` by `projectId`), reads `useProjectRunResult(projectId)` and calls `useStopRunCommand(shownRun(projectRunResult))`, renders `ProjectRunStreams` and `StopRunDialog` | `useStatusBarItem`, `ProjectRunStreams`, `StopRunDialog` |
| `ProjectRunStatus.tsx` | Pending (spinner pill, `role="status"`), error (text and Try again, `role="alert"`), and the pill as a link to the activity, with Stop while the run is stoppable; `StatusLink` (tooltip with `run.error.message` for a failed run), `RunStatusPill`, `StatusPill` stay in the file | `useProjectRunResult`, `useRunStatusLook`, `useRunStageTitle`, `StopRunButton` (given the run, it decides itself whether it shows) |
| `project-run-status.constants.ts` | `projectRunStatusMessages` (section 10) | - |

```ts
// project/widgets/status/ProjectRunStatusItem.tsx
/**
 * Shows the status of the project at the left of the status bar while it is mounted, follows the
 * runs of the project so that the status follows them, and holds the one Stop dialog, which the
 * status and the command palette open. It renders nothing in place but the dialog.
 */
export function ProjectRunStatusItem({ projectId }: { projectId: string })

// run/features/stop/hooks/useStopRunCommand.ts
/** Offers Stop run in the command palette while the given run has not finished. */
export function useStopRunCommand(run: Run | null)
```

## 9. State and data flow

| State | Where | Name |
|---|---|---|
| The threads of the project | Query of `thread/entities`, not polled | `useProjectThreads`, `threadKeys.ofProject` |
| The latest run of a thread | Query of `run/entities`, polled every 3 s while unfinished | `useLatestRun`, `runKeys.latestOfThread` |
| The run that the status shows | Derived, no store | `useProjectRunResult`, `ProjectRunResult`, `shownRun` |
| The title of the stage | Select of the definition query | `useStageTitle` |
| The run the Stop dialog asks about | Pending action store of the feature | `useStopRunDialogStore`: `targetId`, `open` |
| Whether Stop is in progress | `ConfirmDialog` awaits `mutateAsync` | - |
| How many times a stream opened again | `useState` in `useRunStatusEvents` | `reopened` |
| The status on the status bar, Stop in the palette | Registries of the frame | `useStatusBarItem`, `useCommands` |

Flow: the layout mounts `ProjectRunStatusItem`. `useProjectRunResult` loads the threads, sorts them by attention, and loads the latest run of the first one; the pill shows pending until both have loaded. `ProjectRunStreams` opens a stream for each thread whose `latest_run_status` is unfinished. At a status event the latest run loads again, and the threads too when the status changed; the pill follows. Stop opens the dialog; Confirm cancels, every query loads again, the dialog closes and the toast says "Run stopped"; the pill shows Stopped, without Stop, and the stream ends with `done`.

## 10. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| Loading | Neutral pill with a spinner, "Loading status" | `?mock-threads=loading` |
| Failed to load | "Failed to load the status." and Try again | `?mock-threads=error` |
| No run | Neutral pill, dashed circle, "Not started" (user view) or "No run yet" (developer view) | `?mock-runs=empty` |
| Queued | Neutral pill, "Starting", no stage, Stop | A run started from the chat (no scenario) |
| Running | Primary soft pill, "Working: <stage>", Stop | `?mock-run-status=running` |
| Waiting for review | Warning solid pill, "Waiting for you: Analysis review", Stop | default |
| Failed | Destructive solid pill, "Failed: <stage>", the error in a tooltip | `?mock-run-status=failed` |
| Succeeded | Success soft pill, "Done" | `?mock-run-status=done` |
| Cancelled | Neutral soft pill, "Stopped: <stage>" | Stop, then Confirm |
| Stop asks | The dialog, the focus on Keep the run | Stop |
| Stop fails | The dialog stays open, the error as a toast | `?mock-cancel-run=error` |

```ts
export const projectRunStatusMessages = {
  loading: 'Loading status',
  failed: 'Failed to load the status.',
  retry: 'Try again',
  /** Where the status leads, for assistive technology. */
  openActivity: 'open the activity',
}

export const stopRunMessages = {
  /** The heading of the commands of the run in the palette. */
  commandGroup: 'Run',
  stop: 'Stop',
  /** The command of the palette, and the button that confirms. */
  stopRun: 'Stop run',
  title: 'Stop the run?',
  description:
    'The agents stop at once, and the step in progress is lost. A new message starts a new run.',
  keep: 'Keep the run',
  stopped: 'Run stopped',
}
```

The pill is a link with the label of the status and ", open the activity" for assistive technology; the status sits in a `role="status"` region, so a change is read out. Stop is a button with its text.

## 11. Mocks and screenshots

- `mocks/runs/handlers/runs.handlers.ts`: the cancel handler starts with `await answerScenario('cancel-run')`, so that `?mock-cancel-run=error` answers 500 and `?mock-cancel-run=loading` never answers. Nothing else of the mock changes: cancel already sets `cancelled` and `finished_at`, and the threads derive their status from the runs (E6).
- The browser stream mock (`mocks/runs/handlers/run-stream.handlers.ts`) sends the same few events for every run; they trigger the reloads, which is enough to see the status follow. A stream that follows the state of the mock run is left for later (section 14).
- `tests/screenshots/projects/project.spec.ts`: one case per scenario of section 10 that has one (loading, failed to load, no run, running, waiting, failed with its tooltip open, done, Stop asks). They run in CI, not locally.

## 12. Tests

| Test file | Cases |
|---|---|
| `thread/entities/__tests__/threads.utils.test.ts` (+ `.data.ts`) | `threadsByAttention`: each status in the order of `runStatusesByAttention`; threads without a run last; two threads of one status keep their order; an empty list. `threadsWithUnfinishedRun`: each status and no run |
| `thread/entities/hooks/__tests__/useThreadQueries.test.ts` (+ `useThreadQueries.data.ts`) | `useReloadThreadsIfRunStatusChanged`, with a `QueryClient` given to `renderHookWithProviders`: reloads when the status differs, not when it is the same, nothing when the threads are not in the cache |
| `run/entities/status/__tests__/run-status.utils.test.ts` (+ data) | `hasStageName` for each of the six statuses |
| `run/entities/status/hooks/__tests__/useRunStatusLook.test.ts` | The look and the label of each status and of null, in the user view and the developer view |
| `run/entities/runs/hooks/__tests__/useRunStageTitle.test.ts` (+ data) | The title for a status that names a stage; undefined for queued, succeeded, null, and while the definition loads |
| `run/entities/events/hooks/__tests__/useRunStatusEvents.test.ts` | From the backup, without the costs and the threads: opens after `last_event_id`; reloads the run at a status event and not at `token`, then calls `onReloaded`; the events of a burst share one reload; closes after `done`; opens again after a failure for good, with the latest event; no `onReloaded` for a load that ends after the stream closed; nothing opens for a run that has ended |
| `shared/lib/timing/__tests__/coalesced-task.utils.test.ts` | From the backup: one run per call outside a run, one more run for the calls during a run, a failed run does not stop the next |
| `project/entities/run-status/__tests__/project-run-result.utils.test.ts` (+ data) | `shownRun` for pending, error, success with and without a run |
| `project/entities/run-status/hooks/__tests__/useProjectRunResult.test.ts` | Pending while the threads load; error of the threads with a retry that loads them again; success with null when the project has no thread; the run of the thread that needs the user most, with two threads; error of the run; the shown status stays when a reload fails |
| `project/entities/run-status/hooks/__tests__/useProjectRunStream.test.ts` | At a status event, the threads load again when the reloaded run has another status than its thread shows |
| `project/entities/components/__tests__/ProjectRunStreams.test.tsx` | One stream per thread with an unfinished run, none for the others |
| `run/features/stop/__tests__/stop-run.utils.test.ts` (+ data) | `stoppableRun` for null and for each status |
| `run/features/stop/__tests__/StopRunDialog.test.tsx` | `itAsksBeforeAction` (nothing while open, nothing after Keep the run or Escape, the cancel and the close after Confirm, open on a failure); `itToastsOnResult` (Run stopped; the message of a 409 `invalid_state`) |
| `run/features/stop/__tests__/StopRunButton.test.tsx` | Opens the one dialog for its run; renders nothing for null and for a run that has ended |
| `run/features/stop/hooks/__tests__/useStopRunCommand.test.ts` | `run.stop` registered while the run is unfinished, gone once it has ended or for null; running it opens the dialog |
| `project/widgets/status/__tests__/ProjectRunStatus.test.tsx` (+ data) | Loading, failed to load and Try again; each mock run status with its label, its stage or none, its fill; the tooltip of a failed run; Stop only for an unfinished run; the link to the activity; the labels of the user view and of the developer view; no accessibility violations |
| `project/widgets/status/__tests__/ProjectRunStatusItem.test.tsx` | With the `StatusBar` rendered: the status on the left side; it leaves on unmount; Stop then Confirm shows Stopped |
| `mocks/runs/__tests__/runs.handlers.test.ts` | Cancel with `?mock-cancel-run=error` answers 500 and leaves the run as it was |

## 13. Docs to update

| Doc | Change |
|---|---|
| `docs/architecture/web-app-modules.md` | Section 9: "on the status bar" instead of "on the top bar". Section 5, the links: `project` -> `run` adds "the latest run, its key and its event stream"; new row `project` -> `thread`: "the threads of a project, their key, `threadsByAttention`"; `thread` -> `run` adds `runStatusesByAttention`. Section 6: the `project` row drops "except `status` and the runs in the entities"; the `run` row lists `stop` as built |
| `docs/architecture/web-app.md` | Section 9: a row "Status of a project", with `project/widgets/status/ProjectRunStatus.tsx`, `project/entities/run-status/hooks/useProjectRunResult.ts`, `project/entities/run-status/hooks/useProjectRunStream.ts`, and `run/features/stop/StopRunDialog.tsx` |
| `frontend/CONTRIBUTING.md` | The shared code table: `coalescedTask` under `timing/`; the test helpers: `@/test/event-source`; `renderWorkbench` of `@/test/render` and the steps of `test/steps/frame.utils.ts`, `statusBar` and `openCommandPalette` of `@/test/steps` |
| `frontend/src/mocks/README.md` | The scenario `mock-cancel-run` (`error`, `loading`) |
| `docs/frontend-implementation-plan.md` (on `frontend-plan`) | The row of the maintenance PR `refactor/fe/review-and-slice-files` before P7 in section 9; row P7 "As built" |

## 14. Left for the next PRs

| Left | For | Why |
|---|---|---|
| Open review on the status of a run that waits, Try again on a failed run | The screens of the review panel and of retry (S rows) | Their features (`review/features/answer`, `run/features/retry`) do not exist yet |
| The notification when a review starts, under the bell | The notifications PR | Usability 5.2; the bell lists nothing yet |
| The costs: `runCostEvents`, `holdsCost`, the reload of the costs, `useRunCost` | B1 | D8 |
| The status of each thread (`ThreadStatusList`) | The screen of a project with several threads | One thread per project today |
| `GET /projects/{project_id}/stream` | When the API adds it | Later in the API, open point 8 |
| A browser stream mock that follows the state of the mock run | A mock PR | The generic events are enough to see the reloads |
| The pending interrupt set to `cancelled` when its run is cancelled | `docs/fe/api-fields`, the user | Open gap of E5 |
| The details of the run in the developer view at the end of the status bar (step, cost against the limit, version) | The developer view PR | Usability, option D |
| `CopyButton`, `useClipboard`, `RelativeTime`, `KeyText` of `feat/fe/highlight-and-text-helpers` | S2 (the copy action of an entry, the time of a message, the keys of the developer view) | P7 shows none of them |
| `Highlight`, `DiffView`, `wordDiff`, `rangesOfQuery`, `FloatingSurface` of the same branch | The review panel and the search | P7 shows none of them |

## 15. Commits and checks

Before: E6 (#45), the maintenance PR of `refactor/fe/review-and-slice-files` and the PR of `feat/fe/highlight-and-text-helpers` merged, in this order; the branch cut from `origin/main` after them.

1. `build(frontend): keep the queries and the API out of the utils files of the slices, and let the events of a run read its runs`: the lint rows of section 7, with their tests
2. `refactor(frontend): split the project entity by topic`: `git mv` of the files of the projects to `projects/`, with the imports that follow
3. `feat(frontend): add the rules that the status of a project reads`: `threadsByAttention`, `threadsWithUnfinishedRun`, `useReloadThreadsIfRunStatusChanged` and `thread/entities/@x/project`, `hasStageName`, `useRunStageTitle` with `useStageTitle` in `@x/run` of `workflow`, `useRunStatusLook` read by `RunStatusBadge`, `runStatusEvents`, the exports and the two `@x` files of `run`, `coalescedTask`, their tests
4. `feat(frontend): read the run that the status of a project shows, and follow its runs`: `useRunStatusEvents` and `streamReopenMs` in `run/entities/events`, `ProjectRunResult`, `shownRun`, `useProjectRunResult`, `useProjectRunStream`, `ProjectRunStreams`, `test/event-source/` and the setup, their tests
5. `feat(frontend): stop a run after asking`: `run/features/stop` with `useStopRunCommand`, `renderWorkbench` of `@/test/render` and `statusBar`, `openCommandPalette` of `@/test/steps`, the `cancel-run` scenario, their tests
6. `feat(frontend): show the status of a project in the status bar, with Stop`: `project/widgets/status`, the layout, the screenshot cases, their tests
7. `docs(frontend): describe the status of a project and Stop in the guides`: section 13

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on `src/modules/project`, `src/modules/run`, `src/modules/thread`, `src/shared/lib/timing`, `src/mocks/runs`; `pnpm typecheck` once, since exports and a layout change. No full suite, E2E, screenshots or build locally: CI runs them on the PR. Then:

- `grep -rnE "FR-[0-9]|NFR-[0-9]|docs/"` on the new files answers nothing; `grep -rniE "backend|frontend|\bUI\b|dashboard"` on the new comments too.
- `grep -rnwE "useStopRunStore|ThreadStatusList|threadTitles|showsStage|useRunStageLabel|latestRun|holdsCost|runCostEvents" frontend/src` answers nothing.
- `components/` and `hooks/` of the two slices hold two files or more; `project/widgets/status` holds no hook.
- The widget reads no rule itself: `grep -rnE "runStatusLook|runStatusLabel|hasStageName|useStageTitle|stoppableRun|useCommands" frontend/src/modules/project/widgets/status` answers nothing.
- `grep -nP '[^\x00-\x7F]'` on each changed doc shows only tree lines.
- No `console.log`; nothing committed or pushed without the user.

## 16. Checklist

- [x] A lone component or hook at the root of its slice, decided by the user (2026-10-31)
- [x] Commits 7 to 9 on `refactor/fe/review-and-slice-files` (2026-10-31, local)
- [x] Its PR opened as draft #46 (2026-10-31)
- [ ] #46 merged
- [x] The PR of `feat/fe/highlight-and-text-helpers` opened as draft #47, stacked on #46, with `group.utils.ts` and the `collections/` row resolved (decision 9)
- [ ] #47 rebased on `main` after #46 merges, then merged
- [ ] E6 (#45) merged, and the branch cut from `origin/main` after it
- [ ] Commit 1: the lint group `queriesInUtils` and the two lint changes, with their tests
- [ ] Commit 2: the topics `projects/` and `run-status/` of the project entity, the move shown as renames
- [ ] Commit 3: the rules of the entities, each with a data-driven test; `@x` files export only what `project`, `thread` and `run` read; the badge and the pill read `useRunStatusLook`
- [ ] Commit 4: the run of the status and the streams, without the costs
- [ ] Commit 5: Stop with the pending action store, mounted once
- [ ] Commit 6: the status on the status bar of every screen of a found project, the palette command
- [ ] Commit 7: docs, with the fix of "top bar"
- [ ] Every state of section 10 reachable in `pnpm dev:mock`
- [ ] Only the checks of section 15 ran
- [ ] The rows of the maintenance PR and of P7 in the implementation plan updated
