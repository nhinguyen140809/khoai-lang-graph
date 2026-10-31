# E8 `user` entities: plan

Draft of 2026-10-31, for an agent to implement. Not committed. Next row of the PR table after E7 (`feat/fe/model-entities`); E8 reads no code of E7, but starts once E7 is merged, as every row does, and follows the rule of the topics that E7 wrote in CONTRIBUTING (commit 1 of E7).

Short paths: `user/entities/...` is `frontend/src/modules/user/entities/...`, `mocks/...` is `frontend/src/mocks/...`, `test/...` is `frontend/src/test/...`; any other path that starts with `modules/` or `shared/` is under `frontend/src/`.

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
| Branch | `feat/fe/user-entities`, from `origin/main` once E7 is merged |
| Title | `feat(frontend): read and change the profile, the password, the sessions and the settings of the user` |
| Needs | E7: the row above, and the rule of the topics in CONTRIBUTING (an entity splits by topic when its parts change for different reasons and read nothing of each other). C1 (merged): `user` may import `run`, for the RunDefaults of UserSettings |
| After it | E9 (`usage`); S5 (Settings) builds the forms of the profile, the password, the sessions and the preferences on it |
| Docs first | Decisions 8 to 12 are gaps of `docs/API.md`, confirmed by the user on 2026-10-31 and written in the worktree of `docs/fe/api-fields` (not committed). Commit them there before commit 3 (the mock follows them) |

The module `user` has a place in `moduleImports` (`['auth', 'run']`, unchanged) but no entry in `topicEntityModules` of `frontend/lint/lib/file-names/file-kinds.constants.js`: commit 1 adds it with the move of the files of `main` into their topic (section 7). `fileKinds` does not change.

## 2. What was read

| Source | What it gives this PR |
|---|---|
| [Frontend implementation plan](frontend-implementation-plan.md) (branch `frontend-plan`), row E8, sections 3 (D3), 4 and 9 | The endpoints; the copies from `feat/fe/mock`; RunDefaults from `run/entities`; the hooks of the branch are not copied; `mocks/account/` of `main` is extended |
| [E7 plan](frontend-e7-llm-model-plan.md) | The shape of an entity plan; the split by topic of `llm-model`; `resolveRunConfig` with the levels of the user; the layers of a mock folder with a store that is null until the first write |
| [Prompt: create a frontend entity plan](prompt-create-frontend-entity-plan.md) (branch `frontend-plan`) | The sections of this plan and the rules |
| [API](API.md), Conventions, Authentication and account, Settings and models, Projects | `PATCH /me`, `POST /me/password`, `GET /me/sessions`, `DELETE /me/sessions/{session_id}`, `GET`, `PUT /me/settings`; lists use the envelope and cursor paging; `PATCH` answers `200` with the resource, `DELETE` `204`; `422 validation_failed` at the fields |
| [Data Shape](DATA_SHAPE.md), Identifiers, Field notation, Common fields, User, Session, UserSettings, RunDefaults | The fields; UserSettings has no `id` (identified by `user_id`) but has `created_at`, `updated_at`; `token_hash` and `password_hash` are `server-only`; `default_run_config` is the third level of the run settings; a project takes `default_output_language` when it is created |
| [Web App Modules](architecture/web-app-modules.md), sections 1, 2, 4, 6 and 7 | `user` holds User and UserSettings and reads `auth` and `run`; RunDefaults belongs to `run`; the values offered stay in `shared/config`, the choice of the user in the entity |
| `frontend/CONTRIBUTING.md`, `frontend/README.md` (Mock data, Files of a mock folder), `src/mocks/README.md` | Files of a slice and topics, keys, request bodies, the layers and names of a mock folder, the scenarios |
| `docs/skills/feature-sliced-design/SKILL.md`, `docs/skills/clean-review/SKILL.md` | No business logic in shared code; `@x` only between entities; the 7 checks used on each decision below |
| `main` (with E7) | `user/entities` (one resource at the root: `user.api.ts`, `user.keys.ts`, `user.types.ts`, `hooks/useMe.ts`); `mocks/account/` (`account.store.ts` with `currentUser` and `sessionState`, `auth.handlers.ts`, `me.fixtures.ts`, `me.handlers.ts`, `me.problems.ts`); `run/entities/@x/project.ts` (`runDefaultsSchema`); `validateRunDefaults` of `mocks/runs/runs.validators.ts` (its paths start with `run_config`); `resolveRunConfig` of `mocks/runs/lookup/runs.lookup.ts`; `validateNewProject` of `mocks/projects/projects.validators.ts` (a language left out is `en`); `llm-model/entities` after E7 |
| `origin/feat/fe/mock` | `userSettingsSchema`, `profileSchema`, `sessionSchema` of `features/settings/settings.types.ts`; `getUserSettings`, `replaceUserSettings`, `changeProfile`, `changePassword`, `listSessions`, `revokeSession` of `features/settings/settings.api.ts`; `mockSessions` of `mocks/account.fixtures.ts`; the `PATCH /me`, password and sessions handlers of `mocks/account.handlers.ts`; `mockUserSettings` of `mocks/me.fixtures.ts` and the settings handlers of `mocks/me.handlers.ts`; `useAccountQueries.ts`, `useUserSettings.ts` |

## 3. Decisions

Taken from the docs and the conventions; the agent applies them as written:

1. **Three topics: `user`, `sessions` and `user-settings`.** `user` reads three resources that change for different reasons and read nothing of each other: the signed-in user (`/me`, `/me/password`), which the account menu shows; the sessions (`/me/sessions`), a list of devices that the user revokes; the settings (`/me/settings`), the preferences that follow the user across devices and the defaults of new projects and runs.

   | Option | Evaluation |
   |---|---|
   | a. Files at the root, by resource, as today: `user.*`, `sessions.*`, `user-settings.*` | CONTRIBUTING moves a slice with two files of one kind into folders by kind: three `api` files go to `api/`, three `types` files to `types/`, and the files of one resource sit in four folders |
   | b. Folders by topic, as `llm-model/entities` after E7 | Each resource in one folder with its `hooks/` and `__tests__/`; `topicEntityModules` makes ESLint refuse an import from one topic to another |

   Decision: b. `topicEntityModules.user` is `{ sessions: [], user: [], 'user-settings': [] }`. The files of `main` move into `user/` with `git mv`, names unchanged (`user/user.api.ts`, `user/user.keys.ts`, `user/user.types.ts`, `user/hooks/useMe.ts`, `user/__tests__/`), so that the history follows and no import outside the slice changes (they read the index). The root holds the three topics and `index.ts` only (no `components/`; no `@x/`: no other entity reads `user`).
