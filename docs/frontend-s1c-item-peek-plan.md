# Frontend S1c: the right panel and the peek of an item

The plan of the PR S1c of the [Frontend implementation plan](frontend-implementation-plan.md), the third of the four PRs of the screen Documents, after [S1a](frontend-s1a-documents-plan.md) and [S1b](frontend-s1b-edit-artifacts-plan.md). Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md); an agent implements from it, every decision is made.

Short paths as in S1a.

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

| | |
|---|---|
| Branch | `feat/fe/item-peek`, from `origin/main` once S1b is merged |
| Title | `feat(frontend): add a right panel to the frame, and peek at an item in it` |
| Needs | S1a (the pages, `ArtifactDocument`, the routes); S1b (`ItemSource`, `ItemLinks`, which the peek reuses and whose rows open it) |
| After it | S1d (export). S2: a key in an entry of the chat and a disagreement of the review bar open the peek through `useOpenItemPeek` |
| Docs-first | `usability.md` 5.3, 5.4 and 7.5 describe the peek and the 1440 px rule; open point 9 (peek or page from a row) stays open, with the proposal built. The address of a peek (decision 3) is new: written in the local copy of `usability.md` (5.4: "the peek is part of the address, so Back closes it and a link opens it"). The API needs nothing |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| `usability.md` 5.3, 5.4, 7.5, 8.1, open point 9 | The peek: title, key, main field, source, `Open as page`; 400 px; opened from a row of a document table, a key in the chat, a disagreement, "Based on and used by"; below 1440 px the side panel collapses while the right panel is open and comes back after |
| S1a, S1b plans | `ArtifactDocument` with `itemHref`; `ItemSource`, `ItemLinks` of `documents/widgets/item`; the routes of `documents` |
| `main` frame | `PanelRegion` (`side`, `bottom`), `panelLayouts`, `EditorSplit` (generic by region, stored size), `SideFeatureSplit`, `usePanel`, `usePanelsStore`; `useStatusBarItem` and the registry helpers (`createRegistryStore`, `useRegisterItem`) for an item that a component registers while mounted; `useIsMobile`, which reads the width of the screen as an external store |

## 3. Decisions

1. **The frame gets a right panel, `PanelRegion.Aside`**, named after where it sits and not after the peek, since the frame names no feature: `orientation: 'horizontal'`, `position: 'after'`, `defaultSize: 400`, `minSize: 320`, `maxSize: '50%'`, `editorMinSize: '30%'`. Its size is stored as the others; it has no stored visibility: it shows while a component gives it content, and its header has a close button.
2. **What it shows is registered, as a status bar item is.** `useAsidePanel({ title, content, onClose })` of `@/shared/components/frame` registers the content while the component that calls it is mounted, through a registry store of the frame; the last registered wins. `TabbedWorkspace` wraps its editor in `EditorSplit` of the region `aside` with that content, inside the split of the side panel. Without content, the editor takes the room.
3. **The peek is part of the address.** `?peek=<itemId>` on any page of a project (`RouteParam.Peek`). A link or a row opens it with `router.push` of the same address with the parameter, so Back closes it, a reload keeps it, and any module opens it without importing `documents`: `useOpenItemPeek()` of `artifact/entities` gives `(itemId) => void` and `closePeek()`. `ItemPeekPanel` of `documents/widgets/peek`, mounted once in the `contributions` of the project layout, reads the parameter and registers the peek in the right panel. The tab of the page does not change, since its address in the tab strip has no query.
4. **Below 1440 px, the side panel and the right panel take turns** (5.3). `useIsWideWindow()` (new, `shared/lib/viewport`, `(min-width: 1440px)` as an external store, as `useIsMobile`) tells the frame; while the window is narrow and the right panel has content, `SideFeatureSplit` renders the editor without the side panel. The stored visibility of the side panel does not change, so it comes back when the peek closes. `Ctrl+B` while the peek is open on a narrow window closes the peek and shows the side panel.
5. **The peek of an item** (7.5): the header of the right panel holds the title of the item and the close button (label "Close the peek"); the body holds the key, the status label in the color of its level, the main field (the first field of `x-ui-field-order` that is not the title field, with `ContentFieldValue`), `ItemSource` of S1b, and `Open as page`, which opens the item page in the preview tab with `useOpenPage` and closes the peek. `ItemSource` moves from `documents/widgets/item` to `documents/entities/components/`, since two widgets now render it (a widget may not import another), with its words.
6. **Where the peek opens from.**
   - A row of a table or a card of a document: a click on the row, outside the title link, opens the peek (5.4); the title link keeps opening the item page. `ArtifactDocument` gets `onItemPeek(itemId)`; the row is a button for the keyboard (`Enter` opens the peek), the title stays a link.
   - "Based on and used by" on an item page: a row opens the peek of the other item.
   - The peek of an item on screen whose row is clicked again closes it.
   - S2 adds the chat and the review bar, with `useOpenItemPeek`.
