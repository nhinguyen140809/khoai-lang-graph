# Frontend S1b: edit, history, restore, the sources and the links of an item

The plan of S1b of the [Frontend implementation plan](frontend-implementation-plan.md), the second part of the screen Documents, after [S1a](frontend-s1a-documents-plan.md). Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md), checked against `main` at `8126441` (#58). An agent implements from it: every decision is made, and the agent applies it. When the code on `main` differs from what this plan says (a name, a path, a signature), the agent stops and reports the difference instead of choosing.

Short paths: `documents/...`, `artifact/...`, `workflow/...`, `trace/...`, `run/...`, `project/...` are under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`; `lint/...` is `frontend/lint/...`. The module `trace` is the folder `modules/trace` (Web App Modules still calls it `trace-link`; S1b.0 fixes the doc).

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

S1b is three stacked PRs, as S1a became #55, #57 and #58: the fixes of old code first, then the entities, then the features with the pages. Each PR is based on the branch of the one before it, and its base changes to `main` once that one is merged.

| PR | Branch | Title | Based on |
|---|---|---|---|
| S1b.0 | `chore/fe/maintenance-before-edit` | `refactor(frontend): move the page link to the frame, drop the artifact panel placeholder, and fix the transcript links` | `main` |
| S1b.1 | `feat/fe/edit-entities` | `feat(frontend): read the inputs of the content fields, the history of a record, the sources and the out of date items` | S1b.0 |
| S1b.2 | `feat/fe/edit-artifacts` | `feat(frontend): edit an item and a document, restore their versions, and show the sources and the links of an item` | S1b.1 |

| | |
|---|---|
| Needs | S1a merged (#55, #57, #58): the module `documents`, the pages of a document and an item, `useArtifactOutline`, the item status and its levels. E1 (#38): `updateItem`, `updateArtifact`, `restoreItem`, `restoreArtifact`, the revisions, `allowedValues`. E3 (#41): `useItemTrace`, `useArtifactTrace`, `useLinksCiting`, `isLinkOutOfDate`, `derivedFrom`, `evidencedBy` |
| After it | S1c (peek): the rows of the links and the keys of a document open the peek. S1d (export): the Export button joins the `actions` slot of the document that S1b.1 adds. S2: the review bar counts the edited items; the review form embeds `ContentFieldInput` |
| Docs-first | Six answers of the user are needed before S1b.2 (A1 to A6 below). The API needs nothing new |

Answers needed before S1b.2. Each has the proposal that this plan builds; the user confirms or changes it, and the answer goes to `docs/ui/usability.md` on `frontend-plan` (section 7.4 for A1 to A5, 5.3 for A6) before the code. S1b.0 and S1b.1 do not wait for them, since the entities hold no screen.

| # | Question | Proposal built here |
|---|---|---|
| A1 | Where the history of a document sits | At the end of the document page, collapsed, as on an item page (decision 10) |
| A2 | Whether Restore asks first | Yes, a confirm dialog that is not red: restoring is undone by restoring again (decision 11) |
| A3 | What `Read` of a source opens, since a message has no page of its own | The transcript document at the message, scrolled to it, with the quote marked (decisions 12, 13) |
| A4 | The headings of "Based on and used by" | The links from the item under the title of their link type ("Based on", "Depends on"); the links to the item under the title followed by "this item" ("Based on this item") (decision 14) |
| A5 | What the item page does while it is edited | It shows the form alone: no links, no history, no Previous and Next, no `J` and `K`, until Save or Cancel (decision 7) |
| A6 | How the `!` state shows in the tree | Letter `!`; color `warning` in a document under review, `primary` outside one; label "Based on an older version" (decision 15) |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| `docs/ui/usability.md` (`frontend-plan`) 5.3, 5.4, 7.4, 8.2, 8.3 | `Edit` turns the item page into the form of the content schema, empty optional fields show while editing; Source right after the main field, with the quote and `Read`; "Based on and used by" and "History" collapsed at the end; `!` for an item made from an older version of an item it links to; the user words `Based on`, `Source` |
| `docs/ui/skeletons.md` 5, 6 | TRACE by link type, outgoing and incoming, `!` on an out of date link; TIMELINE: version, who, when, `Compare with vN`; a transcript marks the quote that an item cites |
| `docs/architecture/web-app.md` 6 | The edit form: `x-ui-field-order`, the input of `x-ui-widget`, `readOnly` shown and not editable, `x-value-from` options, the check in the browser, `422` with field paths, `PATCH` with the changed fields and `If-Match`; `interview_message` has no page (`x-ui-navigable: false`) |
| `docs/architecture/web-app-modules.md` 2, 5, 6, 9 | "The fields that edit a value object which several forms embed, without their submit" are an entity; `artifact` may read only `workflow`; `review/widgets/panel` will embed the edit form |
| `docs/API.md` Artifacts and items, Traceability, Errors | `PATCH` needs `If-Match` (`409 version_conflict`); every change answers `409 invalid_state` while a run is `running`; restore of an artifact restores its items; the trace body; `422` problems at `content.<field>` |
| `frontend/CONTRIBUTING.md` on `main` | Forms (a schema per form, `showFieldProblems`, `formErrorOf`, `PendingButton`), destructive actions (`ConfirmDialog`, only the dialog calls the mutation), a lone component or hook at the root of a slice, a constants file exports no type |
| `main` at `8126441` | Section 6 lists what is reused; the mock handlers of the edits (`mocks/artifacts/handlers/item-edits.handlers.ts`, `artifacts.handlers.ts`) check `If-Match`, `422` and `409 invalid_state`; the trace fixtures hold a source chain (REQ-001, AR-001, RAW-001, the message PER-001#2) and an out of date link (REQ-003 to AR-007 at version 1, AR-007 now at version 2) |
| The first draft of this plan (commit `3e437de`) | The scope; its paths predate the topics of #55 and #57, and three of its decisions break an import rule (section 2.1) |
| Skills `feature-sliced-design`, `clean-review` | Placement by object; composition from the layer above (the widget gives the lock and the reload of the traces to the features); one idea per helper |

### 2.1 S1a as built, and what this plan does differently

S1a was planned as one PR of 8 commits and became three PRs. What changed between the plan and `main`, and the rule this plan takes from it:

| S1a plan | Built (#55, #57, #58) | Rule for S1b |
|---|---|---|
| Paths `artifact/entities/utils/`, `constants/`, `types/`, `hooks/useItemQueries.ts` | `artifact` split by topic: `artifacts`, `items`, `revisions`, `exports`, `issues`, `status`, `outline` (#55); `workflow` content fields became the group `content` with `fields`, `values`, `value-labels` (#57) | Every path of this plan is a topic path on `main`. A new file goes in the topic of what it reads, and `topicEntityModules` lists what each topic reads |
| One PR | A maintenance PR, an entities PR, a widgets PR, plus a docs PR of the schemas (#56) | Three PRs (section 1); fixes of old code go to S1b.0 |
| `useDocumentList(projectId, { isFollowing })` | `useWritingArtifacts`, `useDocumentsUnderReview`, `useIsDocumentUnderReview`, `useListedDocumentTitle`, `useDocumentDisplays` | Small hooks that each give one thing; this plan adds `useAreDocumentsLocked`, `useDocumentOutline`, `useItemStatus`, `useItemSources`, `useItemHref` in the same shape |
| `useShownWhileActive` stays in the slice | `useIdleVisibility` went to `shared/lib/timing` | A hook with no product object goes to shared code when its plan says so; this plan names the place of each (section 6) |
| Turn rows for a transcript | `isNavigable`: a kind with `x-ui-navigable: false` has no row and no page | A message is reached through its transcript (decision 12) |
| `itemHref` prop of `ArtifactDocument` | `renderItemLink` prop, and `ArtifactDocument` takes `data` from `useArtifactDocument` | The views take render props and data, never addresses; this plan adds slots in the same shape |
| Words "To read before you approve", "open" | "Needs your review", "to review", "to resolve" | Words follow `itemStatusMessages` on `main` |
| Answers written in `usability.md` | The copy on `frontend-plan` holds none of them (open point 7 still open, 5.3 still draws `*`) | The checklist has an item for the S1a answers, and each answer of A1 to A6 is written before S1b.2 starts |
| Unrelated changes (the budget tooltip, the muted colors) inside the widgets PR | | Nothing outside the scope goes in S1b.1 or S1b.2; a fix met on the way goes to S1b.0 or to the next maintenance PR |
| `ItemLink` in `documents/widgets/document` | Used by one widget | Three slices need it now: it moves to the frame as `PageLink` in S1b.0 |

A bug of S1a found while planning: `DocumentBlocks` draws the role of each message of a transcript with `renderItemLink`, and the document page links it to the item page of the message, which answers "Item not found" since `interview_message` is not navigable. S1b.0 fixes it.

## 3. Decisions

### Placement

1. **What goes where.** Each piece sits in the module of its object, at the lowest layer that may hold it. `artifact` may import only `workflow`, so what needs `run` or `trace` is computed in `documents` and given to `artifact` as a parameter.

   | Piece | Where | Why |
   |---|---|---|
   | The input of one content field, by its widget | `workflow/entities/components/content-input/` | A content field is an object of `workflow`; several forms embed the inputs (the two edit forms, the review form of S2) without their submit (Web App Modules section 2) |
   | The check of a form of content (`withContentProblems`) | `workflow/entities/content/values/content-form.schema.ts` | The rules are `validateContent`; the form schema only places each problem at `content.<field>` |
   | The fields that changed between two contents (`contentChanges`), the main field of a schema (`mainField`), the role of an agent (`findAgentRole`), a label for every value of a select (`useValueLabelOf`) | `workflow/entities` topics `content/values`, `content/fields`, `definition`, `content/value-labels` | Reading rules of contents, schemas and the definition |
   | The history of a record (`useRevisionHistory`, `revisionAuthor`, `RevisionHistory`, `RevisionDiff`) | `artifact/entities` topic `revisions`, `components/history/` | The versions of one object, read only; the restore button is a render prop |
   | The state `outOfDate` of an item, its level, letter and words | `artifact/entities` topics `status`, `outline` | The status of an item is `artifact`'s; the set of out of date ids comes in as a parameter |
   | The values that a field with `x-value-from` takes, for every field of a form (`useAllowedValuesOf`) | `artifact/entities` topic `artifacts` | Read from the artifacts of the project, beside `useAllowedValues` |
   | The sources of an item (`sourcesOf`), the out of date items of a trace (`outOfDateItemIds`), the links of an item by type (`itemLinkGroups`), the quotes that cite a message (`useQuotesCiting`), the reload of the traces (`useReloadTraces`) | `trace/entities` | Reading rules and queries of the links; none of them reads another module |
   | Whether a run status writes the documents (`isWritingRunStatus`) | `run/entities/status` | A rule of the run status, as the API states it |
   | The lock of the documents, the outline with the out of date items, the status of one item, the sources with the title of their transcript, the links of an item with the titles of their types and items, the address of any item | `documents/entities` hooks | They read `run`, `trace`, `review`, `artifact` and `workflow` together; `documents` is the only module above all of them |
   | `ItemSources`, the block of the sources | `documents/entities/components/` | A block of reading over `trace` and `artifact`; the item page uses it now and the peek of S1c too, and a widget may not import another widget |
   | Edit an item, edit a document | `artifact/features/edit` | One action on an artifact or an item: same fields, same check, same save, same errors |
   | Restore a version of an item or a document | `artifact/features/restore` | One action |
   | The pages with Edit, the form, the sources, the links, the history and Restore; the transcript at a message | `documents/widgets/item`, `documents/widgets/document` | The widgets place the views and the features, give them the lock, and reload the traces after a change |
   | `!` in the tree and in the footer | `documents/widgets/panel` (reads `useDocumentOutline`) | The tree already draws every status by its look |
   | A button disabled with its reason in a tooltip (`DisabledReason`) | `shared/components/ui/disabled-reason.tsx` | No product object; two features use it (Edit, Restore) |
   | The ranges of the quotes that cite a message, in its text (`quoteRanges`) | `artifact/entities/outline/document-blocks.utils.ts`, built on `quoteRange` of `@/shared/lib/text` | One user, the transcript of a document; it moves to `shared/lib/text` with a second (section 6) |
   | What follows a change of an artifact or an item: the answer in the cache, then every artifact and item loads again (`useApplyRecordChange`) | `artifact/entities/items/hooks/useApplyRecordChange.ts` | Three callers in two features (save an item, save a document, restore); a cache helper of the entity |
   | The link that opens a page in the preview tab (`PageLink`, today `ItemLink`) | `shared/components/frame/tabs/components/PageLink.tsx` | No product object; three slices use it |
   | The address of a document at one of its items | `shared/routes/project-routes.utils.ts`, `RouteParam.Item` | Every address comes from `routes` |

2. **No feature imports another, and no feature reads `run` or `trace`.** `artifact/features/edit` and `artifact/features/restore` take `isLocked: boolean` and an `onChanged` callback from the widget. The widget computes `isLocked` with `useAreDocumentsLocked(projectId)` and passes `onChanged = reloadTraces` (from `useReloadTraces` of `trace/entities`), since an edit or a restore changes which links are out of date and `artifact` may not name the keys of `trace` (FSD strategy C: composition from the layer above).

3. **No new topic.** Every new file of `artifact` and `workflow` goes in an existing topic; `topicEntityModules` changes only if a topic starts to read another (none does). `trace` and `documents` keep their folders by kind.

### Content inputs (`workflow`)

4. **The inputs, by widget.** `ContentFieldInput({ field, allowedValues, definition })` reads the form around it with `useFormContext<ContentFormValues>()`, so that both forms and the review form of S2 embed it inside their `FormProvider`. The name of the value in the form is `content.<field.name>`, as the API names its problems.

   | Widget | Control | Value in the form |
   |---|---|---|
   | `text` | `Input` | string |
   | `textarea` | `Textarea` (grows with its text: `field-sizing-content`) | string |
   | `select` | `NativeSelect` with one option per value of `field.options`, or of `allowedValues` when the field has `allowedValuesFrom`; each option shows `useValueLabelOf(field, definition)(value)`; a nullable field has a first option "None" with the empty value, stored as null; a required field without a value has a first option "Choose a value", disabled | string, or null |
   | `number` | `NumberField` with `min = field.minimum`, `max = field.maximum`, `integer = field.integer` | number, or undefined while empty |
   | `boolean` | `Switch` | boolean |
   | `list` | `EntriesControl`: one `Textarea` per entry, a Remove button per entry (icon `XIcon`, label "Remove entry 2 of Acceptance criteria"), and Add (icon `PlusIcon`, label "Add") under the last entry | string[] |
   | `tags` with `allowedValuesFrom` | One `Checkbox` per allowed value, in a `FormFieldSet` | string[] |
   | `tags` without | `EntriesControl` with one `Input` per entry | string[] |
   | `object-list` | `EntriesControl` with one `FieldSet` per entry; inside, one `ContentValueControl` per entry field, with its label | object[] |

   - A `readOnly` field shows its label and `ContentFieldValue`, no input.
   - `field.description` is the description of the field (`FormField` `description`).
   - The required mark is not shown: the check of decision 5 says what is missing.
   - Every array change replaces the whole list through the `onChange` of its `Controller` (no `useFieldArray`: a list of strings is not an array of objects).
   - The fields of an entry of an `object-list` are not registered in the form one by one; the problem of the list (`Fill in "Term" in every entry.`) shows under the list, as `validateContent` gives it.

5. **The check of a form of content.** `withContentProblems(schema, fields)` returns `schema.superRefine(...)`, which adds each problem of `validateContent(fields, values.content)` at the path `['content', name]`. Each form builds its schema with it, so that the rules of the browser are the rules of `validateContent` and nothing else, and so that `showFieldProblems` finds the fields of the problems of the API (`schemaAt` walks the object and the record of `content`). The refinement comes last: no `.extend` after it, since Zod 4 refuses to extend a refined object. The test of the schema file checks that the result is still a `ZodObject`; if it is not, the agent stops and reports it, since `schemaAt` would no longer find the fields.

### Edit (`artifact/features/edit`)

6. **The forms.**
   - `EditItemForm({ item, schema, isLocked, onDone, onChanged, onFirstChange })`: the content fields of `contentFields(schema)` in `x-ui-field-order`, the empty optional ones included.
   - `EditArtifactForm({ artifact, schema, isLocked, onDone, onChanged, onFirstChange })`: a `TextField` "Title" (required: "Enter a title."), a `FormField` "Summary" with a `Textarea` (empty is stored as null), then the content fields.
   - Values: the item form holds `{ content }`; the artifact form `{ title, summary, content }`. The default content is the content of the record, with `initialValue(field)` for each field it lacks.
   - Save sends only what changed: `itemUpdateBody(fields, item, values)` gives `{ content }` with the fields of `changedFields` passed through `toStoredContent`, and `artifactUpdateBody(fields, artifact, values)` adds `title` and `summary` when they changed. With `If-Match` at the version the form opened with (`updateItem(item.id, item.version, change)`).
   - Save is disabled while the form is not dirty, and while `isLocked` holds, with the reason in a tooltip (`DisabledReason`). It is a `PendingButton` ("Saving").
   - The first change of the form calls `onFirstChange` once, so that the page keeps its tab (5.6: an edit keeps the tab).
   - Cancel on a clean form calls `onDone`. Cancel on a dirty form opens a `ConfirmDialog`, `destructive`: title "Discard your changes?", description "What you changed in this form is lost.", confirm "Discard", cancel "Keep editing"; Discard calls `onDone`.

7. **The edit mode is a state of the page, not an address.** `useState` in the page widget (`isEditing`). While it holds, the item page shows the title, then the form alone: no sources, no links, no history, no navigator, and `J` and `K` are not registered (answer A5), so that a restore or a move never meets an open form. Leaving the page through the tree or a tab drops the form without asking, as the browser does for a closed tab.

8. **Save, and what loads again.**
   - On `200`: `await applyRecordChange({ type: 'item', record: saved })` (`useApplyRecordChange` of `artifact/entities`: the answer goes to the detail key, then every list and detail of artifacts and items loads again, with their revisions, since the tree reads the new status and the artifact moved to a new version), then `onChanged()` (the widget reloads the traces), a toast "Saved", and `onDone()`.
   - Errors, in this order:

     | Answer | What shows | Form |
     |---|---|---|
     | `422 validation_failed` | Each problem at its field (`showFieldProblems`); a problem of a field that the form lacks under the form (`formErrorOf`) | Stays open |
     | `409 version_conflict` | An `Alert` at the top of the form: "This item changed since you opened it." (a document: "This document changed since you opened it."), "Reload to see the new version; what you typed is not kept.", and a button Reload, which loads the detail again (`invalidateQueries` of the detail key); the page keys the form on the version, so the form opens again with the new content | Stays open |
     | `409 invalid_state` | Under the form: "Documents cannot change while the agents work. Try again when they stop or wait for you." | Stays open |
     | Any other | Under the form: the message of `errorMessageOf(error, {})` | Stays open |

   - `isVersionConflict(error)` in `edit.utils.ts` tells the conflict apart (`ApiError` with `code === ApiErrorCode.VersionConflict`); the words of `invalid_state` come through `errorMessageOf(error, { code: { [ApiErrorCode.InvalidState]: editMessages.locked } })`.

### Lock

9. **When Edit and Restore are disabled.** The API refuses every change while a run is `running`. `isWritingRunStatus(status)` in `run/entities/status/run-status.utils.ts` is true for `running` only. `useAreDocumentsLocked(projectId)` in `documents/entities` is true when the run that the project shows (`useDocumentsUnderReview(projectId).run`) is writing. The pages show Edit and the Restore buttons disabled, with "Documents cannot change while the agents work." in a tooltip (`DisabledReason`); they never hide them. A form already open stays open, its Save is disabled, and a save that started before answers `409 invalid_state` (decision 8). When the run stops, the status item of the project loads the run again (P7), and the buttons come back without a reload.

### History (`artifact`) and Restore

10. **History.**
    - `RevisionHistory({ target, currentVersion, fields, renderRestore })`, in `artifact/entities/components/history/`: a `Collapsible`, closed at the start, whose trigger reads "History (3 versions)" (`currentVersion` gives the count, without a request). The versions load only once it opens (`useRevisionHistory(target, { isEnabled: isOpen })`).
    - Each row, newest first: "Version 3", the change reason (`changeReasonLabels` through `useWording`), who (`revisionAuthor`: "You" for the user, else the `label` of the agent role from the definition, else the role key), `RelativeTime` of `created_at`, then `Compare with version 2` (a toggle button, not on version 1, and only when version 2 is loaded) and the restore control from `renderRestore(revision)` (not on the current version).
    - Compare opens under the row a `RevisionDiff`: for each field of `contentChanges(fields, previous.content, revision.content)`, its title and a `DiffView` of `jsonToPlainText(before)` and `jsonToPlainText(after)`. A version without a change of content (a review) reads "The content did not change."
    - "Show older versions" (a `PendingButton`) loads the next page while there is one.
    - States: loading `LoadingState` (`size="compact"`, `rows={3}`, label "Loading the versions"); error `ErrorState` (`size="compact"`) with Try again.
    - Item page: at the end of the page, after the links. Document page: at the end of the document (answer A1).

11. **Restore** (`artifact/features/restore`, answer A2).
    - `RestoreVersionDialog({ target, version, isLocked, onChanged })` holds a `ConfirmDialog` with its trigger: a ghost button "Restore this version" (icon `HistoryIcon`), disabled with its reason while `isLocked`. Not `destructive`: the current content stays in the history, and restoring it again undoes the action.
    - Item: title "Restore version 2?", description "The item gets the content of version 2 as a new version. The current content stays in the history." Document: title "Restore version 2 of this document?", description "The document and each of its items get their content of version 2 as a new version. The current content stays in the history." Confirm "Restore".
    - On success: `await applyRecordChange(...)` with the answer, `onChanged()` (the traces), a toast "Restored version 2". On a failure the dialog stays open and a toast gives `errorMessageOf(error, { code: { [ApiErrorCode.InvalidState]: restoreMessages.locked } })`.
    - The dialog stays beside its trigger (one place opens it, the row of the history), with the state of `ConfirmDialog`. Only `RestoreVersionDialog.tsx` calls `useRestoreVersion`.

### Sources, links and the out of date state

12. **Source** (item page, right after the main field, as 7.4 draws it; answer A3).
    - Rule: `sourcesOf(trace, itemId)` in `trace/entities/utils/chains.utils.ts` follows the `derived_from` links backward from the item (the item included), and gives each `evidenced_by` link met, with the cited item; ordered by the key of the cited item, then by the quote; a loop is walked once.
    - Data: `useItemSources(projectId, itemId)` of `documents/entities` reads `useItemTrace(itemId, { direction: 'backward' })` (depth 5 by default, enough for message, stated need, analysed requirement, requirement, user story) and the transcript title from `useProjectArtifacts(projectId)` (already loaded by the panel), and gives `{ state: 'success', sources: ItemSourceView[] }` with `ItemSourceView = { citedItem, quote, transcriptTitle, turn }` (`turn` from `content.turn` of the message, null when it is not a number).
    - View: `ItemSources({ projectId, itemId })` renders a section "Source": for each source, the line "Student interview, turn 4" (the transcript title, then "turn N" when known), the quote in a `blockquote` (no quote: the line alone), and `Read`, a `PageLink` to `useItemHref(projectId)(citedItem)`.
    - No source: the section does not render. Loading: `LoadingState` (`size="compact"`, `rows={1}`, label "Loading the source"). Error: `ErrorState` (`size="compact"`) "The source could not load." with Try again.
    - `ArtifactItemDetails` gets a slot `afterMainField?: ReactNode`, drawn after the first filled field that `mainField(schema)` names; when the main field is empty, the slot comes first.

13. **The address of any item** (`useItemHref(projectId)`, in `documents/entities`). A navigable item opens its item page (`routes.project(projectId).item(id)`). An item of a kind with `x-ui-navigable: false` (a message) opens the document of its artifact at the item: `routes.project(projectId).document(artifactId, { itemId })`, which adds `?item=<id>` (`RouteParam.Item`).
    - The document page reads the parameter (`useDocumentTarget()`), and once the document has loaded it scrolls the block of that item into view (`block: 'center'`) and moves the focus to it (`useScrollToItem`).
    - Every block of an item in `DocumentBlocks` gets `id={itemAnchorId(item.id)}` and `tabIndex={-1}`, and the target `data-target` (styled `data-target:bg-accent/50`).
    - A message that is the target shows the quotes that cite it marked: the page reads `useQuotesCiting(projectId, itemId)` of `trace/entities` and passes `markedQuotes` to `ArtifactDocument`, whose transcript draws the text of that message with `Highlight` (`variant="soft"`, `color="warning"`, `ranges = quoteRanges(text, quotes)`).
    - The tab of the page keeps its address without the parameter (`useEditorTab` already uses `project.document(artifactId)`).

14. **Based on and used by** (item page, collapsed, after the fields; answer A4).
    - Rule: `itemLinkGroups(trace, itemId, linkTypes, titleOf)` of `trace/entities` gives `{ outgoing: ItemLinkGroup[], incoming: ItemLinkGroup[] }`: the links whose source is the item, then those whose target is the item, each list grouped by link type in the order of `linkTypes`, the rows of a group in key order. A row is `{ link, other: TraceItem, title, isOutOfDate }`, `title` from `titleOf(other)` (as `traceGraphOf` takes it), `isOutOfDate` from `isLinkOutOfDate(link, target)`. A link type missing from `linkTypes` comes last, titled by its key.
    - Data: `useItemLinks(itemId)` of `documents/entities` reads `useItemTrace(itemId, { direction: 'both', depth: 1 })`, the link types of `useWorkflowDefinition` and the schemas of `useArtifactKinds` (for `itemTitle`), and gives `{ state: 'success', outgoing, incoming, count }`, or `pending`, or `error` with `retry`. It sits in `documents` because it joins `trace` and `workflow`, as `useItemSources` does.
    - View: `ItemLinks({ projectId, itemId })` in `documents/widgets/item`: a `Collapsible` "Based on and used by (3)" (the count of rows; the section does not render with none). Under it, each outgoing group under the title of its link type ("Based on"), each incoming group under the title followed by " this item" ("Based on this item"). A row: the key (`font-mono text-xs`) and the `title` of the row, as a `PageLink` to `useItemHref(projectId)(other)`; then, when out of date, `!` in `warning` and "Made from version 2; now version 3".
    - Loading and error: as the sources.

15. **The state `outOfDate`** (answer A6).
    - `ItemStatus` gains `outOfDate`. `itemStatus(item, issueKinds, { outOfDateIds })` (the third argument optional, empty by default, so the callers of S1a compile unchanged) gives, the first that holds: `openIssue`, `outOfDate` when the id is in `outOfDateIds`, `edited`, the review status.
    - `attentionLevel('outOfDate', { isUnderReview })`: `act` under review, `follow` outside one (a change in motion, as `edited`).
    - Look: letter `!`, label "Based on an older version"; count text `"2 out of date"`; the tooltip of a row reads the label, as the other states do.
    - Data: `outOfDateItemIds(trace)` of `trace/entities` gives the sources of the links that `isLinkOutOfDate` finds. `useOutOfDateItemIds(artifactId)` reads `useArtifactTrace(artifactId, { direction: 'backward', depth: 1 })` and memoizes the set (empty while it loads or fails). `useDocumentOutline(artifactId)` of `documents/entities` is `useArtifactOutline(artifactId, { outOfDateIds: useOutOfDateItemIds(artifactId) })`; the panel and the item page read it in place of `useArtifactOutline`. `useItemStatus(projectId, item)` of `documents/entities` gives `{ status, isUnderReview }` for one item the same way (used by the item page, and by the peek of S1c).
    - In the mock data, REQ-003 of the specification shows `!` (its link to AR-007 was made at version 1; AR-007 is at version 2).

### Pages and reloads

16. **The pages place the features.**

    Item page (read mode):

    ```text
    header   breadcrumb (unchanged)
    article  h1 title ......................................... [ Edit ]
             key line (status, key, version)                   ArtifactItemDetails
             main field
             Source (ItemSources)                              afterMainField slot
             the other filled fields
             > Based on and used by (3)                        ItemLinks
             > History (3 versions)                            RevisionHistory, Restore per row
    corner   ItemNavigator (unchanged)
    ```

    Item page (edit mode): the header, the `h1` title, then `EditItemForm` keyed on `item.version`; nothing else.

    Document page (read mode): `ArtifactDocument` with `actions = <EditRecordButton>` at the right of the title, then `RevisionHistory` at the end. Edit mode: the title of the document, then `EditArtifactForm` keyed on `artifact.version`; the items stay on their own pages and are not shown.

    - `EditRecordButton({ isLocked, onEdit })` of `artifact/features/edit`: an outline button "Edit" (icon `PencilIcon`), disabled with its reason while locked.
    - The first change keeps the tab: `useItemTab` returns the function that `useEditorTab` gives (today it drops it), and `DocumentPage` keeps it too.
    - Save and Cancel set `isEditing` back to false.

17. **One reload rule after a change.** An edit or a restore loads again what shows artifacts and items (`useApplyRecordChange` of `artifact`, inside the features, built on `useReloadArtifacts`) and what shows traces (`useReloadTraces` of `trace`, called by the widget through `onChanged`). `useReloadTraces` invalidates `traceModuleKeys.all()`, so the chains, the links and the traceability views load again.

18. **Words** in `contentInputMessages` (`workflow/entities/components/content-input/content-input.constants.ts`), `revisionMessages` (`artifact/entities/revisions/revisions.constants.ts`, beside `changeReasonLabels`), `itemStatusMessages` (+ `outOfDate`), `editMessages` (`artifact/features/edit/edit.constants.ts`), `restoreMessages` (`artifact/features/restore/restore.constants.ts`), `itemSourcesMessages` (`documents/entities/components/item-sources.constants.ts`), and the page words in `itemPageMessages` and `documentPageMessages`. `DisabledReason` has no words of its own: it takes the reason as a prop.

19. **`'use client'`.** The project layout reaches `documents/widgets/panel` and through it `documents/entities`; every new hook there that imports React state or effects starts with `'use client'`: `useAreDocumentsLocked`, `useDocumentOutline`, `useItemStatus`, `useItemSources`, `useItemLinks`, `useItemHref`. The new hooks of `artifact`, `trace` and `workflow` that the pages reach (`useRevisionHistory`, `useAllowedValuesOf`, `useOutOfDateItemIds`, `useQuotesCiting`, `useReloadTraces`, `useValueLabelOf`) start with it too; the components with state (`RevisionHistory`, `ContentFieldInput`, `EntriesControl`, the forms, `RestoreVersionDialog`, `DisabledReason`) as well.

### Maintenance (S1b.0)

20. **S1b.0 holds four small changes, one commit each:**
    - `DocumentBlocks` draws the role of a message of a transcript as plain text (`span`), not through `renderItemLink`: a message has no page. Its test checks that no link is drawn for a message.
    - `ItemLink` moves with `git mv` to `shared/components/frame/tabs/components/PageLink.tsx`, renamed `PageLink`, exported from the index of the frame, with the same behavior (a click opens the preview tab, a double click keeps it, a click with a modifier key keeps its usual meaning). `DocumentPage` imports it from `@/shared/components/frame`. A test `PageLink.test.tsx` covers the three cases.
    - `artifact/widgets/panel/` (`ArtifactPanel`, a placeholder that no page renders) is deleted with its test and data.
    - Web App Modules names the module `trace` as the code does (rows of sections 6 and the endpoints table), drops the widget `panel` of `artifact`; the mocks README lists the scenarios `mock-traces`, `mock-trace-links`, `mock-create-trace-link`, `mock-delete-trace-link`, `mock-traceability`, which the handlers read today.

## 4. Scope

| | |
|---|---|
| Endpoints called | `PATCH /items/{id}`, `PATCH /artifacts/{id}`, `POST /items/{id}/restore`, `POST /artifacts/{id}/restore` |
| Endpoints read | `GET /items/{id}/revisions`, `GET /artifacts/{id}/revisions`, `GET /items/{id}/trace` (backward for the sources, both at depth 1 for the links), `GET /artifacts/{id}/trace` (backward at depth 1 for `!`), `GET /projects/{id}/trace-links?link_type=evidenced_by&target_item_id=` (the quotes of a message), and those of S1a |
| Copied | Nothing; `origin/feat/fe/mock` `ItemForm.tsx`, `FieldInput.tsx`, `ItemPanel.tsx` were read as a reference |
| Written new | Section 8 |
| Not built | Creating, deleting, moving and reordering items by hand; creating and removing trace links (S4); the quotes of every message marked in a transcript with the citing items in the margin (section 14) |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Feature slices | The action | `artifact/features/edit`, `artifact/features/restore` |
| Components of an action | `<Verb><Object><Role>` | `EditItemForm`, `EditArtifactForm`, `EditRecordButton`, `RestoreVersionDialog` |
| Parts of the edit forms | The part | `ContentFieldInputs` (the inputs with their allowed values), `EditFormFooter` (Save, Cancel, the discard dialog, the errors) |
| Entity components | The object | `ContentFieldInput`, `ContentValueControl`, `EntriesControl`; `RevisionHistory`, `RevisionDiff`; `ItemSources` |
| Widget component | `<Object><Block>` | `ItemLinks` |
| Shared components | What they are | `DisabledReason`, `PageLink` |
| Mutation hooks | `use<Verb><Object>` | `useUpdateItem`, `useUpdateArtifact`, `useRestoreVersion` |
| Form hook | `use<Block><What>` | `useEditForm` |
| Query and cache hooks | `use<What it gives>` | `useRevisionHistory`, `useAllowedValuesOf`, `useApplyRecordChange`, `useOutOfDateItemIds`, `useQuotesCiting`, `useReloadTraces`, `useValueLabelOf` |
| Documents hooks | `use<What it gives>` | `useAreDocumentsLocked`, `useDocumentOutline`, `useItemStatus`, `useItemSources`, `useItemLinks`, `useItemHref` |
| Page hooks | `use<What it gives>` | `useDocumentTarget`, `useScrollToItem` |
| Pure rules | What they give | `contentChanges`, `mainField`, `findAgentRole`, `revisionAuthor`, `previousRevision`, `sourcesOf`, `outOfDateItemIds`, `itemLinkGroups`, `quoteRanges`, `itemAnchorId`, `itemUpdateBody`, `artifactUpdateBody`, `isVersionConflict`, `isWritingRunStatus` |
| Schemas | `<form>FormSchema` | `editItemFormSchema(fields)`, `editArtifactFormSchema(fields)`; `withContentProblems(schema, fields)` |
| Types | The value | `ContentFormValues`, `RevisionTarget`, `RevisionHistoryResult`, `RecordChange`, `ItemSource`, `ItemLinkGroup`, `ItemLinkRow`, `ItemSourceView`, `ItemSourcesResult`, `ItemLinksResult` |
| Route parameter | The value | `RouteParam.Item = 'item'` |
| Words | `<topic>Messages` | `contentInputMessages`, `revisionMessages`, `editMessages`, `restoreMessages`, `itemSourcesMessages` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `FormField`, `FormFieldSet`, `TextField`, `NumberField`, `Form`, `showFieldProblems`, `fieldProblemsOf`, `formErrorOf` | `@/shared/components/form` | The inputs and the forms |
| `Input`, `Textarea`, `NativeSelect`, `NativeSelectOption`, `Switch`, `Checkbox`, `Button`, `PendingButton`, `Alert`, `Collapsible`, `Skeleton`, `Tooltip`, `FieldSet`, `FieldLegend`, `FieldError` | `shared/components/ui` | The controls |
| `ConfirmDialog` | `shared/components/ui/confirm-dialog.tsx` | Discard, Restore |
| `DiffView`, `RelativeTime`, `Highlight` | `shared/components/ui` | The history, the marked quote |
| `jsonToPlainText` | `@/shared/lib/formatters` | The text of a value in a diff |
| `quoteRange` | `@/shared/lib/text` | Built on by `quoteRanges` |
| `isSameValue` | `@/shared/lib/collections` | `contentChanges` |
| `errorMessageOf`, `ApiError`, `ApiErrorCode` | `@/shared/api/error` | The errors of a save and a restore |
| `toast` | `sonner` | Saved, Restored, a failed restore |
| `useEditorTab`, `useOpenPage`, `useCommands` | `@/shared/components/frame` | Keep the tab, the links, `J` and `K` off while editing |
| `routes`, `RouteParam` | `@/shared/routes` | The addresses |
| `validateContent`, `changedFields`, `toStoredContent`, `initialValue`, `contentFields`, `ContentFieldValue`, `itemTitle`, `isNavigable`, `kindSchemasByKind`, `useArtifactKinds`, `useWorkflowDefinition`, `useIssueKinds`, `findLinkType` | `workflow/entities` | The fields, their rules and their words |
| `updateItem`, `updateArtifact`, `restoreItem`, `restoreArtifact`, `itemKeys`, `artifactKeys`, `useReloadArtifacts`, `useItem`, `useArtifact`, `useItemSchema`, `useProjectArtifacts`, `allowedValues`, `listItemRevisions`, `listArtifactRevisions`, `changeReasonLabels`, `revisionsPageSize`, `useArtifactOutline`, `itemStatus` | `artifact/entities` | The data and the views |
| `useItemTrace`, `useArtifactTrace`, `useLinksCiting`, `isLinkOutOfDate`, `derivedFrom`, `evidencedBy`, `traceModuleKeys` | `trace/entities` | The links |
| `useDocumentsUnderReview`, `useIsDocumentUnderReview`, `useWritingArtifacts` | `documents/entities` | The run and the review of the project |
| `renderDocumentsFrame`, `renderWithProviders`, `renderHookWithProviders`, `openPage`, `serverErrorOn`, `holdResponse` | `@/test/render`, `@/test/msw` | The tests |
| `itAsksBeforeAction`, `itToastsOnResult`, `itShowsQueryStates`, `itAsksForFieldsBeforeSending`, `expectNoAccessibilityViolations`, `spyOnToast`, `fillFields`, `replaceText`, `pressButton`, `findConfirmDialog`, `confirmAction`, `cancelAction` | `@/test/suites`, `@/test/steps` | The cases of each action and block |

### Extract before new code

| What | To | Why |
|---|---|---|
| `PageLink` (today `ItemLink` of `documents/widgets/document`) | `shared/components/frame/tabs/components/PageLink.tsx` (S1b.0) | Used by the document widget, `ItemSources` of the entities and `ItemLinks` of the item widget; no product object |
| `DisabledReason` | `shared/components/ui/disabled-reason.tsx`, shown on the `ButtonsCard` of the design system | Edit and Restore, two features, disable a button with a reason; no product object |

### Checked, not extracted

| Candidate | Copies now | Why it stays |
|---|---|---|
| A generic list input (`EntriesControl`) in `shared/components/form` | 1 (the content inputs) | One form family; it moves to `shared/components/form` when a form outside the content fields needs a list |
| A helper that tells the code of an `ApiError` (`hasErrorCode`) | 1 (`isVersionConflict`) | One reader; it goes to `shared/api/error` at the second (S2 answers a review and may meet `invalid_state`) |
| One history section per record kind | 2 places (item, document) | Both render `RevisionHistory` of the entity with a render prop |
| `ItemSources` in `documents/widgets/item` | 1 now; the peek of S1c is the second, in the next PR | Placed in `documents/entities` now: the first draft kept it in the item widget and moved it with `git mv` in S1c, a move that this order avoids |
| A scroll helper | 1 (`useScrollToItem`) | One reader; it stays in the document widget |
| `quoteRanges` in `shared/lib/text` | 1 (the transcript of `DocumentBlocks`) | No product object, but one user: it stays beside `documentBlocks` and moves to `shared/lib/text` when S4 marks the quotes of every message |
| The "load every page" hook | 1 (`useOutlineItems`), unchanged | As S1a |

## 7. Changes to existing modules

The commit column names the PR and the commit number of section 15.

| File | Change | Commit |
|---|---|---|
| `docs/ui/usability.md` (`frontend-plan`) | The S1a answers (S1a decision 1), then A1 to A6 | none |
| `artifact/entities/components/DocumentBlocks.tsx`, its test | The role of a message is plain text | 0.1 |
| `documents/widgets/document/components/ItemLink.tsx` -> `shared/components/frame/tabs/components/PageLink.tsx` (`git mv`, renamed), `shared/components/frame/index.ts`, `DocumentPage.tsx`, new `__tests__/PageLink.test.tsx` | Decision 20 | 0.2 |
| `artifact/widgets/panel/` (deleted) | Decision 20 | 0.3 |
| `docs/architecture/web-app-modules.md`, `frontend/src/mocks/README.md` | Decision 20 | 0.4 |
| `shared/components/ui/disabled-reason.tsx`, test; design system `ButtonsCard.tsx` | `DisabledReason` | 1.1 |
| `shared/routes/route-params/route-params.constants.ts`, `project-routes.utils.ts`, tests | `RouteParam.Item`, `document(artifactId, { itemId })` | 1.1 |
| `workflow/entities/components/content-input/` (new), `content/values/content-form.schema.ts` (new), `content/values/content-values.utils.ts` (`contentChanges`), `content/fields/content-fields.utils.ts` (`mainField`), `content/value-labels/hooks/useValueLabelOf.ts` (new) and `useValueLabel.ts` (built on it), `definition/workflow-definition.utils.ts` (`findAgentRole`), tests, `index.ts`, `@x/artifact.ts` (+ `contentChanges`, `findAgentRole`, `mainField`), `@x/documents.ts` (+ `isNavigable`, `useIssueKinds`) | Decisions 4, 5, 10, 12 | 1.2 |
| `run/entities/status/run-status.utils.ts` (`isWritingRunStatus`), test, `@x/documents.ts` | Decision 9 | 1.3 |
| `trace/entities/types/chains.types.ts` (`ItemSource`, `ItemLinkGroup`, `ItemLinkRow`), `utils/chains.utils.ts` (new), `hooks/useChainQueries.ts` (`useOutOfDateItemIds`, `useReloadTraces`), `hooks/useTraceLinkQueries.ts` (`useQuotesCiting`), tests, `index.ts`, `@x/documents.ts` (new) | Decisions 12, 14, 15, 17 | 1.4 |
| `artifact/entities/status/*` (`outOfDate`), `outline/outline.utils.ts` (`outOfDateIds`, `itemAnchorId`), `outline/document-blocks.utils.ts` (`quoteRanges`), `items/hooks/useApplyRecordChange.ts` (new), `outline/outline.types.ts`, `outline/outline.constants.ts` (`transcriptTurnField`), `outline/hooks/useArtifactOutline.ts` (options), `revisions/*` (`RevisionTarget`, `useRevisionHistory`, `revisionAuthor`, `previousRevision`, `revisionMessages`), `artifacts/hooks/useArtifactQueries.ts` (`useAllowedValuesOf`), `components/ArtifactDocument.tsx` (`actions`, `targetItemId`, `markedQuotes`), `components/DocumentBlocks.tsx` (anchors, marked quotes), `components/ArtifactItemDetails.tsx` (`afterMainField`), `components/history/` (new), `components/artifact-view.constants.ts`, tests, `index.ts`, `@x/documents.ts` | Decisions 10, 12, 13, 15 | 1.5 |
| `documents/entities/hooks/useAreDocumentsLocked.ts`, `useDocumentOutline.ts`, `useItemStatus.ts`, `useItemSources.ts`, `useItemLinks.ts`, `useItemHref.ts` (new), `components/ItemSources.tsx`, `components/item-sources.constants.ts` (new), `documents.types.ts` (`ItemSourceView`, `ItemSourcesResult`, `ItemLinksResult`), tests, `index.ts` | Decisions 9, 12 to 15 | 1.6 |
| `web-app-modules.md`, `web-app.md` | Section 13, entities part | 1.7 |
| `artifact/features/edit/` (new) | Decisions 6 to 8 | 2.1 |
| `artifact/features/restore/` (new) | Decision 11 | 2.2 |
| `documents/widgets/item/` (`ItemPage.tsx`, `ItemLinks.tsx` new, `hooks/useItemPage.ts`, `useItemTab.ts`, `useItemCommands.ts`, `item-page.constants.ts`), `documents/widgets/document/` (`DocumentPage.tsx`, `hooks/useDocumentTarget.ts` and `useScrollToItem.ts` new, `document-page.constants.ts`), `documents/widgets/panel/components/DocumentsPanel.tsx`, tests | Decisions 7, 12 to 16 | 2.3 |
| `tests/screenshots/projects/documents.spec.ts` | Section 11 | 2.3 |
| `web-app-modules.md`, `web-app.md`, mocks README, implementation plan | Section 13, features part | 2.4 |

Files that two commits change: `artifact/entities/index.ts` and `@x/documents.ts` (1.5 only), `workflow/entities/index.ts` and its `@x` files (1.2 only), `trace/entities/index.ts` (1.4 only), `documents/entities/index.ts` (1.6 only), `web-app-modules.md` (0.4, 1.7, 2.4: each commit its own rows), `DocumentBlocks.tsx` (0.1 the role, 1.5 the anchors and quotes), `DocumentPage.tsx` (0.2 the import, 2.3 the rest).

## 8. The slices, file by file

### `shared`

```ts
// artifact/entities/outline/document-blocks.utils.ts
/**
 * Where each quote sits in a text, as `quoteRange` finds it, in the order of the text; a quote that
 * is not there is left out, and a range that overlaps an earlier one is dropped.
 */
export function quoteRanges(text: string, quotes: readonly string[]): TextRange[]
```

```tsx
// shared/components/ui/disabled-reason.tsx
interface DisabledReasonProps {
  /** Why the control is disabled; null leaves the control as it is. */
  reason: string | null
  /** The control, already disabled by the caller when `reason` is set. */
  children: React.ReactNode
}

/**
 * A disabled control with the reason in a tooltip. A disabled button takes no focus and no pointer,
 * so the tooltip sits on a wrapper that does (`tabIndex={0}`), which reads the reason as its
 * description for assistive technology.
 */
function DisabledReason({ reason, children }: DisabledReasonProps)
```

```ts
// shared/routes/project-routes.utils.ts, in projectRoutes
/** One document, by the id of its artifact; with `itemId`, scrolled to that item. */
document: (artifactId: string, { itemId }: { itemId?: string } = {}) =>
  itemId === undefined
    ? checkedRoute(`/projects/${id}/documents/${encodeId(artifactId)}`)
    : routeOfAddress(pathWithQuery(checkedRoute(`/projects/${id}/documents/${encodeId(artifactId)}`), { [RouteParam.Item]: itemId })),
```

`RouteParam.Item`: "The item that a document page scrolls to and marks."

### `workflow/entities`

```text
workflow/entities/
├── components/
│   ├── ContentFieldValue.tsx                 unchanged
│   ├── content-field-value.constants.ts      unchanged
│   ├── content-input/                        new
│   │   ├── ContentFieldInput.tsx             the field: label, description, control, error; readOnly as a value
│   │   ├── ContentValueControl.tsx           the control by widget, without a label (table widgetControls)
│   │   ├── EntriesControl.tsx                the entries of list, tags and object-list, with Add and Remove
│   │   ├── content-input.constants.ts        contentInputMessages
│   │   └── __tests__/ContentFieldInput.test.tsx, ContentFieldInput.data.ts, EntriesControl.test.tsx
│   └── __tests__/                            unchanged
├── content/
│   ├── fields/content-fields.utils.ts        + mainField
│   ├── values/content-form.schema.ts         new: ContentFormValues, contentFormValuesSchema, withContentProblems
│   ├── values/content-values.utils.ts        + contentChanges
│   └── value-labels/hooks/useValueLabelOf.ts new; useValueLabel.ts calls it
└── definition/workflow-definition.utils.ts   + findAgentRole
```

```ts
// content/values/content-form.schema.ts
/** The values of a form that edits a content: its fields sit under `content`, where the API names their problems. */
export interface ContentFormValues {
  content: ContentValues
}

/** The shape of a form of content, before the check of its fields. */
export const contentFormValuesSchema = z.object({ content: contentValuesSchema })

/**
 * The schema with the problems of `validateContent` added, each at `content.<field>`, so that a
 * form checks only the rules of the content schema. The schema of the item form is
 * `withContentProblems(contentFormValuesSchema, fields)`; the artifact form adds `title` and
 * `summary` to the object first.
 */
export function withContentProblems<Schema extends z.ZodType<ContentFormValues>>(
  schema: Schema,
  fields: readonly ContentField[],
): Schema
```

```ts
// content/values/content-values.utils.ts
/** The fields whose value differs between two contents, read only fields included, with both values. */
export function contentChanges(
  fields: readonly ContentField[],
  before: ContentValues,
  after: ContentValues,
): { field: ContentField; before: unknown; after: unknown }[]

// content/fields/content-fields.utils.ts
/** The first field of the schema that is not its title field: what an item says, such as the statement of a requirement. */
export function mainField(schema: ContentSchema): ContentField | undefined

// definition/workflow-definition.utils.ts
/** The agent role of the definition with this key, or undefined. */
export function findAgentRole(definition: Pick<WorkflowDefinition, 'agent_roles'>, key: string): AgentRole | undefined

// content/value-labels/hooks/useValueLabelOf.ts
/** What a select field shows for each of its values, in the view of the app, as `useValueLabel` does for one. */
export function useValueLabelOf(
  field: Pick<ContentField, 'path' | 'valueList'>,
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined,
): (value: string) => string
```

```tsx
// components/content-input/ContentFieldInput.tsx
interface ContentFieldInputProps {
  field: ContentField
  /** The values that a field with `x-value-from` may take, read by the form from the artifacts of the project. */
  allowedValues?: readonly string[] | undefined
  /** Titles the values of a field that names a value list; none until the definition loads. */
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined
}

/** One content field of the form around it (`FormProvider` of `ContentFormValues`), by its widget. */
export function ContentFieldInput({ field, allowedValues, definition }: ContentFieldInputProps)
```

```tsx
// components/content-input/ContentValueControl.tsx
interface ContentValueControlProps {
  field: ContentField
  value: unknown
  onChange: (value: unknown) => void
  allowedValues?: readonly string[] | undefined
  definition: Pick<WorkflowDefinition, 'value_lists'> | undefined
  /** The id and `aria-invalid` that the label and the error of the field give the control. */
  controlProps?: FieldControlProps | undefined
}

/** The control of a value by its widget, without a label: the table `widgetControls` has a row per widget. */
export function ContentValueControl(props: ContentValueControlProps)
```

`widgetControls` follows `widgetValueViews` of `ContentFieldValue`: `as const satisfies Record<FieldWidget, (props) => ReactNode>`, so a new widget fails to compile until it has a control.

### `run/entities/status`

```ts
/** Whether a run in this status writes the documents, which the user then cannot change: `running` only. */
export function isWritingRunStatus(status: RunStatus): boolean
```

### `trace/entities`

```text
trace/entities/
├── @x/documents.ts             new: useItemTrace, useOutOfDateItemIds, sourcesOf, itemLinkGroups, types ItemSource, ItemLinkGroup, TraceItem
├── types/chains.types.ts       + ItemSource, ItemLinkRow, ItemLinkGroup
├── utils/chains.utils.ts       new: sourcesOf, outOfDateItemIds, itemLinkGroups
└── hooks/
    ├── useChainQueries.ts      + useOutOfDateItemIds, useReloadTraces
    └── useTraceLinkQueries.ts  + useQuotesCiting
```

```ts
/** Where an item comes from: an `evidenced_by` link and the item it cites, such as a message of an interview. */
export interface ItemSource {
  link: TraceLink
  citedItem: TraceItem
}

/** A link of an item, with the item at its other end, its title, and whether the link was made from an older version of its target. */
export interface ItemLinkRow {
  link: TraceLink
  other: TraceItem
  title: string
  isOutOfDate: boolean
}

/** The links of one type from or to an item, titled by the link type of the definition. */
export interface ItemLinkGroup {
  linkType: string
  title: string
  rows: ItemLinkRow[]
}

export function sourcesOf(trace: Trace, itemId: string): ItemSource[]
export function outOfDateItemIds(trace: Trace): ReadonlySet<string>
export function itemLinkGroups(
  trace: Trace,
  itemId: string,
  linkTypes: readonly { key: string; title: string }[],
  titleOf: (item: TraceItem) => string,
): { outgoing: ItemLinkGroup[]; incoming: ItemLinkGroup[] }

/** The ids of the items of an artifact that link to a target that moved on since; empty while loading or failed. */
export function useOutOfDateItemIds(artifactId: string): ReadonlySet<string>

/** The quotes of the links that cite an item, such as a message; empty while loading. */
export function useQuotesCiting(projectId: string, itemId: string | null): readonly string[]

/** Loads again every query of the traces, after an artifact or an item changed. */
export function useReloadTraces(): () => Promise<void>
```

`itemLinkGroups` takes the link types as plain `{ key, title }`, so `trace` needs nothing new of `workflow`; `useItemLinks` of `documents` gives them from the definition.

### `artifact/entities`

```text
artifact/entities/
├── @x/documents.ts                 + useArtifactOutline, itemStatus, transcriptTurnField, types ItemStatus, OutlineItem
├── artifacts/hooks/useArtifactQueries.ts   + useAllowedValuesOf
├── items/hooks/useApplyRecordChange.ts     new
├── status/
│   ├── item-status.types.ts        ItemStatus + 'outOfDate'
│   ├── item-status.utils.ts        itemStatus options, attentionLevel, attentionText
│   └── item-status.constants.ts    itemStatusMessages.statuses.outOfDate, attention.outOfDate; itemStatusLooks.outOfDate
├── outline/
│   ├── outline.utils.ts            artifactOutline takes outOfDateIds; + itemAnchorId
│   ├── document-blocks.utils.ts    + quoteRanges
│   ├── outline.constants.ts        + transcriptTurnField = 'turn'
│   └── hooks/useArtifactOutline.ts + { outOfDateIds }
├── revisions/
│   ├── revisions.types.ts          + RevisionTarget, RevisionHistoryResult
│   ├── revisions.utils.ts          new: revisionAuthor, previousRevision
│   ├── revisions.constants.ts      + revisionMessages
│   └── hooks/useRevisionQueries.ts + useRevisionHistory
└── components/
    ├── ArtifactDocument.tsx        + actions, targetItemId, markedQuotes
    ├── DocumentBlocks.tsx          + anchors, data-target, marked quotes in a transcript
    ├── ArtifactItemDetails.tsx     + afterMainField
    ├── artifact-view.constants.ts  unchanged
    └── history/                    new
        ├── RevisionHistory.tsx
        ├── RevisionDiff.tsx
        └── __tests__/RevisionHistory.test.tsx, RevisionDiff.test.tsx
```

```ts
/** A record whose versions are read or restored: an item or an artifact, by id. */
export interface RevisionTarget {
  type: 'item' | 'artifact'
  id: string
}

export type RevisionHistoryResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; revisions: Revision[]; hasMore: boolean; isLoadingMore: boolean; loadMore: () => void }

