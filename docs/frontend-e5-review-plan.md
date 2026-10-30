# E5 `review` entities: plan

Draft of 2026-10-29, for an agent to implement. Not committed. Next PR after E4 (`feat/fe/run-entities`, merged as #42).

Short paths: `review/entities/...` is `frontend/src/modules/review/entities/...`, `mocks/...` is `frontend/src/mocks/...`, `test/...` is `frontend/src/test/...`; any other path that starts with `modules/` or `shared/` is under `frontend/src/`.

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
| Branch | `feat/fe/review-entities`, from `origin/main` (E4 is merged) |
| Title | `feat(frontend): read the interrupts of a run and answer them` |
| Needs | E1 (artifact refs), E4 (run schema, polling), I1 (idempotency keys); all merged |
| After it | E6 `thread`, then P7; S2 builds `review/features/answer` and `review/widgets/panel` on it |
| Docs first | The `change_reason` `reviewed` of decision 6 is written on `docs/fe/run-api-fields`; merge that branch before E5 is opened, so that the mock of the resume (commit 3) follows docs that are on `main` |

The module `review` already has its place: `moduleImports.review` is `['workflow', 'artifact', 'run']` in `frontend/lint/lib/modules/module-imports.constants.js`. No lint list changes.

## 2. What was read

| Source | What it gives this PR |
|---|---|
| [Frontend implementation plan](frontend-implementation-plan.md), row E5 and D7 | The endpoints; the copies from `feat/fe/mock`; `resumeRun` takes the idempotency key |
| [API](API.md), Runs | `GET /runs/{run_id}/interrupts` (with `?status=pending`), `POST /runs/{run_id}/resume`: body, rules, `202` with the run, `409 invalid_state`, `422` with the question key in the field path |
| [Data Shape](DATA_SHAPE.md), Interrupt and HumanDecision | The fields, the statuses (`pending`, `resolved`, `cancelled`), `Question.source`, the rules of `Answer` by question type, the options of version 1 |
| [Web App](architecture/web-app.md), sections 4, 5 and 10 | The pending interrupt is replayed with the steps; one panel serves every checkpoint; interrupts resolved with the defaults are listed in the history; the files of `review` |
| [Web App Modules](architecture/web-app-modules.md), sections 5, 6 and 9 | `review` holds Interrupt and HumanDecision, the feature `answer`, the widget `panel`; the blocks that read `review` |
| [E4 plan](frontend-e4-run-plan.md) and [E4 review](frontend-e4-run-review.md) | The shape of an entity PR, the names, the polling with `LiveRunQueryOptions`, the mock rules, the open phase M items |
| `frontend/CONTRIBUTING.md`, `frontend/README.md` (Mock data), `src/mocks/README.md` | Files of a slice, hooks, keys, types and constants, naming, the reuse table, the layers of a mock folder |
| `origin/feat/fe/mock` | `features/review/review.types.ts`, `review.api.ts`, `review-form.utils.ts`, `hooks/*`, `mocks/interrupts.handlers.ts`, the `pendingReviewSchema` of the console |

## 3. Decisions

Taken from the docs and the conventions; the agent applies them as written:

1. **Files by kind at the root of the slice.** `review` reads one resource, the interrupts of a run; the resume answers one of them. CONTRIBUTING, Files of a slice: one resource gives one file of each kind, named after it (`interrupts.api.ts`, `interrupts.keys.ts`, `interrupts.types.ts`). No topic folders, no change to `topicEntityModules`.
2. **One name for one concept.** The option of an interrupt is the option of its checkpoint, and the answer is the same shape in the definition and in the decision. `review` imports `checkpointOptionSchema`, `checkpointQuestionSchema` and `questionAnswerSchema` of `workflow` through `@x/review` and declares only what differs: `InterruptQuestion` is a checkpoint question with `source`. No `ReviewOption`, `Answer` or `Question` as on `feat/fe/mock`.
3. **The mutation hook waits for S2.** The entity holds `resumeRun(runId, body, idempotencyKey)`; `useAnswerReview` (or `useResumeRun`) belongs to `review/features/answer`, with its key made once per submit (D7 of the implementation plan).
4. **The rules of the answer form wait for S2.** `review-form.utils.ts` of `feat/fe/mock` has one user, the feature `answer`, so it is copied with that feature (section 12). The mock checks the resume body with its own validators, written from the API rules, as E4 item 23 decided for the run settings: the mock must not repeat a mistake of the app.
5. **The mock derives the interrupts from the steps.** Every step of a run at a checkpoint node of the definition is one interrupt; its status follows the step and the run, and a store keeps the answers. No list of interrupt fixtures to keep in step with the run fixtures.

Confirmed by the user on 2026-10-29:

6. **The revision that an approval writes.** Data Shape: when the chosen option approves, the artifact and its `draft` items get `review_status` `approved`; a lifecycle field changes "as a new version of the same item". The list of `change_reason` (`generated`, `user_edit`, `rework`, `restored`, `deleted`) had no value for it.

   | Option | Evaluation |
   |---|---|
   | a. Add `reviewed` to `change_reason` in Data Shape ("a decision at a checkpoint changed the review status"), then to `changeReasons` of `artifact/entities/types/revisions.types.ts` | Follows the rule of new versions; the history tells an approval apart from an edit. One docs commit and one line of the artifact entity |
   | b. Change `review_status` without a new version | Breaks "as a new version of the same item"; the version of an approved item stays the one under review |
   | c. Use `user_edit` | The history reads as if the user edited the content |

   Decision: a. Done on 2026-10-29 in the worktree of `docs/fe/run-api-fields` (`D:/Documents/DA/khoai-lang-graph-docs`), not committed:

   - `docs/DATA_SHAPE.md`: `reviewed` in the `change_reason` of ArtifactRevision and ItemRevision; the paragraph of the revisions says that a decision whose option approves writes a revision with `reviewed`, and its `human_decision_id`, on the artifact under review and on each item whose `review_status` it changes; "Review applies to the artifact" says each approval is a new version with `change_reason` `reviewed`.
   - `docs/API.md`, resume rules: the approved artifacts and items each get a new version with `change_reason` `reviewed`.
   - `docs/architecture/database.dbml`: `reviewed` in `Enum change_reason`, and `docs/architecture/diagrams/database/artifacts-and-trace.svg` rendered again with `pnpm render` of `scripts/db-diagram/` (the other diagrams did not change).

   The API body of a revision still has no `human_decision_id`, so `Revision` of `artifact/entities` stays without it. In the frontend only `changeReasons` of `artifact/entities/types/revisions.types.ts` lists the values; it gains `'reviewed'` in commit 2.

7. **When the pending interrupt is read.** Only an interrupted run waits for an answer.

   | Option | Evaluation |
   |---|---|
   | a. `isEnabled` only; each caller passes `run.status === 'interrupted'` | The rule is written by every caller (status bar, steps tree, chat, panel) |
   | b. `usePendingInterrupt(runId, { runStatus })`: it loads only while `runStatus` is `interrupted`; no polling; the answer and the `interrupt` event load it again | The rule is in one place; `runStatus` is required, so no caller forgets it |
   | c. Always load it | One request for every run on screen that is not interrupted |

   Decision: b. `usePendingInterrupt(runId, { runStatus })` calls the API only while the run is `interrupted`, and never polls.

## 4. Scope

Endpoints: `GET /runs/{run_id}/interrupts` (all, or `?status=pending`), `POST /runs/{run_id}/resume`.

Copy from `origin/feat/fe/mock` (read with `git show origin/feat/fe/mock:frontend/src/<path>`):

| Copy | To | What changes |
|---|---|---|
| `interruptSchema` of `features/review/review.types.ts` | `review/entities/interrupts.types.ts` | Options and questions from `workflow` (decision 2); `step_id` not null; `status` with `cancelled`; `review_artifacts` is `artifactRefSchema` of `artifact` |
| `ResumeBody` of the same file | the same file, as `ResumeRunBody` | Request bodies end in `Body` with the name of the action; `modified_items` is `ModifiedItem[]` (`Pick<ItemRef, 'item_id' \| 'version'>`) |
| `getPendingInterrupt`, `resumeRun` of `features/review/review.api.ts` | `review/entities/interrupts.api.ts` | `findPendingInterrupt` (it may answer null, CONTRIBUTING: `find...`); `apiEndpoints`, `fetchPage`, `pathWithQuery`; `resumeRun` takes the key as a parameter instead of making one, and parses the run with `runSchema` |
| The four agent questions of `mocks/interrupts.handlers.ts` | `mocks/interrupts/interrupts.fixtures.ts` | Typed `InterruptQuestion[]`; named `agentQuestionFixtures` |
| The checks of the resume handler of the same file | `mocks/interrupts/interrupts.validators.ts` | Rewritten on the readers of `mocks/shared/http/validation`, with every rule of the Answer table of Data Shape, not only `required` |

Write: `listRunInterrupts` with its filter, the key factory, the two query hooks, the page size, the public API, the `@x/review` files of `workflow`, `artifact` and `run`, the two endpoints, the mock folder `mocks/interrupts/`, the tests, the docs.

Not copied:

| Code | Why |
|---|---|
| `optionSchema`, `answerSchema`, `questionSchema`, `questionTypes` | Declared once in `workflow` (decision 2) |
| `resumedRunSchema` | The resume answers the run: `runSchema` of `run` |
| `reviewedItemSchema`, `listReviewedItems`, `useReviewedItems`, `editedItems` | They read `/artifacts/{id}/items`, an endpoint of `artifact`, which has `listArtifactItems` and `useArtifactItems`. `editedItems` guesses the edited items from `updated_by` and `version > 1`; S2 decides which items the decision lists (section 12) |
| `pendingReviewSchema` of `features/console/console.types.ts` | A subset of `interruptSchema` |
| `usePendingInterrupt`, `useResumeRun` of `features/review/hooks/` | Written new: the keys come from the key factory, the pending hook follows decision 7, and `useResumeRun` invalidates every query (`invalidateQueries()`) and is a feature hook |
| `review-form.utils.ts`, the components, `review-frame.config.tsx`, the review page | S2 (decision 4) |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| API function | verb + object; `find` may answer null | `listRunInterrupts`, `findPendingInterrupt`, `resumeRun` |
| Query hook | `use` + object | `useRunInterrupts`, `usePendingInterrupt` |
| Hook file | `use<Resource>Queries.ts` | `hooks/useInterruptQueries.ts` |
| Key factory | `<resource>Keys` | `interruptKeys` |
| Request body | `<Action>Body` | `ResumeRunBody` |
| List of values and its type | in the `types` file | `interruptStatuses` with `InterruptStatus`, `questionSources` with `QuestionSource` |
| Filter | camelCase fields, turned into the parameters of the API in the API function | `InterruptFilters` (`status`) |
| Page size | `constants` file, camelCase | `interruptsPageSize` |
| Mock reads | `<things>Of`, never the name of an API function | `interruptsOfRun(run)`, `pendingInterruptOf(run)` (not `findPendingInterrupt`, which is the API function) |
| Mock refusal and checks | `refuse<Reason>`, `validate<Body>`, `<subject>Problems` | `refuseAnswerOfOtherInterrupt`, `validateResumeBody`, `answerProblems` |
| Mock store | `<thing>Edits` | `interruptEdits` |

## 6. Shared code first

### Reuse

| Need | Use | From |
|---|---|---|
| The paths of the two endpoints | `apiEndpoint`, `apiEndpoints` | `@/shared/api/endpoints` |
| A request, a page of a list | `apiRequest`, `fetchPage`, `ListPage` | `@/shared/api/request` |
| The query of the filter | `pathWithQuery` (leaves out `undefined`) | `@/shared/lib/url` |
| The method, the header of the key, the statuses in tests | `HttpMethod`, `HttpHeader`, `HttpStatus` | `@/shared/api/http` |
| An infinite query over a list; the items of its pages | `cursorPagesOptions`, `pageItems` | `@/shared/api/query-client` |
| The options of a query hook | `HookQueryOptions` | `@/shared/api/query-client` |
| The options, questions and answers of a checkpoint | `checkpointOptionSchema`, `checkpointQuestionSchema`, `questionAnswerSchema` and their types | `workflow/entities/@x/review` (new, section 7) |
| The nodes and edges of the definition, in the mock | `checkpointNodes`, `findNode`, `edgesFrom` | `@/modules/workflow/entities` (pure functions; the mocks may import them) |
| The artifacts under review; the edited items | `artifactRefSchema`, `ItemRef` | `artifact/entities/@x/review` (new) |
| The run that the resume answers; polling while the run works | `runSchema`, `Run`, `RunStatus`, `refetchIntervalOf`, `LiveRunQueryOptions` | `run/entities/@x/review` (new) |
| Mock: scenario, path parameter, body, idempotency | `answerScenario`, `pageUrlParam`, `pathParam`, `readBodyFields`, `queryOf`, `hasMatchingParam`, `idempotent` | `mocks/shared/scenario`, `mocks/shared/http/request` |
| Mock: answers | `paginate`, `accepted`, `invalidState`, `validationFailed` | `mocks/shared/http/response` |
| Mock: readers of a body field and their problems | `choice`, `choiceProblem`, `requiredText`, `requiredTextProblem`, `optionalText`, `jsonObject`, `jsonObjectProblem`, `positiveInteger`, `positiveIntegerProblem` | `mocks/shared/http/validation` |
| Mock: ids, time, state | `mockId`, `IdPrefix`, `mockNow`, `mockState` | `mocks/shared/db` |
| Mock: the runs | `findRun`, `stepsOfRun` (lookup), `runNotFound` (problems), `changeRun` (changes) | `mocks/runs/` |
| Mock: the artifacts and items | `allArtifacts`, `allItems`, `findItem` (lookup), `changeArtifact`, `changeItem` (changes), `reviewStatus` | `mocks/artifacts/`, `@/modules/artifact/entities` |
| Mock: the definition | `workflowDefinitionFixture` | `mocks/workflow/workflow.fixtures.ts` |
| Tests | `itSendsRequests`, `itThrowsApiErrors`, `itNestsQueryKeys`, `itTellsQueryKeysApart`, `itWaitsUntilEnabled`, `itRejectsRequests` | `@/test/suites` |
| Tests | `getApi`, `postApi`, `openPage`, `serverErrorOn` | `@/test/msw` |
| Tests | `renderHookWithProviders`; `waitForSuccess` | `@/test/render`; `@/test/steps` |

### Extract before the new code

| Candidate | Target | Why | Commit |
|---|---|---|---|
| `artifactRefOf(artifact)`: the `ArtifactRef` of an artifact as it is now (`artifact_id`, `kind`, `title`, `version`) | `mocks/artifacts/artifact-refs.utils.ts`, with a test | Written by hand in `mocks/exports/exports.handlers.ts:41-46` and `mocks/runs/lookup/run-state.lookup.ts:33-38`; the interrupts would be the third copy (CONTRIBUTING: three copies are a helper). A `utils` file of the mocks may be read by every kind, `lookup` and `handlers` included (`frontend/lint/configs/imports-mocks.js`) | 1, a refactor commit of its own; the two old places use it in the same commit |

If the user prefers the refactor apart from the feature, commit 1 moves to the maintenance PR of section 12 and E5 waits for it.

### Not extracted

| Code | Why |
|---|---|
| The rules of an answer by question type | The mock writes them from the API (decision 4); the form of S2 writes its own words. A shared rule would let one mistake pass both |
| The stage after an option (`stageAfterOption`) | A rule of the mock server only; it reads the edges of the definition |
| "Only an interrupted run waits for an answer" | One expression, in one hook (decision 7) |
| `itemRefOf` of an item | Written twice (`run-state.lookup.ts:60`, `directives.fixtures.ts:14`); E5 adds no third copy, so it stays |

## 7. Changes to existing modules

| File | Change |
|---|---|
| `shared/api/endpoints/api-endpoints.constants.ts` | Add `runInterrupts: apiEndpoint('/runs/:runId/interrupts')` and `runResume: apiEndpoint('/runs/:runId/resume')`, beside `runDirectives` |
| `modules/workflow/entities/@x/review.ts` (new) | `export { type CheckpointOption, checkpointOptionSchema, type CheckpointQuestion, checkpointQuestionSchema, type QuestionAnswer, questionAnswerSchema } from '../definition/workflow-graph.types'` |
| `modules/artifact/entities/@x/review.ts` (new) | `export { type ArtifactRef, artifactRefSchema } from '../types/artifacts.types'` and `export type { ItemRef } from '../types/items.types'` |
| `modules/run/entities/@x/review.ts` (new) | `runSchema` and `Run` (`runs/runs.types`), `RunStatus` (`status/run-status.types`), `refetchIntervalOf` (`runs/runs.utils`), `LiveRunQueryOptions` (`runs/run-queries.types`) |
| `mocks/shared/db/mock-ids.constants.ts` | `IdPrefix.Interrupt: '7b0c'`, the prefix of the interrupt of the API examples |
| `mocks/api.setup.ts` | `...interruptHandlers`, after `...directiveHandlers` |
| `mocks/exports/exports.handlers.ts`, `mocks/runs/lookup/run-state.lookup.ts` | Use `artifactRefOf` (commit 1) |
| `modules/artifact/entities/types/revisions.types.ts` | `'reviewed'` in `changeReasons`, after `'rework'`, in the order of Data Shape (decision 6) |

No change: `moduleImports`, `topicEntityModules`, `fileKinds`, the run entity code (the run events keep `payload: z.unknown()`, section 12).

## 8. The entity, file by file

```text
modules/review/entities/
├── index.ts
├── interrupts.api.ts
├── interrupts.constants.ts
├── interrupts.keys.ts
├── interrupts.types.ts
├── __tests__/
│   ├── interrupts.api.data.ts
│   ├── interrupts.api.test.ts
│   ├── interrupts.keys.data.ts
│   └── interrupts.keys.test.ts
└── hooks/
    ├── useInterruptQueries.ts
    └── __tests__/
        └── useInterruptQueries.test.ts
```

| File | Holds | Reuses |
|---|---|---|
| `interrupts.types.ts` | `interruptStatuses`, `InterruptStatus`; `questionSources`, `QuestionSource`; `interruptQuestionSchema`, `InterruptQuestion`; `interruptSchema`, `Interrupt`; `ModifiedItem`; `ResumeRunBody`; `InterruptFilters`. The usual header: temporary hand-written schemas, `TODO: replace with the types generated into src/shared/api/generated/ once they exist.` | `@x/review` of `workflow` and `artifact` |
| `interrupts.api.ts` | `listRunInterrupts(runId, cursor, limit, filters = {})`, `findPendingInterrupt(runId)`, `resumeRun(runId, body, idempotencyKey)`; the usual `TODO: switch to the generated client ...` | `fetchPage`, `apiRequest`, `pathWithQuery`, `apiEndpoints`, `HttpMethod`, `runSchema` |
| `interrupts.constants.ts` | `interruptsPageSize = 100`, with a comment, as `directivesPageSize` | |
| `interrupts.keys.ts` | `interruptKeys` | |
| `hooks/useInterruptQueries.ts` | `useRunInterrupts`, `usePendingInterrupt`, and the local `PendingInterruptOptions` | `cursorPagesOptions`, `HookQueryOptions`, `refetchIntervalOf`, `LiveRunQueryOptions`, `RunStatus` |
| `index.ts` | The API functions, `interruptKeys`, the two hooks, `interruptStatuses`, the types `Interrupt`, `InterruptQuestion`, `InterruptStatus`, `InterruptFilters`, `ModifiedItem`, `QuestionSource`, `ResumeRunBody` | |

Sketch of the types (comments in the style of `directives.types.ts`):

```ts
/** Where an interrupt stands: waiting for the user, answered, or dropped with its run. */
export const interruptStatuses = ['pending', 'resolved', 'cancelled'] as const
export type InterruptStatus = (typeof interruptStatuses)[number]

/** Who asks a question: the checkpoint of the definition, or an agent at run time. */
export const questionSources = ['definition', 'agent'] as const
export type QuestionSource = (typeof questionSources)[number]

export const interruptQuestionSchema = checkpointQuestionSchema.extend({
  source: z.enum(questionSources),
})

export const interruptSchema = z.object({
  id: z.string(),
  run_id: z.string(),
  /** The step of the checkpoint node that created it. */
  step_id: z.string(),
  node: z.string(),
  prompt: z.string(),
  /** Empty when the interrupt only asks questions. */
  options: z.array(checkpointOptionSchema),
  questions: z.array(interruptQuestionSchema),
  allow_edits: z.boolean(),
  review_artifacts: z.array(artifactRefSchema),
  status: z.enum(interruptStatuses),
  created_at: z.iso.datetime(),
  resolved_at: z.iso.datetime().nullable(),
})

/** An item that the user edited before answering, at its new version. */
export type ModifiedItem = Pick<ItemRef, 'item_id' | 'version'>

/** The body of the request that answers the pending interrupt of a run. */
export interface ResumeRunBody {
  interrupt_id: string
  /** Null only when the interrupt has no options. */
  option: string | null
  feedback: string | null
  /** One entry for each answered question, by question key. */
  answers: Record<string, QuestionAnswer>
  modified_items: ModifiedItem[]
}

/** What a list of interrupts is narrowed to; a field left out narrows nothing. */
export interface InterruptFilters {
  status?: InterruptStatus
}
```

Sketch of the keys:

```ts
/** The query keys of the interrupts of the runs, from the widest to the narrowest. */
export const interruptKeys = {
  all: () => ['interrupts'] as const,
  /** Every query of the interrupts of one run, to load them again after an answer. */
  ofRun: (runId: string) => [...interruptKeys.all(), runId] as const,
  /** Every interrupt of one run. */
  list: (runId: string) => [...interruptKeys.ofRun(runId), 'list'] as const,
  /** The interrupt that one run waits for. */
  pending: (runId: string) => [...interruptKeys.ofRun(runId), 'pending'] as const,
}
```

The hooks:

- `useRunInterrupts(runId, { isEnabled = true, runStatus }: LiveRunQueryOptions = {})`: `useInfiniteQuery` on `interruptKeys.list(runId)`, `...cursorPagesOptions`, `refetchInterval: refetchIntervalOf(runStatus)`, since the list grows while the run passes checkpoints. JSDoc: every interrupt of a run, the ones taken with the defaults included, a page at a time.
- `usePendingInterrupt(runId, { isEnabled = true, runStatus }: PendingInterruptOptions)`: `useQuery` on `interruptKeys.pending(runId)`, `queryFn: () => findPendingInterrupt(runId)`, `enabled: isEnabled && runStatus === 'interrupted'`, no `refetchInterval`. `PendingInterruptOptions extends HookQueryOptions { runStatus: RunStatus | undefined }`, local to the hook file. JSDoc: what the run waits for, read only while the run is interrupted; null when it waits for nothing.

`findPendingInterrupt(runId)` reads `listRunInterrupts(runId, null, 1, { status: 'pending' })` and answers `items[0] ?? null`, as `findLatestRun` does. The query of the path is `?status=pending&limit=1` (`pathWithQuery` first, then `fetchPage` adds `limit`).

## 9. The mock, file by file

```text
mocks/interrupts/
├── interrupts.fixtures.ts
├── interrupts.types.ts
├── interrupts.store.ts
├── interrupts.lookup.ts
├── interrupts.problems.ts
├── interrupts.validators.ts
├── interrupts.changes.ts
├── interrupts.handlers.ts
└── __tests__/
```

| File | Holds | Reuses |
|---|---|---|
| `interrupts.fixtures.ts` | `agentQuestionFixtures` (the four questions of `feat/fe/mock`, `source: 'agent'`), `agentQuestionsPromptFixture` ("A few details before the plan is made.") | `InterruptQuestion` |
| `interrupts.types.ts` | `agentQuestionModes = ['only', 'added'] as const` and `AgentQuestionMode`: the values of `?mock-agent-questions` | |
| `interrupts.store.ts` | `interruptEdits = mockState<Record<string, Pick<Interrupt, 'status' \| 'resolved_at'>>>('interrupt-edits', () => ({}))` | `mockState` |
| `interrupts.lookup.ts` | `interruptsOfRun(run)`, `pendingInterruptOf(run)`, and the private `agentQuestionMode()` (reads `pageUrlParam('mock-agent-questions')` with `isOneOf`) | `stepsOfRun`, `allArtifacts`, `workflowDefinitionFixture`, `findNode`, `artifactRefOf`, `interruptEdits` |
| `interrupts.problems.ts` | `refuseAnswerOfOtherInterrupt(pending, interruptId)`: `invalidState('The run is not waiting for this answer.')` when the run waits for nothing or for another interrupt, else null | `invalidState` |
| `interrupts.validators.ts` | `validateResumeBody(interrupt, given)`: `{ decision: ResumeRunBody }` or `{ problems }`; `answerProblems(question, answer, field)` | the readers of `mocks/shared/http/validation`, `findItem` |
| `interrupts.changes.ts` | `resolveInterrupt(run, interrupt, decision)`, and the private `stageAfterOption(node, option)` and `approveArtifacts(refs)` | `interruptEdits`, `changeRun`, `changeArtifact`, `changeItem`, `allItems`, `edgesFrom`, `findNode`, `mockNow`, `reviewStatus` |
| `interrupts.handlers.ts` | `interruptHandlers`: the `GET` and the `POST` | section 6 |

Rules of `interruptsOfRun(run)`, in the order of the steps:

- Each step whose `node` is a checkpoint node of `workflowDefinitionFixture` (`findNode(...)?.kind === 'checkpoint'`) is one interrupt.
- `id`: the id of the step with the prefix `IdPrefix.Interrupt` instead of `IdPrefix.Step`, so that it is unique and fixed (`mocks/runs/fixtures/runs.fixtures.ts:23` numbers a step by its run and its sequence).
- `status`: the edit of `interruptEdits` if any; else `resolved` when the step succeeded, `pending` when the step runs and the run is `interrupted`, `cancelled` otherwise (a run stopped or failed at the checkpoint).
- `resolved_at`: the edit, else the `finished_at` of a resolved step, else null. `created_at`: the `started_at` of the step.
- `prompt`, `options`, `questions`, `allow_edits`: those of the checkpoint node, its questions with `source: 'definition'`. For the pending interrupt only, `?mock-agent-questions=only` gives `agentQuestionsPromptFixture`, no options and `agentQuestionFixtures` (an interrupt that only asks questions); `added` keeps the options and adds `agentQuestionFixtures` (a review with questions).
- `review_artifacts`: `artifactRefOf` of each artifact of the project of the run whose kind is in `review_artifact_kinds` of the node.

`pendingInterruptOf(run)`: the interrupt of `interruptsOfRun(run)` with status `pending`, else null.

What the mock data then holds: run 3 of the mentor thread (default `?mock-run-status=waiting`) waits at `checkpoint_analysis` (step 67) after `checkpoint_personas` was resolved; `done` has three resolved interrupts; `running` and `failed` one; the generated projects that wait for review wait at the checkpoint of their stage (`checkpoint_personas` or `checkpoint_analysis`); the stopped generated run has `checkpoint_personas` resolved. No fixture holds a `cancelled` interrupt: run 3 stopped with `POST /runs/{run_id}/cancel` while it waits shows one.

`validateResumeBody(interrupt, given)`, each problem at the field that the API names:

| Field | Rule | Problem |
|---|---|---|
| `option` | One of the option keys when the interrupt has options; null or left out when it has none | `choiceProblem('option')` |
| `feedback` | Text when the chosen option requires feedback; else optional text | `requiredTextProblem('feedback')` |
| `answers` | An object | `jsonObjectProblem('answers')` |
| `answers.<key>` | `answerProblems`: `single_select` exactly one key of its choices; `multi_select` keys of its choices, between `min_selected` and `max_selected`, at least one when required; `free_text` text when required; `number` a number when required; text when a chosen choice requires it; an answer to a key that is no question is refused | One problem for each question |
| `modified_items` | A list; not empty only when the interrupt allows edits; each entry an existing item with a positive integer `version` | At `modified_items`, or `modified_items.<index>` |

`resolveInterrupt(run, interrupt, decision)`:

1. `interruptEdits`: the interrupt becomes `resolved` at `mockNow()`.
2. When the chosen option approves: each artifact under review gets `review_status` `approved`, and each of its items that is still `draft` too, each as a new version with `change_reason` `'reviewed'` (decision 6; `changeArtifact`, `changeItem`).
3. `changeRun(run.id, { status: 'running', current_stage })`: the stage of the target of the edge that leaves the checkpoint with the option (`edgesFrom(definition, node).find(({ option }) => option === decision.option)`), or of its only edge for an interrupt without options; `done` when the target has no stage.

The handlers, in the order of the mock README:

- `GET runInterrupts.pattern`: `answerScenario('interrupts')`; `findRun` or `runNotFound()`; the empty scenario answers no interrupt; `?status=` keeps the interrupts of that status (`hasMatchingParam`); `paginate`.
- `POST runResume.pattern`, wrapped in `idempotent`: `answerScenario('resume-run')`; `findRun` or `runNotFound()`; `readBodyFields`; `refuseAnswerOfOtherInterrupt(pendingInterruptOf(run), fields.interrupt_id)`; `validateResumeBody` or `validationFailed(problems)`; `resolveInterrupt`; `accepted(findRun(run.id))`.

Scenarios: `mock-interrupts` (`empty`, `error`, `loading`), `mock-resume-run` (`error`, `loading`), `mock-agent-questions` (`only`, `added`). The last one is not named `mock-interrupt`, which would differ from `mock-interrupts` by one letter.

## 10. Tests

Data-driven where the cases share one flow (CONTRIBUTING, Testing); every new reader and handler has cases for what it refuses.

| Test | Cases |
|---|---|
| `review/entities/__tests__/interrupts.api.test.ts` with `.data.ts` | `itSendsRequests`: the first page, the page after a cursor, the `status` filter, `findPendingInterrupt` (`?status=pending&limit=1`), `resumeRun` with its body and `HttpHeader.IdempotencyKey`. Against the mock: the interrupts of run 3 in order with their statuses; the pending one of run 3; null for a finished run; `resumeRun` answers the run `running`; `rejects.toThrow('HTTP 404')` for a missing run |
| `review/entities/__tests__/interrupts.keys.test.ts` with `.data.ts` | `itNestsQueryKeys` (all, ofRun, list, pending), `itTellsQueryKeysApart` (two runs; the list and the pending one of one run) |
| `review/entities/hooks/__tests__/useInterruptQueries.test.ts` | `useRunInterrupts` loads (with `pageItems`); `usePendingInterrupt` loads the pending one for `runStatus: 'interrupted'` and null for a run without one; `itWaitsUntilEnabled` for `isEnabled: false`, and for `usePendingInterrupt` with `runStatus: 'running'` and `undefined` |
| `mocks/artifacts/__tests__/artifact-refs.utils.test.ts` | One artifact, its ref |
| `mocks/interrupts/__tests__/interrupts.lookup.test.ts` with `.data.ts` | For each `?mock-run-status`: the nodes and statuses of run 3; a generated run that waits at the personas; run 3 stopped with `changeRun(..., { status: 'cancelled' })` while it waits (its interrupt `cancelled`); each `?mock-agent-questions` value; an edit of the store wins over the step |
| `mocks/interrupts/__tests__/interrupts.validators.test.ts` with `.data.ts` | Each row of the table of section 9, accepted and refused; a body of the API examples (both) accepted |
| `mocks/interrupts/__tests__/interrupts.problems.test.ts` | No pending interrupt, another id: 409; the pending id: null |
| `mocks/interrupts/__tests__/interrupts.changes.test.ts` | Approve: the artifacts and their draft items approved, the others unchanged, each with a new version; reject: nothing approved, the run goes back to the stage of the option (`reject_reinterview` -> `interviewing`); questions only: the only edge |
| `mocks/interrupts/__tests__/interrupts.handlers.test.ts` with `.data.ts` | `GET` all, `?status=pending`, the empty scenario; `POST` answers `202` with the run `running`, the interrupt is `resolved` afterwards and the run no longer has a pending one; a repeat with the same key answers the first answer; `itRejectsRequests`: missing run (404), a run that waits for nothing (409), another interrupt id (409), an unknown option (422), no feedback for a reject (422), a question not answered (422, at `answers.<key>`), edits on an interrupt that refuses them (422), the error scenarios of both endpoints (500) |

## 11. Docs to update

Docs first, on `docs/fe/run-api-fields`:

- Done (decision 6): Data Shape, API and the database schema name the `change_reason` `reviewed` of an approval.
- Open, found while writing this plan; the mock follows them already. Add them to the same branch, or leave them to the user:
  - API, row `GET /runs/{run_id}/interrupts`: the interrupts are ordered by `created_at`.
  - API, row `POST /runs/{run_id}/cancel`, and Data Shape, Interrupt: cancelling an interrupted run sets its pending interrupt to `cancelled`.

In the PR (last commit):

| Doc | Change |
|---|---|
| `docs/architecture/web-app-modules.md`, section 5, links between entities | Rows `review` -> `workflow` (the options, questions and answers of a checkpoint), `review` -> `artifact` (`artifactRefSchema`, `ItemRef`), `review` -> `run` (`runSchema`, the polling of a run) |
| Same, section 6, row `review` | State: the entities; `answer` and `panel` with the activity |
| `docs/architecture/web-app.md`, section 10, row Reviews | `interrupts.api.ts`, `interrupts.types.ts`, `hooks/useInterruptQueries.ts` instead of `review.api.ts`, `review.types.ts`, `useReviewQueries.ts` |
| `frontend/README.md`, Mock data | `interrupts/` in the tree; a row `interrupts` in the table of resources |
| `src/mocks/README.md` | Rows `mock-interrupts`, `mock-agent-questions`, `mock-resume-run` in Parameters; one sentence in Mock data: the resume of run 3 approves the analysis or sends the run back, and `?mock-reset` starts again |
| `docs/frontend-implementation-plan.md` (local) | Row E5: "As built", with what differs from this plan; checklist |

## 12. Left for the next PRs

The agent writes no code for these; they go in the docs where named.

| Item | When | Note |
|---|---|---|
| `review/features/answer`: copy `review-form.utils.ts` (`defaultOption`, `initialAnswers`, `validateReview`, `buildResumeBody`) with its tests in data-driven form | S2 | Types `CheckpointOption`, `InterruptQuestion`, `QuestionAnswer`, `ResumeRunBody`; `hasText` instead of `trim() === ''`; `editedItems` is not copied |
| The mutation of the answer | S2 | Key from `newIdempotencyKey` once per submit, one retry with the same key (D7); invalidates `interruptKeys.ofRun(runId)`, `runKeys.detail(runId)`, `runKeys.latestOfThread(threadId)`, `runStepKeys.ofRun(runId)`, and `artifactKeys.all()` with `itemKeys.all()` when the option approves; not `invalidateQueries()` |
| Which items `modified_items` lists | S2 | Options: the edit feature records the items it saved while the review waits; or the items whose version is newer than at `review_artifacts[].version`. Decide with the panel |
| `review/widgets/panel`, the pending review in `activity/widgets/steps` and in the chat, the history of a run (interrupts taken with the defaults open no panel) | S2 | Read `usePendingInterrupt` and `useRunInterrupts` |
| The title of the checkpoint of an interrupt (`findNode(definition, interrupt.node)`) | P7 or S2 | A hook of `workflow/entities/checkpoints` once two places show it |
| The `interrupt` event | S2 | On the event, invalidate `interruptKeys.pending(runId)`; the payload is not parsed. `runEventSchemas.interrupt` lacks `step_id`, which the API sends: a `fix` commit with the first reader |
| The stream mock sends no `interrupt` event | S2 | `run-stream.handlers.ts` is a stub |
| A rejection issues no directive in the mock | S2 or S6 | `directivesOfRun` reads the fixtures only; add `createdDirectives` when a screen shows why the run looped after a reject |
| After a resume, the steps of the mock do not move on | S2 | The run is `running` at the next stage; its steps stay those of the fixtures |
| Phase M of the E4 review, not done: `nextCreatedId` in `exports.handlers.ts:34`, `messages.handlers.ts:71`, `projects.handlers.ts:70`, `threads.handlers.ts:45`, `trace-links.changes.ts:12`; `pageItems` and `itWaitsUntilEnabled` in the hook tests of `artifact`, `trace` and `project` | Done on 2026-10-29, on `refactor/fe/mock-ids-and-test-helpers`, not merged: one commit per item | The two code places of `pageItems` (`useProjectQueries`, `ProjectTable`) were done already, and the hook tests of `project` held no case to convert, so that commit touches `artifact` and `trace` only. The follow-up of item 10 of the E4 review, `runErrorCases` in the older shape, is done in the same PR |
| `docs/fe/run-api-fields` | Before E5 | Holds the body of the directives and the retry rule of E4, and the `change_reason` `reviewed` of decision 6 (not committed yet) |
| The proposal for a failed `PATCH` in the dialog that creates a project | With the dialog PR | Open in the E4 review checklist |

## 13. Commits and checks

1. `refactor(frontend): build the artifact references of the mocks with one helper`
2. `feat(frontend): add the types and the endpoints of the interrupts of a run`: endpoints, the three `@x/review` files, `interrupts.types.ts`, `'reviewed'` in `changeReasons`
3. `feat(frontend): mock the interrupts of the runs and the answer to them`: `mocks/interrupts/`, `IdPrefix.Interrupt`, `api.setup.ts`, the mock tests
4. `feat(frontend): read the interrupts of a run and answer the pending one`: api, constants, keys, hooks, `index.ts`, their tests
5. `docs(frontend): describe the review entity and its mock in the guides`

The mock comes before the API functions, so that the tests of commit 4, which run against the mock, pass on each commit.

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on `src/modules/review`, `src/mocks/interrupts`, `src/mocks/artifacts`, `src/mocks/exports`, `src/mocks/runs`, `src/shared/api/endpoints`; `pnpm typecheck` once, since types and exports change. No full suite, E2E, screenshots or build. Then:

- `grep -rnE "FR-[0-9]|NFR-[0-9]|docs/" frontend/src/modules/review frontend/src/mocks/interrupts` answers nothing; `grep -rniE "backend|frontend|\bUI\b|dashboard"` on the new comments too.
- `grep -nP '[^\x00-\x7F]'` on each changed doc shows only tree lines.
- No `console.log`; nothing committed or pushed without the user.

## 14. Checklist

- [x] Decisions 6 and 7 confirmed by the user (2026-10-29)
- [x] `reviewed` written in the worktree of `docs/fe/run-api-fields` (Data Shape, API, `database.dbml`, the diagram of the artifacts)
- [x] That change committed on `docs/fe/run-api-fields` (`73ac70c`); the branch is not merged yet, so E5 was built on a branch of `main` following the docs of that branch (`e5-zcode`, not `feat/fe/review-entities`)
- [x] The two open docs gaps of section 11 left to the user
- [x] Commit 1: `artifactRefOf`, used in three places after commit 3
- [x] Commit 2: endpoints, `@x/review` of `workflow`, `artifact` and `run`, types (with the index of the slice holding the type exports, so that commit 3 compiles)
- [x] Commit 3: the mock, all its files tested, registered in `api.setup.ts`
- [x] Commit 4: the entity, every endpoint with its API function, key, hook and tests
- [x] Commit 5: docs
- [x] `grep -rnwE "ReviewOption|resumedRunSchema|reviewedItemSchema|listReviewedItems|getPendingInterrupt" frontend/src` answers nothing
- [ ] Every state reachable in `pnpm dev:mock` through a scenario of section 9 (not opened in a browser; the tests of the handlers cover the same scenarios, and the parameters are in the mocks README)
- [x] Only the checks of section 13 ran
- [x] Row E5 of the implementation plan updated
