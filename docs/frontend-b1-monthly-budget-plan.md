# Frontend B1: the budget of the month on the status bar

The plan of the PR B1 of the [Frontend implementation plan](frontend-implementation-plan.md), written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md). An agent implements from it; every decision is made.

Short paths: `usage/...` is `frontend/src/modules/usage/...`, `run/...` is `frontend/src/modules/run/...`, `shared/...` is `frontend/src/shared/...`, `mocks/...` is `frontend/src/mocks/...`, `test/...` is `frontend/src/test/...`, `app/...` is `frontend/src/app/...`.

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
| Branch | `feat/fe/monthly-budget`, from `origin/main` once E9 (`feat/fe/usage-entities`) is merged |
| Title | `feat(frontend): show the budget of the month in the status bar` |
| Needs | P7 (#49, merged): the status bar item of a project, `useRunStatusEvents`, `coalescedTask`. E9: `useMonthlyUsage`, `usageKeys`, the scenarios `mock-usage` and `mock-budget` of the mock of `/me/usage` |
| After it | S1 to S6. S5 (Settings) adds the usage section and the link from the budget to it. The developer view PR shows the cost of a run against its limit with `useRunCost` |
| Docs-first | What the status bar shows was ambiguous in `docs/ui/usability.md`; the user answered on 2026-10-31 (decision 1), and the answer is written in the local copy of that doc. The API needs nothing new: `/me/usage` returns `budget_usd`, and open point 8 of the API already says that a screen reads it again when a run changes its cost |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| Implementation plan, D8, row B1, checklist | B1 takes `MonthlyBudgetItem`, `CostMeter`, the formatters of currency and percentage, `query-meta.utils` with the reload of the costs, and the `value` that `Progress` gives its root |
| [E9 plan](frontend-e9-usage-plan.md), decisions 5, 7 and section 14 | `useMonthlyBudget` moves from E9 to B1 with `shared/lib/cost` and `costQueryMeta`; `useMonthlyUsage(params, options)` is the query B1 reads; the budget scenarios give 86% and 95% with the fixtures |
| [P7 plan](frontend-p7-project-status-plan.md), decision 4, "Checked, not extracted", section 14 | `runCostEvents`, `holdsCost`, `useRunCost` go to B1; the budget registers with `order: 1`, after the status of the project (`order` 0) |
| `docs/ui/usability.md`, status bar rows, open point 5 | "Hidden until 80% of the budget is used, then a warning banner with the amount; the full figure in Project settings"; 80% is a proposal |
| `docs/ui/skeletons.md`, status bar | The status bar of the developer view shows the cost of the run against `max_cost_usd`: the later reader of `useRunCost` |
| `docs/architecture/web-app-modules.md`, sections 2, 6, 8 | A block of one object goes to its entity, so the budget item sits in `usage/entities/components/`; the row `usage` says "the budget on the status bar with the cost meter"; the rule that compares a cost with its limit is shared code and serves `run` and `usage` |
| `docs/API.md`, `/me/usage`, Rate limits and budgets, open point 8 | `budget_usd` is null for a month without a limit; a spent budget answers `429 budget_exceeded`; the budget is read again when a run of the user changes its cost |
| `origin/feat/fe/artifacts-backup` | `shared/lib/cost/*` with tests, `shared/api/query-meta.utils.ts` with tests, `shared/components/status/cost/CostMeter.tsx` and `cost-level.constants.ts`, `shared/lib/formatters/currency.utils.ts` and `percentage.utils.ts`, `usage/entities/hooks/useMonthlyBudget.ts`, `components/MonthlyBudgetItem.tsx`, `usage.constants.ts` with tests, `run-events.constants.ts` (`runCostEvents`), `project/entities/hooks/useRunStatusStream.ts` (the cost reload), `run/entities/hooks/useRunQueries.ts` (`useRunCost`), the change of `progress.tsx` |
| `main` (`086c626`) and the E9 working tree | `formatCurrency` and `formatPercent(ratio)` in `shared/lib/formatters/number.utils.ts`; `Progress` without the value on its root; `useRunStatusEvents` with its `isClosed` flag and its tests; `useLatestRun` without a cost hook; `ProjectRunStatusItem` in the project layout; the home layout with no status bar item; `renderWorkbench`, `statusBar()`; the screenshot helper `statusShot` of `tests/screenshots/projects/project.spec.ts`; tones `primary`, `warning`, `destructive`; E9 `useUsageQueries.ts` and `index.ts` |
| Measured on 2026-10-31 with Node 22 | `formatCurrency` writes `$4.76`, `$5.52`, `$5.00`; `costPercent(4.755, 5.52)` is 86 and `costPercent(4.755, 5)` is 95, the same cents as the text |
| Skills `feature-sliced-design`, `clean-review` | Placement by object; one user keeps code at its consumer; the copies below drop the backup formatters (DRY with `main`) and the repeated percent and level code of the two hooks |

## 3. Decisions

1. **What shows (answers of the user, 2026-10-31).**
   - A meter on the left of the status bar: the gauge icon, a bar, the percent and the amounts, as `86%  $4.76 / $5.52`.
   - Hidden below 80% of the budget. From 80% the tone is `warning`, from 90% `destructive`, also past 100%, where the bar stays full.
   - Nothing happens on a click in B1; S5 makes it a link to the usage section of Settings.
   - `usability.md` is a local doc that git excludes (`.git/info/exclude`), so no commit carries the change; its working copy holds it: the status bar row of the cost reads "Hidden until 80% of the monthly budget is used, then a meter with the percent and the amounts, amber from 80% and red from 90%; the full figure in the usage section of Settings", and open point 5 is removed, with the points after it numbered again.
2. **Both layouts mount the budget.** The budget belongs to the user, across projects. `MonthlyBudgetItem` goes in the `contributions` of `app/(home)/layout.tsx` (after `ProjectDialogs`) and of the project layout of a found project (after `ProjectRunStatusItem`), not in the not-found frame. On the screens outside a project no stream runs, so the usage loads when the item mounts and again after the stale time of the query client (30 s) on a window focus.
3. **The comparison of a cost with its limit is shared code, `shared/lib/cost/`**, copied from the backup with these changes:
   - `CostShare` becomes `{ costUsd, limitUsd, percent, level }`, so that a block shows the amounts with the percent from one value.
   - New `costShare(costUsd, limitUsd): CostShare | undefined`, which `useMonthlyBudget` and `useRunCost` both call; the backup repeated the two lines of percent and level in each hook.
   - `costLevelTones` moves from `shared/components/status/cost/cost-level.constants.ts` to `shared/lib/cost/cost.constants.ts`, beside `costLevelPercents`: the look of a value sits beside the value.
   - Readers now: `usage` and `run`, two modules, which Web App Modules section 6 already names.
4. **The reload of the costs is a query meta in shared code, and the run stream applies it.**
   - `costQueryMeta` goes to `shared/api/query-client/query-meta.constants.ts` (a constants file declares no function), `hasCost` to `query-meta.utils.ts` beside it, both exported from `shared/api/query-client/index.ts`. The backup had them in one `shared/api/query-meta.utils.ts`, before `shared/api` had folders.
   - `runCostEvents` (`node_end`, `error`, `done`) joins `runStatusEvents` in `run/entities/events/run-events.constants.ts`.
   - `useRunStatusEvents` adds `reloadCosts`, a `coalescedTask` that invalidates every query whose meta holds a cost, called at each cost event that is a `MessageEvent`; the stream already reloads the run at those events. `reloadCosts` reports nothing, so it needs no `isClosed` check; the cleanup stays as it is.
   - Why here: the stream of a run is a part of the run entity (P7 decision 4), and `run` may not name `usageKeys`, nor may `project`. A meta lets any module mark a query that holds a cost without the stream knowing it.
5. **Every usage query holds a cost.** `useMonthlyUsage` sets `meta: costQueryMeta`, so the grouped usage of S5 loads again at a cost event too. This changes the E9 hook in commit 5, and its JSDoc: "it loads again when a run of the user changes its cost".
6. **`useMonthlyBudget()` joins `usage/entities/hooks/useUsageQueries.ts`**, beside the query it builds on, as `useRunCost` sits beside `useLatestRun`. It reads `useMonthlyUsage()`, the current month without groups, and returns `costShare(total.cost_usd, budget_usd)`: undefined while the usage loads, when it fails, and for a month without a budget. The backup file `hooks/useMonthlyBudget.ts` with its own `useQuery` is not copied.
7. **`useRunCost(threadId, options)` goes back to `run/entities/runs/hooks/useRunQueries.ts`**, on `useLatestRun`, returning `costShare(usage.cost_usd, run_config.max_cost_usd)`. It is kept without a reader on purpose (the user decided on 2026-10-18 to keep it; the developer view will read it), and it is not exported from `run/entities/index.ts` until that reader exists: the exports of an entity follow its readers. Its test imports it from its file. The signature follows `useLatestRun` of `main` (`threadId: string`, `HookQueryOptions`), not the backup (`string | undefined`).
8. **The meter stays in `MonthlyBudgetItem.tsx`.** One block shows it now, so the backup `CostMeter` is not extracted to shared code (FSD extraction rule). `MonthlyBudget` renders the gauge, the bar and the text itself. It moves to `shared/components/ui/cost-meter.tsx`, with a card on the design system page, when the cost of a run shows on the status bar (section 14).
9. **No formatter is copied.** `formatPercent(share.percent / 100)` and `formatCurrency(amount)` of `@/shared/lib/formatters` replace the backup `formatPercent(percent)` and `formatUsd`. They write the same cents as `costPercent` counts (section 2, measured), so the percent reaches a level only when the amounts on screen do.
10. **`Progress` passes `value` to its root**, so that Radix sets `aria-valuenow` and calls `getValueLabel`; without it assistive technology reads no value. One line, with a comment, as in the backup.
11. **No live region.** The meter has no `role="status"`: the cost changes after each step of a run, and a live region would speak at each of them. The progress bar gives its name and value when the user reaches it. This also keeps `getByRole('status')` of the status bar tests of `ProjectRunStatusItem` unique.
12. **Words** go to `usageMessages` in `usage/entities/usage.constants.ts`, a new file (E9 has none): the name of the bar, and the amounts as a function.

## 4. Scope

| | |
|---|---|
| Endpoint read | `GET /me/usage` (the current month, no groups), through `useMonthlyUsage()` of E9 |
| Endpoint called | None: B1 has no action |
| Streams | `GET /runs/{run_id}/stream`, already followed by `useRunStatusEvents` through `ProjectRunStreams`; B1 adds the reload of the costs to it |
| Copied from the backup, with the changes of section 3 | `shared/lib/cost/` and its tests; `costQueryMeta`, `hasCost` and their tests; `runCostEvents`; the cost reload of `useRunStatusStream`; `useRunCost` and its tests; `useMonthlyBudget` and its tests; `MonthlyBudgetItem`, `MonthlyBudget` with the content of `CostMeter`; `usageMessages`; the `value` of `Progress` |
| Written new | `costShare`; the amounts in the meter; the tests of the cost reload in `useRunStatusEvents`; the item in the home layout; two screenshot cases |
| Not copied | `shared/components/status/cost/CostMeter.tsx` as a file (decision 8); `shared/lib/formatters/currency.utils.ts` and `percentage.utils.ts` with their tests (decision 9); `usage/entities/hooks/useMonthlyBudget.ts` with its own query (decision 6); `project/entities/hooks/useRunStatusStream.ts`, which `main` split in P7; the backup `index.ts` of `usage` |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Component that registers and renders nothing in place | `...Item` | `MonthlyBudgetItem` |
| Component of the block | `<Object><Block>`; the object is the budget of the month | `MonthlyBudget` |
| Hook of a value derived from a query | Named after what it gives, in `use<Resource>Queries.ts` | `useMonthlyBudget` in `useUsageQueries.ts`; `useRunCost` in `useRunQueries.ts` |
| Pure rule | What it gives, no `get` | `costShare`, `costPercent`, `costLevel` |
| Type | The value | `CostShare`, `CostLevel` |
| Constants | camelCase, `satisfies` | `costLevelPercents`, `costLevelTones`, `runCostEvents`, `costQueryMeta` |
| Predicate of a query | Boolean verb | `hasCost` |
| Words | `<topic>Messages` | `usageMessages` |
| Local task in the hook | What it does | `reloadCosts` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `useStatusBarItem`, `StatusBarSide` | `@/shared/components/frame` | Register the meter on the left, `order: 1` |
| `Progress` with `color` | `@/shared/components/ui/progress` | The bar in the tone of the level |
| `toneClasses`, `Tone` | `@/shared/lib/tone` | The color of the icon and the text |
| `formatPercent`, `formatCurrency` | `@/shared/lib/formatters` | The percent and the amounts |
| `coalescedTask` | `@/shared/lib/timing` | One reload of the costs for a burst of events |
| `HookQueryOptions` | `@/shared/api/query-client` | The options of `useRunCost` |
| `useMonthlyUsage`, `useLatestRun` | `usage/entities`, `run/entities` | The queries the two cost hooks build on |
| `renderWorkbench`, `renderHookWithProviders`, `statusBar`, `expectNoAccessibilityViolations` | `@/test/render`, `@/test/steps` | The tests of the item and the hooks |
| `openedEventSources`, `buildRun`, `server` | `@/test/event-source`, `@/mocks/runs/fixtures/runs.fixtures`, `@/mocks/msw-server.setup` | The tests of the cost reload |
| `statusShot` | `tests/screenshots/projects/project.spec.ts` | The two screenshot cases |

### Extract before new code

| What | To | Why |
|---|---|---|
| `costPercent`, `costLevel`, `costShare`, `CostLevel`, `CostShare`, `costLevelPercents`, `costLevelTones` | `shared/lib/cost/` | Two modules read them now (`usage`, `run`); they know no object of the product |
| `costQueryMeta`, `hasCost` | `shared/api/query-client/query-meta.*` | `run` applies the meta and `usage` sets it; neither may import the other |

### Checked, not extracted

| Candidate | Copies now | Why it stays |
|---|---|---|
| `CostMeter` | 1 (`MonthlyBudget`); the developer view adds a second later | Decision 8 |
| A pill for the budget like `StatusPill` | 0 | The budget shows a meter, not a pill |
| A `role="status"` wrapper | 0 | Decision 11 |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `docs/ui/usability.md` | Decision 1, in the working copy only (a local doc) | none |
| `shared/components/ui/progress.tsx` | Decision 10 | 2 |
| `shared/lib/cost/` (new folder) with `__tests__/cost.utils.test.ts`, `.data.ts` | Decision 3 | 2 |
| `shared/api/query-client/query-meta.constants.ts`, `query-meta.utils.ts`, `__tests__/query-meta.utils.test.ts`, `.data.ts`, `index.ts` | Decision 4 | 3 |
| `run/entities/events/run-events.constants.ts`, `hooks/useRunStatusEvents.ts`, `hooks/__tests__/useRunStatusEvents.test.ts` | Decision 4 | 3 |
| `run/entities/runs/hooks/useRunQueries.ts`, `hooks/__tests__/useRunQueries.test.ts` (with a `.data.ts` if missing) | Decision 7 | 4 |
| `usage/entities/hooks/useUsageQueries.ts`, `hooks/__tests__/useUsageQueries.test.ts` (with `.data.ts`) | Decisions 5 and 6 | 5 |
| `usage/entities/usage.constants.ts`, `components/MonthlyBudgetItem.tsx`, `components/__tests__/MonthlyBudgetItem.test.tsx`, `.data.ts`, `usage/entities/index.ts` | Decisions 8, 11, 12 | 5 |
| `app/(home)/layout.tsx`, `app/(project)/projects/[projectId]/layout.tsx` | Decision 2, and the JSDoc of each layout names the budget of the month | 5 |
| `tests/screenshots/projects/project.spec.ts` | Section 11 | 5 |
| `docs/architecture/web-app-modules.md`, `docs/architecture/web-app.md`, `frontend/src/mocks/README.md`, implementation plan (branch `frontend-plan`) | Section 13 | 6 |

Files that two commits change: none. `usage/entities/index.ts` changes only in commit 5; `run/entities/index.ts` does not change. No lint file changes: `moduleImports` already lets `usage` read nothing and `run` read nothing of `usage`, and `shared/lib` may import `shared/lib/tone`.

## 8. The slices, file by file

### `shared/lib/cost/`

```text
shared/lib/cost/
├── cost.constants.ts
├── cost.types.ts
├── cost.utils.ts
├── index.ts
└── __tests__/
    ├── cost.utils.data.ts
    └── cost.utils.test.ts
```

| File | Holds | Reuses |
|---|---|---|
| `cost.types.ts` | `CostLevel`, `CostShare` | - |
| `cost.constants.ts` | `costLevelPercents`, `costLevelTones` | `Tone` |
| `cost.utils.ts` | `costPercent`, `costLevel`, `costShare` | - |
| `index.ts` | The four exports and the two types, with the comment of the backup without "agents": "The comparison of a cost with its limit, which several screens show." | - |

```ts
/** The levels that a cost reaches against its limit, from the lowest. */
export type CostLevel = 'normal' | 'warning' | 'danger'

/** A cost against its limit, both in USD: the percent of the limit it has reached, and its level. */
export interface CostShare {
  costUsd: number
  limitUsd: number
  percent: number
  level: CostLevel
}

/** The percent of its limit from which a cost is at each level. */
export const costLevelPercents = { normal: 0, warning: 80, danger: 90 } as const satisfies Record<CostLevel, number>

/** The color of each level of a cost: the primary color, then amber, then red. */
export const costLevelTones = { normal: 'primary', warning: 'warning', danger: 'destructive' } as const satisfies Record<CostLevel, Tone>

/** `costPercent` and `costLevel` of the backup, unchanged. */

/** A cost against its limit, both in USD. Undefined without a limit, or for a limit of nothing. */
export function costShare(costUsd: number, limitUsd: number | null): CostShare | undefined {
  const percent = costPercent(costUsd, limitUsd)
  if (percent === undefined || limitUsd === null) return undefined
  return { costUsd, limitUsd, percent, level: costLevel(percent) }
}
```

### `shared/api/query-client/query-meta.*`

```ts
// query-meta.constants.ts
/**
 * The meta of a query whose data holds a cost, such as the usage of the month. An event of a run
 * that changes a cost loads every such query again, whichever module defines it.
 */
export const costQueryMeta = { hasCost: true }

// query-meta.utils.ts
/** Whether a query holds a cost, by its meta, for `invalidateQueries({ predicate })`. */
export function hasCost(query: Pick<Query, 'meta'>): boolean {
  return query.meta?.hasCost === true
}
```

### `run/entities/events/`

- `run-events.constants.ts` adds, after `runStatusEvents`, `runCostEvents` of the backup (`node_end`, `error`, `done`, `satisfies readonly (typeof runStatusEvents)[number][]`). The hook builds `const costEvents: ReadonlySet<string> = new Set(runCostEvents)` at the top of its file, not exported.
- `useRunStatusEvents.ts`: the JSDoc adds "An event that may change a cost also loads again every query that holds a cost, and the events of a burst share that load too." In the effect, after `reload`:

```ts
const reloadCosts = coalescedTask(() => queryClient.invalidateQueries({ predicate: hasCost }))
for (const type of runStatusEvents) {
  source.addEventListener(type, (event) => {
    if (!(event instanceof MessageEvent)) return
    reload()
    if (costEvents.has(type)) reloadCosts()
  })
}
```

### `run/entities/runs/hooks/useRunQueries.ts`

```ts
/**
 * The cost of the newest run of a thread against the limit of the run. Undefined while the run
 * loads, before the first run of the thread, and for a run without a limit.
 */
export function useRunCost(threadId: string, options: HookQueryOptions = {}): CostShare | undefined {
  const run = useLatestRun(threadId, options)
  if (run.data == null) return undefined
  return costShare(run.data.usage.cost_usd, run.data.run_config.max_cost_usd)
}
```

### `usage/entities/`

```text
usage/entities/
├── index.ts                      (adds MonthlyBudgetItem, useMonthlyBudget)
├── usage.constants.ts            (new)
├── components/
│   ├── MonthlyBudgetItem.tsx     (new)
│   └── __tests__/
│       ├── MonthlyBudgetItem.data.ts
│       └── MonthlyBudgetItem.test.tsx
└── hooks/
    ├── useUsageQueries.ts        (meta, useMonthlyBudget)
    └── __tests__/
        ├── useUsageQueries.data.ts
        └── useUsageQueries.test.ts
```

| File | Holds | Reuses |
|---|---|---|
| `usage.constants.ts` | `usageMessages` | - |
| `hooks/useUsageQueries.ts` | `useMonthlyUsage` with `meta: costQueryMeta`; `useMonthlyBudget` | `costQueryMeta`, `costShare` |
| `components/MonthlyBudgetItem.tsx` | `MonthlyBudgetItem`, `MonthlyBudget` | `useStatusBarItem`, `Progress`, `toneClasses`, `costLevelTones`, the formatters |
| `index.ts` | E9 exports, plus `MonthlyBudgetItem` and `useMonthlyBudget` | - |

```ts
/**
 * The budget of the month that the user has spent. Undefined while the usage loads, when it fails
 * to load, and for a month without a budget.
 */
export function useMonthlyBudget(): CostShare | undefined {
  const usage = useMonthlyUsage()
  if (usage.data === undefined) return undefined
  return costShare(usage.data.total.cost_usd, usage.data.budget_usd)
}
```

```tsx
'use client'

/** Shows the budget of the month at the left of the status bar, after the status of the screen. */
export function MonthlyBudgetItem() {
  const content = useMemo(() => <MonthlyBudget />, [])
  useStatusBarItem({ side: StatusBarSide.Left, order: 1, content })
  return null
}

// TODO: open the usage of the month in the settings, once the settings show it.
/**
 * The budget of the month that the user has spent, once it is above the normal level: a gauge, a
 * bar, the percent and the amounts, in the color of the level. A spent budget stops the work of
 * every project.
 */
export function MonthlyBudget() {
  const budget = useMonthlyBudget()
  if (budget === undefined || budget.level === 'normal') return null

  const tone = costLevelTones[budget.level]
  const percent = formatPercent(budget.percent / 100)
  return (
    <span className={cn('flex shrink-0 items-center gap-1.5 text-sm text-(--tone-strong) [&_svg]:size-3.5', toneClasses[tone])}>
      <GaugeIcon aria-hidden />
      {/* A cost over its limit fills the bar. The bar says the percent to assistive technology. */}
      <Progress
        value={Math.min(budget.percent, 100)}
        color={tone}
        aria-label={usageMessages.monthlyBudget}
        getValueLabel={() => percent}
        className="h-2 w-16 bg-foreground/10"
      />
      <span aria-hidden className="tabular-nums">{percent}</span>
      <span className="tabular-nums">
        {usageMessages.spentOfBudget(formatCurrency(budget.costUsd), formatCurrency(budget.limitUsd))}
      </span>
    </span>
  )
}
```

The amounts stay readable to assistive technology: the bar gives the percent, the text gives the amounts. `cn` comes from `cn`, as `progress.tsx` imports it.

### The layouts

- `app/(home)/layout.tsx`: `<MonthlyBudgetItem />` after `<ProjectDialogs />`; the JSDoc reads "... the dialogs of the projects, the budget of the month and the account menu, and the page."
- `app/(project)/projects/[projectId]/layout.tsx`: `<MonthlyBudgetItem />` after `<ProjectRunStatusItem projectId={projectId} />` in the found frame; the JSDoc names "the budget of the month".
- Server Components: both layouts import `@/modules/usage/entities`. `MonthlyBudgetItem.tsx` starts with `'use client'`; `useUsageQueries.ts` imports no state hook of React, so it needs none.

## 9. State and data flow

| State | Where | Name |
|---|---|---|
| The usage of the month | The query of E9, key `usageKeys.month({})`, meta `costQueryMeta` | `useMonthlyUsage` |
| The budget spent | Derived in a hook | `useMonthlyBudget` returning `CostShare \| undefined` |
| The cost of the newest run | Derived in a hook on `useLatestRun` | `useRunCost` |
| The item on the status bar | The registry of the frame | `useStatusBarItem` |

Flow:

1. A layout mounts `MonthlyBudgetItem`; the status bar shows nothing while the usage loads.
2. The usage answers. Below 80% nothing shows; from 80% the meter shows.
3. In a project, `ProjectRunStreams` follows each unfinished run. At `node_end`, `error` or `done`, the run loads again (P7) and, once per burst, every query with `costQueryMeta` loads again: the usage of the month, and in S5 the grouped usage. The meter updates in place, or appears when the cost crosses 80%.
4. Outside a project, the usage loads again after its stale time on a window focus, as every query does.
5. A failed load shows nothing: the budget is not the subject of the screen, and the query client retries.

## 10. Screen states and words

| State | What shows | Scenario of the page URL |
|---|---|---|
| Loading | Nothing | `?mock-usage=loading` |
| Error | Nothing | `?mock-usage=error` |
| No usage this month | Nothing | `?mock-usage=empty` |
| No budget | Nothing | `?mock-budget=none` |
| Below 80% (23% with the fixtures) | Nothing | none |
| From 80% | The meter in amber: `86%  $4.76 / $5.52` | `?mock-budget=warning` |
| From 90%, also past 100% | The meter in red: `95%  $4.76 / $5.00` | `?mock-budget=danger` |

Accessibility: the bar is a `progressbar` named "Monthly budget used" with the value text of the percent; the icon and the percent text are hidden from assistive technology; the amounts are read as text. No focusable control in B1.

Words:

```ts
// The words of the usage of the user.
export const usageMessages = {
  /** The name of the bar of the budget of the month, for assistive technology. */
  monthlyBudget: 'Monthly budget used',
  /** The cost of the month against its budget, both written as amounts: "$4.76 / $5.52". */
  spentOfBudget: (spent: string, budget: string) => `${spent} / ${budget}`,
}
```

## 11. Mocks and screenshots

- Mocks: no change. E9 serves every state of section 10.
- Screenshots, in `tests/screenshots/projects/project.spec.ts`, with `statusShot` (the status bar only):
  - `statusShot('budget near its limit', \`${mentor}?mock-budget=warning\`, '$4.76 / $5.52')`
  - `statusShot('budget nearly spent', \`${mentor}?mock-budget=danger\`, '$4.76 / $5.00')`
- The screenshots are not taken locally; CI and the screenshot run of the user take them.

## 12. Tests

| Test file | Cases |
|---|---|
| `shared/lib/cost/__tests__/cost.utils.test.ts` with `.data.ts` | The backup cases of `costLevel` (0, 79, 80, 89, 90, 105) and `costPercent` (whole, rounded down, amounts as shown, floating point, over the limit, no limit, a limit of nothing). `costShare` (data-driven): `(1.72, 2)` gives `{ costUsd: 1.72, limitUsd: 2, percent: 86, level: 'warning' }`; `(0.5, 2)` level `normal`; `(9, null)` and `(0, 0)` undefined |
| `shared/api/query-client/__tests__/query-meta.utils.test.ts` with `.data.ts` | The backup cases of `hasCost`: the meta of a cost, another meta, no meta; plus `hasCost({ meta: costQueryMeta })` is true |
| `run/entities/events/hooks/__tests__/useRunStatusEvents.test.ts` | New: with a query of key `['cost']` and `meta: costQueryMeta` and one of key `['other']` without meta in the client, a `node_end` event invalidates the first and not the second; a `node_start` event invalidates neither; a burst of `node_end` events loads the cost query once more than before, not once per event. The existing cases stay |
| `run/entities/runs/hooks/__tests__/useRunQueries.test.ts` with `.data.ts` | `useRunCost` (data-driven through `server.use` with `buildRun`): a run with `usage.cost_usd` 1.72 and `max_cost_usd` 2 gives 86 and `warning`; `max_cost_usd` null gives undefined; a thread without a run gives undefined |
| `usage/entities/hooks/__tests__/useUsageQueries.test.ts` with `.data.ts` | E9 cases stay. `useMonthlyUsage` puts `costQueryMeta` on its query (read with `queryClient.getQueryCache().find({ queryKey: usageKeys.month({}) })?.meta`). `useMonthlyBudget` (data-driven by address): default `{ percent: 23, level: 'normal' }`, `?mock-budget=warning` 86 `warning`, `danger` 95 `danger`, `none` undefined, `?mock-usage=error` undefined |
| `usage/entities/components/__tests__/MonthlyBudgetItem.test.tsx` with `.data.ts` | With `renderWorkbench(<MonthlyBudgetItem />)`, data-driven by address: default and `?mock-usage=empty` show no progress bar on the status bar; `warning` shows the bar "Monthly budget used" with `aria-valuetext` `86%` and `aria-valuenow` 86, and the text `$4.76 / $5.52`; `danger` 95% and `$4.76 / $5.00`. The bar leaves after `rerenderContributions(null)`. `expectNoAccessibilityViolations` on `warning` |

Helpers: the address of a scenario is set with `window.history.replaceState` and put back in `afterEach`, as the backup tests do; if `test/` already has a step for the page URL of a scenario, the two usage test files use it instead. No new helper in `test/`: one slice uses each setup.

## 13. Docs to update

| Doc | Change |
|---|---|
| `docs/ui/usability.md` | Decision 1, in the working copy only (a local doc) |
| `docs/architecture/web-app-modules.md`, section 6, row `usage` | State: "The entities and the budget on the status bar; the usage section with Settings". Section 8 table: a row "The comparison of a cost with its limit, its levels and their tones | `shared/lib/cost/` | `run` and `usage` compare a cost with its limit"; and "The meta of a query that holds a cost | `shared/api/query-client/` | the stream of a run loads such queries again without naming them" |
| `docs/architecture/web-app.md`, section 9 | The "Usage" row of E9 adds `MonthlyBudgetItem`, `useMonthlyBudget`, `shared/lib/cost`, `query-meta.*` |
| `frontend/src/mocks/README.md` | The rows of the table of states for `?mock-budget=warning` and `danger` say "the budget of the month on the status bar" |
| Implementation plan (branch `frontend-plan`) | D8: the B1 row matches decisions 3 to 9 (no formatters, the meter not extracted). Row B1: "As built" after the merge. Checklist: B1 ticked once merged. Open point of usability 5 removed if mirrored there |

## 14. Left for the next PRs

| Item | Where |
|---|---|
| The link from the budget to the usage section of Settings | S5 (the `TODO` in `MonthlyBudget`) |
| The cost of a run against its limit on the status bar, with `useRunCost`, and the move of the meter to `shared/components/ui/cost-meter.tsx` | The developer view PR |
| A note when a run fails with `budget_exceeded` or a request answers `429 budget_exceeded` | S2 (the chat), where the error of a run shows |

## 15. Commits and checks

1. None: the change of `usability.md` stays local (decision 1); the commits below keep their numbers
2. `feat(frontend): compare a cost with its limit, and give the value of a progress bar to assistive technology`
3. `feat(frontend): load the queries that hold a cost again when a run changes its cost`
4. `feat(frontend): read the cost of the newest run of a thread against its limit`
5. `feat(frontend): show the budget of the month in the status bar`
6. `docs(frontend): describe the budget of the month and the cost helpers in the guides`

Each commit compiles: commit 3 reads `shared/api/query-client` only; commit 4 reads `shared/lib/cost` of commit 2; commit 5 reads commits 2 and 3. The plan and the prompt stay local.

Checks, one at a time:

- ESLint and Prettier on the changed files.
- Vitest on `src/shared/lib/cost`, `src/shared/api/query-client`, `src/modules/run/entities/events`, `src/modules/run/entities/runs`, `src/modules/usage`, `src/modules/project/widgets/status` (the status bar tests must still find one `status`).
- `pnpm typecheck` once, after commit 5.
- `grep -nP '[^\x00-\x7F]'` on the diff; `grep -rn "console.log" ` on the new files; the new comments grepped for `backend|frontend|UI|dashboard` and `FR-[0-9]|NFR-[0-9]|docs/`.
- No full suite, E2E, screenshots or build locally; a test that times out only with the others runs again alone.

## 16. Checklist

- [ ] E9 merged; the branch starts from `origin/main`
- [x] `usability.md` as decision 1, in the working copy (a local doc)
- [ ] Commit 2: `shared/lib/cost/` with `costShare` and `costLevelTones`; `Progress` passes `value`
- [ ] Commit 3: `costQueryMeta`, `hasCost`, `runCostEvents`, the cost reload in `useRunStatusEvents`, with its tests
- [ ] Commit 4: `useRunCost`, not exported from the index, with its tests
- [ ] Commit 5: `meta` on `useMonthlyUsage`, `useMonthlyBudget`, `MonthlyBudgetItem`, `usageMessages`, both layouts, two screenshot cases
- [ ] Commit 6: the guides and the mocks README; the implementation plan on `frontend-plan`
- [ ] `grep -rnwE "CostMeter|formatUsd|useRunStatusStream|cost-level.constants" frontend/src` answers nothing
- [ ] Checks of section 15 pass
- [ ] PR opened as a draft, no AI attribution; its description written from this plan, with the endpoint checked against `getMonthlyUsage` and the stream against `runEventsUrl`