/** The versions of a record, newest first, a page at a time; `isEnabled` waits until they are shown. */
export function useRevisionHistory(target: RevisionTarget, { isEnabled }: { isEnabled: boolean }): RevisionHistoryResult

/** Who made a version: "You" for the user, else the label of the agent role, else its key. */
export function revisionAuthor(origin: Pick<Origin, 'actor' | 'agent_role'>, definition: Pick<WorkflowDefinition, 'agent_roles'> | undefined): string

/** The version right before the given one among the loaded ones, or undefined when it is not loaded. */
export function previousRevision(revisions: readonly Revision[], version: number): Revision | undefined

/** The values that each field with `x-value-from` may take, by field name, from one read of the artifacts of the project. */
export function useAllowedValuesOf(projectId: string, fields: readonly ContentField[]): ReadonlyMap<string, string[]>

/** A record that a change answered: an item or an artifact. */
export type RecordChange = { type: 'item'; record: ArtifactItem } | { type: 'artifact'; record: Artifact }

/** Puts a changed record in the cache, then loads again every list and detail of artifacts and items; settles once they have loaded. */
export function useApplyRecordChange(): (change: RecordChange) => Promise<void>

/** The id of the block of an item on the page of its document, which the address of the item scrolls to. */
export function itemAnchorId(itemId: string): string // `item-${itemId}`
```

`useRevisionHistory` picks the key and the function by `target.type` (`itemKeys.revisions` with `listItemRevisions`, `artifactKeys.revisions` with `listArtifactRevisions`), with `cursorPagesOptions`, so a page that renders it never calls two hooks by condition. `useItemRevisions` and `useArtifactRevisions` stay, unchanged.

```tsx
interface RevisionHistoryProps {
  target: RevisionTarget
  /** The version of the record now: the count of the trigger, and the row without a restore. */
  currentVersion: number
  /** The fields of the schema of the record, for the diff. */
  fields: readonly ContentField[]
  /** The control that restores a version, from the feature that the page places. */
  renderRestore: (revision: Revision) => ReactNode
}
```

`ArtifactDocument` gets `actions?: ReactNode` (at the right of the `h1`, `flex items-start justify-between gap-4`), `targetItemId?: string | null`, `markedQuotes?: ReadonlyMap<string, readonly string[]>`, passed to `DocumentBlocks`. `ArtifactItemDetails` gets `afterMainField?: ReactNode`.

### `documents/entities`

```text
documents/entities/
├── components/                      new
│   ├── ItemSources.tsx
│   ├── item-sources.constants.ts    itemSourcesMessages
│   └── __tests__/ItemSources.test.tsx
├── hooks/
│   ├── useAreDocumentsLocked.ts     new
│   ├── useDocumentOutline.ts        new
│   ├── useItemStatus.ts             new
│   ├── useItemSources.ts            new
│   ├── useItemLinks.ts              new
│   ├── useItemHref.ts               new
│   └── __tests__/                   one test file per new hook
├── documents.types.ts               + ItemSourceView, ItemSourcesResult
└── index.ts                         + the new hooks, ItemSources, types
```

```ts
/** Whether the documents of the project cannot change now: the run that the project shows is writing them. */
export function useAreDocumentsLocked(projectId: string): boolean