2. **The names of Data Shape, except `Me`.** A session is `Session` (not `LoginSession` of `feat/fe/mock`), the settings `UserSettings`. The signed-in user stays `Me` with `meSchema`: the type of `main`, read by the account menu and the auth mock; the web app reads no other user, and a rename would change files outside this PR for no reader. `profileSchema` of the branch is a loose copy of the same object and is not copied: `PATCH /me` answers the user, parsed with `meSchema`.
3. **The full fields of Data Shape, `z.object`.** `sessionSchema` has every field of Session that is not `server-only` (`id`, `user_id`, `expires_at`, `last_seen_at`, `user_agent`, `ip_address`, `revoked_at`, `created_at`, `updated_at`) and `current` (decision 10); the branch had `last_used_at`, which Data Shape names `last_seen_at`, and no `expires_at`. `userSettingsSchema` has `user_id`, the six settings and `created_at`, `updated_at`, with `default_run_config: runDefaultsSchema` from `run`.
4. **RunDefaults through `run/entities/@x/user.ts`.** `user` may import `run` (`moduleImports`); entities reach another module only through its `@x` file. The new file exports `type RunDefaults` and `runDefaultsSchema`, as `@x/project.ts` does. The schema is not copied (the branch wrote its own copy of the four fields).
5. **The values offered: in the `types` file of the topic, the languages from `shared/config`.** `themes` and `uiLanguages` (with `Theme`, `UiLanguage`) are values of UserSettings and live in `user-settings/user-settings.types.ts`; `default_output_language` reads `outputLanguages` of `@/shared/config/output-language`, which the project and the run config share (Web App Modules, section 7).
6. **The sessions are read whole.** A user has a few sessions. `listSessions` reads every page with `fetchAllPages` in pages of 200, the largest the API allows; `useSessions` is a plain query.
7. **The mutation hooks wait for their features.** The entity holds the API function of every endpoint (`updateMe`, `changePassword`, `revokeSession`, `replaceUserSettings`); their hooks belong to the features of S5, which invalidate `userKeys.all()`, `sessionKeys.all()` or `userSettingsKeys.all()`. The query hooks have the stale time of the query client, except `useMe`, which keeps its own.

Gaps of `docs/API.md`, confirmed by the user on 2026-10-31 and written in the worktree of `docs/fe/api-fields` (docs-first rule; the mock follows them):

8. **`PATCH /me`.** The API named the fields only. Decision: each field is optional, and a field left out keeps its value; `display_name` is a text that is not empty once trimmed, of at most 100 characters; `avatar_url` is null or an `http` or `https` address; no other field; otherwise `422 validation_failed` at the field. Answer `200` with the user.
9. **`POST /me/password`.** The API gave the body only. Decision: a wrong `current_password` answers `422` at `current_password`; `new_password` has at least 8 characters and differs from the current password, otherwise `422` at `new_password`. Answer `204`; the session of the request stays and every other session of the user is revoked.
10. **`GET` and `DELETE /me/sessions`.** The API gave the purpose only, and Data Shape has no way to tell the session of the request. Decision: the list holds the sessions that are not revoked and not expired, ordered by `last_seen_at` descending; each has the fields of Session that are not `server-only` and `current`, true for the session of the request (a field of the answer, not stored). `DELETE` answers `204`; revoking the session of the request signs the user out, as `POST /auth/logout`; a session that is revoked, expired or of another user answers `404`.
11. **`GET` and `PUT /me/settings`.** The API gave the purpose only. Decision: `GET` always answers `200`; a user who has saved none gets the defaults (`theme` `system`, `ui_language` `en`, `default_output_language` `en`, `default_run_config` with every field null, both `notify_on_` fields true). `PUT` takes any of the six settings, and a field left out keeps its value; each enum takes a value of its list, each `notify_on_` field a boolean; `default_run_config` is a whole RunDefaults with the rules of `run_config` of a project, a field left out of it being null; no other field; otherwise `422` at the field (`theme`, `default_run_config.max_steps`). Answer `200` with the settings as `GET` answers them.
12. **The language of a new project.** Data Shape says that a project takes `default_output_language` of the user when it is created; the row of `POST /projects` did not. Written there: `output_language` left out takes `default_output_language` of the user settings.

The mock:

13. **The mock starts a run and creates a project with the settings of the user.** Data Shape resolves `review_checkpoints`, `max_steps`, `max_cost_usd` and each parameter from the request, then `Project.run_config`, then `UserSettings.default_run_config`, then the server default. `resolveRunConfig` of `main` reads the first two levels: it takes the third, `currentUserSettings().default_run_config`. `validateNewProject` gives a project without `output_language` the `default_output_language` of the settings, not `en`.
14. **The mock keeps a password.** To refuse a wrong `current_password`, the mock holds the password of the user: `mePasswordFixture` in `me.fixtures.ts`, then the store `currentPassword`. `POST /auth/register` sets it to the password of the body. `POST /auth/login` keeps its scenarios and does not read it (section 12): a change of the login mock is outside the entities.
15. **The sessions and the session of the mock server are one state.** The mock server signs in and out with `sessionState` of `account.store.ts`. The session of the request is the fixture `sessionIds.current`: logging out revokes it, logging in brings it back, and revoking it with `DELETE` signs out. Two changes of `mocks/account/auth.changes.ts` (new) hold the rule: `signIn()` and `signOut()`, called by the login and logout handlers and by the `DELETE` handler of the sessions. The expiry is not modelled: the mock clock is the real time, so a fixture would expire on a date; the fixtures expire 60 days after they were last seen and the lookup leaves out only the revoked sessions.
16. **The settings of the user are one record, null until the first write.** As `replacedModelSettings` of E7: the store `savedUserSettings` is null until a `PUT` or a register; the lookup reads it, else the fixture. A register writes the defaults of decision 11 for the new user (`resetUserSettings()`), so that a new account starts from them. The `empty` scenario of `GET` answers those defaults, the state of a user who has saved none.
17. **The fixtures.** The user of the examples has saved settings: `theme` `dark`, `ui_language` `en`, `default_output_language` `en`, `default_run_config` with `max_steps: 60` and the other fields null, `notify_on_interrupt` true, `notify_on_run_finished` false. So a run that the mock starts has `max_steps` 60 instead of the default 80, unless the request or the project sets it; the language stays `en`, so the projects of `main` keep theirs. Four sessions: three active (this browser, a phone, a laptop without an IP address) and one revoked, which the list leaves out.
18. **Each piece in the place of its role.** Checked file by file, with the rules of CONTRIBUTING (Inside a slice, Types and constants) and of the mock README (Layers):

    | Piece | Place | Why there |
    |---|---|---|
    | Schemas, values offered, request bodies | `<topic>.types.ts` | A `types` file defines the values of its subject; a body is a type of the request |
    | The page size of the sessions | `sessions/sessions.constants.ts` | A setting of the topic; a constants file declares no function |
    | The requests | `<topic>.api.ts` | Only `api` files call `apiRequest`, `apiCommand` and `fetchAllPages` |
    | The keys | `<topic>.keys.ts`, one factory for each resource | `sessionKeys.all()` invalidates the sessions and nothing of the user or the settings |
    | The query hooks | `<topic>/hooks/` | `useMe.ts` keeps its name (a move only); the new ones `use<Resource>Queries.ts` |
    | RunDefaults | `run/entities/@x/user.ts` | The value object belongs to `run` (decision 4) |
    | The forms, the mutation hooks, the theme saved on the server | Not in this PR | Features of S5 (decision 7, section 12) |
    | `signIn`, `signOut` | `mocks/account/auth.changes.ts` | The state of the session of the mock server, written by three handlers |
    | The sessions mock | `mocks/account/sessions.*` | The sessions and the session of the mock server are one state (decision 15); `mocks/account/` holds the account: auth, me, sessions |
    | The settings mock | `mocks/user-settings/` | A resource of its own, read by the runs and the projects through its lookup |
    | `validateRunDefaults(given, field)` | `mocks/runs/runs.validators.ts`, with the field of the paths as a parameter | One reader for `run_config` and `default_run_config` |
    | The public API | `index.ts`: the API functions, the keys, the hooks and the types; not the schemas nor the lists of values | The exports follow the readers: the features of S5 call the functions, hooks and keys; the forms of S5 export the lists once they read them |

## 4. Scope

Endpoints: `GET /me` (on `main`), `PATCH /me`, `POST /me/password`, `GET /me/sessions`, `DELETE /me/sessions/{session_id}`, `GET /me/settings`, `PUT /me/settings`. Commit 3 adds `password`, `sessions`, `session` and `userSettings` to `apiEndpoints`.

