# E7 `llm-model` entities: plan

Draft of 2026-10-31, reviewed the same day (entities by topic), for an agent to implement. Not committed. Next row of the PR table after P7 (`feat/fe/project-status`, draft #49); E7 reads no code of P7, but starts once P7 is merged, as every row does, and follows the split by topic that P7 brought.

Short paths: `llm-model/entities/...` is `frontend/src/modules/llm-model/entities/...`, `mocks/...` is `frontend/src/mocks/...`, `test/...` is `frontend/src/test/...`; any other path that starts with `modules/` or `shared/` is under `frontend/src/`.

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
| Branch | `feat/fe/model-entities`, from `origin/main` once P7 is merged |
| Title | `feat(frontend): read the model catalog, and read and replace the model settings of the user` |
| Needs | P7 (#49): the row above in the PR table, and the first entity of a module with two topics (`project`: `projects`, `run-status`), whose entry in `topicEntityModules` E7 adds its own beside. E7 reads no code of P7 |
| After it | E8 (`user`), E9 (`usage`); S5 (Settings) builds the form of the model settings on it, and S2 the model of a message |
| Docs first | Decisions 7, 8 and 9 are gaps of `docs/API.md` and `docs/DATA_SHAPE.md`, confirmed by the user on 2026-10-31 and written in the worktree of `docs/fe/api-fields` (not committed). Commit them there before commit 4 (the mock follows them). Decision 1 changes a placement rule: commit 1 (`docs`) and commit 2 (`build`) come before the code that follows it |

The module `llm-model` has no place in `moduleImports` of `frontend/lint/lib/modules/module-imports.constants.js` and no entry in `topicEntityModules` of `frontend/lint/lib/file-names/file-kinds.constants.js` yet: commit 2 adds both (section 7). `fileKinds` does not change.

## 2. What was read

| Source | What it gives this PR |
|---|---|
| [Frontend implementation plan](frontend-implementation-plan.md) (branch `frontend-plan`), rows E7 and E8, sections 4 and 9 | The endpoints; the copies from `feat/fe/mock`; `modelEntrySchema` of the project settings goes; `llm-model` imports no module |
| [E6 plan](frontend-e6-thread-plan.md) (branch `frontend-plan`), section 12 | The shape of an entity plan; two items left to E7: the models of a message checked against the catalog, and the model overrides of a project in the run that a message starts |
| [Prompt: create a frontend entity plan](prompt-create-frontend-entity-plan.md) (branch `frontend-plan`) | The sections of this plan and the rules |
| [API](API.md), Conventions and Settings and models | `GET /models`, `GET`, `PUT /me/model-settings`; lists use the envelope and cursor paging (limit 50 by default, 200 at most); `PUT` replaces a settings document and answers `200`; `422 validation_failed` with `errors` at the fields |
| [Data Shape](DATA_SHAPE.md), Identifiers, Common fields, ModelCatalogEntry, ModelSettings, Agent roles, RunConfig | The fields; a ModelCatalogEntry has no common field (server configuration, identified by `model_id`); a ModelSettings row has `id`, `created_at`, `updated_at`; one row per user and role; `model_id` must exist in the catalog and allow the role; the order of the levels of `models` in a run (request, `Project.model_overrides`, ModelSettings, server default) |
| [Web App Modules](architecture/web-app-modules.md), sections 1, 2, 4, 5 and 6 | `llm-model` holds ModelCatalogEntry and ModelSettings; its endpoints; the name `llm-model` and not `model`; the entities of `run`, `workflow` and, after P7, `project` split by topic |
| `feat/fe/project-status` (P7) | `project/entities` split into `projects/` and `run-status/`, two topics that read nothing of each other, listed in `topicEntityModules`; the rule written in [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md), Placement item 6, but not yet in CONTRIBUTING, which still says "many topics (more than about five)" |
| `frontend/CONTRIBUTING.md`, `frontend/README.md` (Mock data, Files of a mock folder), `src/mocks/README.md` | Files of a slice (topics: files flat, `hooks/` and `__tests__/` in each topic), hooks of a slice, keys, `find`/`get`, request bodies, the layers and names of a mock folder, the scenarios |
| `docs/skills/feature-sliced-design/SKILL.md`, `docs/skills/clean-review/SKILL.md` | No business logic in shared code; the extraction rule; the 7 checks used on each decision below |
| `main` | `user/entities` (one resource, files at the root, `useMe` with its private stale time); `thread/entities` (two resources, folders by kind, the option that decision 1 sets aside); `workflow/entities/checkpoints` (a topic with one hook in `hooks/`); `workflow/entities/artifact-kinds` (a catalog read whole); `fetchAllPages` of `shared/api/request`; `mocks/messages/messages.validators.ts` (`validateModels`); `resolveRunConfig` of `mocks/runs/lookup/runs.lookup.ts`; `defaultRunConfigFixture` of `mocks/runs/fixtures/runs.fixtures.ts` (`anthropic:claude-sonnet-5`, `openai:gpt-4.1-mini`); `schemaProblems` of `mocks/shared/http/validation` |
| `origin/feat/fe/mock` | `catalogModelSchema` and `modelChoiceSchema` of `features/settings/settings.types.ts`; `listCatalog`, `listModelChoices`, `replaceModelChoices` of `features/settings/settings.api.ts`; `mocks/models.fixtures.ts`, `mocks/models.handlers.ts`; the model-settings handlers and `mockModelChoices` of `mocks/account.handlers.ts` and `mocks/account.fixtures.ts`; `modelEntrySchema` of `features/project-settings/project-settings.types.ts` |

## 3. Decisions

Taken from the docs and the conventions; the agent applies them as written:

1. **Two topics: `models` and `model-settings`.** `llm-model` reads two resources that change for different reasons and read nothing of each other: the catalog (`/models`) is server configuration that the user only reads and that changes with a deploy; the model settings (`/me/model-settings`) are what the user chooses and saves. A setting names a model by its `model_id`, a string, and the check that the model serves the role is the server's, so `model-settings` needs no type or rule of `models`.

   | Option | Evaluation |
   |---|---|
   | a. Folders by kind, as `thread/entities`: `api/`, `types/`, `keys/`, `hooks/` | The rule of CONTRIBUTING today for a slice of several resources; the files of one resource sit in four folders, and nothing stops a setting from reading the catalog |
   | b. Folders by topic, as `project/entities` after P7: `models/` and `model-settings/`, each with its files flat, its `hooks/` and `__tests__/` | Each resource in one folder, with every file of its role beside it; `topicEntityModules` makes ESLint refuse an import from one topic to the other |

   Decision: b. `topicEntityModules['llm-model']` is `{ 'model-settings': [], models: [] }`. The root holds the two topics and `index.ts` only (no `components/`, no `@x/`: no other entity reads `llm-model`). Each topic keeps the kinds of a topic of `run`: `<subject>.api.ts`, `.keys.ts`, `.types.ts`, `.constants.ts` (its page size), `hooks/use<Resource>Queries.ts` (one hook, in `hooks/` as `workflow/entities/checkpoints`), and `__tests__/` beside them. Since CONTRIBUTING still ties topics to "many topics (more than about five)", commit 1 writes the rule that P7 followed: an entity splits by topic too when its parts change for different reasons and read nothing of each other, as `project`.
2. **One name for one concept: the names of Data Shape.** The catalog entry is `ModelCatalogEntry` (not `CatalogModel` of `feat/fe/mock`, not `ModelEntry` of its project settings), and a row of ModelSettings is `ModelSetting`, the model of one agent role (not `ModelChoice`). The topics, and the subjects of their files, are the resources: `models` (the path `/models`) and `model-settings`. `modelEntrySchema` of the project settings is the same object and is not copied: the project settings screen (S5) reads `ModelCatalogEntry`.
3. **The full fields of Data Shape.** `modelCatalogEntrySchema` has every field of ModelCatalogEntry (`feat/fe/mock` left out `capabilities`, `context_window` and the cache prices), with `capabilities` from `modelCapabilities`; it has no common field. `modelSettingSchema` has `id`, `user_id`, `agent_role`, `model_id`, `temperature`, `created_at`, `updated_at`. `z.object`, not `z.looseObject`, as every other entity.
4. **`llm-model` imports no module.** An agent role is a string in Data Shape, and the entity holds no rule that reads the definition, so `moduleImports['llm-model']` is `[]`, as section 4 of the implementation plan says. The module that shows the roles next to their models (S5) reads both.
5. **Both lists are read whole.** The catalog is server configuration, a few models; the model settings hold at most one row per agent role (nine in version 1). `listModels` and `listModelSettings` read every page with `fetchAllPages` in pages of 200, the largest the API allows, and the hooks are plain queries, not infinite ones (as `listProjectArtifacts`).
6. **The mutation hook waits for its feature.** The entity holds the API function of every endpoint, `replaceModelSettings` included; its hook (`useReplaceModelSettings`) belongs to the feature of S5 that saves the form, which invalidates `modelSettingKeys.all()` (as decision 5 of E6). No rule of the catalog (the models of a role, the label of a capability) is written before a screen reads it: CONTRIBUTING, "Write a helper when code uses it already".

Gaps of `docs/API.md` and `docs/DATA_SHAPE.md`, confirmed by the user on 2026-10-31 and written in the worktree of `docs/fe/api-fields` (docs-first rule; the mock follows them):

7. **The body of `GET` and `PUT /me/model-settings`.** The API gave the purpose only.

   | Option | Evaluation |
   |---|---|
   | a. The envelope of a list: `GET` answers `{ items, next_cursor }` of ModelSettings rows, `PUT` takes `{ items }` of `agent_role`, `model_id`, `temperature` and answers the list as `GET` does | Follows "Every list endpoint uses cursor pagination and the same envelope"; one row per role, as Data Shape stores it; the shape of `feat/fe/mock` |
   | b. A map by role: `{ models: { <role>: { model_id, temperature } } }` | The shape of `model_overrides` and `Run.models`, but a settings document of its own kind with no paging, and the rows lose their `id` |

   Decision: a. The rows of `docs/API.md`:
   - `GET /me/model-settings`: the ModelSettings of the user, one for each agent role that the user chose a model for, ordered by `agent_role`; a role without one uses the server default.
   - `PUT /me/model-settings`: body `items`, a list of `agent_role`, `model_id` and an optional `temperature`; a role left out uses the server default. Each `agent_role` is an agent role of the current workflow definition, given once; each `model_id` is a model of the catalog whose `allowed_roles` holds the role; otherwise `422 validation_failed` at `items.<index>.agent_role`, `items.<index>.model_id` or `items.<index>.temperature`. Returns `200` with the settings as `GET` lists them.
8. **The range of `temperature`.** Data Shape said only "Null means the role default". Options: 0 to 1, a range that every provider of the catalog accepts (Anthropic 0 to 1, OpenAI 0 to 2); 0 to 2, as `feat/fe/mock`, which lets a value through that an Anthropic model refuses; any number from 0, left to the provider. Decision: from 0 to 1, in the row of Data Shape and in the rule of `PUT` above.
9. **The models of a message and of a project are checked against the catalog.** The API checked only that each value of `models` (send message) is a text, and nothing for `model_overrides` (`PATCH /projects/{project_id}`). Decision: one rule for the three places: the value is a model of the catalog whose `allowed_roles` holds the role, else `422 validation_failed` at `models.<role>` or `model_overrides.<role>`. E7 adds the check to the mock of the messages (E6, section 12); the mock of `PATCH /projects` reads no `model_overrides` yet, so its check waits for the project settings (section 12).

   And the order of the catalog, which the API did not state ("Stated per endpoint and stable"): `GET /models` ordered by `model_id`, written in its row. The ids are unique, so no tie.

10. **The mock starts a run with the model settings.** Data Shape resolves `models` of a run from the request, then `Project.model_overrides`, then the ModelSettings of the user, then the server default. `resolveRunConfig` of `main` reads only the request and the default (E6, section 12). With the store of the model settings in this PR, it takes all four levels: `{ ...defaultRunConfigFixture.models, ...modelsOfUserSettings(), ...project?.model_overrides, ...models }`.
11. **The ids of the catalog follow the API examples.** The runs of the mock use `anthropic:claude-sonnet-5` and `openai:gpt-4.1-mini`, and the API examples `openai:gpt-4.1`; `feat/fe/mock` named its models `anthropic:claude-opus-5-5` and the like. The fixtures use the names of the examples (`anthropic:claude-opus-5`, `anthropic:claude-sonnet-5`, `anthropic:claude-haiku-5`, `openai:gpt-4.1`, `openai:gpt-4.1-mini`, `local:llama-3.3-70b`), and every model of `defaultRunConfigFixture` serves its role in the catalog, which a test checks (section 10).
12. **The id of a ModelSettings row is fixed by its role.** One user, one row per role: the row of a role has the id `mockId(IdPrefix.ModelSetting, n)`, `n` the place of the role in `workflowDefinitionFixture.agent_roles` from 1, in the fixtures and after a `PUT`. A `PUT` keeps the `created_at` of a role that had a row, sets `updated_at` to now for a row that changed, and drops the rows of the roles left out. `nextCreatedId` does not fit: it counts the records of a list that only grows.
13. **Each piece in the place of its role.** Checked file by file, with the rules of CONTRIBUTING (Inside a slice, Types and constants) and of the mock README (Layers):

    | Piece | Place | Why there |
    |---|---|---|
    | Schemas, the list of capabilities, the request body | `<topic>.types.ts` | A `types` file defines the values of its subject; the body is a type of the request, not of a component |
    | Page sizes | `<topic>.constants.ts`, one in each topic | Settings of the topic; a constants file declares no function and exports no type |
    | The stale time of the catalog | Private `CATALOG_STALE_TIME` in `models/hooks/useModelQueries.ts` | Read by that hook only, as `ME_STALE_TIME` in `useMe.ts`; exported it would have to be camelCase and tested |
    | The requests | `<topic>.api.ts` | Only `api` files call `apiRequest` and `fetchAllPages` |
    | The keys | `<topic>.keys.ts`, one factory for each resource | `modelSettingKeys.all()` invalidates every query of the settings and nothing of the catalog |
    | The query hooks | `<topic>/hooks/use<Resource>Queries.ts` | The hooks that read the API go together by resource |
    | The mutation hook, the form, the rule "the models of a role" | Not in this PR | Features and the screen that reads them (decision 6 and section 12) |
    | `listPageSchema` | `shared/api/request`, exported | The envelope of every list, no object of the product |
    | `modelIdsForRole`, the check of a model for a role | `mocks/models/models.lookup.ts`, read by the validators of `model-settings` and `messages` | A rule of the mock server, which resolves the catalog; a validator reads a lookup, the layer under it |
    | `modelsOfUserSettings` | `mocks/model-settings/model-settings.lookup.ts`, read by `resolveRunConfig` of `mocks/runs/lookup/` | A resource reads another through its lookup |
    | `modelSettingId(role)` | `mocks/model-settings/model-settings.fixtures.ts`, read by its `changes` | Ids of the mock data are built where the fixtures are, as `buildStepId` |
    | The public API | `index.ts`: the API functions, the keys, the hooks and the types; not `modelCapabilities` nor the schemas | The exports follow the readers: the features of S5 call the functions, hooks and keys; no slice outside reads the list of capabilities or a schema yet |

## 4. Scope

Endpoints: `GET /models`, `GET /me/model-settings`, `PUT /me/model-settings`. None is in `apiEndpoints` yet: commit 4 adds `models` and `modelSettings`.

Copy (read with `git show origin/feat/fe/mock:frontend/src/<path>`):

| Copy | From | To | What changes |
|---|---|---|---|
| `catalogModelSchema` | `features/settings/settings.types.ts` | `llm-model/entities/models/models.types.ts` | Named `modelCatalogEntrySchema`, every field of Data Shape, `z.object` (decisions 2, 3) |
| `modelChoiceSchema` | the same file | `llm-model/entities/model-settings/model-settings.types.ts` | Named `modelSettingSchema`, with `id`, `user_id`, `created_at`, `updated_at` (decisions 2, 3) |
| `listCatalog`, `listModelChoices`, `replaceModelChoices` | `features/settings/settings.api.ts` | `llm-model/entities/models/models.api.ts`, `model-settings/model-settings.api.ts` | Named `listModels`, `listModelSettings`, `replaceModelSettings`; `apiEndpoints`; `fetchAllPages` with a page size; `replaceModelSettings` takes `ReplaceModelSettingsBody` |
| The six models of `mockModels` | `mocks/models.fixtures.ts` | `mocks/models/models.fixtures.ts` | Named `modelFixtures`, typed `ModelCatalogEntry[]`, ids of the API examples (decision 11), sorted by `model_id` |
| The `GET` handler of `mocks/models.handlers.ts` | `mocks/models.handlers.ts` | `mocks/models/models.handlers.ts` | `answerScenario('models')`, `emptyPage` |
| `mockModelChoices` and the two model-settings handlers | `mocks/account.fixtures.ts`, `mocks/account.handlers.ts` | `mocks/model-settings/` | Rows with the fields of decision 3 and ids of decision 12; the checks of decision 7 with `schemaProblems` and `choice`; the layers of a mock folder |

Write: the key factories, the query hooks, the page sizes, the public API, the endpoints, the lookups, store, changes and validators of the two mock folders, the catalog check of the messages, the four levels of `resolveRunConfig`, the tests, the docs.

Not copied:

| Code | Why |
|---|---|
| `modelEntrySchema`, `useModels` of `features/project-settings/` | The same object as the catalog entry (decision 2); a hook with its key written by hand |
| `ModelChoicesForm`, `ModelsForm` and the settings sections | Screens of the old frame; S5 builds the Settings feature |
| `usageGroups`, `usageSchema`, `getUsage` of `features/settings/` | E9 |
| `userSettingsSchema`, `profileSchema`, `sessionSchema` and their API functions | E8 |
| `costOf` of `mocks/account.fixtures.ts` | The usage of E9 prices its records with it; E9 copies it, reading `modelFixtures` |
| `isRecord` written in `mocks/account.handlers.ts` | `isRecord` of `@/shared/lib/guards` |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| API function | verb + object; `list` reads a list | `listModels`, `listModelSettings`, `replaceModelSettings` |
| Query hook | `use` + object | `useModels`, `useModelSettings` |
| Topic | the resource, kebab-case | `models`, `model-settings` |
| Hook file | `<topic>/hooks/use<Resource>Queries.ts` | `models/hooks/useModelQueries.ts`, `model-settings/hooks/useModelSettingQueries.ts` |
| Key factory | `<resource>Keys` | `modelKeys`, `modelSettingKeys` |
| Request body | `<Action>Body` | `ReplaceModelSettingsBody` |
| List of values and its type | in the `types` file | `modelCapabilities` with `ModelCapability` |
| Entity types | the names of Data Shape | `ModelCatalogEntry`, `ModelSetting` |
| Page size | `<topic>.constants.ts`, camelCase | `modelsPageSize` in `models.constants.ts`, `modelSettingsPageSize` in `model-settings.constants.ts` |
| Stale time | private setting in the hook file, as `ME_STALE_TIME` | `CATALOG_STALE_TIME` |
| Endpoints | `apiEndpoints.<name>` | `models`, `modelSettings` |
| Id prefix | `IdPrefix.<Kind>` | `IdPrefix.ModelSetting = '6d1e'` |
| Mock fixtures | `<thing>Fixtures`, `build<Thing>` | `modelFixtures`, `modelSettingFixtures`, `buildModelSetting(role, fields)`, `modelSettingId(role)` |
| Mock reads | `all<Things>`, `find<Thing>`, `<things>Of`; never the name of an API function | `allModels()`, `modelIdsForRole(role)`, `allModelSettings()`, `findModelSetting(role)`, `modelsOfUserSettings()` |
| Mock writes | `change<Thing>`; never the name of an API function | `changeModelSettings(choices)` (not `replaceModelSettings`) |
| Mock checks | `validate<Body>` | `validateModelSettings` |
| Mock store | named after what it holds | `replacedModelSettings` (null until a `PUT`) |
| Scenarios | `mock-<group>` | `mock-models`, `mock-model-settings`, `mock-replace-model-settings` |

## 6. Shared code first

### Reuse

| Need | Use | From |
|---|---|---|
| The paths of the endpoints | `apiEndpoint`, `apiEndpoints.models`, `apiEndpoints.modelSettings` | `@/shared/api/endpoints` (extended, section 7) |
| A request, every page of a short list, the envelope of a list | `apiRequest`, `fetchAllPages`, `listPageSchema` | `@/shared/api/request` (`listPageSchema` exported, section 7) |
| The method, the statuses in tests | `HttpMethod`, `HttpStatus` | `@/shared/api/http` |
| The options of a query hook | `HookQueryOptions` | `@/shared/api/query-client` |
| The stale time of server configuration | `isProduction` | `@/shared/config/env` |
| Mock: scenario, body | `answerScenario`, `readBodyFields` | `mocks/shared/scenario`, `mocks/shared/http/request` |
| Mock: answers | `paginate`, `emptyPage`, `validationFailed` | `mocks/shared/http/response` |
| Mock: checks of a body | `schemaProblems` (types, `required`, `additionalProperties`, `minimum`, `maximum`), `choice`, `choiceProblem` | `mocks/shared/http/validation` |
| Mock: ids, time, state | `mockId`, `IdPrefix`, `userId`, `mockNow`, `mockState` | `mocks/shared/db`, `mocks/shared/http/request` |
| Mock: the agent roles of the definition | `workflowDefinitionFixture.agent_roles` | `mocks/workflow/workflow.fixtures.ts` |
| Mock: the server default of the models | `defaultRunConfigFixture.models` | `mocks/runs/fixtures/runs.fixtures.ts` |
| Tests | `itSendsRequests`, `itThrowsApiErrors`, `itNestsQueryKeys`, `itTellsQueryKeysApart`, `itWaitsUntilEnabled`, `itRejectsRequests` | `@/test/suites` |
| Tests | `getApi`, `getApiItems`, `putApi`, `postApi`, `serverErrorOn` | `@/test/msw` |
| Tests | `renderHookWithProviders`; `waitForSuccess` | `@/test/render`; `@/test/steps` |

### Extract before the new code

None. A search of `src/` for what E7 would write a third time finds:

| Candidate | Copies | Result |
|---|---|---|
| The envelope of a list as a schema | `listPageSchema`, private in `api-page.utils.ts` | Exported from `@/shared/api/request`, for the answer of `PUT`; no new code |
| A number in a range read from a body | `schemaProblems` checks `minimum` and `maximum` | Used for `temperature`; no new reader |
| A value that must be one of a list | `choice` and `choiceProblem` | Used for the role and the model; no new reader |

### Checked, not extracted

| Code | Copies | Why it stays |
|---|---|---|
| The stale time of what changes only with a deploy (an hour in production, ten minutes in other builds) | `workflowDefinitionStaleTime` of `workflow`, now `CATALOG_STALE_TIME` of `llm-model`: two | `llm-model` may not import `workflow`; two copies are a warning, not a helper. A third copy moves the rule to `shared/config/env` as `deployStaleTime` |
| "A model of the catalog that serves this role" | `modelIdsForRole(role)` of `mocks/models/models.lookup.ts`, read by the model settings and the messages | One function already; the entity writes no copy until S5 needs a picker (decision 6) |
| The roles of the definition as a set | `validateModels` of the messages, now `validateModelSettings`: two | Two copies of `new Set(agent_roles.map(({ key }) => key))`; the third (project overrides) moves it to `agentRoleKeys()` of `mocks/workflow/workflow.lookup.ts` |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `frontend/CONTRIBUTING.md`, Files of a slice | The sentence of the topics: "The entities of a slice with many topics (...) split by topic instead" becomes "The entities of a slice with many topics (...), or with parts that change for different reasons and read nothing of each other, such as `modules/project/entities` with `projects` and `run-status`, split by topic instead" | 1 |
| `docs/architecture/web-app-modules.md`, section 2 | The paragraph of the topics: the same reason, beside the sentence of `project` that P7 wrote | 1 |
| `frontend/lint/lib/modules/module-imports.constants.js` | `'llm-model': []`, after `usage` | 2 |
| `frontend/lint/lib/file-names/file-kinds.constants.js` | `'llm-model': { 'model-settings': [], models: [] }` in `topicEntityModules`, before `project` of P7, in the order of the names | 2 |
| `frontend/lint/lib/imports/__tests__/topic-patterns.utils.test.js` | One case: `topicPatterns('llm-model', 'model-settings')` refuses an import of the `models` topic; `entityTopics('llm-model')` gives the two topics | 2 |
| `modules/llm-model/entities/index.ts` (new) | The type exports (commit 3), then the API functions, keys and hooks (commit 6) | 3, 6 |
| `shared/api/endpoints/api-endpoints.constants.ts` | `models: apiEndpoint('/models')` and `modelSettings: apiEndpoint('/me/model-settings')`, after `me` | 4 |
| `mocks/shared/db/mock-ids.constants.ts` | `IdPrefix.ModelSetting: '6d1e'` | 4 |
| `mocks/api.setup.ts` | `...modelHandlers`, `...modelSettingHandlers`, after `meHandlers` | 4 |
| `mocks/messages/messages.validators.ts` | `validateModels`: a text that is not in `modelIdsForRole(role)` is `choiceProblem('models.<role>')` (decision 9) | 5 |
| `mocks/runs/lookup/runs.lookup.ts` | `resolveRunConfig`: `project` is `Pick<Project, 'run_config' \| 'output_language' \| 'model_overrides'>`, and `models` takes the four levels (decision 10); the JSDoc says the order | 5 |
| `mocks/messages/__tests__/messages.validators.data.ts`, `messages.handlers.data.ts` | A model that does not serve its role (`openai:gpt-4.1-mini` for `analyst`) answers the problem at `models.analyst` | 5 |
| `mocks/runs/lookup/__tests__/runs.lookup.test.ts` (and its data) | The expected `models` take the user settings; one case for each level (section 10) | 5 |
| `shared/api/request/index.ts` | `export { fetchAllPages, fetchPage, listPageSchema } from './api-page.utils'`; `listPageSchema` gets `export` and its JSDoc stays | 6 |

No change: `fileKinds`, `publicApiPaths`, the project mock (`model_overrides` is not read by `PATCH`, section 12), `useCreateProject`.

## 8. The entity, file by file

```text
modules/llm-model/entities/
├── index.ts
├── models/                          # the catalog: server configuration, read only
│   ├── models.api.ts
│   ├── models.constants.ts
│   ├── models.keys.ts
│   ├── models.types.ts
│   ├── hooks/
│   │   ├── useModelQueries.ts
│   │   └── __tests__/
│   │       └── useModelQueries.test.ts
│   └── __tests__/
│       ├── models.api.data.ts
│       ├── models.api.test.ts
│       ├── models.keys.data.ts
│       └── models.keys.test.ts
└── model-settings/                  # the model that the user chose for each agent role
    ├── model-settings.api.ts
    ├── model-settings.constants.ts
    ├── model-settings.keys.ts
    ├── model-settings.types.ts
    ├── hooks/
    │   ├── useModelSettingQueries.ts
    │   └── __tests__/
    │       └── useModelSettingQueries.test.ts
    └── __tests__/
        ├── model-settings.api.data.ts
        ├── model-settings.api.test.ts
        ├── model-settings.keys.data.ts
        └── model-settings.keys.test.ts
```

| File | Holds | Reuses |
|---|---|---|
| `models/models.types.ts` | `modelCapabilities`, `ModelCapability`; `modelCatalogEntrySchema`, `ModelCatalogEntry`. The usual header: temporary hand-written schemas, `TODO: replace with the types generated into src/shared/api/generated/ once they exist.` | |
| `models/models.api.ts` | `listModels()`; the usual `TODO: switch to the generated client ...` | `fetchAllPages`, `apiEndpoints` |
| `models/models.constants.ts` | `modelsPageSize = 200`, with a comment: the catalog is read whole, in the largest pages | |
| `models/models.keys.ts` | `modelKeys` | |
| `models/hooks/useModelQueries.ts` | `useModels`, the private `CATALOG_STALE_TIME` | `HookQueryOptions`, `isProduction` |
| `model-settings/model-settings.types.ts` | `modelSettingSchema`, `ModelSetting`; `ReplaceModelSettingsBody`. Same header | |
| `model-settings/model-settings.api.ts` | `listModelSettings()`, `replaceModelSettings(body)` | `fetchAllPages`, `apiRequest`, `listPageSchema`, `apiEndpoints`, `HttpMethod` |
| `model-settings/model-settings.constants.ts` | `modelSettingsPageSize = 200`, with a comment: one row per agent role, read whole | |
| `model-settings/model-settings.keys.ts` | `modelSettingKeys` | |
| `model-settings/hooks/useModelSettingQueries.ts` | `useModelSettings` | `HookQueryOptions` |
| `index.ts` | `listModels`, `listModelSettings`, `replaceModelSettings`, `modelKeys`, `modelSettingKeys`, `useModels`, `useModelSettings`; the types `ModelCatalogEntry`, `ModelCapability`, `ModelSetting`, `ReplaceModelSettingsBody` (decision 13) | |

No file of one topic imports the other; ESLint checks it from commit 2.

Sketch of the types (comments in the style of `threads.types.ts`):

```ts
// models/models.types.ts

/** What a model can do; a role needs some of them, and the catalog says which roles a model serves. */
export const modelCapabilities = ['tool_calling', 'structured_output', 'streaming', 'vision'] as const
export type ModelCapability = (typeof modelCapabilities)[number]

/** A model that the user may choose, as the server configures it; identified by `model_id`. */
export const modelCatalogEntrySchema = z.object({
  /** `provider:model`, such as `openai:gpt-4.1`. */
  model_id: z.string(),
  provider: z.string(),
  display_name: z.string(),
  capabilities: z.array(z.enum(modelCapabilities)),
  /** In tokens. */
  context_window: z.number().int(),
  /** USD per million input tokens; null when the model has no price, such as a local one. */
  input_price_per_mtok: z.number().nullable(),
  /** USD per million output tokens. */
  output_price_per_mtok: z.number().nullable(),
  /** USD per million input tokens read from the prompt cache of the provider. */
  cache_read_price_per_mtok: z.number().nullable(),
  /** USD per million input tokens written to the prompt cache of the provider. */
  cache_write_price_per_mtok: z.number().nullable(),
  /** The agent roles that the model may serve. */
  allowed_roles: z.array(z.string()),
})
export type ModelCatalogEntry = z.infer<typeof modelCatalogEntrySchema>
```

```ts
// model-settings/model-settings.types.ts

/** The model that the user chose for one agent role; a role without one uses the server default. */
export const modelSettingSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  agent_role: z.string(),
  /** A model of the catalog that serves the role. */
  model_id: z.string(),
  /** From 0 to 1; null for the default of the role. */
  temperature: z.number().nullable(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
export type ModelSetting = z.infer<typeof modelSettingSchema>

/** The body that replaces the model settings of the user; a role left out uses the server default. */
export interface ReplaceModelSettingsBody {
  items: Pick<ModelSetting, 'agent_role' | 'model_id' | 'temperature'>[]
}
```

The API functions:

- `listModels(): Promise<ModelCatalogEntry[]>`: `fetchAllPages(apiEndpoints.models.path(), modelCatalogEntrySchema, { limit: modelsPageSize, action: 'load the models' })`. JSDoc: the models that the user may choose, ordered by `model_id`.
- `listModelSettings(): Promise<ModelSetting[]>`: `fetchAllPages(apiEndpoints.modelSettings.path(), modelSettingSchema, { limit: modelSettingsPageSize, action: 'load your model settings' })`. JSDoc: the model that the user chose for each agent role, ordered by `agent_role`.
- `replaceModelSettings(body: ReplaceModelSettingsBody): Promise<ModelSetting[]>`: `apiRequest(apiEndpoints.modelSettings.path(), listPageSchema(modelSettingSchema), { action: 'save your model settings', method: HttpMethod.Put, body })`, then the `items` of the page. JSDoc: replaces the model settings of the user and gives them as they are saved; the answer holds one row per role, fewer than a page.

Sketch of the keys:

```ts
/** The query keys of the model catalog, from the widest to the narrowest; each starts with the one above. */
export const modelKeys = {
  all: () => ['models'] as const,
  /** The whole catalog. */
  list: () => [...modelKeys.all(), 'list'] as const,
}

/** The query keys of the model settings of the user, from the widest to the narrowest. */
export const modelSettingKeys = {
  all: () => ['model-settings'] as const,
  /** Every model setting of the user. */
  list: () => [...modelSettingKeys.all(), 'list'] as const,
}
```

The hooks:

- `useModels({ isEnabled = true }: HookQueryOptions = {})`: `useQuery` on `modelKeys.list()`, `queryFn: listModels`, `staleTime: CATALOG_STALE_TIME`. The private setting with its comment: the catalog is server configuration and changes only with a deploy, so a production build reads it again after an hour, any other build after ten minutes. JSDoc: the model catalog.
- `useModelSettings({ isEnabled = true }: HookQueryOptions = {})`: `useQuery` on `modelSettingKeys.list()`, `queryFn: listModelSettings`, the stale time of the query client. JSDoc: the model that the user chose for each agent role; the save of the settings invalidates `modelSettingKeys.all()`.

## 9. The mock, file by file

```text
mocks/models/
├── models.fixtures.ts
├── models.lookup.ts
├── models.handlers.ts
└── __tests__/

mocks/model-settings/
├── model-settings.fixtures.ts
├── model-settings.store.ts
├── model-settings.lookup.ts
├── model-settings.changes.ts
├── model-settings.validators.ts
├── model-settings.handlers.ts
└── __tests__/
```

| File | Holds | Reuses |
|---|---|---|
| `models/models.fixtures.ts` | `modelFixtures`, the six models of the table below, typed `ModelCatalogEntry[]`; the private role lists `everyRole` and `lightRoles` | |
| `models/models.lookup.ts` | `allModels()` (the fixtures by `model_id`), `modelIdsForRole(role)` (the ids of the models whose `allowed_roles` holds the role) | the fixtures |
| `models/models.handlers.ts` | `modelHandlers`: `GET /models` | section 6 |
| `model-settings/model-settings.fixtures.ts` | `modelSettingId(role)` (decision 12), `buildModelSetting(role, fields)`, `modelSettingFixtures` | `mockId`, `IdPrefix`, `userId`, `workflowDefinitionFixture` |
| `model-settings/model-settings.store.ts` | `replacedModelSettings = mockState<ModelSetting[] \| null>('model-settings', () => null)` | `mockState` |
| `model-settings/model-settings.lookup.ts` | `allModelSettings()` (the store, else the fixtures, by `agent_role`), `findModelSetting(role)`, `modelsOfUserSettings()` (`Record<role, model_id>`, for `resolveRunConfig`) | the fixtures, the store |
| `model-settings/model-settings.changes.ts` | `changeModelSettings(choices)`: the rows of decision 12, set in the store | `modelSettingId`, `findModelSetting`, `userId`, `mockNow`, the store |
| `model-settings/model-settings.validators.ts` | `validateModelSettings(given)`: `{ choices }` or `{ problems }`; the private `modelSettingsBodySchema` | `schemaProblems`, `choice`, `choiceProblem`, `modelIdsForRole`, `workflowDefinitionFixture` |
| `model-settings/model-settings.handlers.ts` | `modelSettingHandlers`: `GET` and `PUT /me/model-settings` | section 6 |

The catalog (decision 11), by `model_id`; `everyRole` is the nine roles of version 1, `lightRoles` is `planner`, `persona_generator`, `interviewer`, `persona_agent`, `intent_router`:

| `model_id` | `display_name` | Capabilities | Context | Prices in, out, cache read, cache write | Roles |
|---|---|---|---|---|---|
| `anthropic:claude-haiku-5` | Claude Haiku 5 | tool_calling, structured_output, streaming | 200000 | 1, 5, 0.1, 1.25 | `lightRoles` |
| `anthropic:claude-opus-5` | Claude Opus 5 | the four | 500000 | 5, 25, 0.5, 6.25 | `everyRole` |
| `anthropic:claude-sonnet-5` | Claude Sonnet 5 | the four | 500000 | 3, 15, 0.3, 3.75 | `everyRole` |
| `local:llama-3.3-70b` | Llama 3.3 70B (local) | tool_calling, streaming | 128000 | null, null, null, null | `interviewer`, `persona_agent` |
| `openai:gpt-4.1` | GPT-4.1 | the four | 1000000 | 2, 8, 0.5, null | `everyRole` |
| `openai:gpt-4.1-mini` | GPT-4.1 mini | tool_calling, structured_output, streaming | 1000000 | 0.4, 1.6, null, null | `lightRoles` |

The model settings of the fixtures, the user of the examples (`userId`):

| Role | Model | Temperature | Created and updated |
|---|---|---|---|
| `analyst` | `anthropic:claude-opus-5` | null | 2026-10-01T09:00:00Z |
| `persona_agent` | `openai:gpt-4.1-mini` | 0.8 | 2026-10-01T09:00:00Z |

So a run that the mock starts has `analyst: 'anthropic:claude-opus-5'` instead of the default `anthropic:claude-sonnet-5`, and `persona_agent` the default model.

`validateModelSettings(given)`, each problem at the field that the API names (decision 7):

| Field | Rule | Problem |
|---|---|---|
| `items` | Required, an array | `schemaProblems`: `items` "This field is required." or "Send a value of type array." |
| `items.<index>` | An object with `agent_role` and `model_id`, and no field but those and `temperature` | `schemaProblems`, at `items.<index>.<field>` |
| `items.<index>.agent_role` | A string, an agent role of `workflowDefinitionFixture.agent_roles` | `choiceProblem` |
| | Not given by an earlier entry | `{ field, message: 'Give each role once.' }` |
| `items.<index>.model_id` | A string of `modelIdsForRole(agent_role)` (checked once the role is known) | `choiceProblem` |
| `items.<index>.temperature` | Left out, null, or a number from 0 to 1 | `schemaProblems`: "Send a value of type number or null.", "Send 0 or more.", "Send 1 or less." |

`modelSettingsBodySchema` holds the shape: `{ type: 'object', required: ['items'], properties: { items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['agent_role', 'model_id'], properties: { agent_role: { type: 'string' }, model_id: { type: 'string' }, temperature: { type: ['number', 'null'], minimum: 0, maximum: 1 } } } } } }`; the checks of the role and the model run on the entries that have no problem of shape. A temperature left out is saved as null.

The handlers, in the order of the mock README (`answerScenario`, the record, the checks, the change, the answer):

- `GET models.pattern`: `answerScenario('models')`; the empty scenario answers `emptyPage()`; `paginate(allModels(), request)`.
- `GET modelSettings.pattern`: `answerScenario('model-settings')`; the empty scenario answers `emptyPage()`; `paginate(allModelSettings(), request)`.
- `PUT modelSettings.pattern`: `answerScenario('replace-model-settings')`; `validateModelSettings(await readBodyFields(request))` or `validationFailed(problems)`; `changeModelSettings(choices)`; `HttpResponse.json(paginate(allModelSettings(), request))`. Not wrapped in `idempotent`: a `PUT` gives the same result when it repeats.

Scenarios: `mock-models` (`empty`, `error`, `loading`), `mock-model-settings` (`empty`, `error`, `loading`), `mock-replace-model-settings` (`error`, `loading`).

What the mock data then holds: the catalog of six models; the user has chosen Claude Opus 5 for the analyst and GPT-4.1 mini at 0.8 for the persona agent; a `PUT` replaces the two rows and survives a reload; `?mock-reset` brings the fixtures back. A message that names a model which does not serve its role answers 422, and a run that a message starts takes the model settings under the models of the message.

## 10. Tests

Data-driven where the cases share one flow (CONTRIBUTING, Testing); every new reader and handler has cases for what it refuses.

| Test | Cases |
|---|---|
| `llm-model/entities/models/__tests__/models.api.test.ts` with `.data.ts` | `itSendsRequests`: `listModels` (`GET /models?limit=200`). `itThrowsApiErrors`: 500. Against the mock: the six models in the order of `model_id`, the first `anthropic:claude-haiku-5` |
| `llm-model/entities/model-settings/__tests__/model-settings.api.test.ts` with `.data.ts` | `itSendsRequests`: `listModelSettings` (`GET /me/model-settings?limit=200`), `replaceModelSettings` (`PUT` with its body). `itThrowsApiErrors`: 500 for each, 422 for `replaceModelSettings`. Against the mock: the two rows of the fixtures; `replaceModelSettings` with one row, then `listModelSettings` reads that row only |
| `llm-model/entities/models/__tests__/models.keys.test.ts` with `.data.ts` | `itNestsQueryKeys` (all, list) |
| `llm-model/entities/model-settings/__tests__/model-settings.keys.test.ts` with `.data.ts` | `itNestsQueryKeys` (all, list). No case beside `modelKeys`: a test of one topic does not import the other |
| `llm-model/entities/models/hooks/__tests__/useModelQueries.test.ts` | `useModels` loads the catalog; `itWaitsUntilEnabled` for `isEnabled: false` |
| `llm-model/entities/model-settings/hooks/__tests__/useModelSettingQueries.test.ts` | `useModelSettings` loads the two rows; `itWaitsUntilEnabled` for `isEnabled: false` |
| `mocks/models/__tests__/models.lookup.test.ts` with `.data.ts` | `allModels()` by `model_id`; `modelIdsForRole`: `analyst` without the light models, `interviewer` with all six, an unknown role with none; every model of `defaultRunConfigFixture.models` is in `modelIdsForRole` of its role (decision 11) |
| `mocks/models/__tests__/models.handlers.test.ts` with `.data.ts` | `GET` answers the six models; `?limit=2` answers two and a `next_cursor`; the empty scenario; `itRejectsRequests`: the error scenario (500) |
| `mocks/model-settings/__tests__/model-settings.validators.test.ts` with `.data.ts` | Each row of the table of section 9, accepted and refused; a body of two roles accepted; an empty `items` accepted (every role on the default) |
| `mocks/model-settings/__tests__/model-settings.changes.test.ts` with `.data.ts` | A kept role keeps its `id` and `created_at`; `updated_at` changes only for a row that changed; a new role gets the id of its place; a role left out is gone |
| `mocks/model-settings/__tests__/model-settings.lookup.test.ts` with `.data.ts` | `allModelSettings()` the fixtures, then the store after a change; by `agent_role`; `modelsOfUserSettings()` |
| `mocks/model-settings/__tests__/model-settings.handlers.test.ts` with `.data.ts` | `GET` answers the two rows; `PUT` then `GET` reads the change; the empty scenario; `itRejectsRequests`: no `items`, an unknown role, a role twice, a model that does not serve its role, a temperature of 1.5, a field that is not allowed (422 at the field), the error scenarios of `model-settings` and `replace-model-settings` (500) |
| `mocks/messages/__tests__/messages.validators.test.ts`, `messages.handlers.test.ts` | New: `models: { analyst: 'openai:gpt-4.1-mini' }` refused at `models.analyst` with "Choose one of the values."; the cases of `main` keep passing (their models serve their roles) |
| `lint/lib/imports/__tests__/topic-patterns.utils.test.js` | The case of section 7 (commit 2) |
| `mocks/runs/lookup/__tests__/runs.lookup.test.ts` | The expected `models` of `main` take `analyst: 'anthropic:claude-opus-5'`; new cases: a project override wins over the user setting, the models of the request win over both, and with the settings replaced by an empty list the default comes back |

## 11. Docs to update

Docs first, on `docs/fe/api-fields` (written in its worktree on 2026-10-31, not committed):

- `docs/API.md`, Settings and models: the rows of `GET` and `PUT /me/model-settings` (decision 7) and `GET /models` with its order; Projects: the row of `PATCH /projects/{project_id}` with the rule of `model_overrides`; Threads and messages: the row of `POST /threads/{thread_id}/messages` with the catalog check of `models` (decision 9).
- `docs/DATA_SHAPE.md`, ModelSettings: `temperature` from 0 to 1 (decision 8).

In the PR (last commit):

| Doc | Change |
|---|---|
| `docs/architecture/web-app-modules.md`, section 1, tree | `llm-model/` with `entities/  # ModelCatalogEntry (models/), ModelSettings (model-settings/)`, after `user/` |
| Same, section 2 | After the sentence of `project`: "The entities of `llm-model` split by topic too: `models`, the catalog, and `model-settings`, the model of each agent role; neither reads the other." |
| Same, section 6, row `llm-model` | State: "The entities; the form of the model settings with Settings" |
| `docs/architecture/web-app.md`, section 9 | New row "Models": `llm-model`, entities; `modules/llm-model/entities/models/models.api.ts`, `models/models.types.ts`, `models/hooks/useModelQueries.ts`, `model-settings/model-settings.api.ts`, `model-settings/model-settings.types.ts`, `model-settings/hooks/useModelSettingQueries.ts` |
| `frontend/CONTRIBUTING.md` | No change in this commit: the rule of the topics is in commit 1, and the sentence of the import direction names examples of `moduleImports`, not the whole table |
| `frontend/README.md`, Mock data | Rows `models` (`GET /models`) and `model-settings` (`GET`, `PUT /me/model-settings`; each model checked against the catalog) in the table of resources |
| `src/mocks/README.md` | Rows `mock-models`, `mock-model-settings`, `mock-replace-model-settings` in Parameters; in Mock data, one sentence: the catalog holds six models, the user has chosen a model for the analyst and the persona agent, and a run that starts takes the models of the message, then of the project, then of the user, then the default; "the model settings that `PUT` replaced" in the list of what the mock server keeps |
| `docs/frontend-implementation-plan.md` (on `frontend-plan`) | Row E7: "As built", with what differs from this plan; section 6, E7: the copies as renamed here; checklist |

## 12. Left for the next PRs

The agent writes no code for these; they go in the docs where named.

| Item | When | Note |
|---|---|---|
| The form of the model settings and `useReplaceModelSettings` | S5 | A feature of `llm-model`; invalidates `modelSettingKeys.all()`; the problems of `422` at `items.<index>.<field>` go to the fields of the form; the range of `temperature` in the schema of the form |
| The models that serve a role, the labels of the capabilities, the prices | S5 | Pure rules of `llm-model/entities` once the form reads them (decision 6) |
| `model_overrides` of a project: the check of `PATCH /projects` in the mock, the field in `UpdateProjectBody`, the form | The project settings of S5 | Decision 9; the third copy of the role set moves it to `agentRoleKeys()` (section 6) |
| The model of a message (`models` of `sendMessage`) | S2 | `thread/features/send-message` reads `useModels` through the module that composes them; `thread` does not import `llm-model` |
| `costOf` and the prices of the usage | E9 | Reads `modelFixtures` of `mocks/models/` |
| `project` or `settings` reading `llm-model` | S5 | A place in `moduleImports` for the module that reads it, in the `build` commit of that PR |
| A third stale time for server configuration | The PR that writes it | Moves the rule to `shared/config/env` (section 6) |

## 13. Commits and checks

1. `docs(frontend): split the entities of a module by topic when their parts change apart`: the sentence of CONTRIBUTING and the paragraph of Web App Modules, section 2 (section 7)
2. `build(frontend): give the llm-model module and its topics their place in the lint lists`: `moduleImports`, `topicEntityModules`, the case of `topic-patterns.utils.test.js`
3. `feat(frontend): add the types of the model catalog and the model settings`: `models/models.types.ts`, `model-settings/model-settings.types.ts`, the type exports of `index.ts`
4. `feat(frontend): mock the model catalog and the model settings`: the two endpoints, `IdPrefix.ModelSetting`, `mocks/models/`, `mocks/model-settings/`, `api.setup.ts`, the mock tests
5. `feat(frontend): check the models of a message against the catalog, and start a run with the model settings`: `messages.validators.ts`, `resolveRunConfig`, their tests (the rows of commit 5 in section 7)
6. `feat(frontend): read the model catalog, and read and replace the model settings`: `listPageSchema` exported, the api, constants, keys and hooks of both topics, `index.ts`, their tests
7. `docs(frontend): describe the llm-model entity and its mock in the guides`

The mock comes before the API functions, so that the tests of commit 6, which run against the mock, pass on each commit. Files of two commits: `index.ts` (3 and 6: the types first, the rest after) and `docs/architecture/web-app-modules.md` (1: the rule of the topics in section 2; 7: the tree, the sentence of `llm-model` and the row of section 6).

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on `src/modules/llm-model`, `src/mocks/models`, `src/mocks/model-settings`, `src/mocks/messages`, `src/mocks/runs`, `src/mocks/threads`, `src/shared/api/request`, `lint/lib/modules`, `lint/lib/imports`; `pnpm typecheck` once, since types, exports and the lint lists change. No full suite, E2E, screenshots or build: no server component imports the new module. A test that times out only when run with the others is run again alone before it counts as a failure. Then:

- `grep -rnE "FR-[0-9]|NFR-[0-9]|docs/" frontend/src/modules/llm-model frontend/src/mocks/models frontend/src/mocks/model-settings` answers nothing; `grep -rniE "backend|frontend|\bUI\b|dashboard"` on the new comments too.
- `grep -rnwE "CatalogModel|ModelChoice|modelEntrySchema|listCatalog|claude-[a-z]+-5-5" frontend/src` answers nothing.
- `grep -nP '[^\x00-\x7F]'` on each changed doc shows only tree lines.
- No `console.log`; nothing committed or pushed without the user.

## 14. Checklist

- [x] Decisions 7, 8 and 9 confirmed by the user (2026-10-31)
- [x] Those rules written in `docs/API.md` and `docs/DATA_SHAPE.md` in the worktree of `docs/fe/api-fields` (2026-10-31)
- [x] That change committed on `docs/fe/api-fields` (`c99c3b3`, 2026-10-31)
- [x] P7 (#49) merged (`67f5d22`)
- [ ] The branch cut from `origin/main`
- [ ] Commit 1: the rule of the topics in CONTRIBUTING and Web App Modules
- [ ] Commit 2: `moduleImports` and `topicEntityModules` with `llm-model`, the lint tests green
- [ ] Commit 3: the types and the type exports of the index (so that commit 4 compiles)
- [ ] Commit 4: the mock, all its new files tested, the catalog ids of the API examples
- [ ] Commit 5: the catalog check of the messages and the four levels of the models of a run, with the tests of `main` updated
- [ ] Commit 6: the entity, both topics, every endpoint with its API function, key, hook and tests; no import from one topic to the other
- [ ] Commit 7: docs
- [ ] Every state reachable in `pnpm dev:mock` through a scenario of section 9
- [ ] Only the checks of section 13 ran
- [ ] Row E7 of the implementation plan updated
- [ ] The description of the PR written from this plan; the endpoints it lists checked against the `*.api.ts` functions
