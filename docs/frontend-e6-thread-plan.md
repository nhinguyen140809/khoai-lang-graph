# E6 `thread` entities: plan

Draft of 2026-10-31, for an agent to implement. Not committed. Next PR after E5 (`feat/fe/review-entities`, merged as #43).

Short paths: `thread/entities/...` is `frontend/src/modules/thread/entities/...`, `mocks/...` is `frontend/src/mocks/...`, `test/...` is `frontend/src/test/...`; any other path that starts with `modules/` or `shared/` is under `frontend/src/`.

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
| Branch | `feat/fe/thread-entities`, from `origin/main` (E5 is merged) |
| Title | `feat(frontend): read and change the threads and their messages` |
| Needs | E1 (artifact and item refs), E4 (run schema, run defaults, polling), I1 (idempotency keys); all merged. And the maintenance PR of `refactor/fe/mock-ids-and-test-helpers` (`nextCreatedId` in `threads.handlers.ts` and `messages.handlers.ts`, `getApi` and `getApiItems` in the handler tests): merge it first, since E6 rewrites the same files |
| After it | P7 (`feat/fe/project-status`), which reads the threads of a project; S2 builds `thread/features/send-message` on it |
| Docs first | Decisions 8, 9 and 10 are gaps of `docs/API.md`; write them on `docs/fe/api-fields` once the user confirms them, before commit 4 (the mock follows them) |

The module `thread` already has its place: `moduleImports.thread` is `['workflow', 'artifact', 'run', 'review']` in `frontend/lint/lib/modules/module-imports.constants.js`. No lint list changes.

## 2. What was read

| Source | What it gives this PR |
|---|---|
| [Frontend implementation plan](frontend-implementation-plan.md), row E6, D7 and D8 | The endpoints; the copies from `feat/fe/mock`; the part of P7 for the threads; the function that sends a message takes the idempotency key, and `sendFirstMessage` calls it |
| [E5 plan](frontend-e5-review-plan.md) and its "As built" in the implementation plan | The shape of an entity plan; the index of the slice is born with its type exports in the commit of the types |
| [API](API.md), Conventions and Threads and messages | The eight endpoints; `GET /projects/{project_id}/threads` ordered by `last_message_at` descending; `GET /threads/{thread_id}` with `latest_run_status`; messages ordered by `sequence`; the body of a message (`content`, `run_config`, `models`), its `201` with the message and the run; `Idempotency-Key` on send message; soft delete; lists limit 50 by default, 200 at most |
| [Data Shape](DATA_SHAPE.md), Thread and Message | The fields; `status` (`active`, `archived`); `latest_run_status` (any run status, derived); the title "generated from the first message"; `author`, `delivery`, `ArtifactRef`, `ItemRef` |
| [Runtime](architecture/runtime.md), section 5 | A message to an unfinished run is `pending`, never refused; an interrupted run takes no message until the answer |
| [Web App](architecture/web-app.md), sections 2, 4 and 9 | `message_delivered` marks a message delivered; the table of files has no row for the threads yet |
| [Web App Modules](architecture/web-app-modules.md), sections 1, 5, 6 and 9 | `thread` holds Thread and Message, the feature `send-message`; the links between entities; the chat and the status of a project read `thread` |
| `frontend/CONTRIBUTING.md`, `frontend/README.md` (Mock data), `src/mocks/README.md` | Files of a slice (two resources: folders by kind), hooks, keys, `find`/`get`, request bodies, the layers and names of a mock folder, the reuse table, the scenarios |
| `docs/skills/feature-sliced-design/SKILL.md`, `docs/skills/clean-review/SKILL.md` | `@x` only between entities and only what the user module needs; no business logic in shared code; the 7 checks (names, functions, DRY, YAGNI, magic numbers, readability, conventions) used on each decision below |
| `main` | `thread/entities` (`listThreads`, `sendFirstMessage`, `threadSchema` with `active_run_status`), `mocks/threads/`, `mocks/messages/` (POST only, `SentMessage` typed by hand), `generated-projects.fixtures.ts`, `runs.lookup.ts`, `runs.changes.ts`, `runs.problems.ts`, `projects.fixtures.ts` (`initial_message_id` of messages 1 to 4) |
| `origin/feat/fe/artifacts-backup` (P7) | `thread/entities/threads.types.ts` with `latest_run_status` and `messageSchema`, `threads.keys.ts`, `threads.utils.ts` (`threadsByAttention`), `hooks/useThreadQueries.ts`, `@x/project.ts` |
| `origin/feat/fe/mock` | `features/threads/threads.{api,types,utils}.ts`, `features/console/console.types.ts` (`messageSchema`), `mocks/threads.{fixtures,handlers}.ts`, `mocks/messages.{fixtures,handlers}.ts`, `extraMessages` of `extra-projects.fixtures.ts` |

## 3. Decisions

Taken from the docs and the conventions; the agent applies them as written:

1. **Folders by kind.** `thread` reads two resources, the threads and the messages. CONTRIBUTING, Files of a slice: a slice that reads several resources splits its `api`, `types` and `keys` files by resource, and two files of a kind go in a folder of that kind, as `artifact/entities` does: `api/`, `types/`, `keys/`, `hooks/`, each with its `__tests__/`. The one `constants` file stays at the root (`page-sizes.constants.ts`): a kind with one file has no folder (`artifact` has three since #44, so its files sit in `constants/`). No topic folders, no change to `topicEntityModules`. The files on `main` move into these folders with `git mv` in a commit of their own (commit 1), so that the history follows them.
2. **One name for one concept.** The run that a message starts is `Run` of `run`, its settings `RunDefaults` of `run`, and the references of a message `ArtifactRef` and `ItemRef` of `artifact`; `thread` imports them through `@x/thread` and declares none of them. No `runSchema` (as in `features/threads` of `feat/fe/mock`), no `artifactRefSchema` (as in the P7 backup), no `SentMessage` typed by hand (as in `mocks/messages/messages.store.ts`).
3. **`latest_run_status`, not `active_run_status`.** Data Shape and API on `main` (#14) name the field `latest_run_status`: the status of the latest run, unfinished or ended, null before the first run. The schema on `main` still has `active_run_status` with the unfinished statuses only, so a thread whose run failed reads null. `threadSchema` takes `latest_run_status: z.enum(runStatuses).nullable()`, and the mock follows (commit 2, a `fix` of its own).
4. **The mock derives the run fields and the time of the newest message.** `current_stage` and `latest_run_status` come from the latest run of the thread (the highest `number`), `active_run_id` from its unfinished run, and `last_message_at` from the newest message, else `created_at`. The fixtures of the threads hold none of these, so `mentorMainStages`, the `scenario` parameter of `threadFixtures` and `threadsBeforeAnyRun` go: with `?mock-runs=empty` the thread has no run to derive from. No value is kept in two places.
5. **The mutation hooks wait for their features.** The entity holds the API function of every endpoint (D2), writes included: `createThread`, `updateThread`, `deleteThread`, `sendMessage`. Their hooks belong to features: `useSendMessage` to `thread/features/send-message` (S2), with its key made once per action (D7); rename, archive and delete of a thread to the PR of the screen that shows several threads. `sendFirstMessage(projectId, content, idempotencyKey)` keeps its signature and becomes `createThread` then `sendMessage`, so `useCreateProject` does not change.
6. **`threadsByAttention` and `thread/entities/@x/project` wait for P7.** The table of D8 lists them under E6, but their only reader is the status of a project, which P7 builds. CONTRIBUTING: "Write a helper when code uses it already"; Web App Modules: "An object that only one feature reads stays in that feature until a second slice reads it". P7 takes them from its backup with the rename of `buildMockThread` to `buildThread`.
7. **Which queries poll.** A thread changes while its run works (`current_stage`, `latest_run_status`, `active_run_id`), and so do its messages (a `pending` message becomes `delivered`, agents add messages).

   | Hook | Polling | Why |
   |---|---|---|
   | `useThread(threadId)` | While its own `latest_run_status` is unfinished, as `useRun` does | It holds the status it depends on |
   | `useThreadMessages(threadId, { runStatus })` | While `runStatus` is unfinished (`LiveRunQueryOptions`), as `useRunInterrupts` | The status is that of the run on screen |
   | `useProjectThreads`, `useThreads` | None | The status of a project (P7) loads them again at the events of its run streams (API, open point 8) |

Gaps of `docs/API.md`, confirmed by the user on 2026-10-31 and written in `docs/API.md` on `docs/fe/api-fields` (docs-first rule; the mock follows them):

8. **Deleting a thread.** The API says only "Soft delete".

   | Option | Evaluation |
   |---|---|
   | a. As a project: a thread with an unfinished run answers `409 invalid_state`; a deleted thread is left out of the lists and its endpoints answer `404` | One rule for both soft deletes; no run is left working in a thread that nobody can open |
   | b. Delete stops the unfinished run first | One request does two things, and a stop that fails leaves the delete half done |
   | c. Delete without a check | The run keeps working and its messages land in a thread that answers `404` |

   Decision: a. Add to `docs/API.md`, row `DELETE /threads/{thread_id}`: "A thread with an unfinished run answers `409 invalid_state`; the run is stopped first. A deleted thread is left out of lists, and its endpoints answer `404`."

9. **The order of `GET /threads`.** The API states an order for every list ("Stated per endpoint and stable"), but not for this one. Decision: `last_message_at` descending, as `GET /projects/{project_id}/threads`; ties by `id` (API, Lists). Add it to the row.

10. **The fields of `PATCH /threads/{thread_id}` and of `models`.** The API gives the names only.

    | Field | Rule | Why |
    |---|---|---|
    | `title` of `POST /projects/{project_id}/threads` | Left out or null: no title until the first message; else a text with more than whitespace | Data Shape: "Null until one of the two" |
    | `title` of `PATCH` | A text with more than whitespace; null is refused | Data Shape gives null only before the title is given or generated |
    | `status` of `PATCH` | `active` or `archived` | Data Shape, Thread |
    | `models` of `POST /threads/{thread_id}/messages` | An object; each key an agent role of the current definition, each value a text (`provider:model`) | API: "a map of agent role to model". The catalog check waits for E7 (section 12) |

    Decision: the table. Add the rules to the rows of `docs/API.md`, with `422 validation_failed` at the field (`title`, `status`, `models.<role>`).

## 4. Scope

Endpoints: `GET /projects/{project_id}/threads`, `GET /threads` (with `?project_id=`), `POST /projects/{project_id}/threads`, `GET`, `PATCH`, `DELETE /threads/{thread_id}`, `GET`, `POST /threads/{thread_id}/messages`. All eight are in `apiEndpoints` already (`projectThreads`, `threads`, `thread`, `threadMessages`).

Copy (read with `git show <ref>:frontend/src/<path>`):

| Copy | From | To | What changes |
|---|---|---|---|
| `threadSchema` with `latest_run_status` | `modules/thread/entities/threads.types.ts` of `origin/feat/fe/artifacts-backup` | `thread/entities/types/threads.types.ts` | `status` from `threadStatuses`; `runStatuses` from `run/entities/@x/thread` (decision 3) |
| `messageSchema` | the same file | `thread/entities/types/messages.types.ts` | `author` and `delivery` from `messageAuthors` and `messageDeliveries`; `artifact_refs` and `item_refs` from `artifact/entities/@x/thread` (decision 2) |
| The seven messages of `mocks/messages.fixtures.ts` | `origin/feat/fe/mock` | `mocks/messages/messages.fixtures.ts` | Named `messageFixtures`, typed `Message[]`; `artifact_refs: []`, `item_refs: []`; ids renumbered so that the first message of each project is the `initial_message_id` of `projects.fixtures.ts` (section 9); `delivered_in_step_id` from `buildStepId` of `runs.fixtures.ts` |
| `extraMessages` of `mocks/extra-projects.fixtures.ts` | `origin/feat/fe/mock` | `generatedMessages()` in `mocks/generated/fixtures/generated-projects.fixtures.ts` | Reads `spec.message`, which the specs hold and nothing reads yet, and the `messageId` that `initial_message_id` already uses |
| The `GET` handler of `mocks/messages.handlers.ts` | `origin/feat/fe/mock` | `mocks/messages/messages.handlers.ts` | Scenario helper; `findThread` or `threadNotFound()`; the sequence comes from the lookup |

Write: the API functions of every endpoint, the two key factories, the query hooks, the page sizes, the public API, `artifact/entities/@x/thread.ts`, the run exports of `run/entities/@x/thread.ts`, the mock files that `PATCH`, `DELETE` and `GET` of the messages need, the validators of the three bodies, the tests, the docs.

Not copied:

| Code | Why |
|---|---|
| `runSchema`, `runStepSchema`, `usageSchema`, `itemRefSchema`, `listThreadRuns`, `getRun`, `listRunSteps` of `features/threads/` | Declared once in `run` and `artifact` (decision 2) |
| `threadTitle` of `features/threads/threads.utils.ts` | Its words ("New console") are those of the old console; the chat of S2 decides how a thread without a title reads |
| `useConsoleThread`, `getConsoleThreadId` | The console creates a thread from a query; the frame of option D replaces it |
| `ThreadList`, `ProjectRunStatus`, `useProjectRunStatus`, `run-status.utils.ts` | Screens of the old frame; P7 builds the status from its backup |
| The retry handler of `mocks/messages.handlers.ts` | The runs mock has `POST /runs/{run_id}/retry` (E4) |
| `createdMessages` of `mocks/mock-runs.store.ts` | The messages keep their own store, `mocks/messages/messages.store.ts` |
| `threadsByAttention`, `@x/project`, `useProjectThreads` as a plain query of the first page (P7 backup) | Decision 6; `useProjectThreads` is written new as an infinite query |
| `createdThreadSchema`, `sentMessageSchema` of `main` (the ids only) | `sendFirstMessage` reads the full answers of `createThread` and `sendMessage` |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| API function | verb + object; `get` gives a value or throws | `listProjectThreads`, `listThreads`, `getThread`, `createThread`, `updateThread`, `deleteThread`, `sendFirstMessage`; `listThreadMessages`, `sendMessage` |
| Query hook | `use` + object | `useProjectThreads`, `useThreads`, `useThread`; `useThreadMessages` |
| Hook file | `use<Resource>Queries.ts` | `hooks/useThreadQueries.ts`, `hooks/useMessageQueries.ts` |
| Key factory | `<resource>Keys` | `threadKeys`, `messageKeys` |
| Request body | `<Action>Body` | `CreateThreadBody`, `UpdateThreadBody`, `SendMessageBody` |
| Answer of a write that is not the resource | named after what it holds | `SentMessage` (the message and the run it started or was sent to) |
| List of values and its type | in the `types` file | `threadStatuses` with `ThreadStatus`; `messageAuthors` with `MessageAuthor`; `messageDeliveries` with `MessageDelivery` |
| Filter | camelCase fields, turned into the parameters of the API in the API function | `ThreadFilters` (`projectId`) |
| Page size | `constants` file, camelCase | `threadsPageSize`, `messagesPageSize` |
| Mock reads | `<things>Of`, `all<Things>`, `find<Thing>`; never the name of an API function | `allThreads()`, `findThread(threadId)`, `messagesOfThread(threadId)` |
| Mock writes | `change<Thing>`, `add<Thing>`, `remove<Thing>`; never the name of an API function | `changeThread`, `removeThread` (not `deleteThread`), `addMessage` (not `sendMessage`) |
| Mock checks | `validate<Body>` | `validateNewThread`, `validateThreadChange`, `validateSentMessage` |
| Mock store | `created<Things>`, `<thing>Edits`, `deleted<Thing>Ids` | `createdThreads`, `threadEdits`, `deletedThreadIds`, `createdMessages` (was `sentMessages`) |
| Mock fixtures | `<thing>Fixtures`, `build<Thing>`, `generated<Things>` | `threadFixtures`, `buildThread`, `messageFixtures`, `buildMessage`, `generatedMessages`; `buildStepId` (was the private `stepId` of `runs.fixtures.ts`) |

## 6. Shared code first

### Reuse

| Need | Use | From |
|---|---|---|
| The paths of the endpoints | `apiEndpoints.projectThreads`, `threads`, `thread`, `threadMessages` | `@/shared/api/endpoints` |
| A request, a page of a list, a request without an answer body | `apiRequest`, `fetchPage`, `ListPage`, `apiCommand` | `@/shared/api/request` |
| The query of the filter | `pathWithQuery` (leaves out `undefined`) | `@/shared/lib/url` |
| The method, the header of the key, the statuses in tests | `HttpMethod`, `HttpHeader`, `HttpStatus` | `@/shared/api/http` |
| An infinite query over a list; the items of its pages | `cursorPagesOptions`, `pageItems` | `@/shared/api/query-client` |
| The options of a query hook | `HookQueryOptions` | `@/shared/api/query-client` |
| The run statuses, the run of a message, the run settings, polling | `runStatuses`, `RunStatus`, `runSchema`, `Run`, `RunDefaults`, `refetchIntervalOf`, `LiveRunQueryOptions` | `run/entities/@x/thread` (extended, section 7) |
| The references of a message | `artifactRefSchema`, `itemRefSchema` | `artifact/entities/@x/thread` (new) |
| Mock: scenario, path parameter, body, query, idempotency | `answerScenario`, `pathParam`, `readBodyFields`, `queryOf`, `idempotent` | `mocks/shared/scenario`, `mocks/shared/http/request` |
| Mock: answers | `paginate`, `emptyPage`, `created`, `noContent`, `validationFailed` | `mocks/shared/http/response` |
| Mock: readers of a body field and their problems | `requiredText`, `requiredTextProblem`, `choice`, `choiceProblem`, `jsonObject`, `jsonObjectProblem`, `isSentButInvalid` | `mocks/shared/http/validation` |
| Mock: ids, time, state | `mockId`, `IdPrefix`, `nextCreatedId`, `mockNow`, `mockState`, `threadIds`, `runIds`, `projectIds`, `userId` | `mocks/shared/db` |
| Mock: the runs of a thread | `runsOfThread`, `findUnfinishedRun`, `findRun` (lookup), `addRun` (changes), `refuseUnfinishedRun` (problems), `validateRunDefaults` (validators) | `mocks/runs/` |
| Mock: the project of a thread | `findProject`, `changeProject` (`projects.lookup.ts`), `projectNotFound` | `mocks/projects/` |
| Mock: the agent roles of the definition | `workflowDefinitionFixture.agent_roles` | `mocks/workflow/workflow.fixtures.ts` |
| Tests | `itSendsRequests`, `itThrowsApiErrors`, `itNestsQueryKeys`, `itTellsQueryKeysApart`, `itWaitsUntilEnabled`, `itRejectsRequests` | `@/test/suites` |
| Tests | `getApi`, `getApiItems`, `postApi`, `patchApi`, `deleteApi`, `openPage`, `serverErrorOn` | `@/test/msw` |
| Tests | `renderHookWithProviders`; `waitForSuccess` | `@/test/render`; `@/test/steps` |

### Extract before the new code

None. A search of `src/` for what E6 would write a third time finds:

| Candidate | Copies | Result |
|---|---|---|
| The refusal of a change while a thread has an unfinished run | `refuseUnfinishedRun(threadId)` of `runs.problems.ts` exists | Reused by `DELETE /threads/{thread_id}`; no new code |
| The id of the next created record | `nextCreatedId` exists (after the maintenance PR) | Used by `POST` thread and message |
| A soft delete in a store (`deleted<Thing>Ids` read by the lookup) | `deletedProjectIds`, now `deletedThreadIds`: two copies | Stays; two copies are a warning, not a helper |
| The name of a project from a message (`nameFromMessage`) | One, now read twice (project name, thread title) | Moves with its caller to `messages.changes.ts` (section 9); no copy |

### Not extracted

| Code | Why |
|---|---|
| The latest run of a thread (`runsOfThread(id).toSorted(byNumberDesc)[0]`) | One place, the threads lookup |
| The rules of the bodies (`title`, `status`, `models`) | The mock writes them from the API (decision 10); the forms of later PRs write their own words. A shared rule would let one mistake pass both |
| "A message to a thread without an unfinished run starts a run" | A rule of the mock server, in `addMessage` |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `modules/thread/entities/threads.api.ts`, `threads.types.ts`, `__tests__/threads.api.{data,test}.ts` | `git mv` to `api/threads.api.ts`, `types/threads.types.ts`, `api/__tests__/`; only the specifiers of their imports and of `index.ts` change | 1 |
| `modules/run/entities/@x/thread.ts` | `runStatuses` and `RunStatus` instead of `unfinishedRunStatuses` (commit 2); then `runSchema`, `Run` (`runs/runs.types`), `RunDefaults` (`config/run-config.types`), `refetchIntervalOf` (`runs/runs.utils`), `LiveRunQueryOptions` (`runs/run-queries.types`) (commit 3) | 2, 3 |
| `modules/artifact/entities/@x/thread.ts` (new) | `export { artifactRefSchema } from '../types/artifacts.types'` and `export { itemRefSchema } from '../types/items.types'` | 3 |
| `mocks/threads/threads.fixtures.ts` | `threadFixtures` becomes a constant without the run fields; `mentorMainStages` and `threadsBeforeAnyRun` go (decision 4) | 2 |
| `mocks/threads/threads.lookup.ts` | `allThreads()` derives `current_stage`, `active_run_id`, `latest_run_status` (commit 2), then `last_message_at`, the edits and the deleted ids (commit 4); `findThread(threadId)` | 2, 4 |
| `mocks/generated/fixtures/generated-projects.fixtures.ts` | `generatedThreads()` builds each thread with `buildThread` and no run fields (commit 2); `generatedMessages()` (commit 4) | 2, 4 |
| `mocks/runs/fixtures/runs.fixtures.ts` | The private `stepId` is exported as `buildStepId`, for `delivered_in_step_id` | 4 |
| `mocks/runs/runs.changes.ts`, `mocks/runs/lookup/runs.lookup.ts` | `NewRun` takes `models?: Record<string, string>`, and `resolveRunConfig(project, override, models)` sets `models: { ...defaults.models, ...models }` | 4 |
| `mocks/messages/messages.store.ts` | `createdMessages = mockState<Message[]>('created-messages', ...)` replaces `sentMessages` and the type `SentMessage` | 4 |
| `mocks/messages/messages.handlers.ts` | The `GET`; the `POST` reads `validateSentMessage` and calls `addMessage`; `nameFromMessage` and `startRun` move to `messages.changes.ts` | 4 |
| `mocks/threads/threads.handlers.ts` | `PATCH`, `DELETE`; `answerScenario('create-thread')` and `validateNewThread` in the `POST`; `findThread` in the `GET` | 4 |
| `mocks/threads/__tests__/*`, `mocks/messages/__tests__/*` | `latest_run_status` (commit 2); the new cases of section 10 (commit 4) | 2, 4 |
| `modules/thread/entities/index.ts` | The type exports (commit 3), then the API functions, keys and hooks (commit 5) | 3, 5 |

No change: `moduleImports`, `topicEntityModules`, `fileKinds`, `apiEndpoints`, `IdPrefix`, `mocks/api.setup.ts` (both handler lists are registered), `useCreateProject`.

## 8. The entity, file by file

```text
modules/thread/entities/
├── index.ts
├── page-sizes.constants.ts
├── api/
│   ├── messages.api.ts
│   ├── threads.api.ts
│   └── __tests__/
│       ├── messages.api.data.ts
│       ├── messages.api.test.ts
│       ├── threads.api.data.ts
│       └── threads.api.test.ts
├── keys/
│   ├── messages.keys.ts
│   ├── threads.keys.ts
│   └── __tests__/
│       ├── messages.keys.data.ts
│       ├── messages.keys.test.ts
│       ├── threads.keys.data.ts
│       └── threads.keys.test.ts
├── types/
│   ├── messages.types.ts
│   └── threads.types.ts
└── hooks/
    ├── useMessageQueries.ts
    ├── useThreadQueries.ts
    └── __tests__/
        ├── useMessageQueries.test.ts
        └── useThreadQueries.test.ts
```

| File | Holds | Reuses |
|---|---|---|
| `types/threads.types.ts` | `threadStatuses`, `ThreadStatus`; `threadSchema`, `Thread`; `ThreadFilters`; `CreateThreadBody`; `UpdateThreadBody`. The usual header: temporary hand-written schemas, `TODO: replace with the types generated into src/shared/api/generated/ once they exist.` | `runStatuses` of `run/entities/@x/thread` |
| `types/messages.types.ts` | `messageAuthors`, `MessageAuthor`; `messageDeliveries`, `MessageDelivery`; `messageSchema`, `Message`; `SendMessageBody`; `sentMessageSchema`, `SentMessage`. Same header | `artifactRefSchema`, `itemRefSchema`, `runSchema`, `RunDefaults` |
| `api/threads.api.ts` | `listProjectThreads(projectId, cursor, limit)`, `listThreads(cursor, limit, filters = {})`, `getThread(threadId)`, `createThread(projectId, body = {})`, `updateThread(threadId, body)`, `deleteThread(threadId)`, `sendFirstMessage(projectId, content, idempotencyKey)`; the usual `TODO: switch to the generated client ...` | `fetchPage`, `apiRequest`, `apiCommand`, `pathWithQuery`, `apiEndpoints`, `HttpMethod`, `sendMessage` |
| `api/messages.api.ts` | `listThreadMessages(threadId, cursor, limit)`, `sendMessage(threadId, body, idempotencyKey)` | `fetchPage`, `apiRequest`, `apiEndpoints`, `HttpMethod` |
| `page-sizes.constants.ts` | `threadsPageSize = 50`, `messagesPageSize = 200`, each with a comment, as `directivesPageSize` | |
| `keys/threads.keys.ts` | `threadKeys` | `ThreadFilters` |
| `keys/messages.keys.ts` | `messageKeys` | |
| `hooks/useThreadQueries.ts` | `useProjectThreads`, `useThreads`, `useThread` | `cursorPagesOptions`, `HookQueryOptions`, `refetchIntervalOf` |
| `hooks/useMessageQueries.ts` | `useThreadMessages` | `cursorPagesOptions`, `LiveRunQueryOptions`, `refetchIntervalOf` |
| `index.ts` | The API functions, `threadKeys`, `messageKeys`, the four hooks, `threadStatuses`, `messageAuthors`, `messageDeliveries`, the types `Thread`, `ThreadStatus`, `ThreadFilters`, `CreateThreadBody`, `UpdateThreadBody`, `Message`, `MessageAuthor`, `MessageDelivery`, `SendMessageBody`, `SentMessage` | |

Sketch of the types (comments in the style of `interrupts.types.ts`):

```ts
// types/threads.types.ts

/** Where a thread stands: in use, or put away by the user. */
export const threadStatuses = ['active', 'archived'] as const
export type ThreadStatus = (typeof threadStatuses)[number]

/** A conversation of a project with the system; its runs start from its messages. */
export const threadSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  created_by: z.string(),
  /** Null until it is given, or generated from the first message. */
  title: z.string().nullable(),
  status: z.enum(threadStatuses),
  /** The stage of the latest run; null before the first run. */
  current_stage: z.string().nullable(),
  /** The unfinished run of the thread (queued, running or interrupted), if any. */
  active_run_id: z.string().nullable(),
  /**
   * The status of the latest run, unfinished or ended; null before the first run. While
   * `active_run_id` is set, the status of that run.
   */
  latest_run_status: z.enum(runStatuses).nullable(),
  /** The time of the newest message; the creation time while the thread has none. */
  last_message_at: z.iso.datetime(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
export type Thread = z.infer<typeof threadSchema>

/** What a list of the threads of the user is narrowed to; a field left out narrows nothing. */
export interface ThreadFilters {
  projectId?: string | undefined
}

/** The body of the request that creates an empty thread in a project. */
export interface CreateThreadBody {
  title?: string
}

/** The body of the request that renames a thread, archives it or makes it active again. */
export interface UpdateThreadBody {
  title?: string
  status?: ThreadStatus
}
```

```ts
// types/messages.types.ts

/** Who wrote a message of the chat. */
export const messageAuthors = ['user', 'agent', 'system'] as const
export type MessageAuthor = (typeof messageAuthors)[number]

/** What became of a message of the user: it started a run, waits for one, or was taken in or not. */
export const messageDeliveries = ['started_run', 'pending', 'delivered', 'undelivered'] as const
export type MessageDelivery = (typeof messageDeliveries)[number]

export const messageSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  /** Order of the message in its thread, from 1, without gaps. */
  sequence: z.number().int(),
  /** The run that the message started or belongs to. */
  run_id: z.string().nullable(),
  author: z.enum(messageAuthors),
  /** Set when `author` is `agent`. */
  agent_role: z.string().nullable(),
  /** Markdown. */
  content: z.string(),
  /** Artifacts mentioned or produced. */
  artifact_refs: z.array(artifactRefSchema),
  /** Items mentioned. */
  item_refs: z.array(itemRefSchema),
  /** On the messages of the user only. */
  delivery: z.enum(messageDeliveries).nullable(),
  /** The step that took the message in, once it is delivered. */
  delivered_in_step_id: z.string().nullable(),
  created_at: z.iso.datetime(),
})
export type Message = z.infer<typeof messageSchema>

/** The body of the request that sends a message of the user to a thread. */
export interface SendMessageBody {
  content: string
  /** Settings of the run that the message starts; not read when the thread has an unfinished run. */
  run_config?: RunDefaults
  /** By agent role, the model of the run that the message starts (`provider:model`). */
  models?: Record<string, string>
}

/** The answer of a sent message: the message, and the run that it started or was sent to. */
export const sentMessageSchema = z.object({ message: messageSchema, run: runSchema })
export type SentMessage = z.infer<typeof sentMessageSchema>
```

The API functions:

- `listProjectThreads` and `listThreadMessages` read one page with `fetchPage`, as `listThreadRuns`. JSDoc: the threads of a project, the newest message first; the messages of a thread, in the order they were sent.
- `listThreads(cursor, limit, filters = {})`: `pathWithQuery(apiEndpoints.threads.path(), { project_id: filters.projectId })`, then `fetchPage`. JSDoc: the threads of the user across projects, the newest message first (decision 9).
- `createThread` and `updateThread` parse the answer with `threadSchema`; `deleteThread` is an `apiCommand` with `HttpMethod.Delete`.
- `sendMessage(threadId, body, idempotencyKey)` parses `sentMessageSchema`. JSDoc: sends a message of the user; with no unfinished run it starts one, else it waits for that run; the request goes with `idempotencyKey`, so that sending it again starts no second run.
- `sendFirstMessage(projectId, content, idempotencyKey)`: `const thread = await createThread(projectId)`, then `await sendMessage(thread.id, { content }, idempotencyKey)`; it stays `Promise<void>`, with its JSDoc of `main`. The key goes with the message and not with the thread, as the test of `main` checks.

Sketch of the keys:

```ts
/** The query keys of the threads, from the widest to the narrowest; each starts with the one above. */
export const threadKeys = {
  all: () => ['threads'] as const,
  /** The start of the key of every list of threads, to load them all again after a change. */
  lists: () => [...threadKeys.all(), 'list'] as const,
  /** The threads of one project. */
  ofProject: (projectId: string) => [...threadKeys.lists(), 'project', projectId] as const,
  /** The threads of the user, narrowed by the filters. */
  list: (filters: ThreadFilters) => [...threadKeys.lists(), 'user', filters] as const,
  /** One thread. */
  detail: (threadId: string) => [...threadKeys.all(), 'detail', threadId] as const,
}

/** The query keys of the messages, from the widest to the narrowest. */
export const messageKeys = {
  all: () => ['messages'] as const,
  /** The messages of one thread. */
  ofThread: (threadId: string) => [...messageKeys.all(), threadId] as const,
}
```

The hooks:

- `useProjectThreads(projectId, { isEnabled = true }: HookQueryOptions = {})`: `useInfiniteQuery` on `threadKeys.ofProject(projectId)`, `...cursorPagesOptions`, page size `threadsPageSize`. JSDoc: the threads of a project, the newest message first, a page at a time.
- `useThreads(filters: ThreadFilters = {}, { isEnabled = true }: HookQueryOptions = {})`: `useInfiniteQuery` on `threadKeys.list(filters)`. JSDoc: the threads of the user across projects, a page at a time.
- `useThread(threadId, { isEnabled = true }: HookQueryOptions = {})`: `useQuery` on `threadKeys.detail(threadId)`, `refetchInterval: (query) => refetchIntervalOf(query.state.data?.latest_run_status)`. JSDoc: one thread, read again while its latest run has not ended.
- `useThreadMessages(threadId, { isEnabled = true, runStatus }: LiveRunQueryOptions = {})`: `useInfiniteQuery` on `messageKeys.ofThread(threadId)`, `refetchInterval: refetchIntervalOf(runStatus)`. JSDoc: the messages of a thread, in the order they were sent, a page at a time; read again while the run works, since its agents add messages and take in the pending ones.

## 9. The mock, file by file

```text
mocks/threads/
├── threads.fixtures.ts
├── threads.store.ts
├── threads.lookup.ts
├── threads.changes.ts
├── threads.problems.ts
├── threads.validators.ts
├── threads.handlers.ts
└── __tests__/

mocks/messages/
├── messages.fixtures.ts
├── messages.store.ts
├── messages.lookup.ts
├── messages.validators.ts
├── messages.changes.ts
├── messages.handlers.ts
└── __tests__/
```

| File | Holds | Reuses |
|---|---|---|
| `threads/threads.fixtures.ts` | `buildThread(fields)`, `threadFixtures` (the four main threads, each `title: 'Main thread'`, `created_at` and `updated_at` as on `main`, no run fields) | `threadIds`, `projectIds`, `userId` |
| `threads/threads.store.ts` | `createdThreads` (as on `main`), `threadEdits = mockState<Record<string, Partial<Pick<Thread, 'title' \| 'status' \| 'updated_at'>>>>('thread-edits', ...)`, `deletedThreadIds = mockState<string[]>('deleted-threads', ...)` | `mockState` |
| `threads/threads.lookup.ts` | `allThreads()`, `findThread(threadId)`, and the private `withRunsOfThread(thread)` and `lastMessageAt(thread)` | `generatedThreads`, `runsOfThread`, `findUnfinishedRun`, `messagesOfThread`, the store |
| `threads/threads.changes.ts` | `changeThread(threadId, change)`, `removeThread(threadId)` | the store |
| `threads/threads.problems.ts` | `threadNotFound()` (as on `main`) | `notFound` |
| `threads/threads.validators.ts` | `validateNewThread(given)`: `{ title: string \| null }` or `{ problems }`; `validateThreadChange(given)`: `{ change: Partial<Pick<Thread, 'title' \| 'status'>> }` or `{ problems }` | `requiredText`, `requiredTextProblem`, `choice`, `choiceProblem`, `isSentButInvalid`, `threadStatuses` |
| `threads/threads.handlers.ts` | `threadHandlers`: the six endpoints of the threads | section 6 |
| `messages/messages.fixtures.ts` | `buildMessage(fields)`, `messageFixtures` | `threadIds`, `runIds`, `buildStepId`, `mockId`, `IdPrefix` |
| `messages/messages.store.ts` | `createdMessages` | `mockState` |
| `messages/messages.lookup.ts` | `messagesOfThread(threadId)`: the fixtures, `generatedMessages()` and `createdMessages` of the thread, by `sequence` | the fixtures, the store |
| `messages/messages.validators.ts` | `validateSentMessage(given)`: `{ content, runDefaults?, models? }` or `{ problems }`, and the private `modelsProblems(given)` | `requiredText`, `requiredTextProblem`, `jsonObject`, `jsonObjectProblem`, `choiceProblem`, `validateRunDefaults`, `workflowDefinitionFixture` |
| `messages/messages.changes.ts` | `addMessage(thread, sent)`: `{ message, run }`; `nameFromMessage(content)` (moved from the handlers, exported for its test), and the private `startRun` (moved) | `addRun`, `findRun`, `changeProject`, `changeThread`, `messagesOfThread`, `createdMessages`, `nextCreatedId`, `mockNow` |
| `messages/messages.handlers.ts` | `messageHandlers`: the `GET` and the `POST` | section 6 |

Rules of the mock data:

- `allThreads()`: `createdThreads`, `threadFixtures` and `generatedThreads()`, without the ids of `deletedThreadIds`, each with its edit of `threadEdits`, then `withRunsOfThread` and `lastMessageAt`.
- `withRunsOfThread(thread)`: the runs of `runsOfThread(thread.id)` sorted by `number` descending; `current_stage` and `latest_run_status` are those of the first, or null when there is none; `active_run_id` is the id of `findUnfinishedRun(thread.id)`, or null.
- `lastMessageAt(thread)`: the `created_at` of the last message of `messagesOfThread(thread.id)`, else the `created_at` of the thread.
- The derived values then match the fixtures of `main` for each `?mock-run-status`: the mentor thread `running`/`analysis`, `interrupted`/`analysis_review`, `failed`/`analysis`, `succeeded`/`done`; the campus and laundry threads `succeeded`/`done`; the library thread `running`/`interviewing`; run 3 stopped with `POST /runs/{run_id}/cancel`: `cancelled`, no `active_run_id`; with `?mock-runs=empty`, every thread null, null, null.
- `messageFixtures`, the seven messages of `feat/fe/mock`, with these ids (`mockId(IdPrefix.Message, n)`), so that the first message of each project is its `initial_message_id`:

  | Id n | Thread | Sequence | Run | Author | Delivery | Created |
  |---|---|---|---|---|---|---|
  | 1 | mentor | 1 | `mentorMain1` | user | `started_run` | 2026-10-02T08:10:00Z |
  | 2 | campus | 1 | `campusMain1` | user | `started_run` | 2026-10-05T15:49:30Z |
  | 3 | library | 1 | `libraryMain1` | user | `started_run` | 2026-10-03T10:09:30Z |
  | 4 | laundry | 1 | `laundryMain1` | user | `started_run` | 2026-09-20T08:39:00Z |
  | 5 | mentor | 2 | `mentorMain1` | agent (`validator`) | null | 2026-10-02T08:52:41Z |
  | 6 | mentor | 3 | `mentorMain2` | user | `started_run` | 2026-10-04T10:00:00Z |
  | 7 | mentor | 4 | `mentorMain3` | user | `delivered`, in `buildStepId(3, 4)` | 2026-10-06T08:30:40Z |

- `generatedMessages()`: for each spec whose `lastRun` is not `none`, one message `messageId(spec.n, 1)` in `threadId(spec.n)`, sequence 1, the run `runId(spec.n, 1)`, `content: spec.message`, `delivery: 'started_run'`, `created_at` at `runStart(spec)`.
- `addMessage(thread, sent)`, in this order:
  1. The run: `findRun(thread.active_run_id)` when the thread has one, else `startRun(thread, now, sent.runDefaults, sent.models)`.
  2. The message: `nextCreatedId(IdPrefix.Message, createdMessages)`, `sequence` = `messagesOfThread(thread.id).length + 1`, `delivery` `started_run` or `pending`, `created_at` `mockNow()`; added to `createdMessages`.
  3. A thread without a title takes `nameFromMessage(content)` as its title (`changeThread`; Data Shape: "generated from the first message").
  4. The project, as on `main`: the first message of a run that starts while `initial_message_id` is null becomes it, and names a project without a name; `last_activity_at` is now.

`validateSentMessage(given)` and the thread validators, each problem at the field that the API names (decision 10):

| Body | Field | Rule | Problem |
|---|---|---|---|
| `POST /threads/{thread_id}/messages` | `content` | A text with more than whitespace | `requiredTextProblem('content')` |
| | `run_config` | Left out, or `validateRunDefaults` | Its problems, at `run_config.<field>` |
| | `models` | Left out, or an object | `jsonObjectProblem('models')` |
| | `models.<key>` | The key an agent role of `workflowDefinitionFixture.agent_roles`; the value a text | `choiceProblem('models.<key>')`, `requiredTextProblem('models.<key>')` |
| `POST /projects/{project_id}/threads` | `title` | Left out or null; else a text with more than whitespace | `requiredTextProblem('title')` |
| `PATCH /threads/{thread_id}` | `title` | Left out, or a text with more than whitespace (null refused) | `requiredTextProblem('title')` |
| | `status` | Left out, or one of `threadStatuses` | `choiceProblem('status')` |

The handlers, in the order of the mock README (`answerScenario`, the record, the checks, the change, the answer):

- `GET threads.pattern`: `answerScenario('threads')`; the empty scenario answers `emptyPage`; `?project_id=` keeps the threads of that project; sorted by `last_message_at` descending, then `id` (decision 9); `paginate`.
- `GET projectThreads.pattern`: as on `main` (`answerScenario('threads')`, `findProject` or `projectNotFound()`, the empty scenario, the sort), with the tie by `id`.
- `POST projectThreads.pattern`: `answerScenario('create-thread')`; `findProject` or `projectNotFound()`; `validateNewThread` or `validationFailed`; `buildThread` with `nextCreatedId(IdPrefix.Thread, createdThreads)`; `created(thread, apiEndpoints.thread.path(...))`.
- `GET thread.pattern`: `answerScenario('thread')`; the empty scenario, or `findThread` undefined: `threadNotFound()`; the thread.
- `PATCH thread.pattern`: `answerScenario('update-thread')`; `findThread` or `threadNotFound()`; `validateThreadChange` or `validationFailed`; `changeThread(threadId, { ...change, updated_at: mockNow() })`; `HttpResponse.json(findThread(threadId))`.
- `DELETE thread.pattern`: `answerScenario('delete-thread')`; `findThread` or `threadNotFound()`; `refuseUnfinishedRun(threadId)` (409, decision 8); `removeThread(threadId)`; `noContent()`.
- `GET threadMessages.pattern`: `answerScenario('messages')`; `findThread` or `threadNotFound()`; the empty scenario answers `emptyPage`; `paginate(messagesOfThread(threadId), request)`.
- `POST threadMessages.pattern`, wrapped in `idempotent` (as on `main`): `answerScenario('send-message')`; `findThread` or `threadNotFound()`; `validateSentMessage` or `validationFailed`; `addMessage`; `created({ message, run })`.

Scenarios: `mock-threads`, `mock-thread`, `mock-send-message` (as on `main`); new: `mock-messages` (`empty`, `error`, `loading`), `mock-create-thread`, `mock-update-thread`, `mock-delete-thread` (`error`, `loading`).

What the mock data then holds: the mentor thread has four messages (two runs started, one agent message, one message delivered in run 3); a message sent to it while run 3 waits is `pending` for run 3; a message to a thread whose run has ended starts a run, and the first message of a new thread names it. Deleting the mentor thread answers 409 while run 3 is unfinished, and works with `?mock-run-status=done`.

## 10. Tests

Data-driven where the cases share one flow (CONTRIBUTING, Testing); every new reader and handler has cases for what it refuses.

| Test | Cases |
|---|---|
| `thread/entities/api/__tests__/threads.api.test.ts` with `.data.ts` | `itSendsRequests`: `listProjectThreads` (first page, after a cursor), `listThreads` with and without `projectId` (`?project_id=...&limit=...`), `getThread`, `createThread` with and without a title, `updateThread`, `deleteThread`. `itThrowsApiErrors`: 404 for each `GET`, 409 for `deleteThread`, 422 for `updateThread`. Against the mock: the thread of the mentor platform with `latest_run_status`; `sendFirstMessage` sends the key with the message and not with the thread (the test of `main`, kept) |
| `thread/entities/api/__tests__/messages.api.test.ts` with `.data.ts` | `itSendsRequests`: `listThreadMessages` (first page, after a cursor), `sendMessage` with its body (with `run_config` and `models`) and `HttpHeader.IdempotencyKey`. Against the mock: the four messages of the mentor thread in order; `sendMessage` to a thread whose run ended answers `started_run` with a new run |
| `thread/entities/keys/__tests__/threads.keys.test.ts` with `.data.ts` | `itNestsQueryKeys` (all, lists, ofProject, list, detail), `itTellsQueryKeysApart` (two projects; two filters; a project list and a user list) |
| `thread/entities/keys/__tests__/messages.keys.test.ts` with `.data.ts` | `itNestsQueryKeys` (all, ofThread), `itTellsQueryKeysApart` (two threads) |
| `thread/entities/hooks/__tests__/useThreadQueries.test.ts` | `useProjectThreads`, `useThreads` and `useThread` load (with `pageItems` for the lists); `itWaitsUntilEnabled` for each with `isEnabled: false` |
| `thread/entities/hooks/__tests__/useMessageQueries.test.ts` | `useThreadMessages` loads (with `pageItems`); `itWaitsUntilEnabled` for `isEnabled: false` |
| `mocks/threads/__tests__/threads.lookup.test.ts` with `.data.ts` | For each `?mock-run-status`, the three run fields of the mentor thread; run 3 stopped; `?mock-runs=empty`; `last_message_at` of the mentor thread is the time of message 7; an edit wins over the fixture; a deleted thread is left out |
| `mocks/threads/__tests__/threads.validators.test.ts` with `.data.ts` | Each `title` and `status` row of section 9, accepted and refused, for `validateNewThread` and `validateThreadChange` |
| `mocks/threads/__tests__/threads.handlers.test.ts` with `.data.ts` | The cases of `main`, with `latest_run_status`; `GET /threads` sorted by `last_message_at`; `POST` with a title; `PATCH` renames and archives, and `GET` reads the change; `DELETE` with `?mock-run-status=done` answers 204, then `GET` the thread, its messages and `POST` a message answer 404 and the lists leave it out. `itRejectsRequests`: `PATCH` and `DELETE` of a missing thread (404), `DELETE` of the mentor thread while run 3 waits (409), a blank title, a null title on `PATCH`, an unknown status (422), the error scenarios of `create-thread`, `update-thread`, `delete-thread` (500) |
| `mocks/messages/__tests__/messages.validators.test.ts` with `.data.ts` | Each row of `content`, `run_config` and `models`, accepted and refused; the body of the API example accepted |
| `mocks/messages/__tests__/messages.changes.test.ts` with `.data.ts` | `nameFromMessage` (the cases of `main`, moved); `addMessage`: the sequence after the fixtures (5 in the mentor thread), `pending` for the unfinished run, `started_run` with `models` applied to the run, the title of a thread without one |
| `mocks/messages/__tests__/messages.handlers.test.ts` with `.data.ts` | The cases of `main` (with `getApiItems`); `GET` of the mentor thread (four messages, `sequence` 1 to 4), the empty scenario, a generated project (its one message); a sent message then listed last; `itRejectsRequests`: `GET` of a missing thread (404), `models` not an object, an unknown role, a role without a model (422), the error scenario of `messages` (500) |
| `mocks/generated/fixtures/__tests__/generated-projects.fixtures.test.ts` with `.data.ts` | `threadFixtures` without `('waiting')` in the unique ids case (commit 2); the case that reads `active_run_id` of `generatedThreads()` moves to `threads.lookup.test.ts`, read from `allThreads()`, since the fixtures no longer hold it (commit 2); a new case: `generatedMessages()` gives one message for each spec with a run, whose id is the `initial_message_id` of its project (commit 4) |

## 11. Docs to update

Docs first, on `docs/fe/api-fields`, once the user confirms decisions 8, 9 and 10:

- `docs/API.md`, Threads and messages: the row of `GET /threads` with its order (decision 9); the row of `DELETE /threads/{thread_id}` with the 409 and the 404 (decision 8); the rows of `POST /projects/{project_id}/threads`, `PATCH /threads/{thread_id}` and `POST /threads/{thread_id}/messages` with the rules of `title`, `status` and `models` (decision 10).
- Still open from E5, left to the user: the order of the interrupts by `created_at`; the pending interrupt set to `cancelled` when a run is cancelled.

In the PR (last commit):

| Doc | Change |
|---|---|
| `docs/architecture/web-app-modules.md`, section 1, tree | `thread/entities/  # Thread, Message` |
| Same, section 5, links between entities | Row `thread` -> `run`: "The run statuses; `runSchema`, the run that a message starts; RunDefaults; the polling of a run that works" (instead of "The unfinished run statuses"); new row `thread` -> `artifact`: "`artifactRefSchema`, `itemRefSchema`, the references of a message" |
| Same, section 6, row `thread` | State: "The entities; `send-message` with the activity" |
| `docs/architecture/web-app.md`, section 9 | New row "Threads and messages": `thread`, entities; `modules/thread/entities/api/threads.api.ts`, `api/messages.api.ts`, `types/threads.types.ts`, `types/messages.types.ts`, `hooks/useThreadQueries.ts`, `hooks/useMessageQueries.ts`; `modules/thread/features/send-message` later |
| `frontend/README.md`, Mock data | Rows `threads` (the six endpoints) and `messages` (`GET`, `POST /threads/{thread_id}/messages`) in the table of resources |
| `src/mocks/README.md` | Rows `mock-messages`, `mock-create-thread`, `mock-update-thread`, `mock-delete-thread` in Parameters; row Thread "Main thread": "the mentor thread holds runs 1, 2 and 3 and four messages"; in Mock data, one sentence: a thread with an unfinished run cannot be deleted, a deleted thread answers 404, and `?mock-reset` brings it back; "the threads that `PATCH` changed and `DELETE` deleted" in the list of what the mock server keeps |
| `docs/frontend-implementation-plan.md` (on `frontend-plan`) | Row E6: "As built", with what differs from this plan; the D8 table: `threads.utils` and `@x/project` of the threads under P7 (decision 6); checklist |

## 12. Left for the next PRs

The agent writes no code for these; they go in the docs where named.

| Item | When | Note |
|---|---|---|
| `thread/features/send-message`: `useSendMessage` | S2 | Key from `newIdempotencyKey` once per action, one retry with the same key (D7); a failed message keeps its key; invalidates `messageKeys.ofThread(threadId)`, `threadKeys.detail(threadId)`, `threadKeys.lists()`, `runKeys.ofThread(threadId)`, `runKeys.latestOfThread(threadId)` |
| Rename, archive and delete of a thread (features and their dialog) | The screen that lists several threads | Delete asks first (Destructive actions); invalidates `threadKeys.all()` and `messageKeys.ofThread(threadId)` |
| `threadsByAttention`, `thread/entities/@x/project` | P7 | Decision 6; from the P7 backup, with `buildThread` |
| How a thread without a title reads, the labels of `delivery` and of a thread status (`Wording`) | S2 | No screen shows them yet |
| The chat needs the newest messages first | S2 | `GET /threads/{thread_id}/messages` is ordered by `sequence` ascending, so a long chat loads every page before its last message. Options for `docs/API.md`: `?order=desc`, or a cursor that starts at the end; decide with the chat |
| The `message_delivered` event | S2 | On the event, invalidate `messageKeys.ofThread(threadId)`; the payload is not parsed |
| The mock never delivers a `pending` message | S2 | A message sent to run 3 stays `pending`; the steps of the mock do not move on |
| The models of a message checked against the catalog | E7 | `models.<role>` must be a model of `GET /models` that the user has enabled; the mock of E7 adds the check |
| The model overrides of a project in the run that a message starts | E7 or S5 | `resolveRunConfig` reads `run_config` of the project and not `model_overrides` |
| The runs of a deleted thread | With the delete of a thread | The mock leaves them in `allRuns()`, so they count in the rollup of the project; decide with the screen whether the API leaves them out |
| An archived thread that receives a message | With the screen that archives | The API refuses nothing; the mock accepts it. Ask in `docs/API.md` if a message makes the thread active again |
| `POST /threads/{thread_id}/runs` and `createRun` | S2 | Not in the API ([D5](frontend-implementation-plan.md#d5-endpoints-that-the-api-lacks)); S2 replaces the first chat with `sendMessage` and removes them |

## 13. Commits and checks

1. `refactor(frontend): move the thread entity files into folders by kind`: `git mv` only, with the import specifiers that follow
2. `fix(frontend): read the status of the latest run of a thread`: `latest_run_status` in `threadSchema`, `@x/thread` of `run`, the derived fields of the threads lookup, the fixtures and `generatedThreads` without run fields, the tests of `main` with the new field
3. `feat(frontend): add the types of the threads and their messages`: `types/threads.types.ts` (the lists, the filters, the bodies), `types/messages.types.ts`, `@x/thread` of `run` and of `artifact`, the type exports of `index.ts`
4. `feat(frontend): mock the messages of a thread and the changes of a thread`: `mocks/threads/` and `mocks/messages/` as in section 9, `buildStepId`, `models` in `addRun`, `generatedMessages`, the mock tests
5. `feat(frontend): read and change the threads and their messages`: the api, constants, keys, hooks, `index.ts`, their tests
6. `docs(frontend): describe the thread entity and its mock in the guides`

The mock comes before the API functions, so that the tests of commit 5, which run against the mock, pass on each commit. If the user prefers the move apart from the feature, commit 1 goes to a maintenance PR and E6 waits for it.

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on `src/modules/thread`, `src/mocks/threads`, `src/mocks/messages`, `src/mocks/generated`, `src/mocks/runs`, `src/mocks/projects`, `src/modules/project/features/create`; `pnpm typecheck` once, since types and exports change. No full suite, E2E, screenshots or build. Then:

- `grep -rnE "FR-[0-9]|NFR-[0-9]|docs/" frontend/src/modules/thread frontend/src/mocks/threads frontend/src/mocks/messages` answers nothing; `grep -rniE "backend|frontend|\bUI\b|dashboard"` on the new comments too.
- `grep -rnwE "active_run_status|sentMessages|SentMessage|createdThreadSchema|threadsBeforeAnyRun|mentorMainStages" frontend/src` answers only `SentMessage` of `thread/entities/types/messages.types.ts` and its users.
- `grep -nP '[^\x00-\x7F]'` on each changed doc shows only tree lines.
- No `console.log`; nothing committed or pushed without the user.

## 14. Checklist

- [x] Decisions 8, 9 and 10 confirmed by the user (2026-10-31)
- [x] Those rules written in `docs/API.md` in the worktree of `docs/fe/api-fields` (2026-10-31)
- [ ] That change committed on `docs/fe/api-fields`
- [ ] The maintenance PR of `refactor/fe/mock-ids-and-test-helpers` (#44, draft) merged, and the branch cut from `origin/main` after it
- [ ] Commit 1: the move, shown as renames
- [ ] Commit 2: `latest_run_status` in the entity and the mock; the run fields derived from the runs
- [ ] Commit 3: the types, the two `@x/thread` files, the type exports of the index (so that commit 4 compiles)
- [ ] Commit 4: the mock, all its new files tested, the seven messages with ids that match `initial_message_id`
- [ ] Commit 5: the entity, every endpoint with its API function, key, hook and tests
- [ ] Commit 6: docs
- [ ] `useCreateProject` and its tests unchanged and green
- [ ] Every state reachable in `pnpm dev:mock` through a scenario of section 9
- [ ] Only the checks of section 13 ran
- [ ] Row E6 of the implementation plan updated
