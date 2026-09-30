# Khoailanggraph Frontend

React 19 + TypeScript single-page app built with Vite. It talks to the backend over REST and SSE and can run on its own against mocked API responses.

This file covers running and working on the frontend. For the overall architecture, tech stack, and repository layout see the [root README](../README.md); for coding conventions, file naming, and the API contract see [CONTRIBUTING](../CONTRIBUTING.md).

## Contents

- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Adding shadcn/ui components](#adding-shadcnui-components)
- [Theming and fonts](#theming-and-fonts)
- [Vite equivalents of Next.js snippets](#vite-equivalents-of-nextjs-snippets)
- [API client and routes](#api-client-and-routes)
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

Open http://localhost:5173.

`pnpm dev:mock` serves every `/api` request from the MSW handlers in `src/mocks/`, so no backend is needed. The mock chat run streams a short reply, which is enough to exercise the chat, artifact panel, and settings pages.

When the backend is running on http://localhost:8000, use `pnpm dev` instead: Vite proxies `/api` to that address.

## Environment variables

Copy `.env.example` to `.env.local` (git-ignored) to set variables for `pnpm dev`. Only variables prefixed with `VITE_` reach the browser, so this file never holds secrets.

| Variable           | Values                 | Description                                                                                                    |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `VITE_API_MOCKING` | `enabled` / `disabled` | `enabled` starts the MSW worker and serves `/api` from `src/mocks/`. `pnpm dev:mock` sets it for a single run. |

In code, read variables through `import.meta.env.VITE_*`.

## Scripts

| Command                | What it does                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm dev`             | Start the Vite dev server on port 5173, proxying `/api` to `http://localhost:8000`.                  |
| `pnpm dev:mock`        | Same as `dev`, with the API served from MSW mocks.                                                   |
| `pnpm build`           | Type-check, then build the production bundle into `dist/`.                                           |
| `pnpm preview`         | Serve the built `dist/` locally.                                                                     |
| `pnpm typecheck`       | Run the TypeScript compiler (`tsc -b`) without emitting files.                                       |
| `pnpm typecheck:watch` | Re-run the type check on every file change.                                                          |
| `pnpm lint`            | Run ESLint on the whole project.                                                                     |
| `pnpm lint:fix`        | Run ESLint and apply automatic fixes (import order, unnecessary assertions, ...).                    |
| `pnpm format`          | Format all files with Prettier.                                                                      |
| `pnpm format:check`    | Report files that Prettier would change, without writing.                                            |
| `pnpm fix`             | `lint:fix` followed by `format`.                                                                     |
| `pnpm check`           | `typecheck`, `lint`, `format:check`, and `test`, one after another. Run it before opening a PR.      |
| `pnpm test`            | Run the unit tests once (Vitest).                                                                    |
| `pnpm test:watch`      | Run the unit tests in watch mode.                                                                    |
| `pnpm e2e`             | Run the Playwright tests. They start their own Vite server on port 4173 with mocks enabled.          |
| `pnpm e2e:install`     | Download the Chromium build used by Playwright. Needed once per machine before the first `pnpm e2e`. |
| `pnpm ui:add <name>`   | Add a shadcn/ui component, see [Adding shadcn/ui components](#adding-shadcnui-components).           |
| `pnpm codegen`         | Generate the typed API client from `openapi.json`.                                                   |
| `pnpm routes`          | Regenerate `src/routeTree.gen.ts` from `src/routes/`.                                                |

`check` runs its steps sequentially, which keeps memory use low. On machines with little RAM, stop `pnpm dev` before `pnpm e2e`, since the E2E run starts a second Vite server.

## Project layout

```
frontend/
├── index.html               # HTML entry, loads src/main.tsx
├── components.json          # shadcn/ui CLI config (style, aliases, icon library)
├── src/
│   ├── main.tsx             # starts MSW when mocking is enabled, then renders <App />
│   ├── app/                 # App, global providers, layout shell, styles.css
│   ├── routes/              # file-based routes (TanStack Router)
│   ├── features/            # one folder per feature: chat, artifacts, settings, ...
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
- Dark mode is class-based. `ThemeProvider` (in `src/features/settings`) toggles the `dark` class on `<html>` from the settings store, and the Settings page offers Light, Dark, and System. Components that need the resolved theme use the `useResolvedTheme` hook.

### Fonts

| Role                    | Font         | Package                                              | CSS variable                           |
| ----------------------- | ------------ | ---------------------------------------------------- | -------------------------------------- |
| Headings (`h1` to `h6`) | Lato         | `@fontsource/lato` (weights 100, 300, 400, 700, 900) | `--font-heading` -> `--font-lato`      |
| Body text               | Merriweather | `@fontsource-variable/merriweather`                  | `--font-body` -> `--font-merriweather` |
| Code (`code`, `pre`)    | Roboto Mono  | `@fontsource-variable/roboto-mono`                   | `--font-mono` -> `--font-roboto-mono`  |

Fonts are self-hosted through [Fontsource](https://fontsource.org) packages and bundled by Vite. Each package declares every subset with a `unicode-range`, so the browser only downloads the subsets a page uses.

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

## Vite equivalents of Next.js snippets

Much of the shadcn documentation and generator output targets Next.js. The equivalents in this project:

| Next.js                                                        | This project                                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `next/font/google` and `className={font.variable}` on `<html>` | Fontsource package imported in `styles.css`, family set as a `--font-*` variable in `:root` (see [Fonts](#fonts)) |
| `next-themes` (`ThemeProvider`, `useTheme`)                    | `ThemeProvider` and `useResolvedTheme` from `@/features/settings`                                                 |
| `app/layout.tsx`                                               | `index.html` for the document, `src/app/App.tsx` and `src/app/Providers.tsx` for app-wide components              |
| `process.env.NEXT_PUBLIC_*`                                    | `import.meta.env.VITE_*`                                                                                          |
| `"use client"`                                                 | Not needed; `components.json` sets `rsc: false`                                                                   |

## API client and routes

- The typed API client in `src/api/generated/` is generated by `pnpm codegen` from `frontend/openapi.json`, which the backend exports (`just codegen` at the repo root runs both steps). Both are committed and never edited by hand. The schema file does not exist yet, so `pnpm codegen` fails until the backend is in place.
- Routes are files in `src/routes/`. The Vite plugin regenerates `src/routeTree.gen.ts` while `pnpm dev` runs; `pnpm routes` does the same without the dev server.

## Troubleshooting

| Symptom                                                                                | Cause and fix                                                                                                                                |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Requests to `/api` hang or fail                                                        | The backend is not running on port 8000. Use `pnpm dev:mock`.                                                                                |
| `Failed to resolve import "next/..."`                                                  | A Next.js-only import was copied into the code. Replace it with the equivalent from [the table above](#vite-equivalents-of-nextjs-snippets). |
| `pnpm lint` reports import order errors in `src/components/ui/` after a shadcn command | Run `pnpm fix`.                                                                                                                              |
| `pnpm e2e` fails with a missing browser executable                                     | Run `pnpm e2e:install` once.                                                                                                                 |
| A heading shows mixed fonts in Vietnamese text                                         | The heading font lacks the `vietnamese` subset, see [Fonts](#fonts).                                                                         |
