# E9 `usage` entities: plan

Draft of 2026-10-31, for an agent to implement. Not committed. This is the next row of the PR table after E8 (`feat/fe/user-entities`, #51). E9 reads no code of E8, but it starts once E8 is merged, as every row does. Both PRs rewrite the same sentence of `src/mocks/README.md` (section 11).

Short paths: `usage/entities/...` is `frontend/src/modules/usage/entities/...`, `mocks/...` is `frontend/src/mocks/...`, `test/...` is `frontend/src/test/...`. Any other path that starts with `modules/` or `shared/` is under `frontend/src/`.

## Contents

- [1. Row in the PR table](#1-row-in-the-pr-table)
- [2. What was read](#2-what-was-read)
- [3. Decisions](#3-decisions)
- [4. Scope](#4-scope)
- [5. Naming](#5-naming)
- [6. Shared code first](#6-shared-code-first)
- [7. Changes to existing modules](#7-changes-to-existing-modules)
- [8. The entity, file by file](#8-the-entity-file-by-file)
- [9. The mock, file by file](#9-the-mock-file-by-file)
- [10. Tests](#10-tests)
- [11. Docs to update](#11-docs-to-update)
- [12. Left for the next PRs](#12-left-for-the-next-prs)
- [13. Commits and checks](#13-commits-and-checks)
- [14. Checklist](#14-checklist)

## 1. Row in the PR table

| Item | Value |
|---|---|
| Branch | `feat/fe/usage-entities`, from `origin/main` once E8 is merged |
| Title | `feat(frontend): read the usage of the user in a month, by group` |
| Needs | E8, the row above. R1 (merged): `usage` has its place in `moduleImports` (`usage: []`, unchanged) |
| After it | B1 (`feat/fe/monthly-budget`): the budget of the month on the status bar, built on `useMonthlyUsage`. S5 (Settings): the usage section, with the labels of the groupings |
| Docs first | Decisions 9 to 12 fill gaps of `docs/API.md`. The user confirmed them on 2026-10-31, and they are written in the worktree of `docs/fe/api-fields` but not committed. Commit them there before commit 2, because the mock follows them |

`usage` is the first code of its module. It holds one resource, so its files sit at the root of `usage/entities/`, by kind. It gets no entry in `topicEntityModules`. `fileKinds` and `moduleImports` do not change.

## 2. What was read

| Source | What it gives this PR |
|---|---|
| [Frontend implementation plan](frontend-implementation-plan.md) (branch `frontend-plan`): row E9, sections 3 (D8), 6 (E9) and 9 | The endpoint; the copies from `feat/fe/mock`; the part of P7 that D8 gives E9 (`getMonthlyUsage`, `useMonthlyBudget`, the keys and types, the mock of `/me/usage`) and the part it gives B1 (`MonthlyBudgetItem`, `CostMeter`, `query-meta.utils`) |
| [P7 plan](frontend-p7-project-status-plan.md), decision 4 and its table of what goes where | `shared/lib/cost`, `holdsCost`, `runCostEvents` and `query-meta.utils` go to B1. As a result, `useMonthlyBudget`, which reads them, goes to B1 too (decision 7) |
| [E8 plan](frontend-e8-user-plan.md), [E7 plan](frontend-e7-llm-model-plan.md) | The shape of an entity plan; a hook file per resource; the public API follows the readers; the gaps of the API asked first |
| [Prompt: create a frontend entity plan](prompt-create-frontend-entity-plan.md) (branch `frontend-plan`) | The sections of this plan and the rules |
| [API](API.md): Conventions (Errors), Settings and models, the example of `/me/usage` | `GET /me/usage` with `?month=YYYY-MM` (the current month in UTC by default) and `?group_by=` one of `day`, `project`, `agent_role`, `model`; the answer `month`, `budget_usd`, `total`, `groups`. A value of a query parameter that the API does not know answers `400 invalid_request` |
| [Data Shape](DATA_SHAPE.md): Run (Usage), RunStep, User | `Usage` is `{ input_tokens, output_tokens, cache_read_tokens, cache_write_tokens: int, cost_usd: number, duration_ms: int }`; a step has `agent_role`, `model_id` (null when it calls no LLM) and its own `usage`; `monthly_budget_usd` of the user, null for the server default |
| [Web App Modules](architecture/web-app-modules.md), sections 1, 4, 6, 7 and the paragraph on the two usages | `usage` reads no other module; the usage of a run belongs to `run`, the usage of the user in a month to `usage`; `/me/usage` returns the budget, so `usage` needs nothing of `user`; the rule that compares a cost with its limit goes to shared code |
| `frontend/CONTRIBUTING.md`, `frontend/README.md` (Mock data), `src/mocks/README.md` | Files of a slice, keys, the layers and names of a mock folder, the scenarios. The README of `main` describes a `GET /me/usage` that no handler answers (the sentence came with the backup of P7) |
| `docs/skills/feature-sliced-design/SKILL.md`, `docs/skills/clean-review/SKILL.md` | No business logic in shared code; `@x` only between entities, and only when needed; the 7 checks used on each decision below |
| `main` (with E7) | No `modules/usage/`; `runUsageSchema` in `run/entities/runs/runs.types.ts`; `allRuns`, `stepsOfRun` of `mocks/runs/lookup/runs.lookup.ts`; `currentUser` of `mocks/account/account.store.ts` (`monthly_budget_usd: null` in the fixture); `errorResponse` and the answers of `mocks/shared/http/response`, without one for `400`; `pathWithQuery` of `@/shared/lib/url`, which leaves out a parameter without a value; the files of `llm-model/entities/models/` as the model of a resource |
| `origin/feat/fe/artifacts-backup` (P7) | `usage/entities/usage.types.ts` (`monthlyUsageSchema` with `month`, `budget_usd`, `total.cost_usd` only), `usage.keys.ts`, `usage.api.ts`, `usage.constants.ts`, `hooks/useMonthlyBudget.ts` with its tests, `components/MonthlyBudgetItem.tsx`; the handler of `/me/usage` in `mocks/account/me.handlers.ts`, with the scenarios `mock-usage` and `mock-budget`, and its tests |
| `origin/feat/fe/mock` | `usageGroups`, `usageGroupLabels`, `usageSchema` (`group_by`, `total`, `items`) of `features/settings/settings.types.ts`; `getUsage` of `settings.api.ts`; the handler of `/me/usage` in `mocks/account.handlers.ts` over `mockUsageRecords` |
| The fixtures of `main`, measured with a temporary test on 2026-10-31 in the default scenario | 17 runs and 800 steps. The steps of October 2026 cost $4.755 over 7 days (2026-10-02 to 2026-10-08), 12 projects, 8 agent roles and 2 models; 26 of them have no agent role and no cost. The steps of September 2026 cost $1.944. The `usage` of the runs is written by hand and is not the sum of their steps |

## 3. Decisions

The agent applies these as written. They come from the docs and the conventions.

1. **One resource at the root of the slice.** `usage/entities/` holds `usage.types.ts`, `usage.api.ts`, `usage.keys.ts`, `hooks/useUsageQueries.ts`, `__tests__/` and `index.ts`. It has no `constants` file (the endpoint has no page size), no `utils` file (the API function writes its two parameters itself), no `components/` and no `@x/` (no other entity reads `usage`).
2. **The shape of the API, not the one of the branches.** `feat/fe/mock` answered `{ group_by, total, items: [{ key, ...figures }] }`, and the backup read `total.cost_usd` only. The schema follows the API: `monthlyUsageSchema` is `{ month, budget_usd, total: Usage, groups: UsageGroup[] }`, with every field of `Usage`, `z.object`.
3. **`Usage` is a second copy of `runUsageSchema`, written in `usage`.**

   | Option | Evaluation |
   |---|---|
   | a. Read `runUsageSchema` through `run/entities/@x/usage.ts` | `usage` gets `run` in `moduleImports` for one value object, and the usage of the user then depends on the runs, which Web App Modules keeps apart |
   | b. Move the schema to `shared/api/` | A schema of the product in shared code, and a move in `run` for two readers |
   | c. A copy of six fields in `usage.types.ts` | Two copies. The rule of three copies keeps them apart |

   Decision: c. A third reader moves both copies to one place, in a refactor PR (section 6).
4. **Names.** The values of `group_by` are `usageGroupings` with `UsageGrouping`, because `groups` is already the field of the answer, and one entry of it is a `UsageGroup` (`{ key, usage }`). The parameters of the request are `MonthlyUsageParams` (`month`, `groupBy`), in camelCase as the filters of the artifacts; `group_by` is not a filter, so the type is not named `...Filters`.
5. **One API function, one key, one hook, each with the parameters.** `getMonthlyUsage(params = {})` sends `pathWithQuery(apiEndpoints.usage.path(), { month, group_by: groupBy })`. `usageKeys.month(params)` puts the params object in the key, as `artifactKeys.list` puts its filters. The hash of TanStack Query drops `undefined` fields, so `{}` and `{ month: undefined }` share one entry. `useMonthlyUsage(params = {}, { isEnabled })` has the stale time of the query client: the usage changes while runs work, and B1 loads it again at the cost events.
6. **No check of `month` in the app.** The type is `string`. The API refuses a month that is not `YYYY-MM` with `400`, and no screen writes a month yet. The picker of S5 builds its values.
7. **`useMonthlyBudget` goes to B1, and D8 changes with it.** The hook of the backup gives a `CostShare` with `costPercent`, `costLevel` of `shared/lib/cost` and reads `costQueryMeta` of `query-meta.utils`. The P7 plan gives all three to B1, the PR that shows the budget, and so B1 takes the hook too, on `useMonthlyUsage()`. The table of D8 in the implementation plan moves the line (section 11).
8. **The public API follows the readers.** `index.ts` exports `getMonthlyUsage`, `usageKeys`, `useMonthlyUsage`, the types `MonthlyUsage`, `MonthlyUsageParams`, `Usage`, `UsageGroup`, `UsageGrouping`, and `usageGroupings`, which the validator of the mock reads (as E8 exports `themes` for its mock). It does not export the schemas. A mock reads an entity through its `index.ts` only.

Gaps of `docs/API.md`. The user confirmed them on 2026-10-31, and they are written in the worktree of `docs/fe/api-fields` (docs-first rule; the mock follows them):

9. **Order of the groups.** `groups` has one entry for each key with usage in the month. The entries of `day` are ordered by `key`; the others by `cost_usd` descending, with ties broken by `key`. A day without a step has no entry.
10. **Steps without an LLM call.** A step without an agent role or a model calls no LLM. It is in no group of `agent_role` or `model`. As a result, the groups add up to the tokens and the cost of `total`, and only `total` holds the time of such a step.
11. **Month and day of a step.** The usage of a step counts in the month and the day, in UTC, of its `started_at`.
12. **Wrong parameters, months without usage.** A `month` that is not `YYYY-MM`, or a `group_by` out of its list, answers `400 invalid_request`, as the Errors table of the API says for an unknown value of a query parameter. A month without usage, such as a month to come, answers `200` with `total` at zero and no groups.

The mock:

13. **The mock sums the steps of the runs.** The API records the usage per step (decision D6 of the API), and decisions 9 to 11 read the agent role, the model and the time of a step. The lookup reads `allRuns()` and `stepsOfRun(run.id)` of `mocks/runs/lookup/runs.lookup.ts` and sums the steps whose `started_at` is in the month. The project of a step is the `project_id` of its run. The `usage` of the runs, written by hand, is not read, so `total` and each grouping add up in the same way. The tokens and times are integers; the costs are rounded to the millionth of a dollar to drop the error of the float sums.
14. **The month of the mock data is the current month.** Without `?month=`, the mock reads `mockUsageMonth`, `'2026-10'`, the month of the fixtures, as the backup did. As a result, the usage shows the runs of the fixtures whatever the date. The answer names that month in `month`. The runs that the mock starts have no steps (`stepsOfRun` gives none), so they add no usage.
15. **The budget.** `budget_usd` is `currentUser.get().monthly_budget_usd`, else `serverBudgetUsd`, `20`, the budget that the server gives a user without one of their own. The fixtures spend $4.755 of $20 in October, 23%.
16. **The budget scenarios keep the answer whole.** The backup replaced `total.cost_usd` by a share of the budget, which left the tokens and the groups as they were. Instead, `?mock-budget=warning` and `danger` set `budget_usd` so that the cost of the month spends 86% or 95% of it: the cost divided by the share, rounded down to the cent. With the fixtures, that gives $5.52 (86%) and $5.00 (95%). `?mock-budget=none` answers `budget_usd: null`, a month without a limit. A month without cost keeps the budget of the user in every scenario.
17. **The 400 answer.** `mocks/shared/http/response` has no answer for `400`. `invalidRequest(detail)` joins `error-response.utils.ts`, with the code `ApiErrorCode.InvalidRequest` and the title `Invalid request`, beside `invalidState`.
18. **A mock folder of its own.** `mocks/usage/` holds the resource. `mocks/account/` keeps the session, the user and the sessions; the usage reads the user through `currentUser` and the runs through their lookup, as `runs.lookup.ts` reads the model settings.
19. **Each piece in the place of its role.** Checked file by file, with the rules of CONTRIBUTING (Inside a slice, Types and constants) and of the mock README (Layers):

    | Piece | Place | Why there |
    |---|---|---|
    | Schemas, the values of `group_by`, the parameters | `usage.types.ts` | A `types` file defines the values of its subject; the parameters are a type of the request |
    | The request | `usage.api.ts` | Only `api` files call `apiRequest` |
    | The keys | `usage.keys.ts` | One factory for the resource |
    | The query hook | `hooks/useUsageQueries.ts` | `use<Resource>Queries.ts`, as `useModelQueries.ts` |
    | The cost against the budget, its levels, the meter, its words | Not in this PR | B1 (decision 7, section 12) |
    | The labels of the groupings | Not in this PR | S5, with the screen that shows them (section 12) |
    | `mockUsageMonth`, `serverBudgetUsd`, `budgetShares` | `mocks/usage/usage.constants.ts` | Settings of the mock; a constants file declares no function |
    | The sums, the groups, the budget | `mocks/usage/usage.lookup.ts` | A lookup reads the state of the mock server; it reads the scenario of the budget as `allRuns` reads `mock-runs` |
    | The check of the query | `mocks/usage/usage.validators.ts` | A validator reads what the request sends |
    | `invalidRequest` | `mocks/shared/http/response/error-response.utils.ts` | An answer of the API that any handler may give |

## 4. Scope

Endpoint: `GET /me/usage`, with `?month=` and `?group_by=`. Commit 2 adds `usage` to `apiEndpoints`.

Copy (read with `git show <ref>:frontend/src/<path>`):

| Copy | From | To | What changes |
|---|---|---|---|
| `usageGroups` | `origin/feat/fe/mock`, `features/settings/settings.types.ts` | `usage/entities/usage.types.ts` | Named `usageGroupings`, `UsageGrouping` (decision 4) |
| `monthlyUsageSchema`, `MonthlyUsage` | `origin/feat/fe/artifacts-backup`, `modules/usage/entities/usage.types.ts` | the same file | Every field of the API: `total: usageSchema`, `groups: z.array(usageGroupSchema)` (decision 2); the TODO line of the generated types kept |
| `getMonthlyUsage` | the backup, `usage.api.ts` | `usage/entities/usage.api.ts` | `apiEndpoints.usage`; `apiRequest` of `@/shared/api/request`; the params of decision 5. `getUsage` of `feat/fe/mock` is the same request with `group_by` and is not copied |
| `usageKeys` | the backup, `usage.keys.ts` | `usage/entities/usage.keys.ts` | `month(params)` takes the params |
| The handler of `/me/usage` | the backup, `mocks/account/me.handlers.ts` | `mocks/usage/usage.handlers.ts` | The layers of a mock folder; the groups; the check of the query; the budget scenarios of decision 16 |
| `monthlyUsageCases` | the backup, `mocks/account/__tests__/me.handlers.data.ts` | `mocks/usage/__tests__/usage.handlers.data.ts` | The cases of section 10 |

Write: the schemas `usageSchema` and `usageGroupSchema`, `MonthlyUsageParams`, the hook, the public API, the endpoint, `invalidRequest`, the constants, lookup, validators and handlers of the mock, the tests, the docs.

Not copied:

| Code | Why |
|---|---|
| `useMonthlyBudget`, its tests, `MonthlyBudgetItem`, `usageMessages`, `CostMeter`, `shared/lib/cost`, `query-meta.utils` | B1 (decision 7) |
| `usageGroupLabels` | The words of the groupings are `Wording` for each view; Usability and Skeletons do not describe the usage section yet, so S5 writes them with its screen |
| `usageSchema` and `UserUsage` of `feat/fe/mock` | The old shape (decision 2) |
| `mockUsageRecords` and the handler of `feat/fe/mock` | The mock sums the steps of the runs (decision 13) |
| `UsageView` of `feat/fe/mock` | A screen of the old frame; S5 |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| API function | verb + object; `get` reads one | `getMonthlyUsage` |
| Query hook | `use` + object | `useMonthlyUsage` |
| Hook file | `hooks/use<Resource>Queries.ts` | `hooks/useUsageQueries.ts` |
| Key factory | `<resource>Keys` | `usageKeys` (`all`, `month`) |
| Parameters of the request | `<Object>Params` | `MonthlyUsageParams` |
| List of values and its type | in the `types` file | `usageGroupings` with `UsageGrouping` |
| Entity types | the names of Data Shape and the API | `Usage`, `UsageGroup`, `MonthlyUsage` |
| Endpoint | `apiEndpoints.<name>` | `usage` (`/me/usage`) |
| Mock settings | camelCase in `usage.constants.ts` | `mockUsageMonth`, `serverBudgetUsd`, `budgetShares` |
| Mock reads | never the name of an API function | `usageOfMonth(month, grouping)`, `budgetOfMonth(costUsd)` |
| Mock checks | `validate<What>` | `validateUsageQuery(query)` |
| Mock answer | after the code of the API | `invalidRequest(detail)` |
| Scenarios | `mock-<group>` | `mock-usage` (`empty`, `error`, `loading`), `mock-budget` (`warning`, `danger`, `none`) |

## 6. Shared code first

### Reuse

| Need | Use | From |
|---|---|---|
| The path of the endpoint | `apiEndpoint`, `apiEndpoints.usage` (new) | `@/shared/api/endpoints` |
| A request | `apiRequest` | `@/shared/api/request` |
| The query of the request | `pathWithQuery` | `@/shared/lib/url` |
| The options of a query hook | `HookQueryOptions` | `@/shared/api/query-client` |
| Mock: scenario and page parameter | `answerScenario`, `pageUrlParam` | `mocks/shared/scenario` |
| Mock: the query of a request | `queryOf` | `mocks/shared/http/request` |
| Mock: a value of a list | `choice` | `mocks/shared/http/validation` |
| Mock: answers | `errorResponse` (through `invalidRequest`) | `mocks/shared/http/response` |
| Mock: the runs and their steps | `allRuns`, `stepsOfRun` | `mocks/runs/lookup/runs.lookup.ts` |
| Mock: the user | `currentUser` | `mocks/account/account.store.ts` |
| Tests | `itSendsRequests`, `itThrowsApiErrors`, `itNestsQueryKeys`, `itTellsQueryKeysApart`, `itWaitsUntilEnabled`, `itRejectsRequests` | `@/test/suites` |
| Tests | `getApi`, `openPage`, `serverErrorOn` | `@/test/msw` |
| Tests | `renderHookWithProviders`; `waitForSuccess` | `@/test/render`; `@/test/steps` |
| Tests | `projectIds`, `userId` | `mocks/shared/db` |

### Extract before the new code

| Code | Path | Why |
|---|---|---|
| `invalidRequest(detail)` | `mocks/shared/http/response/error-response.utils.ts`, exported from its `index.ts` | An answer of the API with no helper yet; the handler of E9 is its first reader, and every handler that refuses a query parameter will call it (decision 17) |

A search of `src/` for what E9 would write a third time finds nothing else.

### Checked, not extracted

| Code | Copies | Why it stays |
|---|---|---|
| The `Usage` schema | `runUsageSchema` of `run`, `usageSchema` of `usage`: two | Decision 3; a third reader moves them |
| The sum of usages | `sumUsage` of `usage.lookup.ts`: one. The fixtures of the runs set their usage by hand | Private to the lookup |
| A cost rounded to a precision | `roundedCost` of `usage.lookup.ts` (to the millionth), and the rounding to the cent of the budget in the same file: one file | Two lines; private |
| A month `YYYY-MM` | the pattern of `validateUsageQuery`: one | Private to the validator; a second reader of a month moves it to `mocks/shared/http/validation` |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `mocks/shared/http/response/error-response.utils.ts` | `invalidRequest(detail: string)`: `errorResponse(HttpStatus.BadRequest, ApiErrorCode.InvalidRequest, 'Invalid request', detail)`, with the JSDoc "A request whose query the API does not read, such as a value out of the list of a parameter" | 1 |
| `mocks/shared/http/response/index.ts` | Exports `invalidRequest` | 1 |
| `mocks/shared/http/response/__tests__/error-response.utils.data.ts` | A case of `errorResponseCases`: `invalidRequest('Send the month as YYYY-MM.')` answers 400 with the code `invalid_request` | 1 |
| `shared/api/endpoints/api-endpoints.constants.ts` | `usage: apiEndpoint('/me/usage')`, after `modelSettings` | 2 |
| `mocks/api.setup.ts` | `...usageHandlers`, after `modelSettingHandlers` | 2 |
| `mocks/account/me.fixtures.ts` | No change: `monthly_budget_usd` stays null, so the user has the budget of the server | - |

No change: `moduleImports`, `topicEntityModules`, `fileKinds`, the `run` entities and their mocks.

## 8. The entity, file by file

```text
modules/usage/entities/
├── index.ts
├── usage.api.ts
├── usage.keys.ts
├── usage.types.ts
├── hooks/
│   ├── useUsageQueries.ts
│   └── __tests__/
│       └── useUsageQueries.test.ts
└── __tests__/
    ├── usage.api.data.ts
    ├── usage.api.test.ts
    ├── usage.keys.data.ts
    └── usage.keys.test.ts
```

| File | Holds | Reuses |
|---|---|---|
| `usage.types.ts` | `usageGroupings`, `UsageGrouping`; `usageSchema`, `Usage`; `usageGroupSchema`, `UsageGroup`; `monthlyUsageSchema`, `MonthlyUsage`; `MonthlyUsageParams` | `zod` |
| `usage.api.ts` | `getMonthlyUsage(params)` | `apiEndpoints`, `apiRequest`, `pathWithQuery` |
| `usage.keys.ts` | `usageKeys` | - |
| `hooks/useUsageQueries.ts` | `useMonthlyUsage(params, options)` | `useQuery`, `HookQueryOptions` |
| `index.ts` | The public API of decision 8 | - |

The types:

```ts
import { z } from 'zod'

// Temporary hand-written schemas for the usage API.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

/** What the usage of a month is grouped by: the day, the project, the agent role or the model. */
export const usageGroupings = ['day', 'project', 'agent_role', 'model'] as const
export type UsageGrouping = (typeof usageGroupings)[number]

/** The tokens, cost and time that the steps of the user used. */
export const usageSchema = z.object({
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  cache_read_tokens: z.number().int(),
  cache_write_tokens: z.number().int(),
  cost_usd: z.number(),
  duration_ms: z.number().int(),
})
export type Usage = z.infer<typeof usageSchema>

/** The usage of one day, project, agent role or model of the month. */
export const usageGroupSchema = z.object({
  /** The id of the project, the day (`YYYY-MM-DD`), the agent role or the model. */
  key: z.string(),
  usage: usageSchema,
})
export type UsageGroup = z.infer<typeof usageGroupSchema>

/** The usage of the user in one calendar month in UTC, with the budget that applies to it. */
export const monthlyUsageSchema = z.object({
  /** `YYYY-MM`. */
  month: z.string(),
  /** In USD: the budget of the user, or the default of the server; null when the month has no limit. */
  budget_usd: z.number().nullable(),
  total: usageSchema,
  /** Empty unless the usage is grouped; one entry for each key with usage. */
  groups: z.array(usageGroupSchema),
})
export type MonthlyUsage = z.infer<typeof monthlyUsageSchema>

/** Which month to read, the current one when left out, and what to group it by, nothing when left out. */
export interface MonthlyUsageParams {
  /** `YYYY-MM`, in UTC. */
  month?: string | undefined
  groupBy?: UsageGrouping | undefined
}
```

The API function:

```ts
// TODO: switch to the generated client in src/shared/api/generated/ once it is generated.

/** The usage of the user in a month, with the budget of the month and, when asked, its groups. */
export function getMonthlyUsage({ month, groupBy }: MonthlyUsageParams = {}): Promise<MonthlyUsage> {
  return apiRequest(
    pathWithQuery(apiEndpoints.usage.path(), { month, group_by: groupBy }),
    monthlyUsageSchema,
    { action: 'load your usage' },
  )
}
```

The keys:

```ts
/** The query keys of the usage of the user, from the widest to the narrowest. */
export const usageKeys = {
  all: () => ['usage'] as const,
  /** The usage of one month, grouped or not. */
  month: (params: MonthlyUsageParams) => [...usageKeys.all(), 'month', params] as const,
}
```

The hook:

- `useMonthlyUsage(params: MonthlyUsageParams = {}, { isEnabled = true }: HookQueryOptions = {})`: `useQuery` on `usageKeys.month(params)`, `queryFn: () => getMonthlyUsage(params)`, `enabled: isEnabled`. JSDoc: the usage of the user in a month, the current one by default, with the budget of the month; it changes while the runs of the user work, so a screen that shows it loads `usageKeys.all()` again when a run changes its cost.

## 9. The mock, file by file

```text
mocks/usage/
├── usage.constants.ts
├── usage.lookup.ts
├── usage.validators.ts
├── usage.handlers.ts
└── __tests__/
    ├── usage.lookup.data.ts
    ├── usage.lookup.test.ts
    ├── usage.validators.data.ts
    ├── usage.validators.test.ts
    ├── usage.handlers.data.ts
    └── usage.handlers.test.ts
```

| File | Holds | Reuses |
|---|---|---|
| `usage.constants.ts` | `mockUsageMonth = '2026-10'` (decision 14); `serverBudgetUsd = 20` (decision 15); `budgetShares = { warning: 0.86, danger: 0.95 } as const` (decision 16). Each with a comment that says what it is | - |
| `usage.lookup.ts` | `usageOfMonth(month: string, grouping: UsageGrouping \| null): MonthlyUsage`; `budgetOfMonth(costUsd: number): number \| null`; the private `stepsOfMonth`, `sumUsage`, `groupKey`, `byGroupOrder`, `roundedCost` | `allRuns`, `stepsOfRun`, `currentUser`, `pageUrlParam`, the constants |
| `usage.validators.ts` | `validateUsageQuery(query: URLSearchParams)`: `{ month: string; grouping: UsageGrouping \| null }` or `{ problem: string }`; the private `monthPattern` | `choice`, `usageGroupings`, `mockUsageMonth` |
| `usage.handlers.ts` | `usageHandlers`: `GET usage.pattern` | section 6 |

The lookup:

- `stepsOfMonth(month)`: each step of `allRuns()` whose `started_at` starts with `${month}-`, with the `project_id` of its run (decision 11).
- `sumUsage(usages: Usage[]): Usage`: the sum of each field, `cost_usd` through `roundedCost`; zero for no usage.
- `groupKey(grouping, step, projectId): string | null`: `day` is `started_at.slice(0, 10)`, `project` is the `projectId`, `agent_role` is `step.agent_role`, `model` is `step.model_id`. A null key leaves the step out of the groups (decision 10).
- `byGroupOrder(grouping)`: the comparison of decision 9. `day` compares `key`. The others compare `cost_usd` descending, then `key`.
- `usageOfMonth(month, grouping, steps = stepsOfMonth(month))`: `{ month, budget_usd: budgetOfMonth(total.cost_usd), total, groups }`. `total` sums the steps. `groups` is `[]` when `grouping` is null; otherwise one group for each key, ordered. The `empty` scenario passes `steps` as `[]`.
- `budgetOfMonth(costUsd)`: the budget of the user, `currentUser.get().monthly_budget_usd ?? serverBudgetUsd`. With `mock-budget=none`, null. With `warning` or `danger` and a cost above zero, `Math.floor((costUsd / share) * 100) / 100` (decision 16).
- `roundedCost(usd)`: `Math.round(usd * 1_000_000) / 1_000_000`.

The checks of the query (decision 12). They follow the API, not a rule of the app:

| Parameter | Rule | Problem (`detail` of the 400) |
|---|---|---|
| `month` | Left out: `mockUsageMonth`. Otherwise it matches `^\d{4}-(0[1-9]\|1[0-2])$` | `'Send the month as YYYY-MM.'` |
| `group_by` | Left out: null. Otherwise one of `usageGroupings` | `'Choose day, project, agent_role or model to group by.'` |

The handler, in the order of the mock README (`answerScenario`, the record, the checks, the change, the answer). The resource has no record to find and nothing to change:

- `GET usage.pattern`: `const scenario = await answerScenario('usage')`. Then `validateUsageQuery(queryOf(request))`; a `problem` answers `invalidRequest(problem)`. Then `HttpResponse.json(scenario === 'empty' ? usageOfMonth(month, grouping, []) : usageOfMonth(month, grouping))`. The query is checked in every scenario, so the empty scenario still refuses a wrong month.

Scenarios:

| Parameter | Values | What shows |
|---|---|---|
| `mock-usage` | `empty` | A month without usage: `total` at zero, no groups, the budget of the user |
| | `error`, `loading` | `500`, or no answer |
| `mock-budget` | `warning`, `danger` | The cost of the month spends 86% or 95% of `budget_usd` ($5.52, $5.00 with the fixtures) |
| | `none` | `budget_usd: null` |

What the mock data then holds: in October 2026, $4.755 against a budget of $20, over 7 days, 12 projects, 8 agent roles and 2 models (`anthropic:claude-sonnet-5` first, then `openai:gpt-4.1-mini`); in September 2026, $1.944; any other month, nothing. `?mock-runs=empty` leaves no run, so every month is empty.

## 10. Tests

Data-driven where the cases share one flow (CONTRIBUTING, Testing). Every new reader and handler has cases for what it refuses. The numbers are those of the fixtures in the default scenario, measured on 2026-10-31. A test compares costs with `toBeCloseTo(value, 6)`.

| Test | Cases |
|---|---|
| `usage/entities/__tests__/usage.api.test.ts` with `.data.ts` | `itSendsRequests`: `getMonthlyUsage()` (`GET /me/usage`), `getMonthlyUsage({ month: '2026-09', groupBy: 'model' })` (`GET /me/usage?month=2026-09&group_by=model`). `itThrowsApiErrors`: 500 through `serverErrorOn`, with the message `Failed to load your usage (HTTP 500)`. Against the mock: `getMonthlyUsage({ month: '2026-13' })` rejects with an `ApiError` of status 400 and code `invalid_request`; `getMonthlyUsage()` answers the month `2026-10`, `budget_usd` 20, a total cost of 4.755 and no groups; with `groupBy: 'agent_role'`, 8 groups, `interviewer` first |
| `usage/entities/__tests__/usage.keys.test.ts` with `.data.ts` | `itNestsQueryKeys`: `month({})` and `month({ month: '2026-09', groupBy: 'day' })` start with `all()`. `itTellsQueryKeysApart`: `month({})` and `month({ groupBy: 'day' })`; `month({ month: '2026-09' })` and `month({ month: '2026-10' })` |
| `usage/entities/hooks/__tests__/useUsageQueries.test.ts` | `useMonthlyUsage()` loads the month of the mock data; `useMonthlyUsage({ groupBy: 'model' })` loads 2 groups; `itWaitsUntilEnabled` for `isEnabled: false` |
| `mocks/usage/__tests__/usage.lookup.test.ts` with `.data.ts` | `usageOfMonth('2026-10', null)`: cost 4.755, no groups. `'2026-09'`: cost 1.944. `'2026-11'`: every field zero, no groups. For each grouping (data-driven): the count (day 7, project 12, agent_role 8, model 2), the first key (`2026-10-02`, `projectIds.mentor`, `interviewer`, `anthropic:claude-sonnet-5`), the order of decision 9, and the sum of the costs and tokens of the groups equal to the total. For `agent_role` and `model`: no null key, and the sum of the times below the total time. `budgetOfMonth(4.755)`: 20; with `monthly_budget_usd` 50 set on `currentUser`, 50; with `?mock-budget=warning` 5.52, `danger` 5, `none` null; `budgetOfMonth(0)` with `warning`: 20 |
| `mocks/usage/__tests__/usage.validators.test.ts` with `.data.ts` | Accepted: no parameter (`mockUsageMonth`, null); `month=2026-01`; each value of `group_by`. Refused, each with its problem: `month=2026-13`, `month=2026-1`, `month=abc`, `month=` (empty), `group_by=week`, `group_by=` (empty) |
| `mocks/usage/__tests__/usage.handlers.test.ts` with `.data.ts` | `GET /me/usage` answers the month of the mock data with `groups: []`; `?group_by=day` answers 7 groups in the order of their days; `?month=2026-11` answers zeros; `?mock-usage=empty` answers zeros and the budget; `?mock-budget=warning`, `danger`, `none`; `itRejectsRequests`: `?month=2026-13` and `?group_by=week` (400, `invalid_request`), the error scenario (500) |
| `mocks/shared/http/response/__tests__/error-response.utils.test.ts` | The case of section 7 |

## 11. Docs to update

Docs first, on `docs/fe/api-fields` (written in its worktree on 2026-10-31, not committed): `docs/API.md`, Settings and models, two bullets under the example of `/me/usage`, which hold decisions 9 to 12. Data Shape does not change.

In the PR (last commit):

| Doc | Change |
|---|---|
| `docs/architecture/web-app-modules.md`, section 1, tree | A new entry after `llm-model/`: `usage/` with `entities/  # MonthlyUsage` |
| Same, section 6, row `usage` | Entities: "MonthlyUsage, the usage of the user in a calendar month, with the budget of the month and its groups"; State: "The entities; the budget on the status bar with B1, the usage section with Settings" |
| `docs/architecture/web-app.md`, section 9 | A row "Usage": `usage`, entities; `modules/usage/entities/usage.api.ts`, `usage.types.ts`, `hooks/useUsageQueries.ts` |
| `frontend/README.md`, Mock data | A row `usage`: `GET /me/usage`: the steps of the runs summed by month, and by day, project, agent role or model with `?group_by=`; the month of the mock data by default; a wrong `month` or `group_by` answers 400 |
| `src/mocks/README.md` | The sentence on `GET /me/usage` in Mock data becomes: "`GET /me/usage` sums the steps of the runs that started in a month, October 2026 by default, the month of the mock data; the budget is the $20 that the server gives a user without one of their own." Rows of `mock-usage` (`empty`, `error`, `loading`) and `mock-budget` (`warning`, `danger`, `none`) in Parameters; rows of the states of the table of states for a month without usage (`?mock-usage=empty`) and a budget near its limit (`?mock-budget=warning`) |
| `docs/frontend-implementation-plan.md` (on `frontend-plan`) | Row E9: "As built", with what differs from this plan. Section 3, D8: the line of `useMonthlyBudget` moves from E9 to B1 (decision 7). Section 6, E9: the copies as renamed here. The checklist |

## 12. Left for the next PRs

The agent writes no code for these; they go in the docs where named.

| Item | When | Note |
|---|---|---|
| The share of the budget spent and its level (`useMonthlyBudget`, `shared/lib/cost`, `CostShare`), the meter on the status bar (`MonthlyBudgetItem`, `CostMeter`), the reload of the usage at the cost events (`costQueryMeta`, `holdsCost`) | B1 | Decision 7; B1 reads `useMonthlyUsage()` and the `mock-budget` scenarios of this PR |
| The usage section of Settings: the picker of the month and of the grouping, the labels of the groupings, the table of the groups, the names of the projects and the models by their keys | S5 | Usability and Skeletons describe the section first (docs-first rule); the labels are `usageGroupingLabels`, a `Record<UsageGrouping, Wording>` of the entity, written with the screen |
| One `Usage` schema for `run` and `usage` | The PR of a third reader | Decision 3 |
| Steps of the runs that the mock starts | Not planned | Decision 14: they add no usage |
| `usage` of the run fixtures equal to the sum of their steps | A fix PR of the mocks | Decision 13: the usage of the user reads the steps; the run detail still shows the usage written by hand |

## 13. Commits and checks

1. `feat(frontend): answer 400 for a query that the API does not read in the mocks`: `invalidRequest`, its export, its test case
2. `feat(frontend): mock the usage of the user by month and by group`: `usageGroupings`, `UsageGrouping`, the schemas and `MonthlyUsageParams` in `usage.types.ts` (the lookup reads the types), the endpoint, `mocks/usage/`, `api.setup.ts`, the mock tests
3. `feat(frontend): read the usage of the user in a month, by group`: `usage.api.ts`, `usage.keys.ts`, `hooks/useUsageQueries.ts`, `index.ts`, their tests
4. `docs(frontend): describe the usage entities and their mock in the guides`

The mock comes before the API function, so that the tests of commit 3, which run against the mock, pass on each commit. The mock reads `Usage`, `UsageGrouping`, `MonthlyUsage` and `usageGroupings` through `@/modules/usage/entities`, so commit 2 holds `usage.types.ts` whole and an `index.ts` with those exports. Files of two commits: `index.ts` (2: the types and `usageGroupings`; 3: the function, the keys and the hook).

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on `src/modules/usage`, `src/mocks/usage`, `src/mocks/shared/http`; `pnpm typecheck` once, since types, exports and a new module change. No full suite, E2E, screenshots or build: no layout imports `usage`. A test that times out only when run with the others is run again alone before it counts as a failure. Then:

- `grep -rnE "FR-[0-9]|NFR-[0-9]|docs/" frontend/src/modules/usage frontend/src/mocks/usage` answers nothing; `grep -rniE "backend|frontend|\bUI\b|dashboard"` on the new comments too.
- `grep -rnwE "usageGroups|UserUsage|getUsage|useMonthlyBudget|MonthlyBudgetItem|mockUsageRecords" frontend/src` answers nothing.
- `grep -nP '[^\x00-\x7F]'` on each changed doc shows only tree lines.
- No `console.log`; nothing committed or pushed without the user.

## 14. Checklist

- [x] Decisions 9 to 12 confirmed by the user (2026-10-31)
- [x] Those rules written in `docs/API.md` in the worktree of `docs/fe/api-fields` (2026-10-31)
- [ ] That change committed on `docs/fe/api-fields`
- [ ] E8 merged (#51)
- [ ] The branch cut from `origin/main`
- [ ] Commit 1: `invalidRequest` with its test
- [ ] Commit 2: the types, the endpoint and the mock, every new mock file tested
- [ ] Commit 3: the entity: the API function, the key, the hook and their tests
- [ ] Commit 4: docs
- [ ] Every state reachable in `pnpm dev:mock` through a scenario of section 9
- [ ] Only the checks of section 13 ran
- [ ] Row E9, D8 and section 6 of the implementation plan updated
- [ ] The description of the PR written from this plan; the endpoint it lists checked against `usage.api.ts`