Copy (read with `git show origin/feat/fe/mock:frontend/src/<path>`):

| Copy | From | To | What changes |
|---|---|---|---|
| `userSettingsSchema` | `features/settings/settings.types.ts` | `user/entities/user-settings/user-settings.types.ts` | `default_run_config: runDefaultsSchema` (decision 4); the enums from `themes`, `uiLanguages`, `outputLanguages` (decision 5) |
| `sessionSchema` | the same file | `user/entities/sessions/sessions.types.ts` | Named `Session`; the fields of decision 3 |
| `changeProfile`, `changePassword` | `features/settings/settings.api.ts` | `user/entities/user/user.api.ts` | Named `updateMe`, `changePassword`; `apiEndpoints`; bodies `UpdateMeBody`, `ChangePasswordBody`; `updateMe` answers `Me` |
| `listSessions`, `revokeSession` | the same file | `user/entities/sessions/sessions.api.ts` | `apiEndpoints`; `fetchAllPages` with a page size; `HttpMethod.Delete` |
| `getUserSettings`, `replaceUserSettings` | the same file | `user/entities/user-settings/user-settings.api.ts` | `apiEndpoints`; body `ReplaceUserSettingsBody`, every field optional (decision 11) |
| `mockSessions` | `mocks/account.fixtures.ts` | `mocks/account/sessions.fixtures.ts` | Named `sessionFixtures`; the fields of decision 3; four sessions (decision 17); ids from `sessionIds` |
| `mockUserSettings` | `mocks/me.fixtures.ts` | `mocks/user-settings/user-settings.fixtures.ts` | Named `userSettingsFixture`; the values of decision 17 |
| The handlers of `PATCH /me`, the password and the sessions | `mocks/account.handlers.ts` | `mocks/account/me.handlers.ts`, `sessions.handlers.ts` | The checks of decisions 8, 9, 10; the layers of a mock folder |
| The handlers of the settings | `mocks/me.handlers.ts` | `mocks/user-settings/user-settings.handlers.ts` | The checks of decision 11 with `schemaProblems` and `validateRunDefaults`; a field left out keeps its value |

Write: the key factories `sessionKeys` and `userSettingsKeys`, the query hooks, the page size, the public API, the endpoints, `run/entities/@x/user.ts`, the stores, lookups, changes, validators and problems of the mock, `auth.changes.ts`, the third level of `resolveRunConfig`, the language of a new project, the tests, the docs.

Not copied:

| Code | Why |
|---|---|
| `profileSchema`, `Profile` | The same object as `Me` (decision 2) |
| `useAccountQueries.ts`, `useUserSettings.ts`, `useProfile.ts`, `useSaveTheme.ts` | Keys written by hand, queries mixed with mutations; the mutation hooks belong to S5 |
| `ProfileForm`, `PasswordForm`, `PreferencesForm`, `SessionsList`, `ThemeSync`, `ThemeCommands`, `UserSettingsPage`, `settings.store.ts`, `section.utils.ts`, `form-errors.utils.ts` | Screens and stores of the old frame; S5 builds the Settings feature |
| `settingsSections`, `settingsSectionLabels` | The sections of the Settings screen, S5 |
| `catalogModelSchema`, `modelChoiceSchema` and their functions | E7 |
| `usageGroups`, `usageSchema`, `getUsage` | E9 |
| `getCurrentDefinition` | `getWorkflowDefinition` of `workflow/entities` |
| The `?mock-settings=save-error` scenario | The scenario `mock-replace-user-settings=error` of its own group |
| `isRecord` and `problem` written in the handlers | `isRecord` of `@/shared/lib/guards`, `readBodyFields` and the answers of `mocks/shared/http` |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| API function | verb + object; `get` reads one, `list` a list; `update` for `PATCH`, `replace` for `PUT`, the action for a `POST` or `DELETE` that is not create | `getMe`, `updateMe`, `changePassword`, `listSessions`, `revokeSession`, `getUserSettings`, `replaceUserSettings` |
| Query hook | `use` + object | `useMe`, `useSessions`, `useUserSettings` |
| Topic | the resource, kebab-case | `user`, `sessions`, `user-settings` |
| Hook file | `<topic>/hooks/use<Resource>Queries.ts`; `useMe.ts` of `main` keeps its name | `user/hooks/useMe.ts`, `sessions/hooks/useSessionQueries.ts`, `user-settings/hooks/useUserSettingsQueries.ts` |
| Key factory | `<resource>Keys` | `userKeys` (on `main`), `sessionKeys`, `userSettingsKeys` |
| Request body | `<Action>Body` | `UpdateMeBody`, `ChangePasswordBody`, `ReplaceUserSettingsBody` |
| List of values and its type | in the `types` file | `themes` with `Theme`, `uiLanguages` with `UiLanguage` |
| Entity types | the names of Data Shape, `Me` kept (decision 2) | `Me`, `Session`, `UserSettings` |
| Page size | `<topic>.constants.ts`, camelCase | `sessionsPageSize` |
| Endpoints | `apiEndpoints.<name>` | `password`, `sessions`, `session` (`/me/sessions/:sessionId`), `userSettings` |
| Id prefix and fixed ids | `IdPrefix.<Kind>`, `<things>Ids` | `IdPrefix.Session = '5e55'`; `sessionIds = { current, phone, laptop, revoked }` |
| Mock fixtures | `<thing>Fixture(s)`, `default<Thing>` | `sessionFixtures`, `userSettingsFixture`, `defaultUserSettings(user)`, `mePasswordFixture` |
| Mock reads | `all<Things>`, `find<Thing>`, `current<Thing>`; never the name of an API function | `allSessions()`, `activeSessions()`, `findActiveSession(id)`, `currentUserSettings()` |
| Mock writes | `change<Thing>`, `add<Thing>`, `remove<Thing>`, `reset<Thing>`; never the name of an API function | `changeMe(fields)`, `changeStoredPassword(password)`, `removeSession(id)`, `removeOtherSessions()`, `addCurrentSession()`, `changeUserSettings(fields)`, `resetUserSettings()`, `signIn()`, `signOut()` |
| Mock checks | `validate<Body>` | `validateUpdateMeBody`, `validateChangePasswordBody`, `validateUserSettingsBody` |
| Mock refusals | `<thing>NotFound` in the `problems` file | `sessionNotFound()` |
| Mock stores | named after what they hold | `currentPassword`, `revokedSessions` (id to `revoked_at`), `savedUserSettings` (null until a write) |
| Scenarios | `mock-<group>` | `mock-update-me`, `mock-change-password`, `mock-sessions`, `mock-revoke-session`, `mock-user-settings`, `mock-replace-user-settings` |

## 6. Shared code first

### Reuse

