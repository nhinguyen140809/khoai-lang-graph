# Frontend S1b: edit, history, restore and the links of an item

The plan of the PR S1b of the [Frontend implementation plan](frontend-implementation-plan.md), the second of the four PRs of the screen Documents, after [S1a](frontend-s1a-documents-plan.md). Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md); an agent implements from it, every decision is made.

Short paths as in S1a: `documents/...`, `artifact/...`, `workflow/...`, `trace/...`, `run/...`, `project/...` under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`.

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
| Branch | `feat/fe/edit-artifacts`, from `origin/main` once S1a is merged |
| Title | `feat(frontend): edit an item and a document, read and restore their versions, and show the source and the links of an item` |
| Needs | S1a (the module `documents`, the item page and the document page, `useOutlineItems`, the attention levels); E1 (`updateItem`, `updateArtifact`, `restoreItem`, `restoreArtifact`, the revisions, `useAllowedValues`); E3 (`useItemTrace`, `useArtifactTrace`, `isLinkOutOfDate`, `derivedFrom`, `evidencedBy`) |
| After it | S1c (peek): the links of "Based on and used by" open the peek instead of the page. S1d (export). S2: the review bar counts the items edited |
| Docs-first | `usability.md` draws the history of an item (7.4, the TIMELINE of the skeletons) but not the history of a document; decision 9 places it, and the answer goes to the local copy of `usability.md` before the code. The API needs nothing new |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| `usability.md` 5.3, 5.4, 7.4, 8.3 | `Edit` turns the item page into the form of the content schema; empty optional fields show when editing; Source right after the statement, with the quote and `Read`; "Based on and used by" and "History" collapsed; the `!` mark for an item made from an older version of an item it links to; the user words `Based on`, `Source` |
| `skeletons.md` 5 | TRACE by link type, outgoing and incoming, `!` on an out of date link; TIMELINE: version, who, when, `Compare with vN` |
| `web-app.md` 6 | The edit form: fields in `x-ui-field-order`, the input of `x-ui-widget`, `readOnly` shown and not editable, `x-value-from` options, the check in the browser, `422` with field paths, `PATCH` with the changed fields and `If-Match` |
| `docs/API.md`, artifacts, items, traceability | `PATCH` needs `If-Match` (`409 version_conflict`); every change answers `409 invalid_state` while a run is `running`; restore makes a new version; the trace body (`items`, `links`), `target_version`, `quote` |
| S1a plan | The pages and the tree of `documents`; `itemStatus` and `attentionLevel`; the outline rule, which takes a set of stale items here |
| `main` | `artifact/entities` write functions and revisions; `changeReasonLabels`; `workflow/entities` `validateContent`, `toStoredContent`, `changedFields`, `initialValue`, `contentFields`; `shared/components/form` (`Form`, `FormField`, `TextField`, `NumberField`, `showFieldProblems`, `fieldProblemsOf`); `ConfirmDialog`, `PendingButton`, `DiffView`, `wordDiff`, `jsonToPlainText`, `RelativeTime`; the mock handlers of item and artifact edits (`item-edits.handlers.ts`) with the scenarios `mock-update-item`, `mock-update-artifact`, `mock-restore-item`, `mock-restore-artifact`, `mock-traces` |
| `origin/feat/fe/mock` `ItemForm.tsx`, `FieldInput.tsx`, `ItemPanel.tsx` | A reference for the inputs of each widget and the trace tab; not copied (the form library and the field components of `main` replace them) |

## 3. Decisions

1. **Two features in `artifact`: `edit` and `restore`.** Each changes an artifact or an item, so each sits in the module of its object (Web App Modules section 6 already names `edit`). `edit` holds both forms, of an item and of an artifact, since they share the fields, the check, the save and the errors; `restore` holds the restore of a version of an item and of an artifact, behind one confirm dialog.
2. **The inputs of the content fields are an entity component of `workflow`**: `ContentFieldInput`, beside `ContentFieldValue` of S1a, one input per widget. They edit a value of a content field, which several forms embed (the two forms here, the review form of S2 later), without a submit (Web App Modules section 2). The options of an `x-value-from` field come from `artifact`, which `workflow` may not read, so the form passes them as `allowedValues`.
3. **The inputs, by widget:** `text` an input; `textarea` a textarea that grows; `select` a select with the titles of the value list (`valueTitle`) and, for a nullable field, an empty choice that stores null; `number` `NumberField` with `minimum`, `maximum` and `integer`; `boolean` a switch; `list` one input per entry, with Add and a Remove button per entry, `minItems` checked; `tags` the same as `list`, the entries shown as badges while not focused; `object-list` one `FormFieldSet` per entry with the inputs of its `entryFields`, Add and Remove. A `readOnly` field shows its value with `ContentFieldValue` and no input.
4. **The form.** `react-hook-form` with a resolver that calls `validateContent(fields, values)`, so the rules of S1a and E1 are the only rules; there is no `*.schema.ts` of zod, since the fields come from the content schema at run time. The default values are the content, with `initialValue(field)` for a missing field. Every field shows while editing, the empty optional ones included.
5. **Save.** `useUpdateItem` and `useUpdateArtifact` send only `changedFields`, through `toStoredContent`, with `If-Match` at the version the form opened with. On success: `setQueryData` of the detail with the answer, invalidate `itemKeys.lists()` (the outline and the tree read the new status) and the artifact detail for an item; a toast "Saved"; the page leaves the edit mode. No save without a change: the Save button is disabled while the form is not dirty.
6. **Errors of a save.**
   - `422 validation_failed`: the field problems on their fields (`showFieldProblems`), the form stays open.
   - `409 version_conflict`: an alert in the form, "This item changed since you opened it.", with `Reload`, which loads the item and opens the form again with its content; the values typed are lost, and the alert says so.
   - `409 invalid_state`: an alert "Documents cannot change while the agents work. Try again when they stop or wait for you."
   - Other errors: the generic message of `errorMessageOf`, the form stays open.
7. **When Edit and Restore show.** The API refuses every change while a run is `running`. `areDocumentsLocked(run)` in `documents/entities` gives true for a shown run with status `running`. The pages show `Edit` and the Restore buttons disabled, with the reason in a tooltip, while it holds; they do not hide them, so that the user knows where they are. A form already open stays open; its save answers `409 invalid_state` (decision 6).
8. **The edit mode is a state of the page, not an address.** `useState` in the page widget (`isEditing`); the first change keeps the tab (`useEditorTab` returns `keep`), as a preview tab that the user edits is kept. Cancel on a dirty form asks with `ConfirmDialog` ("Discard your changes?"); on a clean form it closes at once. Leaving the page drops the edit without asking (as the browser does for a tab that closes); the dirty form does not block navigation.
9. **History.**
   - Item page: a section "History (N versions)", collapsed, at the end of the page (7.4). Each row: "Version 3", the change reason (`changeReasonLabels`), who (the label of the agent role, or "You"), `RelativeTime`, then `Compare with version 2` (not on version 1) and `Restore this version` (not on the current one).
   - Document page: the same section at the end of the document, for the versions of the artifact (answer to write in `usability.md`: the history of a document sits at its end, as on an item page; restoring a version of a document brings back its items at that version, as the API does).
   - Compare opens, under the row, a field by field diff of the version against the one before it: for a text field `DiffView` with `wordDiff`, for the other widgets the two values as text (`jsonToPlainText`) side by side; fields without a change are left out. It reads the content of both from the revisions already loaded.
   - The list reads a page of 50 (`useItemRevisions`, `useArtifactRevisions`) and shows `Show older versions` while there are more.
10. **Restore.** `Restore this version` opens `ConfirmDialog`: "Restore version 2? The current content stays in the history as version 4." For an artifact: "Restore version 2 of this document? Each item goes back to its content at that version; the current content stays in the history." On success: invalidate the detail, the revisions, `itemKeys.lists()` and, for an artifact, every item detail of it (`itemKeys.all()`); a toast "Restored version 2". The dialog stays open on a failure, with the message. One dialog for both, opened from the history rows of the two pages: it stays beside its trigger (one place opens it per page), with its own state.
11. **Source** (item page, right after the main field, as 7.4 draws it). `sourceOf(trace, itemId)` in `trace/entities/utils/source.utils.ts` follows the `derived_from` links backward from the item until an item with an `evidenced_by` link, and gives that link (its `quote`) and the cited item (the interview message). The page reads `useItemTrace(itemId, { direction: 'backward' })`. It shows the title of the transcript of the message and its turn ("Student interview, turn 4"), the quote in a blockquote, and `Read`, which opens the item page of the message in the preview tab. No source (a raw item without `evidenced_by`, or a kind that has none): the section does not show. Loading: a skeleton line; an error: one line with Try again.
12. **Based on and used by** (collapsed, after Source). From `useItemTrace(itemId, { direction: 'both', depth: 1 })`: the links whose source is the item ("Based on", grouped by the title of the link type from the definition) and those whose target is the item ("Used by", grouped the same way). Each row: the key and the title of the other item, and `!` with "Made from an older version of REQ-002" when `isLinkOutOfDate` holds for a link of the item to its target. A row opens the item page of the other item in the preview tab (S1c turns it into a peek).
13. **The `!` state of an item in the tree and the footer.** S1a left it. `stale` joins `itemStatus`: an item with a link to a target that `isLinkOutOfDate` finds. Its attention level is `act` (warning), letter `!`, label "Made from an older version of an item it is based on"; order: `openIssue`, `stale`, `edited`. The set of stale ids is built in `documents/entities` by `staleItemIds(trace)` from `useArtifactTrace(artifactId, { direction: 'backward', depth: 1 })`, and `useOutlineItems` takes it as a parameter (`artifact` may not read `trace`); the footer counts "2 out of date".
14. **The page widgets place the features.** `documents/widgets/item` places `Edit` (a button at the right of the title), `EditItemForm` in place of `ArtifactItemDetails` while editing, Source, the links and the history with `RestoreVersionButton`. `documents/widgets/document` does the same for the artifact. No feature imports another.
15. **`artifact/widgets/panel` goes.** `ArtifactPanel` is a placeholder that no page renders; it is removed with its test and its index, and Web App Modules drops the widget `panel` of `artifact`.
16. **Words** in `editMessages` (`artifact/features/edit/edit.constants.ts`), `restoreMessages` (`artifact/features/restore/restore.constants.ts`), and the page words in the existing `itemPageMessages` and `documentPageMessages`.

## 4. Scope

| | |
|---|---|
| Endpoints called | `PATCH /items/{id}`, `PATCH /artifacts/{id}`, `POST /items/{id}/restore`, `POST /artifacts/{id}/restore` |
| Endpoints read | `GET /items/{id}/revisions`, `GET /artifacts/{id}/revisions`, `GET /items/{id}/trace`, `GET /artifacts/{id}/trace`, and those of S1a |
| Written new | Section 8 |
| Not built | Creating, deleting, moving and reordering items by hand; creating and removing trace links (S4); section 14 |

## 5. Naming

| Part | Name |
|---|---|
| Feature slices | `artifact/features/edit`, `artifact/features/restore` |
| Components | `EditItemForm`, `EditArtifactForm`, `ContentFieldsForm` (inside the slice), `RestoreVersionButton`, `RestoreVersionDialog`; `ContentFieldInput` (entity); `ItemHistory`, `ArtifactHistory`, `VersionDiff`, `ItemSource`, `ItemLinks` (widgets) |
| Mutation hooks | `useUpdateItem`, `useUpdateArtifact`, `useRestoreItem`, `useRestoreArtifact` |
| Pure rules | `sourceOf`, `staleItemIds`, `areDocumentsLocked`, `versionChanges` (the fields that differ between two revisions, for the diff) |
| Words | `editMessages`, `restoreMessages` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `Form`, `FormField`, `FormFieldSet`, `TextField`, `NumberField`, `showFieldProblems`, `fieldProblemsOf`, `formErrorOf` | `@/shared/components/form` | The forms and their errors |
| `ConfirmDialog`, `PendingButton`, `Alert`, `Switch`, `Select`, `Textarea`, `Badge`, `Collapsible` | `shared/components/ui` | Discard, restore, the inputs, the collapsed sections |
| `DiffView`, `wordDiff`, `jsonToPlainText`, `RelativeTime` | `shared/components/ui`, `@/shared/lib/diff`, `@/shared/lib/formatters` | The history |
| `errorMessageOf`, `ApiErrorCode`, `isApiError` | `@/shared/api/error` | The errors of a save |
| `toast` | `sonner` | Saved, restored |
| `itToastsOnResult`, `itAsksBeforeAction`, `itShowsQueryStates` | `@/test/suites` | The cases of each action and block |

### Extract before new code

None: every piece has one reader or is an entity component.

### Checked, not extracted

| Candidate | Copies | Why it stays |
|---|---|---|
| A list input (Add, Remove per entry) | 1 (`ContentFieldInput` for `list`, `tags`, `object-list`) | One component; a shared `ListField` waits for a form outside the content fields |
| The history section | 2 (item, artifact) in two widgets | Both render `VersionHistory` of `artifact/entities/components/` (an entity component: the versions of one object), with a slot for the restore button that the widget fills |

## 7. Changes to existing modules

| File | Change | Commit |
|---|---|---|
| `usability.md` (local) | Decision 9, the history of a document | none |
| `workflow/entities/components/ContentFieldInput.tsx` (new), tests, `index.ts` | Decisions 2, 3 | 1 |
| `trace/entities/utils/source.utils.ts` (new), tests, `index.ts`; `trace/entities/@x/documents.ts` (new: `useArtifactTrace`, `isLinkOutOfDate`) | Decisions 11, 13 | 2 |
| `artifact/entities/components/VersionHistory.tsx`, `VersionDiff.tsx` (new), `utils/revisions.utils.ts` (`versionChanges`), tests; `item-status.utils.ts`, `item-status-looks.constants.ts`, `outline.utils.ts`, `hooks/useItemQueries.ts` (`stale`, the `staleIds` parameter) | Decisions 9, 13 | 3 |
| `lint/lib/modules/module-imports.constants.js` | None: `documents` lists `trace` since S1a | - |
| `artifact/features/edit/` (new) | Decisions 1, 4 to 6 | 4 |
| `artifact/features/restore/` (new) | Decision 10 | 5 |
| `documents/entities/documents.utils.ts` (`areDocumentsLocked`, `staleItemIds`), `hooks/useDocumentList.ts` | Decisions 7, 13 | 6 |
| `documents/widgets/item/`, `documents/widgets/document/`, `documents/widgets/panel/` (the `!` letter, the footer) | Decisions 8, 9, 11 to 14 | 6 |
| `artifact/widgets/panel/` (deleted) | Decision 15 | 7 |
| Web App Modules, Web App, mocks README, implementation plan | Section 13 | 8 |

## 8. The slices, file by file

### `workflow/entities/components/ContentFieldInput.tsx`

```tsx
interface ContentFieldInputProps {
  field: ContentField
  /** The path of the value in the form, such as `content.acceptance_criteria`. */
  name: string
  /** The values a field with `x-value-from` may take, read by the form from the artifacts. */
  allowedValues?: readonly string[]
}