/** The outline of a document with the items made from an older version marked `outOfDate`. */
export function useDocumentOutline(artifactId: string): ArtifactOutlineResult

/** The status of one item as its document shows it, and whether the document waits for the review; `status` is undefined until the issue kinds load. */
export function useItemStatus(projectId: string, item: ArtifactItem): { status: ItemStatus | undefined; isUnderReview: boolean }

/** The sources of an item with the title of their transcript; a union with `state`. */
export function useItemSources(projectId: string, itemId: string): ItemSourcesResult

/** The links of an item from it and to it, grouped by link type, each row titled; a union with `state`. */
export function useItemLinks(itemId: string): ItemLinksResult

/** The address that opens an item: its page, or for a kind without a page the document of its artifact at the item. */
export function useItemHref(projectId: string): (item: Pick<TraceItem, 'id' | 'kind' | 'artifact_id'>) => Route
```

```tsx
/** The words an item comes from: for each source, its transcript and turn, the quote, and Read. Nothing without a source. */
export function ItemSources({ projectId, itemId }: { projectId: string; itemId: string })
```

### `artifact/features/edit`

```text
artifact/features/edit/
├── components/
│   ├── EditItemForm.tsx
│   ├── EditArtifactForm.tsx
│   ├── ContentFieldInputs.tsx    the inputs of the fields, with useAllowedValuesOf and the definition
│   ├── EditFormFooter.tsx        the conflict alert, the form error, Save, Cancel and its discard dialog
│   ├── EditRecordButton.tsx
│   └── __tests__/EditItemForm.test.tsx, EditArtifactForm.test.tsx, EditRecordButton.test.tsx, edit-form.data.ts
├── hooks/
│   ├── useUpdateItem.ts
│   ├── useUpdateArtifact.ts
│   ├── useEditForm.ts            useForm with the schema, the defaults, onFirstChange once
│   └── __tests__/useUpdateItem.test.ts, useUpdateArtifact.test.ts
├── schemas/
│   ├── edit-item.schema.ts       editItemFormSchema(fields), EditItemFormValues
│   ├── edit-artifact.schema.ts   editArtifactFormSchema(fields), EditArtifactFormValues
│   └── __tests__/edit-item.schema.test.ts, edit-artifact.schema.test.ts
├── edit.constants.ts             editMessages
├── edit.utils.ts                 itemUpdateBody, artifactUpdateBody, isVersionConflict
├── __tests__/edit.utils.test.ts, edit.utils.data.ts
└── index.ts                      EditItemForm, EditArtifactForm, EditRecordButton, editMessages
```

```ts
/**
 * Saves the changes of an item from its form. On success the detail takes the answer, the lists and
 * the details of artifacts and items load again, `onChanged` runs, a toast says it, and `onSaved`
 * closes the form. A failure shows its problems at the fields through `setError`; `formError`,
 * `isConflict` and `reload` tell the form the rest.
 */