| Need | Use | From |
|---|---|---|
| The paths of the endpoints | `apiEndpoint`, `apiEndpoints.me`, the four new ones | `@/shared/api/endpoints` (extended, section 7) |
| A request, a command, every page of a short list | `apiRequest`, `apiCommand`, `fetchAllPages` | `@/shared/api/request` |
| The methods, the statuses in tests | `HttpMethod`, `HttpStatus` | `@/shared/api/http` |
| The options of a query hook | `HookQueryOptions` | `@/shared/api/query-client` |
| The languages of the documents | `outputLanguages` | `@/shared/config/output-language` |
| RunDefaults | `runDefaultsSchema`, `RunDefaults` | `@/modules/run/entities/@x/user` (new, section 7) |
| Mock: scenario, body, path | `answerScenario`, `readBodyFields`, `pathParam` | `mocks/shared/scenario`, `mocks/shared/http/request` |
| Mock: answers | `paginate`, `emptyPage`, `noContent`, `notFound`, `validationFailed` | `mocks/shared/http/response` |
| Mock: checks of a body | `schemaProblems`, `requiredText`, `requiredTextProblem` | `mocks/shared/http/validation` |
| Mock: the checks of RunDefaults | `validateRunDefaults(given, field)` | `mocks/runs/runs.validators.ts` (a parameter added, section 7) |
| Mock: ids, time, state | `mockId`, `IdPrefix`, `userId`, `mockNow`, `mockState` | `mocks/shared/db` |
| Mock: the user and the session state | `currentUser`, `sessionState` | `mocks/account/account.store.ts` |
| Tests | `itSendsRequests`, `itThrowsApiErrors`, `itNestsQueryKeys`, `itTellsQueryKeysApart`, `itWaitsUntilEnabled`, `itRejectsRequests` | `@/test/suites` |
| Tests | `getApi`, `getApiItems`, `patchApi`, `postApi`, `putApi`, `deleteApi`, `openPage`, `serverErrorOn` | `@/test/msw` |
| Tests | `renderHookWithProviders`; `waitForSuccess` | `@/test/render`; `@/test/steps` |

### Extract before the new code

None. A search of `src/` for what E8 would write a third time finds:

| Candidate | Copies | Result |
|---|---|---|
| The checks of RunDefaults with another field path | `validateRunDefaults` writes `run_config` in its paths; `default_run_config` needs the same checks | A parameter `field = 'run_config'` on the reader of `main`; no new reader |
| A text that is not empty once trimmed | `requiredText` and `requiredTextProblem` | Used for `display_name` |
| An enum, a boolean, a number in a body | `schemaProblems` (`type`, `enum`, `additionalProperties`) | Used for the settings and the shape of the bodies |

### Checked, not extracted

| Code | Copies | Why it stays |
|---|---|---|
| An `http` or `https` address | `avatar_url` in `validateUpdateMeBody`: one | A private check with `URL.canParse` and the protocol in the validator; a second reader moves it to `mocks/shared/http/validation` |
| A record that is null in the store until the first write, read with the fixture | `replacedModelSettings` of E7, `savedUserSettings`: two | Two lines each; a third moves the pattern to `mocks/shared/db` |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `user/entities/user.api.ts`, `user.keys.ts`, `user.types.ts`, `hooks/useMe.ts`, `__tests__/*` | `git mv` into `user/entities/user/`, names and content unchanged except the relative imports | 1 |
| `user/entities/index.ts` | The paths of `./user/...` | 1 |
| `frontend/lint/lib/file-names/file-kinds.constants.js` | `user: { sessions: [], user: [], 'user-settings': [] }` in `topicEntityModules`, after `run`, in the order of the names | 1 |
| `frontend/lint/lib/imports/__tests__/topic-patterns.utils.test.js` | `entityTopics('user')` gives the three topics; `topicPatterns('user', 'sessions')` refuses `../user-settings/user-settings.types` | 1 |
| `modules/run/entities/@x/user.ts` (new) | `export { type RunDefaults, runDefaultsSchema } from '../config/run-config.types'` | 2 |
| `user/entities/user/user.types.ts` | `UpdateMeBody`, `ChangePasswordBody` | 2 |
| `user/entities/index.ts` | The type exports (commit 2), then the API functions, keys and hooks (commit 5) | 2, 5 |
| `shared/api/endpoints/api-endpoints.constants.ts` | `password: apiEndpoint('/me/password')`, `sessions: apiEndpoint('/me/sessions')`, `session: apiEndpoint('/me/sessions/:sessionId')`, `userSettings: apiEndpoint('/me/settings')`, after `me` and before `models` | 3 |
| `mocks/shared/db/mock-ids.constants.ts` | `IdPrefix.Session: '5e55'`; `sessionIds` | 3 |
| `mocks/account/account.store.ts` | `currentPassword = mockState('password', () => mePasswordFixture)` | 3 |
| `mocks/account/me.fixtures.ts` | `mePasswordFixture = 'correct-horse-7'`, with a comment: the password of the user of the examples, which a change of the password checks | 3 |
| `mocks/account/me.handlers.ts` | `PATCH /me` and `POST /me/password` (section 9) | 3 |
| `mocks/account/auth.handlers.ts` | Login calls `signIn()`, logout `signOut()`; register also sets `currentPassword` to the password of the body and calls `resetUserSettings()` | 3 |
| `mocks/runs/runs.validators.ts` | `validateRunDefaults(given: unknown, field = 'run_config')`: `schemaProblems(runDefaultsJsonSchema, given, field)`; the JSDoc names the field | 3 |
| `mocks/api.setup.ts` | `...sessionHandlers`, `...userSettingHandlers`, after `meHandlers` | 3 |
| `mocks/runs/lookup/runs.lookup.ts` | `resolveRunConfig`: `levels` is `[override, project?.run_config, currentUserSettings().default_run_config]`; the JSDoc names the settings of the user between the project and the default (decision 13) | 4 |
| `mocks/projects/projects.validators.ts` | A language left out is `currentUserSettings().default_output_language`, not `'en'` (decision 13) | 4 |
| `mocks/runs/lookup/__tests__/runs.lookup.data.ts`, `runs.lookup.test.ts` | The expected configs take `max_steps: 60` where no level above sets it; the cases of section 10 | 4 |
| Tests of `main` that expect `defaultRunConfigFixture.max_steps` on a run that the mock starts (find them with `grep -rn "max_steps\|defaultRunConfigFixture" frontend/src --include=*.test.ts --include=*.data.ts`) | Expect 60, or the value of the level that sets it | 4 |

No change: `moduleImports` (`user` reads `auth` and `run` already), `fileKinds`, `publicApiPaths`, `UserMenu`, `ThemePicker`, `SettingsPage`, the `llm-model` entities and mocks.

## 8. The entity, file by file

```text
modules/user/entities/
├── index.ts
├── user/                                # the signed-in user: profile and password
│   ├── user.api.ts
│   ├── user.keys.ts
│   ├── user.types.ts
│   ├── hooks/
│   │   └── useMe.ts
│   └── __tests__/
│       ├── user.api.data.ts
│       ├── user.api.test.ts
│       ├── user.keys.data.ts
│       └── user.keys.test.ts
├── sessions/                            # the devices where the user is signed in
│   ├── sessions.api.ts
│   ├── sessions.constants.ts
│   ├── sessions.keys.ts
│   ├── sessions.types.ts
│   ├── hooks/
│   │   ├── useSessionQueries.ts
│   │   └── __tests__/
│   │       └── useSessionQueries.test.ts
│   └── __tests__/
│       ├── sessions.api.data.ts
│       ├── sessions.api.test.ts
│       ├── sessions.keys.data.ts
│       └── sessions.keys.test.ts
└── user-settings/                       # the preferences and the defaults of the user
    ├── user-settings.api.ts
    ├── user-settings.keys.ts
    ├── user-settings.types.ts
    ├── hooks/
    │   ├── useUserSettingsQueries.ts
    │   └── __tests__/
    │       └── useUserSettingsQueries.test.ts
    └── __tests__/
        ├── user-settings.api.data.ts
        ├── user-settings.api.test.ts
        ├── user-settings.keys.data.ts
        └── user-settings.keys.test.ts
```