/** The input of one content field, by its widget, bound to the form around it (decision 3). */
export function ContentFieldInput({ field, name, allowedValues }: ContentFieldInputProps)
```

### `artifact/features/edit`

```text
artifact/features/edit/
├── components/
│   ├── EditItemForm.tsx          the form of an item: ContentFieldsForm + useUpdateItem
│   ├── EditArtifactForm.tsx      title, summary and the content fields of an artifact + useUpdateArtifact
│   ├── ContentFieldsForm.tsx     the fields, the problems, Save and Cancel, the conflict alert
│   └── __tests__/
├── hooks/
│   ├── useUpdateItem.ts
│   ├── useUpdateArtifact.ts
│   ├── useContentForm.ts         react-hook-form with the resolver of validateContent
│   └── __tests__/
├── edit.constants.ts             editMessages
└── index.ts
```

```tsx
interface EditItemFormProps {
  item: ArtifactItem
  schema: ContentSchema
  projectId: string
  /** After a save, or Cancel on a clean form, or Discard. */
  onDone: () => void
  /** The first change of the form, so that the page keeps its tab. */
  onChanged: () => void
}
```

### `artifact/features/restore`

```text
artifact/features/restore/
├── RestoreVersionButton.tsx      the button and its ConfirmDialog, for an item or an artifact
├── hooks/useRestoreItem.ts, useRestoreArtifact.ts
├── restore.constants.ts
├── __tests__/, hooks/__tests__/
└── index.ts
```

`RestoreVersionButton({ target: { type: 'item' | 'artifact'; id: string }, version, isDisabled, disabledReason })`. As a destructive action, only the dialog calls the mutation hook (ESLint).

### `trace/entities/utils/source.utils.ts`

```ts
/** Where an item comes from: the cited item (an interview message) and the words it cites. */
export interface ItemSource { citedItem: TraceItem; quote: string | null }

