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
| Thread "Main thread" of each project | `7f3a0000-0000-4000-8000-0000000000NN`, NN the number of its project | Every project has one thread; the mentor thread holds runs 1, 2 and 3                                                                                                                                                                                                                                                                                     |
| Run 3 of the mentor thread           | `5f2d0000-0000-4000-8000-000000000001`                               | The run of the API examples: it retries run 2 from its planner step and waits at the analysis review, step 67                                                                                                                                                                                                                                             |

A request with an `Idempotency-Key` header, such as sending a message, gets the first answer again when it repeats with the same key (`409 idempotency_conflict` with another body), and does not do its work twice.

A change of an artifact or an item needs the version it is based on in `If-Match` (`409 version_conflict` otherwise), checks the content against the schema of the kind (`422 validation_failed`), and answers `409 invalid_state` while a run is running, for example with `?mock-run-status=running`. Each change makes a new version, kept in the versions of the record; items that the user adds, moves or reorders get their number and depth again, and a deleted item leaves the lists but stays readable at its versions. Restoring an artifact gives it the content of that version, and each item of the artifact that has a revision of that number gets it back too, each as a new version.

The mock server keeps the session, the user, what `POST` creates (projects, threads, messages and the runs they start, and items), the projects that `PATCH` archived or restored and that `DELETE` deleted, the runs that were stopped, and the artifacts and items that the user changed, in browser storage, so they survive a reload. A project created without a name takes the first words of its first message as its name, where the agents would name it. `GET /me/usage` answers the cost of the runs that started in October 2026, the month of the mock data, against the budget of $20 that the server gives a user without one of their own, and no groups. Add `?mock-reset` to any address to start again from the fixtures, for example http://localhost:3000/login?mock-reset.

## Parameters

A parameter in the page address changes what a group of endpoints answers. Parameters can be combined, for example `?mock-threads=empty&mock-me=error`.

| Parameter               | Values                                                                                                                                                      | Endpoints it changes                                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `mock-projects`         | `empty`, `error`, `loading`, `many` (60 more projects, for a long list), `more-loading` (the long list of `many`, whose pages after the first never answer) | `GET /projects`                                                                                                               |
| `mock-project`          | `empty` (404), `error`, `loading`                                                                                                                           | `GET /projects/{project_id}`                                                                                                  |
| `mock-threads`          | `empty`, `error`, `loading`                                                                                                                                 | `GET /threads`, `GET /projects/{project_id}/threads`                                                                          |
| `mock-thread`           | `empty` (404), `error`, `loading`                                                                                                                           | `GET /threads/{thread_id}`                                                                                                    |
| `mock-runs`             | `empty` (no run, and no thread has one), `error`, `loading`                                                                                                 | `GET /threads/{thread_id}/runs`, `GET /runs/{run_id}`, `GET /runs/{run_id}/steps`                                             |
| `mock-run-status`       | `running`, `waiting` (default), `failed`, `done`                                                                                                            | The status of run 3 of the mentor thread, and of everything derived from it: the thread, the counts of the project            |
| `mock-run-state`        | `error`, `loading`                                                                                                                                          | `GET /runs/{run_id}/state`, `GET /runs/{run_id}/steps/{step_id}/state`                                                        |
| `mock-directives`       | `empty`, `error`, `loading`                                                                                                                                 | `GET /runs/{run_id}/directives`                                                                                               |
| `mock-retry-run`        | `error`, `loading`                                                                                                                                          | `POST /runs/{run_id}/retry`                                                                                                   |
| `mock-me`               | `empty` (404), `error`, `loading`                                                                                                                           | `GET /me`                                                                                                                     |
| `mock-login`            | `error` (401, wrong email or password), `loading`                                                                                                           | `POST /auth/login`                                                                                                            |
| `mock-register`         | `error` (422, the email has an account), `loading`                                                                                                          | `POST /auth/register`                                                                                                         |
| `mock-run-parameters`   | `all-types` (the run parameters of the docs, and a flag with a default, a flag without one and a choice)                                                    | `GET /workflow/definition`, the latest version                                                                                |
| `mock-create-project`   | `error`, `invalid` (422, the language of the documents is not taken), `loading`                                                                             | `POST /projects`                                                                                                              |
| `mock-update-project`   | `error`, `loading`                                                                                                                                          | `PATCH /projects/{project_id}`, which renames a project, archives it and restores it                                          |
| `mock-delete-project`   | `error`, `loading`                                                                                                                                          | `DELETE /projects/{project_id}`, which answers 409 for a project with a run that is not finished, such as the mentor platform |
| `mock-send-message`     | `error`, `loading`                                                                                                                                          | `POST /threads/{thread_id}/messages`, which sends the idea of a new project                                                   |
| `mock-artifact-kinds`   | `empty` (no kind), `error`, `loading`                                                                                                                       | `GET /artifact-kinds`                                                                                                         |
| `mock-artifacts`        | `empty`, `error`, `loading`                                                                                                                                 | `GET /projects/{project_id}/artifacts`                                                                                        |
| `mock-artifact`         | `error`, `loading`                                                                                                                                          | `GET /artifacts/{artifact_id}`, its items and its versions                                                                    |
| `mock-items`            | `empty`, `error`, `loading`                                                                                                                                 | `GET /projects/{project_id}/items`                                                                                            |
| `mock-item`             | `empty` (404), `error`, `loading`                                                                                                                           | `GET /items/{item_id}`, its versions                                                                                          |
| `mock-update-artifact`  | `error`, `loading`                                                                                                                                          | `PATCH /artifacts/{artifact_id}`                                                                                              |
| `mock-restore-artifact` | `error`, `loading`                                                                                                                                          | `POST /artifacts/{artifact_id}/restore`                                                                                       |
| `mock-create-item`      | `error`, `loading`                                                                                                                                          | `POST /artifacts/{artifact_id}/items`                                                                                         |
| `mock-reorder-items`    | `error`, `loading`                                                                                                                                          | `POST /artifacts/{artifact_id}/items/reorder`                                                                                 |
| `mock-update-item`      | `error`, `loading`                                                                                                                                          | `PATCH /items/{item_id}`                                                                                                      |
| `mock-delete-item`      | `error`, `loading`                                                                                                                                          | `DELETE /items/{item_id}`, which answers 409 for a section that still holds items                                             |
| `mock-move-item`        | `error`, `loading`                                                                                                                                          | `POST /items/{item_id}/move`                                                                                                  |
| `mock-restore-item`     | `error`, `loading`                                                                                                                                          | `POST /items/{item_id}/restore`                                                                                               |
| `mock-exports`          | `empty` (no export), `error`, `loading`                                                                                                                     | `POST`, `GET /projects/{project_id}/exports`, `GET /exports/{export_id}`                                                      |
| `mock-reset`            | none                                                                                                                                                        | Forgets the records the mock server kept                                                                                      |

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