| File | Holds | Reuses |
|---|---|---|
| `user/user.types.ts` | `meSchema`, `Me` (on `main`); `UpdateMeBody`, `ChangePasswordBody` | |
| `user/user.api.ts` | `getMe()` (on `main`), `updateMe(body)`, `changePassword(body)` | `apiRequest`, `apiCommand`, `apiEndpoints`, `HttpMethod` |
| `user/user.keys.ts` | `userKeys` (on `main`, unchanged) | |
| `user/hooks/useMe.ts` | `useMe` (on `main`, unchanged) | |
| `sessions/sessions.types.ts` | `sessionSchema`, `Session`. The usual header: temporary hand-written schemas, `TODO: replace with the types generated into src/shared/api/generated/ once they exist.` | |
| `sessions/sessions.api.ts` | `listSessions()`, `revokeSession(sessionId)`; the usual `TODO: switch to the generated client ...` | `fetchAllPages`, `apiCommand`, `apiEndpoints`, `HttpMethod` |
| `sessions/sessions.constants.ts` | `sessionsPageSize = 200`, with a comment: a user has a few sessions, read whole in the largest pages the API allows | |
| `sessions/sessions.keys.ts` | `sessionKeys` | |
| `sessions/hooks/useSessionQueries.ts` | `useSessions` | `HookQueryOptions` |
| `user-settings/user-settings.types.ts` | `themes`, `Theme`, `uiLanguages`, `UiLanguage`; `userSettingsSchema`, `UserSettings`; `ReplaceUserSettingsBody`. Same header | `runDefaultsSchema` from `@x/user`, `outputLanguages` |
| `user-settings/user-settings.api.ts` | `getUserSettings()`, `replaceUserSettings(body)` | `apiRequest`, `apiEndpoints`, `HttpMethod` |
| `user-settings/user-settings.keys.ts` | `userSettingsKeys` | |
| `user-settings/hooks/useUserSettingsQueries.ts` | `useUserSettings` | `HookQueryOptions` |
| `index.ts` | `getMe`, `updateMe`, `changePassword`, `userKeys`, `useMe`; `listSessions`, `revokeSession`, `sessionKeys`, `useSessions`; `getUserSettings`, `replaceUserSettings`, `userSettingsKeys`, `useUserSettings`; the types `Me`, `UpdateMeBody`, `ChangePasswordBody`, `Session`, `UserSettings`, `Theme`, `UiLanguage`, `ReplaceUserSettingsBody` (decision 18) | |

No file of one topic imports another; ESLint checks it from commit 1.

Sketch of the types (comments in the style of `model-settings.types.ts`):

```ts
// user/user.types.ts, added below meSchema

/** The fields of the user that the user may change; a field left out keeps its value. */
export interface UpdateMeBody {
  /** Not empty once trimmed, at most 100 characters. */
  display_name?: string
  /** An `http` or `https` address, or null for no picture. */
  avatar_url?: string | null
}

/** The body that changes the password of the user; the other sessions of the user end. */
export interface ChangePasswordBody {
  current_password: string
  /** At least 8 characters, other than the current password. */
  new_password: string
}
```

```ts
// sessions/sessions.types.ts

/** A device where the user is signed in; the token of the session is never sent. */
export const sessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  expires_at: z.iso.datetime(),
  last_seen_at: z.iso.datetime(),
  /** The browser and the system, as the device sent them. */
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  /** Null in the list, which holds the sessions that are not revoked. */
  revoked_at: z.iso.datetime().nullable(),
  /** True for the session of this browser. */
  current: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
export type Session = z.infer<typeof sessionSchema>
```

```ts
// user-settings/user-settings.types.ts

/** The themes that the user may choose; `system` follows the device. */
export const themes = ['light', 'dark', 'system'] as const
export type Theme = (typeof themes)[number]

/** The languages of the screens. */
export const uiLanguages = ['en', 'vi'] as const
export type UiLanguage = (typeof uiLanguages)[number]

/** The preferences of the user, one record for each user, the same on every device. */
export const userSettingsSchema = z.object({
  user_id: z.string(),
  theme: z.enum(themes),
  ui_language: z.enum(uiLanguages),
  /** The language of the documents of a new project. */
  default_output_language: z.enum(outputLanguages),
  /** The run settings for every field that a project leaves empty. */
  default_run_config: runDefaultsSchema,
  /** Notify when a run waits for review. */
  notify_on_interrupt: z.boolean(),
  notify_on_run_finished: z.boolean(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})
export type UserSettings = z.infer<typeof userSettingsSchema>

/** The settings to change; a field left out keeps its value. */
export type ReplaceUserSettingsBody = Partial<
  Pick<
    UserSettings,
    | 'theme'
    | 'ui_language'
    | 'default_output_language'
    | 'default_run_config'
    | 'notify_on_interrupt'
    | 'notify_on_run_finished'
  >
>
```

The API functions:

- `updateMe(body: UpdateMeBody): Promise<Me>`: `apiRequest(apiEndpoints.me.path(), meSchema, { action: 'save your profile', method: HttpMethod.Patch, body })`. JSDoc: changes the name or the picture of the user, and gives the user as saved.
- `changePassword(body: ChangePasswordBody): Promise<void>`: `apiCommand(apiEndpoints.password.path(), { action: 'change your password', body })`. JSDoc: changes the password; the session of this browser stays and the other sessions of the user end.
- `listSessions(): Promise<Session[]>`: `fetchAllPages(apiEndpoints.sessions.path(), sessionSchema, { limit: sessionsPageSize, action: 'load your sessions' })`. JSDoc: the sessions of the user that are not revoked or expired, the last seen first.
- `revokeSession(sessionId: string): Promise<void>`: `apiCommand(apiEndpoints.session.path({ sessionId }), { action: 'revoke the session', method: HttpMethod.Delete })`. JSDoc: ends a session; ending the session of this browser signs the user out.
- `getUserSettings(): Promise<UserSettings>`: `apiRequest(apiEndpoints.userSettings.path(), userSettingsSchema, { action: 'load your settings' })`. JSDoc: the settings of the user, the defaults until the user saves some.
- `replaceUserSettings(body: ReplaceUserSettingsBody): Promise<UserSettings>`: `apiRequest(apiEndpoints.userSettings.path(), userSettingsSchema, { action: 'save your settings', method: HttpMethod.Put, body })`. JSDoc: saves the settings given, keeps the others, and gives the settings as saved.

Sketch of the keys:

```ts
/** The query keys of the sessions of the user, from the widest to the narrowest; each starts with the one above. */
export const sessionKeys = {
  all: () => ['sessions'] as const,
  /** Every session of the user that is not revoked. */
  list: () => [...sessionKeys.all(), 'list'] as const,
}

/** The query keys of the settings of the user, from the widest to the narrowest; each starts with the one above. */
export const userSettingsKeys = {
  all: () => ['user-settings'] as const,
  /** The settings of the signed-in user. */
  detail: () => [...userSettingsKeys.all(), 'detail'] as const,
}
```

The hooks:

- `useSessions({ isEnabled = true }: HookQueryOptions = {})`: `useQuery` on `sessionKeys.list()`, `queryFn: listSessions`. JSDoc: the sessions of the user; revoking one invalidates `sessionKeys.all()`.
- `useUserSettings({ isEnabled = true }: HookQueryOptions = {})`: `useQuery` on `userSettingsKeys.detail()`, `queryFn: getUserSettings`. JSDoc: the settings of the user; saving them invalidates `userSettingsKeys.all()`.

## 9. The mock, file by file

