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
  - [Development pages](#development-pages)

## Mock data

| Record           | Id                                     | What it holds                                                                                          |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| User "Linh Pham" | `11b70000-0000-4000-8000-000000000001` | The user of the API examples, `linh.pham@example.com`. The mock server signs in any email and password |

The mock server keeps the session and the user in browser storage, so they survive a reload. Add `?mock-reset` to any address to start again from the fixtures, for example http://localhost:3000/login?mock-reset.

## Parameters

A parameter in the page address changes what a group of endpoints answers. Parameters can be combined, for example `?mock-threads=empty&mock-me=error`.

| Parameter       | Values                                  | Endpoints it changes                     |
| --------------- | --------------------------------------- | ---------------------------------------- |
| `mock-threads`  | `empty`, `error`, `loading`             | `GET /threads`                           |
| `mock-me`       | `empty` (404), `error`, `loading`       | `GET /me`                                |
| `mock-login`    | `error` (401, wrong email or password)  | `POST /auth/login`                       |
| `mock-register` | `error` (422, the email has an account) | `POST /auth/register`                    |
| `mock-reset`    | none                                    | Forgets the records the mock server kept |

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
