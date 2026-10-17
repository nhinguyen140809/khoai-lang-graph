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
- [Frame](#frame)
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

| Command                | What it does                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`             | Start the Next.js dev server on port 3000, proxying `/api` to `http://localhost:8000`.                                                         |
| `pnpm dev:mock`        | Same as `dev`, with the API served from MSW mocks.                                                                                             |
| `pnpm build`           | Type-check, then build the production app into `.next/`.                                                                                       |
| `pnpm start`           | Serve the production build. Run `pnpm build` first.                                                                                            |
| `pnpm typecheck`       | Generate the route types (`next typegen`), then run the TypeScript compiler without emitting files.                                            |
| `pnpm typecheck:watch` | Re-run the type check on every file change.                                                                                                    |
| `pnpm lint`            | Run ESLint on the whole project, one group of folders per process (`scripts/lint.mjs`, see [Low-memory development](#low-memory-development)). |
| `pnpm lint:fix`        | Run ESLint the same way and apply automatic fixes (import order, unnecessary assertions, ...).                                                 |
| `pnpm format`          | Format all files with Prettier.                                                                                                                |
| `pnpm format:check`    | Report files that Prettier would change, without writing.                                                                                      |
| `pnpm fix`             | `lint:fix` followed by `format`.                                                                                                               |
| `pnpm check`           | `typecheck`, `lint`, `format:check`, and `test`, one after another to keep memory use low. Run it before opening a PR.                         |
| `pnpm test`            | Run the unit tests once (Vitest).                                                                                                              |
| `pnpm test:watch`      | Run the unit tests in watch mode.                                                                                                              |
| `pnpm e2e`             | Run the Playwright tests. They start their own dev server on port 3100 with mocks enabled.                                                     |
| `pnpm e2e:install`     | Download the Chromium build used by Playwright. Needed once per machine before the first `pnpm e2e`.                                           |
| `pnpm screenshots`     | Take a screenshot of each mock state of each screen, in both themes, see [Screenshots](#screenshots).                                          |
| `pnpm ui:add <name>`   | Add a shadcn/ui component, see [Adding shadcn/ui components](#adding-shadcnui-components).                                                     |
| `pnpm codegen`         | Generate the typed API client from `openapi.json`.                                                                                             |

Stop `pnpm dev` before `pnpm e2e` or `pnpm screenshots`, since Next.js allows one dev server per project folder, or start it with mocks on their port: `pnpm dev:mock --port 3100`. They use a server that runs there.

## Project layout

```
frontend/
├── next.config.ts           # /api proxy, typed routes, dev memory options
├── components.json          # shadcn/ui CLI config (style, aliases, icon library)
├── src/
│   ├── app/                 # routes (Next.js App Router) and styles.css
│   ├── providers/           # global providers: query client, theme, API mocking
│   ├── features/            # one folder per feature: chat, artifacts, settings, ...
│   ├── shared/              # code that knows no feature
│   │   ├── components/
│   │   │   ├── ui/          # shadcn/ui components (project source, editable)
│   │   │   ├── frame/       # the frame of every screen: app shell, sidebar, resizable panels
│   │   │   ├── state/       # query states: loading, error, empty, not found
│   │   │   └── form/        # the fields of forms
│   │   ├── hooks/, lib/     # generic hooks and utilities
│   │   ├── api/             # fetch and its errors, query client, API URL, generated/: generated API client (do not edit)
│   │   ├── domain/          # the vocabulary that several features share, one folder per topic, such as run-status/
│   │   └── config/          # what the app sets once: the addresses of its pages
│   ├── mocks/               # MSW handlers shared by dev mocking, unit tests, and E2E
│   └── test/                # Vitest setup
└── tests/
    ├── e2e/                 # Playwright specs
    └── screenshots/         # the screenshots of the mock states
```

## Adding shadcn/ui components

Components are installed with the shadcn CLI, which is a dev dependency of this project:

```bash
pnpm ui:add dialog                 # add one component
pnpm ui:add dialog dropdown-menu   # add several
pnpm ui:add dialog --dry-run       # list the files it would write, without writing
pnpm ui:add dialog --diff          # compare the local file with the registry version
pnpm fix                           # apply this repo's ESLint and Prettier style
```

- Files are written to `src/shared/components/ui/` according to the aliases in `components.json` (`@/shared/components/ui`, `@/shared/lib/utils`, `@/shared/hooks`). They are regular project source and can be edited.
- The CLI writes code in its own style (double quotes, its own import order). `pnpm fix` converts it to the repo style; afterwards `pnpm check` should pass.
- The configured style is `radix-nova`: controls 32px high with `text-sm` text, and inputs in `text-base` on small screens so that phones do not zoom on them. The icon library is Lucide (`lucide-react`).
- The components came from `radix-mira` and took the classes that `radix-nova` changes, string by string, so the changes of this project stay in them. `pnpm ui:add <name> --diff` shows how a local file differs from its Nova version in the registry.
- `menuColor` is `default`: menus are opaque, and a highlighted menu item uses `accent`, the selection color of Night Owl. The translucent menu colors tint the highlighted item with the foreground at 10% instead, which overrides `accent`.
- Every component of the registry is installed except `toast`, which exists only for Base UI projects (`sonner` is used instead), and `form`, which the registry replaced with `field`. The list is at https://ui.shadcn.com/docs/components.
- The page `/design-system` shows the installed components as cards, with the color tokens and the type scale, in both themes; `sidebar` is shown by the app shell and `direction` has no visible part. It exists only in development (`pnpm dev`, then open http://localhost:3000/design-system); production builds answer 404.
- `tree.tsx` is not part of shadcn/ui: it comes from the Origin UI registry (`pnpm ui:add https://coss.com/origin/r/tree.json`, MIT) and wraps [Headless Tree](https://headless-tree.lukasbach.com) (`@headless-tree/core`, `@headless-tree/react`).
- `node.tsx`, `handle.tsx`, and `node-status-indicator.tsx` come from the [React Flow UI](https://reactflow.dev/ui) registry (`pnpm ui:add https://ui.reactflow.dev/base-node`, and so on). The CLI writes them to `src/shared/components/`; move them to `src/shared/components/ui/`, and rename `base-node.tsx` and `base-handle.tsx` to `node.tsx` and `handle.tsx`, with the components `Node` and `Handle`: like the other components, they have no `Base` prefix.
- `code.tsx`, `flow.tsx`, `edge.tsx`, `markdown.tsx`, `stack.tsx`, `confirm-dialog.tsx`, and `pending-button.tsx` are written for this project. `PendingButton` is a button whose action takes a moment, such as the one that submits a form: while `pending`, it is disabled and shows a spinner named `pendingLabel` before its words. `ConfirmDialog` asks before an action, on the alert dialog: a question as the title, the action as the words of its button, an icon in the color of the action without a fill (red, and a warning sign by default, for a destructive action; the primary color otherwise), and, when the action returns a promise, the dialog waits for it, then closes when it resolves and stays open when it rejects. `Code` shows inline code, after the [Code](https://chakra-ui.com/docs/components/code) component of Chakra UI. Its fills are `solid`, `surface`, `soft`, `outline`, and `plain`, and its `size` (`sm`, `default`, `lg`) matches a text size: captions, component text, and body text. `Flow` is the React Flow canvas (`@xyflow/react`) with the color mode of the current theme, light until hydration so that the server HTML matches. `Edge` draws an edge path in the line style of its `variant` (`solid`, `dashed`, `dotted`); it sets the `--xy-edge-*` variables of its edge, so React Flow still handles selection and animation. `Markdown` renders Markdown with [Streamdown](https://streamdown.ai) and its code plugin (`@streamdown/code`), with the heading sizes of the page. Inline code is a `Code` of the body text size (`lg`). Code blocks keep the frame, header, and buttons of Streamdown, and show the highlighted lines in a ScrollArea instead of a native scroll container. `Stack` lays its children out in a row or a column (`direction`, a column by default) with a gap of the spacing scale (`gap="2"` is `gap-2`), after the [Stack](https://chakra-ui.com/docs/components/stack) of Chakra UI and the one of MUI; `align` and `justify` place them, and `separator` goes between two children.
- The libraries wrapped in `src/shared/components/ui/` are not imported directly elsewhere; ESLint (`no-restricted-imports`) reports `streamdown`, `@streamdown/code`, `react-resizable-panels`, `ReactFlow` and `Handle` from `@xyflow/react`, and `ResponsiveContainer`, `Tooltip`, and `Legend` from `recharts`. Their hooks, types, and other parts (for example `Background`, `Controls`, `Bar`) can be imported directly, because they take their colors from the tokens. Headless Tree has no visible parts, so it is not restricted.
- Existing files are kept unless `--overwrite` is passed. Overwriting removes the local edits below, so check the result with `--diff` and re-apply them:

  | File                                                                                 | Local edit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
  | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `context-menu.tsx`, `dropdown-menu.tsx`, `menubar.tsx`, `slider.tsx`, `calendar.tsx` | Optional props are passed only when defined, for `exactOptionalPropertyTypes`: `checked` in the menus, `value` and `defaultValue` in the slider, `locale` on the day button of the calendar. The day button also drops the HTML `color` attribute, since Button takes `color` as a tone                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
  | `command.tsx`                                                                        | The selected item uses `accent`, like the other menus, instead of `muted`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
  | `badge.tsx`, `alert.tsx`, `button.tsx`                                               | The `variant` and `color` props (see [Colors, radius, and dark mode](#colors-radius-and-dark-mode)), with the fills `solid`, `soft`, `outline`, `ghost`, `link` for badge and button and `outline`, `soft`, `solid` for alert. The shadcn names `default`, `secondary`, `destructive` still work, neutral solid and ghost buttons keep the shadcn look, and a neutral outline button looks like an outline Toggle (`--input` border, no fill, `--muted` on hover). Badge and Button share `fillTones` from `src/shared/lib/tone.constants.ts`, so `buttonVariants` and `badgeVariants` take the same props. All three read these props with `resolveToneVariant` from `src/shared/lib/tone.utils.ts`                                                                                       |
  | `marker.tsx`, `progress.tsx`, `spinner.tsx`                                          | The `color` prop (see [Colors, radius, and dark mode](#colors-radius-and-dark-mode))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
  | `alert-dialog.tsx`                                                                   | The action and cancel buttons also take `color`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
  | `scroll-area.tsx`                                                                    | A `scrollbars` prop (`vertical`, `horizontal`, `both`) renders the scrollbars outside the viewport. The viewport is `relative`, so that it clips and scrolls absolutely positioned content, and the `display: table` wrapper of Radix is made a block, so that wide content such as a multi-column layout wraps instead of widening it                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
  | `sonner.tsx`                                                                         | `theme` is cast to `NonNullable<ToasterProps['theme']>`; the success, info, warning, and error icons take the `-strong` color of their status (info: primary)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
  | `input-group.tsx`                                                                    | The `eslint-disable-next-line` comment on the addon that focuses the input. The group looks disabled when its text box is, not when any element inside is, so that a button that waits, such as the arrow of a prompt, does not dim the whole box                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
  | `tree.tsx`                                                                           | `any` replaced by the Headless Tree types; console warnings removed; labels without their own background                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
  | `node.tsx`, `handle.tsx`, `node-status-indicator.tsx`                                | Repo style (`cn` from `cn`, `data-slot`, named exports). The handle uses `--card` and `--muted-foreground` instead of slate colors. The status indicator uses the `-strong` status colors and `--primary` instead of fixed blue, green, and red, has a `warning` status, and spins with `animate-spin` instead of an injected style element. `Node` takes the `variant` and `color` props, with the fills `outline`, `soft`, and `solid`, and has no `tabIndex` of its own, since React Flow already makes each node focusable; its title is `text-xs font-semibold`. Hover and selection keep the color of the node: outline and soft nodes take the `-strong` border, and a ring of the `-strong` color at 20% (hover) or 40% (selected or focused from the keyboard) surrounds the node |

### Applying a theme preset

Presets from the shadcn theme generator are applied with `shadcn apply`:

```bash
pnpm exec shadcn apply <preset> --only theme
pnpm fix
```

With `--only theme`, only the theme variables in `src/app/styles.css` change. Without `--only`, the CLI can also rewrite the components in `src/shared/components/ui/` in the preset's style; in that case review the diff of each component and run `pnpm fix` and `pnpm check`. Fonts are configured manually, see [Fonts](#fonts).

## Theming and fonts

### Colors, radius, and dark mode

- All design tokens are CSS variables in `src/app/styles.css`: `:root` holds the light theme, `.dark` the dark theme, and `@theme inline` maps them to Tailwind utilities (`bg-background`, `text-muted-foreground`, `border-border`, ...).
- The text sizes are the ones of Tailwind, as the Nova style of shadcn/ui uses them: `text-sm` (14px) for the text of components and pages, which people read, and `text-xs` (12px) for labels, captions, hints, the status bar and the titles of panels, which people glance at. Below them, two sizes in `@theme` are for indicators: `text-3xs` (11px, 14px line) for counts, ids, and times, and `text-4xs` (10px, 12px line) for the count inside a badge.
- A heading stands apart from the text around it by its size and its weight, always `font-semibold`: `font-medium` (500) is too close to regular text to set it apart, and shows as regular text in Segoe UI, the fallback on Windows, which has no such weight. The sizes: `text-3xl` for the title of the sign-in pages, `text-2xl` for the title of a page, `text-lg` for the heading of a section, the title of a state (empty, error, not found) and the titles of dialogs, alert dialogs, sheets and drawers, `text-base` for the titles of cards, empty blocks and questionnaires and for the legend of a group of fields, `text-sm` for the legend of a group inside another and for the title of the side panel, and `text-xs` for the title of a node of a graph.
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

  Each status has three tokens: the color itself for solid fills and, at 15% opacity (20% in dark mode; 35% for warning in light mode, because the orange is light), for soft fills; `-foreground` for text on the solid fill; `-strong` for status text, icons, and dots on the page and on the soft fill. Where the color itself reads well enough as text, `-strong` is `var()` of it, so only the light success and warning set a color of their own. Badge, Button, Alert, Code, Node, Edge, Marker, Progress, and Spinner take a `color` prop: `neutral`, `primary`, or a status (`success`, `warning`, `destructive`). It sets the tokens of that color through the classes in `src/shared/lib/tone.constants.ts`. Badge, Button, Alert, Code, and Node also take a `variant` for the fill, and Edge a `variant` for the line style.

  Every text token has a contrast of at least 4.5:1 on its background, each `-strong` status color at least 4.5:1 on the background, the sidebar, cards, and its own soft fill (except the light `--warning-strong`, 4.0:1 on its soft fill, kept lighter on purpose), and each `-foreground` at least 4.5:1 on its solid fill. The dark chart ramp passes the ordinal checks (hue spread within 40 degrees, monotone lightness, a step of at least 0.06 in OKLCH lightness, the step nearest the background at 2:1 or more). The light ramp passes all but the last: to stay a vivid yellow, `--chart-4` and `--chart-5` are 1.8:1 and 1.4:1 on the background, so a chart in the light theme labels its values or offers a table.

- React Flow: `styles.css` imports its stylesheet into the `components` layer, so that utility classes override it, and sets its `--xy-*` variables to the tokens. The canvas is transparent, edges use `--muted-foreground` (`--primary` when selected; `Edge` sets its own from its color), nodes and handles `--card`, and controls and the minimap `--popover`. The `flow-selected:` variant applies while a node or edge is selected or focused from the keyboard, since React Flow removes their focus outline.
- Markdown code blocks use the Shiki themes `night-owl-light` and `night-owl`, the same colors as the editor.
- Dark mode is class-based and handled by `next-themes`. Its `ThemeProvider` (in `src/providers/Providers.tsx`) sets the `dark` class on `<html>` before the page hydrates. The default theme is Dark, and the Settings page offers Light, Dark, and System. Components read the theme with `useTheme()` from `next-themes`. The stored theme is only known in the browser, so UI that depends on it must not differ between the server-rendered HTML and the first client render (see `SettingsPage.tsx`).

### Fonts

The app self-hosts its two fonts through [Fontsource](https://fontsource.org) packages, imported at the top of `src/app/styles.css`, so that the screens look the same on every system and in the screenshots of CI:

| Role                              | Font                                                          | Package                               | CSS variable                                              |
| --------------------------------- | ------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Interface, body text, headings    | [Mona Sans](https://fontsource.org/fonts/mona-sans)           | `@fontsource-variable/mona-sans`      | `--font-ui`, mapped to `--font-sans` and `--font-heading` |
| Code (`code`, `pre`, `font-mono`) | [Noto Sans Mono](https://fontsource.org/fonts/noto-sans-mono) | `@fontsource-variable/noto-sans-mono` | `--font-code`, mapped to `--font-mono`                    |

Both are open source (SIL Open Font License), variable from weight 200 to 900, and ship a `vietnamese` subset. Their lowercase letters are almost as high at the same size (x-height 0.525 and 0.536 of the font size), so code in a sentence does not look larger or smaller than the text around it. The browser downloads a subset only when the page shows a character of it. The system fonts after them in each stack show until the files load, and for a character that neither font has.

To change a font, self-host another one the same way:

1. Install the package. Prefer the variable version when it exists (`@fontsource-variable/<name>`); otherwise use `@fontsource/<name>` and import each weight.
   ```bash
   pnpm add @fontsource-variable/inter
   ```
2. Import it at the top of `src/app/styles.css`:
   ```css
   @import '@fontsource-variable/inter';
   ```
3. Put its family first in `--font-ui` or `--font-code` in `:root`, in place of the one it replaces. Variable packages register the family as `'<Name> Variable'`:
   ```css
   --font-ui:
     'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
   ```
4. Remove the import and the package of the font it replaces.

Vietnamese text needs a font that ships the `vietnamese` subset. The subsets of a package are listed on its Fontsource page and in its `files/` directory.

## Routes, Server and Client Components

- A route is a folder in `src/app/` with a `page.tsx`. The folder path is the URL: `src/app/(app)/settings/page.tsx` is `/settings`.
- `(app)` is a route group: the name in parentheses is not part of the URL. Its `layout.tsx` wraps every page of the group in the app shell, and its `error.tsx` is the error boundary for those pages. A page that must not show the app shell (for example a public landing page) goes in another group with its own layout.
- `(auth)` is the group of the pages that need no session: `/login` signs in and `/register` creates an account. `?next=` gives the page to return to afterwards.
- `src/app/` holds only routing files. A `page.tsx` renders a component from `src/features/`.
- Every endpoint except register, login and health answers 401 without a session. When a request sent with `apiRequest` or `apiCommand` (`src/shared/api/api-fetch.utils.ts`) answers 401, the query client (`src/shared/api/query-client.config.ts`) opens `/login?next=<the page>`, which returns to the page after signing in; `next` is kept only when it is a path of this app. Signing out (`UserMenu` of `features/account`) ends the session, then loads the sign-in page in full, which drops what the app kept in memory.
- Files in `src/app/` are Server Components: they render on the server and cannot use state, effects, or event handlers. A component that needs those starts with `'use client'`. Most feature components are Client Components.
- Links use `<Link href="...">` from `next/link`. `href` is type-checked against the existing routes (`typedRoutes` in `next.config.ts`); `pnpm dev` and `pnpm build` regenerate the route types.
- A library that touches `window` or `document` while it loads (PDF viewer, code editor, graph layout worker) is imported with `next/dynamic` and `ssr: false` from a Client Component.

## Frame

The frame (`Workbench`) in `src/shared/components/frame/` lays out a screen after the layout of an editor: a top bar (`TopBar`), an activity bar with one item per feature of the project (`ActivityBar`), the side panel of the feature chosen and the editor (`ProjectWorkspace`, `SidePanel`, `EditorTabs`), an optional panel under the editor (`EditorWithBottomPanel`), a status bar (`StatusBar`), and the command palette (`CommandPalette`). The frame is shared code and names no feature: a feature describes its item (`FeatureActivity` in `activities/activity.types.ts`: id, label, icon, start page, side panel) and the icons of its tabs in `<feature>-frame.config.tsx`, and a layout passes the list to `Workbench` as `activities` and `tabIcons`. `Workbench` renders the bars itself and takes, the same way, what they show from the features: the crumb of the top bar (`crumb`), and the components that register commands and items of the bars (`contributions`). The account menu is one of these items, not a prop of the frame: `AccountMenuItem` of `features/account` puts it at the bottom of the activity bar with `useActivityBarItem`. The list sets which features a screen has and their order; a feature planned for later is a `PlannedActivity`, shown disabled. A screen that passes no feature shows the account menu alone on the activity bar, and has no side panel.

The folder is split by what its parts do. Each folder keeps its own code in layers, and the root of the frame holds what several folders use: in `components/`, `Workbench`, `ProjectWorkspace` (the side panel, the tabs and the editor of a project) and `SideFeatureSplit` (the side panel of the feature chosen beside the editor); in `hooks/`, `useRestoreFrame` (reads the stored state after the first render) and `useOpenPage`.

| Folder        | Holds                                                                                                                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `activities/` | The features of the screen and which one shows its side panel: their types and context, the chosen feature (`side-feature.store.ts`), `useSideFeature`, the activity bar, and the commands that show a feature                                                                             |
| `panels/`     | The panels that the user resizes and hides, by region (`PanelRegion` and `panelLayouts` in `panel.constants.ts`, with their sizes): their size and visibility (`panels.store.ts`), `usePanel`, `EditorSplit`, the side panel and its sections, the panel under the editor and its sections |
| `tabs/`       | The editor tabs: their schema, store and pure functions, `useEditorTab` for a page, `useEditorTabs` for the strip, and the strip, which shares it with its tabs and its menu through `TabStripContext` (`useTabStrip`)                                                                     |
| `commands/`   | The command palette: the commands registered and whether it is open (`commands.store.ts`), `useCommands`, `useCommandPalette`, and the palette                                                                                                                                             |
| `bars/`       | The top bar, its crumb and logo, and the status bar: its items (`status-bar.store.ts`), `useStatusBarItem` for a feature and `useRegisteredStatusBarItems` for the bar                                                                                                                     |

| Layer     | Files                                                       | Imports                                                                                     |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Pure      | `*.types.ts`, `*.constants.ts`, `*.utils.ts`, `*.schema.ts` | Other pure files and `shared/lib`; no React code, no zustand                                |
| Store     | `*.store.ts`                                                | Pure files; no other store and no hook                                                      |
| Hook      | `hooks/use*.ts`                                             | Stores, pure files, other hooks, the router and the context of the activities; no component |
| Component | `components/*.tsx`                                          | Hooks and pure files; a store only for its types                                            |

A store belongs to the hooks of its folder; the hooks of another folder and of the root use those hooks, except `useRestoreFrame` and `useOpenPage`, which reach the stores of several folders. Between folders, hooks and components import in one direction, each folder only the ones after it: the root, `tabs/` and `bars/`, `activities/`, `panels/`, `commands/`. The old shell (`AppShell.tsx`, `app-sidebar/`) keeps its place until the project frame replaces it. Code outside the folder imports the frame from `@/shared/components/frame`, its `index.ts`, which gives components, hooks and types but no store; files inside the folder import each other with relative paths. Server Components such as the layouts of `src/app/` import the index too, so every hook it gives starts with `'use client'`. ESLint reports an import of a file inside the folder from outside it, and an import that a layer does not allow.

The regions of the frame do not scroll: the editor, the panel under it, and the main area of a screen without features only clip what they hold. A page or a panel whose content flows scrolls itself with a `ScrollArea` (`h-full`); one that fills its region, such as a graph, sizes itself with `h-full` and scrolls its own parts. A `ScrollArea` cannot hold content that fills it, because Radix wraps its content in an element without a height.

The command palette lists the commands that the components on screen register with `useCommands`: each has an id, a label and a group, and may have an icon, a hotkey and `run` (without it, the command is a line of information, such as while a list loads). A component registers the commands that act on it, so they leave with it: `CommandPalette` registers its own (Show all commands, on `Ctrl+K`), `SideFeatureSplit` the one that hides the side panel, and `EditorWithBottomPanel` the one that hides the panel under the editor. A hotkey runs its command while the command is registered, and the palette shows it next to the label. Commands that belong to no page are registered by components that render nothing, which a layout passes to `Workbench` as `contributions`. The groups are listed in alphabetical order.

The status bar has two sides, each a `Stack` of items: the left one, for what the screen reports about its work, takes the free width and cuts what does not fit; the right one, for what the page on screen reports, ends with the notifications. A component shows an item with `useStatusBarItem({ side, order, content })` while it is mounted, so the item leaves with it, as a command does: a page reports about itself, and what belongs to no page, such as the run of the project, comes from a component in `contributions`. The items of a side go from the lowest `order` to the highest. The content renders in the status bar, so it reads the providers of the app and of the frame, not those of the component that registers it; the items show after the first render.

A side panel (`SidePanel`) holds the parts of its feature in sections (`SidePanelSection`): each collapses to its title, may have actions at the right of its title, shown while the pointer is over the title and always on a touch screen, and a line divides it from the next one. `Ctrl+B` hides the side panel with the `Activity` component of React instead of unmounting it, so the panel keeps its state, such as the text of a search or a collapsed section, and the group of resizable panels gives it back its last width. The panel under the editor (`EditorWithBottomPanel`) hides the same way, and the editor keeps its state while the panel is hidden and shown. Its content is split into sections (`BottomPanelSection`), one tab each (`BottomPanelSections`, the line tabs of shadcn/ui); the actions of the section shown and the button that hides the panel sit at the end of the tabs. A section that another one replaces on screen is hidden with `Activity` too, so it keeps its state.

| Shortcut     | Action                                                                       |
| ------------ | ---------------------------------------------------------------------------- |
| `Ctrl+K`     | Open or close the command palette (also the search box of the top bar)       |
| `Ctrl+B`     | Hide or show the side panel (also the activity bar item of the open feature) |
| ``Ctrl+` ``  | Hide or show the panel under the editor (also its button)                    |
| Middle click | Close an editor tab                                                          |

`Cmd` works in place of `Ctrl` on macOS, where the shortcuts shown name `Cmd` (`useModifierKeyName`), except for ``Ctrl+` ``: macOS keeps ``Cmd+` `` to switch windows.

A feature opens a page of another feature together with the side panel of that feature with `useOpenPage()`, which finds the feature from the address, so the feature that opens it names neither the other feature nor its id.

The editor tabs belong to the project, not to a feature: choosing a feature on the activity bar changes the side panel only. A page opens its tab with `useEditorTab` and may name an icon, such as `artifacts.item` (a feature starts the names of its icons with its own name); the tab shows that icon from `tabIcons`, else the icon of the feature the page belongs to. The active tab is the one that the page on screen opened, whatever its address holds, such as a query. A new tab opens next to the tab shown last, and a tab shows its close button when it is active or under the pointer, and always on a touch screen.

### Browser storage

The size and visibility of the regions and the open editor tabs are device-local state, kept in the browser by the zustand stores `panels/panels.store.ts`, `activities/side-feature.store.ts` and `tabs/editor-tabs.store.ts` with the `persist` middleware; `useRestoreFrame` reads them after the first render. Browser storage is read and written only through `src/shared/lib/browser-storage.utils.ts` (ESLint reports any other use of `localStorage` or `sessionStorage`):

- `storageKey(name)` names a key: every key starts with the name of the app.
- `browserStorage` reads and writes keys, and fails quietly where storage is missing, blocked or full.
- `persistStorage()` is the storage of a persisted store. With `ready`, it drops writes until the store has read what was stored: the frame stores read after the first render, so that the server HTML matches the first client render, and `persist` writes on every change.
- `parseStored()` checks stored state with a Zod schema before a store uses it, so that a value of an older version of the app is dropped instead of breaking the store.

`next-themes` keeps its own copy of the theme in the browser, inside the library.

## Low-memory development

Measured on this project with a warm cache: the dev server uses about 300 MB when idle and about 700 MB right after compiling a page.

Already configured in `next.config.ts`:

| Setting                                                        | Effect                                                                                                                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `turbopack.root`                                               | Only this folder is resolved and watched, not the rest of the monorepo.                                                                                                |
| `experimental.turbopackPluginRuntimeStrategy: 'workerThreads'` | PostCSS runs in worker threads instead of a pool of child Node.js processes.                                                                                           |
| `experimental.preloadEntriesOnStart: false`                    | `pnpm start` loads a page's modules on its first request instead of loading every page at start-up.                                                                    |
| `experimental.turbopackSourceMaps: false`                      | `pnpm dev` writes no source maps, which saves memory and compile time; stack traces and the browser devtools show the compiled code. Set it to `true` while debugging. |

Turbopack compiles a route only when it is first requested, and releases memory on its own after each compile (`experimental.turbopackMemoryEviction`, default `auto`).

Habits that help:

- Run one heavy process at a time: `pnpm dev`, `pnpm build`, `pnpm e2e`, `pnpm screenshots`, and `pnpm check` are each heavy.
- Keep `.next/`: it holds the compile cache, and the first compile after deleting it is slow and peaks above 1 GB.
- Restart `pnpm dev` after a long session if its memory keeps growing.
- `pnpm lint` runs ESLint in four processes, one after another (`scripts/lint.mjs`): the design system page, the other features, the rest of `src/`, then everything outside `src/` (the tests, the scripts and the config files). Each process builds a TypeScript program of its group only (its files, what they import, and the declarations every file needs), through a tsconfig written to `node_modules/.cache/lint-groups/` and passed in `ESLINT_TSCONFIG`. With `NODE_OPTIONS=--max-old-space-size=768`, the largest group peaks at about 930 MB of resident memory and the whole run takes about 55 seconds; a single ESLint process for the whole project runs out of that heap. When a group grows past the limit, split it in `scripts/lint.mjs`.
- `eslint.editor.config.js` is a variant of the ESLint config for the editor: it leaves out the rules that need type information. Those rules load the whole TypeScript project and are the most memory-hungry part of the editor setup. To use it in VS Code, set `"eslint.options": { "overrideConfigFile": "eslint.editor.config.js" }` and `"eslint.workingDirectories": [{ "directory": "frontend", "changeProcessCWD": true }]` in your workspace settings (`.vscode/` is git-ignored), then restart the ESLint server after every change to `eslint.config.js`. The type-aware rules still run in `pnpm lint` and `pnpm check`.
- In VS Code, exclude build output from the editor's file watcher and search, and cap the TypeScript server, in your user or workspace settings:
  ```json
  {
    "files.watcherExclude": { "**/.next/**": true, "**/node_modules/**": true },
    "search.exclude": { "**/.next": true },
    "typescript.tsserver.maxTsServerMemory": 2048
  }
  ```

## API client

- A feature calls the API through its `<feature>.api.ts`, with `apiRequest` or `apiCommand` of `src/shared/api/api-fetch.utils.ts`, and its hooks name their queries with the key factory of `<feature>.keys.ts`. An answer with an error status throws an `ApiError` of `api-error.utils.ts`: the status, the `code` of the body (the stable value to branch on), the field problems, and a message. `api-error.constants.ts` lists the statuses (`HttpStatus`) and the codes (`ApiErrorCode`) of the API. The query client retries a failed query once unless the answer was a 4xx, and opens the sign-in page on a 401.
- The typed API client in `src/shared/api/generated/` is generated by `pnpm codegen` from `frontend/openapi.json`, which the backend exports (`just codegen` at the repo root runs both steps). Both are committed and never edited by hand. The schema file does not exist yet, so `pnpm codegen` fails until the backend is in place.
- `openapi-ts.config.ts` already asks for a fetch client whose calls throw on an error status, and zod checks of the answers. It generates no query options or query keys: the keys stay in `<feature>.keys.ts`, where they keep their hierarchy for invalidation, and the generated query options read the request from their own key. When the first client is generated:
  1. Configure the generated client once, where the providers start: `client.setConfig({ baseUrl: window.location.origin })`, as `apiUrl` does, and an error interceptor that returns `toApiError(response.status, error, ...)`, so that components, the query client and the tests still receive an `ApiError`.
  2. Replace the body of each `<feature>.api.ts` with the generated call, and remove the hand-written schemas of `<feature>.types.ts`. The hooks and their keys stay as they are.
  3. Remove `api-fetch.utils.ts` once no feature calls it.

## Mock data

All mock code lives in `src/mocks/`, in one folder per part of the API, named like the backend feature that serves it. A file may read the data of another folder, as the resources of the API refer to each other; `shared/` holds what every handler uses.

```text
src/mocks/
├── msw-browser.setup.ts  # the handlers of the browser worker (dev mocking, E2E)
├── msw-server.setup.ts   # the handlers of the unit tests
├── shared/               # records, ids, scenarios, pages of a list, error answers
├── account/              # /auth, /me
├── projects/             # /projects
├── threads/              # threads
└── runs/                 # runs, the stream
```

Each folder holds a pair of files per API resource:

| File                     | Content                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `<resource>.fixtures.ts` | The data: typed with the feature's types, fixed values only (no random ids, no current time). |
| `<resource>.handlers.ts` | MSW handlers that answer the endpoints of that resource with the fixtures.                    |

The same handlers serve `pnpm dev:mock`, the unit tests, and the E2E tests, so a fixture is written once. Example: `threads/threads.fixtures.ts` and `threads/threads.handlers.ts` back `GET /api/v1/threads` and `GET /api/v1/projects/{project_id}/threads`.

| Resource     | Endpoints                                                                                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projects`   | `GET /projects`, `GET /projects/{project_id}`, `POST /projects`                                                                                                   |
| `threads`    | `GET /threads`, `GET /projects/{project_id}/threads`, `GET /threads/{thread_id}`                                                                                  |
| `runs`       | `GET /threads/{thread_id}/runs`, `GET /runs/{run_id}`, `GET /runs/{run_id}/steps`, `POST /runs/{run_id}/cancel`, and `POST /threads/{thread_id}/runs` of the chat |
| `run-stream` | `GET /runs/{run_id}/stream` (browser only)                                                                                                                        |
| `auth`       | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, and a 401 for every other endpoint without a session                                              |
| `me`         | `GET /me`                                                                                                                                                         |

- The ids of the mock data are in `shared/mock-ids.constants.ts`; each starts like the id of the same record in the API examples.
- The mock server keeps the session, the user, the projects that `POST` creates and the runs that are stopped as records (`shared/mock-db.utils.ts`). The browser worker keeps them in browser storage, so they survive a reload; `?mock-reset` in the page address starts again from the fixtures. Unit tests keep them in memory, and the test setup resets them after each test.

To mock a new endpoint:

1. Add the data to `src/mocks/<folder>/<resource>.fixtures.ts`, typed with the type from `src/features/<feature>/`.
2. Add the handler to `src/mocks/<folder>/<resource>.handlers.ts` and export the handler list.
3. Register the list in `msw-browser.setup.ts` (dev mocking, E2E) and `msw-server.setup.ts` (unit tests).
4. In a test that needs other data or an error, override the handler for that test only with `server.use(...)`; it is reset after each test.

### Mock scenarios

A handler can answer differently depending on a parameter in the page URL, so every state of a screen can be seen in `pnpm dev:mock`. The parameter name is `mock-<resource>`: `?mock-threads=error` makes the threads handlers answer with an error. A handler reads it with `mockScenario('<resource>')` from `src/mocks/shared/mock-scenario.utils.ts` and supports the scenarios `empty`, `error`, and `loading`; without the parameter it returns the fixtures. For an endpoint that returns one record, `empty` answers 404. Scenarios that are not a query state, such as the state of a run, read their own parameter, for example `?mock-run-state=failed`.

The parameters and the address of every state of every screen are listed in [Mock scenarios](src/mocks/README.md). Add the addresses of a screen there when the screen is built.

Components never import fixtures. They call the API functions of their feature, and MSW answers the request, so switching to the real backend changes no component code. Handlers that need a browser-only API (the SSE stream) are registered only in `msw-browser.setup.ts`.

### Screenshots

`pnpm screenshots` takes a screenshot of each state of each page, in each window below and in each theme, into `screenshots/<window>-<theme>/`. Each page has a spec in `tests/screenshots/` (`account`, `design-system`) with the list of its states: the steps from a new browser page to the state, such as an address of [Mock scenarios](src/mocks/README.md), then a submit that shows the errors of a form. A state that changes one part of the page, such as the status bar, is taken as that part alone. A file is named `<page>--<number>-<state>.png`, so that the files of a page sort in the order of its states.

| Window   | Size in CSS pixels                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `wide`   | 1920 by 1080                                                                                                               |
| `laptop` | 1536 by 730, a laptop screen of 1920 by 1080 at a scale of 125% in a maximized browser, at 1.25 image pixels per CSS pixel |
| `small`  | 1024 by 768                                                                                                                |
| `phone`  | 412 by 839, the Pixel 7 of Playwright: a touch screen, at 2.625 image pixels per CSS pixel                                 |

Each window is taken in `light` and in `dark`, as a Playwright project named `<window>-<theme>`. `--project` picks some of them, with `*` for any part of the name, and `--grep` picks states by the name of their page and their own:

```bash
pnpm screenshots --project 'laptop-*' --grep 'Account'
```

On a developer machine it runs one browser at a time. It needs the browser of `pnpm e2e:install`, and starts the same dev server with mocks as `pnpm e2e`, on port 3100, unless a server runs there already. To keep the dev server you work with, start it on that port instead of 3000: `pnpm dev:mock --port 3100`.

To see the screens without running them on your machine, let the workflow Frontend screenshots take them on GitHub, then download them:

```bash
gh workflow run frontend-screenshots.yml --ref <branch> -f projects='laptop-* phone-dark'
gh run list --workflow frontend-screenshots.yml --limit 1   # the id of the run
gh run download <run-id> --name screenshots --dir screenshots
```

`projects` takes the names of the projects, separated by spaces; without it, the workflow takes every window and theme. `gh workflow run` finds the workflow once it is on `main`. On a pull request, add the label `screenshots` instead: the workflow takes every window and theme then, and again at each push while the label stays. GitHub keeps the screenshots for 7 days.

## Troubleshooting

| Symptom                                                                                       | Cause and fix                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Requests to `/api` hang or fail                                                               | The backend is not running on port 8000. Use `pnpm dev:mock`.                                                                                                                                          |
| `Another next dev server is already running`                                                  | `pnpm dev`, `pnpm e2e` and `pnpm screenshots` cannot each start a dev server in this folder at the same time. Stop the first one, or run it with `pnpm dev:mock --port 3100`, which the other two use. |
| `You're importing a component that needs useState` (or another hook)                          | The file uses a client-only API. Add `'use client'` as its first line.                                                                                                                                 |
| `You're importing a module that depends on useEffect into a React Server Component module`    | A Server Component imports an index that gives a hook without `'use client'`. Add `'use client'` as the first line of the hook file.                                                                   |
| A hydration mismatch warning in the browser console                                           | A component rendered something on the server that differs in the browser (theme, `localStorage`, window size). Read that value in an effect.                                                           |
| `pnpm lint` reports import order errors in `src/shared/components/ui/` after a shadcn command | Run `pnpm fix`.                                                                                                                                                                                        |
| `pnpm e2e` fails with a missing browser executable                                            | Run `pnpm e2e:install` once.                                                                                                                                                                           |
| A heading shows mixed fonts in Vietnamese text                                                | The heading font lacks the `vietnamese` subset, see [Fonts](#fonts).                                                                                                                                   |