```text
mocks/account/
├── account.store.ts             # + currentPassword
├── auth.changes.ts              # new: signIn, signOut
├── auth.handlers.ts             # login, logout and register use the changes
├── me.fixtures.ts               # + mePasswordFixture
├── me.changes.ts                # new
├── me.validators.ts             # new
├── me.handlers.ts               # + PATCH /me, POST /me/password
├── me.problems.ts
├── sessions.fixtures.ts         # new
├── sessions.store.ts            # new
├── sessions.lookup.ts           # new
├── sessions.changes.ts          # new
├── sessions.problems.ts         # new
├── sessions.handlers.ts         # new
└── __tests__/

mocks/user-settings/
├── user-settings.fixtures.ts
├── user-settings.store.ts
├── user-settings.lookup.ts
├── user-settings.changes.ts
├── user-settings.validators.ts
├── user-settings.handlers.ts
└── __tests__/
```

| File | Holds | Reuses |
|---|---|---|
| `account/me.changes.ts` | `changeMe(fields: UpdateMeBody)`: the user with the fields given, `display_name` trimmed, `updated_at` now; `changeStoredPassword(password)`: sets `currentPassword` and calls `removeOtherSessions()` | `currentUser`, `currentPassword`, `mockNow`, `removeOtherSessions` |
| `account/me.validators.ts` | `validateUpdateMeBody(given)`: `{ fields }` or `{ problems }`; `validateChangePasswordBody(given)`: `{ password }` or `{ problems }`; the private schemas and `isHttpAddress` | `schemaProblems`, `requiredText`, `requiredTextProblem`, `currentPassword` |
| `account/sessions.fixtures.ts` | `sessionFixtures`, the four sessions of the table below, typed `Session[]` | `sessionIds`, `userId` |
| `account/sessions.store.ts` | `revokedSessions = mockState<Record<string, string>>('revoked-sessions', () => ({}))`: the id of a session revoked since the fixtures, with its `revoked_at` | `mockState` |
| `account/sessions.lookup.ts` | `allSessions()` (the fixtures with the `revoked_at` and `updated_at` of the store); `activeSessions()` (those with no `revoked_at`, by `last_seen_at` descending, ties by `id`); `findActiveSession(id)` | the fixtures, the store |
| `account/sessions.changes.ts` | `removeSession(id)` (`revoked_at` now); `removeOtherSessions()` (every active session but `sessionIds.current`); `addCurrentSession()` (drops `sessionIds.current` from the store) | the store, `mockNow`, `activeSessions` |
| `account/sessions.problems.ts` | `sessionNotFound()`: `notFound('The session')` | `notFound` |
| `account/sessions.handlers.ts` | `sessionHandlers`: `GET /me/sessions`, `DELETE /me/sessions/:sessionId` | section 6, `signOut` |
| `account/auth.changes.ts` | `signIn()`: `sessionState` logged in and `addCurrentSession()`; `signOut()`: `removeSession(sessionIds.current)` and `sessionState` logged out | `sessionState`, the sessions changes |
| `user-settings/user-settings.fixtures.ts` | `userSettingsFixture` (decision 17); `defaultUserSettings(user: Me)`: the defaults of decision 11 for that user, with the `created_at` of the user as both times | `userId` |
| `user-settings/user-settings.store.ts` | `savedUserSettings = mockState<UserSettings \| null>('user-settings', () => null)` | `mockState` |
| `user-settings/user-settings.lookup.ts` | `currentUserSettings()`: the store, else the fixture | the fixture, the store |
| `user-settings/user-settings.changes.ts` | `changeUserSettings(fields)`: the current settings with the fields given, `updated_at` now when a value changed; `resetUserSettings()`: `defaultUserSettings(currentUser.get())` in the store | the lookup, the store, `mockNow`, `currentUser` |
| `user-settings/user-settings.validators.ts` | `validateUserSettingsBody(given)`: `{ fields: ReplaceUserSettingsBody }` or `{ problems }`; the private `userSettingsBodySchema` | `schemaProblems`, `validateRunDefaults`, `themes`, `uiLanguages`, `outputLanguages` |
| `user-settings/user-settings.handlers.ts` | `userSettingHandlers`: `GET`, `PUT /me/settings` | section 6 |

The sessions of the fixtures, user `userId`; `expires_at` is 60 days after `last_seen_at`, `updated_at` is `last_seen_at` (or `revoked_at` for the revoked one):

| Id | `user_agent` | `ip_address` | `created_at` | `last_seen_at` | `revoked_at` | `current` |
|---|---|---|---|---|---|---|
| `sessionIds.current` | Chrome 141 on Windows 11 | 203.0.113.24 | 2026-10-06T08:20:00Z | 2026-10-06T09:41:00Z | null | true |
| `sessionIds.phone` | Safari 19 on iPhone | 198.51.100.7 | 2026-10-03T19:02:00Z | 2026-10-05T21:15:00Z | null | false |
| `sessionIds.laptop` | Firefox 143 on Ubuntu | null | 2026-09-21T07:45:00Z | 2026-09-30T10:03:00Z | null | false |
| `sessionIds.revoked` | Edge 140 on Windows 11 | 203.0.113.80 | 2026-09-10T12:00:00Z | 2026-09-12T18:30:00Z | 2026-09-12T18:31:00Z | false |

The checks, each problem at the field that the API names:

| Body | Field | Rule | Problem |
|---|---|---|---|
| `PATCH /me` | the body | No field but `display_name` and `avatar_url` | `schemaProblems`: "This field is not allowed." |
| | `display_name` | Left out, or a string not empty once trimmed | `schemaProblems` for the type; `requiredTextProblem('display_name')` |
| | | At most 100 characters once trimmed | `{ field, message: 'Use at most 100 characters.' }` |
| | `avatar_url` | Left out, null, or a string that `URL.canParse` reads with the protocol `http:` or `https:` | `schemaProblems` for the type; `{ field, message: 'Send an http or https address.' }` |
| `POST /me/password` | the body | `current_password` and `new_password` required, strings, no other field | `schemaProblems` |
| | `current_password` | Equal to `currentPassword.get()` | `{ field, message: 'The current password is wrong.' }` |
| | `new_password` | At least 8 characters (checked once the current password is right) | `{ field, message: 'Use at least 8 characters.' }` |
| | | Other than the current password | `{ field, message: 'Choose a password other than the current one.' }` |
| `PUT /me/settings` | the body | No field but the six settings; every field optional | `schemaProblems` |
| | `theme`, `ui_language`, `default_output_language` | A value of `themes`, `uiLanguages`, `outputLanguages` | `schemaProblems` (`enum`): "Choose one of the values." |
| | `notify_on_interrupt`, `notify_on_run_finished` | A boolean | `schemaProblems`: "Send a value of type boolean." |
| | `default_run_config` | An object with the rules of `run_config`, a field left out null | `validateRunDefaults(given.default_run_config, 'default_run_config')`, at `default_run_config.<field>` |

`userSettingsBodySchema` is `{ type: 'object', additionalProperties: false, properties: { theme: { enum: [...themes] }, ui_language: { enum: [...uiLanguages] }, default_output_language: { enum: [...outputLanguages] }, default_run_config: {}, notify_on_interrupt: { type: 'boolean' }, notify_on_run_finished: { type: 'boolean' } } }`, called with the path `''` and the leading dot taken off the fields, as `modelSettingsShapeProblems` of E7. `default_run_config` is checked by `validateRunDefaults` only when the body has it.

The handlers, in the order of the mock README (`answerScenario`, the record, the checks, the change, the answer):

