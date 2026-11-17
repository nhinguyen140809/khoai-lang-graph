# Web App Views (draft for discussion)

How the web app serves two readers with two different frames: the developer view, which is the workbench of today, and the user view, a chat frame for a user who is not technical. This page is a draft: every decision is marked "Proposed" until we decide it here. Edit it freely; add your notes under "Discussion" of each decision.

It was written after reading the code of `feat/fe/activity-and-ratings` (the frame, the view provider, the routes, the module `activity`), [Web App](web-app.md) and [Web App Modules](web-app-modules.md).

## Contents

- [1. Method and decision drivers](#1-method-and-decision-drivers)
- [2. Context: what the code has today](#2-context-what-the-code-has-today)
- [3. Requirements](#3-requirements)
- [4. Decision 1: the domains](#4-decision-1-the-domains)
- [5. Decision 2: one app or two](#5-decision-2-one-app-or-two)
- [6. Decision 3: how a host reaches its screens](#6-decision-3-how-a-host-reaches-its-screens)
- [7. Decision 4: the routes of each view](#7-decision-4-the-routes-of-each-view)
- [8. Decision 5: where the view comes from, and the wording](#8-decision-5-where-the-view-comes-from-and-the-wording)
- [9. Decision 6: the two frames](#9-decision-6-the-two-frames)
- [10. Decision 7: reusing the chat of Activity](#10-decision-7-reusing-the-chat-of-activity)
- [11. Decision 8: what the user view shows of documents and reviews](#11-decision-8-what-the-user-view-shows-of-documents-and-reviews)
- [12. Order of work](#12-order-of-work)
- [13. Development, tests and cost](#13-development-tests-and-cost)
- [14. Open questions](#14-open-questions)
- [15. Decision record](#15-decision-record)
- [16. Review checklist](#16-review-checklist)

---

## 1. Method and decision drivers

Each decision follows the same pattern: requirements, options, evaluation, decision, trade-offs. The decisions are in the order of how hard they are to undo: a public address first, a folder name last.

The drivers, from the most important:

| Driver | Meaning |
|---|---|
| D1. Two frames, one product | The two views differ in the whole frame, not in a few labels. No component branches on the view to choose its layout |
| D2. Reuse below the frame | Entities, features and the chat are written once. A view chooses which widgets it places |
| D3. Short addresses | No `/dev` or `/user` in an address that a person sees |
| D4. Free to differ | A view can add, drop or rename a route without touching the other |
| D5. Light on the machine | One dev server, one build, one typecheck (2 cores, 8 GB, Node heap 768 MB) |
| D6. Small steps | The move can ship as small PRs, and the first one changes nothing on screen except the words |

## 2. Context: what the code has today

| Part | Today | What it means for two views |
|---|---|---|
| View | `shared/lib/view/`: `views = ['user', 'developer']`, `Wording = Record<View, string>`, `ViewProvider` with the default `user`, mounted once in `providers/Providers.tsx` | The view is a global value with a fixed default. Nothing sets `developer` yet |
| Wording | About 20 `constants` files hold a `Wording` for each value (run status, stage status, item status, value labels, ...). The sentences of the widgets (`activityChatMessages`, ...) are plain strings in the words of the user view | The values already have both words. The sentences have one |
| View as behavior | Five places in `activity` branch on the view for content, not for words: `useRunEntries` and `activity-entries.utils.ts` (a phase without a stage title is dropped in the user view), `PhaseEntryView` (stage title or node ids), `WrittenEntryView`, `RunActivity`, `ProgressSection` | The chat already knows how to be shown to two readers |
| Frame | `shared/components/frame/`: `Workbench` (top bar, activity bar, side panel, tabs, status bar, command palette), filled by `src/app/` through `crumb`, `destinations` and `contributions` | The frame holds no object of the product. A second frame can be filled the same way |
| Routes | `app/(auth)`, `app/(home)`, `app/(project)/projects/[projectId]/...`; `shared/routes/` writes every address once, checked by `typedRoutes` | One area. A page file is 5 to 15 lines: it places a widget |
| Chat | `activity/widgets/chat`: `ActivityPage` registers an editor tab (`useEditorTab`) and then draws the chat. `MessageEntry`, `WrittenEntryView` and `PendingReview` open a document or an item with `useOpenPage` of the frame and `routes.project(id).document(...)` / `.item(...)` | Three couplings to the workbench: the tab, the opener, and the addresses of pages that the user view will not have |
| Session | httpOnly cookie, `Secure`, `SameSite=Lax`, set by the login endpoint. The browser calls `/api` on its own origin; Next.js rewrites it to the backend. The stream is an `EventSource` with the same cookie | The cookie belongs to one host unless the backend sets its `Domain` |
| Server | No `proxy.ts` (the file that Next.js 16 runs before a request, called `middleware.ts` before). Next.js 16.3, `cacheComponents: true`, `typedRoutes: true` | Nothing reads the host today |

## 3. Requirements

- R1. The developer view is the workbench of today, with every route it has today.
- R2. The user view has its own frame, close to a chat app: a list of projects (or conversations) on the side, the chat in the middle. Documents and Trace are not in its navigation.
- R3. The user view reuses the chat of `activity`: the entries of a run, the pending review, the prompt, the stream.
- R4. Each view has its own host. The path does not name the view.
- R5. The routes of the two views can be the same or differ in places.
- R6. The words of a value can differ by view. The words of the user view start as a copy and are refined once we know which screens a user reaches.
- R7. Access is decided by the backend, never by the host: a host is a way to show the data, not a permission.

## 4. Decision 1: the domains

**Options**

| Option | Example | Session | Cost |
|---|---|---|---|
| A. Two registrable domains | `khoai.dev` and `khoai.ai` | Two sessions. A cookie cannot be shared between two registrable domains, so a person signs in once on each | Two domains, two certificates |
| B. Two hosts of one domain | `khoai.ai` (user) and `dev.khoai.ai` (developer) | One session if the backend sets `Domain=khoai.ai` on the cookie; two sessions if it leaves the cookie host-only | One domain, one wildcard certificate |
| C. One host, a path prefix | `khoai.ai/dev/...` | One session | One domain. Rejected by R4 |

**Evaluation**

- In A and B alike, each host calls `/api` on itself, so the cookie stays first-party, `SameSite=Lax` holds, and the CSRF check and the `EventSource` need no change.
- B makes a link from one view to the other work without a second login ("Open in the developer view" on a run that failed). A needs a login on the other side.
- B with a shared cookie means a script on one host can act for the session on the other. Both hosts serve our own code, so this adds no party we do not trust.
- A reads better as a brand, and can still be added later: a second domain that points at the same app is a new entry in the host table of Decision 3.

**Decision (Proposed):** B, with `khoai.ai` for the user view and `dev.khoai.ai` for the developer view, and the session cookie on the parent domain. The names are placeholders.

**Trade-offs:** the cookie `Domain` becomes a deployment setting of the backend. Local development has no parent domain (see [section 13](#13-development-tests-and-cost)).

**Discussion**

- (your notes)

## 5. Decision 2: one app or two

**Options**

| Option | What it is | D2 reuse | D5 machine | D4 differ |
|---|---|---|---|---|
| A. Two apps in a workspace | `apps/dev`, `apps/user`, and `modules/` + `shared/` moved to packages | Good, after the move to packages | Two dev servers to see both, two builds, two typechecks. The move touches every import | Full |
| B. One app, built twice | A build variable chooses the page files (`pageExtensions`: `page.dev.tsx`, `page.user.tsx`) | Good | Two builds, two route type sets, two dev servers to see both | Full |
| C. One app, one build, two areas | Both route areas in one `src/app/`; the host chooses the area at request time | Good, nothing moves out of `src/` | One of each | Full |
| D. One app, one area | Each layout and page reads the host and draws one of two frames | Good | One of each | Poor: a route that one view lacks needs a guard, and every layout branches |

**Evaluation**

- A and B keep the code of one view out of the bundle of the other. C does nearly the same for free: Next.js splits the code by route, so the browser of a user never loads the workbench, the graph or the tabs.
- D breaks D1: the layout of a project would import both frames and choose, and reading the host in a layout makes the route dynamic.
- C fits how the code is already cut: the app layer only places widgets, so a second area is a second set of small layout and page files.

**Decision (Proposed):** C.

**Trade-offs:** both areas ship in one deployment, so the user host can never be deployed alone. A person who knows the developer host can open it; that is fine under R7.

**Discussion**

- (your notes)

## 6. Decision 3: how a host reaches its screens

**Requirement:** `dev.khoai.ai/projects/1/activity` and `khoai.ai/projects/1` are served by two different areas, and neither address names the view.

**Options**

| Option | How |
|---|---|
| A. `rewrites` of `next.config.ts` with `has: [{ type: 'host' }]` | Static rules: a request to the developer host is rewritten to `/developer/:path*`, the others to `/user/:path*` |
| B. `src/proxy.ts` | Code that reads the host, finds the view in a table, and rewrites the path to the area of that view |

In both, the area is a real top folder that the address bar never shows:

```text
src/app/
├── layout.tsx                 # html, body, Providers
├── (auth)/                    # login, register: the same on both hosts, not rewritten
├── developer/                 # the area of today, moved with git mv
│   ├── layout.tsx             # <ViewProvider value="developer">
│   ├── (home)/                # projects, settings (Workbench + UntabbedWorkspace)
│   └── (project)/projects/[projectId]/...
└── user/
    ├── layout.tsx             # <ViewProvider value="user">
    ├── (home)/                # the start page with the prompt, settings
    └── (project)/projects/[projectId]/page.tsx   # the chat
```

**Evaluation**

- B can do two things A cannot: answer not found for a direct request to `/developer/...` or `/user/...`, so each page has one address; and keep the host rule in one typed, tested helper.
- A has no code to run and no file to test.
- In the browser, `usePathname`, `Link` and the stored tabs all see the public path, so the frame code that compares addresses keeps working.

**Decision (Proposed):** B. The proxy is the only file that knows hosts. It skips `/api`, `/_next`, the static files and the auth pages.

**Trade-offs:** one more moving part on every request. The proxy must stay free of data reads.

**Spike (2026-11-11), on `feat/fe/activity-and-ratings`, dev server with mocks.** The area of today moved under `app/developer/`, a two-page `app/user/`, and a `proxy.ts` of 20 lines that rewrites by host:

| Check | Result |
|---|---|
| `localhost:3111/` and `/projects/abc` | The user area answers |
| `dev.localhost:3111/` | Redirects to `/projects`, then the workbench with the project table |
| `localhost:3111/projects` (a page only the developer area has) | 404 |
| `/developer/projects` asked directly | 404 |
| `/login` on both hosts | The same page, not rewritten |
| A click on a link, on each host (headless browser) | The address stays without a prefix; the RSC request of the navigation goes to the public path and the proxy rewrites it; the tabs of the workbench work |
| Cost of the proxy | 1 to 2 ms per request |

Covered afterwards, in the build of the setup itself: a production build passes, the pages stay static or partly prerendered, and the prefetch of a link asks the address without the folder and gets 200 through the proxy. The dev error "Could not validate that a segment in your UI has instant navigation", which showed for `developer/(home)/layout.tsx` and for the user area. showed before the move too: with the mocks, the provider that starts them renders nothing on the server, so every layout and page must set `export const instant = false`, and some did not. They do now.

**Discussion**

- (your notes)

## 7. Decision 4: the routes of each view

**Proposed routes**

| Page | Developer host | User host |
|---|---|---|
| Start | `/` -> `/projects` | `/`: a prompt that starts a project; the projects are in the side list |
| Projects | `/projects` (table) | The latest in the side list of the frame, with View all to `/recents`: every project, with the tabs Active and Archived and a search |
| A project | `/projects/[id]` -> `/projects/[id]/activity` | `/projects/[id]`: the chat |
| Documents, items | `/projects/[id]/documents/...`, `/projects/[id]/items/[itemId]` | None at first (see [Decision 8](#11-decision-8-what-the-user-view-shows-of-documents-and-reviews)) |
| Trace | `/projects/[id]/trace/...` | None |
| Settings | `/settings` | `/settings`, with fewer sections |
| Login, register | `/login`, `/register` | The same pages |
| Design system | `/design-system` | None |

**The address helper.** With two areas, `typedRoutes` knows `/developer/projects/[projectId]/activity`, but a link must carry `/projects/1/activity`. Options:

| Option | How | Cost |
|---|---|---|
| A. Two route maps | `shared/routes/` gives `developerRoutes` and `userRoutes`. Each leaf still writes its whole path through `checkedRoute`, which checks the path with the folder of the area and returns it without | The one cast that exists today stays in `typed-route.utils.ts`. `Link href` no longer rejects a hand-written path, so the lint rule "addresses come from `routes`" carries the check |
| B. Turn `typedRoutes` off | Plain strings | Loses the check that a page exists |

**Decision (Proposed):** A. Code that belongs to one frame imports the map of that frame. Code shared by both frames (the chat) imports neither: it gets what it needs from the app layer ([Decision 7](#10-decision-7-reusing-the-chat-of-activity)).

A link across views is an absolute address: `hostOf(view)` from the env config, plus a path of the other map.

**Trade-offs:** two maps to keep. The map of the user view starts with about four entries.

**Discussion**

- (your notes)

## 8. Decision 5: where the view comes from, and the wording

**The view.** It stops being a setting. Each area states its view in its root layout (`<ViewProvider value="developer">` in `app/developer/layout.tsx`), so no component reads the host and nothing becomes dynamic. `Providers` no longer mounts `ViewProvider`; the auth pages take the default.

**The wording (Decided).** The constants are rewritten:

1. The words that the screens show today, the `user` column of each `Wording` and the sentences of the widgets, become the words of the developer view, since the workbench that shows them becomes the developer view.
2. The user view starts with the same words. Each text is refined when its screen is allowed in the user view, since we do not know yet which texts a user reaches.
3. The `developer` column of today ("Queued", "Waiting for review", node ids in a phase title) is replaced by step 1. None of it is kept, and neither is the content that only the developer view showed: thinking notes, the run number, the phases of internal stages, node ids as the title of a phase, the items written listed by key and version, and the key of a subject in Progress.

**Options for the shape of a `Wording` after the rewrite**

| Option | How | Trade-off |
|---|---|---|
| A. Keep `Record<View, string>` | Every entry writes the same text twice until it is refined | Nothing changes in the type or its readers. Nothing tells a refined text from a copy |
| B. `user` optional | `{ developer: string; user?: string }`; `useWording` falls back to `developer`. The rewrite moves each `user` text of today to `developer` and drops the key | "The same for now" is the absence of a key, and a search for entries without `user` lists what is not refined. `satisfies Record<..., Wording>` no longer forces a user word for a new value |
| C. Plain strings, and a `Wording` only where the views differ | A constant is a string until its user text differs | Smallest files. Each refinement changes the type of a constant and its readers |

**Decision (Decided, 2026-11-11):** B, and none of the developer words of today is kept (they stay in the history of the repository). The sentences of a widget that only the workbench places (`documents`, `traceability`, `activity/widgets/panel`) stay plain strings; a text of a shared slice (chat, review answer, send message) becomes a `Wording` when its user text is refined.

**Trade-offs:** the system words of the `developer` column of today are lost unless point 3 keeps some. The rewrite touches about 20 `constants` files and their tests in one PR, with no change on screen.

**Discussion**

- (your notes)

## 9. Decision 6: the two frames

**Requirement:** the frame of the user view is a second frame, not the workbench with parts hidden.

**Proposed**

- `shared/components/frame/` keeps the workbench as it is. Its `index.ts` already hides the stores.
- A second frame in shared code, filled by `src/app/user/` the way `Workbench` is filled: slots for the side list, the header and the content, plus `contributions` for dialogs and commands. It names no object of the product. Working name: `ChatFrame`.
- What the two frames can share without change: `AuthScreen`, `LogoMark`, the command palette with `useCommands`, `shared/components/prompt/`, `shared/components/feed/`, `shared/components/state/`.
- What stays in the workbench only: tabs, activity bar, side panel, status bar, `useOpenPage`, `useEditorTab`.

**Folder options**

| Option | Layout |
|---|---|
| A. Two sibling folders | `shared/components/frame/` (workbench) and `shared/components/chat-frame/` |
| B. One folder, two sub-frames | `shared/components/frame/workbench/`, `frame/chat/`, `frame/common/` (palette, logo, auth) |

**Decision (Proposed):** A first, since it moves no file; B when the common part grows past the palette.

**As built (2026-11-17):** one folder, `shared/components/frame/`, holds both frames by part, the way the workbench was already cut: `layouts/` has `Workbench` and `Desk`, the frame of the user view, named as the workbench is, by what it is; `bars/` has the bars of both, and `sidebar/` the side list of the desk beside `panels/` and `tabs/`. The bar of the desk holds no content of its own: the pages place their items in it, as in the status bar. The index gives both frames; ESLint lets the user area import only the names of the desk, and keeps them out of the developer area.

**New widgets for the user frame** (in the modules that own the objects):

| Widget | Module | What it is |
|---|---|---|
| The side list of projects with "New project" | `project/widgets/sidebar` (name to choose) | Reads `project` entities and the features `create`, `rename`, `archive`, `delete` that exist |
| The start page with the prompt | `project/widgets/start` or the page of today reused | `PromptInput` is shared already |
| The account menu | `user/widgets/menu` | Exists; it registers on the activity bar today, so it needs a second place to render |

**Guard:** an ESLint rule that `src/app/user/**` does not import `documents`, `traceability`, `activity/widgets/panel` or the workbench, in the style of `moduleImports`.

**Discussion**

- (your notes)

## 10. Decision 7: reusing the chat of Activity

**Requirement:** one chat, placed in two frames.

**The three couplings and a fix for each**

| Coupling today | Fix |
|---|---|
| `ActivityPage` calls `useEditorTab` and then draws the chat | Split it: `ActivityChat` (thread, runs, scroller, pending review, prompt) knows no frame; `ActivityPage` stays as the tab of the workbench and renders `ActivityChat`. The user page renders `ActivityChat` in `ChatFrame` |
| `MessageEntry`, `WrittenEntryView`, `PendingReview` call `useOpenPage` and build `routes.project(id).document(...)` / `.item(...)` | The chat takes "what happens when a reference is chosen" from the app layer: a prop of `ActivityChat` carried by `RunActivityContext`, such as `openReference(ref)`. The developer page gives the opener of the workbench. The user page gives its own, or none, and then a reference shows as text |
| `ActivityPrompt` shows the run settings button; `ActivityDialogs` is mounted by the project layout | A slot or a flag on the prompt. The user view probably hides the run settings and uses the defaults |

**What already works for both:** `useRunEntries` and the entry components branch on `useView()` for content, and the view now comes from the area, so the user view gets stage titles and the developer view gets node ids with no new code.

**Options for the place of the chat**

| Option | Where | Note |
|---|---|---|
| A. Keep it in `activity/widgets/chat` | As today, with the split above | Smallest change. `activity` then means "the chat and its workbench panel" |
| B. A module `chat` under `activity` | `chat` holds the entries and the chat widget; `activity` keeps the panel (Progress, Outline) and the tab | Clear names, but a new module in `moduleImports` and a move of about 25 files |

**Decision (Proposed):** A. Move to B only if the user view grows chat parts that the workbench does not want.

**Trade-offs:** the chat gets one more input from above. In exchange, it stops importing the frame and the routes, which also makes it easier to test.

**Discussion**

- (your notes)

## 11. Decision 8: what the user view shows of documents and reviews

This is a product question more than a code question, and it decides how much of Decision 7 is needed. A checkpoint asks the person to review the personas, the analysis or the specification. In the workbench the review links to the document. If documents are hidden, the user view needs another way to show what is under review.

**Options**

| Option | What the user sees | Code it needs |
|---|---|---|
| A. Nothing but the chat | The agent's summary in the message, the options and the questions | None. A review of a document the person cannot read is weak |
| B. A read-only sheet beside the chat | Choosing a reference opens the document in a panel that slides over, with no tree, no tabs, no Trace | `artifact/entities/components` already draw a document and an item. A small widget and the `openReference` of Decision 7 |
| C. A plain page | `/projects/[id]/documents/[artifactId]` on the user host, read-only | One route in the user area and the same views |
| D. A link to the developer host | The reference opens the workbench | Only the cross-view link. Breaks the idea of a simple view |

**Decision (Decided):** B, a read-only sheet that opens beside the chat. Editing items before answering (`allow_edits`) stays in the developer view until we see a user ask for it.

**Also to decide:** how the user gets the result at the end (an export button in the chat when the run is done would reuse `artifact` exports).

**Discussion**

- (your notes)

## 12. Order of work

Each step is one PR and leaves the app working.

| Step | Change | What changes on screen |
|---|---|---|
| 1 | Spike of Decision 3 (done, see its results there) | Nothing (not merged) |
| 2 | `proxy.ts` with the host rule; `git mv` the area of today under `app/developer/`; `developerRoutes`; `ViewProvider` in the area layout; the constants rewritten as in Decision 5 | Nothing: the developer view reads the words of today |
| 3 | Split `ActivityChat` from `ActivityPage`; `openReference` through the context; the prompt slot | Nothing |
| 4 | `ChatFrame`, the side list, `app/user/` with the start page and the chat of a project; `userRoutes` | The user host exists |
| 5 | The read-only sheet of Decision 8 beside the chat | A reference of the chat opens its document |
| 6 | Settings of the user view; cross-view link; the export at the end of a run; refine the user words of each screen as it is allowed | Step by step |

Docs to update with step 2: [Web App Modules](web-app-modules.md) sections 1 and 8, the frontend README section on the words of the screens, the contributing guide.

## 13. Development, tests and cost

- **Local hosts.** One dev server, two names for it:

  | Where | User view | Developer view |
  |---|---|---|
  | Laptop | `http://localhost:3000` | `http://dev.localhost:3000` |
    | Production (placeholders) | `https://khoai.ai` | `https://dev.khoai.ai` |

  A browser resolves any name under `.localhost` to the machine itself, so `dev.localhost` needs no entry in `/etc/hosts` (checked in the spike with Chromium; `curl` needs `-H 'Host: dev.localhost:3000'`). `allowedDevOrigins` of `next.config.ts` gets `dev.localhost`. The rule of the proxy is the same everywhere: a host whose first label is `dev` is the developer view, any other host is the user view.
- **No view override.** The Codespace is no longer used for development, so the host alone chooses the view, everywhere.
- **Session in development.** A cookie does not see the port, and a cookie of `localhost` is host-only, so `localhost` and `dev.localhost` each keep their own session: sign in once on each. With the mocks there is no login to do.
- **Unit tests.** The render helper wraps a screen in `ViewProvider`; a test of a shared slice names its view.
- **E2E and screenshots.** The specs of today run at `dev.localhost`; a spec of the user view names `localhost`. One server serves both.
- **Machine.** One dev server, one build, one typecheck, as today. The route types grow by the pages of the user area.
- **Deployment.** One deployment with two host names. The backend gets the cookie `Domain` and the two origins in its allowed list if it checks the `Origin` header for CSRF.

## 14. Open questions

1. (Answered) No developer word of today is kept.
2. Is the user host the bare domain and the developer host the subdomain, or the reverse? Are two registrable domains worth a second login?
3. Does every account reach the developer host, or is it a role later? (R7 says the backend decides; [Web App](web-app.md#10-open-points) point 3 is the same question for the workflow state.)
4. Does the user view have threads, or one conversation per project as Activity shows today?
5. Does the user view keep the command palette?
6. Does the user view show Progress (the stages as steps) somewhere, such as a compact line above the prompt? The data and the status rules exist in `run/entities/stages`.
7. Does the user choose run settings at all, or are the defaults of the account enough?
8. What does a failed run say in the user view, and does it offer the link to the developer view?

## 15. Decision record

| # | Decision | Status | Date |
|---|---|---|---|
| 1 | Two hosts of one domain, shared session cookie | Proposed | - |
| 2 | One app, one build, two route areas | Proposed | - |
| 3 | `proxy.ts` rewrites by host to a hidden top folder, no view override | Built, see the [plan](../frontend-v-two-views-plan.md) | 2026-11-11 |
| 4 | One route map per view; shared code imports none | Proposed | - |
| 5 | The area states its view; the words of today become the developer words; `user` is optional and falls back | Decided | 2026-11-11 |
| 6 | A second frame in shared code, filled by `app/user/` | Proposed | - |
| 7 | The chat stays in `activity`, split from the tab, with `openReference` from above | Proposed | - |
| 8 | A read-only sheet beside the chat | Decided | 2026-11-11 |

## 16. Review checklist

- [ ] No address that a person sees names the view
- [ ] No component reads the host; only the proxy does
- [ ] No component chooses a frame by `useView()`; a view branch changes content or words only
- [ ] `activity/widgets/chat` imports neither a frame nor a route map
- [ ] `src/app/user/**` imports no widget of `documents`, `traceability` or the workbench
- [ ] Every text of a shared slice that differs by view is a `Wording` with its `user` word
- [ ] A request to `/developer/...` or `/user/...` from outside answers not found
- [ ] The backend, not the host, decides what an account may read
