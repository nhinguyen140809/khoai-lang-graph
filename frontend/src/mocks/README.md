# Mock scenarios

The addresses that show each state of each screen with `pnpm dev:mock`. Start the dev server with mocks from `frontend/` and open the links:

```bash
pnpm dev:mock
```

How the mocks work (fixtures, handlers, adding an endpoint) is in [Mock data](../../README.md#mock-data). Add the addresses of a screen here when the screen is built, and its states to the screenshots, see [Screenshots](../../README.md#screenshots).

## Contents

- [Mock scenarios](#mock-scenarios)
  - [Contents](#contents)
  - [Mock data](#mock-data)
  - [Parameters](#parameters)
  - [Account](#account)
  - [Project list](#project-list)
  - [Other screens](#other-screens)
  - [Frame of a project](#frame-of-a-project)
  - [Development pages](#development-pages)

## Mock data

| Record                               | Id                                                                   | What it holds                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User "Linh Pham"                     | `11b70000-0000-4000-8000-000000000001`                               | The user of the API examples, `linh.pham@example.com`. The mock server logs in any email and password                                                                                                                                                                                                                                                     |
| Project "Mentor platform"            | `90aa0000-0000-4000-8000-000000000001`                               | The project of the API examples, an online platform where university students find mentors                                                                                                                                                                                                                                                                |
| Project "Campus food ordering"       | `90aa0000-0000-4000-8000-000000000002`                               | Finished runs only                                                                                                                                                                                                                                                                                                                                        |
| Project "Library booking"            | `90aa0000-0000-4000-8000-000000000003`                               | A running run, at the interviews                                                                                                                                                                                                                                                                                                                          |
| Project "Dorm laundry booking"       | `90aa0000-0000-4000-8000-000000000004`                               | Archived                                                                                                                                                                                                                                                                                                                                                  |
| Twelve more projects                 | `90aa0000-0000-4000-8000-0000000000NN`, NN from 05 to 16             | Each in one state of a run: done, waiting for review, running, failed, stopped, no run yet, or archived; two are in Vietnamese, and the running run of "Student club manager" (07) has cost $1.72 of its $2.00 limit. Each has one thread and at most one run, with its steps. They are generated from the specs in `generated-project-specs.fixtures.ts` |
| Thread "Main thread" of each project | `7f3a0000-0000-4000-8000-0000000000NN`, NN the number of its project | Every project has one thread; the mentor thread holds runs 1, 2 and 3 and four messages                                                                                                                                                                                                                                                                   |
| Run 3 of the mentor thread           | `5f2d0000-0000-4000-8000-000000000001`                               | The run of the API examples: it retries run 2 from its planner step and waits at the analysis review, step 67                                                                                                                                                                                                                                             |

A request with an `Idempotency-Key` header, such as sending a message, gets the first answer again when it repeats with the same key (`409 idempotency_conflict` with another body), and does not do its work twice.

Answering the review that run 3 waits for (`POST /runs/{run_id}/resume`) approves the analysis under review, or sends the run back to the stage of the option, and the run then has no review to wait for; add `?mock-reset` to any address to see the review waiting again.

A thread with a run that is not finished is not deleted (`409 invalid_state`); a deleted thread is left out of the lists and its endpoints answer 404, and `?mock-reset` brings it back.

A change of an artifact or an item needs the version it is based on in `If-Match` (`409 version_conflict` otherwise), checks the content against the schema of the kind (`422 validation_failed`), and answers `409 invalid_state` outside a review that allows edits: a change is accepted only while the run of the project waits at a review that lists the artifact, so by default only the requirements analysis changes, and `?mock-run-status=running` or `=done` refuses every change. Each change makes a new version, kept in the versions of the record; items that the user adds, moves or reorders get their number and depth again, and a deleted item leaves the lists but stays readable at its versions. Restoring an artifact gives it the content of that version, and each item of the artifact that has a revision of that number gets it back too, each as a new version.

The model catalog holds six models, and the user has chosen a model for the analyst and for the persona agent. A run that starts takes the models of the message, then of the project, then of the user, then the default of the server. The user has the password `correct-horse-7`, three active sessions and saved settings (a dark theme, runs of 60 steps at most), and a run takes its run settings from the request, then the project, then the user, then the server; a project created without a language takes the one of the settings. The mock server keeps the session, the user, the profile, the password, the revoked sessions and the settings that `PUT` saved, the model settings that `PUT` replaced, what `POST` creates (projects, threads, messages and the runs they start, and items), the projects that `PATCH` archived or restored and that `DELETE` deleted, the threads that `PATCH` changed and `DELETE` deleted, the runs that were stopped, and the artifacts and items that the user changed, in browser storage, so they survive a reload. A project created without a name takes the first words of its first message as its name, and a thread without a title its first words as its title, where the agents would name them. `GET /me/usage` sums the steps of the runs that started in a month, October 2026 by default, the month of the mock data; the budget is the $20 that the server gives a user without one of their own. Add `?mock-reset` to any address to start again from the fixtures, for example http://localhost:3000/login?mock-reset.

## Parameters

A parameter in the page address changes what a group of endpoints answers. Parameters can be combined, for example `?mock-threads=empty&mock-me=error`.

| Parameter                     | Values                                                                                                                                                      | Endpoints it changes                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `mock-projects`               | `empty`, `error`, `loading`, `many` (60 more projects, for a long list), `more-loading` (the long list of `many`, whose pages after the first never answer) | `GET /projects`                                                                                                               |
| `mock-project`                | `empty` (404), `error`, `loading`                                                                                                                           | `GET /projects/{project_id}`                                                                                                  |
| `mock-threads`                | `empty`, `error`, `loading`                                                                                                                                 | `GET /threads`, `GET /projects/{project_id}/threads`                                                                          |
| `mock-thread`                 | `empty` (404), `error`, `loading`                                                                                                                           | `GET /threads/{thread_id}`                                                                                                    |
| `mock-messages`               | `empty`, `error`, `loading`                                                                                                                                 | `GET /threads/{thread_id}/messages`                                                                                           |
| `mock-runs`                   | `empty` (no run, and no thread has one), `error`, `loading`                                                                                                 | `GET /threads/{thread_id}/runs`, `GET /runs/{run_id}`, `GET /runs/{run_id}/steps`                                             |
| `mock-run-status`             | `running`, `waiting` (default), `failed`, `done`                                                                                                            | The status of run 3 of the mentor thread, and of everything derived from it: the thread, the counts of the project            |
| `mock-run-state`              | `error`, `loading`                                                                                                                                          | `GET /runs/{run_id}/state`, `GET /runs/{run_id}/steps/{step_id}/state`                                                        |
| `mock-directives`             | `empty`, `error`, `loading`                                                                                                                                 | `GET /runs/{run_id}/directives`                                                                                               |
| `mock-interrupts`             | `empty`, `error`, `loading`                                                                                                                                 | `GET /runs/{run_id}/interrupts`                                                                                               |
| `mock-agent-questions`        | `only` (the pending interrupt asks questions and offers no options), `added` (a review with the questions added)                                            | The pending interrupt of a run                                                                                                |
| `mock-resume-run`             | `error`, `loading`                                                                                                                                          | `POST /runs/{run_id}/resume`                                                                                                  |
| `mock-retry-run`              | `error`, `loading`                                                                                                                                          | `POST /runs/{run_id}/retry`                                                                                                   |
| `mock-cancel-run`             | `error`, `loading`                                                                                                                                          | `POST /runs/{run_id}/cancel`                                                                                                  |
| `mock-me`                     | `empty` (404), `error`, `loading`                                                                                                                           | `GET /me`                                                                                                                     |
| `mock-update-me`              | `error`, `loading`                                                                                                                                          | `PATCH /me`                                                                                                                   |
| `mock-change-password`        | `error`, `loading`                                                                                                                                          | `POST /me/password`                                                                                                           |
| `mock-sessions`               | `empty`, `error`, `loading`                                                                                                                                 | `GET /me/sessions`                                                                                                            |
| `mock-revoke-session`         | `error`, `loading`                                                                                                                                          | `DELETE /me/sessions/{session_id}`                                                                                            |
| `mock-user-settings`          | `empty` (the default settings), `error`, `loading`                                                                                                          | `GET /me/settings`                                                                                                            |
| `mock-replace-user-settings`  | `error`, `loading`                                                                                                                                          | `PUT /me/settings`                                                                                                            |
| `mock-models`                 | `empty`, `error`, `loading`                                                                                                                                 | `GET /models`                                                                                                                 |
| `mock-model-settings`         | `empty`, `error`, `loading`                                                                                                                                 | `GET /me/model-settings`                                                                                                      |
| `mock-replace-model-settings` | `error`, `loading`                                                                                                                                          | `PUT /me/model-settings`                                                                                                      |
| `mock-usage`                  | `empty` (a month without usage), `error`, `loading`                                                                                                         | `GET /me/usage`                                                                                                               |
| `mock-budget`                 | `warning` (86% of the budget spent), `danger` (95%), `none` (no budget); the budget of the month shows on the status bar from 80%                           | `GET /me/usage`                                                                                                               |
| `mock-login`                  | `error` (401, wrong email or password), `loading`                                                                                                           | `POST /auth/login`                                                                                                            |
| `mock-register`               | `error` (422, the email has an account), `loading`                                                                                                          | `POST /auth/register`                                                                                                         |
| `mock-run-parameters`         | `all-types` (the run parameters of the docs, and a flag with a default, a flag without one and a choice)                                                    | `GET /workflow/definition`, the latest version                                                                                |
| `mock-create-project`         | `error`, `invalid` (422, the language of the documents is not taken), `loading`                                                                             | `POST /projects`                                                                                                              |
| `mock-update-project`         | `error`, `loading`                                                                                                                                          | `PATCH /projects/{project_id}`, which renames a project, archives it and restores it                                          |
| `mock-delete-project`         | `error`, `loading`                                                                                                                                          | `DELETE /projects/{project_id}`, which answers 409 for a project with a run that is not finished, such as the mentor platform |
| `mock-create-thread`          | `error`, `loading`                                                                                                                                          | `POST /projects/{project_id}/threads`                                                                                         |
| `mock-update-thread`          | `error`, `loading`                                                                                                                                          | `PATCH /threads/{thread_id}`, which renames a thread, archives it and makes it active again                                   |
| `mock-delete-thread`          | `error`, `loading`                                                                                                                                          | `DELETE /threads/{thread_id}`, which answers 409 for a thread with a run that is not finished, such as the mentor platform    |
| `mock-send-message`           | `error`, `loading`                                                                                                                                          | `POST /threads/{thread_id}/messages`, which sends a message of the user to a thread                                           |
| `mock-artifact-kinds`         | `empty` (no kind), `error`, `loading`                                                                                                                       | `GET /artifact-kinds`                                                                                                         |
| `mock-artifacts`              | `empty`, `error`, `loading`                                                                                                                                 | `GET /projects/{project_id}/artifacts`                                                                                        |
| `mock-artifact`               | `error`, `loading`                                                                                                                                          | `GET /artifacts/{artifact_id}`, its items and its versions                                                                    |
| `mock-items`                  | `empty`, `error`, `loading`                                                                                                                                 | `GET /projects/{project_id}/items`                                                                                            |
| `mock-item`                   | `empty` (404), `error`, `loading`                                                                                                                           | `GET /items/{item_id}`, its versions                                                                                          |
| `mock-update-artifact`        | `error`, `loading`                                                                                                                                          | `PATCH /artifacts/{artifact_id}`                                                                                              |
| `mock-restore-artifact`       | `error`, `loading`                                                                                                                                          | `POST /artifacts/{artifact_id}/restore`                                                                                       |
| `mock-create-item`            | `error`, `loading`                                                                                                                                          | `POST /artifacts/{artifact_id}/items`                                                                                         |
| `mock-reorder-items`          | `error`, `loading`                                                                                                                                          | `POST /artifacts/{artifact_id}/items/reorder`                                                                                 |
| `mock-update-item`            | `error`, `loading`                                                                                                                                          | `PATCH /items/{item_id}`                                                                                                      |
| `mock-delete-item`            | `error`, `loading`                                                                                                                                          | `DELETE /items/{item_id}`, which answers 409 for a section that still holds items                                             |
| `mock-move-item`              | `error`, `loading`                                                                                                                                          | `POST /items/{item_id}/move`                                                                                                  |
| `mock-restore-item`           | `error`, `loading`                                                                                                                                          | `POST /items/{item_id}/restore`                                                                                               |
| `mock-revisions`              | `error`, `loading`                                                                                                                                          | `GET /items/{item_id}/revisions`, `GET /artifacts/{artifact_id}/revisions`                                                    |
| `mock-traces`                 | `error`, `loading`                                                                                                                                          | `GET /items/{item_id}/trace`, `GET /artifacts/{artifact_id}/trace`                                                            |
| `mock-trace-links`            | `empty` (no link), `error`, `loading`                                                                                                                       | `GET /projects/{project_id}/trace-links`                                                                                      |
| `mock-create-trace-link`      | `error`, `loading`                                                                                                                                          | `POST /projects/{project_id}/trace-links`                                                                                     |
| `mock-delete-trace-link`      | `error`, `loading`                                                                                                                                          | `DELETE /trace-links/{link_id}`                                                                                               |
| `mock-traceability`           | `empty` (no row), `error`, `loading`                                                                                                                        | `GET /projects/{project_id}/traceability/matrix` and `/coverage`                                                              |
| `mock-exports`                | `empty` (no export), `error`, `loading`                                                                                                                     | `POST`, `GET /projects/{project_id}/exports`, `GET /exports/{export_id}`                                                      |
| `mock-reset`                  | none                                                                                                                                                        | Forgets the records the mock server kept                                                                                      |

`error` answers HTTP 500 and `loading` never answers, unless the table says otherwise.

## Account

| State                                                                     | Address                                                                          |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Sign-in page                                                              | http://localhost:3000/login                                                      |
| Sign-in page that returns to the settings                                 | http://localhost:3000/login?next=%2Fsettings                                     |
| Wrong email or password                                                   | http://localhost:3000/login?mock-login=error                                     |
| Logging in                                                                | Open http://localhost:3000/login?mock-login=loading and log in                   |
| Create an account                                                         | http://localhost:3000/register                                                   |
| The email has an account                                                  | http://localhost:3000/register?mock-register=error                               |
| Registering                                                               | Open http://localhost:3000/register?mock-register=loading and create the account |
| The account is created, but logging in fails: the login page with a toast | Open http://localhost:3000/register?mock-login=error and create the account      |
| Logged out: every other page goes to the login page                       | Choose Log out in the account menu, then open http://localhost:3000/projects     |
| Account menu loading                                                      | http://localhost:3000/projects?mock-me=loading                                   |
| Account menu error                                                        | http://localhost:3000/projects?mock-me=error                                     |

## Documents

The documents of the mentor platform are at `/projects/90aa0000-0000-4000-8000-000000000001/documents`; open one from the side panel of Documents.

| State                                              | Address                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| The documents, the analysis waiting for the review | `/projects/90aa0000-0000-4000-8000-000000000001/documents`                       |
| Loading the documents                              | the same page with `?mock-artifacts=loading`                                     |
| The documents fail to load                         | the same page with `?mock-artifacts=error`                                       |
| No document, no unfinished run                     | the same page with `?mock-artifacts=empty&mock-run-status=done`                  |
| No document yet, every kind not started            | the same page with `?mock-artifacts=empty&mock-run-status=running`               |
| A document being written                           | the same page with `?mock-run-status=running`; its stream sends `artifact_delta` |
| The outline or the document fails to load          | a document page with `?mock-artifact=error`                                      |
| The edit form of the requirements analysis         | open AR-001 of the analysis and press Edit                                       |
| Save pending                                       | the edit form with `?mock-update-item=loading`                                   |
| Save failed                                        | the edit form with `?mock-update-item=error`                                     |
| The history at its three levels                    | open AR-007 and press History; Older and Show every version                      |
| The history fails to load                          | the same page with `?mock-revisions=error`                                       |
| Restore failed                                     | the history with an older version and `?mock-restore-item=error`                 |
| The links of an item with `!`                      | open REQ-003; the chip of AR-007 and its card                                    |
| The quoted words marked                            | open REQ-001; the mark of AR-001 in its statement, its chip and its origin       |
| A warning mark from an issue                       | open AR-010; the mark of AMB-001 in its statement                                |
| Edit disabled outside the review                   | open REQ-001; its tooltip on hover                                               |
| A transcript at a message                          | open REQ-001, scroll to Why this item exists, click the citation card            |
| An interview in progress                           | open the Interview with the student of the library project                       |
| Personas being interviewed                         | open the Interviewees of the library project                                     |
| The profile page of a persona                      | open the Interviewees of the mentor platform, then Minh                          |

In the analysis, the user has begun the review: `RAW-001`, `RAW-002`, `AR-001` and `AR-002` are approved, `RAW-008`, `LN-002` and `ASM-003` are rejected, `RAW-004`, `AR-003` and the like were edited by the user, and three ambiguities and one conflict are open, so the document and its outline show every state of an item next to the drafts.

In the browser, the stream of a running run whose stage writes an artifact sends `node_start` and a few `artifact_delta` for that artifact and then stays open, so the document keeps its mark of being written.

## Project list

| State                                                                       | Address                                                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Projects                                                                    | http://localhost:3000/projects                                                                                            |
| Loading                                                                     | http://localhost:3000/projects?mock-projects=loading                                                                      |
| Error                                                                       | http://localhost:3000/projects?mock-projects=error                                                                        |
| Empty                                                                       | http://localhost:3000/projects?mock-projects=empty                                                                        |
| The mentor platform running                                                 | http://localhost:3000/projects?mock-run-status=running                                                                    |
| No unfinished run in the mentor platform                                    | http://localhost:3000/projects?mock-run-status=done                                                                       |
| A long list of projects, 50 at a time with Show more projects               | http://localhost:3000/projects?mock-projects=many                                                                         |
| Loading more projects                                                       | Open http://localhost:3000/projects?mock-projects=more-loading and press Show more projects                               |
| Archived projects                                                           | Open http://localhost:3000/projects and press Archived                                                                    |
| No archived project                                                         | Open http://localhost:3000/projects?mock-projects=empty and press Archived                                                |
| Filters of the list                                                         | Open http://localhost:3000/projects and press Filter                                                                      |
| The projects that wait for the user                                         | In the filters, choose Waiting for you and press Apply                                                                    |
| No project matches the filters                                              | In the filters, choose In the last day and press Apply: the projects of the mock data were last active before that        |
| Filters given in the address                                                | http://localhost:3000/projects?run-status=failed&run-status=none                                                          |
| Create project dialog                                                       | Open http://localhost:3000/projects, type an idea in the prompt and press Create project                                  |
| The run settings with every kind of parameter                               | Open the Create project dialog from http://localhost:3000/projects?mock-run-parameters=all-types and press Agent settings |
| An idea left empty                                                          | In the Create project dialog, empty the idea and press Create project                                                     |
| Creating the project                                                        | Open the Create project dialog from http://localhost:3000/projects?mock-create-project=loading and press Create project   |
| The project fails to be created                                             | The same from http://localhost:3000/projects?mock-create-project=error                                                    |
| A field that the API does not take                                          | The same from http://localhost:3000/projects?mock-create-project=invalid                                                  |
| The project is created, but its idea is not sent: its activity with a toast | The same from http://localhost:3000/projects?mock-send-message=error                                                      |
| Prompt with the focus                                                       | Open the command palette in a project and choose Create project                                                           |
| A project without a name                                                    | In the Create project dialog, leave the name empty and create the project                                                 |
| Menu of a project                                                           | Open http://localhost:3000/projects and press the `...` button of a row                                                   |
| Rename project dialog                                                       | In the menu of a project, choose Rename                                                                                   |
| A project renamed                                                           | In the Rename project dialog, type a new name and press Rename                                                            |
| Renaming the project                                                        | The same from http://localhost:3000/projects?mock-update-project=loading                                                  |
| The project fails to be renamed                                             | The same from http://localhost:3000/projects?mock-update-project=error                                                    |
| A project archived, with Undo in the toast                                  | In the menu of a project, choose Archive                                                                                  |
| The project fails to be archived                                            | The same from http://localhost:3000/projects?mock-update-project=error                                                    |
| Menu of an archived project                                                 | Press Archived, then the `...` button of a row                                                                            |
| A project restored                                                          | In the menu of an archived project, choose Restore                                                                        |
| The project fails to be restored                                            | The same from http://localhost:3000/projects?mock-update-project=error                                                    |
| Delete project dialog                                                       | In the menu of a project whose runs ended, such as Campus food ordering, choose Delete                                    |
| A project with a run that is not finished, which is not deleted             | In the menu of the mentor platform, choose Delete                                                                         |
| Deleting the project                                                        | Open the Delete project dialog from http://localhost:3000/projects?mock-delete-project=loading and press Delete project   |
| The project fails to be deleted                                             | The same from http://localhost:3000/projects?mock-delete-project=error                                                    |

## Other screens

| State          | Address                            |
| -------------- | ---------------------------------- |
| Settings       | http://localhost:3000/settings     |
| Page not found | http://localhost:3000/no-such-page |

## Frame of a project

| State                                          | Address                                                                                                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frame of the mentor platform                   | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/activity                                                                              |
| Project not found                              | http://localhost:3000/projects/missing/activity                                                                                                           |
| Project not found (404 from the API)           | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/activity?mock-project=empty                                                           |
| Project menu error                             | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/activity?mock-project=error                                                           |
| Project menu loading                           | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/activity?mock-project=loading                                                         |
| Project menu while the projects load           | Open http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/activity?mock-projects=loading and the project menu                              |
| Project menu when the projects fail to load    | The same with `mock-projects=error`                                                                                                                       |
| Command palette while the projects load        | Open http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/activity?mock-projects=loading and the command palette                           |
| Command palette when the projects fail to load | The same with `mock-projects=error`                                                                                                                       |
| Rename project, last in the project menu       | Open http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/activity, press the name of the project on the top bar and choose Rename project |
| Rename project in the command palette          | Open the command palette in the mentor platform and type rename                                                                                           |

The command palette opens with `Ctrl+K`. The activity of a project is a placeholder until it is built.

## Development pages

| Page                                            | Address                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Design system, both themes                      | http://localhost:3000/design-system                                              |
| A screen outside a project that fails to render | http://localhost:3000/render-error                                               |
| A screen of a project that fails to render      | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/render-error |
