# Frontend S1b: edit, history, restore, the links and the origin of an item

The plan of S1b of the [Frontend implementation plan](frontend-implementation-plan.md), the second part of the screen Documents, after [S1a](frontend-s1a-documents-plan.md). Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md), checked against `main` at `8126441` (#58). An agent implements from it: every decision is made, and the agent applies it. When the code on `main` differs from what this plan says (a name, a path, a signature), the agent stops and reports the difference instead of choosing.

Short paths: `documents/...`, `artifact/...`, `workflow/...`, `trace/...`, `run/...`, `review/...`, `project/...` are under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`; `lint/...` is `frontend/lint/...`. The module `trace` is the folder `modules/trace` (Web App Modules on `main` still calls it `trace-link`; commit `10f0259` of the docs branch `docs/fe/api-fields` fixes it).

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
10. [Behavior of each component](#10-behavior-of-each-component)
11. [Screen states and words](#11-screen-states-and-words)
12. [Mocks and screenshots](#12-mocks-and-screenshots)
13. [Tests](#13-tests)
14. [Docs to update](#14-docs-to-update)
15. [Left for the next PRs](#15-left-for-the-next-prs)
16. [Commits and checks](#16-commits-and-checks)
17. [Checklist](#17-checklist)

## 1. Row in the PR table

S1b is a docs PR and three stacked PRs, as S1a became #56 (docs) and #55, #57, #58: the changes of the API on the docs branch first, then the fixes of old code, then the entities, then the features with the pages. Each PR is based on the branch of the one before it, and its base changes to `main` once that one is merged.

| PR | Branch | Title | Based on |
|---|---|---|---|
| S1b.D | `docs/fe/api-fields` (exists, with 9 commits not on `main`) | `docs(api): accept a change of a document only during a review, and quote the words of both items of a link` | `main` |
| S1b.0 | `chore/fe/maintenance-before-edit` | `chore(frontend): move the page link to the frame, drop the artifact panel placeholder, fix the transcript links, refuse a change outside a review in the mock, and place the documents files in the folders of their kind` | `main`, once S1b.D is merged |
| S1b.1 | `feat/fe/edit-entities` | `feat(frontend): read the inputs of the content fields, the history of a record, the links and the origin of an item, and when a document can change` | S1b.0 |
| S1b.2 | `feat/fe/edit-artifacts` | `feat(frontend): edit an item and a document during a review, browse and restore their versions, and show the links and the origin of an item` | S1b.1 |

| | |
|---|---|
| Needs | S1a merged (#55, #57, #58): the module `documents`, the pages of a document and an item, `useArtifactOutline`, the item status and its levels, `ItemNavigator` on `FloatingSurface`. E1 (#38): `updateItem`, `updateArtifact`, `restoreItem`, `restoreArtifact`, the revisions, `allowedValues`. E3 (#41): `useItemTrace`, `useArtifactTrace`, `isLinkOutOfDate`, `derivedFrom`, `evidencedBy`. The review entities: `usePendingInterrupt`, with `allow_edits` and `review_artifacts` on the interrupt |
| After it | S1c (peek): the keys of a document open the peek, which shows `ItemOrigin`. S1d (export): the Export button joins the `actions` slot of the document that S1b.1 adds. S2: the review bar counts the edited items; the review form embeds `ContentFieldInput` |
| Docs-first | Nine answers of the user (A1 to A9 below). The API doc states the editing rule that the server applies (A7) and the quotes on both sides of a link (A8), on the docs branch (S1b.D, Docs-first rule of the prompt); the server follows both |

Answers needed before S1b.2. Each has the proposal that this plan builds; the user confirms or changes it, and the answer goes to `docs/ui/usability.md` on `frontend-plan` (section 7.4 for A1 to A5 and A7 to A9, 5.3 for A6) before the code. S1b.0 and S1b.1 do not wait for them, since they hold no screen, except A7 and A8, which change the API: A7 is confirmed by the user (2026-11-03), and A8 is designed by this plan at the request of the user, who reviews its table before S1b.0. S1b.D writes both in the API doc, the data shape and the definition; S1b.0 and S1b.1 make the mock follow; the server repository follows them.

| # | Question | Proposal built here |
|---|---|---|
| A1 | Where the history of an item and of a document sits, and how it opens | A floating surface at the bottom left corner of the page, in three levels: the button History; then the selected version with Newer and Older; then the list of every version above it, newest first, the latest on top. The page shows the selected version (decisions 10, 11) |
| A2 | Whether Restore asks first | Yes, a confirm dialog that is not red: restoring is undone by restoring again (decision 12) |
| A3 | What `Read` of a quote opens, since a message has no page of its own | The transcript document at the message, scrolled to it, its quotes marked (decisions 16, 17) |
| A4 | Where the links of an item show | In three places, each with one job: the words that a link quotes marked in the text; the link line under the key line, every direct link as a chip with the key and the title of the other item, a chip or a mark opening a card with that item; and "Why this item exists" at the end of the page, the chain down to the interview (decisions 14, 16) |
| A5 | What the item page does while it is edited | It shows the form alone: no links, no origin, no history, no Previous and Next, no `J` and `K`, until Save or Cancel (decision 7) |
| A6 | How the `!` state shows in the tree | Letter `!`; color `warning` in a document under review, `primary` outside one; label "Based on an older version" (decision 18) |
| A7 | When the user can change a document | Only while the run waits for a review that allows edits, and only the documents of that review; Edit and Restore show the reason otherwise (decision 9). Confirmed by the user, 2026-11-03 |
| A8 | Which links quote words, and on which side | `quote` becomes `target_quote` (the words of the target), and a link gains `source_quote` (the words of the source); at most one run of words per side, of at most 300 characters (confirmed by the user, 2026-11-03). Per link type: `evidenced_by` and `resolved_by` quote the message; `derived_from` may quote both sides; `concerns` and `flags` quote the target; `stated_by`, `involves`, `depends_on`, `duplicates`, `supersedes` quote nothing. Every quote is optional and marked where its words are. Designed by this plan at the request of the user (2026-11-03); the user reviews the table (decisions 13 to 15) |
| A9 | How the changes of a version read | Inline, in the field where they sit: removed words struck through in red, added words in green (`DiffView`), as "Show changes" of Google Docs and the inline diff of Wikipedia do; a field that did not change reads as it is (decision 11) |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| `docs/ui/usability.md` (`frontend-plan`) 5.3, 5.4, 7.4, 8.2, 8.3 | `Edit` turns the item page into the form of the content schema, empty optional fields show while editing; the source quote with `Read`; "Based on and used by" and "History"; `!` for an item made from an older version of an item it links to; the user words `Based on`, `Source`. The user moved the links into the content and the origin to the end (A4) |
| The user, 2026-11-03 | The links of an item marked inside its content, a click opening a card with the item at the other end, and the card opening its page; the origin as a section at the end that gathers the chain; a failure of the links never blocks the page; the history as a floating surface in levels; Restore kept; after a restore the history stays open with the new version on top; every confirm dialog through a store, as Delete project and Rename project; a change of a document only during a review |
| The user, 2026-11-03, second answer | Quotes on both sides of a link, so that more links are marked in the text; a link shows the title of the other item beside its key, since links apart from the text are hard to follow; which link types quote words and which do not is designed here; the versions newest first; a disabled Edit shows its reason on hover; A7 confirmed |
| `docs/ui/skeletons.md` 5, 6 | TRACE by link type, outgoing and incoming, `!` on an out of date link; TIMELINE: version, who, when; a transcript marks the quote that an item cites, with the citing items |
| `docs/ui/reference-apps.md` 6 | A link `evidenced_by` holds `{message, quote}`; the quote is highlighted in the transcript (Dovetail) |
| `docs/architecture/web-app.md` 6 | The edit form: `x-ui-field-order`, the input of `x-ui-widget`, `readOnly` shown and not editable, `x-value-from` options, the check in the browser, `422` with field paths, `PATCH` with the changed fields and `If-Match`; `interview_message` has no page (`x-ui-navigable: false`) |
| `docs/architecture/web-app-modules.md` 2, 5, 6, 9 | "The fields that edit a value object which several forms embed, without their submit" are an entity; `artifact` may read only `workflow`; `review/widgets/panel` will embed the edit form |
| `docs/API.md` Artifacts and items, Traceability, Resume, Errors | `PATCH` needs `If-Match` (`409 version_conflict`); the editing rule (`409 invalid_state` while a run is `running`; its text also allows a change with no active run, which the server does not, A7); an interrupt has `allow_edits` and `review_artifacts`; restore of an artifact restores its items; the trace body (`quote` on a link); `422` problems at `content.<field>` |
| `frontend/CONTRIBUTING.md` on `main` | Forms (a schema per form, `showFieldProblems`, `formErrorOf`, `PendingButton`), destructive actions (`ConfirmDialog`, only the dialog calls the mutation), dialogs opened through a store, a lone component or hook at the root of a slice, a constants file exports no type |
| `main` at `8126441` | Section 6 lists what is reused. `project/features/delete` with `ProjectDialogs`: the shape of every dialog of this plan. `FloatingSurface` (corners, `glass`), `Highlight` with `renderMark` (a mark wrapped in the trigger of a popover), `DiffView` (words, not lines), `react-error-boundary` (used by the bars of the frame). `TraceItem` carries the whole `content`. The mock: `refuseWhileRunning` refuses a change only while a run runs; run 3 of the mentor thread waits by default at `checkpoint_analysis` (`allow_edits: true`, the requirements analysis under review), so AR-001 and AR-007 can change in `pnpm dev:mock` and REQ-001 cannot; AR-007 is at version 2 |
| The trace fixtures (`mocks/trace/fixtures/mentor-platform-trace-links.fixtures.ts`) | Only `evidenced_by` links carry a `quote`, and the quote is words of the message, the target: "I ask seniors in my club" is in the text of PER-001#2, not in RAW-001 ("I want to find a mentor who works in my field of study."). The chain REQ-001, AR-001, RAW-001, PER-001#2; the out of date link REQ-003 to AR-007 at version 1. Words for both sides exist: REQ-001 "search mentors by field of study" and AR-001 "lists mentors by field of study"; AR-003 "sees their free hours" (built from RAW-002 and LN-001) and RAW-002 "I never know who is free this week"; AR-010 "within 2 seconds" (AMB-001 concerns it); AR-005 "reminds the student and the mentor" (AMB-003, the channel) |
| `docs/DATA_SHAPE.md` TraceLink, Link types, link rules, prompt view | `quote` documented for `evidenced_by` only; the link types with their pairs; "Unique source, target and link type among links that are not removed"; "The direction is always from the later item to the earlier one", not true of `resolved_by`, `depends_on` and `duplicates`; an agent returns an `evidenced_by` link as `{ message, quote }`, the other links as keys |
| `docs/workflow/definition.schema.json`, `requirements_engineering.v1.json` | `linkType` has `key`, `title`, `acyclic`, `pairs`, and `additionalProperties: false`: a new property needs the schema. `mocks/workflow/workflow.handlers.test.ts` compares the copy of the mock with the one of `docs/`, so both change in one commit |
| `docs/workflow/prompts/analyst.v1.md` | The analyst copies the exact quote of each `evidenced_by` link; an ambiguity issue keeps "the exact wording" in its own content (`ambiguous_text`), not on its link |
| `docs/architecture/database.dbml`, `README.md`, `scripts/db-diagram/render.mjs` | `trace_links.quote` with its note; the diagram of the tables is rendered from the DBML by the script |
| Google Docs version history ([help](https://support.google.com/docs/answer/190843)) | The versions in a panel beside the document, grouped versions that expand; the document shows the selected version; "Show changes" highlights what changed; "Restore this version" |
| Notion page history ([guide](https://thomasjfrank.com/learn-notion/edit-history-trash/)) | The old version previewed beside a timeline of versions; a restore replaces the whole page |
| Wikipedia diffs ([Help:Diff](https://en.wikipedia.org/wiki/Help:Diff), [inline switch](https://phabricator.wikimedia.org/T330229)) | "Previous edit" and "Next edit" step through the diffs one version at a time; an inline diff beside the two-column one, for readers who find two columns hard |
| Apple Live Activities ([HIG](https://developer.apple.com/design/human-interface-guidelines/live-activities)) | A compact presentation that expands: the expanded one is an enlarged version of the compact one, so the layout moves predictably between them |
| Android bottom sheets ([Compose](https://developer.android.com/develop/ui/compose/components/bottom-sheets)) | A surface with a collapsed, a partly expanded and an expanded state: one surface, several heights |
| The first draft of this plan (commit `3e437de`) and the reviewed plan (`f507ec0`) | The scope; the sources section and the history section of `f507ec0` are replaced by decisions 10 to 16 |
| Skills `feature-sliced-design`, `clean-review` | Placement by object; composition from the layer above (the widget gives the reason of the lock and the reload of the traces to the features); one idea per helper |

### 2.1 S1a as built, and what this plan does differently

S1a was planned as one PR of 8 commits and became three PRs. What changed between the plan and `main`, and the rule this plan takes from it:

| S1a plan | Built (#55, #57, #58) | Rule for S1b |
|---|---|---|
| Paths `artifact/entities/utils/`, `constants/`, `types/`, `hooks/useItemQueries.ts` | `artifact` split by topic: `artifacts`, `items`, `revisions`, `exports`, `issues`, `status`, `outline` (#55); `workflow` content fields became the group `content` with `fields`, `values`, `value-labels` (#57) | Every path of this plan is a topic path on `main`. A new file goes in the topic of what it reads, and `topicEntityModules` lists what each topic reads |
| One PR | A maintenance PR, an entities PR, a widgets PR, plus a docs PR of the schemas (#56) | Three PRs (section 1); fixes of old code go to S1b.0 |
| `useDocumentList(projectId, { isFollowing })` | `useWritingArtifacts`, `useDocumentsUnderReview`, `useIsDocumentUnderReview`, `useListedDocumentTitle`, `useDocumentDisplays` | Small hooks that each give one thing; this plan adds `useEditLockReason`, `useDocumentOutline`, `useItemStatus` (documents), `useItemLinks`, `useItemOrigin` (trace) and `useItemHref` (artifact) in the same shape |
| `useShownWhileActive` stays in the slice | `useIdleVisibility` went to `shared/lib/timing` | A hook with no product object goes to shared code when its plan says so; this plan names the place of each (section 6) |
| Turn rows for a transcript | `isNavigable`: a kind with `x-ui-navigable: false` has no row and no page | A message is reached through its transcript (decision 17) |
| `itemHref` prop of `ArtifactDocument` | `renderItemLink` prop, and `ArtifactDocument` takes `data` from `useArtifactDocument` | The views take render props and data, never addresses; this plan adds slots in the same shape |
| Words "To read before you approve", "open" | "Needs your review", "to review", "to resolve" | Words follow `itemStatusMessages` on `main` |
| Answers written in `usability.md` | The copy on `frontend-plan` holds none of them (open point 7 still open, 5.3 still draws `*`) | The checklist has an item for the S1a answers, and each answer of A1 to A9 is written before S1b.2 starts |
| Unrelated changes (the budget tooltip, the muted colors) inside the widgets PR | | Nothing outside the scope goes in S1b.1 or S1b.2; a fix met on the way goes to S1b.0 or to the next maintenance PR |
| `ItemLink` in `documents/widgets/document` | Used by one widget | Three slices need it now: it moves to the frame as `PageLink` in S1b.0 |

A bug of S1a found while planning: `DocumentBlocks` draws the role of each message of a transcript with `renderItemLink`, and the document page links it to the item page of the message, which answers "Item not found" since `interview_message` is not navigable. S1b.0 fixes it.

## 3. Decisions

The behavior on the screen of each component is in section 10; a decision that sets a behavior points to its row there.

### Placement

1. **What goes where.** Each piece sits in the module of its object, at the lowest layer that may hold it. `artifact` may import only `workflow`, so what needs `run`, `review` or `trace` is computed in `documents` and given to `artifact` as a parameter or a render prop.

   | Piece | Where | Why |
   |---|---|---|
   | The input of one content field, by its widget | `workflow/entities/components/content-input/` | A content field is an object of `workflow`; several forms embed the inputs (the two edit forms, the review form of S2) without their submit (Web App Modules section 2) |
   | The check of a form of content (`withContentProblems`) | `workflow/entities/content/values/content-form.schema.ts` | The rules are `validateContent`; the form schema only places each problem at `content.<field>` |
   | The fields that changed between two contents (`contentChanges`), the entries left empty (`withoutEmptyEntries`), the main field of a schema (`mainField`), the role of an agent (`findAgentRole`), a label for every value of a select (`useValueLabelOf`), where the words of a quote sit in a content (`findQuote`), which side of a link type may quote words (`quotes` of `linkTypeSchema`) | `workflow/entities` topics `content/values`, `content/fields`, `definition`, `content/value-labels` | Reading rules of contents, schemas and the definition |
   | The history of a record: its queries and rules (`useRevisionHistory`, `revisionAuthor`, `previousRevision`, `revisionKeyOf`), the state of its surface (`useHistoryView`), the surface (`HistorySurface`) and the content of one version with its changes (`RevisionContent`) | `artifact/entities` topic `revisions`, `components/history/` | The versions of one object, read only; the restore control is a render prop |
   | The state `outOfDate` of an item, its level, letter and words | `artifact/entities` topics `status`, `outline` | The status of an item is `artifact`'s; the set of out of date ids comes in as a parameter |
   | The values that a field with `x-value-from` takes, for every field of a form (`useAllowedValuesOf`) | `artifact/entities` topic `artifacts` | Read from the artifacts of the project, beside `useAllowedValues` |
   | The words of the links (`source_quote` of `traceLinkSchema`), the origin of an item (`originOf`), the quotes of each item by side (`linkQuotesByItem`), the out of date items of a trace (`outOfDateItemIds`), the links of an item by type (`itemLinkGroups`), the reload of the traces (`useReloadTraces`) | `trace/entities` | Reading rules and queries of the links; none of them reads another module |
   | Whether a run status writes the documents (`isWritingRunStatus`) | `run/entities/status` | A rule of the run status, as the API states it |
   | The links of an item with the titles of their types and items, and where their words sit in its text (`useItemLinks`, `fieldMarksOf`, `markRangesOf`); the origin with the titles of its items and transcripts (`useItemOrigin`) | `trace/entities` hooks and `utils/link-marks.utils.ts` | Their object is the trace link. `trace` reads `workflow` and `artifact` (`moduleImports`, through `@x/trace.ts` of both), so they need nothing above it, and the Trace screen of S4 (`trace/widgets`) can use them, which it could not from `documents` |
   | When a document can change (`editAccessOf`, `useEditLockReason`), the outline with the out of date items (`useDocumentOutline`), the status of one item (`useItemStatus`) | `documents/entities` | They read `run` or `review` with `artifact` and `trace`; `documents` is the only module above all of them |
   | The address of any item (`useItemHref`) | `artifact/entities/items/hooks/useItemHref.ts` | The page of an item or of its document: `artifact` with the kinds of `workflow` (`isNavigable`) and `routes` |
   | `ItemOrigin`, the section "Why this item exists"; `LinkedItemsPopover`, the card of the items at the other end of a link | `trace/entities/components/` | Blocks of reading over the links. `ItemOrigin`: the item page and the peek of S1c. `LinkedItemsPopover`: the item page and the document page. A widget may not import another widget, and S4 reuses them from `trace/widgets` |
   | Edit an item, edit a document, and the discard dialog of the forms | `artifact/features/edit` | One action on an artifact or an item: same fields, same check, same save, same errors |
   | Restore a version of an item or a document, with its dialog | `artifact/features/restore` | One action |
   | The pages with Edit, the form, the links, the origin, the history and Restore; the transcript with its quotes | `documents/widgets/item`, `documents/widgets/document` | The widgets place the views and the features, give them the reason of the lock, and reload the traces after a change |
   | The dialogs of the edits and the restores, mounted once | `documents/widgets/dialogs` (new) | A dialog opened through a store is mounted once by a dialogs widget of the layout (decision 22); the restore reloads the traces, so the widget sits in `documents` |
   | `!` in the tree and in the footer | `documents/widgets/panel` (reads `useDocumentOutline`) | The tree already draws every status by its look |
   | A button disabled with its reason in a tooltip (`DisabledReason`) | `shared/components/ui/disabled-reason.tsx` | No product object; two features use it (Edit, Restore) and the history uses it for Show changes |
   | Whether a document is drawn as a transcript (`hasTranscript`) | `artifact/entities/outline/document-blocks.utils.ts` | A reading rule of the blocks of a document |
   | A value drawn with marks (`marks`, `renderMark` of `ContentFieldValue`) | `workflow/entities/components/ContentFieldValue.tsx` | The view of a value is `workflow`'s; the ranges come from `documents` through `ArtifactItemDetails` |
   | What follows a change of an artifact or an item: the answer in the cache, then every artifact and item loads again (`useApplyRecordChange`) | `artifact/entities/items/hooks/useApplyRecordChange.ts` | Three callers in two features (save an item, save a document, restore); a cache helper of the entity |
   | The link that opens a page in the preview tab (`PageLink`, today `ItemLink`) | `shared/components/frame/tabs/components/PageLink.tsx` | No product object; three slices use it |
   | The address of a document at one of its items | `shared/routes/project-routes.utils.ts`, `RouteParam.Item` | Every address comes from `routes` |

2. **No feature imports another, and no feature reads `run`, `review` or `trace`.** `artifact/features/edit` and `artifact/features/restore` take `lockedReason: string | null` (null: the record can change) and, for what reloads the traces, an `onChanged` callback from the widget. The widget computes `lockedReason` with `useEditLockReason(projectId, artifactId)` and passes `onChanged = reloadTraces` (from `useReloadTraces` of `trace/entities`), since an edit or a restore changes which links are out of date and `artifact` may not name the keys of `trace` (FSD strategy C: composition from the layer above).

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
   - `EntriesControl` moves the focus itself (section 10): Add appends an empty entry and focuses its control; Remove focuses the entry that takes the place of the removed one, else the one before, else Add. The entries keep their order; there is no reordering.
   - An entry left empty (only spaces, or an entry of an `object-list` whose every field is empty) is dropped on save: `withoutEmptyEntries(fields, content)` of `content/values`, which the bodies of decision 8 apply before comparing. `toStoredContent` alone would send `""`.

5. **The check of a form of content.** `withContentProblems(schema, fields)` returns `schema.superRefine(...)`, which adds each problem of `validateContent(fields, values.content)` at the path `['content', name]`. Each form builds its schema with it, so that the rules of the browser are the rules of `validateContent` and nothing else, and so that `showFieldProblems` finds the fields of the problems of the API (`schemaAt` walks the object and the record of `content`). The refinement comes last: no `.extend` after it, since Zod 4 refuses to extend a refined object. The test of the schema file checks that the result is still a `ZodObject`; if it is not, the agent stops and reports it, since `schemaAt` would no longer find the fields.
   - When the check runs: on Save, then again on each change of a field that has a problem; the focus goes to the first field with a problem. These are the defaults of `react-hook-form` (`mode: 'onSubmit'`, `reValidateMode: 'onChange'`, `shouldFocusError: true`), which no form of the repo changes; `useEditForm` keeps them.

### Edit (`artifact/features/edit`)

6. **The forms.**
   - `EditItemForm({ item, schema, lockedReason, onChanged, onFirstChange })`: the content fields of `contentFields(schema)` in `x-ui-field-order`, the empty optional ones included.
   - `EditArtifactForm({ artifact, schema, lockedReason, onChanged, onFirstChange })`: a `TextField` "Title" (required: "Enter a title."), a `FormField` "Summary" with a `Textarea` (empty is stored as null), then the content fields.
   - Values: the item form holds `{ content }`; the artifact form `{ title, summary, content }`. The default content is the content of the record, with `initialValue(field)` for each field it lacks.
   - On mount, the focus goes to the first field (`setFocus` of `useEditForm`): the first content field of the item form, Title of the artifact form.
   - Save sends only what changed: `itemUpdateBody(fields, item, values)` gives `{ content }` with the fields of `changedFields` passed through `toStoredContent`, after `withoutEmptyEntries`; `artifactUpdateBody(fields, artifact, values)` adds `title` and `summary` when they changed. With `If-Match` at the version the form opened with (`updateItem(item.id, item.version, change)`).
   - Save is disabled while the form is not dirty, and while `lockedReason` is set, with the reason in a tooltip (`DisabledReason`). It is a `PendingButton` ("Saving").
   - Enter in a one-line input submits the form, as a browser does; Enter in a `Textarea` starts a new line. No other key is bound: Escape does not cancel, and there is no `Ctrl+S`.
   - The first change of the form calls `onFirstChange` once, so that the page keeps its tab (5.6: an edit keeps the tab).
   - Cancel on a clean form ends the edit mode (`stopEditing`). Cancel on a dirty form opens `DiscardChangesDialog` through its store (decision 22), with the record key: a `ConfirmDialog`, `destructive`, title "Discard your changes?", description "What you changed in this form is lost.", confirm "Discard", cancel "Keep editing"; Discard ends the edit mode.

7. **The edit mode is a state of the record, not an address.** `useEditingRecordStore` of the feature (`stores/editing-record.store.ts`, zustand, not persisted) holds the key of the record being edited (`recordKeyOf(target)`, such as `item:<id>`), so that the discard dialog, mounted elsewhere, ends it.
   - `useIsEditing(target)` tells a page whether its record is edited; its effect ends the edit mode when the page unmounts. Leaving the page through the tree, a tab or `J`/`K` drops the form without asking, as a browser drops a closed tab.
   - While the item page is edited it shows the title, then the form alone: no link line, no origin, no history, no navigator, and `J` and `K` are not registered (answer A5), so that a restore or a move never meets an open form. Opening the edit mode closes the history surface first (`useHistoryView(..., { isHidden: isEditing })`).
   - When the edit mode ends (Save, Cancel, Discard), the focus goes back to the Edit button of the record: the store keeps `endedKey`, and `EditRecordButton` focuses itself once on mount when `endedKey` is its record, then calls `focusReturned()`. When Edit is disabled by then, the focus goes to the wrapper of `DisabledReason`, which takes the focus.

8. **Save, and what loads again.**
   - On `200`: `await applyRecordChange({ type: 'item', record: saved })` (`useApplyRecordChange` of `artifact/entities`: the answer goes to the detail key, then every list and detail of artifacts and items loads again, with their revisions, since the tree reads the new status and the record moved to a new version), then `onChanged()` (the widget reloads the traces), a toast "Saved", and `stopEditing()`.
   - Errors, in this order:

     | Answer | What shows | Form |
     |---|---|---|
     | `422 validation_failed` | Each problem at its field (`showFieldProblems`); a problem of a field that the form lacks under the form (`formErrorOf`) | Stays open |
     | `409 version_conflict` | An `Alert` at the top of the form: "This item changed since you opened it." (a document: "This document changed since you opened it."), "Reload to see the new version; what you typed is not kept.", and a button Reload, which loads the detail again (`invalidateQueries` of the detail key); the page keys the form on the version, so the form opens again with the new content | Stays open |
     | `409 invalid_state` | Under the form: "This document cannot change now. It can change while it waits for your review." | Stays open |
     | Any other | Under the form: the message of `errorMessageOf(error, {})` | Stays open |

   - `isVersionConflict(error)` in `edit.utils.ts` tells the conflict apart (`ApiError` with `code === ApiErrorCode.VersionConflict`); the words of `invalid_state` come through `errorMessageOf(error, { code: { [ApiErrorCode.InvalidState]: editMessages.locked } })`.

### When a document can change

9. **The rule** (answer A7). The server accepts a change of an artifact or an item (`PATCH`, restore, and the create, delete, move and reorder that S1b does not build) only while the run of the project is `interrupted` by a review whose interrupt allows edits (`allow_edits`) and lists the artifact (`review_artifacts`). Every other change answers `409 invalid_state`.
   - `editAccessOf({ runStatus, interrupt, artifactId })` in `documents/entities/utils/edit-access.utils.ts` gives `{ canEdit: true }` or `{ canEdit: false, reason }`, the first that holds:

     | State of the project | Edit (item, document) | Restore | `reason` | Words of the tooltip |
     |---|---|---|---|---|
     | The run is `running` (`isWritingRunStatus`) | Disabled | Disabled | `agentsWorking` | "Documents cannot change while the agents work." |
     | The run is `interrupted`, its pending interrupt does not allow edits | Disabled | Disabled | `reviewTakesNoChanges` | "This review does not take changes." |
     | The run is `interrupted`, its pending interrupt allows edits but does not list the document | Disabled | Disabled | `notUnderReview` | "Only the documents under review can change now." |
     | The run is `interrupted`, its pending interrupt allows edits and lists the document | Enabled | Enabled | - | - |
     | No run, a run that ended (`succeeded`, `failed`, `cancelled`), or an interrupt not loaded yet | Disabled | Disabled | `noReview` | "A document can change while it waits for your review." |

   - `useEditLockReason(projectId, artifactId)` of `documents/entities` gives the words, or null when the document can change. It reads the run and the pending interrupt through `useDocumentsUnderReview(projectId)`, which gains `interrupt: Interrupt | null` in its result (it reads it already).
   - The pages show Edit and Restore disabled with the words in a tooltip (`DisabledReason`); they never hide them. Export (S1d) and the history do not follow the rule: they only read.
   - A form already open when the rule turns it off stays open: its Save is disabled with the reason, Cancel still works, and a save that started before answers `409 invalid_state` (decision 8). When the run moves on, the status item of the project loads the run again (P7), and the buttons follow without a reload.
   - An item saved during a review shows `E` in the tree (S1a); S2 lists it in the answer of the review (`modified_items`).
   - S1b.D writes the rule in `docs/API.md` (the "Editing rule" paragraph drops "or when the thread has no active run" and names `allow_edits` and `review_artifacts`) and S1b.0 in the mock (`refuseOutsideReview`, decision 25).

### History (`artifact`) and Restore

10. **The history surface** (answer A1). `HistorySurface({ target, currentVersion, view, renderRestore })`, in `artifact/entities/components/history/`, a `FloatingSurface` (`corner="bottom-left"`, `variant="glass"`, `size="sm"`) in the corner of the page that `ItemNavigator` does not use. It has three levels, `view.level`, and each level is the one before with more above it, so that the controls under the pointer stay where they are (the expanded presentation of Apple, the heights of a bottom sheet):

    ```text
    Level closed            Level version                           Level list
                                                                    +------------------------------------+
                                                                    | History                    [=] [x] |
                                                                    |------------------------------------|
                                                                    |  Version 3  Edited    You      5 m |
                                                                    | >Version 2  Reviewed  Analyst  2 d |
                                                                    |  Version 1  Written   Analyst  3 d |
                            +------------------------------------+  | [ Show older versions ]            |
                            | History                    [=] [x] |  |------------------------------------|
                            | [^]  Version 2 of 3                |  | [^]  Version 2 of 3                |
                            | [v]  Reviewed, Analyst, 2 d ago    |  | [v]  Reviewed, Analyst, 2 d ago    |
                            | [ ] Show changes      [ Restore ]  |  | [x] Show changes      [ Restore ]  |
    [ (clock) History ]     +------------------------------------+  +------------------------------------+
    ```

    `[=]` is the toggle of the list, `[x]` Close, `[^]` Newer, `[v]` Older, `>` the selected version.

    - `closed`: a ghost button "History" with `HistoryIcon`, `aria-expanded="false"`. Nothing loads.
    - `version`: the surface, 320 px wide (`w-80`): a header with the heading "History" (`h2`, `tabIndex={-1}`), the toggle of the list (`ListIcon`, "Show every version" or "Hide the list", `aria-expanded`) and Close (`XIcon`, "Close the history"); then the stepper: Newer (`ChevronUpIcon`, "Newer version") and Older (`ChevronDownIcon`, "Older version") beside "Version 2 of 3" and the line "<reason>, <author>, <time>" (`changeReasonLabels` through `useWording`, `revisionAuthor`, `RelativeTime`); then "Show changes" (`Checkbox` with its label) and the control of `renderRestore(version)` for a version that is not the current one.
    - `list`: the list of every loaded version above the stepper, newest first, in a `ScrollArea` of at most `max-h-history-list` (a `--max-height-history-list` entry of the `@theme` block of `src/app/styles.css`, as `max-h-dialog` is; it holds `min(24rem, 50vh)`): one button per version ("Version 2", the reason, the author, the time), the selected one with `aria-current="true"`; "Show older versions" (a `PendingButton`) at its end while there is a next page.
    - Data: `useRevisionHistory(target, { isEnabled: view.level !== 'closed' })`. Loading: the line under "Version 2 of 3" is a `Skeleton`, and the list shows `LoadingState` (`size="compact"`, `rows={3}`, label "Loading the versions"). Error: `ErrorState` (`size="compact"`, "The versions could not load.") with Try again, in place of the stepper.
    - Older selects the version right before; when it is not loaded, the next page loads first and Older shows its pending state. Newer is disabled on the current version, Older on version 1.
    - The state of the surface is `useHistoryView(currentVersion, { isHidden })` of `artifact/entities/revisions/hooks/useHistoryView.ts`, held by the page, which gives the same `view` to the surface and to the content (decision 11): `level`, `selectedVersion`, `showsChanges`, and `open`, `close`, `toggleList`, `stepBack`, `select`, `setShowsChanges`. Its rules:
      - It starts `closed`, with the current version selected and the changes hidden.
      - `close` (Close, and Escape at the level `version`) goes to `closed`, selects the current version and hides the changes. `stepBack` (Escape) goes one level down: `list` to `version` to `closed`.
      - When `currentVersion` changes (a restore, a save), the new current version is selected and the level stays, so that after a restore the surface stays open with the new version on top of the list.
      - When `isHidden` turns true (the edit mode), it closes.
      - A page that shows another record keys the hook on the record id, so the surface starts closed.
    - The document page places the same surface in the same corner, with `target = { type: 'artifact', id }`.

11. **While the history is open, the page shows the selected version, and no link** (answers A1, A9), as Google Docs and Notion show the version chosen in their history. `RevisionContent({ target, view, currentVersion, fields })` of `components/history/` reads the revisions from the cache of `useRevisionHistory` and renders whenever the surface is open (`view.level` is `version` or `list`), for the selected version, the current one at the start:
    - a banner (`Alert`, not an error) at the top: for an older version, "Version 2 of 3, by Analyst, 2 days ago." with the button "Back to the current version" (`view.select(currentVersion)`: the surface stays open); for the current version, "Version 3 of 3, the current one." with the button "Close the history" (`view.close`);
    - each field of the schema that has a value at that version, in `x-ui-field-order`. With "Show changes", a field that differs from the version right before shows its title, the badge "Changed", and `DiffView` of `jsonToPlainText(before)` and `jsonToPlainText(after)`; a field emptied by the version shows its old text struck through. A field without a change reads as `ContentFieldValue`. A version without a change of content (a review) reads "The content did not change." under the banner.
    - "Show changes" is disabled on version 1 with the reason "Version 1 is the first one." (`DisabledReason`). When the version right before is not loaded, the next page loads, and the fields show without marks until it arrives.
    - The links belong to the current version, so none shows while the history is open, at either level and whatever version is selected: on the item page, `RevisionContent` takes the place of the fields, and the link line, the marks in the text and "Why this item exists" do not render; the title, the key line and Edit stay. On the document page, it takes the place of the fields of the document (`fieldsView` slot of `ArtifactDocument`), the marks of a transcript and their cards do not render, and the title, the summary and the items stay as they are now, under the line "The items below are as they are now; each item has its own history." (a revision holds the content only). When the surface closes (level `closed`), the page shows the current version again with its links.
    - Edit stays on the page while a version is shown: pressing it closes the history (the current version shows) and opens the form.

12. **Restore** (`artifact/features/restore`, answer A2).
    - `RestoreVersionButton({ target, version, lockedReason })`: a ghost button "Restore this version" (icon `HistoryIcon`), disabled with its reason while `lockedReason` is set, which opens `RestoreVersionDialog` through its store with `revisionKeyOf(target, version)` (decision 22).
    - `RestoreVersionDialog`, a `ConfirmDialog`, not `destructive`: the current content stays in the history, and restoring it again undoes the action. Item: title "Restore version 2?", description "The item gets the content of version 2 as a new version. The current content stays in the history." Document: title "Restore version 2 of this document?", description "The document and each of its items get their content of version 2 as a new version. The current content stays in the history." Confirm "Restore".
    - On success: `await applyRecordChange(...)` with the answer, `onChanged()` (the traces), a toast "Restored version 2". The revisions load again, so the surface stays at its level, the new version comes first in the list, and it is selected (decision 10). On a failure the dialog stays open and a toast gives `errorMessageOf(error, { code: { [ApiErrorCode.InvalidState]: restoreMessages.locked } })`.
    - Only `RestoreVersionDialog.tsx` calls `useRestoreVersion`.

### Quotes, links and origin

13. **Quotes on both sides of a link** (answer A8, a change of the API that S1b.D writes).
    - Today a link has one `quote`: words of its target, and only `evidenced_by` fills it. S1b.D renames it `target_quote`, and adds `source_quote`: the words of its source item that the link is about. Both names say the side they quote. The rename breaks the field for the server, the stored rows (`trace_links.quote`) and the output models of the agents, which follow the docs; the app and the mock follow in S1b.1, in one commit; the app stores no link, so it has nothing to migrate.
    - The direction of a link: every link reads from its source to its target through the title of its link type, "REQ-001 Based on AR-001", "RAW-001 Evidenced by PER-001#2", "AMB-001 Applies to AR-010", "VAL-001 Points out REQ-004", "REQ-002 Depends on REQ-001", "REQ-014 Replaces REQ-009". The `pairs` of each link type in the definition fix which kinds may be the source and which the target, so no link type is read the other way. Two things only look reversed. First, the trace API names its `direction` after the question it answers, not after the arrows: `backward` (where the item came from) follows each link from its source to its target, so the item whose trace is read is the source of the links it follows: the backward trace of REQ-001 reaches AR-001 through "REQ-001 Based on AR-001". `forward` (what was built from it) goes from the target to the source: the forward trace of AR-001 reaches REQ-001. The mock does this (`backward` leaves from `source_item_id` in `mocks/trace/lookup/chains.lookup.ts`), and DATA_SHAPE names the two questions, but `docs/API.md` does not say it; S1b.D adds to the row of `GET /items/{item_id}/trace`: "`backward` follows the links from their source to their target, `forward` from their target to their source." Second, the page of a target reads its links from the other end ("Based on this item"). The sentence of DATA_SHAPE "The direction is always from the later item to the earlier one" is not true of `resolved_by` (the answer usually comes after the issue, in a later interview), `depends_on` and `duplicates` (no order in time); S1b.D replaces it with "A link reads from its source to its target through the title of its link type; following `derived_from` and `evidenced_by` from any item leads back to the interview."
    - How many words per link: at most one run of words per side. The data shape allows one link per source, target and link type ("No duplicate"), and one excerpt per side keeps the two sides paired: the `source_quote` is the part of the source that comes from, or speaks of, the `target_quote`. An excerpt is one run of words of one text field of its item, of at most 300 characters. An item that uses two separate parts of one target quotes the main part; the analyst prompt already writes one requirement per item, so two parts are rare. A list of pairs (`quotes: [{ source, target }]`) is left out: it would let one link mark several places, at the cost of a list in every check, mark and card.
    - The definition says, per link type, which side may carry words: `quotes: { source: boolean, target: boolean }` in `linkType` of `docs/workflow/definition.schema.json`. A quote is never required: an agent gives one when the link is about some words, not about the whole item. Version 1:

      | Link type (title) | From -> to | `source_quote` | `target_quote` | The words |
      |---|---|---|---|---|
      | `evidenced_by` (Evidenced by) | raw requirement, latent need -> message | no | yes | The words of the interview that the item comes from. The analyst prompt asks for one on every raw requirement, as today; a latent need may rest on a message without exact words |
      | `resolved_by` (Resolved by) | ambiguity issue, conflict -> message | no | yes | The words of the answer that settle it |
      | `derived_from` (Based on) | analyzed -> raw, latent; specified -> analyzed; backlog -> specified | yes | yes | `source_quote`: the words of the new item that come from this target, given when the item is built from several items or from a part of one ("sees their free hours" of AR-003 comes from RAW-002). `target_quote`: the words of the target that it uses, given when it uses a part ("I never know who is free this week") |
      | `concerns` (Applies to) | assumption, ambiguity issue, conflict -> requirement | no | yes | The words of the requirement that the issue is about ("within 2 seconds" of AR-010, which AMB-001 finds vague) |
      | `flags` (Points out) | validation issue -> any item | no | yes | The words that the check found wrong; none when the whole item is wrong |
      | `stated_by`, `involves` (Stated by, Involves) | -> persona | no | no | A person, not words |
      | `depends_on`, `duplicates`, `supersedes` (Depends on, Same as, Replaces) | -> the same kind | no | no | Whole items |

      The source side stays empty where the source is the one that speaks of the target as a whole: an issue is about some words of the requirement (target side), a raw requirement is a statement of its own.
    - What the server checks (API doc): a quote on a side that its link type does not allow answers `422 validation_failed` at `target_quote` or `source_quote`; so does a quote longer than 300 characters; a quote must be found word for word in one text field of its item (the target at `target_version`, the source at its version when the link is made), else `422` at that field. Nothing rewrites a quote later.
    - What an agent returns (DATA_SHAPE, prompt view): a link that may carry words is an object, `{ "<field>": "<key>", "target_quote": "<exact words>", "source_quote": "<exact words>" }` with the words it has (an `evidenced_by` link, `{ "message": ..., "quote": ... }` today, becomes `{ "message": ..., "target_quote": ... }`); a link that carries none stays a key. The analyst prompt gains `target_quote` on `concerns` and `resolved_by`, and `source_quote` and `target_quote` on `derived_from`.
    - What the screen does with a quote: it looks for the words in the text of their item, `findQuote(fields, content, quote)` of `workflow` (the `text` and `textarea` fields, the main field first, then in `x-ui-field-order`; the first place wins; a `list` entry is not searched). Found: a mark in the text (decisions 14, 15). Not found, since the item changed after the link was made: no mark, and the card shows the words under "The words it quotes" with "These words are no longer in the text." Two links that quote overlapping words of one text make one mark, whose card lists both.
    - Cost: one nullable text field per link, one boolean pair per link type, one substring check per quote on the server, and words that the agents copy for five link types only. The marks reuse `Highlight` and the card of decision 14 for both sides.

14. **The links of an item, inside its content** (answers A4, A8). Three places, each with one job:

    | Place | What it shows | Which links |
    |---|---|---|
    | Marks in the text | The words of this item that a link quotes, marked where they are | Outgoing links with a `source_quote`, incoming links with a `target_quote`, when the words are found |
    | The link line, under the key line | Every direct link: the words of its group, then the key and the title of the other item | All the links of depth 1, both directions, with or without words |
    | Why this item exists, at the end | The chain the item is based on, down to the interview | The `derived_from` steps, and the `evidenced_by` citations at their ends (decision 16) |

    ```text
    REQ-001   Must   Approved   version 3                                                key line
    Based on [AR-001 The system lists mentors by field...]   Based on this item [US-001 Search by field]
    Statement
    The system shall let a student [search mentors by field of study].
                                    ^ marked: the source_quote of the link to AR-001
    ```

    - Rules: `linkQuotesByItem(trace)` of `trace/entities` gives, by item id, its `LinkQuote[]`: for each link with a `source_quote`, an entry on its source (`side: 'source'`); for each link with a `target_quote`, an entry on its target (`side: 'target'`); `LinkQuote = { link, side, quote, other: TraceItem }`. `fieldMarksOf(content, quotes, { fields, isIssue })` of `trace/entities/utils/link-marks.utils.ts` places them with `findQuote` and gives, by field name, `LinkMarkRange[]` (`HighlightRange` plus `id` and `linkIds`), overlapping ranges merged; `markRangesOf(text, quotes, { isIssue })` does the same for one text (a message). A mark is `warning` when the other item of one of its links is of an issue kind (`useIssueKinds`), else `primary`.
    - Data: `useItemLinks(itemId)` of `trace/entities` reads `useItemTrace(itemId, { direction: 'both', depth: 1 })`, the link types of `useWorkflowDefinition`, the schemas of `useArtifactKinds` (for `itemTitle` and the fields) and `useIssueKinds`, and gives `{ state: 'success', outgoing, incoming, count, fieldMarks, rowsByLinkId }`, or `pending`, or `error` with `retry`. Groups: `itemLinkGroups(trace, itemId, { linkTypes, titleOf })` of `trace/entities` (`{ outgoing, incoming }`: the links whose source is the item, then those whose target is the item, each grouped by link type in the order of `linkTypes`, rows in key order; a row is `{ link, other, title, isOutOfDate }`; a link type missing from `linkTypes` comes last, titled by its key).
    - Marks: `ArtifactItemDetails` gets `fieldMarks?: ReadonlyMap<string, readonly Range[]>` and `renderFieldMark?: (range: Range, children: ReactNode) => ReactNode` (generic over `Range extends HighlightRange`), passed to `ContentFieldValue`, which draws a `text` or `textarea` value with `Highlight` (`variant="soft"`, the color of the range, `solid` while the range is active) and `renderMark`. The page wraps each mark in `LinkedItemsPopover` with one entry per link of the mark. `artifact` and `workflow` read no link: they get ranges and a wrapper.
    - The link line: `ItemLinkLine({ projectId, itemId, activeLinkId, onActiveLinkChange })` of `documents/widgets/item`, given to `ArtifactItemDetails` through the new slot `afterKeyLine`. Each group: its words in `text-xs text-muted-foreground` (an outgoing group: the title of its link type, "Based on"; an incoming one: the title followed by " this item", "Based on this item"), then one chip per row. A chip is a `Button` (`variant="ghost"`, `size="xs"`, `bg-primary/10`) with the key in `font-mono` and the title of the other item after it, cut at `max-w-48` (`truncate`); `!` in `warning` before the key when the row is out of date; a dotted underline when the link has a mark in this text. Its `aria-label` is "AR-001, The system lists mentors by field of study" (plus ", made from an older version" when out of date). A group shows its first `linkChipsShown` chips (5, in `item-page.constants.ts`) and "5 more" (a ghost button) that shows the rest in place.
    - The two go together: hovering or focusing a chip makes the marks of its link `solid`; hovering or focusing a mark gives the chips of its links a ring. The page holds `activeLinkId` (`useState`) for both.
    - A chip or a mark opens `LinkedItemsPopover` (behavior in section 10): per entry, the words of the group, the key and the title, the review status (`reviewStatusLabels` through `useWording`) and the version, then "The words it quotes" when the link has words on the side of the other item (its `target_quote` for an outgoing link, its `source_quote` for an incoming one), drawn as the main field of the other item (`mainField` of its schema, `line-clamp-3`) with those words marked when they are in it, else as a `blockquote`; "Made from version 1; now version 2" when out of date; and "Open", a `PageLink` to `useItemHref(projectId)(other)`.

      ```text
      +----------------------------------------+
      | Based on                               |
      | AR-001  The system lists mentors by    |
      |         field of study.                |
      | Approved   version 1                   |
      | The system [lists mentors by field of  |
      | study].                                |
      |                               [ Open ] |
      +----------------------------------------+
      ```

    - `LinkedItemsPopover({ projectId, entries, children })` of `trace/entities/components/`: a `Popover` whose trigger is `children`; `entries: LinkedEntry[]`, `LinkedEntry = { item: TraceItem; relation: string; isOutOfDate: boolean; otherQuote: string | null }`; one block per entry, separated by a `Separator`. 320 px wide (`w-80`), `align="start"`.
    - The marks, the link line and the cards show in the Read mode only (decision 19): not while the history is open, at either level, and not while the form is open.
    - No link: the line does not render and nothing is marked. Loading: one `Skeleton` line (`h-6 w-64`), the text without marks. Error: one line "The links could not load." with Try again, the text without marks (decision 20).

15. **The quotes of a transcript** (answer A8). On a document drawn as a transcript, the words of each message that a link quotes are marked, and a click on a mark opens the same card with the items that quote them.
    - Data: `useLinkQuotesOf(artifactId, { isEnabled })` of `trace/entities` reads `useArtifactTrace(artifactId, { direction: 'forward', depth: 1 })` (the items that link to the messages, with their links) and gives, in the same shape as `useItemLinks` and `useItemOrigin`, a union with `state`: `pending`, `error` with `retry`, or `success` with `quotesByItem` from `linkQuotesByItem`; while it loads or fails, the page draws no marks (`useOutOfDateItemIds` keeps its plain set instead: it never surfaces an error, the `!` state just does not show). The document page enables it when the document holds a transcript block (`hasTranscript(blocks)` of `outline/document-blocks.utils.ts`) and computes `markRangesOf(text, quotes, { isIssue })` per message.
    - View: `ArtifactDocument` gets `messageMarks?: ReadonlyMap<string, readonly Range[]>` (by message id) and `renderMessageMark?: (range: Range, children: ReactNode) => ReactNode`, passed to `DocumentBlocks`, whose transcript draws the text of a message with `Highlight` and its `renderMark`. The page wraps each mark in `LinkedItemsPopover` with one entry per link of the mark (`relation` "Quoted by"). An `evidenced_by` mark is `primary`; a `resolved_by` mark, from an issue, is `warning`.
    - The marks show in the Read mode only: while the history of the document is open, the transcript renders without them.
    - When the links fail, the transcript renders without marks and a line above it says "The quotes could not load." with Try again (decision 20).

16. **Why this item exists** (the origin of an item, answers A3, A4). A section at the end of the item page, after the fields, which gathers the chain that the item comes from, down to the words of the interview:

    ```text
    Why this item exists
      Based on  AR-001  The system lists mentors by field of study.
                for "search mentors by field of study"
        Based on  RAW-001  I want to find a mentor who works in my field of study.
          Student interview, turn 2                                          Read
          I ask seniors in my club, but I never know who is free this week, so I give up.
          ^^^^^^^^^^^^^^^^^^^^^^^^ the quote, marked
    ```

    - Rule: `originOf(trace, itemId)` of `trace/entities` follows the `derived_from` links backward from the item, and gives `{ evidence: Citation[], steps: OriginStep[] }`: the `evidenced_by` citations of the item itself (`Citation = { link, quote, citing, cited }`), then one step per `derived_from` target, `OriginStep = { link, item, evidence: Citation[], steps: OriginStep[] }`. Steps and citations in key order; an item met twice (two paths to one raw requirement) is a step once, under its first path; a loop is walked once.
    - Which items have an origin: an item that has a `derived_from` link to follow or an `evidenced_by` link. In the definition of version 1: a raw requirement and a latent need (their quotes), an analyzed requirement, a specified requirement and a backlog item (through their chain). A persona, a section, a message, an issue, an assumption or a stakeholder type has none, and the section does not render.
    - Data: `useItemOrigin(projectId, itemId)` of `trace/entities` reads `useItemTrace(itemId, { direction: 'backward', depth: ORIGIN_TRACE_DEPTH })` (`ORIGIN_TRACE_DEPTH = 5`, a private setting at the top of `useItemOrigin.ts`: enough for message, raw requirement, analyzed requirement, specified requirement, backlog item), the schemas of `useArtifactKinds` (titles) and the transcript titles from `useProjectArtifacts(projectId)` (already loaded by the panel), and gives `{ state: 'success', origin: OriginView }`: the same tree with each step titled and marked out of date (`isLinkOutOfDate`), and each citation as `CitationView = { citation, transcriptTitle, turn, text }` (`turn` from `content.turn` of the message, null when it is not a number; `text` from `transcriptContentField`).
    - View: `ItemOrigin({ projectId, itemId })` renders the section "Why this item exists" (`h2`): each step a row, indented one step per level (`pl-4`), "Based on" (the title of the link type), the key and the title as a `PageLink` to `useItemHref(projectId)(item)`, and `!` with "Made from version 1; now version 2" when out of date; under the row, when the link has a `source_quote`, the line `for "<words>"` in `text-xs text-muted-foreground`: the words of the item above that come from this step. Each citation: the line "Student interview, turn 2" (the transcript title, then "turn N" when known) with `Read` at its right (a `PageLink` to `useItemHref(projectId)(cited)`: the transcript at the message, decision 17), then the text of the message in a `blockquote` with the quote marked (`Highlight`, the range of `quoteRange(text, quote)`); a citation without a quote shows the line and the text unmarked.
    - The rows here are links, not chips with a card: the section is already the summary that the card would give.
    - Loading: `LoadingState` (`size="compact"`, `rows={2}`, label "Loading where this item comes from"). Error: `ErrorState` (`size="compact"`, "Where this item comes from could not load.") with Try again (decision 20).

17. **The address of any item** (`useItemHref(projectId)`, in `artifact/entities/items`). A navigable item opens its item page (`routes.project(projectId).item(id)`). An item of a kind with `x-ui-navigable: false` (a message) opens the document of its artifact at the item: `routes.project(projectId).document(artifactId, { itemId })`, which adds `?item=<id>` (`RouteParam.Item`).
    - The document page reads the parameter (`useDocumentTarget()`), and once the document has loaded it scrolls the block of that item into view (`block: 'center'`) and moves the focus to it (`useScrollToItem`).
    - Every block of an item in `DocumentBlocks` gets `id={itemAnchorId(item.id)}` and `tabIndex={-1}`, and the target `data-target` (styled `data-target:bg-accent/50`). The mark stays while the address names the item; the next address without the parameter drops it.
    - The tab of the page keeps its address without the parameter (`useEditorTab` already uses `project.document(artifactId)`).

18. **The state `outOfDate`** (answer A6).
    - `ItemStatus` gains `outOfDate`. `itemStatus(item, issueKinds, { outOfDateIds })` (the third argument optional, empty by default, so the callers of S1a compile unchanged) gives, the first that holds: `openIssue`, `outOfDate` when the id is in `outOfDateIds`, `edited`, the review status.
    - `attentionLevel('outOfDate', { isUnderReview })`: `act` under review, `follow` outside one (a change in motion, as `edited`).
    - Look: letter `!`, label "Based on an older version"; count text `"2 out of date"`; the tooltip of a row reads the label, as the other states do.
    - Data: `outOfDateItemIds(trace)` of `trace/entities` gives the sources of the links that `isLinkOutOfDate` finds. `useOutOfDateItemIds(artifactId)` reads `useArtifactTrace(artifactId, { direction: 'backward', depth: 1 })` and memoizes the set (empty while it loads or fails). `useDocumentOutline(artifactId)` of `documents/entities` is `useArtifactOutline(artifactId, { outOfDateIds: useOutOfDateItemIds(artifactId) })`; the panel and the item page read it in place of `useArtifactOutline`. `useItemStatus(projectId, item)` of `documents/entities` gives `{ status, isUnderReview }` for one item the same way (used by the item page, and by the peek of S1c).
    - In the mock data, REQ-003 of the specification shows `!` (its link to AR-007 was made at version 1; AR-007 is at version 2).

### Pages, failures, reloads, dialogs

19. **The pages place the features, in three modes.**

    | Mode | When | Item page | Document page |
    |---|---|---|---|
    | Read | The history is closed and no form is open | Title with Edit; key line; the link line; the fields with the quoted words marked; "Why this item exists"; the History button; the navigator | Title with Edit (and Export, S1d); the fields; the items, the quoted words of a transcript marked; the History button |
    | History | The history surface is at the level `version` or `list` | Title with Edit; key line; `RevisionContent` (banner, the fields of the selected version, its changes when asked); the surface; the navigator. No link line, no marks, no origin | Title with Edit; `RevisionContent` in place of the fields; the items as they are now, without marks; the surface |
    | Edit | After Edit, until Save, Cancel or Discard | Title, then the form alone | Title, then the form alone |

    Edit from the History mode closes the history first. A chip or a mark opens its card in the Read mode only, so no card stays open when the mode changes.

    Item page (read mode):

    ```text
    header   breadcrumb (unchanged)
    article  h1 title ......................................... [ Edit ]       EditRecordButton
             key line (status, key, version)                                   ArtifactItemDetails
             Based on [AR-001 The system lists...]  Based on this item [US-001 ...]   afterKeyLine: ItemLinkLine
             main field, its quoted words marked                               fieldMarks, renderFieldMark
             the other filled fields, their quoted words marked
             Why this item exists                                              ItemOrigin
    corners  [ History ] bottom left                    [ < 3 of 18 > ] bottom right
             HistorySurface                             ItemNavigator (unchanged)
    ```

    Item page (a version shown): the header, the `h1` title with Edit, the key line, then `RevisionContent` (banner and fields); the history surface stays open; no link line, no origin.

    Item page (edit mode): the header, the `h1` title, then `EditItemForm` keyed on `item.version`; nothing else.

    Document page (read mode): `ArtifactDocument` with `actions = <EditRecordButton>` at the right of the title, the quotes of a transcript marked (decision 15), the history surface at the bottom left. A version shown: `fieldsView = <RevisionContent>`. Edit mode: the title of the document, then `EditArtifactForm` keyed on `artifact.version`; the items stay on their own pages and are not shown.

    - `EditRecordButton({ target, lockedReason })` of `artifact/features/edit`: an outline button "Edit" (icon `PencilIcon`), disabled with its reason while locked; it starts the edit mode of its record (`startEditing(target)`).
    - The first change keeps the tab: `useItemTab` returns the function that `useEditorTab` gives (today it drops it), and `DocumentPage` keeps it too.

20. **A failure of the links stays in its block.** The item page renders its title, key line and fields from `useItem` and `useItemSchema` alone; the link line, the origin, the history and the quotes of a transcript read their own queries.
    - A query that fails shows the compact error of its block (decisions 10, 14, 15, 16) and nothing else changes: no query of this PR sets `throwOnError`, so a query error never reaches a boundary.
    - Each of these blocks (`ItemLinkLine`, `ItemOrigin`, `HistorySurface`, and the marks of the transcript as a whole) sits inside an `ErrorBoundary` of `react-error-boundary`, as the bars of the frame do, with `resetKeys={[itemId]}` (the document: `[artifactId]`): a render error in a block shows its compact `ErrorState` with Try again (`resetErrorBoundary`) and leaves the page as it is. The fallback of the transcript marks is the transcript without marks.
    - Loading never waits on these blocks: each draws its own placeholder.

21. **One reload rule after a change.** An edit or a restore loads again what shows artifacts and items (`useApplyRecordChange` of `artifact`, inside the features, built on `useReloadArtifacts`) and what shows traces (`useReloadTraces` of `trace`, called by the widget through `onChanged`). `useReloadTraces` invalidates `traceModuleKeys.all()`, so the chains, the links, the citations and the traceability views load again.

22. **Every dialog through a store** (as Delete project and Rename project). A dialog never sits beside its trigger:
    - each dialog has a store from `createPendingActionStore()` (`targetId`, `open`, `openDialog`, `setOpen`, `closed`), the hooks `useOpen<...>Dialog` and `use<...>Dialog` in one file, and its trigger calls the first;
    - `DocumentDialogs({ projectId })` of `documents/widgets/dialogs` mounts each dialog once, as `ProjectDialogs` does, and the project layout mounts `DocumentDialogs` in `projectContributions` after `ProjectDialogs`;
    - `DiscardChangesDialog` (`useDiscardChangesDialogStore`, `targetId` the record key) ends the edit mode on Discard;
    - `RestoreVersionDialog` (`useRestoreVersionDialogStore`, `targetId` = `revisionKeyOf(target, version)`, such as `item:<id>@2`, read back with `parseRevisionKey`) restores; `DocumentDialogs` gives it `onChanged = reloadTraces`;
    - a dialog of another record starts afresh (`key` on the target id), and the target stays while the dialog closes, so that it closes with its animation;
    - when a dialog closes, the focus goes back to the element that had it before it opened (Radix), and to the heading of the history surface after a restore, since the restore button of the old version is gone by then (decision 10: the surface focuses its heading when `currentVersion` changes while it is open).

23. **Words** in `contentInputMessages` (`workflow/entities/components/content-input/content-input.constants.ts`), `revisionMessages` (`artifact/entities/revisions/revisions.constants.ts`, beside `changeReasonLabels`), `itemStatusMessages` (+ `outOfDate`), `editMessages` (`artifact/features/edit/edit.constants.ts`), `restoreMessages` (`artifact/features/restore/restore.constants.ts`), `editAccessMessages` (`documents/entities/edit-access.constants.ts`), `itemOriginMessages` and `linkedItemMessages` (`trace/entities/components/item-origin.constants.ts`, `linked-items.constants.ts`), and the page words in `itemPageMessages` and `documentPageMessages`. `DisabledReason` has no words of its own: it takes the reason as a prop.

24. **`'use client'`.** The project layout reaches `documents/widgets/panel` and `documents/widgets/dialogs`, and through them `documents/entities`; every new hook there that imports React state or effects starts with `'use client'`: `useEditLockReason`, `useDocumentOutline`, `useItemStatus`. The new hooks of `artifact`, `trace` and `workflow` that the pages reach (`useRevisionHistory`, `useHistoryView`, `useAllowedValuesOf`, `useItemHref`, `useOutOfDateItemIds`, `useLinkQuotesOf`, `useItemLinks`, `useItemOrigin`, `useReloadTraces`, `useValueLabelOf`) start with it too; the components with state (`HistorySurface`, `RevisionContent`, `ContentFieldInput`, `EntriesControl`, the forms, `EditRecordButton`, `DiscardChangesDialog`, `RestoreVersionButton`, `RestoreVersionDialog`, `ItemOrigin`, `LinkedItemsPopover`, `DisabledReason`, `DocumentDialogs`) as well.

### The docs branch and the maintenance (S1b.D, S1b.0)

25. **S1b.D, the docs branch, gets two commits; S1b.0 holds seven small changes, one commit each.**
    - S1b.D, on `docs/fe/api-fields` (the Docs-first rule of the prompt: a change of the API goes to that branch): the editing rule in `docs/API.md` (the "Editing rule" paragraph: a change is accepted only while the run is `interrupted` by an interrupt that allows edits and lists the artifact in `review_artifacts`; every other change answers `409 invalid_state`; decision 9), then the quotes on both sides of a link (decision 13): `docs/API.md` (the trace body and the body of `POST /projects/{id}/trace-links`: `quote` renamed `target_quote`, `source_quote` added; the rules of the quotes; the sentence on `backward` and `forward` of decision 13), `docs/DATA_SHAPE.md` (TraceLink: `target_quote` and `source_quote`; the table of the link types gains the two columns of decision 13; the sentence on the direction of a link replaced as decision 13 says; the prompt view of a link with words), `docs/ui/reference-apps.md` (`{message, target_quote}`), `docs/workflow/definition.schema.json` (`quotes` of `linkType`, required, two booleans), `docs/workflow/requirements_engineering.v1.json` and its copy of the mock (the `quotes` of each link type; one commit, since `workflow.handlers.test.ts` compares them), `docs/workflow/prompts/analyst.v1.md` (the words of `derived_from`, `concerns`, `resolved_by`), `docs/architecture/database.dbml` and `README.md` (`trace_links.quote` renamed `target_quote`, `trace_links.source_quote`), and the diagram of the tables rendered again from the DBML with `scripts/db-diagram/render.mjs`. `linkTypeSchema` of the app ignores `quotes` until S1b.1 reads it (zod drops a key it does not know). The branch already names the module `trace` in Web App Modules (`10f0259`). The user merges S1b.D before S1b.0 starts.
    - S1b.0:
      - `DocumentBlocks` draws the role of a message of a transcript as plain text (`span`), not through `renderItemLink`: a message has no page. Its test checks that no link is drawn for a message.
      - `ItemLink` moves with `git mv` to `shared/components/frame/tabs/components/PageLink.tsx`, renamed `PageLink`, exported from the index of the frame, with the same behavior (a click opens the preview tab, a double click keeps it, a click with a modifier key keeps its usual meaning). `DocumentPage` imports it from `@/shared/components/frame`. A test `PageLink.test.tsx` covers the three cases.
      - `artifact/widgets/panel/` (`ArtifactPanel`, a placeholder that no page renders) is deleted with its test and data.
      - The mock follows: `refuseWhileRunning(projectId)` of `mocks/artifacts/artifacts.problems.ts` becomes `refuseOutsideReview(projectId, artifactId)`, which answers `409 invalid_state` ("An artifact changes only during a review that allows edits.") unless the shown run of the project is `interrupted` and `pendingInterruptOf(run)` allows edits and lists the artifact. Every change handler (items, artifacts, restores) calls it with the artifact of the record; `refuseChange` calls it after the version check. The handler tests gain a case for a document outside the review (the specification) and one for a run that ended (`?mock-run-status=done`). The mocks README states the rule.
      - Web App Modules drops the widget `panel` of `artifact`; the mocks README lists the scenarios `mock-traces`, `mock-trace-links`, `mock-create-trace-link`, `mock-delete-trace-link`, `mock-traceability`, which the handlers read today.
      - `frontend/CONTRIBUTING.md`: the bullet "Dialogs opened from several places" becomes "Dialogs": every dialog, a confirm included, is mounted once by a `...Dialogs` widget and opened through the store of its feature; its last sentence ("A dialog that one place opens stays beside its trigger, with its own state.") goes (decision 22). The two dialogs of `main` that sit beside their trigger (the logout confirm of `UserMenu`, `NewProjectDialog`) move in a later maintenance PR (section 15).
      - The files of a kind that `documents/entities` holds twice move into the folder of their kind, with their tests, with `git mv` (frontend CONTRIBUTING: Files of a slice): `documents.utils.ts` and `document-tab-icons.utils.ts` into `utils/`, `documents.types.ts` and `document-tab-icons.types.ts` into `types/`. A kind with one file stays at the root, so `documents.constants.ts` moves when S1b.1 adds `edit-access.constants.ts` beside it.

## 4. Scope

| | |
|---|---|
| Endpoints called | `PATCH /items/{id}`, `PATCH /artifacts/{id}`, `POST /items/{id}/restore`, `POST /artifacts/{id}/restore` |
| Endpoints read | `GET /items/{id}/revisions`, `GET /artifacts/{id}/revisions`, `GET /items/{id}/trace` (backward for the origin, both at depth 1 for the links), `GET /artifacts/{id}/trace` (backward at depth 1 for `!`, forward at depth 1 for the quotes of a transcript), the pending interrupt of the run through `usePendingInterrupt` (already read by `useDocumentsUnderReview`), and those of S1a |
| Copied | Nothing; `origin/feat/fe/mock` `ItemForm.tsx`, `FieldInput.tsx`, `ItemPanel.tsx` were read as a reference |
| Written new | Section 8 |
| Not built | Creating, deleting, moving and reordering items by hand; creating and removing trace links (S4); marks in the entries of a `list` field; a form for the words of a link made by hand (S4); the citing items in the margin of a transcript (skeletons 6; the card replaces them here); two versions compared side by side |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Feature slices | The action | `artifact/features/edit`, `artifact/features/restore` |
| Widget slice | The block | `documents/widgets/dialogs` |
| Components of an action | `<Verb><Object><Role>` | `EditItemForm`, `EditArtifactForm`, `EditRecordButton`, `DiscardChangesDialog`, `RestoreVersionButton`, `RestoreVersionDialog` |
| Parts of the edit forms | The part | `ContentFieldInputs` (the inputs with their allowed values), `EditFormFooter` (Save, Cancel, the errors) |
| Entity components | The object | `ContentFieldInput`, `ContentValueControl`, `EntriesControl`; `HistorySurface`, `RevisionContent`; `ItemOrigin`, `LinkedItemsPopover` |
| Widget components | `<Object><Block>`; `...Dialogs` for the dialogs mounted once | `ItemLinkLine`; `DocumentDialogs` |
| Shared components | What they are | `DisabledReason`, `PageLink` |
| Mutation hooks | `use<Verb><Object>` | `useUpdateItem`, `useUpdateArtifact`, `useRestoreVersion` |
| Form hook | `use<Block><What>` | `useEditForm` |
| Dialog hooks | `useOpen<...>Dialog`, `use<...>Dialog` in one file | `useOpenDiscardChangesDialog`, `useDiscardChangesDialog`; `useOpenRestoreVersionDialog`, `useRestoreVersionDialog` |
| Edit mode hooks | What they give | `useIsEditing`, `useEditingActions` (in `useEditingRecord.ts`) |
| Stores | `<topic>.store.ts` | `editing-record.store.ts` (`useEditingRecordStore`), `discard-changes-dialog.store.ts` (`useDiscardChangesDialogStore`), `restore-version-dialog.store.ts` (`useRestoreVersionDialogStore`) |
| Query and cache hooks | `use<What it gives>` | `useRevisionHistory`, `useAllowedValuesOf`, `useApplyRecordChange`, `useItemHref`, `useOutOfDateItemIds`, `useLinkQuotesOf`, `useItemLinks`, `useItemOrigin`, `useReloadTraces`, `useValueLabelOf` |
| View state hook | `use<What it gives>` | `useHistoryView` |
| Documents hooks | `use<What it gives>` | `useEditLockReason`, `useDocumentOutline`, `useItemStatus` |
| Page hooks | `use<What it gives>` | `useDocumentTarget`, `useScrollToItem` |
| Pure rules | What they give | `contentChanges`, `withoutEmptyEntries`, `mainField`, `findAgentRole`, `findQuote`, `revisionAuthor`, `previousRevision`, `recordKeyOf`, `revisionKeyOf`, `parseRevisionKey`, `originOf`, `linkQuotesByItem`, `outOfDateItemIds`, `itemLinkGroups`, `hasTranscript`, `itemAnchorId`, `editAccessOf`, `fieldMarksOf`, `markRangesOf`, `itemUpdateBody`, `artifactUpdateBody`, `isVersionConflict`, `isWritingRunStatus` |
| Schemas | `<form>FormSchema` | `editItemFormSchema(fields)`, `editArtifactFormSchema(fields)`; `withContentProblems(schema, fields)` |
| Types | The value | `ContentFormValues`, `RevisionTarget`, `RevisionHistoryResult`, `HistoryLevel`, `HistoryView`, `RecordChange`, `LinkQuotes` (the `quotes` of a link type), `Citation`, `LinkQuote`, `OriginStep`, `OriginTree`, `ItemLinkGroup`, `ItemLinkRow`, `LinkMarkRange`, `EditAccess`, `EditLockReason`, `CitationView`, `OriginView`, `OriginStepView`, `ItemOriginResult`, `ItemLinksResult`, `LinkedEntry` |
| Route parameter | The value | `RouteParam.Item = 'item'` |
| Words | `<topic>Messages` | `contentInputMessages`, `revisionMessages`, `recordChangeMessages`, `editMessages`, `restoreMessages`, `editAccessMessages`, `itemOriginMessages`, `linkedItemMessages` |


## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `FormField`, `FormFieldSet`, `TextField`, `NumberField`, `Form`, `showFieldProblems`, `fieldProblemsOf`, `formErrorOf` | `@/shared/components/form` | The inputs and the forms |
| `Input`, `Textarea`, `NativeSelect`, `NativeSelectOption`, `Switch`, `Checkbox`, `Button`, `PendingButton`, `Alert`, `Badge`, `Skeleton`, `Tooltip`, `FieldSet`, `FieldLegend`, `FieldError`, `ScrollArea`, `Separator` | `shared/components/ui` | The controls |
| `FloatingSurface` | `shared/components/ui/floating-surface.tsx` | The history surface, in the corner that `ItemNavigator` leaves free |
| `Popover`, `PopoverTrigger`, `PopoverContent` | `shared/components/ui/popover.tsx` | The card of a link |
| `ConfirmDialog` | `shared/components/ui/confirm-dialog.tsx` | Discard, Restore |
| `DiffView`, `RelativeTime`, `Highlight` (with `renderMark`), `HighlightRange` | `shared/components/ui` | The changes of a version, the marks of the links; `highlight.tsx` exports the type `HighlightRange` (S1b.1), which the ranges of the marks extend |
| `LoadingState`, `ErrorState` | `@/shared/components/state` | The compact states of the blocks |
| `ErrorBoundary` | `react-error-boundary` (already a dependency) | A block that fails alone (decision 20) |
| `createPendingActionStore`, `useSetPendingAction`, `usePendingAction` | `@/shared/lib/pending-action` | The dialog stores |
| `jsonToPlainText` | `@/shared/lib/formatters` | The text of a value in a diff |
| `quoteRange` | `@/shared/lib/text` | Built on by `findQuote` and `markRangesOf`; the quote of a citation in `ItemOrigin` |
| `isSameValue` | `@/shared/lib/collections` | `contentChanges` |
| `useWording` | `@/shared/lib/view` | The labels of the change reasons and the review statuses |
| `errorMessageOf`, `ApiError`, `ApiErrorCode` | `@/shared/api/error` | The errors of a save and a restore |
| `toast` | `sonner` | Saved, Restored, a failed restore |
| `useEditorTab`, `useOpenPage`, `useCommands` | `@/shared/components/frame` | Keep the tab, the links, `J` and `K` off while editing |
| `routes`, `RouteParam` | `@/shared/routes` | The addresses |
| `validateContent`, `changedFields`, `toStoredContent`, `initialValue`, `contentFields`, `ContentFieldValue`, `itemTitle`, `isNavigable`, `kindSchemasByKind`, `useArtifactKinds`, `useWorkflowDefinition`, `useIssueKinds`, `findLinkType` | `workflow/entities` | The fields, their rules and their words |
| `updateItem`, `updateArtifact`, `restoreItem`, `restoreArtifact`, `itemKeys`, `artifactKeys`, `useReloadArtifacts`, `useItem`, `useArtifact`, `useItemSchema`, `useProjectArtifacts`, `allowedValues`, `listItemRevisions`, `listArtifactRevisions`, `changeReasonLabels`, `reviewStatusLabels`, `revisionsPageSize`, `useArtifactOutline`, `itemStatus`, `transcriptContentField` | `artifact/entities` | The data and the views |
| `useItemTrace`, `useArtifactTrace`, `isLinkOutOfDate`, `derivedFrom`, `evidencedBy`, `traceModuleKeys` | `trace/entities` | The links |
| `useDocumentsUnderReview`, `useIsDocumentUnderReview`, `useWritingArtifacts` | `documents/entities` | The run and the review of the project |
| `Interrupt` (type) | `review/entities` | `editAccessOf` |
| `pendingInterruptOf`, and the lookup of the shown run that `hasRunningRun` reads | `mocks/interrupts/interrupts.lookup.ts`, the runs lookup of the mock | `refuseOutsideReview` |
| `renderDocumentsFrame`, `renderWithProviders`, `renderHookWithProviders`, `openPage`, `serverErrorOn`, `holdResponse` | `@/test/render`, `@/test/msw` | The tests |
| `itAsksBeforeAction`, `itToastsOnResult`, `itShowsQueryStates`, `itAsksForFieldsBeforeSending`, `expectNoAccessibilityViolations`, `spyOnToast`, `fillFields`, `replaceText`, `pressButton`, `findConfirmDialog`, `confirmAction`, `cancelAction` | `@/test/suites`, `@/test/steps` | The cases of each action and block |

### Extract before new code

| What | To | Why |
|---|---|---|
| `PageLink` (today `ItemLink` of `documents/widgets/document`) | `shared/components/frame/tabs/components/PageLink.tsx` (S1b.0) | Used by the document widget, `ItemOrigin` and `LinkedItemsPopover` of the entities; no product object |
| `DisabledReason` | `shared/components/ui/disabled-reason.tsx`, shown on the `ButtonsCard` of the design system | Edit, Restore and Show changes disable a control with a reason; no product object |

### Checked, not extracted

| Candidate | Copies now | Why it stays |
|---|---|---|
| A generic list input (`EntriesControl`) in `shared/components/form` | 1 (the content inputs) | One form family; it moves to `shared/components/form` when a form outside the content fields needs a list |
| A helper that tells the code of an `ApiError` (`hasErrorCode`) | 1 (`isVersionConflict`) | One reader; it goes to `shared/api/error` at the second (S2 answers a review and may meet `invalid_state`) |
| A generic floating surface with levels in `shared/components/ui` | 1 (`HistorySurface`) | One user; the levels and their words are of the history. It moves when a second surface needs levels |
| A record key helper in shared code | 2 users (the edit store, the restore store), both of `artifact` | They name the record types of `artifact`: `recordKeyOf` and `revisionKeyOf` stay in its topic `revisions` |
| `ItemOrigin` and `LinkedItemsPopover` in `documents/widgets/item` | The peek of S1c is the second user of `ItemOrigin`; the document page is the second of `LinkedItemsPopover`; the Trace screen of S4 is the next | Placed in `trace/entities` now, so that no PR moves them; `documents/entities` would hide them from `trace/widgets` |
| A scroll helper | 1 (`useScrollToItem`) | One reader; it stays in the document widget |
| The merge of overlapping marks in `shared/lib/text` | 1 (`markRangesOf` and `fieldMarksOf` of `trace`) | One user; it moves when a module that may not read `trace` marks words |
| The "load every page" hook | 1 (`useOutlineItems`), unchanged | As S1a |

## 7. Changes to existing modules

The commit column names the PR and the commit number of section 16.

| File | Change | Commit |
|---|---|---|
| `docs/ui/usability.md` (`frontend-plan`) | The S1a answers (S1a decision 1), then A1 to A9 | none |
| `docs/API.md` (S1b.D, on `docs/fe/api-fields`) | The editing rule (decision 9) | D.1 |
| S1b.D: `docs/API.md` (trace body, `POST /projects/{id}/trace-links` body, the quote rules), `docs/DATA_SHAPE.md` (TraceLink, Link types with a column of quotes, the prompt view), `docs/workflow/definition.schema.json` (`quotes` of `linkType`, required), `docs/workflow/requirements_engineering.v1.json` and its copy `frontend/src/mocks/workflow/requirements_engineering.v1.json` (`quotes` of each link type, decision 13), `docs/workflow/prompts/analyst.v1.md` (`target_quote` in place of `quote`; the words of `derived_from`, `concerns`, `resolved_by`), `docs/ui/reference-apps.md`, `docs/architecture/database.dbml` (`trace_links.quote` renamed `target_quote`, `trace_links.source_quote`), `docs/architecture/README.md` (the row `trace_links`), the diagram of the tables rendered again with `scripts/db-diagram/render.mjs` | Decision 13 | D.2 |
| `artifact/entities/components/DocumentBlocks.tsx`, its test | The role of a message is plain text | 0.1 |
| `documents/widgets/document/components/ItemLink.tsx` -> `shared/components/frame/tabs/components/PageLink.tsx` (`git mv`, renamed), `shared/components/frame/index.ts`, `DocumentPage.tsx`, new `__tests__/PageLink.test.tsx` | Decision 25 | 0.2 |
| `artifact/widgets/panel/` (deleted) | Decision 25 | 0.3 |
| `mocks/artifacts/artifacts.problems.ts` (`refuseOutsideReview`), the change handlers of `mocks/artifacts/handlers/`, their tests, `mocks/README.md` (the rule) | Decision 25 | 0.4 |
| `docs/architecture/web-app-modules.md` (no `panel` in `artifact`), `frontend/src/mocks/README.md` (the trace scenarios) | Decision 25 | 0.5 |
| `frontend/CONTRIBUTING.md` | The rule of the dialogs (decision 25) | 0.6 |
| `documents/entities/`: `git mv` of `documents.utils.ts` and `document-tab-icons.utils.ts` into `utils/`, of `documents.types.ts` and `document-tab-icons.types.ts` into `types/`, each with its test, and the imports that follow | Decision 25 | 0.7 |
| `shared/components/ui/disabled-reason.tsx`, test; design system `ButtonsCard.tsx`; `shared/components/ui/highlight.tsx` (exports the type `HighlightRange`) | `DisabledReason`; the ranges of the marks | 1.1 |
| `shared/routes/route-params/route-params.constants.ts`, `project-routes.utils.ts`, tests | `RouteParam.Item`, `document(artifactId, { itemId })` | 1.1 |
| `workflow/entities/components/content-input/` (new), `components/ContentFieldValue.tsx` (`marks`, `renderMark`), `content/values/content-form.schema.ts` (new), `content/values/content-values.utils.ts` (`contentChanges`, `withoutEmptyEntries`, `findQuote`), `content/fields/content-fields.utils.ts` (`mainField`), `content/value-labels/hooks/useValueLabelOf.ts` (new) and `useValueLabel.ts` (built on it), `definition/workflow-vocabulary.types.ts` (`quotes` of `linkTypeSchema`, `LinkQuotes`), `definition/workflow-definition.utils.ts` (`findAgentRole`), tests, `index.ts`, `@x/artifact.ts` (+ `contentChanges`, `findAgentRole`, `mainField`, and `isNavigable` for `useItemHref` when it is not there yet); `@x/trace.ts` changes in 1.7 | Decisions 4, 5, 10, 11, 13, 14, 16 | 1.2 |
| `run/entities/status/run-status.utils.ts` (`isWritingRunStatus`), test, `@x/documents.ts` | Decision 9 | 1.3 |
| `trace/entities/types/trace-links.types.ts` (`quote` renamed `target_quote`, `source_quote` added), `trace/widgets/graph/trace-graph.types.ts` and `trace-graph.utils.ts` (the field of an edge renamed `targetQuote`), `mocks/trace/trace-links.types.ts` (`quote` of `LinkSpec` renamed `targetQuote`, + `sourceQuote`), `fixtures/trace-link-builder.fixtures.ts`, `trace-links.changes.ts`, `fixtures/mentor-platform-trace-links.fixtures.ts` (the eight quotes of today under `targetQuote`), the handlers that answer links, their tests | Decision 13: the rename and the new field, in the mock and the app at once, since the entity parses what the mock answers | 1.4 |
| `mocks/trace/fixtures/mentor-platform-trace-links.fixtures.ts` (the words of section 12), `validators/link-rules.validators.ts` (the quote rules of decision 13), their tests | Decision 13; section 12 | 1.5 |
| `artifact/entities/status/*` (`outOfDate`), `outline/outline.utils.ts` (`outOfDateIds`, `itemAnchorId`), `outline/document-blocks.utils.ts` (`hasTranscript`), `items/hooks/useApplyRecordChange.ts` (new), `items/hooks/useItemHref.ts` (new), `outline/outline.types.ts`, `outline/outline.constants.ts` (`transcriptTurnField`), `outline/hooks/useArtifactOutline.ts` (options), `revisions/*` (`RevisionTarget`, `HistoryLevel`, `HistoryView`, `useRevisionHistory`, `useHistoryView`, `revisionAuthor`, `previousRevision`, `recordKeyOf`, `revisionKeyOf`, `parseRevisionKey`, `revisionMessages`, `recordChangeMessages`), `artifacts/hooks/useArtifactQueries.ts` (`useAllowedValuesOf`), `components/ArtifactDocument.tsx` (`actions`, `targetItemId`, `messageMarks`, `renderMessageMark`, `fieldsView`), `components/DocumentBlocks.tsx` (anchors, message marks), `components/ArtifactItemDetails.tsx` (`afterKeyLine`, `fieldMarks`, `renderFieldMark`), `components/history/` (new), `components/artifact-view.constants.ts`, tests, `index.ts`, `@x/documents.ts`, `@x/trace.ts` (+ `useProjectArtifacts`, `reviewStatusLabels`, `useItemHref`, `transcriptContentField`, `transcriptTurnField`); the scenario `mock-revisions` in `mocks/artifacts/handlers/items.handlers.ts` and `artifacts.handlers.ts`, their tests, `mocks/README.md`; `src/app/styles.css` (`--max-height-history-list`) | Decisions 10, 11, 14, 15, 17, 18; section 12 | 1.6 |
| `trace/entities/types/chains.types.ts` (`Citation`, `LinkQuote`, `OriginStep`, `OriginTree`, `ItemLinkGroup`, `ItemLinkRow`), `types/item-links.types.ts` and `types/item-origin.types.ts` (new: `LinkMarkRange`, `LinkedEntry`, `ItemLinksResult`, `CitationView`, `OriginView`, `OriginStepView`, `ItemOriginResult`), `utils/chains.utils.ts`, `utils/link-marks.utils.ts` (new: `fieldMarksOf`, `markRangesOf`), `hooks/useChainQueries.ts` (`useOutOfDateItemIds`, `useLinkQuotesOf`, `useReloadTraces`), `hooks/useItemLinks.ts`, `useItemOrigin.ts` (new), `components/ItemOrigin.tsx`, `LinkedItemsPopover.tsx`, `item-origin.constants.ts`, `linked-items.constants.ts` (new), tests, `index.ts`, `@x/documents.ts` (new: `useOutOfDateItemIds`); `workflow/entities/@x/trace.ts` (+ `mainField`, `findQuote`, `itemTitle`, `kindSchemasByKind`, `useArtifactKinds`, `useWorkflowDefinition`, `useIssueKinds`, `ContentFieldValue`) | Decisions 13 to 16, 18, 21 | 1.7 |
| `documents/entities/utils/edit-access.utils.ts` (new), `constants/edit-access.constants.ts` (new) with `constants/documents.constants.ts` moved beside it, `hooks/useEditLockReason.ts`, `useDocumentOutline.ts`, `useItemStatus.ts` (new), `hooks/useDocumentsUnderReview.ts` (+ `interrupt`), `types/documents.types.ts` (`EditAccess`, `EditLockReason`), tests, `index.ts` | Decisions 9, 18 | 1.8 |
| `web-app-modules.md`, `web-app.md` | Section 14, entities part | 1.9 |
| `artifact/features/edit/` (new) | Decisions 6 to 8, 22 | 2.1 |
| `artifact/features/restore/` (new) | Decisions 12, 22 | 2.2 |
| `documents/widgets/dialogs/` (new), `app/(project)/projects/[projectId]/layout.tsx` (`<DocumentDialogs projectId={projectId} />` after `<ProjectDialogs />`) | Decision 22 | 2.3 |
| `documents/widgets/item/` (`ItemPage.tsx`, `ItemLinkLine.tsx` new, `hooks/useItemPage.ts`, `useItemTab.ts`, `useItemCommands.ts`, `item-page.constants.ts`), `documents/widgets/document/` (`DocumentPage.tsx`, `hooks/useDocumentTarget.ts` and `useScrollToItem.ts` new, `document-page.constants.ts`), `documents/widgets/panel/components/DocumentsPanel.tsx`, tests | Decisions 7, 10 to 20 | 2.4 |
| `tests/screenshots/projects/documents.spec.ts` | Section 12 | 2.4 |
| `web-app-modules.md`, `web-app.md`, mocks README, implementation plan | Section 14, features part | 2.5 |

Files that two commits change: `artifact/entities/index.ts` and its `@x` files (1.6 only), `workflow/entities/index.ts` and `@x/artifact.ts` (1.2 only), `workflow/entities/@x/trace.ts` (1.7 only), `trace/entities/index.ts` (1.4 the rename, 1.7 the rest), `documents/entities/index.ts` (1.8 only), `mentor-platform-trace-links.fixtures.ts` (1.4 the rename, 1.5 the new words), `docs/API.md` (D.1 the editing rule, D.2 the quotes), `frontend/src/mocks/workflow/requirements_engineering.v1.json` (D.2 only, with the copy of `docs/`), `web-app-modules.md` (0.5, 1.9, 2.5: each commit its own rows), `mocks/README.md` (0.4 the rule, 0.5 the trace scenarios, 1.6 `mock-revisions`, 2.5 the addresses of the screen), `DocumentBlocks.tsx` (0.1 the role, 1.6 the anchors and the message marks), `DocumentPage.tsx` (0.2 the import, 2.4 the rest).

## 8. The slices, file by file

### `shared`

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
│   ├── ContentFieldValue.tsx                 + marks, renderMark for text and textarea values
│   ├── content-field-value.constants.ts      unchanged
│   ├── content-input/                        new
│   │   ├── ContentFieldInput.tsx             the field: label, description, control, error; readOnly as a value
│   │   ├── ContentValueControl.tsx           the control by widget, without a label (table widgetControls)
│   │   ├── EntriesControl.tsx                the entries of list, tags and object-list, with Add and Remove, and the focus after each
│   │   ├── content-input.constants.ts        contentInputMessages
│   │   └── __tests__/ContentFieldInput.test.tsx, ContentFieldInput.data.ts, EntriesControl.test.tsx
│   └── __tests__/                            unchanged
├── content/
│   ├── fields/content-fields.utils.ts        + mainField
│   ├── values/content-form.schema.ts         new: ContentFormValues, contentFormValuesSchema, withContentProblems
│   ├── values/content-values.utils.ts        + contentChanges, withoutEmptyEntries, findQuote
│   └── value-labels/hooks/useValueLabelOf.ts new; useValueLabel.ts calls it
├── definition/workflow-vocabulary.types.ts  linkTypeSchema + quotes; LinkQuotes
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

/**
 * The content without the entries that hold nothing: a blank entry of a `list` or `tags` field,
 * and an entry of an `object-list` whose every field is empty. Other fields stay as they are.
 */
export function withoutEmptyEntries(fields: readonly ContentField[], content: ContentValues): ContentValues

/**
 * Where the words of a quote sit in a content: the first `text` or `textarea` field that holds them,
 * the main field first, then in the order of the fields; null when no field holds them.
 */
export function findQuote(
  fields: readonly ContentField[],
  content: ContentValues,
  quote: string,
): { field: string; range: TextRange } | null

// definition/workflow-vocabulary.types.ts
/** Which side of a link of this type may quote the words of its item: the source, the target. */
export const linkQuotesSchema = z.object({ source: z.boolean(), target: z.boolean() })
export type LinkQuotes = z.infer<typeof linkQuotesSchema>
// linkTypeSchema gains `quotes: linkQuotesSchema`

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

`widgetControls` follows `widgetValueViews` of `ContentFieldValue`: `as const satisfies Record<FieldWidget, (props) => ReactNode>`, so a new widget fails to compile until it has a control. `EntriesControl` keeps a ref per entry control to move the focus after Add and Remove (section 10). `ContentFieldValue` gets `marks?: readonly Range[]` and `renderMark?: (range: Range, children: ReactNode) => ReactNode` (`Range extends HighlightRange`); a `text` or `textarea` value with marks is drawn with `Highlight`, the others ignore them.

### `run/entities/status`

```ts
/** Whether a run in this status writes the documents, which the user then cannot change: `running` only. */
export function isWritingRunStatus(status: RunStatus): boolean
```

### `trace/entities`

```text
trace/entities/
├── @x/documents.ts             new: useOutOfDateItemIds (for useDocumentOutline)
├── types/trace-links.types.ts  traceLinkSchema: quote renamed target_quote, + source_quote
├── types/chains.types.ts       + Citation, LinkQuote, OriginStep, OriginTree, ItemLinkRow, ItemLinkGroup
├── utils/chains.utils.ts       new: originOf, linkQuotesByItem, outOfDateItemIds, itemLinkGroups
└── hooks/useChainQueries.ts    + useOutOfDateItemIds, useLinkQuotesOf, useReloadTraces
```

```ts
// types/trace-links.types.ts, in traceLinkSchema
/** The words of the target that the link is about, such as the quote of an interview message; null when the link is about the whole target. Named `quote` before S1b.D. */
target_quote: z.string().nullable(),
/** The words of the source that the link is about, such as the part of a requirement built from this target; null when the link is about the whole source. */
source_quote: z.string().nullable(),

/** Words of one item that a link quotes, seen from that item: `side` says whether the item is the source or the target of the link. */
export interface LinkQuote {
  link: TraceLink
  side: 'source' | 'target'
  quote: string
  /** The item at the other end of the link. */
  other: TraceItem
}

/** An `evidenced_by` link with its two items: the item that cites, and the item cited, such as a message of an interview, with the words it quotes. */
export interface Citation {
  link: TraceLink
  quote: string | null
  citing: TraceItem
  cited: TraceItem
}

/** One item that an item is based on (`derived_from`), with what it is based on in turn and the words it cites. */
export interface OriginStep {
  link: TraceLink
  item: TraceItem
  evidence: Citation[]
  steps: OriginStep[]
}

/** Where an item comes from: the words it cites itself, and the items it is based on. */
export interface OriginTree {
  evidence: Citation[]
  steps: OriginStep[]
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

export function originOf(trace: Trace, itemId: string): OriginTree
/** The quoted words of every item of a trace, by item id: the `source_quote` of a link on its source, its `target_quote` on its target; in the key order of the other items. */
export function linkQuotesByItem(trace: Trace): ReadonlyMap<string, LinkQuote[]>
export function outOfDateItemIds(trace: Trace): ReadonlySet<string>
export function itemLinkGroups(
  trace: Trace,
  itemId: string,
  { linkTypes, titleOf }: { linkTypes: readonly { key: string; title: string }[]; titleOf: (item: TraceItem) => string },
): { outgoing: ItemLinkGroup[]; incoming: ItemLinkGroup[] }

/** The ids of the items of an artifact that link to a target that moved on since; empty while loading or failed. */
export function useOutOfDateItemIds(artifactId: string): ReadonlySet<string>

/** The quoted words of the items of an artifact and of the items that link to them, such as the quotes of each message of a transcript; a union with `state`, as `useItemLinks` and `useItemOrigin` give. */
export function useLinkQuotesOf(
  artifactId: string,
  { isEnabled }: { isEnabled: boolean },
): { state: 'pending' } | { state: 'error'; retry: () => void } | { state: 'success'; quotesByItem: ReadonlyMap<string, LinkQuote[]> }

/** Loads again every query of the traces, after an artifact or an item changed. */
export function useReloadTraces(): () => Promise<void>
```

`itemLinkGroups` takes the link types as plain `{ key, title }`, so the rule stays free of the definition; `useItemLinks` gives them from `useWorkflowDefinition`. `target_quote` and `source_quote` are named by the API doc from S1b.D on; S1b.1 commit 4 renames the field and adds the new one in the mock, the entity and the trace graph at once, since the entity parses what the mock answers.

The links and the origin of an item, in the same slice (decision 1):

```text
trace/entities/
├── components/                      new
│   ├── ItemOrigin.tsx
│   ├── LinkedItemsPopover.tsx
│   ├── item-origin.constants.ts     itemOriginMessages
│   ├── linked-items.constants.ts    linkedItemMessages
│   └── __tests__/ItemOrigin.test.tsx, LinkedItemsPopover.test.tsx
├── hooks/useItemLinks.ts            new
├── hooks/useItemOrigin.ts           new
├── types/item-links.types.ts        new: LinkMarkRange, LinkedEntry, ItemLinksResult
├── types/item-origin.types.ts       new: CitationView, OriginView, OriginStepView, ItemOriginResult
└── utils/link-marks.utils.ts        new: fieldMarksOf, markRangesOf
```

```ts
/** A mark of the words that links quote: the range, its color, and the links that quote these words. */
export interface LinkMarkRange extends HighlightRange {
  id: string
  linkIds: string[]
}

/** One item at the other end of a link, as the card shows it. */
export interface LinkedEntry {
  item: TraceItem
  /** The words of the group, such as "Based on" or "Based on this item", or "Quoted by" on a message. */
  relation: string
  isOutOfDate: boolean
  /** The words that the link quotes on the side of this item, or null. */
  otherQuote: string | null
}

export type ItemLinksResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | {
      state: 'success'
      outgoing: ItemLinkGroup[]
      incoming: ItemLinkGroup[]
      count: number
      /** The marks of the quoted words of the item, by field name. */
      fieldMarks: ReadonlyMap<string, LinkMarkRange[]>
      /** The row of each link, so that a mark finds the entries of its card. */
      rowsByLinkId: ReadonlyMap<string, ItemLinkRow>
    }

/** A citation with what the section shows of it: the title of its transcript, its turn, the text of the message. */
export interface CitationView {
  citation: Citation
  transcriptTitle: string
  turn: number | null
  text: string
}

export interface OriginStepView {
  step: OriginStep
  title: string
  isOutOfDate: boolean
  evidence: CitationView[]
  steps: OriginStepView[]
}

export interface OriginView {
  evidence: CitationView[]
  steps: OriginStepView[]
}

export type ItemOriginResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; origin: OriginView }

/**
 * The marks of the quoted words of an item, by field name: each quote placed with `findQuote`,
 * overlapping ranges of one field merged into one mark with all their links; `warning` when the
 * other item of one of its links is an issue, else `primary`.
 */
export function fieldMarksOf(
  content: ContentValues,
  quotes: readonly LinkQuote[],
  { fields, isIssue }: { fields: readonly ContentField[]; isIssue: (item: TraceItem) => boolean },
): ReadonlyMap<string, LinkMarkRange[]>

/** The same for one text, such as a message of a transcript. */
export function markRangesOf(
  text: string,
  quotes: readonly LinkQuote[],
  { isIssue }: { isIssue: (item: TraceItem) => boolean },
): LinkMarkRange[]

/** Where an item comes from, each step titled and each citation with its transcript, turn and text; a union with `state`. */
export function useItemOrigin(projectId: string, itemId: string): ItemOriginResult

/** The links of an item from it and to it, grouped by link type, each row titled, and the marks of their words in its text; a union with `state`. */
export function useItemLinks(itemId: string): ItemLinksResult
```

```tsx
/** The section "Why this item exists": the chain the item is based on, down to the words it cites. Nothing without an origin. */
export function ItemOrigin({ projectId, itemId }: { projectId: string; itemId: string })

/** A card that opens on a click of its trigger, with the items at the other end of a link: relation, key, title, status, main field, Open. */
export function LinkedItemsPopover({ projectId, entries, children }: { projectId: string; entries: readonly LinkedEntry[]; children: ReactNode })
```

`ItemOrigin` and `LinkedItemsPopover` read `useItemHref` and `reviewStatusLabels` of `artifact` and `mainField`, `ContentFieldValue` of `workflow` through the `@x/trace.ts` files of both, as `ArtifactDocument` reads `ContentFieldValue` of `workflow` today.

### `artifact/entities`

```text
artifact/entities/
├── @x/documents.ts                 + useArtifactOutline, itemStatus, hasTranscript, types ItemStatus, OutlineItem
├── @x/trace.ts                     + useProjectArtifacts, reviewStatusLabels, useItemHref, transcriptContentField, transcriptTurnField
├── artifacts/hooks/useArtifactQueries.ts   + useAllowedValuesOf
├── items/hooks/useApplyRecordChange.ts     new
├── items/hooks/useItemHref.ts              new
├── status/
│   ├── item-status.types.ts        ItemStatus + 'outOfDate'
│   ├── item-status.utils.ts        itemStatus options, attentionLevel, attentionText
│   └── item-status.constants.ts    itemStatusMessages.statuses.outOfDate, attention.outOfDate; itemStatusLooks.outOfDate
├── outline/
│   ├── outline.utils.ts            artifactOutline takes outOfDateIds; + itemAnchorId
│   ├── document-blocks.utils.ts    + hasTranscript
│   ├── outline.constants.ts        + transcriptTurnField = 'turn'
│   └── hooks/useArtifactOutline.ts + { outOfDateIds }
├── revisions/
│   ├── revisions.types.ts          + RevisionTarget, RevisionHistoryResult, HistoryLevel, HistoryView
│   ├── revisions.utils.ts          new: revisionAuthor, previousRevision, recordKeyOf, revisionKeyOf, parseRevisionKey
│   ├── revisions.constants.ts      + revisionMessages, recordChangeMessages
│   └── hooks/
│       ├── useRevisionQueries.ts   + useRevisionHistory
│       └── useHistoryView.ts       new
└── components/
    ├── ArtifactDocument.tsx        + actions, targetItemId, messageMarks, renderMessageMark, fieldsView
    ├── DocumentBlocks.tsx          + anchors, data-target, the marks of the messages of a transcript
    ├── ArtifactItemDetails.tsx     + afterKeyLine, fieldMarks, renderFieldMark
    ├── artifact-view.constants.ts  unchanged
    └── history/                    new
        ├── HistorySurface.tsx      the surface and its three levels
        ├── VersionStepper.tsx      Newer, Older, the selected version, Show changes, the restore slot
        ├── VersionList.tsx         the versions as buttons, Show older versions
        ├── RevisionContent.tsx     the banner and the fields of the selected version, with their changes
        └── __tests__/HistorySurface.test.tsx, RevisionContent.test.tsx, history.data.ts
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
  | { state: 'success'; revisions: Revision[]; hasMore: boolean; isLoadingMore: boolean; loadMore: () => Promise<void> }

/** How much of the history surface shows: the button, the selected version, or the list of every version above it. */
export type HistoryLevel = 'closed' | 'version' | 'list'

/** The state of the history of one record on its page, shared by the surface and the content. */
export interface HistoryView {
  level: HistoryLevel
  selectedVersion: number
  showsChanges: boolean
  open: () => void
  close: () => void
  toggleList: () => void
  stepBack: () => void
  select: (version: number) => void
  setShowsChanges: (shows: boolean) => void
}

/** The versions of a record, newest first, a page at a time; `isEnabled` waits until they are shown. */
export function useRevisionHistory(target: RevisionTarget, { isEnabled }: { isEnabled: boolean }): RevisionHistoryResult

/**
 * The state of the history surface of a record (decision 10): closed at the start; closing selects
 * the current version again; a new current version is selected and keeps the level; `isHidden`
 * closes it.
 */
export function useHistoryView(currentVersion: number, { isHidden }: { isHidden: boolean }): HistoryView

/** Who made a version: "You" for the user, else the label of the agent role, else its key. */
export function revisionAuthor(origin: Pick<Origin, 'actor' | 'agent_role'>, definition: Pick<WorkflowDefinition, 'agent_roles'> | undefined): string

/** The version right before the given one among the loaded ones, or undefined when it is not loaded. */
export function previousRevision(revisions: readonly Revision[], version: number): Revision | undefined

/** The key of a record in a store: `item:<id>` or `artifact:<id>`. */
export function recordKeyOf(target: RevisionTarget): string

/** The key of one version of a record in a store: `item:<id>@2`. */
export function revisionKeyOf(target: RevisionTarget, version: number): string

/** The record and the version of a key of `revisionKeyOf`, or null for another string. */
export function parseRevisionKey(key: string): { target: RevisionTarget; version: number } | null

/** The values that each field with `x-value-from` may take, by field name, from one read of the artifacts of the project. */
export function useAllowedValuesOf(projectId: string, fields: readonly ContentField[]): ReadonlyMap<string, string[]>

/** A record that a change answered: an item or an artifact. */
export type RecordChange = { type: 'item'; record: ArtifactItem } | { type: 'artifact'; record: Artifact }

/** Puts a changed record in the cache, then loads again every list and detail of artifacts and items; settles once they have loaded. */
export function useApplyRecordChange(): (change: RecordChange) => Promise<void>

/** The address that opens an item: its page, or for a kind without a page (`isNavigable`) the document of its artifact at the item. */
export function useItemHref(projectId: string): (item: { id: string; kind: string; artifact_id: string }) => Route

/** The id of the block of an item on the page of its document, which the address of the item scrolls to. */
export function itemAnchorId(itemId: string): string // `item-${itemId}`

/** Whether the blocks of a document draw messages of a transcript. */
export function hasTranscript(blocks: readonly DocumentBlock[]): boolean
```

`useRevisionHistory` picks the key and the function by `target.type` (`itemKeys.revisions` with `listItemRevisions`, `artifactKeys.revisions` with `listArtifactRevisions`), with `cursorPagesOptions`, so a page that renders it never calls two hooks by condition. `useItemRevisions` and `useArtifactRevisions` stay, unchanged.

```tsx
interface HistorySurfaceProps {
  target: RevisionTarget
  /** The version of the record now: "of 3", Newer disabled on it, no restore on it. */
  currentVersion: number
  /** The state from `useHistoryView`, which the page also gives to `RevisionContent`. */
  view: HistoryView
  /** The control that restores the selected version, from the feature that the page places; not called for the current version. */
  renderRestore: (version: number) => ReactNode
}

interface RevisionContentProps {
  target: RevisionTarget
  view: HistoryView
  currentVersion: number
  /** The fields of the schema of the record, in their order. */
  fields: readonly ContentField[]
}
```

`ArtifactDocument` gets `actions?: ReactNode` (at the right of the `h1`, `flex items-start justify-between gap-4`), `targetItemId?: string | null`, `messageMarks?: ReadonlyMap<string, readonly Range[]>` (by message id) and `renderMessageMark?: (range: Range, children: ReactNode) => ReactNode` (both passed to `DocumentBlocks`), and `fieldsView?: ReactNode` (drawn in place of the fields of the document). `ArtifactItemDetails` gets `afterKeyLine?: ReactNode`, `fieldMarks?: ReadonlyMap<string, readonly Range[]>` (by field name) and `renderFieldMark?: (range: Range, children: ReactNode) => ReactNode`, passed to `ContentFieldValue`. Both components are generic over `Range extends HighlightRange`, so that `documents` gives its own ranges (`LinkMarkRange`) and gets them back in the wrapper.

### `documents/entities`

```text
documents/entities/
├── types/                          documents.types.ts (+ EditAccess, EditLockReason), document-tab-icons.types.ts
├── utils/                          edit-access.utils.ts (new: editAccessOf), documents.utils.ts, document-tab-icons.utils.ts
├── constants/                      documents.constants.ts, edit-access.constants.ts (new: editAccessMessages)
├── hooks/
│   ├── useDocumentsUnderReview.ts   + interrupt
│   ├── useEditLockReason.ts         new
│   ├── useDocumentOutline.ts        new
│   ├── useItemStatus.ts             new
│   └── __tests__/                   one test file per new hook
└── index.ts                         + the new hooks, types
```

`utils/` and `types/` exist from S1b.0 (decision 25), which moved the files of S1a into the folders of their kinds; `constants/` starts at commit 8, when `documents.constants.ts` moves beside the new `edit-access.constants.ts` (a kind with one file stays at the root).

```ts
/** Whether a document can change now, and why not. */
export type EditAccess = { canEdit: true } | { canEdit: false; reason: EditLockReason }
export type EditLockReason = 'agentsWorking' | 'reviewTakesNoChanges' | 'notUnderReview' | 'noReview'

/** When a document can change: only while the run waits for a review that allows edits and lists it (decision 9). */
export function editAccessOf(state: {
  runStatus: RunStatus | undefined
  interrupt: Pick<Interrupt, 'allow_edits' | 'review_artifacts'> | null
  artifactId: string
}): EditAccess

/** Why the document cannot change now, in the words of the user, or null when it can. */
export function useEditLockReason(projectId: string, artifactId: string): string | null

/** The outline of a document with the items made from an older version marked `outOfDate`. */
export function useDocumentOutline(artifactId: string): ArtifactOutlineResult

/** The status of one item as its document shows it, and whether the document waits for the review; `status` is undefined until the issue kinds load. */
export function useItemStatus(projectId: string, item: ArtifactItem): { status: ItemStatus | undefined; isUnderReview: boolean }
```

### `artifact/features/edit`

```text
artifact/features/edit/
├── components/
│   ├── EditItemForm.tsx
│   ├── EditArtifactForm.tsx
│   ├── ContentFieldInputs.tsx    the inputs of the fields, with useAllowedValuesOf and the definition
│   ├── EditFormFooter.tsx        the conflict alert, the form error, Save, Cancel
│   ├── EditRecordButton.tsx      starts the edit mode; takes the focus back when it ends
│   ├── DiscardChangesDialog.tsx
│   └── __tests__/EditItemForm.test.tsx, EditArtifactForm.test.tsx, EditRecordButton.test.tsx, DiscardChangesDialog.test.tsx, edit-form.data.ts
├── hooks/
│   ├── useUpdateItem.ts
│   ├── useUpdateArtifact.ts
│   ├── useEditForm.ts            useForm with the schema, the defaults, the focus on the first field, onFirstChange once
│   ├── useEditingRecord.ts       useIsEditing, useEditingActions
│   ├── useOpenDiscardChangesDialog.ts   useOpenDiscardChangesDialog, useDiscardChangesDialog
│   └── __tests__/useUpdateItem.test.ts, useUpdateArtifact.test.ts, useEditingRecord.test.ts
├── stores/
│   ├── editing-record.store.ts   useEditingRecordStore: recordKey, endedKey, startEditing, stopEditing, focusReturned
│   └── discard-changes-dialog.store.ts   useDiscardChangesDialogStore = createPendingActionStore()
├── schemas/
│   ├── edit-item.schema.ts       editItemFormSchema(fields), EditItemFormValues
│   ├── edit-artifact.schema.ts   editArtifactFormSchema(fields), EditArtifactFormValues
│   └── __tests__/edit-item.schema.test.ts, edit-artifact.schema.test.ts
├── edit.constants.ts             editMessages
├── edit.utils.ts                 itemUpdateBody, artifactUpdateBody, isVersionConflict
├── __tests__/edit.utils.test.ts, edit.utils.data.ts
└── index.ts                      EditItemForm, EditArtifactForm, EditRecordButton, DiscardChangesDialog, useIsEditing, useDiscardChangesDialog, editMessages
```

```ts
/**
 * Saves the changes of an item from its form. On success the detail takes the answer, the lists and
 * the details of artifacts and items load again, `onChanged` runs, a toast says it, and the edit
 * mode ends. A failure shows its problems at the fields through `setError`; `formError`,
 * `isConflict` and `reload` tell the form the rest.
 */
export function useUpdateItem(
  item: Pick<ArtifactItem, 'id' | 'version'>,
  { setError, schema, onChanged }: UpdateOptions<EditItemFormValues>,
): UseMutationResult<ArtifactItem, Error, UpdateItemBody> & { formError: string | null; isConflict: boolean; reload: () => void }

/** Whether the record is in edit mode on its page; the edit mode ends when the page unmounts. */
export function useIsEditing(target: RevisionTarget): boolean

/** Starts the edit mode of a record, or ends the one that is open. */
export function useEditingActions(): { startEditing: (target: RevisionTarget) => void; stopEditing: () => void }
```

`useUpdateArtifact` has the same shape over `updateArtifact`. Each of the two hook files declares its own `UpdateOptions`, unexported: a type that only describes the parameters of one file stays in that file. `DiscardChangesDialog({ open, onOpenChange, onClosed })` ends the edit mode on Discard; it reads no record.

### `artifact/features/restore`

```text
artifact/features/restore/
├── components/
│   ├── RestoreVersionButton.tsx  the trigger: opens the dialog through its store
│   ├── RestoreVersionDialog.tsx  the ConfirmDialog; the only caller of useRestoreVersion
│   └── __tests__/RestoreVersionButton.test.tsx, RestoreVersionDialog.test.tsx
├── hooks/
│   ├── useRestoreVersion.ts      the mutation
│   ├── useOpenRestoreVersionDialog.ts   useOpenRestoreVersionDialog, useRestoreVersionDialog
│   └── __tests__/useRestoreVersion.test.ts
├── restore-version-dialog.store.ts   useRestoreVersionDialogStore = createPendingActionStore()
├── restore.constants.ts          restoreMessages
└── index.ts                      RestoreVersionButton, RestoreVersionDialog, useRestoreVersionDialog
```

```ts
/** Restores a version of an item or an artifact; the answer replaces the detail and the artifacts and items load again. */
export function useRestoreVersion(
  target: RevisionTarget,
  { onChanged }: { onChanged: () => Promise<void> | void },
): UseMutationResult<ArtifactItem | Artifact, Error, number>
```

`RestoreVersionDialog({ revisionKey, open, onOpenChange, onClosed, onChanged })` reads the record and the version with `parseRevisionKey`, and renders nothing for a key it cannot read.

### The widgets

```text
documents/widgets/item/
├── components/ItemPage.tsx         edit mode; EditRecordButton; ItemLinkLine in afterKeyLine; ItemOrigin; HistorySurface with RestoreVersionButton; RevisionContent; ErrorBoundary per block
├── components/ItemLinkLine.tsx     new
├── hooks/useItemPage.ts            reads useDocumentOutline, useItemStatus, useEditLockReason
├── hooks/useItemTab.ts             returns the keep function
├── hooks/useItemCommands.ts        + { isEnabled }
└── item-page.constants.ts          + link line words
documents/widgets/document/
├── components/DocumentPage.tsx     edit mode; actions slot; HistorySurface; RevisionContent in fieldsView; target; quote marks with LinkedItemsPopover
├── hooks/useDocumentTarget.ts      new: the ?item= of the address
├── hooks/useScrollToItem.ts        new: scroll and focus the target once the document is there
└── document-page.constants.ts      + words
documents/widgets/panel/components/DocumentsPanel.tsx   useDocumentOutline in place of useArtifactOutline
documents/widgets/dialogs/          new
├── DocumentDialogs.tsx             DiscardChangesDialog and RestoreVersionDialog, each once, as ProjectDialogs
├── __tests__/DocumentDialogs.test.tsx
└── index.ts
```

```ts
/** The item that the address of a document page names (`?item=`), or null. */
export function useDocumentTarget(): string | null

/** Scrolls the block of the item to the middle of the page and gives it the focus, once `isReady` holds; again when the item changes. */
export function useScrollToItem(itemId: string | null, { isReady }: { isReady: boolean }): void
```

`useScrollToItem` runs its effect after the document has rendered (`isReady` is the `success` state of `useArtifactDocument`), finds the block by `itemAnchorId`, and does nothing when it is not there. `DocumentDialogs` is a lone component at the root of its slice.

## 9. State and data flow

| State | Where | Name |
|---|---|---|
| Item, artifact, revisions, traces, links, citations, the pending interrupt | Query hooks of the entities | as section 6 |
| The values of a form | `react-hook-form` in `useEditForm` | `EditItemFormValues`, `EditArtifactFormValues` |
| Which record is edited, and whose Edit button takes the focus back | `useEditingRecordStore` of the edit feature, not persisted | `recordKey`, `endedKey` |
| The discard dialog, the restore dialog | Stores from `createPendingActionStore`, dialogs mounted once by `DocumentDialogs` | `useDiscardChangesDialogStore`, `useRestoreVersionDialogStore` |
| The level of the history surface, the selected version, whether the changes show | `useHistoryView` in the page widget, keyed on the record id | `level`, `selectedVersion`, `showsChanges` |
| Whether a link card is open | The `Popover` of each key or mark (uncontrolled) | - |
| Whether a link group shows all its chips | `useState` in `ItemLinkLine` | `expandedGroups` |
| The link whose chips and marks show active | `useState` in `ItemPage` | `activeLinkId` |
| The target of a document page | The address, `?item=` | - |

Flow: the page loads the record and its schema and renders; the link line, the origin, the history and the quotes load on their own and each shows its placeholder. Edit (only during a review that allows edits, decision 9) opens the form with the focus on its first field; the first change keeps the tab; Save sends the changed fields with `If-Match`; the answer replaces the detail; the artifacts and the items load again, so the tree shows `E` on the item; the traces load again, so a link made from the old version now shows `!` on the items built on it; the focus returns to Edit. History opens the surface; a selected version shows in the page, with its changes when asked; Restore asks, makes a new version, and the surface stays open with that version on top. While the run writes or no review takes changes, Edit and Restore are disabled with the reason; when the run moves on, the status item of the project loads the run, and they follow.

## 10. Behavior of each component

### Item page and document page

| Component (where) | What it shows; disabled or hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| `EditRecordButton` (right of the `h1`) | Outline "Edit" with `PencilIcon`; disabled with the reason of decision 9 in a tooltip that shows on hover and on focus (`DisabledReason`); hidden in edit mode | Clicks, or Enter or Space | The page shows the form alone (item) or the document form; a shown version closes first | The focus goes to the first field of the form. When the edit mode ends, the focus comes back to this button (to its reason wrapper when disabled) |
| `ItemLinkLine` (under the key line) | One group per link type and direction ("Based on", "Based on this item"), five chips each, "N more"; a chip holds the key and the title of the other item, cut at `max-w-48`; `!` before an out of date key; a dotted underline when the link has a mark in this text; nothing without links, and nothing while the history is open or the form is open; a skeleton line while loading; one error line with Try again | Hovers or focuses a chip; clicks a chip; clicks "N more" | Hover or focus makes the marks of that link `solid` in the text; a click opens its `LinkedItemsPopover`; "N more" shows the rest of the group in place and is gone | Each chip is a button in the Tab order; Enter or Space opens the card. "N more" leaves the focus on the first chip it showed |
| Marks in the text (item page fields) | The words of this item that its links quote, `soft` in `primary`, in `warning` when the other item is an issue; `solid` while their link is active; shown in the Read mode only: none while the links load or fail, while the history is open (at either level), or while the form is open | Hovers or focuses a mark; clicks it, or Enter or Space on it | Hover or focus gives the chips of its links a ring; a click opens the card with one entry per link of the mark | A mark takes the focus (`renderMark` makes it interactive); Escape closes the card and returns the focus to the mark |
| `LinkedItemsPopover` (beside a chip or a mark) | 320 px card, one block per entry: the relation, key and title, status and version; "The words it quotes": the main field of the other item (3 lines) with the words of the other side marked, or those words in a `blockquote`, with "These words are no longer in the text." when they are not found; "Made from version 1; now version 2" when out of date; Open | Clicks Open (or the title); clicks outside; presses Escape | Open opens the page of the item in the preview tab (`PageLink`: a double click keeps the tab, Ctrl or Cmd keeps the usual meaning of the browser) and closes the card; outside or Escape closes it | The focus moves into the card on open (Radix); Escape and a close return it to the chip or the mark. One card at a time: opening another closes the first |
| `ItemOrigin` (end of the item page) | "Why this item exists": the steps, indented, each "Based on" key title with `!` when out of date, and `for "<words>"` when the step has a `source_quote`; each citation with transcript and turn, `Read`, the message text with the quote marked; nothing without an origin, and nothing while the history or the form is open; compact loading and error | Clicks a step row; clicks `Read` | A row opens that item page in the preview tab; `Read` opens the transcript at the message, scrolled, focused and marked (decision 17) | Rows and `Read` are links in the Tab order; no key of its own |
| Transcript marks (document page) | The words of each message that a link quotes, `soft` in `primary` (`evidenced_by`) or `warning` (`resolved_by`, from an issue); shown in the Read mode only, not while the history of the document is open; a line "The quotes could not load." with Try again on a failure, and no marks | Clicks a mark, or Enter or Space on it | The card opens with the items that quote these words ("Quoted by RAW-001") | A mark takes the focus; Escape closes the card and returns the focus to the mark |
| The target block (document page, `?item=`) | The block of the item marked `bg-accent/50` | Arrives from `Read` or an address | The page scrolls it to the middle | The block takes the focus (`tabIndex={-1}`); the mark stays while the address names the item |
| `ItemNavigator` (bottom right, unchanged) | Hidden in edit mode | As S1a | As S1a | `J` and `K` are not registered in edit mode |

### History surface (bottom left of both pages)

| Component (where) | What it shows; disabled or hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| History button (level `closed`) | Ghost "History" with `HistoryIcon`; hidden in edit mode | Clicks, or Enter or Space | The surface opens at the level `version` with the current version selected; the versions load; the page goes to the History mode (decision 19): `RevisionContent` in place of the fields, and no link line, no marks, no origin | The focus goes to the heading "History" |
| Header (levels `version`, `list`) | "History"; the list toggle ("Show every version" or "Hide the list", `aria-expanded`); Close | Clicks the toggle; clicks Close | The toggle adds or removes the list above the stepper; Close goes to `closed`, and the page goes back to the Read mode: the current version with its link line, its marks and its origin | Escape goes one level down (`list` to `version` to `closed`); at `closed` the focus returns to the History button. The surface is not modal: the page scrolls and takes clicks |
| Stepper | Newer and Older beside "Version 2 of 3" and "<reason>, <author>, <time>"; Newer disabled on the current version, Older on version 1; Older pending while the next page loads | Clicks Newer or Older | The selected version changes by one; the page shows it (decision 11) | The focus stays on the button pressed; a button that becomes disabled moves the focus to the other one |
| Show changes | `Checkbox` "Show changes"; disabled on version 1 with "Version 1 is the first one." | Checks or unchecks | The page marks the changes of the selected version against the one before, or stops | Space toggles it |
| Restore slot | `RestoreVersionButton` for a selected version that is not the current one; disabled with the reason of decision 9 | Clicks "Restore this version" | The restore dialog opens (decision 12) | After a restore, the focus goes to the heading "History" |
| List (level `list`) | Every loaded version, newest first, the selected one `aria-current`; "Show older versions" while there are more; compact loading and error | Clicks a version; clicks Show older versions | The version is selected and shown in the page; the next page loads below | Each version is a button in the Tab order; the focus stays on it after the click |
| `RevisionContent` (in the page, while the surface is open) | The banner: "Version 2 of 3, by Analyst, 2 days ago." with "Back to the current version", or "Version 3 of 3, the current one." with "Close the history"; the fields of the selected version, with `Changed` and `DiffView` on the fields that changed when the changes show; "The content did not change." for a review. No link line, no marks, no origin | Clicks the banner button; reads | Back selects the current version, the surface stays open; Close the history closes the surface and the page shows the current version with its links | The banner button is the first stop in the Tab order of the article |

### Edit form

| Component (where) | What it shows; disabled or hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| `EditItemForm`, `EditArtifactForm` | Every field in schema order, the empty ones too; read only fields as values; an `Alert` with the reason at the top when the rule of decision 9 turns off while the form is open | Types; presses Enter in a one-line input | Enter submits; the first change keeps the tab | The first field takes the focus on open. The fields are checked on Save, then on each change of a field with a problem; the focus goes to the first wrong field. No Escape, no `Ctrl+S` |
| `EntriesControl` | One control per entry, Remove per entry, Add under the last | Clicks Add; clicks Remove | Add appends an empty entry; Remove takes the entry out | Add focuses the new entry; Remove focuses the entry that takes its place, else the one before, else Add. Empty entries are dropped on save |
| `EditFormFooter` | Save (`PendingButton` "Saving"), disabled while clean or locked with the reason; Cancel; the error of the form; the conflict alert with Reload | Clicks Save; Cancel; Reload | Save: decision 8. Cancel on a clean form ends the edit mode; on a dirty one opens `DiscardChangesDialog`. Reload loads the new version into the form | After a successful Save or a Cancel, the focus goes back to Edit |

### Dialogs (mounted once by `DocumentDialogs`)

| Component | What it shows | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| `DiscardChangesDialog` | Red confirm: "Discard your changes?", "What you changed in this form is lost.", Discard, Keep editing | Discard; Keep editing; Escape | Discard ends the edit mode; Keep editing and Escape close the dialog, the form stays as it was | The focus goes to Keep editing on open (the `AlertDialog` of `ConfirmDialog` focuses its cancel); on close it returns to Cancel, or to Edit after Discard |
| `RestoreVersionDialog` | Confirm, not red: "Restore version 2?" with the words of decision 12, Restore, Cancel | Restore; Cancel; Escape | Restore: pending, then a toast, the history stays open with the new version on top; a failure keeps the dialog open with a toast. Cancel and Escape close it | On close after a restore, the focus goes to the heading "History"; after Cancel, back to "Restore this version" |

### Tree and footer (panel)

| Component (where) | What it shows | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| `!` row status (tree) | Letter `!` in `warning` under review, `primary` outside one; tooltip "Based on an older version" | Hovers or focuses the row | The tooltip reads the label, as the other states do | As S1a |
| Footer count | "1 out of date" among the counts | - | - | - |

## 11. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| Edit and Restore enabled | Edit, and Restore on an older version | AR-001 or AR-007 of the requirements analysis, default (the run waits at the analysis review) |
| Disabled: agents working | Tooltip "Documents cannot change while the agents work." | `?mock-run-status=running` |
| Disabled: not under review | Tooltip "Only the documents under review can change now." | REQ-001 of the specification, default |
| Disabled: no review | Tooltip "A document can change while it waits for your review." | `?mock-run-status=done` |
| Disabled: the review takes no changes | Tooltip "This review does not take changes." | unit tests (every checkpoint of the mock allows edits) |
| The form | Every field, the empty optional ones too | AR-001, Edit |
| Save pending | `PendingButton` "Saving" | `?mock-update-item=loading`, `?mock-update-artifact=loading` |
| Save failed | The message under the form | `?mock-update-item=error` |
| Problems from the server | At their fields | unit tests (the mock refuses only a value that the form never offers) |
| Version conflict | The alert with Reload | open one item in two browser tabs, save in one, then in the other; unit tests |
| Locked while saving | The `invalid_state` words | unit tests |
| History surface, three levels | Button; stepper; list | AR-007 (two versions), default |
| History open on the current version | Banner "Version 2 of 2, the current one."; no link line, no marks, no origin | AR-007, History |
| A version shown, with its changes | Banner, `Changed`, `DiffView` | AR-007, History, Older, Show changes |
| History closed again | The link line, the marks and the origin back | AR-007, History, Close |
| History loading or failed | Skeleton line and rows; error with Try again; the rest of the page as usual | `?mock-revisions=loading`, `?mock-revisions=error` (new) |
| Show older versions | The button | unit tests (a handler that answers two pages) |
| Restore failed | The dialog stays, a toast | `?mock-restore-item=error`, `?mock-restore-artifact=error` |
| Link line with `!` | `! AR-007` and its title among the chips | REQ-003 |
| A mark of a `derived_from` link | "search mentors by field of study" marked in the statement; its card shows AR-001 with "lists mentors by field of study" marked | REQ-001 |
| A mark from an issue | "within 2 seconds" marked in `warning`; its card shows AMB-001 | AR-010 |
| A chip and its mark together | Hover the chip AR-001: the mark turns `solid` | REQ-001 |
| Quoted words no longer in the text | The card shows the words with "These words are no longer in the text." | unit tests (edit an item after a link quoted it) |
| Link card | Relation, key, title, status, main field, Open | REQ-003, click the chip AR-007 |
| Why this item exists | Steps down to the quote, `Read` | REQ-001 |
| No origin | No section | a persona, or a section item |
| Links or origin failed | One error line or a compact error with Try again; the rest of the page as usual | `?mock-traces=error` |
| `!` in the tree and the footer | REQ-003 in `primary` with `!`; "1 out of date" | the specification |
| A transcript with its quotes | Every quoted word of a message marked; a click shows the items that quote them | the transcript of PER-001 |
| A transcript at a message | Scrolled, focused, marked | `Read` on REQ-001 |

```ts
export const contentInputMessages = {
  add: 'Add',
  removeEntry: (index: number, label: string) => `Remove entry ${String(index)} of ${label}`,
  none: 'None',
  chooseValue: 'Choose a value',
} as const

export const revisionMessages = {
  title: 'History',
  showList: 'Show every version',
  hideList: 'Hide the list',
  close: 'Close the history',
  newer: 'Newer version',
  older: 'Older version',
  versionOf: (version: number, current: number) => `Version ${String(version)} of ${String(current)}`,
  version: (version: number) => `Version ${String(version)}`,
  you: 'You',
  showChanges: 'Show changes',
  firstVersion: 'Version 1 is the first one.',
  changed: 'Changed',
  noChange: 'The content did not change.',
  showOlder: 'Show older versions',
  viewing: (version: number, current: number, author: string, time: string) =>
    `Version ${String(version)} of ${String(current)}, by ${author}, ${time}.`,
  viewingCurrent: (current: number) => `Version ${String(current)} of ${String(current)}, the current one.`,
  backToCurrent: 'Back to the current version',
  closeHistory: 'Close the history',
  itemsAsNow: 'The items below are as they are now; each item has its own history.',
  loading: 'Loading the versions',
  loadError: 'The versions could not load.',
} as const

// artifact/entities, revisions.constants.ts: the words of a change of a record that the state of the
// project refuses. One concept, one place: the edit and restore features take their `locked` value
// from it, since `artifact` may not read `documents`, where the rule itself lives.
export const recordChangeMessages = {
  locked: 'This document cannot change now. It can change while it waits for your review.',
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
  locked: recordChangeMessages.locked,
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
  locked: recordChangeMessages.locked,
} as const

export const editAccessMessages = {
  agentsWorking: 'Documents cannot change while the agents work.',
  reviewTakesNoChanges: 'This review does not take changes.',
  notUnderReview: 'Only the documents under review can change now.',
  noReview: 'A document can change while it waits for your review.',
} as const satisfies Record<EditLockReason, string>

export const itemOriginMessages = {
  title: 'Why this item exists',
  turn: (turn: number) => `turn ${String(turn)}`,
  read: 'Read',
  forWords: (words: string) => `for "${words}"`,
  loading: 'Loading where this item comes from',
  loadError: 'Where this item comes from could not load.',
} as const

export const linkedItemMessages = {
  open: 'Open',
  quotedBy: 'Quoted by',
  quotedWords: 'The words it quotes',
  wordsGone: 'These words are no longer in the text.',
  incoming: (title: string) => `${title} this item`,
  outOfDate: (made: number, now: number) => `Made from version ${String(made)}; now version ${String(now)}`,
  chipLabel: (key: string, title: string) => `${key}, ${title}`,
  chipLabelOutOfDate: (key: string, title: string) => `${key}, ${title}, made from an older version`,
} as const
// `ItemOrigin` and `ItemLinkLine` read `linkedItemMessages.outOfDate` too: the words of an out of date link sit in one place.

// itemPageMessages additions
moreLinks: (count: number) => `${String(count)} more`,
linksLoadError: 'The links could not load.',

// documentPageMessages additions
quotesLoadError: 'The quotes could not load.',
```

## 12. Mocks and screenshots

- S1b.0 changes the mock to the editing rule (decision 25).
- One new scenario, `mock-revisions` (`error`, `loading`), read with `answerScenario('revisions')` by `GET /items/{id}/revisions` and `GET /artifacts/{id}/revisions` after their own scenario (`mock-item`, `mock-artifact`, which also answer the page): the history then fails or waits while the page shows. The handler tests get one case each; the mocks README lists it (S1b.1, commit 6).
- The other states have their scenarios: the edit and restore handlers, `mock-update-item`, `mock-update-artifact`, `mock-restore-item`, `mock-restore-artifact`, `mock-traces` and `mock-run-status`.
- The words of the links. S1b.1 commit 4 renames `quote` of `LinkSpec` to `targetQuote` (the eight quotes of the fixture move under it) and adds `sourceQuote`; the builder gives `target_quote` and `source_quote` (null by default). Commit 5 adds the words below. The fixture gains these words, each found in the text of its item:

  | Link | `source_quote` | `target_quote` |
  |---|---|---|
  | REQ-001 `derived_from` AR-001 | "search mentors by field of study" | "lists mentors by field of study" |
  | AR-003 `derived_from` RAW-002 | "sees their free hours" | "I never know who is free this week" |
  | AMB-001 `concerns` AR-010 | - | "within 2 seconds" |
  | AMB-003 `concerns` AR-005 | - | "reminds the student and the mentor" |

  AR-003 `derived_from` LN-001 keeps no words: it shows in the link line only. `link-rules.validators.ts` checks a new link (`POST /projects/{id}/trace-links`) as the API says: a quote on a side that the link type does not allow, or words not found in the text of the item, answer `422` at `target_quote` or `source_quote`. The handler tests get a case for each.
- Otherwise no fixture change: REQ-001 has an origin down to a quote, REQ-003 an out of date link, AR-007 two versions, and the requirements analysis is under review by default. Check the first three, and the marks of REQ-001, in the first unit tests of `useItemOrigin`, `useOutOfDateItemIds`, `useRevisionHistory` and `useItemLinks` against the mock server, so that a fixture change breaks a test.
- Screenshot cases in `tests/screenshots/projects/documents.spec.ts` (S1b.2): AR-001 in edit mode; AR-007 with the history at the level `list`, version 1 selected and its changes shown; REQ-003 with the card of AR-007 open; REQ-001 with its mark of AR-001 and the chip active; AR-010 with the `warning` mark of AMB-001; REQ-001 with "Why this item exists"; the specification tree with `!` on REQ-003; the transcript of PER-001 opened by `Read`, with its quotes marked.

## 13. Tests

| File | Cases |
|---|---|
| `artifact/.../document-blocks.utils.test.ts` + data (extended) | `hasTranscript` |
| `shared/components/ui/__tests__/disabled-reason.test.tsx` | No reason: the child alone; a reason: tooltip on focus and on hover, the reason as the description; axe |
| `shared/components/frame/.../PageLink.test.tsx` (S1b.0) | Click opens the preview tab; double click keeps; a click with Ctrl does not prevent the default |
| `mocks/artifacts/handlers/__tests__/*` (S1b.0, extended) | A change of an item of the requirements analysis passes by default; of the specification answers `409 invalid_state`; with `?mock-run-status=done` and `=running` answers `409 invalid_state`; a restore follows the same rule |
| `shared/routes/__tests__` | `document(id, { itemId })` writes `?item=` |
| `workflow/.../content-form.schema.test.ts` | A problem of `validateContent` lands at `content.<name>`; a valid content passes; the result is still a `ZodObject` |
| `workflow/.../content-values.utils.test.ts` + data | `contentChanges`: changed, unchanged, read only included, missing on one side; `withoutEmptyEntries`: blank list entry, blank tag, empty object entry, a filled entry kept, other fields untouched; `findQuote`: in the main field, in a later field, the main field first when both hold it, a list entry not searched, not found |
| `workflow/.../workflow-vocabulary.types.test.ts` (or the test of the definition schema) | `quotes` of each link type parsed; the definition of the mock passes |
| `workflow/.../ContentFieldValue.test.tsx` (extended) | A `text` and a `textarea` value drawn with their marks and the wrapper; other widgets ignore marks |
| `workflow/.../content-fields.utils.test.ts` + data | `mainField`: first non title field; a schema with the title field only |
| `workflow/.../workflow-definition.utils.test.ts` | `findAgentRole` |
| `workflow/.../useValueLabelOf.test.ts` | A value list title; a written label in each view |
| `workflow/.../ContentFieldInput.test.tsx` + data | One case per widget (data-driven): renders, changes the form value; nullable select stores null; select with allowed values; readOnly shows the value; a problem shows at the field; axe |
| `workflow/.../EntriesControl.test.tsx` | Add focuses the new entry; Remove focuses the next, the previous, then Add; the labels of Remove; object-list entry fields |
| `run/.../run-status.utils.test.ts` | `isWritingRunStatus` for each status |
| `trace/.../chains.utils.test.ts` + data | `originOf`: a chain to a quote, a raw requirement with its own evidence, two paths to one item (shown once), no `derived_from`, a loop; `linkQuotesByItem`: a `source_quote` on the source and a `target_quote` on the target of one link, two quotes of one message, key order, a link without words left out; `outOfDateItemIds`: older `target_version`, superseded target; `itemLinkGroups`: outgoing and incoming, definition order, unknown type |
| `trace/entities/types/__tests__`, `trace/widgets/graph/__tests__/trace-graph.utils.test.ts` (S1b.1 commit 4, extended) | A link parses with `target_quote` and `source_quote`; an edge of the graph carries `targetQuote` |
| `trace/.../useChainQueries.test.ts` | `useOutOfDateItemIds` on the specification gives REQ-003; `useLinkQuotesOf` on the transcript of PER-001 gives the quotes of PER-001#2, and its states; not enabled reads nothing; `useReloadTraces` invalidates the module key |
| `artifact/.../item-status.utils.test.ts` + data | `outOfDate` order (after `openIssue`, before `edited`); its level in and out of a review; its look and count text |
| `artifact/.../outline.utils.test.ts` + data | The `outOfDateIds` reach the item nodes and the status counts; `itemAnchorId` |
| `artifact/.../revisions.utils.test.ts` + data | `revisionAuthor` (user, known role, unknown role); `previousRevision` (loaded, not loaded); `recordKeyOf`; `revisionKeyOf` and `parseRevisionKey` round trip, a foreign string gives null |
| `artifact/.../useRevisionQueries.test.ts` | `useRevisionHistory` for an item and an artifact; not enabled reads nothing; two pages; AR-007 has two versions |
| `mocks/artifacts/handlers/__tests__/*` (S1b.1, extended) | `mock-revisions=error` fails both revisions endpoints and leaves `GET /items/{id}` as it is |
| `artifact/.../useHistoryView.test.ts` | Starts closed with the current version; open, toggleList, stepBack down to closed; close selects the current version and hides the changes; a new current version is selected and keeps the level; `isHidden` closes |
| `artifact/.../useArtifactQueries.test.ts` | `useAllowedValuesOf` for the persona schema |
| `artifact/.../useApplyRecordChange.test.ts` | The answer lands in the detail key of an item and of an artifact; the lists load again; the promise settles after the reload |
| `artifact/.../HistorySurface.test.tsx` | Closed reads nothing; the button opens the level `version` and focuses the heading; Newer and Older select and disable at the ends; Older loads the next page when needed; the list toggle and `aria-current`; Escape steps down and returns the focus to the button; Close; the restore slot absent on the current version; after a new current version the level stays and the heading takes the focus; `itShowsQueryStates`; axe |
| `artifact/.../RevisionContent.test.tsx` | Nothing while the surface is closed; the current version with its banner and Close the history when open; the banner and Back for an older version (the surface stays open); the changed fields with `Changed` and the struck and added words; an emptied field; "The content did not change."; Show changes disabled on version 1 with its reason; axe |
| `artifact/.../ArtifactDocument.test.tsx`, `ArtifactItemDetails.test.tsx` (extended) | The actions slot; `fieldsView` in place of the fields; anchors; target `data-target`; message marks wrapped by `renderMessageMark`; field marks passed to the values and wrapped by `renderFieldMark`; `afterKeyLine` under the key line |
| `documents/entities/utils/__tests__/edit-access.utils.test.ts` + data | Each row of the table of decision 9, in its order |
| `documents/entities/hooks/__tests__/*` | `useEditLockReason` for AR-001 (null), REQ-001, `running`, `done`; `useDocumentOutline` marks REQ-003; `useItemStatus` |
| `trace/entities/hooks/__tests__/useItemLinks.test.ts`, `useItemOrigin.test.ts` | `useItemOrigin` for REQ-001 (steps, transcript title, turn, text) and a persona (none); `useItemLinks` for REQ-003 (groups, titles, `!`), for REQ-001 (the mark of AR-001 in the statement) and AR-010 (a `warning` mark), and its states |
| `artifact/entities/items/hooks/__tests__/useItemHref.test.ts` | A requirement opens its page; a message opens its transcript at it |
| `trace/entities/components/__tests__/ItemOrigin.test.tsx` | Steps indented with their links; the quote marked in the text; Read opens the transcript at the message; `!` on an out of date step; none; loading; error with Try again; axe |
| `trace/entities/utils/__tests__/link-marks.utils.test.ts` + data | `fieldMarksOf`: a quote placed in its field, two overlapping quotes merged with both links, a quote not found left out, `warning` for an issue; `markRangesOf` on a message |
| `trace/entities/components/__tests__/LinkedItemsPopover.test.tsx` | Opens on click and on Enter; the fields of an entry; the words of the other side marked in its main field, in a `blockquote` when not there, "These words are no longer in the text." when not found; several entries; Open opens the page and closes the card; Escape returns the focus to the trigger; axe |
| `artifact/features/edit/.../edit.utils.test.ts` + data | `itemUpdateBody`, `artifactUpdateBody` (only changed fields, stored values, empty entries dropped, title and summary), `isVersionConflict` |
| `.../edit-item.schema.test.ts`, `edit-artifact.schema.test.ts` | Missing title; a content problem at its path |
| `.../useUpdateItem.test.ts`, `useUpdateArtifact.test.ts` | Sends the changed fields with `If-Match`; updates the cache and reloads; `onChanged` runs; the edit mode ends; `itToastsOnResult` |
| `.../useEditingRecord.test.ts` | `startEditing` then `useIsEditing`; unmount ends it; `endedKey` set once on stop |
| `.../EditItemForm.test.tsx`, `EditArtifactForm.test.tsx` | `itAsksForFieldsBeforeSending`; the first field focused on open; the focus on the first wrong field; Save disabled until a change; first change calls `onFirstChange` once; Enter in an input submits; `422` at the fields; conflict alert and Reload; `invalid_state` words; other error; Cancel clean ends the edit mode; Cancel dirty opens the discard dialog through its store; locked disables Save with the reason and shows the alert; axe |
| `.../EditRecordButton.test.tsx` | Enabled starts the edit mode; locked shows the reason; takes the focus once when its edit ends |
| `.../DiscardChangesDialog.test.tsx` | `itAsksBeforeAction` with Discard; Discard ends the edit mode; Keep editing keeps it |
| `artifact/features/restore/__tests__/*` | The button opens the dialog through its store with its key; locked button with the reason; `itAsksBeforeAction` (Restore); toast; dialog stays on a failure with a toast; an artifact restore reloads its items; a key it cannot read renders nothing |
| `documents/widgets/dialogs/__tests__/DocumentDialogs.test.tsx` | Each dialog opens from its store and closes; one of each on the screen |
| `documents/widgets/item/.../ItemPage.test.tsx` (extended) | Edit mode hides the link line, the origin, the history and the navigator and drops `J` and `K`; the first change keeps the tab; Save returns to reading with the focus on Edit; the link line under the key line; the marks of REQ-001 in its statement, a mark opens its card, hovering a chip makes its mark `solid` and hovering a mark rings its chip; no marks in a shown version; the origin at the end; opening the history at either level replaces the fields and hides the link line, the marks and the origin, also on the current version, and closing it shows them again; Edit while a version shows opens the form on the current one; a trace error leaves the fields shown; disabled outside the review |
| `documents/widgets/item/.../ItemLinkLine.test.tsx` | Groups and their words, chips with key and title, five chips and "N more", `!` with its label, the dotted underline of a marked link, a chip opens the card, hover calls `onActiveLinkChange`, states; axe |
| `documents/widgets/document/.../DocumentPage.test.tsx` (extended) | Edit in the actions slot; edit mode; history surface and `fieldsView`; the quoted words of a transcript marked and a mark opens the items that quote them; a failure of the links shows the line and the transcript; `?item=` scrolls and focuses the message |
| `documents/widgets/panel/.../DocumentsPanel.test.tsx` (extended) | `!` on REQ-003 and "1 out of date" in the footer |

Helpers: the edit form tests share `renderEditItemForm(item, options)` and the fixtures of one analyzed requirement in `artifact/features/edit/components/__tests__/edit-form.data.ts` (one slice uses it). The history tests share the revisions of AR-007 in `artifact/entities/components/history/__tests__/history.data.ts`. The page tests keep `renderDocumentsFrame`. A step `editField(label, value)` is not added: `replaceText` and `fillFields` do it.

## 14. Docs to update

- `docs/API.md` (S1b.D): the editing rule (decision 9); `source_quote` in the trace body and in the body of `POST /projects/{id}/trace-links`, with the quote rules (decision 13).
- `docs/DATA_SHAPE.md`, `docs/workflow/definition.schema.json`, `docs/workflow/requirements_engineering.v1.json`, `docs/workflow/prompts/analyst.v1.md`, `docs/architecture/database.dbml` and `README.md`, `docs/ui/reference-apps.md`, the diagram of the tables (S1b.D): `quote` renamed `target_quote`, the quotes on both sides of a link, the sentence on the direction of a link (decision 13).
- `frontend/CONTRIBUTING.md` (S1b.0): every dialog through a store, mounted once (decision 25).
- `docs/architecture/web-app-modules.md`: S1b.D already names the module `trace` (`10f0259`); S1b.0 no `panel` in `artifact`; S1b.1 the row `workflow` (the inputs of the content fields), `artifact` (the history and its surface, `outOfDate`), `artifact` also (the address of an item), `trace` (the words of a link, the links of an item and their marks, the origin, the link card, out of date items), `documents` (edit access, outline, item status), the `@x` links of section 5 (`trace` gives `documents`); S1b.2 the features `edit`, `restore` of `artifact` and the widget `dialogs` of `documents`.
- `docs/architecture/web-app.md` section 6: the inputs by widget, the save and its errors, when a document can change, the history surface and the version in the page, the links inside the content (marks, chips) and their card, the origin, the address of a message; section 9: the files.
- `frontend/src/mocks/README.md`: the editing rule (S1b.0); the trace scenarios (S1b.0); `mock-revisions` (S1b.1); the addresses of section 11 under Documents (S1b.2).
- Implementation plan (branch `frontend-plan`): row S1 split into S1b.0, S1b.1, S1b.2; "As built" notes of S1a (section 2.1 of this plan).

## 15. Left for the next PRs

| Item | Where |
|---|---|
| The keys of a document open the peek; the peek shows `ItemOrigin` | S1c |
| Export, and the Export button in the `actions` slot | S1d |
| The edited items counted on the review bar and sent as `modified_items`; the review form embeds `ContentFieldInput` | S2 |
| The citing items in the margin of a transcript (skeletons 6) | S4 (Trace), if the card is not enough |
| Marks in the entries of a `list` field (`findQuote` searches `text` and `textarea` only) | Not planned in S1 |
| A form to give the words of a link made by hand | S4, with the creation of a link |
| Two versions compared side by side, or any two versions | Not planned in S1 |
| Create, delete, move and reorder items by hand | Not planned in S1 |
| Create and remove a trace link | S4 |
| The logout confirm of `UserMenu` and `NewProjectDialog` opened through stores, mounted once | The next maintenance PR, after S1b.0 changes the rule |
| A superseded item page with "Replaced by REQ-014" (5.4) | S3, when search reaches superseded items |

## 16. Commits and checks

S1b.D `docs/fe/api-fields` (added after its 9 commits; the user pushes the branch and opens or updates its PR):

1. `docs(api): accept a change of a document only during a review that allows edits`
2. `docs(api): quote the words of both items of a link, as its link type allows`

S1b.0 `chore/fe/maintenance-before-edit`, from `origin/main` once S1b.D is merged:

1. `fix(artifact): show the role of a transcript message as text, since a message has no page`
2. `refactor(frame): move the link that opens a page in the preview tab to the frame`
3. `refactor(artifact): remove the placeholder artifact panel`
4. `fix(mocks): refuse a change of a document outside a review that allows edits`
5. `docs: drop the artifact panel from the modules, and list the trace scenarios of the mock`
6. `docs: open every dialog through the store of its feature, mounted once`
7. `refactor(documents): place the files of the documents entities in the folders of their kind`

S1b.1 `feat/fe/edit-entities`:

1. `feat(shared): give a disabled control its reason, mark ranges of a text, and address a document at an item`
2. `feat(workflow): edit the value of a content field by its widget, compare two contents, drop empty entries, and find the words of a quote`
3. `feat(run): tell the run statuses that write the documents`
4. `feat(trace): read the words of both items of a link, as target_quote and source_quote`
5. `feat(mocks): quote the words of both items of the mentor links, and check the words of a new link`
6. `feat(artifact): read and browse the history of a record, mark the quoted words of an item, give the address of any item, and mark an item made from an older version`
7. `feat(trace): find the origin, the quoted words, the out of date items and the links of an item, and show the origin and the card of a link`
8. `feat(documents): tell when a document can change, and read the outline and the status of an item`
9. `docs: describe the inputs, the history, the links, the origin and the out of date state`

S1b.2 `feat/fe/edit-artifacts`:

1. `feat(artifact): edit an item and a document`
2. `feat(artifact): restore a version of an item or a document`
3. `feat(documents): mount the dialogs of the edits and the restores`
4. `feat(documents): edit, browse and restore on the pages, with the links and the origin of an item`
5. `docs: describe the editing and the versions of the documents`

Each file goes in the commit of its row in section 7. The plan and the prompt stay on `frontend-plan`.

Checks, one at a time, per PR: ESLint and Prettier on the changed files; Vitest on the touched folders (`shared/components/ui`, `shared/components/frame`, `shared/routes`, `mocks/artifacts`, `mocks/trace`, `mocks/workflow`, `modules/workflow`, `modules/run/entities/status`, `modules/trace`, `modules/artifact`, `modules/documents`); typecheck once, since routes and types change. A test that times out only with the others runs again alone. No full suite, E2E, screenshots or build locally; CI runs them. `grep -nP '[^\x00-\x7F]'` on the docs and the new comments; `grep -rnE 'backend|frontend|UI|dashboard|FR-[0-9]|NFR-[0-9]|docs/'` on the new comments.

## 17. Checklist

- [x] The S1a answers (S1a decision 1) written in `usability.md` on `frontend-plan` (5.3, 5.4, 7.4, open points 1, 7, 8; 2026-11-03)
- [x] A1 to A9 written in `usability.md` on `frontend-plan` (5.3, 5.4, 7.4, 8.2, 8.3; 2026-11-03), as this plan builds them; the user reads them there and changes what does not fit before S1b.2
- [ ] The server repository follows the editing rule and the quotes of decision 13 (the user)
- [ ] S1b.D: commits 1 and 2 on `docs/fe/api-fields`, the diagram rendered, the workflow test green; the branch merged by the user
- [ ] S1b.0 from `origin/main` after S1b.D; commits 1 to 7, each checked; PR opened
- [ ] S1b.1 from the S1b.0 branch; commits 1 to 9, each checked; PR opened with its base noted
- [ ] S1b.2 from the S1b.1 branch; commits 1 to 5, each checked; PR opened with its base noted
- [ ] Each row of section 10 checked once in `pnpm dev:mock` (one dev server, one page at a time, stopped after): edit and save AR-001, the history of AR-007 at its three levels with the changes, a restore, the card of AR-007 on REQ-003, the mark of AR-001 in REQ-001 with its chip, the `warning` mark on AR-010, the origin of REQ-001 and its `Read`, Edit disabled on REQ-001 with its tooltip on hover
- [ ] The description of each PR written from this plan; the endpoints checked against the `*.api.ts` functions that the hooks call
