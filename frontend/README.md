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
- The configured style is `radix-mira`, the compact style meant for dense interfaces, and the icon library is Lucide (`lucide-react`).
- `menuColor` is `default`: menus are opaque, and a highlighted menu item uses `accent`, the selection color of Night Owl. The translucent menu colors tint the highlighted item with the foreground at 10% instead, which overrides `accent`.
- Every component of the registry is installed except `toast`, which exists only for Base UI projects (`sonner` is used instead), and `form`, which the registry replaced with `field`. The list is at https://ui.shadcn.com/docs/components.
- `tree.tsx` is not part of shadcn/ui: it comes from the Origin UI registry (`pnpm ui:add https://coss.com/origin/r/tree.json`, MIT) and wraps [Headless Tree](https://headless-tree.lukasbach.com) (`@headless-tree/core`, `@headless-tree/react`).
- `node.tsx`, `handle.tsx`, and `node-status-indicator.tsx` come from the [React Flow UI](https://reactflow.dev/ui) registry (`pnpm ui:add https://ui.reactflow.dev/base-node`, and so on). The CLI writes them to `src/components/`; move them to `src/components/ui/`, and rename `base-node.tsx` and `base-handle.tsx` to `node.tsx` and `handle.tsx`, with the components `Node` and `Handle`: like the other components, they have no `Base` prefix.
- `code.tsx`, `flow.tsx`, `edge.tsx`, and `markdown.tsx` are written for this project. `Code` shows inline code, after the [Code](https://chakra-ui.com/docs/components/code) component of Chakra UI. Its fills are `solid`, `surface`, `soft`, `outline`, and `plain`, and its `size` (`sm`, `default`, `lg`) matches a text size: captions, component text, and body text. `Flow` is the React Flow canvas (`@xyflow/react`) with the color mode of the current theme, light until hydration so that the server HTML matches. `Edge` draws an edge path in the line style of its `variant` (`solid`, `dashed`, `dotted`); it sets the `--xy-edge-*` variables of its edge, so React Flow still handles selection and animation. `Markdown` renders Markdown with [Streamdown](https://streamdown.ai) and its code plugin (`@streamdown/code`), with the heading sizes of the page. Inline code is a `Code` of the body text size (`lg`). Code blocks keep the frame, header, and buttons of Streamdown, and show the highlighted lines in a ScrollArea instead of a native scroll container.
- Existing files are kept unless `--overwrite` is passed. Overwriting removes the local edits below, so check the result with `--diff` and re-apply them:

  | File                                                                                 | Local edit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `context-menu.tsx`, `dropdown-menu.tsx`, `menubar.tsx`, `slider.tsx`, `calendar.tsx` | Optional props are passed only when defined, for `exactOptionalPropertyTypes`: `checked` in the menus, `value` and `defaultValue` in the slider, `locale` on the day button of the calendar. The day button also drops the HTML `color` attribute, since Button takes `color` as a tone                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | `command.tsx`                                                                        | The selected item uses `accent`, like the other menus, instead of `muted`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
  | `badge.tsx`, `alert.tsx`, `button.tsx`                                               | The `variant` and `color` props (see [Colors, radius, and dark mode](#colors-radius-and-dark-mode)), with the fills `solid`, `soft`, `outline`, `ghost`, `link` for badge and button and `outline`, `soft`, `solid` for alert. The shadcn names `default`, `secondary`, `destructive` still work, neutral solid and ghost buttons keep the shadcn look, and a neutral outline button looks like an outline Toggle (`--input` border, no fill, `--muted` on hover). Badge and Button share `fillTones` from `src/lib/tone.constants.ts`, so `buttonVariants` and `badgeVariants` take the same props. All three read these props with `resolveToneVariant` from `src/lib/tone.utils.ts`                                                                                                   |
  | `marker.tsx`, `progress.tsx`, `spinner.tsx`                                          | The `color` prop (see [Colors, radius, and dark mode](#colors-radius-and-dark-mode))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
  | `alert-dialog.tsx`                                                                   | The action and cancel buttons also take `color`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
  | `scroll-area.tsx`                                                                    | A `scrollbars` prop (`vertical`, `horizontal`, `both`) renders the scrollbars outside the viewport. The viewport is `relative`, so that it clips and scrolls absolutely positioned content, and the `display: table` wrapper of Radix is made a block, so that wide content such as a multi-column layout wraps instead of widening it                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
  | `sonner.tsx`                                                                         | `theme` is cast to `NonNullable<ToasterProps['theme']>`; the success, info, warning, and error icons take the `-strong` color of their status (info: primary)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
  | `input-group.tsx`                                                                    | The `eslint-disable-next-line` comment on the addon that focuses the input                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
  | `tree.tsx`                                                                           | `any` replaced by the Headless Tree types; console warnings removed; labels without their own background                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
  | `node.tsx`, `handle.tsx`, `node-status-indicator.tsx`                                | Repo style (`cn` from `cn`, `data-slot`, named exports). The handle uses `--card` and `--muted-foreground` instead of slate colors. The status indicator uses the `-strong` status colors and `--primary` instead of fixed blue, green, and red, has a `warning` status, and spins with `animate-spin` instead of an injected style element. `Node` takes the `variant` and `color` props, with the fills `outline`, `soft`, and `solid`, and has no `tabIndex` of its own, since React Flow already makes each node focusable; its title is `text-xs font-medium`. Hover and selection keep the color of the node: outline and soft nodes take the `-strong` border, and a ring of the `-strong` color at 20% (hover) or 40% (selected or focused from the keyboard) surrounds the node |

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
- The palette:

  | Tokens                                                              | Light                           | Dark                                | Role                                                                                                                                                                                                      |
  | ------------------------------------------------------------------- | ------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `--background`, `--foreground`                                      | `#fbfbfb`, `#403f53`            | `#011627`, `#d6deeb`                | Page and text (`editor.background`, `editor.foreground`)                                                                                                                                                  |
  | `--card`, `--popover`, `--sidebar`                                  | `#f0f0f0`, `#f0f0f0`, `#f0f0f0` | `#021320`, `#0b253a`, `#011627`     | Surfaces (`editorWidget.background`, `input.background`, `sideBar.background`)                                                                                                                            |
  | `--secondary`, `--muted`                                            | `#e0e7ea`                       | `#0e293f`                           | Quiet fills (`list.inactiveSelectionBackground`)                                                                                                                                                          |
  | `--accent`, `--sidebar-accent`                                      | `#d3e8f8`                       | `#14344f`                           | Selection and hover (`list.activeSelectionBackground`; in dark mode `#234d708c` over the page)                                                                                                            |
  | `--sidebar-foreground`, `--muted-foreground`                        | `#403f53`, `#4b6875`            | `#89a4bb`, `#89a4bb`                | Side bar and secondary text (`sideBar.foreground`). Night Owl Light has no secondary text color that reads at 4.5:1, so its `--muted-foreground` is the blue-gray `#90a7b2` of its line numbers, darkened |
  | `--border`, `--sidebar-border`, `--input`                           | `#cedadf`, `#cedadf`, `#c5d4da` | `#5e81ce52`, `#5e81ce52`, `#5f7e97` | Lines and input borders (`editorRuler.foreground`, `input.border`). In light mode the gray `#d9d9d9` of the theme, tinted with the hue of `#90a7b2`                                                       |
  | `--primary`, `--ring`                                               | `#3460be`                       | `#82aaff`                           | Actions and focus, the blue of function names in Night Owl (in light mode `#4876d6`, darkened for white text)                                                                                             |
  | `--chart-1` ... `--chart-5`                                         | `#b66c06` ... `#fbd509`         | `#fff4b1` ... `#b06505`             | Yellow from lemon to amber in five lightness steps, for order or magnitude. `--chart-1` stands out most and `--chart-5` sits closest to the background                                                    |
  | `--success`, `--success-foreground`, `--success-strong`             | `#027c5a`, `#ffffff`, `#056e50` | `#9ccc65`, `#011627`, `#9ccc65`     | The green of Night Owl (`#9ccc65` for added lines; in light mode `#08916a` darkened for white text)                                                                                                       |
  | `--warning`, `--warning-foreground`, `--warning-strong`             | `#ffa37f`, `#011627`, `#a94e28` | `#ffa37f`, `#011627`, `#ffa37f`     | The orange `#ffa37f` of the Night Owl palette in both themes (Night Owl Light has no orange)                                                                                                              |
  | `--destructive`, `--destructive-foreground`, `--destructive-strong` | `#b50c1b`, `#ffffff`, `#b50c1b` | `#fe7770`, `#011627`, `#fe7770`     | The Night Owl red, darkened in light mode and lightened in dark mode so that `text-destructive` reads on its own soft fill                                                                                |

  Each token takes the Night Owl color named in parentheses in both themes, so the two themes stay aligned; the Role column notes each color that is tuned instead. `--input` is also the fill of inputs, outline buttons, and select triggers (at 20% to 30%), so in dark mode those fills are a little lighter than the `input.background` of the theme.

  Each status has three tokens: the color itself for solid fills and, at 15% opacity (20% in dark mode; 35% for warning in light mode, because the orange is light), for soft fills; `-foreground` for text on the solid fill; `-strong` for status text, icons, and dots on the page and on the soft fill. Where the color itself reads well enough as text, `-strong` is `var()` of it, so only the light success and warning set a color of their own. Badge, Button, Alert, Code, Node, Edge, Marker, Progress, and Spinner take a `color` prop: `neutral`, `primary`, or a status (`success`, `warning`, `destructive`). It sets the tokens of that color through the classes in `src/lib/tone.constants.ts`. Badge, Button, Alert, Code, and Node also take a `variant` for the fill, and Edge a `variant` for the line style.

  Every text token has a contrast of at least 4.5:1 on its background, each `-strong` status color at least 4.5:1 on the background, the sidebar, cards, and its own soft fill (except the light `--warning-strong`, 4.0:1 on its soft fill, kept lighter on purpose), and each `-foreground` at least 4.5:1 on its solid fill. The dark chart ramp passes the ordinal checks (hue spread within 40 degrees, monotone lightness, a step of at least 0.06 in OKLCH lightness, the step nearest the background at 2:1 or more). The light ramp passes all but the last: to stay a vivid yellow, `--chart-4` and `--chart-5` are 1.8:1 and 1.4:1 on the background, so a chart in the light theme labels its values or offers a table.

- React Flow: `styles.css` imports its stylesheet into the `components` layer, so that utility classes override it, and sets its `--xy-*` variables to the tokens. The canvas is transparent, edges use `--muted-foreground` (`--primary` when selected; `Edge` sets its own from its color), nodes and handles `--card`, and controls and the minimap `--popover`. The `flow-selected:` variant applies while a node or edge is selected or focused from the keyboard, since React Flow removes their focus outline.
- Markdown code blocks use the Shiki themes `night-owl-light` and `night-owl`, the same colors as the editor.
- Dark mode is class-based and handled by `next-themes`. Its `ThemeProvider` (in `src/providers/Providers.tsx`) sets the `dark` class on `<html>` before the page hydrates. The default theme is Dark, and the Settings page offers Light, Dark, and System. Components read the theme with `useTheme()` from `next-themes`. The stored theme is only known in the browser, so UI that depends on it must not differ between the server-rendered HTML and the first client render (see `SettingsPage.tsx`).

### Fonts

The app uses the same fonts as VS Code with its default settings: the system UI font for the interface and the default editor font for code.

| Role                              | Windows  | macOS                           | Linux                           | CSS variable                                              |
| --------------------------------- | -------- | ------------------------------- | ------------------------------- | --------------------------------------------------------- |
| Interface, body text, headings    | Segoe UI | San Francisco (`-apple-system`) | `system-ui`, Ubuntu, Droid Sans | `--font-ui`, mapped to `--font-sans` and `--font-heading` |
| Code (`code`, `pre`, `font-mono`) | Consolas | Menlo, Monaco                   | Droid Sans Mono                 | `--font-code`, mapped to `--font-mono`                    |

Both are font stacks of installed system fonts, so no font file is downloaded. A family that lacks a glyph falls back to the next family in the stack.

To use a web font instead, self-host it through a [Fontsource](https://fontsource.org) package:

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
4. Point a Tailwind token at it (`--font-sans`, `--font-heading`, or `--font-mono` in `@theme inline`).

Vietnamese text needs a font that ships the `vietnamese` subset. The subsets of a package are listed on its Fontsource page and in its `files/` directory.

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

### Mock scenarios

A handler can answer differently depending on a parameter in the page URL, so every state of a screen can be seen in `pnpm dev:mock`:

| URL                      | The threads handler returns        |
| ------------------------ | ---------------------------------- |
| `/`                      | The fixtures                       |
| `/?mock-threads=empty`   | An empty list                      |
| `/?mock-threads=error`   | HTTP 500                           |
| `/?mock-threads=loading` | Nothing; the request stays pending |

The parameter name is `mock-<resource>`. A handler reads it with `mockScenario('<resource>')` from `src/mocks/mock-scenario.utils.ts` and supports the scenarios: `empty`, `error`, `loading`. Without the parameter it returns the fixtures. Unit tests do not use scenarios; they override a handler with `server.use(...)`.

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