export function useUpdateItem(
  item: Pick<ArtifactItem, 'id' | 'version'>,
  { setError, schema, onChanged, onSaved }: UpdateOptions<EditItemFormValues>,
): UseMutationResult<ArtifactItem, Error, UpdateItemBody> & { formError: string | null; isConflict: boolean; reload: () => void }
```

`useUpdateArtifact` has the same shape over `updateArtifact`. Each of the two hook files declares its own `UpdateOptions`, unexported: a type that only describes the parameters of one file stays in that file.

### `artifact/features/restore`

```text
artifact/features/restore/
├── RestoreVersionDialog.tsx      the trigger and its ConfirmDialog
├── useRestoreVersion.ts          the mutation
├── restore.constants.ts          restoreMessages
├── __tests__/RestoreVersionDialog.test.tsx, useRestoreVersion.test.ts
└── index.ts
```

A lone component and a lone hook stay at the root of the slice (CONTRIBUTING, Files of a slice).

```ts
/** Restores a version of an item or an artifact; the answer replaces the detail and the artifacts and items load again. */
export function useRestoreVersion(
  target: RevisionTarget,
  { onChanged }: { onChanged: () => Promise<void> | void },
): UseMutationResult<ArtifactItem | Artifact, Error, number>
```

### The widgets

```text
documents/widgets/item/
├── components/ItemPage.tsx         edit mode; EditRecordButton; ItemSources in afterMainField; ItemLinks; RevisionHistory with RestoreVersionDialog
├── components/ItemLinks.tsx        new
├── hooks/useItemPage.ts            reads useDocumentOutline and useItemStatus
├── hooks/useItemTab.ts             returns the keep function
├── hooks/useItemCommands.ts        + { isEnabled }
└── item-page.constants.ts          + edit, links and history words
documents/widgets/document/
├── components/DocumentPage.tsx     edit mode; actions slot; RevisionHistory; target and marked quotes
├── hooks/useDocumentTarget.ts      new: the ?item= of the address
├── hooks/useScrollToItem.ts        new: scroll and focus the target once the document is there
└── document-page.constants.ts      + words
documents/widgets/panel/components/DocumentsPanel.tsx   useDocumentOutline in place of useArtifactOutline
```

```ts
/** The item that the address of a document page names (`?item=`), or null. */
export function useDocumentTarget(): string | null

