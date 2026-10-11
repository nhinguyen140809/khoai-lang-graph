# Mock scenarios

The addresses that show each state of each screen with `pnpm dev:mock`. Start the dev server with mocks from `frontend/` and open the links:

```bash
pnpm dev:mock
```

How the mocks work (fixtures, handlers, adding an endpoint) is in [Mock data](../../README.md#mock-data). Add the addresses of a screen here when the screen is built.

## Contents

- [Mock scenarios](#mock-scenarios)
  - [Contents](#contents)
  - [Mock data](#mock-data)
  - [Parameters](#parameters)
  - [Account](#account)
  - [Project list](#project-list)
  - [Frame of a project](#frame-of-a-project)
  - [Console](#console)
  - [Search](#search)
  - [Artifacts](#artifacts)
  - [Review](#review)
  - [Run states](#run-states)
  - [Features not built yet](#features-not-built-yet)
  - [Development pages](#development-pages)

## Mock data

The data is the project of the API examples, an online platform where university students find mentors.

| Record                               | Id                                                       | What it holds                                                                                                                                                                                                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project "Mentor platform"            | `90aa0000-0000-4000-8000-000000000001`                   | The project of the API examples                                                                                                                                                                                                                                                                               |
| Project "Campus food ordering"       | `90aa0000-0000-4000-8000-000000000002`                   | Finished runs only                                                                                                                                                                                                                                                                                            |
| Project "Library booking"            | `90aa0000-0000-4000-8000-000000000003`                   | A running run, at the interviews                                                                                                                                                                                                                                                                              |
| Project "Dorm laundry booking"       | `90aa0000-0000-4000-8000-000000000004`                   | Archived                                                                                                                                                                                                                                                                                                      |
| Eleven more projects                 | `90aa0000-0000-4000-8000-0000000000NN`, NN from 05 to 16 | Each in one state of a run: done, waiting for review, running, failed, stopped, no run yet, or archived; two are in Vietnamese. Each has one thread and at most one run, with the message that started it, its steps and a few items. They are generated from the specs in `extra-project-specs.constants.ts` |
| Thread "Main thread" of each project | `7f3a0000-0000-4000-8000-000000000001`                   | Every project has one thread, the thread of the console of the project; the mentor thread holds runs 1, 2 and 3                                                                                                                                                                                               |
| Run 3 of the mentor thread           | `5f2d0000-0000-4000-8000-000000000001`                   | The run of the API examples: it retries run 2 from its planner step and waits at the analysis review, step 67                                                                                                                                                                                                 |

The mock server keeps the session, the user, the user settings, and the projects and threads created with `POST` in browser storage, so they survive a reload. Add `?mock-reset` to any address to start again from the fixtures, for example http://localhost:3000/projects?mock-reset.

## Parameters

A parameter in the page address changes what a group of endpoints answers. Parameters can be combined, for example `?mock-threads=empty&mock-me=error`.

| Parameter             | Values                                                                                                  | Endpoints it changes                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `mock-projects`       | `empty`, `error`, `loading`, `many` (60 more projects, for a long list)                                 | `GET /projects`                                                                                                   |
| `mock-project`        | `empty` (404), `error`, `loading`                                                                       | `GET /projects/{project_id}`                                                                                      |
| `mock-threads`        | `empty`, `error`, `loading`                                                                             | `GET /threads`, `GET /projects/{project_id}/threads`                                                              |
| `mock-messages`       | `empty`, `error`, `loading`                                                                             | `GET /threads/{thread_id}/messages`                                                                               |
| `mock-thread`         | `empty` (404), `error`, `loading`                                                                       | `GET /threads/{thread_id}`                                                                                        |
| `mock-runs`           | `empty` (no run, and no thread has one), `error`, `loading`                                             | `GET /threads/{thread_id}/runs`, `GET /runs/{run_id}`, `GET /runs/{run_id}/steps`                                 |
| `mock-run-state`      | `running`, `waiting` (default), `failed`, `done`                                                        | The state of run 3 of the mentor thread, and of everything derived from it: the thread, the counts of the project |
| `mock-items`          | `empty`, `error`, `loading`                                                                             | `GET /projects/{project_id}/items` (the search)                                                                   |
| `mock-item`           | `empty` (404), `error`, `loading`                                                                       | `GET /items/{item_id}`                                                                                            |
| `mock-artifacts`      | `empty`, `error`, `loading`                                                                             | `GET /projects/{project_id}/artifacts`                                                                            |
| `mock-artifact`       | `error`, `loading`                                                                                      | `GET /artifacts/{artifact_id}`, `GET /artifacts/{artifact_id}/items`                                              |
| `mock-trace`          | `error`, `loading`                                                                                      | `GET /items/{item_id}/trace`                                                                                      |
| `mock-review`         | `questions` (the checkpoint asks questions, not options), `empty` (no review waits), `error`, `loading` | `GET /runs/{run_id}/interrupts`                                                                                   |
| `mock-play`           | `review` (a run that a message starts stops at the review of the personas)                              | The stream of a run that a message starts                                                                         |
| `mock-artifact-kinds` | `empty`, `error`, `loading`                                                                             | `GET /artifact-kinds`                                                                                             |
| `mock-me`             | `empty` (404), `error`, `loading`                                                                       | `GET /me`                                                                                                         |
| `mock-settings`       | `empty` (404), `error`, `loading`, `save-error` (loads, then `PUT` answers 500)                         | `GET /me/settings`, `PUT /me/settings`                                                                            |
| `mock-login`          | `error` (401, wrong email or password)                                                                  | `POST /auth/login`                                                                                                |
| `mock-register`       | `error` (422, the email has an account)                                                                 | `POST /auth/register`                                                                                             |
| `mock-reset`          | none                                                                                                    | Forgets the records the mock server kept                                                                          |

`error` answers HTTP 500 and `loading` never answers, unless the table says otherwise.

## Account

| State                                                 | Address                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Sign-in page                                          | http://localhost:3000/login                                                                |
| Sign-in page that returns to the chat                 | http://localhost:3000/login?next=%2Fprojects%2F90aa0000-0000-4000-8000-000000000001%2Fchat |
| Wrong email or password                               | http://localhost:3000/login?mock-login=error                                               |
| Create an account                                     | http://localhost:3000/register                                                             |
| The email has an account                              | http://localhost:3000/register?mock-register=error                                         |
| Signed out: every other page goes to the sign-in page | Choose Sign out in the account menu, then open http://localhost:3000/projects              |
| Account menu loading                                  | http://localhost:3000/projects?mock-me=loading                                             |
| Account menu error                                    | http://localhost:3000/projects?mock-me=error                                               |
| Theme not saved (a toast after choosing a theme)      | http://localhost:3000/projects?mock-settings=save-error                                    |
| Settings fail to load: the theme stays on this device | http://localhost:3000/projects?mock-settings=error                                         |

## Project list

| State                                                | Address                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Projects                                             | http://localhost:3000/projects                                       |
| Loading                                              | http://localhost:3000/projects?mock-projects=loading                 |
| Error                                                | http://localhost:3000/projects?mock-projects=error                   |
| Empty                                                | http://localhost:3000/projects?mock-projects=empty                   |
| The mentor platform running                          | http://localhost:3000/projects?mock-run-state=running                |
| No unfinished run in the mentor platform             | http://localhost:3000/projects?mock-run-state=done                   |
| A long list of projects                              | http://localhost:3000/projects?mock-projects=many                    |
| Archived projects                                    | Open http://localhost:3000/projects and press Archived               |
| New project dialog                                   | Open http://localhost:3000/projects and press New project            |
| New project dialog in English when the settings fail | http://localhost:3000/projects?mock-settings=error, then New project |

## Frame of a project

| State                                          | Address                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Frame of the mentor platform                   | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console                      |
| Project not found                              | http://localhost:3000/projects/missing/console                                                   |
| Project not found (404 from the API)           | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-project=empty   |
| Project menu error                             | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-project=error   |
| Project menu loading                           | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-project=loading |
| Status bar loading                             | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-runs=loading    |
| Status bar error                               | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-runs=error      |
| Status bar without runs                        | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-runs=empty      |
| Status bar of a running run in another project | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000003/console                      |

The command palette opens with `Ctrl+K`; the side panel hides with `Ctrl+B` on a feature that has one (Console has none).

## Console

The side panel has the outline of the console and the list of the consoles (one per project). A command that you run appears in the log and in the outline; the commands are kept in this browser.

The console shows the event log of the project and an input for a message that starts a run, or a command. A project whose thread does not exist yet gets one created on first open, so the empty scenario still ends on the console.

| State                                                    | Address                                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Run 3 waiting at the review (default)                    | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console                                      |
| Run 3 running (a message is not sent; use a command)     | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-run-state=running               |
| Run 3 failed (use `/retry`)                              | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-run-state=failed                |
| No unfinished run (a message starts and plays a new run) | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000002/console                                      |
| Event log without messages                               | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-messages=empty                  |
| Messages error                                           | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-messages=error                  |
| One console by its id                                    | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console/7f3a0000-0000-4000-8000-000000000001 |
| Console loading                                          | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-threads=loading                 |
| Console error                                            | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-threads=error                   |
| Thread created on open                                   | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-threads=empty                   |

## Search

Type in the search box of the panel; try `REQ`, `search` or `mentor`. A result opens in Artifacts.

| State          | Address                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------- |
| Search         | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/search                    |
| Search loading | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/search?mock-items=loading |
| Search error   | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/search?mock-items=error   |
| No matches     | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/search?mock-items=empty   |

The search state is typed in the box, so open the address and then type.

## Artifacts

The tree lists the artifacts of the project; open one to see its sections or its items by kind. Each project of the API examples has an elicitation plan, personas and a specification; the mentor platform has the whole set of artifacts that a run makes, with trace links, and `REQ-003` is made from an older version of `AR-007`.

| State                                        | Address                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Requirement specification (sections, tables) | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts/a7f30000-0000-4000-8000-000000000107                        |
| Requirements analysis (items by kind)        | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts/a7f30000-0000-4000-8000-000000000106                        |
| Interview with PER-001 (transcript)          | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts/a7f30000-0000-4000-8000-000000000103                        |
| Persona catalog (cards)                      | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts/a7f30000-0000-4000-8000-000000000102                        |
| An item, with its trace and versions         | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts/items/c41e0000-0000-4000-8000-000000001057                  |
| Item not found                               | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts/items/c41e0000-0000-4000-8000-000000001057?mock-item=empty  |
| Trace error                                  | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts/items/c41e0000-0000-4000-8000-000000001057?mock-trace=error |
| Artifacts loading                            | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts?mock-artifacts=loading                                      |
| Artifacts error                              | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts?mock-artifacts=error                                        |
| No artifacts                                 | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts?mock-artifacts=empty                                        |
| Export dialog open                           | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/artifacts?export                                                      |

An edit of an item is a `PATCH` that the mock server keeps, with the versions that it makes; `?mock-reset` forgets it. An export is made a moment after it is asked for, and its file is a plain text of the artifacts.

## Review

A run that waits at a checkpoint has a review: the artifact under review on the left half, the event log with the options on the right half. The mentor platform waits at the analysis review, where `AR-007` was edited by the user. The other projects that wait do so at the review of the personas.

| State                                    | Address                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Review of the analysis                   | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/review/5f2d0000-0000-4000-8000-000000000001                       |
| A checkpoint that asks questions         | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/review/5f2d0000-0000-4000-8000-000000000001?mock-review=questions |
| Review of the personas (parking permits) | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000006/review/5f2d0000-0000-4000-8000-000000000061                       |
| A run that waits for no review           | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/review/7e100000-0000-4000-8000-000000000001                       |
| Review loading                           | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/review/5f2d0000-0000-4000-8000-000000000001?mock-review=loading   |
| Review error                             | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/review/5f2d0000-0000-4000-8000-000000000001?mock-review=error     |

An answer is kept by the mock server: the run goes on at the next stage, and an approval makes the artifact and its draft items approved. `?mock-reset` forgets it. To see the review open by itself, open http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000002/console?mock-play=review and send a message.

## Run states

Run 3 of the mentor platform in each state. The status bar, the review badge on Console and the project list follow it.

| State                        | Address                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Waiting for review (default) | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console                        |
| Running                      | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-run-state=running |
| Failed                       | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-run-state=failed  |
| Done                         | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/console?mock-run-state=done    |

## Features not built yet

These addresses show the frame with an empty state until their feature is built.

| Feature           | Address                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Workflow          | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/workflow                                      |
| Run 3 in Workflow | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/workflow/5f2d0000-0000-4000-8000-000000000001 |
| Traceability      | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/traceability                                  |
| Project settings  | http://localhost:3000/projects/90aa0000-0000-4000-8000-000000000001/settings                                      |

## Development pages

| Page                       | Address                             |
| -------------------------- | ----------------------------------- |
| Design system, both themes | http://localhost:3000/design-system |