- `PATCH me.pattern`: `answerScenario('update-me')`; `validateUpdateMeBody(await readBodyFields(request))` or `validationFailed(problems)`; `changeMe(fields)`; `HttpResponse.json(currentUser.get())`.
- `POST password.pattern`: `answerScenario('change-password')`; `validateChangePasswordBody(...)` or `validationFailed`; `changeStoredPassword(password)`; `noContent()`.
- `GET sessions.pattern`: `answerScenario('sessions')`; the empty scenario answers `emptyPage()`; `paginate(activeSessions(), request)`.
- `DELETE session.pattern`: `answerScenario('revoke-session')`; `findActiveSession(pathParam(params, 'sessionId'))` or `sessionNotFound()`; `sessionIds.current` calls `signOut()`, another `removeSession(id)`; `noContent()`.
- `GET userSettings.pattern`: `answerScenario('user-settings')`; the empty scenario answers `defaultUserSettings(currentUser.get())` (decision 16); `HttpResponse.json(currentUserSettings())`.
- `PUT userSettings.pattern`: `answerScenario('replace-user-settings')`; `validateUserSettingsBody(...)` or `validationFailed`; `changeUserSettings(fields)`; `HttpResponse.json(currentUserSettings())`. Not wrapped in `idempotent`: a `PUT` gives the same result when it repeats.

Scenarios: `mock-update-me` (`error`, `loading`), `mock-change-password` (`error`, `loading`), `mock-sessions` (`empty`, `error`, `loading`), `mock-revoke-session` (`error`, `loading`), `mock-user-settings` (`empty` for the defaults, `error`, `loading`), `mock-replace-user-settings` (`error`, `loading`).

What the mock data then holds: the user of the examples with the password `correct-horse-7`, three active sessions and one revoked, and saved settings (dark theme, runs of 60 steps at most). A changed name shows in the account menu after its query reloads; a changed password ends the phone and the laptop sessions; revoking the session of this browser signs out, and the next login brings it back; a register starts from the default settings; a run that starts takes `max_steps` from the request, the project, then the settings; a project created without a language takes the one of the settings. `?mock-reset` brings the fixtures back.

## 10. Tests

Data-driven where the cases share one flow (CONTRIBUTING, Testing); every new reader and handler has cases for what it refuses.

| Test | Cases |
|---|---|
| `user/entities/user/__tests__/user.api.test.ts` with `.data.ts` (moved) | New in `itSendsRequests`: `updateMe` (`PATCH /me` with its body), `changePassword` (`POST /me/password`). `itThrowsApiErrors`: 500 for each, 422 at `display_name` for `updateMe`, 422 at `current_password` for `changePassword`. Against the mock: `updateMe({ display_name: 'Linh P.' })` answers the user with that name; `changePassword` with the fixture password resolves |
| `user/entities/sessions/__tests__/sessions.api.test.ts` with `.data.ts` | `itSendsRequests`: `listSessions` (`GET /me/sessions?limit=200`), `revokeSession` (`DELETE /me/sessions/<id>`). `itThrowsApiErrors`: 500 for each, 404 for `revokeSession`. Against the mock: three sessions, `current` first; after `revokeSession(sessionIds.phone)` two |
| `user/entities/user-settings/__tests__/user-settings.api.test.ts` with `.data.ts` | `itSendsRequests`: `getUserSettings` (`GET /me/settings`), `replaceUserSettings` (`PUT` with its body). `itThrowsApiErrors`: 500 for each, 422 at `theme` for `replaceUserSettings`. Against the mock: the fixture settings; `replaceUserSettings({ theme: 'light' })` keeps the other fields |
| `sessions/__tests__/sessions.keys.test.ts`, `user-settings/__tests__/user-settings.keys.test.ts` with `.data.ts` | `itNestsQueryKeys` (all, list or detail); `itTellsQueryKeysApart` (the narrow key and `all`). No case across topics |
| `user/__tests__/user.keys.test.ts` (moved) | Unchanged |
| `sessions/hooks/__tests__/useSessionQueries.test.ts`, `user-settings/hooks/__tests__/useUserSettingsQueries.test.ts` | The hook loads (three sessions; the fixture settings); `itWaitsUntilEnabled` for `isEnabled: false` |
| `mocks/account/__tests__/me.validators.test.ts` with `.data.ts` | Each row of the `PATCH /me` and `POST /me/password` checks, accepted and refused: an empty body accepted; a name of 100 characters accepted and of 101 refused; a name of spaces refused; `avatar_url` null, `https://...` accepted, `ftp://...` and `not a url` refused; a field not allowed; a wrong current password; a new password of 7 characters; the same password |
| `mocks/account/__tests__/me.handlers.test.ts` with `.data.ts` (extended) | `PATCH` then `GET /me` reads the change, `display_name` trimmed; `POST /me/password` answers 204, then the old password is refused and the new one accepted, and `GET /me/sessions` holds the current session only; `itRejectsRequests`: the 422 of each body, the error scenarios of `update-me` and `change-password` (500) |
| `mocks/account/__tests__/sessions.lookup.test.ts` with `.data.ts` | `activeSessions()`: three, by `last_seen_at` descending, the revoked one left out; after `removeSession(sessionIds.laptop)` two; `findActiveSession` of a revoked or unknown id is undefined |
| `mocks/account/__tests__/sessions.changes.test.ts` | `removeSession` sets `revoked_at` and `updated_at`; `removeOtherSessions` keeps the current one; `addCurrentSession` brings it back |
| `mocks/account/__tests__/sessions.handlers.test.ts` with `.data.ts` | `GET` answers three sessions with one `current`; the empty scenario; `DELETE` of the phone answers 204 and `GET` lists two; `DELETE` of the current session answers 204, then `GET /me` answers 401; `itRejectsRequests`: an unknown id, the revoked fixture, the same id twice (404), the error scenarios of `sessions` and `revoke-session` (500) |
| `mocks/account/__tests__/auth.handlers.test.ts` (extended) | Logout then login lists the current session again; register then `POST /me/password` with the password of the register succeeds, and `GET /me/settings` answers the defaults |
| `mocks/user-settings/__tests__/user-settings.validators.test.ts` with `.data.ts` | An empty body and a body of every field accepted; each enum refused with a value out of its list; a `notify_on_` field that is a string; `default_run_config.max_steps` of `'many'` refused at that path; `default_run_config` with one field gives the others null; `user_id` refused as not allowed |
| `mocks/user-settings/__tests__/user-settings.changes.test.ts` | A field changed keeps the others; `updated_at` changes only when a value does; `resetUserSettings` writes the defaults with the `created_at` of the user |
| `mocks/user-settings/__tests__/user-settings.handlers.test.ts` with `.data.ts` | `GET` answers the fixture; the empty scenario answers the defaults; `PUT` then `GET` reads the change; `itRejectsRequests`: a theme out of the list, `default_run_config.max_steps` of the wrong type, a field not allowed (422 at the field), the error scenarios of `user-settings` and `replace-user-settings` (500) |
| `mocks/runs/lookup/__tests__/runs.lookup.test.ts` with `.data.ts` | The expected configs of `main` take `max_steps: 60`; new cases: the project `max_steps` wins over the settings; the `override` wins over both; with the settings reset (`resetUserSettings()`), the default 80 comes back |
| `mocks/projects/__tests__/projects.handlers.test.ts` | `POST /projects` without `output_language` creates a project in `en` with the fixtures, and in `vi` after `changeUserSettings({ default_output_language: 'vi' })` |
| `mocks/runs/__tests__/runs.validators.test.ts` | `validateRunDefaults(given, 'default_run_config')` names its problems at `default_run_config.<field>`; the cases of `main` keep `run_config` |
| `lint/lib/imports/__tests__/topic-patterns.utils.test.js` | The case of section 7 (commit 1) |

## 11. Docs to update