/** Scrolls the block of the item to the middle of the page and gives it the focus, once `isReady` holds; again when the item changes. */
export function useScrollToItem(itemId: string | null, { isReady }: { isReady: boolean }): void
```

`useScrollToItem` runs its effect after the document has rendered (`isReady` is the `success` state of `useArtifactDocument`), finds the block by `itemAnchorId`, and does nothing when it is not there.

## 9. State and data flow

| State | Where | Name |
|---|---|---|
| Item, artifact, revisions, traces, links, quotes | Query hooks of the entities | as section 6 |
| The values of a form | `react-hook-form` in `useEditForm` | `EditItemFormValues`, `EditArtifactFormValues` |
| Edit mode | `useState` in `ItemPageBody` and `DocumentPage` | `isEditing` |
| The discard dialog | `useState` in `EditFormFooter` | `isDiscardOpen` |
| Whether the history is open, which diff is open | `useState` in `RevisionHistory` | `isOpen`, `comparedVersion` |
| The restore dialog | `ConfirmDialog` with its trigger | - |
| The target of a document page | The address, `?item=` | - |

Flow: Edit opens the form with the content; the first change keeps the tab; Save sends the changed fields with `If-Match`; the answer replaces the detail; the artifacts and the items load again, so the tree shows `E` on the item and the history the new version once opened; the traces load again, so a link made from the old version now shows `!` on the items built on it. Restore makes a new version and loads the same queries. While the run writes, Edit and Restore are disabled; when its status changes, the status item of the project loads the run, and they come back.

## 10. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| Edit and Restore disabled | Tooltip "Documents cannot change while the agents work." | `?mock-run-status=running` |
| The form | Every field, the empty optional ones too | an item page, Edit |
| Save pending | `PendingButton` "Saving" | `?mock-update-item=loading`, `?mock-update-artifact=loading` |
| Save failed | The message under the form | `?mock-update-item=error` |
| Problems from the server | At their fields | unit tests (the mock refuses only a value that the form never offers) |
| Version conflict | The alert with Reload | open one item in two browser tabs, save in one, then in the other; unit tests |
| Locked while saving | The `invalid_state` words | unit tests |
| History loading or failed | Skeleton rows; error with Try again | `?mock-item=loading`, `?mock-item=error` after the page loaded (unit tests for the history alone) |
| Show older versions | The button | unit tests (a handler that answers two pages) |
| Restore failed | The dialog stays, a toast | `?mock-restore-item=error`, `?mock-restore-artifact=error` |
| Source | Transcript, turn, quote, Read | REQ-001 of the specification |
| No source | No section | a section item, or an item of the plan |
| Sources or links failed | One line with Try again | `?mock-traces=error` |
| Links with `!` | "Made from version 1; now version 2" | REQ-003 |
| `!` in the tree and the footer | REQ-003 in `primary` with `!`; "1 out of date" | the specification |
| A transcript at a message | Scrolled, marked, the quote highlighted | `Read` on REQ-001 |

```ts
export const contentInputMessages = {
  add: 'Add',
  removeEntry: (index: number, label: string) => `Remove entry ${String(index)} of ${label}`,
  none: 'None',
  chooseValue: 'Choose a value',
} as const

