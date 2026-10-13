# Frontend review and merge plan

How the frontend work on `feat/fe/mock` goes into `main`: which PRs, in which order, with which files and endpoints, and what to check before each one. The first PR is the layout components; after it the plan goes feature by feature, endpoint by endpoint. A branch for the frontend CI is part of the plan and does not wait for the others.

## Contents

- [1. Method and decision drivers](#1-method-and-decision-drivers)
- [2. Context](#2-context)
- [3. Decisions](#3-decisions)
- [4. PR sequence](#4-pr-sequence)
- [5. PR details](#5-pr-details)
- [6. Files that several PRs touch](#6-files-that-several-prs-touch)
- [7. Before cutting a PR](#7-before-cutting-a-pr)
- [8. Open points](#8-open-points)
- [9. Checklist](#9-checklist)

## 1. Method and decision drivers

The method is GitHub Flow, as in CONTRIBUTING, applied as vertical slices: a PR is one reviewable piece (a screen with its endpoints, mock handlers, tests and doc section), and the pieces are ordered by what imports what.

Drivers, from CONTRIBUTING and from how this codebase is built:

| Driver | Consequence for the plan |
|---|---|
| `main` is green after every merge: typecheck, lint, tests, build | No PR may leave an import, a route or a mock handler that the next PR is supposed to add |
| Squash merge, one logical change per PR | One slice per PR; the PR title is the commit on `main`, so it follows Conventional Commits |
| Moves and renames go in their own PR | Deleting the old shell (AppShell, app-sidebar, `(app)` routes, chat) is done where its replacement lands, not mixed with a rewrite of the same files |
| Tests, mocks and docs ship with the feature | Each slice lists its unit tests, its e2e spec, its mock handlers and its section of `docs/ui/skeletons.md` |
| A reviewer must be able to read a PR in one sitting | Slices above about 1500 changed lines are split (artifacts, projects) or read in a suggested order (console) |
| The Codespace has 8 GB and 2 cores | Checks run one at a time; a full lint peaks at about 1.4 GB and takes about 100 s, unit tests take about 4 min |
| Nothing is committed or pushed before review | This file is a plan; branches are created by the owner when each PR is cut |

The sections follow the order of the questions: what exists, how to cut it, in which order, what is in each piece, what is shared, what to check, what is undecided.

## 2. Context

State on 2026-10-12.

| Branch | State |
|---|---|
| `main` | Five product commits plus two devcontainer commits. A Next.js app with the chat feature (`features/chat`), the old shell (`components/layout/AppShell.tsx`, `app-sidebar/`), the routes under `app/(app)/`, the design system page, and MSW mocks for threads and runs only. No `.github/` before P0, no `justfile`, no pre-commit or commitlint configuration, although CONTRIBUTING describes them |
| `feat/fe/mock` | 56 commits ahead of the merge base `cd22abe`, the last twelve of them made on 2026-10-12 (the last two add this plan and `backend/.gitignore`): the side panel apart from the editor tabs, the console redesign, the text size tokens, flex rows instead of arbitrary grid columns, the CONTRIBUTING rule on bracket values. All screens of the frame with mocks. It lacks the two devcontainer commits of `main`, so a diff against `main` shows `.devcontainer/` as deleted; that is not a change of the branch |
| `feat/fe/workflow-review` | 29 commits, diverged from `feat/fe/mock` at `20c8e18`. Its own version of the workflow view, plus backend commits. See [open points](#8-open-points) |
| `feat/frontend/temp` | 5 commits: the backend port (147 files under `backend/`) and a redesign of the chat. `backend/` is untracked in the current checkout |
| `feat/fe/layout` | At `cd22abe`, no commits of its own; `main` has moved on to `33635d6` (the two devcontainer commits), so the branch is moved to `origin/main` before P3 is cut on it (a fast-forward) |

Size of the change against `main` (`frontend/`, `docs/`, `scripts/`), measured before the last ten commits and the lone `backend/.gitignore`: 416 files, 338 added, 50 modified, 23 deleted, 3 untracked. No dependency is added; `package.json` changes only the `lint` scripts. `src/api/generated/` holds only `.gitkeep`; every feature has hand-written `*.types.ts`. `backend/src/` has no Python files in this checkout, so no endpoint exists on a server: each one is exercised through the MSW mocks and follows `docs/API.md`.

What imports what, from the code:

- Features do not import each other. `src/app/` composes them: the project `layout.tsx` imports ten features, `review/[runId]/page.tsx` imports `artifacts`, `console` and `review`.
- The mocks do import each other, and that sets the order: `projects.handlers` <- `runs.handlers`; `threads.handlers` <- `projects.handlers` and `runs.handlers`; `artifacts.handlers` <- `runs.handlers` and `projects.handlers`; `messages.handlers` <- `runs.handlers`, `threads.handlers`, `mock-runs.store`; `interrupts.handlers`, `traceability.handlers`, `workflow-state.handlers` <- `artifacts.handlers` or `artifacts.fixtures`.
- `src/components/layout/` imports no feature.

## 3. Decisions

### D1. How to cut PRs out of the branch

| Option | Evaluation |
|---|---|
| a. Interactive rebase or cherry-pick of the 44 commits | Commits mix features: a docs commit covers three screens, later fixes touch earlier files. Conflicts at every step, and the result is squashed anyway |
| b. Path cut: a new branch from `origin/main`, then `git checkout feat/fe/mock -- <paths>` for the files of the slice, then fix the shared files by hunk | Predictable, because this plan lists the files. The cost is the shared files in section 6 |
| c. Rewrite each slice by hand | Slow, and it reintroduces bugs that the tests already cover |

Decision: b. Trade-off: the history of the 44 commits is not kept on `main`; with squash merge it would not be kept in any case. The branch `feat/fe/mock` stays as the source until the last PR merges. The work must be committed on it first (done, section 7), because `git checkout <branch> -- <path>` reads commits, not the working tree.

### D2. The old shell on main

The layout components are new files, so they can land without touching the old shell. The problem comes with the routes: `app/page.tsx` and `app/(home)/settings/page.tsx` of the new app have the same URLs as `app/(app)/page.tsx` and `app/(app)/settings/page.tsx`, and Next.js rejects two pages for one URL.

| Option | Evaluation |
|---|---|
| a. One PR "replace the shell" with layout, account, projects and a console placeholder | About 5000 lines, not reviewable |
| b. The layout PR is additive only; the PR of the project screens deletes `app/(app)/`, `AppShell.tsx` and `app-sidebar/`; the PR of the console deletes `features/chat/` and `tests/e2e/chat.spec.ts` | Each deletion goes with the file that replaces it. Between the project PR and the console PR, the console screen of a project is a placeholder, and `features/chat/` is unused code that still compiles |
| c. Keep the old shell until the end | Impossible while the URLs clash |

Decision: b.

### D3. Side panels of features that have not merged yet

Before 2026-10-12 the frame listed the six features in `activity-bar.config.ts` (a `ProjectFeature` union used by seven shared files) and `Workbench` (now `ProjectWorkspace`) took `sidePanels: Record<ProjectFeature, ReactNode>`.

| Option | Evaluation |
|---|---|
| a. The activity bar config lists only merged features; every feature PR adds its entry | `main` never shows a dead icon, but six PRs edit `activity-bar.config.ts`, the zod enum in `frame.store.ts` and their tests |
| b. The config lists all six from the layout PR; the project `layout.tsx` shows a placeholder (`EmptyState`, "Not built yet") for a panel whose feature has not merged, and each feature PR replaces its placeholder | The layout PR is final; each feature PR changes one entry of `layout.tsx`. `main` shows an icon with a placeholder for a while, which is acceptable because nothing is deployed |
| c. The frame names no feature: each feature describes its item (`FeatureActivity`: id, label, icon, start page, side panel) and the icons of its tabs in `<feature>-frame.config.tsx`, and the project `layout.tsx` passes the list to `Workbench` as `activities` and `tabIcons` | Shared code follows the import direction of CONTRIBUTING, with no feature names in it; `main` never shows a dead icon and needs no placeholder; each feature PR adds its frame config and one entry of `layout.tsx`. Feature ids become strings, checked at run time against the list |

Decision: c (2026-10-12, replacing b). A runtime registration (a hook that each feature calls) was rejected: the activity bar needs every item at its first render, also for features whose components are not mounted, so items would appear after hydration and in mount order.

### D4. Splitting the larger features

`artifacts` is 68 files and about 6400 lines (including the content schemas and fixtures); `console` is 46 files and about 3400 lines; the project slice is 56 files and about 3100 lines.

| Option | Evaluation |
|---|---|
| Artifacts in one PR | Too large to review |
| Artifacts in two PRs: read; edit, history, trace and export | Two hunk cuts, each PR about 3000 lines |
| Artifacts in four PRs by endpoint group: read; edit; history and trace; export | Smallest PRs; needs hunk cuts in `ItemPage.tsx`, `ArtifactDocument.tsx`, `artifacts.api.ts`, `artifacts.handlers.ts` and `layout.tsx` |

Decision: four PRs for artifacts (P8, P11, P12, P13); if the hunk cuts cost too much, join P11 to P13 into one. The project slice is two PRs: mocks (P5, 8 files, about 1400 lines, mostly fixtures) and screens (P6, 48 files, about 1700 lines). The console stays one PR with a reading order in section 5.

### D5. Where shared code goes

Shared code goes with its first consumer, so that no PR adds code that nothing uses. The exception is design tokens, which go with the layout because every later screen uses them. The table of first consumers is in section 6.

### D6. Order of the features

The order follows the imports of section 2 and avoids dead links:

1. `artifacts` (read) before `console`: the console mention list needs `GET /projects/{id}/items` and its fixtures, and the console links to items.
2. `console` before `review`: the review page embeds the console.
3. `review`, `workflow` and `traceability` after `artifacts`: their mocks read the artifact fixtures.
4. `search` after `artifacts` (read): a result opens an item page.
5. Settings last: they reuse the model and workflow definition handlers and the run configuration fields of each other.

### D7. Search in the command palette

The box of the top bar reads "Search or run a command", and section 1 of `docs/ui/skeletons.md` says it searches items and runs commands. The palette lists only the commands (show a side panel, open or create a project, the side panel and the theme) and filters them by name; items are searched in the Search side panel only.

| Option | Evaluation |
|---|---|
| a. Search while typing: inside a project, the palette asks `GET /projects/{id}/items` for the text and shows the results in a group "Items", next to the commands whose name matches | One box for everything, as in Linear or GitHub, with no syntax to learn. Commands and items share one list |
| b. Modes by prefix, as in VS Code: plain text searches items, `>` runs commands | Commands and items stay apart when the commands grow, but the user has to know the prefix |

Decision: a (2026-10-12). It is built with P10, which brings the search of the items.

## 4. PR sequence

Branch names are `<type>/fe/<name>`: `<type>` is the Conventional Commits type of the change (`feat` for a new feature, `chore` for tooling and CI, `docs` for documentation), and `fe` shows the scope. No issue number until issues exist.

| # | Branch | PR title | Depends on | Files | Changed lines |
|---|---|---|---|---|---|
| P0 | `chore/fe/ci` | `ci(frontend): run the checks on pull requests` | none | 2 | about 150 |
| P1 | `chore/fe/lint-groups` | `build(frontend): lint in groups of folders to bound memory` | none | 4 | about 130 |
| P2 | `docs/fe/api-fields` | `docs(api): add the fields that the screens read` | none | 5 | about 550 |
| P3 | `feat/fe/layout` | `feat(frontend): add the workbench: activity bar, project workspace, tabs, top bar, status bar and command palette` | none | 47 | about 2000 |
| P4 | `feat/fe/account` | `feat(frontend): add sign in, registration and the session` | P3 | 31 | about 1800 |
| P5 | `feat/fe/project-mocks` | `feat(mocks): serve projects and runs` | P4 | 8 | about 1400 |
| P6 | `feat/fe/projects` | `feat(frontend): add the project list and the project frame, and remove the old shell` | P3, P4, P5 | 48 | about 1700 |
| P7 | `feat/fe/threads` | `feat(frontend): read the threads of a project and show the run in the status bar` | P6 | 18 | about 800 |
| P8 | `feat/fe/artifacts-read` | `feat(frontend): read artifacts and items` | P6 | about 40 | about 3500 |
| P9 | `feat/fe/console` | `feat(frontend): add the console, its outline and commands, and remove the chat` | P7, P8 | 46 | about 3400 |
| P10 | `feat/fe/search` | `feat(frontend): search the items of a project` | P8 | 10 | about 300 |
| P11 | `feat/fe/item-edit` | `feat(frontend): edit an item` | P8 | about 6 | about 600 |
| P12 | `feat/fe/item-history` | `feat(frontend): show the revisions and the trace of an item` | P8 | about 8 | about 900 |
| P13 | `feat/fe/export` | `feat(frontend): export the artifacts of a project` | P8, P9 | about 6 | about 500 |
| P14 | `feat/fe/review` | `feat(frontend): review a run at a checkpoint` | P8, P9 | 17 | about 1500 |
| P15 | `feat/fe/workflow` | `feat(frontend): show the workflow of a run, its steps and its state` | P7, P8 | about 35 | about 2400 |
| P16 | `feat/fe/traceability` | `feat(frontend): add the traceability matrix, gaps and issues` | P8 | 21 | about 900 |
| P17 | `feat/fe/project-settings` | `feat(frontend): add the settings of a project` | P6, P15 | 26 | about 1300 |
| P18 | `feat/fe/user-settings` | `feat(frontend): add the settings of the user` | P4, P17 | 25 | about 1800 |

P0, P1 and P2 do not depend on anything and can be open at the same time as P3. File counts and line counts are measured on the branch (files added, modified or deleted against `main`); the artifacts rows are estimates because the slice is cut by hunks.

## 5. PR details

Paths are under `frontend/` unless they start with `docs/` or `.github/`. `ls` of a slice: `git diff --name-only origin/main feat/fe/mock -- <paths>` after the cut.

### P0. CI for the frontend

State: draft PR #9 from `chore/fe/ci`.

Files: `.github/workflows/frontend-ci.yml` (workflow "Frontend CI") and `.github/pull_request_template.md` (the fields and the definition of done of CONTRIBUTING).

| Job | What it does |
|---|---|
| `Changed files` | On a pull request, reads the changed files from the API and answers whether `frontend/`, `.nvmrc` or the workflow changed. On a push or a manual run it answers yes |
| `Checks` | In order: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`. Skipped when the frontend did not change |
| `E2E` | `pnpm exec playwright install --with-deps chromium`, then `pnpm e2e` (`next dev` with the mocks on port 3100; in CI, 2 retries and the `github` reporter). Uploads `test-results` (traces and error context) when it fails, because the `github` reporter writes no HTML report. Skipped when the frontend did not change |
| `Frontend CI result` | Always runs; fails when a job above failed or was cancelled, passes when they passed or were skipped |

| Item | Choice |
|---|---|
| Trigger | Every `pull_request`; `push` to `main` with `paths: [frontend/**, .nvmrc, .github/workflows/frontend-ci.yml]`; `workflow_dispatch` |
| Actions | `actions/checkout@v7`, `pnpm/action-setup@v6` (pnpm from `packageManager`), `actions/setup-node@v7` (Node from `.nvmrc`, pnpm store cached on `frontend/pnpm-lock.yaml`), `actions/upload-artifact@v7` |
| Hygiene | `permissions: contents: read` (and `pull-requests: read` for `Changed files`), `persist-credentials: false`, `concurrency` that cancels the older runs of a pull request but not those of `main`, `timeout-minutes` on each job, Next.js telemetry off |

Required check: the ruleset `protect-main` of `main` requires `Frontend CI result`, reported by GitHub Actions, with no bypass (added on 2026-10-12). A workflow skipped by a `paths` filter never reports and leaves a required check pending, so pull requests are filtered by the `Changed files` job instead: a pull request that changes nothing under `frontend/` skips `Checks` and `E2E` and merges normally. A branch cut from `main` before P0 merges has no workflow, so its pull request is blocked until the branch is rebased on `main`.

`main` before P0, run on 2026-10-12 (`origin/main` at `33635d6`, extracted with `git archive` into a scratch directory, one step at a time): typecheck, lint (about 950 MB RSS), format check, unit tests (18 passed) and build pass. `chat.spec.ts` passes 5 of 5 on a warm dev server; on a cold one the first tests time out while their routes compile, which the CI retries cover. The workflow passes `actionlint` 1.7.12.

First run, on PR #9 (2026-10-12): the four jobs pass in about 2 minutes, `Checks` and `E2E` in about 1.5 minutes each; `chat.spec.ts` passes 5 of 5 without a retry, and the pull request shows the required check as passed.

Out of scope for P0: the backend workflow, the codegen check from CONTRIBUTING (the backend has no routes yet), commitlint, a check of the PR title (for example `amannn/action-semantic-pull-request`, a one-file addition if wanted).

### P1. Tooling

Files: `scripts/lint.mjs` (new: lints four groups of folders in separate processes, each with its own TypeScript program), `eslint.config.js` (only the `parserOptions` switch on `ESLINT_TSCONFIG`), `package.json` (the `lint` and `lint:fix` scripts), `next.config.ts` (`allowedDevOrigins`, `devIndicators`, `turbopackSourceMaps: false`).

Held back for other PRs: the storage rule of `eslint.config.js` goes with P3 (its target `browser-storage.utils.ts` lands there); `.prettierignore` (`src/mocks/data`) goes with P8; `src/env.d.ts` and `.env.example` (trace address) go with P15.

Check: `pnpm lint` (about 100 s, about 1.4 GB); `pnpm lint:fix` still works.

### P2. API documentation

Files: `docs/API.md` (`unfinished_run_counts` on a project, `active_run_status` on a thread, `number` and `step_count` on a run, example ids), `docs/DATA_SHAPE.md`, `docs/PLANNING.md`, `docs/architecture/database.dbml`, `docs/architecture/diagrams/database/conversation-and-execution.svg`.

The `svg` is rendered from the `dbml` (`pnpm install`, then `pnpm render` in `scripts/db-diagram/`); do not edit it by hand. The fields come first because P5 to P7 read them.

### P3. The frame (layout components)

The first PR of the product, as planned. It is additive: nothing on `main` imports it until P6, so it is reviewed from its tests and from the dev server.

| Group | Files |
|---|---|
| Frame | `src/components/layout/`, by region: the root (`Workbench.tsx`, `ProjectWorkspace.tsx`, `StoredPanel.tsx`, `frame.store.ts`, `path.utils.ts`, `hooks/useFrameHydrated.ts`, `index.ts`), `activity-bar/` (`ActivityBar.tsx`, `ActivitiesContext.tsx`, `activity.types.ts`, `activity.utils.ts`, `hooks/useSideFeature.ts`, `hooks/usePinSideFeature.ts`), `side-panel/` (`SidePanel.tsx`, `SidePanelSection.tsx`), `editor/` (`EditorTabs.tsx`, `EditorWithPanel.tsx`, `editor-tabs.store.ts`, `hooks/useEditorTab.ts`), `top-bar/` (`TopBar.tsx`, `PageCrumb.tsx`), `status-bar/` (`StatusBar.tsx`), `command-palette/` (`CommandPalette.tsx`, `FeatureCommands.tsx`, `command-palette.store.ts`, `command-registry.store.ts`, `command.types.ts`, `command.utils.ts`, `hooks/useCommands.ts`) |
| Unit tests | In the `__tests__/` folder of each region: ProjectWorkspace, `path.utils`; ActivityBar, `activity.utils`; SidePanelSection; EditorTabs, EditorWithPanel, `editor-tabs.store`; TopBar; StatusBar; CommandPalette, `command.utils`, and `useCommands` in `command-palette/hooks/__tests__/` |
| Needed by the frame | `src/hooks/useHotkey.ts` and its test, `src/lib/browser-storage.utils.ts` and its test, `src/components/ui/resizable.tsx`, `src/components/ui/surface.tsx`, `src/test/TestProviders.tsx`, `src/test/next-mocks.utils.ts`, the browser stubs of `src/test/vitest.setup.ts` (hunk: ResizeObserver, matchMedia, scrollIntoView; the pointer capture stub waits for the first test with a select), the storage rule, the `<subject>.config.tsx` naming rule the patterns against relative imports across features and shared code, and the patterns that make `@/components/layout` the only way into the frame, in `eslint.config.js` (hunks), with the naming row and the import lines of CONTRIBUTING |
| Design tokens | `src/app/styles.css`: `text-2xs`, `text-3xs`, `text-4xs`, the `editor-text` and `caret-block` utilities. The design system files that use the tokens (`Sample.tsx`, `CodeCard.tsx`, `WorkspaceCard.tsx`, `OverlaysCard.tsx`, `AlertsCard.tsx`, `ChatCard.tsx`); `GraphCard.tsx` and `design-system.fixtures.ts` use the graph tones and go with P15. The CONTRIBUTING rule on bracket values and the token line of `frontend/README.md` |
| Docs | Section 1 (Frame) of `docs/ui/skeletons.md` |

Not in P3: the deletion of `AppShell.tsx` and `app-sidebar/` (P6, decision D2).

The logo of `TopBar.tsx` links to `/`, which exists on `main`; from P6, `/` redirects to `/projects`.

No e2e spec: every test of `frame.spec.ts` opens a project page and needs the mocks, the routes and the features. Its tests go with the PR that brings the last thing they need: Ctrl+K and the run on the status bar with P9, Ctrl+B with P10, the activity bar and the tabs with the review with P15.

Check: `pnpm test src/components/layout src/hooks src/lib`, a look at `/design-system`.

### P4. Account

Endpoints: `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET /me`, and from `me.handlers.ts` `GET /me/settings` and `PUT /me/settings` (read by the new project form in P6, written by P18).

| Group | Files |
|---|---|
| Feature | `src/features/account/` (api, types, `AuthCard`, `LoginPage`, `RegisterPage`, `UserMenu`, `useMe`, tests) |
| Routes | `src/app/(auth)/layout.tsx`, `login/page.tsx`, `register/page.tsx` |
| Shared code | `src/lib/api-fetch.utils.ts`, `src/lib/auth-redirect.utils.ts` and their tests, `src/lib/query-client.config.ts` (a 401 goes to sign in, no retry for 4xx) |
| Mock infrastructure | `src/mocks/mock-db.utils.ts`, `mock-ids.constants.ts`, `pagination.utils.ts`, `problem.utils.ts`, `mock-scenario.utils.ts`, `msw-browser.setup.ts`, `msw-server.setup.ts`, `auth.handlers.ts`, `me.handlers.ts`, `me.fixtures.ts`, `__tests__/auth.handlers.test.ts`, `README.md` (mock scenarios), and the `resetMockData` hunk of `src/test/vitest.setup.ts` |
| E2E | `tests/e2e/account.spec.ts` |

### P5. Mocks of projects and runs

Endpoints: `GET /projects` (paged, filter by status), `POST /projects`, `GET /projects/{id}`, `PATCH /projects/{id}` (no caller until P17), `GET /threads/{id}/runs`, `GET /runs/{id}`, `GET /runs/{id}/steps`, `POST /runs/{id}/cancel`.

Files: `src/mocks/projects.handlers.ts`, `projects.fixtures.ts`, `extra-projects.fixtures.ts`, `extra-project-specs.constants.ts`, `runs.handlers.ts`, `runs.fixtures.ts`, `mock-runs.store.ts`, `__tests__/extra-projects.fixtures.test.ts`. They are one PR because `projects.handlers` reads the runs for the unfinished counts. Review as data: the fixtures are the project of the API examples plus generated projects.

### P6. Project list and project frame

Endpoints read: `GET /projects` (all pages, by status), `POST /projects`, `GET /projects/{id}`, `GET /me/settings` (defaults of a new project).

| Group | Files |
|---|---|
| Feature | `src/features/projects/` (list, table, run cell, pending review badge, gate, switcher, commands, new project dialog and form, store, hooks, tests) |
| Routes | `src/app/page.tsx`, `src/app/(home)/layout.tsx`, `(home)/projects/page.tsx`, `(home)/error.tsx` (renamed from `(app)/error.tsx`), `src/app/(project)/projects/[projectId]/layout.tsx`, `error.tsx`, `page.tsx` |
| Shared code | `src/components/state/*` (compact size), `src/lib/relative-time.utils.ts`, `src/lib/run-status.constants.ts`, `src/hooks/useNow.ts`, with their tests |
| Removed | `src/app/(app)/` (4 files), `components/layout/AppShell.tsx`, `components/layout/app-sidebar/` (4 files) |
| E2E and docs | `tests/e2e/projects.spec.ts`, section 2 of `docs/ui/skeletons.md` |

The project `layout.tsx` is cut for this PR: the frame with an empty list of activities (decision D3), so no side panel yet, the top bar and the status bar. Its `page.tsx` redirects to the console address written in place until P9 brings `consoleHref`. The run status of the status bar is a placeholder until P7; `ThemeSync` and `ThemeCommands` are added by P18.

### P7. Threads and the run status

Endpoints: `GET /projects/{id}/threads`, `POST /projects/{id}/threads` (used by P9), `GET /threads`, `GET /threads/{id}`, `GET /threads/{id}/runs`, `GET /runs/{id}`, `GET /runs/{id}/steps`.

Files: `src/features/threads/` (api, types, utils, `ProjectRunStatus`, hooks, tests), `src/mocks/threads.handlers.ts`, `threads.fixtures.ts`. `components/ThreadList.tsx` and its test are no longer rendered anywhere; drop them in this PR unless the owner wants the list back. The layout hunk fills the status bar.

### P8. Artifacts, read

Endpoints: `GET /artifact-kinds`, `GET /workflow/definition`, `GET /content-schemas/{kind}/{version}`, `GET /projects/{id}/artifacts`, `GET /artifacts/{id}`, `GET /artifacts/{id}/items`, `GET /items/{id}`, `GET /projects/{id}/items` (search by text and kind; also read by P9, P10 and P16). `GET /workflow/definition` is served from `artifacts.handlers.ts` and read again by P15, P17 and P18.

| Group | Files |
|---|---|
| Feature | `src/features/artifacts/`: `artifacts.api.ts`, types, keys, `artifact-links.utils.ts`, `field-view.utils.ts`, `kinds.utils.ts`, hooks (`useArtifact`, `useArtifactItems`, `useArtifactKinds`, `useDefinitionSummary`, `useItem`, `useItemSchema`, `useProjectArtifacts`, `useValueOptions`), components (`ArtifactTree`, `ArtifactDocument`, `ArtifactPanel`, `FieldValue`, `ItemLink`, `ItemOpenContext`, `ItemPage`, `ReviewStatusBadge`) and their tests, `artifacts-frame.config.tsx` without the export action, and its entry in the project `layout.tsx` |
| Routes | `artifacts/page.tsx`, `artifacts/[artifactId]/page.tsx`, `artifacts/items/[itemId]/page.tsx` |
| Mocks | `artifact-kinds.handlers.ts`, `artifact-kinds.fixtures.ts`, `artifacts.handlers.ts` (read part), `artifacts.fixtures.ts`, `mentor-artifacts.fixtures.ts`, `artifact-builder.utils.ts`, `mock-artifacts.store.ts`, `src/mocks/data/content-schemas/`, `src/mocks/data/workflow/`, `__tests__/artifact-kinds.fixtures.test.ts`, the `src/mocks/data` line of `.prettierignore` |
| E2E and docs | the read part of `tests/e2e/artifacts.spec.ts`, sections 5 and 6 of `docs/ui/skeletons.md` |

`GET /artifacts/{id}/revisions` is mocked but no screen calls it; leave it out of the PR.

### P9. Console

Endpoints: `GET /threads/{id}/messages`, `POST /threads/{id}/messages`, `POST /projects/{id}/threads`, `GET /threads/{id}/runs`, `GET /runs/{id}/steps`, `GET /runs/{id}/stream` (event stream), `POST /runs/{id}/cancel`, `POST /runs/{id}/retry`, `GET /runs/{id}/interrupts?status=pending`, `GET /projects/{id}/items` (mentions).

| Group | Files |
|---|---|
| Feature | `src/features/console/`: api, types, keys, `commands.constants.ts`, `command-history.store.ts`, `event-log.utils.ts`, `event-scroll.utils.ts`, `input.utils.ts`, `run-events.reducer.ts` (replaces the reducer of `chat`), hooks (`useConsoleActions`, `useConsoleThread`, `useEventLog`, `useMentionItems`, `usePendingReview`, `useRunStream`), components (`Console`, `ConsolePage`, `ConsoleInput`, `ConsoleNavigator`, `ConsoleOutline`, `EventLine`, `EventRow`, `ReviewLine`, `RunWatcher`), tests, `console-frame.config.tsx` and its entry in the project `layout.tsx` (with the review badge of `projects`) |
| Routes | `console/page.tsx`, `console/[threadId]/page.tsx` |
| Mocks | `messages.handlers.ts`, `messages.fixtures.ts`, `run-stream.handlers.ts` |
| Removed | `src/features/chat/` (8 files deleted, its tests included; `useRunStream.ts` moves to `console/hooks/useRunStream.ts`), `tests/e2e/chat.spec.ts` |
| E2E and docs | `tests/e2e/console.spec.ts`, section 3 of `docs/ui/skeletons.md` |

Held back, to be added by the PR that owns the target: the `/export` command (P13), the `/run-settings` command (P17) and the link to a review (P14), all in `Console.tsx` and `commands.constants.ts`.

Suggested reading order: `event-log.utils.ts` and `run-events.reducer.ts` (the model), then `useRunStream.ts`, `Console.tsx`, the row components, then `ConsoleInput.tsx` and `input.utils.ts`, last the tests.

### P10. Search

Endpoint: `GET /projects/{id}/items` with the query. Files: `src/features/search/` (api, types, utils, `useItemSearch`, `SearchPanel`, tests), `search/page.tsx`, `tests/e2e/search.spec.ts`, `search-frame.config.tsx` and the Search entry of `layout.tsx`.

Search in the command palette (decision D7). Not built yet: build it on `feat/fe/mock` before the cut.

- `command-palette.store.ts` keeps the text typed (`query`); `CommandPalette` reads it into its input and clears it when the palette closes. These are hunks of P3 files.
- The search feature adds `ItemCommands`, passed by the project `layout.tsx` in `commands`. From `MIN_QUERY_LENGTH` (2) characters, it calls `useItemSearch` with the deferred text, so the cache is shared with the side panel, and registers the first results with `useCommands` in a group "Items", each with its key and its title. The server already matched them, so they stay in the list whatever the filter of the palette says: `Command` gets a field for that, which the palette passes to `forceMount` of `CommandItem`. A command without `run` shows while the search runs and when it fails.
- Enter on an item closes the palette and opens the page of the item, which opens its tab.
- The description of the palette names items too.
- Tests: a unit test of `ItemCommands`, and a case of `search.spec.ts`: Ctrl+K, type the key of an item, Enter opens its tab.

### P11. Edit an item

Endpoint: `PATCH /items/{id}`. Files: `ItemForm.tsx`, `FieldInput.tsx`, `hooks/useItemMutations.ts` (edit part), the edit hunks of `ItemPage.tsx`, `artifacts.api.ts`, `artifacts.handlers.ts`, the edit part of `artifacts.spec.ts`.

### P12. Revisions and trace of an item

Endpoints: `GET /items/{id}/revisions`, `POST /items/{id}/restore`, `GET /items/{id}/trace?direction=both&depth=1`. Files: `ItemPanel.tsx`, `hooks/useItemRevisions.ts`, `hooks/useItemTrace.ts`, the restore part of `useItemMutations.ts`, the matching hunks of `ItemPage.tsx`, `artifacts.api.ts`, `artifacts.handlers.ts`, `artifacts.spec.ts`.

### P13. Export

Endpoints: `POST /projects/{id}/exports`, `GET /projects/{id}/exports`, `GET /exports/{id}`, `GET /exports/{id}/file`. Files: `ExportButton.tsx` and its test, the export hunks of `artifacts.api.ts` and `artifacts.handlers.ts`, the export action of the side panel in `artifacts-frame.config.tsx`, the `/export` command of the console, the export part of `artifacts.spec.ts`.

### P14. Review

Endpoints: `GET /runs/{id}/interrupts?status=pending`, `POST /runs/{id}/resume`, `GET /artifacts/{id}/items`.

Files: `src/features/review/` (api, types, `review-form.utils.ts`, hooks, `ChoiceList`, `QuestionField`, `ReviewCard`, `ReviewPage`, tests), `review/[runId]/page.tsx` (composes `ArtifactPanel`, `ConsolePage` and `ReviewPage`), `review-frame.config.tsx` with the `paths` and the tab icon it adds in the project `layout.tsx`, `src/mocks/interrupts.handlers.ts`, the review link of the console, `tests/e2e/review.spec.ts`, section 4 of `docs/ui/skeletons.md`.

### P15. Workflow

Endpoints: `GET /workflow/definition?version=`, `GET /projects/{id}/threads`, `GET /threads/{id}/runs`, `GET /runs/{id}/steps`, `GET /runs/{id}/state`, `GET /runs/{id}/steps/{stepId}/state`, `POST /runs/{id}/retry` (from a step).

| Group | Files |
|---|---|
| Feature | `src/features/workflow/`: api, types, `graph-layout.utils.ts`, `run-progress.utils.ts`, `step-groups.utils.ts`, `workflow-links.utils.ts`, hooks, components (`RunPage`, `RunTree`, `WorkflowGraph`, `WorkflowHome`, `StepPanel`, `StatePanel`), tests, `workflow-frame.config.tsx` and its entry in the project `layout.tsx` |
| Routes | `workflow/page.tsx`, `workflow/[runId]/page.tsx` |
| Mocks | `workflow-state.handlers.ts` |
| Shared code | `src/components/ui/edge.tsx`, `node.tsx`, `src/lib/tone.constants.ts` and its test (graph tones), `GraphCard.tsx` and `design-system.fixtures.ts`, `src/env.d.ts` and `.env.example` (`NEXT_PUBLIC_TRACE_URL`) |
| E2E and docs | `tests/e2e/workflow.spec.ts`, section 7 of `docs/ui/skeletons.md` |

### P16. Traceability

Endpoints: `GET /projects/{id}/traceability/matrix`, `GET /projects/{id}/traceability/coverage`, `GET /projects/{id}/trace-links`, `GET /projects/{id}/items`.

Files: `src/features/traceability/` (api, types, `issues.utils.ts`, `matrix-filter.utils.ts`, `traceability-links.utils.ts`, `issue-kinds.constants.ts`, hooks, `MatrixView`, `IssuesView`, `ItemRefLinks`, `TraceabilityNav`, `TraceabilityPage`, tests, `traceability-frame.config.tsx`), its entry in the project `layout.tsx`, `traceability/page.tsx`, `traceability.handlers.ts`, `tests/e2e/traceability.spec.ts`, section 8 of `docs/ui/skeletons.md`.

### P17. Settings of a project

Endpoints: `GET /projects/{id}`, `PATCH /projects/{id}`, `GET /models`, `GET /workflow/definition`.

Files: `src/features/project-settings/` (api, types, `section.utils.ts`, `form-errors.utils.ts`, `settings-links.utils.ts`, hooks, `GeneralForm`, `RunsForm`, `ModelsForm`, `SaveBar`, `SettingsNav`, `SettingsPage`, tests, `project-settings-frame.config.tsx`), its entry in the project `layout.tsx`, `src/components/run-config/` (shared with P18), `settings/page.tsx`, `src/mocks/models.handlers.ts`, `models.fixtures.ts`, the `/run-settings` command of the console, `tests/e2e/project-settings.spec.ts`, section 9 of `docs/ui/skeletons.md`.

### P18. Settings of the user

Endpoints: `GET /me`, `PATCH /me`, `POST /me/password`, `GET /me/sessions`, `DELETE /me/sessions/{id}`, `GET /me/model-settings`, `PUT /me/model-settings`, `GET /me/usage?group_by=`, `GET /me/settings`, `PUT /me/settings`, `GET /models`, `GET /workflow/definition`.

Files: `src/features/settings/` (api, types, store, `section.utils.ts`, `form-errors.utils.ts`, hooks, `ProfileForm`, `PasswordForm`, `PreferencesForm`, `ModelChoicesForm`, `SessionsList`, `UsageView`, `ThemeSync`, `ThemeCommands`, `SaveBar`, `UserSettingsPage`, tests), `src/app/(home)/settings/page.tsx`, the `ThemeSync` and `ThemeCommands` lines of the two layouts, `src/mocks/account.handlers.ts`, `account.fixtures.ts`, `tests/e2e/user-settings.spec.ts`, section 10 of `docs/ui/skeletons.md`.

## 6. Files that several PRs touch

These cannot be copied whole with `git checkout feat/fe/mock -- <path>`: the branch version holds the final state. Take the file, then remove the hunks of later PRs (`git checkout -p`, or edit), and add the rest in the PR that owns it.

| File | Touched by | What each PR adds |
|---|---|---|
| `docs/ui/skeletons.md` | P3, P6, P8, P9, P14, P15, P16, P17, P18 | One numbered section per screen (1 Frame, 2 Project list, 3 Console, 4 Review, 5 and 6 Artifacts, 7 Workflow, 8 Traceability, 9 Project settings, 10 User settings) and its entries in the contents and open points |
| `frontend/README.md`, `frontend/src/mocks/README.md` | P3 to P18 | The tokens line (P3); the mock scenario addresses of a screen when the screen is built |
| `src/app/(project)/projects/[projectId]/layout.tsx` | P6, P7, P8, P10, P13, P14, P15, P16, P17, P18 | P6: the frame with no activity. Then one activity and its tab icons per feature (D3), the status bar run (P7), `ThemeSync` and `ThemeCommands` (P18) |
| `src/mocks/msw-browser.setup.ts`, `msw-server.setup.ts` | P4 to P18 | One import and one entry per handler group |
| `src/components/layout/command-palette/CommandPalette.tsx`, `command-palette.store.ts` | P3, P10 | P3: the palette. P10: the text typed, kept in the store for the item search (D7) |
| `src/test/vitest.setup.ts` | P3, P4, first test with a select | P3: browser stubs. P4: `resetMockData`. The pointer capture stub with the first test that opens a select |
| `tests/e2e/frame.spec.ts` | P9, P10, P15 | P9: Ctrl+K and the run on the status bar. P10: Ctrl+B. P15: the activity bar and the tabs with the review |
| `src/features/console/components/Console.tsx`, `commands.constants.ts` | P9, P13, P14, P17 | P9: the base commands. Later: `/export`, the review link, `/run-settings` |
| `src/features/artifacts/artifacts.api.ts`, `src/mocks/artifacts.handlers.ts`, `tests/e2e/artifacts.spec.ts`, `ItemPage.tsx` | P8, P11, P12, P13 | The calls, handlers, tests and view parts of each endpoint group |
| `eslint.config.js`, `.prettierignore`, `src/env.d.ts`, `.env.example` | P1, P3, P8, P15 | See P1 |

Mock handlers shared by features: `GET /workflow/definition` and `GET /projects/{id}/items` are in `artifacts.handlers.ts` (first consumer P8); `GET /models` is in `models.handlers.ts` (first consumer P17, again in P18); `POST /runs/{id}/retry` is in `messages.handlers.ts` (P9, again in P15). A handler is written once in the PR of its first consumer and is not moved afterwards.

First consumer of shared code:

| Code | PR |
|---|---|
| `lib/api-fetch.utils`, `lib/auth-redirect.utils`, `lib/query-client.config` | P4 |
| `lib/browser-storage.utils`, `hooks/useHotkey`, `components/ui/resizable`, `test/TestProviders`, `test/next-mocks.utils` | P3 |
| `lib/relative-time.utils`, `lib/run-status.constants`, `hooks/useNow`, `components/state/*` | P6 |
| `components/ui/edge`, `components/ui/node`, `lib/tone.constants` | P15 |
| `components/run-config` | P17 |

## 7. Before cutting a PR

Once, before P0 and P3:

1. Done: the work that was uncommitted (the side panel decoupling, the tokens, the flex rows, the CONTRIBUTING and README lines) is committed on `feat/fe/mock`. Review those commits before the first cut, because the path cut copies them.
2. Done on 2026-10-12: the e2e specs that the side panel change touched (`frame`, `console`, `projects`, `search`) pass, run one at a time with one worker. On a cold dev server three tests timed out while their routes compiled (the first test of `console`, the first two of `projects`) and passed on a second run. `pnpm build` failed on `/settings`, because `UserSettingsPage` reads `useSearchParams()` outside a `Suspense` boundary and the route is prerendered; `src/app/(home)/settings/page.tsx` now wraps it, the build passes, and `user-settings.spec.ts` passes. The fix belongs to P18 and must be committed on `feat/fe/mock` before that cut. The first build peaked at about 1.9 GB RSS (Turbopack is outside the Node heap limit) and took about 3 minutes; a build with the cache takes about 1 minute.
3. Decide the points of section 8.

For every PR:

1. `git fetch`, then `git switch --no-track -c <branch> origin/main` (without `--no-track` the branch tracks `main`). Never merge `main` into the branch; rebase it.
2. `git checkout feat/fe/mock -- <paths of the slice>`, then cut the shared files of section 6.
3. Run the checks one at a time, in this order, stopping the dev server first: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, the unit tests of the slice (`pnpm test <folder>`; the full `pnpm test` before opening the PR), `pnpm build`, the e2e spec of the slice (`pnpm e2e tests/e2e/<spec>`; needs `pnpm e2e:install` once).
4. Open the screens of the slice with `pnpm dev:mock` and the addresses of `src/mocks/README.md`.
5. Search the diff for what must not be there: a leftover `console.log`, a bracket value such as `text-[0.625rem]`, a hardcoded color, a route or import that belongs to a later PR, a non-ASCII character in prose (`grep -nP '[^\x00-\x7F]' <file>`).
6. One-line commit message in Conventional Commits form, no AI attribution; the PR title is the squash commit. Open the PR as a draft first.
7. After the merge: `git switch main`, pull, delete the branch, and start the next slice from the new `main`.

## 8. Open points

| Point | Options | Leaning |
|---|---|---|
| `feat/fe/workflow-review` | It holds a second workflow view (graph spacing, steps grouped by subject, state of a node) and backend commits such as "number a retried run after the last run of its thread". Take nothing, take the graph fixes into P15, or merge the branch line first | Compare its `WorkflowGraph` and `step-groups` with the branch of this plan before P15; the backend commits belong with the backend port |
| Types written by hand | Keep until the backend publishes `openapi.json`, then replace with the generated client in a PR of its own | Keep; the generated folder is empty |
| `GET /artifacts/{id}/revisions` mock without a caller | Drop it or keep it for a later screen | Drop from P8 |
| Required status checks | Decided: `Frontend CI result` is required by the ruleset `protect-main`; pull requests that do not change the frontend skip the checks (see P0) | Done |
| Issue numbers for the branch names | Decided: no issue number; branches are `<type>/fe/<name>` (section 4) | Done |
| E2E in CI before all specs exist | Run only the specs of merged features (each PR brings its spec) | Run all; each PR adds its own |
| `features/agents/.gitkeep` | An empty folder with no code | Leave alone |

## 9. Checklist

- [x] Uncommitted work committed on `feat/fe/mock` (to be reviewed)
- [x] E2E specs of the side panel change and `pnpm build` run on `feat/fe/mock`; the `/settings` build fix to be committed
- [ ] Section 8 decided (at least the workflow-review line)
- [x] `main` run through the five checks in a scratch directory
- [x] `Frontend CI result` required on `main` (ruleset `protect-main`)
- [ ] P0 CI merged
- [ ] P1 tooling merged
- [ ] P2 API docs merged
- [ ] P3 frame merged
- [ ] P4 account merged
- [ ] P5 project and run mocks merged
- [ ] P6 projects merged, old shell removed
- [ ] P7 threads merged
- [ ] P8 artifacts (read) merged
- [ ] P9 console merged, chat removed
- [ ] P10 search merged
- [ ] P11 item edit merged
- [ ] P12 item revisions and trace merged
- [ ] P13 export merged
- [ ] P14 review merged
- [ ] P15 workflow merged
- [ ] P16 traceability merged
- [ ] P17 project settings merged
- [ ] P18 user settings merged
- [ ] `feat/fe/mock` has no file left that `main` lacks (`git diff --stat origin/main feat/fe/mock`); then delete it
