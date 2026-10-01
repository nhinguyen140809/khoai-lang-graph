# Khoailanggraph Frontend

Next.js 16 (App Router) + React 19 + TypeScript app. It talks to the backend over REST and SSE and can run on its own against mocked API responses.

This file covers running and working on the frontend. For the overall architecture, tech stack, and repository layout see the [root README](../README.md); for coding conventions, file naming, and the API contract see [CONTRIBUTING](../CONTRIBUTING.md).

## Contents

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Adding shadcn/ui components](#adding-shadcnui-components)
- [Theming and fonts](#theming-and-fonts)
- [Routes, Server and Client Components](#routes-server-and-client-components)
- [Low-memory development](#low-memory-development)
- [API client](#api-client)
- [Mock data](#mock-data)
- [Troubleshooting](#troubleshooting)

## Prerequisites

| Tool    | Version | Notes                                                                                                                                 |
| ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js | 22      | Pinned in [`../.nvmrc`](../.nvmrc). Run `nvm use` or `fnm use` from the repo root. `package.json` also declares `engines.node >= 22`. |
| pnpm    | 11      | Pinned by the `packageManager` field in `package.json`. Run `corepack enable` once and the right version is used automatically.       |

On Windows, work inside WSL2 and keep the repo on the Linux filesystem (not under `/mnt/c`).

## Quick start

```bash
cd frontend
pnpm install
pnpm dev:mock
```

Open http://localhost:3000.

`pnpm dev:mock` serves every `/api` request from the MSW handlers in `src/mocks/`, so no backend is needed. The mock chat run streams a short reply, which is enough to exercise the chat, artifact panel, and settings pages.

When the backend is running on http://localhost:8000, use `pnpm dev` instead: the Next.js server proxies `/api` to that address (a rewrite in `next.config.ts`), so the browser only talks to one origin.

## Environment variables

Copy `.env.example` to `.env.local` (git-ignored) to set variables for `pnpm dev`. Variables prefixed with `NEXT_PUBLIC_` are inlined into the browser bundle, so they never hold secrets. Variables without the prefix are only readable by the Next.js server.

| Variable                  | Values                 | Description                                                                                                    |
| ------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_MOCKING` | `enabled` / `disabled` | `enabled` starts the MSW worker and serves `/api` from `src/mocks/`. `pnpm dev:mock` sets it for a single run. |
| `API_PROXY_TARGET`        | URL                    | Origin that `/api` requests are proxied to. Defaults to `http://localhost:8000`.                               |

In code, read variables through `process.env.<NAME>`. Declare each new variable in `src/env.d.ts`.

## Scripts

| Command                | What it does                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`             | Start the Next.js dev server on port 3000, proxying `/api` to `http://localhost:8000`.               |
| `pnpm dev:mock`        | Same as `dev`, with the API served from MSW mocks.                                                   |
| `pnpm build`           | Type-check, then build the production app into `.next/`.                                             |
| `pnpm start`           | Serve the production build. Run `pnpm build` first.                                                  |
| `pnpm typecheck`       | Generate the route types (`next typegen`), then run the TypeScript compiler without emitting files.  |
| `pnpm typecheck:watch` | Re-run the type check on every file change.                                                          |
| `pnpm lint`            | Run ESLint on the whole project.                                                                     |
| `pnpm lint:fix`        | Run ESLint and apply automatic fixes (import order, unnecessary assertions, ...).                    |
| `pnpm format`          | Format all files with Prettier.                                                                      |
| `pnpm format:check`    | Report files that Prettier would change, without writing.                                            |
| `pnpm fix`             | `lint:fix` followed by `format`.                                                                     |
| `pnpm check`           | `typecheck`, `lint`, `format:check`, and `test`, one after another. Run it before opening a PR.      |
| `pnpm test`            | Run the unit tests once (Vitest).                                                                    |
| `pnpm test:watch`      | Run the unit tests in watch mode.                                                                    |
| `pnpm e2e`             | Run the Playwright tests. They start their own dev server on port 3100 with mocks enabled.           |
| `pnpm e2e:install`     | Download the Chromium build used by Playwright. Needed once per machine before the first `pnpm e2e`. |
| `pnpm ui:add <name>`   | Add a shadcn/ui component, see [Adding shadcn/ui components](#adding-shadcnui-components).           |
| `pnpm codegen`         | Generate the typed API client from `openapi.json`.                                                   |

`check` runs its steps sequentially, which keeps memory use low. Stop `pnpm dev` before `pnpm e2e` or `pnpm build`: Next.js allows one dev server per project folder, and each of these is a heavy process (see [Low-memory development](#low-memory-development)).

## Project layout

```
frontend/
├── next.config.ts           # /api proxy, typed routes, dev memory options
├── components.json          # shadcn/ui CLI config (style, aliases, icon library)
├── src/
│   ├── app/                 # routes (Next.js App Router) and styles.css
│   ├── providers/           # global providers: query client, theme, API mocking
│   ├── features/            # one folder per feature: chat, artifacts, settings, ...
│   ├── components/layout/   # app shell: sidebar and resizable panels
│   ├── components/ui/       # shadcn/ui components (project source, editable)
│   ├── api/generated/       # generated API client (do not edit)
│   ├── mocks/               # MSW handlers shared by dev mocking, unit tests, and E2E
│   ├── hooks/, lib/         # shared hooks and utilities
│   └── test/                # Vitest setup
└── tests/e2e/               # Playwright specs
```

The full repository tree is in the [root README](../README.md#repository-structure).

## Adding shadcn/ui components

Components are installed with the shadcn CLI, which is a dev dependency of this project:

```bash
pnpm ui:add dialog                 # add one component
pnpm ui:add dialog dropdown-menu   # add several
pnpm ui:add dialog --dry-run       # list the files it would write, without writing
pnpm ui:add dialog --diff          # compare the local file with the registry version
pnpm fix                           # apply this repo's ESLint and Prettier style
```

- Files are written to `src/components/ui/` according to the aliases in `components.json` (`@/components/ui`, `@/lib/utils`, `@/hooks`). They are regular project source and can be edited.
- The CLI writes code in its own style (double quotes, its own import order). `pnpm fix` converts it to the repo style; afterwards `pnpm check` should pass.
- Existing files are kept unless `--overwrite` is passed. Before overwriting a component that has local edits, check the result with `--diff`.
- The configured style is `radix-maia` and the icon library is Lucide (`lucide-react`).
- The list of available components is at https://ui.shadcn.com/docs/components.

### Applying a theme preset

Presets from the shadcn theme generator are applied with `shadcn apply`:

```bash
pnpm exec shadcn apply <preset> --only theme
pnpm fix
```

With `--only theme`, only the theme variables in `src/app/styles.css` change. Without `--only`, the CLI can also rewrite the components in `src/components/ui/` in the preset's style; in that case review the diff of each component and run `pnpm fix` and `pnpm check`. Fonts are configured manually, see [Fonts](#fonts).

## Theming and fonts

### Colors, radius, and dark mode

- All design tokens are CSS variables in `src/app/styles.css`: `:root` holds the light theme, `.dark` the dark theme, and `@theme inline` maps them to Tailwind utilities (`bg-background`, `text-muted-foreground`, `border-border`, ...).
- `--radius` is the base corner radius. The `rounded-sm` ... `rounded-4xl` utilities are derived from it, so changing this one value rounds every component more or less.
- Dark mode is class-based and handled by `next-themes`. Its `ThemeProvider` (in `src/providers/Providers.tsx`) sets the `dark` class on `<html>` before the page hydrates, and the Settings page offers Light, Dark, and System. Components read the theme with `useTheme()` from `next-themes`. The stored theme is only known in the browser, so UI that depends on it must not differ between the server-rendered HTML and the first client render (see `SettingsPage.tsx`).

### Fonts

| Role                    | Font         | Package                                              | CSS variable                           |
| ----------------------- | ------------ | ---------------------------------------------------- | -------------------------------------- |
| Headings (`h1` to `h6`) | Lato         | `@fontsource/lato` (weights 100, 300, 400, 700, 900) | `--font-heading` -> `--font-lato`      |
| Body text               | Merriweather | `@fontsource-variable/merriweather`                  | `--font-body` -> `--font-merriweather` |
| Code (`code`, `pre`)    | Roboto Mono  | `@fontsource-variable/roboto-mono`                   | `--font-mono` -> `--font-roboto-mono`  |

Fonts are self-hosted through [Fontsource](https://fontsource.org) packages and bundled with the app CSS. Each package declares every subset with a `unicode-range`, so the browser only downloads the subsets a page uses.

To add or replace a font:

1. Install the package. Prefer the variable version when it exists (`@fontsource-variable/<name>`); otherwise use `@fontsource/<name>` and import each weight.
   ```bash
   pnpm add @fontsource-variable/inter
   ```
2. Import it at the top of `src/app/styles.css`:
   ```css
   @import '@fontsource-variable/inter';
   ```
3. Declare the family in `:root`. Variable packages register the family as `'<Name> Variable'`:
   ```css
   --font-inter: 'Inter Variable', sans-serif;
   ```
4. Point a role at it (`--font-heading`, `--font-body`, or `--font-mono` in the `@layer base` block) or a Tailwind token (`--font-sans`, `--font-serif`, `--font-mono` in `@theme inline`).

Vietnamese text needs a font that ships the `vietnamese` subset. Merriweather and Roboto Mono include it; Lato does not, so Vietnamese headings fall back to another font for characters such as `ư`, `ơ`, and `ạ`. The subsets of a package are listed on its Fontsource page and in its `files/` directory.

## Routes, Server and Client Components

- A route is a folder in `src/app/` with a `page.tsx`. The folder path is the URL: `src/app/(app)/settings/page.tsx` is `/settings`.
- `(app)` is a route group: the name in parentheses is not part of the URL. Its `layout.tsx` wraps every page of the group in the app shell, and its `error.tsx` is the error boundary for those pages. A page that must not show the app shell (for example a public landing page) goes in another group with its own layout.
- `src/app/` holds only routing files. A `page.tsx` renders a component from `src/features/`.
- Files in `src/app/` are Server Components: they render on the server and cannot use state, effects, or event handlers. A component that needs those starts with `'use client'`. Most feature components are Client Components.
- Links use `<Link href="...">` from `next/link`. `href` is type-checked against the existing routes (`typedRoutes` in `next.config.ts`); the route types are regenerated by `pnpm dev`, `pnpm build`, and `pnpm typecheck`.
- A library that touches `window` or `document` while it loads (PDF viewer, code editor, graph layout worker) is imported with `next/dynamic` and `ssr: false` from a Client Component.

## Low-memory development

Measured on this project with a warm cache: the dev server uses about 300 MB when idle and about 700 MB right after compiling a page; the first compile after deleting `.next/` peaks above 1 GB.

Already configured in `next.config.ts`:

| Setting                                                        | Effect                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `turbopack.root`                                               | Only this folder is resolved and watched, not the rest of the monorepo.                             |
| `experimental.turbopackPluginRuntimeStrategy: 'workerThreads'` | PostCSS runs in worker threads instead of a pool of child Node.js processes.                        |
| `experimental.preloadEntriesOnStart: false`                    | `pnpm start` loads a page's modules on its first request instead of loading every page at start-up. |

Turbopack compiles a route only when it is first requested, and releases memory on its own after each compile (`experimental.turbopackMemoryEviction`, default `auto`).

Habits that help:

- Run one heavy process at a time: `pnpm dev`, `pnpm build`, `pnpm e2e`, and `pnpm check` are each heavy.
- Keep `.next/`: it holds the compile cache, and deleting it makes the next start slow and memory-hungry.
- Restart `pnpm dev` after a long session if its memory keeps growing.
- `eslint.editor.config.js` is a variant of the ESLint config for the editor: it leaves out the rules that need type information. Those rules load the whole TypeScript project and are the most memory-hungry part of the editor setup. To use it in VS Code, set `"eslint.options": { "overrideConfigFile": "eslint.editor.config.js" }` and `"eslint.workingDirectories": [{ "directory": "frontend", "changeProcessCWD": true }]` in your workspace settings (`.vscode/` is git-ignored), then restart the ESLint server after every change to `eslint.config.js`. The type-aware rules still run in `pnpm lint`, so run `pnpm check` before opening a PR.
- In VS Code, exclude build output from the editor's file watcher and search, and cap the TypeScript server, in your user or workspace settings:
  ```json
  {
    "files.watcherExclude": { "**/.next/**": true, "**/node_modules/**": true },
    "search.exclude": { "**/.next": true },
    "typescript.tsserver.maxTsServerMemory": 2048
  }
  ```

## API client

- The typed API client in `src/api/generated/` is generated by `pnpm codegen` from `frontend/openapi.json`, which the backend exports (`just codegen` at the repo root runs both steps). Both are committed and never edited by hand. The schema file does not exist yet, so `pnpm codegen` fails until the backend is in place.

## Mock data

All mock code lives in `src/mocks/`, one pair of files per API resource:

| File                     | Content                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `<resource>.fixtures.ts` | The data: typed with the feature's types, fixed values only (no random ids, no current time). |
| `<resource>.handlers.ts` | MSW handlers that answer the endpoints of that resource with the fixtures.                    |

The same handlers serve `pnpm dev:mock`, the unit tests, and the E2E tests, so a fixture is written once. Example: `threads.fixtures.ts` and `threads.handlers.ts` back `GET /api/v1/threads`.

To mock a new endpoint:

1. Add the data to `src/mocks/<resource>.fixtures.ts`, typed with the type from `src/features/<feature>/`.
2. Add the handler to `src/mocks/<resource>.handlers.ts` and export the handler list.
3. Register the list in `msw-browser.setup.ts` (dev mocking, E2E) and `msw-server.setup.ts` (unit tests).
4. In a test that needs other data or an error, override the handler for that test only with `server.use(...)`; it is reset after each test.

Components never import fixtures. They call the API functions of their feature, and MSW answers the request, so switching to the real backend changes no component code. Handlers that need a browser-only API (the SSE stream) are registered only in `msw-browser.setup.ts`.

## Troubleshooting

| Symptom                                                                                | Cause and fix                                                                                                                                |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Requests to `/api` hang or fail                                                        | The backend is not running on port 8000. Use `pnpm dev:mock`.                                                                                |
| `Another next dev server is already running`                                           | `pnpm dev` and `pnpm e2e` cannot run at the same time in this folder. Stop the first one.                                                    |
| `You're importing a component that needs useState` (or another hook)                   | The file uses a client-only API. Add `'use client'` as its first line.                                                                       |
| A hydration mismatch warning in the browser console                                    | A component rendered something on the server that differs in the browser (theme, `localStorage`, window size). Read that value in an effect. |
| `pnpm lint` reports import order errors in `src/components/ui/` after a shadcn command | Run `pnpm fix`.                                                                                                                              |
| `pnpm e2e` fails with a missing browser executable                                     | Run `pnpm e2e:install` once.                                                                                                                 |
| A heading shows mixed fonts in Vietnamese text                                         | The heading font lacks the `vietnamese` subset, see [Fonts](#fonts).                                                                         |