export const revisionMessages = {
  title: (count: number) => `History (${String(count)} ${count === 1 ? 'version' : 'versions'})`,
  version: (version: number) => `Version ${String(version)}`,
  you: 'You',
  compare: (version: number) => `Compare with version ${String(version)}`,
  noChange: 'The content did not change.',
  showOlder: 'Show older versions',
  loading: 'Loading the versions',
  loadError: 'The versions could not load.',
} as const

// itemStatusMessages additions
statuses.outOfDate = { letter: '!', label: 'Based on an older version' }
attention.outOfDate = (count: number) => `${String(count)} out of date`

export const editMessages = {
  edit: 'Edit',
  save: 'Save',
  saving: 'Saving',
  cancel: 'Cancel',
  saved: 'Saved',
  title: 'Title',
  summary: 'Summary',
  titleRequired: 'Enter a title.',
  discard: { title: 'Discard your changes?', description: 'What you changed in this form is lost.', confirm: 'Discard', cancel: 'Keep editing' },
  locked: 'Documents cannot change while the agents work. Try again when they stop or wait for you.',
  lockedReason: 'Documents cannot change while the agents work.',
  conflict: { item: 'This item changed since you opened it.', artifact: 'This document changed since you opened it.', lost: 'Reload to see the new version; what you typed is not kept.', reload: 'Reload' },
} as const