7. **Focus.** Opening the peek moves the focus to its heading; closing it (button, `Escape` while the focus is in the panel, Back) returns the focus to the row that opened it when that row is still on screen, else to the editor. The right panel is a `complementary` region labelled with the title of the item.
8. **States.** Loading: a skeleton of the title and three lines. An item not found (deleted, a wrong id): `NotFoundState` small with a Close button. An error: `ErrorState` small with Try again.
9. **Words** in `itemPeekMessages` (`documents/widgets/peek/item-peek.constants.ts`): "Close the peek", "Open as page".

## 4. Scope

| | |
|---|---|
| Endpoints read | `GET /items/{id}`, `GET /items/{id}/trace` (the source), the kinds and schemas; no new one |
| Endpoints called | None |
| Written new | Section 8 |

## 5. Naming

| Part | Name |
|---|---|
| Frame region, hook, component | `PanelRegion.Aside`, `useAsidePanel`, `AsidePanel` (the header and the body inside the split) |
| Viewport hook | `useIsWideWindow` |
| Widget slice | `documents/widgets/peek`, components `ItemPeekPanel` (registers), `ItemPeek` (renders) |
| Route param | `RouteParam.Peek = 'peek'` |
| Entity hook | `useOpenItemPeek` in `artifact/entities/hooks/useItemPeek.ts` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `EditorSplit`, `usePanel`, `panelLayouts`, `usePanelsStore` | frame | The region and its stored size |
| `createRegistryStore`, `useRegisterItem`, `useRegisteredItems` | `@/shared/lib/registry` | The content of the right panel |
| `queryString`, `RouteParam` | `@/shared/lib/url`, `@/shared/routes` | The address of a peek |
| `ItemSource`, `ContentFieldValue`, `useItem`, `useItemSchema`, `useItemStatusLook` | S1a, S1b | The body of the peek |

### Extract before new code

| What | To | Why |
|---|---|---|
| `PanelRegion.Aside`, `useAsidePanel`, `AsidePanel` | `shared/components/frame` | The frame holds its regions; S2 and later screens may show other content there |
| `useIsWideWindow` | `shared/lib/viewport` | A rule of the window, no object |
| `ItemSource` | `documents/entities/components/` | Two widgets render it |

### Checked, not extracted

| Candidate | Why it stays |
|---|---|
| A generic "query parameter panel" in the frame | The frame does not read the address of a feature; the peek reads its own parameter |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `usability.md` (local) | Decision 3 | none |
| `shared/lib/viewport/hooks/useIsWideWindow.ts` (new), test, `index.ts` | Decision 4 | 1 |
| `shared/components/frame/panels/panel.types.ts`, `panel.constants.ts`, `panels.store.ts` (the size of `aside`, the stored schema accepting old values without it) | Decision 1 | 1 |
| `shared/components/frame/panels/aside-panel.store.ts`, `hooks/useAsidePanel.ts`, `components/AsidePanel.tsx` (new), tests | Decision 2 | 1 |
| `shared/components/frame/layouts/components/TabbedWorkspace.tsx`, `SideFeatureSplit.tsx`, tests; `index.ts` | Decisions 2, 4 | 1 |
| `shared/routes/route-params/route-params.constants.ts` | `Peek` | 2 |
| `artifact/entities/hooks/useItemPeek.ts` (new), test, `index.ts` | Decision 3 | 2 |
| `artifact/entities/components/ArtifactDocument.tsx`, `DocumentBlocks.tsx` | `onItemPeek` on rows and cards (decision 6) | 2 |
| `documents/entities/components/ItemSource.tsx` (moved with `git mv` from `documents/widgets/item/components/`) | Decision 5 | 3 |
| `documents/widgets/peek/` (new) | Decisions 5, 7, 8 | 4 |
| `documents/widgets/document/components/DocumentPage.tsx`, `documents/widgets/item/components/ItemLinks.tsx` | Open the peek (decision 6) | 4 |
| `app/(project)/projects/[projectId]/layout.tsx` | `<ItemPeekPanel />` in the contributions of a found project | 4 |
| Design system `WorkspaceCard.tsx` | A right panel in the sample workspace | 1 |
| Web App Modules, Web App, frontend CONTRIBUTING (the regions of the frame), mocks README, implementation plan | Section 13 | 5 |