/**
 * Follows the `derived_from` links backward from the item, the first link of each step, until an
 * item with an `evidenced_by` link; null when the chain ends without one or comes back to an item.
 */
export function sourceOf(trace: Trace, itemId: string): ItemSource | null
```

### The widgets

- `documents/widgets/item/components/ItemSource.tsx`, `ItemLinks.tsx`, `ItemHistory.tsx`, and the edit mode in `ItemPage.tsx`.
- `documents/widgets/document/components/ArtifactHistory.tsx` and the edit mode in `DocumentPage.tsx`.
- `documents/widgets/panel`: the letter `!` and the footer count come from the outline (S1a code, new state).

## 9. State and data flow

| State | Where |
|---|---|
| The content of the forms | `react-hook-form` in `useContentForm` |
| Edit mode | `useState` in `ItemPage`, `DocumentPage` |
| The open diff of a history row | `useState` in `VersionHistory` |
| The restore dialog | `useState` in `RestoreVersionButton` |
| Item, artifact, revisions, traces | Query hooks |

Flow: Edit opens the form with the content; Save sends the changed fields; the answer replaces the detail; the lists load again, so the tree shows `E`; the history shows the new version when opened. Restore makes a new version and loads the same queries. While the run works, Edit and Restore are disabled; when its status changes, the stream of the status item loads the run, and they come back.

## 10. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| Edit disabled | Tooltip with the reason | `?mock-run-status=running` |
| Save pending | `PendingButton` | `?mock-update-item=loading` |
| Save failed | The message, form open | `?mock-update-item=error` |
| Field problems from the server | On the fields | a value the mock refuses (an `x-value-from` value not in the plan), unit tests |
| Version conflict | The alert with Reload | unit test (the mock answers 409 when `If-Match` is old) |
| History loading, error, many versions | Skeleton; error row with Try again; Show older versions | `?mock-artifact=loading`, `error` |
| Restore failed | The dialog with the message | `?mock-restore-item=error` |
| No source | No section | an analysis item without a chain |
| Trace failed | One line with Try again | `?mock-traces=error` |

```ts
export const editMessages = {
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  saved: 'Saved',
  discard: { title: 'Discard your changes?', confirm: 'Discard', cancel: 'Keep editing' },
  locked: 'Documents cannot change while the agents work. Try again when they stop or wait for you.',
  conflict: { item: 'This item changed since you opened it.', artifact: 'This document changed since you opened it.', lost: 'Reload to see the new version; what you typed is not kept.', reload: 'Reload' },
  addEntry: 'Add',
  removeEntry: (label: string) => `Remove ${label}`,
  emptyChoice: 'None',
}
export const restoreMessages = {
  button: 'Restore this version',
  title: (version: number) => `Restore version ${version}?`,
  item: (current: number) => `The current content stays in the history as version ${current}.`,
  artifact: 'Each item goes back to its content at that version; the current content stays in the history.',
  confirm: 'Restore',
  restored: (version: number) => `Restored version ${version}`,
}
```

The page words: "History (3 versions)", "Version 3", "You", "Compare with version 2", "Show older versions", "Source", "Read", "Based on", "Used by", "Based on and used by (3)", "Made from an older version of REQ-002".

## 11. Mocks and screenshots

- No new handler: `item-edits.handlers.ts` answers PATCH and restore with `If-Match`, `422`, `409 invalid_state` while a run is running, and the versions. Check that the trace handlers give the mentor platform a chain from a spec requirement to an interview message with a quote; if not, add the links to the trace fixtures.
- Make one link of the fixtures out of date (`target_version` below the target's), so that `!` shows on one item of the specification.
- Screenshots: the item page in edit mode; the history open with a diff; the item page with Source and the links open; the tree with `!`.

## 12. Tests

| File | Cases |
|---|---|
| `ContentFieldInput.test.tsx` | Each widget renders and changes the form value; nullable select stores null; list Add and Remove; object-list; readOnly shows the value; axe |
| `source.utils.test.ts` | A chain to a quote; no `evidenced_by`; a loop; several `derived_from` |
| `revisions.utils.test.ts` | `versionChanges` |
| `item-status.utils.test.ts`, `outline.utils.test.ts` | `stale` and its order; the stale set |
| `useUpdateItem.test.ts`, `useUpdateArtifact.test.ts` | Sends only the changed fields with `If-Match`; updates the cache; the lists load again |
| `EditItemForm.test.tsx`, `EditArtifactForm.test.tsx` | Client problems block the save; server `422` on the fields; `409 version_conflict` alert and Reload; `409 invalid_state`; Cancel clean and dirty (`itAsksBeforeAction`); `itToastsOnResult`; axe |
| `RestoreVersionButton.test.tsx` | `itAsksBeforeAction`; toast; dialog stays on failure; disabled with the reason |
| `documents.utils.test.ts` | `areDocumentsLocked`, `staleItemIds` |
| `ItemPage.test.tsx`, `DocumentPage.test.tsx` | Edit keeps the tab; disabled while running; Source with Read; links grouped by type with `!`; history with compare and restore |

## 13. Docs to update

- Web App Modules: row `artifact` (features `edit`, `restore`; no widget `panel`), row `workflow` (`ContentFieldInput`), row `trace` (`sourceOf`), section 5 (`trace` gives `@x/documents`).
- Web App section 6: the inputs by widget, the save and its errors, the history.
- Mocks README: the addresses of section 10.
- Implementation plan: row S1b, checklist.

## 14. Left for the next PRs

| Item | Where |
|---|---|
| The links open a peek | S1c |
| Export | S1d |
| Items edited counted on the review bar; the review form embeds `ContentFieldInput` | S2 |
| Create, delete, move and reorder items by hand | Not planned in S1; a later PR when a screen asks for it |
| Create and remove a trace link | S4 |

## 15. Commits and checks

1. `feat(frontend): edit the value of a content field by its widget`
2. `feat(frontend): find the source of an item through its links`
3. `feat(frontend): show the versions of an artifact or an item, and mark the items made from an older version`
4. `feat(frontend): edit an item and an artifact`
5. `feat(frontend): restore a version of an item or an artifact`
6. `feat(frontend): edit, compare and restore on the pages of a document and an item, with the source and the links of an item`
7. `refactor(frontend): remove the placeholder artifact panel`
8. `docs(frontend): describe the editing, the versions and the links of the documents`

Checks: ESLint and Prettier on the changed files; Vitest on `modules/workflow`, `modules/artifact`, `modules/trace`, `modules/documents`; typecheck once. ASCII and comment greps as in S1a.

## 16. Checklist

- [ ] The history of a document (decision 9) confirmed by the user and written in `usability.md`
- [ ] S1a merged; branch from `origin/main`
- [ ] The trace fixtures checked for a source chain and an out of date link
- [ ] Commits 1 to 8, each checked
- [ ] The description of the PR written from this plan; the endpoints checked against the `*.api.ts` functions
