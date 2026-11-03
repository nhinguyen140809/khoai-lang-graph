# Frontend S1c: the right panel and the peek of an item

The plan of S1c of the [Frontend implementation plan](frontend-implementation-plan.md), the third part of the screen Documents, after [S1a](frontend-s1a-documents-plan.md) and [S1b](frontend-s1b-edit-artifacts-plan.md). Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md), checked against `main` at `8126441` (#58) and the S1b plan. An agent implements from it: every decision is made, and the agent applies it. When the code differs from what this plan says (a name, a path, a signature), the agent stops and reports the difference instead of choosing.

Short paths as in S1b: `documents/...`, `artifact/...`, `workflow/...` under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`. `frame/...` is `frontend/src/shared/components/frame/...`.

## Contents

1. [Row in the PR table](#1-row-in-the-pr-table)
2. [What was read](#2-what-was-read)
3. [Decisions](#3-decisions)
4. [Scope](#4-scope)
5. [Naming](#5-naming)
6. [Shared code first](#6-shared-code-first)
7. [Changes to existing modules](#7-changes-to-existing-modules)
8. [The slices, file by file](#8-the-slices-file-by-file)
9. [State and data flow](#9-state-and-data-flow)
10. [Screen states and words](#10-screen-states-and-words)
11. [Mocks and screenshots](#11-mocks-and-screenshots)
12. [Tests](#12-tests)
13. [Docs to update](#13-docs-to-update)
14. [Left for the next PRs](#14-left-for-the-next-prs)
15. [Commits and checks](#15-commits-and-checks)
16. [Checklist](#16-checklist)

## 1. Row in the PR table

Two stacked PRs: the frame first, reviewed alone since every screen gets the new region, then the peek.

| PR | Branch | Title | Based on |
|---|---|---|---|
| S1c.1 | `feat/fe/aside-panel` | `feat(frontend): add a right panel to the frame, which the side panel gives way to on a narrow window` | `main`, once S1b.2 is merged |
| S1c.2 | `feat/fe/item-peek` | `feat(frontend): peek at an item in the right panel from a document and from the links of an item` | S1c.1 |

| | |
|---|---|
| Needs | S1a; S1b (`ItemSources`, `useItemStatus`, `useItemHref` of `documents/entities`, `mainField` of `workflow`, `ItemLinks` of the item page, the `PageLink` of the frame) |
| After it | S1d (export). S2: a key in an entry of the chat and a disagreement of the review bar open the peek with `usePeekedItem` of `@/shared/routes` |
| Docs-first | The answers B1 to B4 below. The API needs nothing |

Answers needed before S1c.2 (S1c.1 does not wait: the frame shows no product content). Each has the proposal built here; the answer goes to `docs/ui/usability.md` on `frontend-plan`, 5.4 and 7.5.

| # | Question | Proposal built here |
|---|---|---|
| B1 | Whether the peek is part of the address | Yes, `?peek=<item id>` on the page under it: Back closes it, a reload keeps it, a link opens it (decision 7) |
| B2 | What opens the peek in a document, since a whole row with a click handler is not reachable by keyboard | The key of the row (a table) or of the card, drawn as a button; the title stays the link to the item page (decision 9). Open point 9 of usability stays open |
| B3 | The words of the peek for the user | "Quick look at REQ-001" on the key, "Close the quick look" on the close button, "Open as page" (decision 11) |
| B4 | What `Ctrl+B` does while the peek hides the side panel on a narrow window | It closes the peek, and the side panel comes back (decision 5) |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| `docs/ui/usability.md` (`frontend-plan`) 5.3, 5.4, 7.5, open point 9 | The peek: title, key, main field, source, `Open as page`; 400 px; opened from a row of a document table, a key in the chat, a disagreement, "Based on and used by"; below 1440 px the side panel collapses while the right panel is open and comes back after; the activity bar stays |
| S1b plan | `ItemSources`, `useItemStatus`, `useItemHref`, `mainField`, `ItemLinks`, `PageLink`, the `actions` slot of `ArtifactDocument`; the rule that `artifact` takes render props, not addresses |
| `frame/panels/`: `panel.types.ts`, `panel.constants.ts`, `panels.store.ts`, `hooks/usePanel.ts`, `components/EditorSplit.tsx` | `EditorSplit` is generic by region: a region gives `orientation`, `position`, sizes; `StoredPanel` keeps the panel mounted and hidden with `Activity`; the stored state is parsed with a schema that has `side` and `bottom` only |
| `frame/layouts/components/SideFeatureSplit.tsx`, `TabbedWorkspace.tsx` | `SideFeatureSplit` registers `Ctrl+B` (`view.toggleSidePanel`) while a feature is chosen; `TabbedWorkspace` holds the tabs and the page in a `Surface` |
| `frame/tabs/tab-icons.store.ts`, `bars/status-bar.store.ts`, `@/shared/lib/registry` | The registry pattern: `createRegistryStore`, `useRegisterItem` (layout effect), `useRegisteredItems` |
| `@/shared/lib/viewport` (`useIsMobile`) | A media query as an external store |
| `shared/routes` (`RouteParam`, `routes.utils.ts`, `auth/`) | The query parameters of pages take their names from `RouteParam`; a folder per topic with an `index.ts` |
| `app/(project)/projects/[projectId]/layout.tsx` | `projectContributions` mounts the components that register on the frame |
| `artifact/entities/components/ArtifactItemDetails.tsx`, `DocumentBlocks.tsx` | The key line of an item (status in its color, key, version); the key cell of a table; cards show no key today |
| S1a as built (S1b plan, section 2.1) | Small hooks that give one thing; a block that two widgets need goes to the entities of `documents`; nothing outside the scope in the PR |

## 3. Decisions

### The right panel (S1c.1, frame)

1. **A third region, `PanelRegion.Aside`**, named after where it sits, not after the peek, since the frame names no product object: `orientation: 'horizontal'`, `position: 'after'`, `defaultSize: 400`, `minSize: 320`, `maxSize: '50%'`, `editorMinSize: '30%'`. Its size is stored as the others. Its stored `visible` stays `true` and nothing toggles it: the region shows while a component gives it content.
   - The persisted schema reads a stored value without `aside` (every user has one today) by giving `aside` its default: `[PanelRegion.Aside]: panelSchema.default({ visible: true, size: 400 })`, so the stored sizes of `side` and `bottom` are kept.

2. **What it shows is registered, as a status bar item is.** `useAsidePanel(content: AsidePanelContent | null)` registers the content while the calling component is mounted, through `useAsidePanelStore = createRegistryStore<AsidePanelContent | null>()`; `null` registers nothing visible. The region shows the last content that is not null, in the order of registration (`useRegisteredItems` keeps it). The caller keeps the content in `useMemo`, as the other registry hooks ask.

   ```ts
   /** What the right panel of the frame shows. */
   export interface AsidePanelContent {
     /** Changes when the panel shows another thing, so that the focus moves to its heading again. */
     key: string
     /** The heading of the panel, and the name of its region. */
     title: string
     /** The words of the close button, such as "Close the quick look". */
     closeLabel: string
     content: ReactNode
     onClose: () => void
   }
   ```

3. **`AsidePanel`, the panel itself** (`frame/panels/components/AsidePanel.tsx`): a `Surface as="aside"` with `aria-label={title}` (a `complementary` region), a header of 40 px with the title in an `h2` (`tabIndex={-1}`, truncated) and an icon button (`XIcon`, `aria-label={closeLabel}`) at its right, then a `ScrollArea` with `content`.
   - Focus: when `key` changes (and on mount), the focus moves to the heading. On unmount, the focus goes back to the element that had it when the panel mounted, if it is still in the page, else to the `main` of the editor. `useReturnFocus(headingRef, key)` of `frame/panels/hooks/` holds both.
   - `Escape` while the focus is inside the panel calls `onClose` (a `keydown` handler on the `aside`; the palette and the dialogs stop the event before it).

4. **Where it sits.** `TabbedWorkspace` wraps its editor `Surface` in `EditorSplit region={PanelRegion.Aside} panel={aside === null ? undefined : <AsidePanel {...aside} />}`, inside `SideFeatureSplit`: side panel, editor, right panel, from left to right. `UntabbedWorkspace` (the screens outside a project) has no right panel. Without content, `EditorSplit` gives the editor the whole room, as for a screen without a feature.

5. **Below 1440 px, the side panel and the right panel take turns.** `useIsWideWindow()` (new, `shared/lib/viewport/hooks/useIsWideWindow.ts`: `(min-width: 1440px)` as an external store, false on the server, as `useIsMobile`). `SideFeatureSplit` computes `isSideGivenWay = !isWide && aside !== null` and passes it to `EditorSplit` as the new prop `isPanelHidden`; `StoredPanel` hides the panel with `Activity` when `!visible || isPanelHidden`. The stored visibility of the side panel does not change, so it comes back when the right panel closes, and its state (the collapsed rows of the tree) stays.
   - `Ctrl+B` while `isSideGivenWay` holds calls `aside.onClose()` and `sidePanel.show()` (answer B4); otherwise it toggles as today. The label of the command stays "Toggle side panel".

6. **The design system** shows the right panel in the sample workspace of `WorkspaceCard.tsx`, with a static content and a close button that hides it.

### The peek (S1c.2)

7. **The peek is part of the address** (answer B1). `?peek=<itemId>` (`RouteParam.Peek`) on any page of a project. `usePeekedItem()` of `@/shared/routes` (new folder `shared/routes/peek/`) gives:

   ```ts
   export function usePeekedItem(): {
     /** The item that the address peeks at, or null. */
     itemId: string | null
     /** Adds `?peek=` to the address of the page on screen, keeping its other parameters (push: Back closes it). */
     openPeek: (itemId: string) => void
     /** Opens the peek of the item, or closes it when it is the one peeked. */
     togglePeek: (itemId: string) => void
     /** Removes `?peek=` from the address (replace: the page stays where it is). */
     closePeek: () => void
   }
   ```

   - It reads `usePathname` and `useSearchParams`, and writes with `useRouter`; the query is built by the pure `withPeek(search: URLSearchParams, itemId: string | null): string` of `shared/routes/peek/peek-query.utils.ts`, which keeps every other parameter (the scenarios of the mocks, `?item=` of S1b).
   - It sits in `shared/routes` because any module opens the peek: S2 opens it from `activity` and `review`, which may not import `documents`; `routes` already names the pages of items and documents.
   - The tab of the page does not change: its address in the tab strip has no query (`useEditorTab` uses the address of the page).
   - A page opened with `useOpenPage` has no `?peek=`, so moving to another page closes the peek: the peek belongs to the page it was opened on.

8. **`ItemPeekPanel`, mounted once** in `projectContributions` of the project layout, inside `<Suspense fallback={null}>` (it reads `useSearchParams`). It renders nothing in place: `useItemPeekPanel(projectId)` reads `usePeekedItem().itemId` and registers `{ key: itemId, title, closeLabel, content: <ItemPeek projectId itemId />, onClose: closePeek }` with `useAsidePanel`, or `null` without an item. The title is the title of the item (`itemTitle(schema, item)`), "Item" until the item and its schema load.

9. **Where the peek opens from** (answer B2).
   - A table or a card of a document: `ArtifactDocument` and `DocumentBlocks` get a render prop `renderItemKey?: (item: OutlineItem) => ReactNode`; without it the key stays plain text, as today. The table draws it in its key cell; a card draws it in its header, under the title (`CardDescription`). The document page passes `(item) => <PeekKeyButton item={item} />`: a ghost button of size `xs` with the key in `font-mono text-xs`, `aria-label` "Quick look at REQ-001", `aria-pressed` while that item is peeked, which calls `togglePeek(item.id)`. The title stays the link to the item page. A transcript draws no key button: its messages are read in place.
   - "Based on and used by" on an item page: the title of a row becomes a button that calls `openPeek(other.id)`, in place of the `PageLink` of S1b; the peek has `Open as page`.
   - `Read` of a source stays a link to the transcript (S1b decision 13).
   - S2 adds the chat and the review bar, with `openPeek`.

10. **The peek of an item** (`ItemPeek({ projectId, itemId })`, 7.5): under the heading of the panel,
    - the key line of the item: `ItemKeyLine` (extracted from `ArtifactItemDetails` in S1c.2, section 6) with the status of `useItemStatus(projectId, item)`;
    - the main field (`mainField(schema)`): its title in `text-sm font-semibold text-muted-foreground`, then `ContentFieldValue`; nothing when it is empty;
    - `ItemSources` of S1b;
    - `Open as page`: an outline button that opens `useItemHref(projectId)(item)` in the preview tab with `useOpenPage`, then `closePeek()`. The item page then has no `?peek=`.
    - The peek reads the queries that the item page reads (`useItem`, `useItemSchema`, `useItemTrace` backward): a peek and the page of the same item share their cache.

11. **States of the peek.** Loading: `LoadingState` (`size="compact"`, `rows={4}`, label "Loading the item"). Not found (`404`: a deleted item, a wrong id in the address): `NotFoundState` (`size="compact"`, title "Item not found", `action` a link button "Close the quick look" that calls `closePeek`). An error: `ErrorState` (`size="compact"`) with Try again. A peeked item of a kind without a page (a message) shows the same way; `Open as page` opens its transcript at it.

12. **Words** in `itemPeekMessages` (`documents/widgets/peek/item-peek.constants.ts`): see section 10. The frame has no words of its own for the panel: the title and the close label come with the content.

13. **`'use client'`.** The project layout imports `documents/widgets/peek` (`ItemPeekPanel`): `useItemPeekPanel` and `usePeekedItem` start with `'use client'`, as do `useAsidePanel`, `useReturnFocus` and `useIsWideWindow`, which the frame index exports or reaches.

## 4. Scope

| | |
|---|---|
| Endpoints read | `GET /items/{id}`, the kinds and schemas, `GET /items/{id}/trace` (the sources); no new one |
| Endpoints called | None |
| Written new | Section 8 |
| Not built | A peek of anything but an item; two groups side by side (`Open to the side`); opening the peek from the chat and the review bar (S2) |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Frame region | The place | `PanelRegion.Aside` |
| Frame hook and component | The region | `useAsidePanel`, `AsidePanel`, `AsidePanelContent`, `useAsidePanelStore` (frame only) |
| Frame focus hook | What it does | `useReturnFocus` |
| Viewport hook | What it tells | `useIsWideWindow` |
| Route parameter and hook | The value | `RouteParam.Peek = 'peek'`, `usePeekedItem`, `withPeek` |
| Widget slice | The block | `documents/widgets/peek` |
| Widget components | `...Panel` registers, the block renders | `ItemPeekPanel`, `ItemPeek`, `PeekKeyButton` |
| Widget hook | `use<Block><What>` | `useItemPeekPanel` |
| Entity component | The object | `ItemKeyLine` (in `artifact/entities/components/`) |
| Render prop | What it draws | `renderItemKey` |
| Words | `<topic>Messages` | `itemPeekMessages` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `EditorSplit`, `usePanel`, `panelLayouts`, `usePanelsStore`, `StoredPanel` | `frame/panels/` | The region and its stored size |
| `createRegistryStore`, `useRegisterItem`, `useRegisteredItems` | `@/shared/lib/registry` | The content of the right panel |
| `Surface`, `ScrollArea`, `Button`, `CardDescription` | `shared/components/ui` | The panel, the key button |
| `LoadingState`, `NotFoundState`, `ErrorState` | `@/shared/components/state` | The states of the peek |
| `useOpenPage`, `useCommands`, `PaletteGroup` | `@/shared/components/frame` | `Open as page`, `Ctrl+B` |
| `RouteParam` | `@/shared/routes` | The address of a peek |
| `useItem`, `useItemSchema`, `ContentFieldValue`, `mainField`, `itemTitle`, `useWorkflowDefinition` | `artifact/entities`, `workflow/entities` | The body and the title of the peek |
| `ItemSources`, `useItemStatus`, `useItemHref` | `documents/entities` (S1b) | The source, the status, `Open as page` |
| `renderWorkbench`, `renderDocumentsFrame`, `setQuery`, `setPathname`, `routerMock` | `@/test/render`, `@/test/next-stubs` | The tests |

### Extract before new code

| What | To | Why |
|---|---|---|
| `PanelRegion.Aside`, `useAsidePanel`, `AsidePanel` | `frame/panels/` | The frame owns its regions; later screens (S3 results, S4 links) may show other content there |
| `useIsWideWindow` | `shared/lib/viewport/hooks/` | A rule of the window, no product object |
| `usePeekedItem`, `withPeek` | `shared/routes/peek/` | Every module that shows an item opens the peek (S2); an address helper |
| `ItemKeyLine` (the status, key and version line of `ArtifactItemDetails`) | `artifact/entities/components/ItemKeyLine.tsx` | The item page and the peek draw the same line; `ArtifactItemDetails` uses it |

### Checked, not extracted

| Candidate | Why it stays |
|---|---|
| A generic "panel opened by a query parameter" in the frame | The frame reads no address of a feature; the peek reads its own parameter and registers its content |
| `PeekKeyButton` in `documents/entities` | One widget uses it (`document`); `ItemLinks` uses a title button of its own shape |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `docs/ui/usability.md` (`frontend-plan`) | B1 to B4 | none |
| `shared/lib/viewport/hooks/useIsWideWindow.ts` (new), test, `index.ts` | Decision 5 | 1.1 |
| `frame/panels/panel.types.ts`, `panel.constants.ts`, `panels.store.ts` | `Aside` (decision 1) | 1.2 |
| `frame/panels/aside-panel.store.ts`, `aside-panel.types.ts`, `hooks/useAsidePanel.ts`, `hooks/useRegisteredAsidePanel.ts`, `hooks/useReturnFocus.ts`, `components/AsidePanel.tsx` (new), tests | Decisions 2, 3 | 1.2 |
| `frame/panels/components/EditorSplit.tsx` | `isPanelHidden` | 1.2 |
| `frame/layouts/components/TabbedWorkspace.tsx`, `SideFeatureSplit.tsx`, tests; `frame/index.ts` | Decisions 4, 5 | 1.2 |
| Design system `WorkspaceCard.tsx` | Decision 6 | 1.3 |
| `frontend/CONTRIBUTING.md` (the right panel in the frame helpers), `docs/architecture/web-app.md` (the frame) | Section 13 | 1.4 |
| `shared/routes/route-params/route-params.constants.ts` (`Peek`), `shared/routes/peek/` (new), `shared/routes/index.ts`, tests | Decision 7 | 2.1 |
| `artifact/entities/components/ItemKeyLine.tsx` (new), `ArtifactItemDetails.tsx` (uses it), `DocumentBlocks.tsx` and `ArtifactDocument.tsx` (`renderItemKey`), tests, `index.ts` | Decisions 9, 10 | 2.2 |
| `documents/widgets/peek/` (new) | Decisions 8, 10, 11 | 2.3 |
| `documents/widgets/document/components/DocumentPage.tsx`, `PeekKeyButton.tsx` (new); `documents/widgets/item/components/ItemLinks.tsx` | Decision 9 | 2.3 |
| `app/(project)/projects/[projectId]/layout.tsx` | `<Suspense fallback={null}><ItemPeekPanel projectId={projectId} /></Suspense>` in `projectContributions`; the JSDoc names the peek | 2.3 |
| `tests/screenshots/projects/documents.spec.ts` | Section 11 | 2.3 |
| Web App Modules, Web App, mocks README, implementation plan | Section 13 | 2.4 |

Files that two commits change: `frame/index.ts` (1.2 only), `artifact/entities/index.ts` (2.2 only), `web-app.md` (1.4 the frame, 2.4 the peek).

## 8. The slices, file by file

### The frame (S1c.1)

```text
frame/panels/
├── panel.types.ts              PanelRegion + Aside
├── panel.constants.ts          panelLayouts + Aside
├── panels.store.ts             panels.aside, with a default for a stored value without it
├── aside-panel.types.ts        new: AsidePanelContent
├── aside-panel.store.ts        new: useAsidePanelStore
├── hooks/
│   ├── useAsidePanel.ts        new: registers
│   ├── useRegisteredAsidePanel.ts  new: the last content that is not null (frame only)
│   └── useReturnFocus.ts       new
└── components/
    ├── AsidePanel.tsx          new
    └── EditorSplit.tsx         + isPanelHidden
```

```ts
/**
 * Shows content in the right panel of the frame while the calling component is mounted; null shows
 * nothing. The last content registered wins. Keep the content in `useMemo`: it takes effect each
 * time it changes.
 */
export function useAsidePanel(content: AsidePanelContent | null): void

/** The content that the right panel shows, or null: the last one registered that is not null. */
export function useRegisteredAsidePanel(): AsidePanelContent | null

/**
 * Moves the focus to the heading when the panel mounts and when `key` changes, and gives it back
 * on unmount to the element that had it before, when it is still in the page, else to the editor.
 */
export function useReturnFocus(headingRef: RefObject<HTMLElement | null>, key: string): void

/** Whether the window is at least 1440 px wide, where the side panel and the right panel fit together; false on the server. */
export function useIsWideWindow(): boolean
```

`frame/index.ts` exports `useAsidePanel` and the type `AsidePanelContent`; the store and `useRegisteredAsidePanel` stay inside the frame.

### `shared/routes/peek` (S1c.2)

```text
shared/routes/peek/
├── hooks/usePeekedItem.ts
├── peek-query.utils.ts         withPeek
├── __tests__/peek-query.utils.test.ts, peek-query.utils.data.ts
├── hooks/__tests__/usePeekedItem.test.ts
└── index.ts
```

```ts
/** The query of the address with `peek` set to the item, or removed for null; the other parameters stay, in their order. */
export function withPeek(search: URLSearchParams, itemId: string | null): string
```

### `artifact/entities` (S1c.2)

```tsx
/** The line under the title of an item: its status in the color of its level, its key, and its version once it changed. */
export function ItemKeyLine({ item, status, isUnderReview }: { item: Pick<ArtifactItem, 'key' | 'version'>; status: ItemStatus; isUnderReview: boolean })
```

`ArtifactItemDetails` renders `ItemKeyLine` in place of its own `p`; its output does not change (its test stays green unchanged). `DocumentBlocks` and `ArtifactDocument` take `renderItemKey?: (item: OutlineItem) => ReactNode`.

### `documents/widgets/peek` (S1c.2)

```text
documents/widgets/peek/
├── components/
│   ├── ItemPeekPanel.tsx       calls useItemPeekPanel; renders nothing
│   ├── ItemPeek.tsx            the body: key line, main field, sources, Open as page, its states
│   └── __tests__/ItemPeek.test.tsx, ItemPeekPanel.test.tsx
├── useItemPeekPanel.ts         the lone hook of the slice, at its root
├── item-peek.constants.ts      itemPeekMessages
└── index.ts                    ItemPeekPanel
```

```ts
/**
 * Registers the peek of the item that the address names in the right panel of the frame, titled by
 * the item; nothing without one. Closing the panel removes the parameter from the address.
 */
export function useItemPeekPanel(projectId: string): void
```

`PeekKeyButton({ item })` sits in `documents/widgets/document/components/PeekKeyButton.tsx` (the document page and its test use it; `DocumentPage.tsx` stays the file of the page).

## 9. State and data flow

| State | Where |
|---|---|
| The peeked item | The address, `?peek=` |
| The content of the right panel | The registry store of the frame |
| Its size | `usePanelsStore`, stored |
| A narrow window | `useIsWideWindow` |
| The element to give the focus back to | A ref in `useReturnFocus` |

Flow: a key button pushes `?peek=REQ-001's id`; `ItemPeekPanel` reads it and registers the peek; the frame opens the right panel (and, below 1440 px, hides the side panel) and moves the focus to its heading; the peek loads the item, which the page often has in its cache already. Close, `Escape` or Back removes the parameter; the panel unregisters, the side panel comes back, and the focus returns to the key button.

## 10. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| Peek open, wide window | Side panel, document and peek side by side | `/projects/90aa0000-0000-4000-8000-000000000001/documents/<specification id>?peek=<REQ-001 id>` at 1600 px |
| Peek open, narrow window | Side panel hidden, back on close | the same at 1280 px |
| Loading | `LoadingState` compact | `?mock-item=loading` with `?peek=` |
| Not found | `NotFoundState` with Close | `?mock-item=empty` with `?peek=`, or an unknown id |
| Error | `ErrorState` with Try again | `?mock-item=error` with `?peek=` |
| A peeked message | Content, Open as page opens the transcript | `?peek=<PER-001#2 id>` on any page |

```ts
export const itemPeekMessages = {
  close: 'Close the quick look',
  openAsPage: 'Open as page',
  quickLook: (key: string) => `Quick look at ${key}`,
  titleLoading: 'Item',
  loading: 'Loading the item',
  loadError: 'The item could not load.',
  notFound: { title: 'Item not found', description: 'This item does not exist, or was deleted.' },
} as const
```

## 11. Mocks and screenshots

- No mock change: `mock-item` covers the states of the peek.
- Screenshots (S1c.2): the specification with the peek of REQ-001 at 1600 px and at 1280 px (the screenshot config sets the viewport per case). S1c.1 adds none: no screen of the app shows the right panel before S1c.2.

## 12. Tests

| File | Cases |
|---|---|
| `shared/lib/viewport/hooks/__tests__/useIsWideWindow.test.ts` | Follows the media query; false on the server |
| `frame/panels/hooks/__tests__/usePanel.test.ts` + data | The size of `aside` stored; a stored value without `aside` keeps `side` and `bottom` and reads the default |
| `frame/panels/hooks/__tests__/useAsidePanel.test.ts` | Registers while mounted; null shows nothing; the last one wins; unmount leaves the one before |
| `frame/panels/components/__tests__/AsidePanel.test.tsx` | The heading takes the focus; a new `key` moves it again; the close button and `Escape` call `onClose`; the focus returns to the opener, or to the editor when the opener is gone; axe |
| `frame/layouts/components/__tests__/TabbedWorkspace.test.tsx` + data | Content shows the region; no content gives the editor the room; narrow window hides the side panel without changing its stored visibility; `Ctrl+B` on a narrow window closes the right panel and shows the side panel |
| `shared/routes/peek/__tests__/peek-query.utils.test.ts` + data | Add, replace, remove; the other parameters kept in order |
| `shared/routes/peek/hooks/__tests__/usePeekedItem.test.ts` | Reads the parameter; `openPeek` pushes; `togglePeek` closes the peeked item; `closePeek` replaces |
| `artifact/entities/components/__tests__/ItemKeyLine.test.tsx` | Status, key, version only after a change |
| `artifact/entities/components/__tests__/ArtifactDocument.test.tsx` (extended) | `renderItemKey` in the key cell of a table and the header of a card; none in a transcript; plain key without it |
| `documents/widgets/peek/components/__tests__/ItemPeek.test.tsx` | Key line, main field, sources; empty main field; Open as page opens the preview tab and closes the peek; a message opens its transcript; loading, not found with Close, error with Try again; axe |
| `documents/widgets/peek/components/__tests__/ItemPeekPanel.test.tsx` | With `?peek=` the right panel shows the item; without it, nothing; Close removes the parameter |
| `documents/widgets/document/components/__tests__/DocumentPage.test.tsx` (extended) | The key button toggles the peek; `aria-pressed` |
| `documents/widgets/item/components/__tests__/ItemLinks.test.tsx` (extended) | A row opens the peek of the other item |

Helpers: `renderWorkbench` renders the frame for the frame tests; the peek tests render `renderDocumentsFrame` with `ItemPeekPanel` in its contributions. `renderDocumentsFrame` gains an option `contributions?: ReactNode`, added to `DocumentsTabIcons`; three test files use it (peek, document page, item page), so it stays in `test/render/`.

## 13. Docs to update

- `frontend/CONTRIBUTING.md`: in the table of Reuse, `useAsidePanel` for content beside the editor; the frame keeps the words of the content.
- `docs/architecture/web-app.md`: the regions of the frame (the right panel and the rule of 1440 px), and the files of the peek in section 9.
- `docs/architecture/web-app-modules.md`: `documents` widgets `peek`; `artifact` component `ItemKeyLine`; section 8, `usePeekedItem` in `shared/routes`.
- `frontend/src/mocks/README.md`: the addresses of section 10 under Documents.
- Implementation plan: rows S1c.1, S1c.2; checklist.

## 14. Left for the next PRs

| Item | Where |
|---|---|
| The chat and the review bar open the peek | S2 |
| Open point 9 (a row opens the peek or the page) | Tests with users |
| `Open to the side`, two groups | The frame, after S1 |
| Other content in the right panel (the results of S3, the links of S4) | Their PRs, with `useAsidePanel` |

## 15. Commits and checks

S1c.1 `feat/fe/aside-panel`:

1. `feat(viewport): tell a window wide enough for the side panel and the right panel together`
2. `feat(frame): add a right panel, which the side panel gives way to on a narrow window`
3. `feat(design-system): show the right panel in the sample workspace`
4. `docs: describe the right panel of the frame`

S1c.2 `feat/fe/item-peek`:

1. `feat(routes): open and close the peek of an item through the address`
2. `feat(artifact): draw the key line of an item, and the key of a row through the page`
3. `feat(documents): peek at an item from a document and from the links of an item`
4. `docs: describe the peek of an item`

Checks, one at a time, per PR: ESLint and Prettier on the changed files; Vitest on `shared/components/frame`, `shared/lib/viewport`, `shared/routes`, `modules/design-system` (S1c.1), and `shared/routes`, `modules/artifact`, `modules/documents`, `test/render` (S1c.2); typecheck once per PR. No full suite, E2E, screenshots or build locally. The ASCII and comment greps of S1b.

## 16. Checklist

- [ ] B1 to B4 answered by the user and written in `usability.md` on `frontend-plan` before S1c.2
- [ ] S1b.2 merged; S1c.1 from `origin/main`; commits 1 to 4, each checked
- [ ] S1c.2 from the S1c.1 branch; commits 1 to 4, each checked
- [ ] The peek checked once in `pnpm dev:mock` at 1280 px and 1600 px (one dev server, one page at a time, stopped after)
- [ ] The description of each PR written from this plan