Docs first, on `docs/fe/api-fields` (written in its worktree on 2026-10-31, not committed): `docs/API.md`, Authentication and account: the rows of `PATCH /me` (decision 8), `POST /me/password` (decision 9), `GET` and `DELETE /me/sessions` (decision 10); Settings and models: `GET` and `PUT /me/settings` (decision 11); Projects: `POST /projects` with the language left out (decision 12). Data Shape does not change: `current` is a field of the answer, written in the row of the API.

In the PR (last commit):

| Doc | Change |
|---|---|
| `docs/architecture/web-app-modules.md`, section 1 | The sentence "Two modules hold no object of the product yet: `user` the settings page ..." becomes one module, `design-system`; `user` holds User, Session and UserSettings, with the settings page and the theme feature |
| Same, section 1, tree | `user/entities/  # User (user/), Session (sessions/), UserSettings (user-settings/)` |
| Same, section 2 | After the sentence of `llm-model`: "The entities of `user` split by topic too: `user`, the signed-in user, `sessions`, the devices where the user is signed in, and `user-settings`, the preferences; none reads another." |
| Same, section 6, row `user` | Objects: "User, Session, UserSettings"; State: "The entities; the forms of the account and the preferences with Settings" |
| Same, section 7, row `user` | `/me`, `/me/password`, `/me/sessions`, `/me/settings` |
| `docs/architecture/web-app.md`, section 9 | The row of the user, or a new row "Account": `user`, entities; `modules/user/entities/user/user.api.ts`, `sessions/sessions.api.ts`, `user-settings/user-settings.api.ts`, with their types and hooks |
| `frontend/README.md`, Mock data | Row `me`: `GET`, `PATCH /me`, `POST /me/password` (a wrong current password answers 422; a change ends the other sessions); new rows `sessions` (`GET /me/sessions`, `DELETE /me/sessions/{session_id}`; revoking the current session signs out) and `user-settings` (`GET`, `PUT /me/settings`; a field left out keeps its value) |
| `src/mocks/README.md` | Rows of the six scenarios of section 9 in Parameters; in Mock data, one sentence: the user has the password `correct-horse-7`, three active sessions and saved settings, and a run takes the run settings of the request, then of the project, then of the user; "the profile, the password, the revoked sessions and the settings that `PUT` saved" in the list of what the mock server keeps; rows of the table of states for the sessions (`?mock-sessions=empty`) and the default settings (`?mock-user-settings=empty`) |
| `docs/frontend-implementation-plan.md` (on `frontend-plan`) | Row E8: "As built", with what differs from this plan; section 6, E8: the copies as renamed here; checklist |

## 12. Left for the next PRs

The agent writes no code for these; they go in the docs where named.

| Item | When | Note |
|---|---|---|
| The forms of the profile, the password and the preferences, the list of the sessions, and their mutation hooks (`useUpdateMe`, `useChangePassword`, `useRevokeSession`, `useReplaceUserSettings`) | S5 | Features of `user`; each invalidates the widest key of its resource; revoking the current session or changing the password leads to the login page as Sign out does |
| The theme saved on the server | S5 | `ThemePicker` stores the theme in the browser (`next-themes`); S5 saves `theme` of UserSettings and applies it on load; the words "Stored in this browser only" of `SettingsPage` change then |
| `ui_language` applied to the screens | Later | The screens are in English only |
| The notifications | Later | `notify_on_interrupt`, `notify_on_run_finished` are stored; nothing notifies yet |
| The dialog that creates a project with the defaults of the user | S5 or the PR that changes the dialog | `project` reads `user` then: a place in `moduleImports` in the `build` commit of that PR (section 4 of the implementation plan) |
| The login mock that checks the password | A fix PR of the mocks | Decision 14 |
| The expiry of the sessions in the mock | Not planned | Decision 15 |
| A third store that is null until its first write | The PR that writes it | Moves the pattern to `mocks/shared/db` (section 6) |

## 13. Commits and checks

1. `refactor(frontend): split the user entities by topic`: the `git mv` of the files of `main` into `user/`, the paths of `index.ts`, `topicEntityModules.user`, the case of `topic-patterns.utils.test.js`
2. `feat(frontend): add the types of the sessions, the user settings and the changes of the user`: `run/entities/@x/user.ts`, `sessions/sessions.types.ts`, `user-settings/user-settings.types.ts`, the bodies of `user/user.types.ts`, the type exports of `index.ts`
3. `feat(frontend): mock the profile, the password, the sessions and the settings of the user`: the endpoints, `IdPrefix.Session` and `sessionIds`, `validateRunDefaults` with its field, the new files of `mocks/account/` and `mocks/user-settings/`, the changes of the auth handlers, `api.setup.ts`, the mock tests
4. `feat(frontend): start a run and create a project with the defaults of the user settings`: `resolveRunConfig`, `validateNewProject`, their tests and the tests of `main` that expect the default `max_steps`
5. `feat(frontend): change the profile and the password, and read and revoke the sessions and the settings of the user`: the api, constants, keys and hooks of the three topics, `index.ts`, their tests
6. `docs(frontend): describe the user entities and their mock in the guides`

The mock comes before the API functions, so that the tests of commit 5, which run against the mock, pass on each commit. Commit 1 changes no behavior: only moves and the lint list; ESLint refuses the files at the root of a module in `topicEntityModules`, so the move and the list go together. Files of two commits: `index.ts` (1, 2 and 5), `user/user.types.ts` (1: moved; 2: the bodies).

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on `src/modules/user`, `src/modules/run/entities`, `src/mocks/account`, `src/mocks/user-settings`, `src/mocks/runs`, `src/mocks/projects`, `src/mocks/messages`, `src/mocks/threads`, `lint/lib/imports`; `pnpm typecheck` once, since types, exports, moves and the lint lists change. No full suite, E2E, screenshots or build: no server component imports the new files (`useMe` keeps its importers). A test that times out only when run with the others is run again alone before it counts as a failure. Then:

- `git status` shows the moves of commit 1 as `R`.
- `grep -rnE "FR-[0-9]|NFR-[0-9]|docs/" frontend/src/modules/user frontend/src/mocks/account frontend/src/mocks/user-settings` answers nothing; `grep -rniE "backend|frontend|\bUI\b|dashboard"` on the new comments too.
- `grep -rnwE "LoginSession|profileSchema|last_used_at|changeProfile|useAccountQueries" frontend/src` answers nothing.
- `grep -nP '[^\x00-\x7F]'` on each changed doc shows only tree lines.
- No `console.log`; nothing committed or pushed without the user.

## 14. Checklist

- [x] Decisions 8 to 12 confirmed by the user (2026-10-31)
- [x] Those rules written in `docs/API.md` in the worktree of `docs/fe/api-fields` (2026-10-31)
- [x] That change committed on `docs/fe/api-fields` (`dc69e97`, 2026-10-31)
- [x] E7 merged (#50, `5880c29`)
- [x] The branch cut from `origin/main`
- [x] Commit 1: the moves (shown as `R`) and `topicEntityModules.user`, the lint tests green
- [x] Commit 2: the types, `@x/user` and the type exports of the index (so that commit 3 compiles)
- [x] Commit 3: the mock, all its new files tested, the auth handlers on `signIn` and `signOut`
- [x] Commit 4: the third level of the run settings and the language of a new project, with the tests of `main` updated
- [x] Commit 5: the entity, three topics, every endpoint with its API function, key, hook and tests; no import from one topic to another
- [x] Commit 6: docs
- [ ] Every state reachable in `pnpm dev:mock` through a scenario of section 9
- [ ] Only the checks of section 13 ran
- [ ] Row E8 of the implementation plan updated
- [ ] The description of the PR written from this plan; the endpoints it lists checked against the `*.api.ts` functions