export const restoreMessages = {
  button: 'Restore this version',
  itemTitle: (version: number) => `Restore version ${String(version)}?`,
  artifactTitle: (version: number) => `Restore version ${String(version)} of this document?`,
  itemDescription: (version: number) => `The item gets the content of version ${String(version)} as a new version. The current content stays in the history.`,
  artifactDescription: (version: number) => `The document and each of its items get their content of version ${String(version)} as a new version. The current content stays in the history.`,
  confirm: 'Restore',
  restored: (version: number) => `Restored version ${String(version)}`,
  locked: 'Documents cannot change while the agents work. Try again when they stop or wait for you.',
} as const

export const itemSourcesMessages = {
  title: 'Source',
  turn: (turn: number) => `turn ${String(turn)}`,
  read: 'Read',
  loading: 'Loading the source',
  loadError: 'The source could not load.',
} as const

// itemPageMessages additions
links: (count: number) => `Based on and used by (${String(count)})`,
incoming: (title: string) => `${title} this item`,
outOfDate: (made: number, now: number) => `Made from version ${String(made)}; now version ${String(now)}`,
linksLoadError: 'The links could not load.',
```

## 11. Mocks and screenshots

- No new handler and no new scenario: the edit and restore handlers, `mock-update-item`, `mock-update-artifact`, `mock-restore-item`, `mock-restore-artifact` and `mock-traces` cover the states.
- No fixture change: REQ-001 has a source chain, REQ-003 an out of date link (section 2). Check both in the first unit test of `useItemSources` and `useOutOfDateItemIds` against the mock server, so that a fixture change breaks a test.
- Screenshot cases in `tests/screenshots/projects/documents.spec.ts` (S1b.2): REQ-001 in edit mode; REQ-001 with the history open and version 2 compared (edit it once in the test first, so that a diff exists); REQ-001 with "Based on and used by" open; the specification tree with `!` on REQ-003; the transcript of PER-001 opened by `Read`, with the quote marked.

## 12. Tests

| File | Cases |
|---|---|
| `artifact/.../document-blocks.utils.test.ts` + data (extended) | `quoteRanges`: several quotes in order, a missing quote, overlapping quotes |
| `shared/components/ui/__tests__/disabled-reason.test.tsx` | No reason: the child alone; a reason: tooltip on focus and on hover, the reason as the description; axe |
| `shared/components/frame/.../PageLink.test.tsx` (S1b.0) | Click opens the preview tab; double click keeps; a click with Ctrl does not prevent the default |
| `shared/routes/__tests__` | `document(id, { itemId })` writes `?item=` |
| `workflow/.../content-form.schema.test.ts` | A problem of `validateContent` lands at `content.<name>`; a valid content passes; the result is still a `ZodObject` |
| `workflow/.../content-values.utils.test.ts` + data | `contentChanges`: changed, unchanged, read only included, missing on one side |
| `workflow/.../content-fields.utils.test.ts` + data | `mainField`: first non title field; a schema with the title field only |
| `workflow/.../workflow-definition.utils.test.ts` | `findAgentRole` |
| `workflow/.../useValueLabelOf.test.ts` | A value list title; a written label in each view |
| `workflow/.../ContentFieldInput.test.tsx` + data | One case per widget (data-driven): renders, changes the form value; nullable select stores null; select with allowed values; readOnly shows the value; a problem shows at the field; axe |
| `workflow/.../EntriesControl.test.tsx` | Add, Remove, the labels of Remove, object-list entry fields |
| `run/.../run-status.utils.test.ts` | `isWritingRunStatus` for each status |
| `trace/.../chains.utils.test.ts` + data | `sourcesOf`: a chain to a quote, two sources, no `evidenced_by`, a loop; `outOfDateItemIds`: older `target_version`, superseded target; `itemLinkGroups`: outgoing and incoming, definition order, unknown type |
| `trace/.../useChainQueries.test.ts` | `useOutOfDateItemIds` on the specification gives REQ-003; `useReloadTraces` invalidates the module key |
| `trace/.../useTraceLinkQueries.test.ts` | `useQuotesCiting` for PER-001#2 |
| `artifact/.../item-status.utils.test.ts` + data | `outOfDate` order (after `openIssue`, before `edited`); its level in and out of a review; its look and count text |
| `artifact/.../outline.utils.test.ts` + data | The `outOfDateIds` reach the item nodes and the status counts; `itemAnchorId` |
| `artifact/.../revisions.utils.test.ts` + data | `revisionAuthor` (user, known role, unknown role); `previousRevision` (loaded, not loaded) |
| `artifact/.../useRevisionQueries.test.ts` | `useRevisionHistory` for an item and an artifact; not enabled reads nothing; two pages |
| `artifact/.../useArtifactQueries.test.ts` | `useAllowedValuesOf` for the persona schema |
| `artifact/.../useApplyRecordChange.test.ts` | The answer lands in the detail key of an item and of an artifact; the lists load again; the promise settles after the reload |
| `artifact/.../RevisionHistory.test.tsx`, `RevisionDiff.test.tsx` | Closed reads nothing; open lists versions with reason, author, time; compare toggles the diff; no change; restore slot absent on the current version; Show older versions; `itShowsQueryStates`; axe |
| `artifact/.../ArtifactDocument.test.tsx`, `ArtifactItemDetails.test.tsx` (extended) | The actions slot; anchors; target `data-target`; marked quote in a transcript; `afterMainField` after the main field |
| `documents/entities/hooks/__tests__/*` | `useAreDocumentsLocked` with `running` and `interrupted`; `useDocumentOutline` marks REQ-003; `useItemStatus`; `useItemSources` for REQ-001 (transcript title, turn) and an item without source; `useItemLinks` for REQ-003 (groups, titles, `!`) and its states; `useItemHref` for a requirement and a message |
| `documents/entities/components/__tests__/ItemSources.test.tsx` | Sources, Read opens the transcript at the message, none, loading, error with Try again; axe |
| `artifact/features/edit/.../edit.utils.test.ts` + data | `itemUpdateBody`, `artifactUpdateBody` (only changed fields, stored values, title and summary), `isVersionConflict` |
| `.../edit-item.schema.test.ts`, `edit-artifact.schema.test.ts` | Missing title; a content problem at its path |
| `.../useUpdateItem.test.ts`, `useUpdateArtifact.test.ts` | Sends the changed fields with `If-Match`; updates the cache and reloads; `onChanged` runs; `itToastsOnResult` |
| `.../EditItemForm.test.tsx`, `EditArtifactForm.test.tsx` | `itAsksForFieldsBeforeSending`; Save disabled until a change; first change calls `onFirstChange` once; `422` at the fields; conflict alert and Reload; `invalid_state` words; other error; Cancel clean closes; Cancel dirty asks (`itAsksBeforeAction` with Discard); locked disables Save with the reason; axe |
| `.../EditRecordButton.test.tsx` | Enabled calls `onEdit`; locked shows the reason |
| `artifact/features/restore/__tests__/*` | `itAsksBeforeAction` (Restore); toast; dialog stays on a failure with a toast; locked trigger with the reason; an artifact restore reloads its items |
| `documents/widgets/item/.../ItemPage.test.tsx` (extended) | Edit mode hides the links, the history and the navigator and drops `J` and `K`; the first change keeps the tab; Save returns to reading; the source after the main field; the links grouped with `!` on REQ-003; history with restore; disabled while running |
| `documents/widgets/item/.../ItemLinks.test.tsx` | Groups and headings, counts, `!`, a row opens the item, states; axe |
| `documents/widgets/document/.../DocumentPage.test.tsx` (extended) | Edit in the actions slot; edit mode; history at the end; `?item=` scrolls and focuses the message and marks the quote |
| `documents/widgets/panel/.../DocumentsPanel.test.tsx` (extended) | `!` on REQ-003 and "1 out of date" in the footer |

Helpers: the edit form tests share `renderEditItemForm(item, options)` and the fixtures of one requirement in `artifact/features/edit/components/__tests__/edit-form.data.ts` (one slice uses it). The page tests keep `renderDocumentsFrame`. A step `editField(label, value)` is not added: `replaceText` and `fillFields` do it.

## 13. Docs to update

- `docs/architecture/web-app-modules.md`: S1b.0 the module name `trace` and no `panel` in `artifact`; S1b.1 the row `workflow` (the inputs of the content fields), `artifact` (the history, `outOfDate`), `trace` (sources, out of date items, link groups), `documents` (lock, outline, item status, sources, item address), the `@x` links of section 5 (`trace` gives `documents`); S1b.2 the features `edit`, `restore` of `artifact`.
- `docs/architecture/web-app.md` section 6: the inputs by widget, the save and its errors, the history, the address of a message; section 9: the files.
- `frontend/src/mocks/README.md`: the addresses of section 10 under Documents; the trace scenarios (S1b.0).
- Implementation plan (branch `frontend-plan`): row S1 split into S1b.0, S1b.1, S1b.2; "As built" notes of S1a (section 2.1 of this plan).

## 14. Left for the next PRs

| Item | Where |
|---|---|
| The links and the keys of a document open the peek | S1c |
| Export, and the Export button in the `actions` slot | S1d |
| The edited items counted on the review bar; the review form embeds `ContentFieldInput` | S2 |
| Every quote of a transcript marked, with the citing items in the margin (skeletons 6) | S4 (Trace), with `useLinksCiting` per message |
| Create, delete, move and reorder items by hand | Not planned in S1 |
| Create and remove a trace link | S4 |
| A superseded item page with "Replaced by REQ-014" (5.4) | S3, when search reaches superseded items |

## 15. Commits and checks

S1b.0 `chore/fe/maintenance-before-edit`:

1. `fix(artifact): show the role of a transcript message as text, since a message has no page`
2. `refactor(frame): move the link that opens a page in the preview tab to the frame`
3. `refactor(artifact): remove the placeholder artifact panel`
4. `docs: name the trace module as the code does, and list the trace scenarios`

S1b.1 `feat/fe/edit-entities`:

1. `feat(shared): give a disabled control its reason, and address a document at an item`
2. `feat(workflow): edit the value of a content field by its widget, and compare two contents`
3. `feat(run): tell the run statuses that write the documents`
4. `feat(trace): find the sources, the out of date items and the links of an item`
5. `feat(artifact): read the history of a record, and mark an item made from an older version`
6. `feat(documents): read the lock, the outline with the out of date items, the sources and the address of an item`
7. `docs: describe the inputs, the history, the sources and the out of date state`

S1b.2 `feat/fe/edit-artifacts`:

1. `feat(artifact): edit an item and a document`
2. `feat(artifact): restore a version of an item or a document`
3. `feat(documents): edit, compare and restore on the pages, with the sources and the links of an item`
4. `docs: describe the editing and the versions of the documents`

Each file goes in the commit of its row in section 7. The plan and the prompt stay on `frontend-plan`.

Checks, one at a time, per PR: ESLint and Prettier on the changed files; Vitest on the touched folders (`shared/components/ui`, `shared/components/frame`, `shared/routes`, `modules/workflow`, `modules/run/entities/status`, `modules/trace`, `modules/artifact`, `modules/documents`); typecheck once, since routes and types change. A test that times out only with the others runs again alone. No full suite, E2E, screenshots or build locally; CI runs them. `grep -nP '[^\x00-\x7F]'` on the docs and the new comments; `grep -rnE 'backend|frontend|UI|dashboard|FR-[0-9]|NFR-[0-9]|docs/'` on the new comments.

## 16. Checklist

- [ ] The S1a answers (S1a decision 1) written in `usability.md` on `frontend-plan`
- [ ] A1 to A6 answered by the user and written in `usability.md` on `frontend-plan` before S1b.2
- [ ] S1b.0 from `origin/main`; commits 1 to 4, each checked; PR opened
- [ ] S1b.1 from the S1b.0 branch; commits 1 to 7, each checked; PR opened with its base noted
- [ ] S1b.2 from the S1b.1 branch; commits 1 to 4, each checked; PR opened with its base noted
- [ ] Edit, save, conflict, restore and `Read` checked once in `pnpm dev:mock` (one dev server, one page at a time, stopped after)
- [ ] The description of each PR written from this plan; the endpoints checked against the `*.api.ts` functions that the hooks call
