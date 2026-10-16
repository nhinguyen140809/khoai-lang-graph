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
  - [Development pages](#development-pages)

## Mock data

| Record                               | Id                                                                   | What it holds                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User "Linh Pham"                     | `11b70000-0000-4000-8000-000000000001`                               | The user of the API examples, `linh.pham@example.com`. The mock server signs in any email and password                                                                                                                                                           |
| Project "Mentor platform"            | `90aa0000-0000-4000-8000-000000000001`                               | The project of the API examples, an online platform where university students find mentors                                                                                                                                                                       |
| Project "Campus food ordering"       | `90aa0000-0000-4000-8000-000000000002`                               | Finished runs only                                                                                                                                                                                                                                               |
| Project "Library booking"            | `90aa0000-0000-4000-8000-000000000003`                               | A running run, at the interviews                                                                                                                                                                                                                                 |
| Project "Dorm laundry booking"       | `90aa0000-0000-4000-8000-000000000004`                               | Archived                                                                                                                                                                                                                                                         |
| Twelve more projects                 | `90aa0000-0000-4000-8000-0000000000NN`, NN from 05 to 16             | Each in one state of a run: done, waiting for review, running, failed, stopped, no run yet, or archived; two are in Vietnamese. Each has one thread and at most one run, with its steps. They are generated from the specs in `extra-project-specs.constants.ts` |
| Thread "Main thread" of each project | `7f3a0000-0000-4000-8000-0000000000NN`, NN the number of its project | Every project has one thread; the mentor thread holds runs 1, 2 and 3                                                                                                                                                                                            |
| Run 3 of the mentor thread           | `5f2d0000-0000-4000-8000-000000000001`                               | The run of the API examples: it retries run 2 from its planner step and waits at the analysis review, step 67                                                                                                                                                    |

The mock server keeps the session, the user, the projects created with `POST` and the runs that were stopped in browser storage, so they survive a reload. Add `?mock-reset` to any address to start again from the fixtures, for example http://localhost:3000/login?mock-reset.

## Parameters

A parameter in the page address changes what a group of endpoints answers. Parameters can be combined, for example `?mock-threads=empty&mock-me=error`.

| Parameter        | Values                                                                  | Endpoints it changes                                                                                              |
| ---------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `mock-projects`  | `empty`, `error`, `loading`, `many` (60 more projects, for a long list) | `GET /projects`                                                                                                   |
| `mock-project`   | `empty` (404), `error`, `loading`                                       | `GET /projects/{project_id}`                                                                                      |
| `mock-threads`   | `empty`, `error`, `loading`                                             | `GET /threads`, `GET /projects/{project_id}/threads`                                                              |
| `mock-thread`    | `empty` (404), `error`, `loading`                                       | `GET /threads/{thread_id}`                                                                                        |
| `mock-runs`      | `empty` (no run, and no thread has one), `error`, `loading`             | `GET /threads/{thread_id}/runs`, `GET /runs/{run_id}`, `GET /runs/{run_id}/steps`                                 |
| `mock-run-state` | `running`, `waiting` (default), `failed`, `done`                        | The state of run 3 of the mentor thread, and of everything derived from it: the thread, the counts of the project |
| `mock-me`        | `empty` (404), `error`, `loading`                                       | `GET /me`                                                                                                         |
| `mock-login`     | `error` (401, wrong email or password)                                  | `POST /auth/login`                                                                                                |
| `mock-register`  | `error` (422, the email has an account)                                 | `POST /auth/register`                                                                                             |
| `mock-reset`     | none                                                                    | Forgets the records the mock server kept                                                                          |

`error` answers HTTP 500 and `loading` never answers, unless the table says otherwise.

## Account

| State                                     | Address                                            |
| ----------------------------------------- | -------------------------------------------------- |
| Sign-in page                              | http://localhost:3000/login                        |
| Sign-in page that returns to the settings | http://localhost:3000/login?next=%2Fsettings       |
| Wrong email or password                   | http://localhost:3000/login?mock-login=error       |
| Create an account                         | http://localhost:3000/register                     |
| The email has an account                  | http://localhost:3000/register?mock-register=error |

## Development pages

| Page                       | Address                             |
| -------------------------- | ----------------------------------- |
| Design system, both themes | http://localhost:3000/design-system |