## 8. The slices, file by file

```ts
/** Registers what the right panel shows while the caller is mounted; the last one registered wins. */
export function useAsidePanel(panel: { title: string; content: ReactNode; onClose: () => void } | null): void
```

```ts
/** Opens the peek of an item over the page on screen, and closes it, through the address. */
export function useOpenItemPeek(): { openPeek: (itemId: string) => void; closePeek: () => void; peekedItemId: string | null }
```

```text
documents/widgets/peek/
├── components/
│   ├── ItemPeekPanel.tsx     reads ?peek and calls useAsidePanel with <ItemPeek>
│   ├── ItemPeek.tsx          key, status, main field, ItemSource, Open as page
│   └── __tests__/
├── item-peek.constants.ts
└── index.ts
```

`mainField(fields, schema)` (the first field that is not the title field) goes in `workflow/entities/content-fields/content-fields.utils.ts` beside `summaryFields`, with cases in its data file.

## 9. State and data flow

| State | Where |
|---|---|
| The peeked item | The address, `?peek=` |
| The content of the right panel | The registry store of the frame |
| Its size | `usePanelsStore`, stored |
| The narrow window | `useIsWideWindow` |

## 10. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| Peek open, wide window | Document and peek side by side, side panel stays | `/projects/90aa...0001/documents/<spec id>?peek=<REQ-001 id>` at 1600 px |
| Peek open, 1280 px | Side panel hidden, back on close | the same at 1280 px |
| Loading, not found, error | Section 3, decision 8 | `?mock-item=loading`, `empty`, `error` |

## 11. Mocks and screenshots

No mock change. Screenshots: the specification with the peek of REQ-001 at 1280 px and at 1600 px.

## 12. Tests

| File | Cases |
|---|---|
| `useIsWideWindow.test.ts` | Follows the media query |
| `panels.store.test.ts` | The size of `aside` stored; an old stored value without it reads the default |
| `useAsidePanel.test.ts`, `TabbedWorkspace.test.tsx`, `SideFeatureSplit.test.tsx` | Content shows the region; unmount hides it; last wins; narrow window hides the side panel without storing it; `Ctrl+B` closes the peek |
| `useItemPeek.test.ts` | Push with the parameter, keeping the others; close removes it |
| `ArtifactDocument.test.tsx` | A row opens the peek, the title opens the page, `Enter` on a row |
| `ItemPeek.test.tsx` | Content; Open as page opens the preview tab and closes; states; focus on open and back on close; `Escape`; axe |

## 13. Docs to update

- Web App Modules: `documents` widgets `peek`; `ItemSource` in the entities of `documents`.
- Web App section 9: the files of the peek.
- Frontend CONTRIBUTING: the regions of the frame and `useAsidePanel`.
- Mocks README: the addresses of section 10.
- Implementation plan: row S1c, checklist.

## 14. Left for the next PRs

| Item | Where |
|---|---|
| The chat and the review bar open the peek | S2 |
| Open point 9 (row opens peek or page) | Tests with users |
| `Open to the side`, two groups | The frame, after S1 |

## 15. Commits and checks

1. `feat(frontend): add a right panel to the frame, which the side panel gives room to on a narrow window`
2. `feat(frontend): open the peek of an item through the address, from the rows of a document`
3. `refactor(frontend): move the source of an item to the documents entities`
4. `feat(frontend): show the peek of an item in the right panel`
5. `docs(frontend): describe the right panel and the peek`

Checks: ESLint and Prettier on the changed files; Vitest on `shared/components/frame`, `shared/lib/viewport`, `modules/artifact`, `modules/documents`; typecheck once.

## 16. Checklist

- [ ] Decision 3 written in `usability.md`
- [ ] S1b merged; branch from `origin/main`
- [ ] Commits 1 to 5, each checked
- [ ] The peek checked once in `pnpm dev:mock` at 1280 px and 1600 px (one dev server, stopped after)
- [ ] The description of the PR written from this plan
