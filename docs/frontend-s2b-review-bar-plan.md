# Frontend S2b: the review bar of a document and of its item pages, and an answer that says what it does

The plan of S2b of the [Frontend implementation plan](frontend-implementation-plan.md): the review bar at the bottom of a document under review and of every item page of that document, with the items that the user edited; an answer of a review that explains each option, is kept while the user moves between pages, and is confirmed before it is sent, with a dialog that states what the review holds now and what sending does; and `Open review` of Progress leading to the document. Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md), after the [S2a plan](frontend-s2a-activity-plan.md) as built.

S2a is not merged yet (PRs #66 to #71, stacked, draft). This plan is checked against `feat/fe/activity` at `5db9bb25` (#71, the top of the stack), on `main` at `36063353` (#64). Once S2a merges, check every path and name of sections 6 to 8 again against `main`. When the code differs from this plan (a name, a path, a signature), the agent stops and reports the difference instead of choosing.

Short paths: `documents/...`, `review/...`, `artifact/...`, `workflow/...`, `run/...`, `activity/...` are under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`. `app/.../[projectId]/...` is `app/(project)/projects/[projectId]/...`.

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

Two stacked PRs: the answer first, since the chat already shows it and the bar mounts it.

| Id | Branch | PR title | Based on |
|---|---|---|---|
| S2b.D | `docs/fe/review-edited-items` | `docs(api): keep the items edited before a send-back answer, for the agents to read with the feedback` | `main` |
| S2b.1 | `feat/fe/answer-review-confirm` | `feat(frontend): explain each option of a review, keep the answer across pages, and confirm it before it is sent` | `feat/fe/activity` (S2a.4, #71) while it is open; `main` once it merges; needs S2b.D |
| S2b.2 | `feat/fe/review-bar` | `feat(frontend): show the review bar of a document and of its item pages, with the edited items` | S2b.1 |

| | |
|---|---|
| Needs | S2a.0 to S2a.4: `AnswerReviewForm`, `useAnswerReviewForm` and `useAnswerReview` of `review/features/answer`, `useEditedItems` of `artifact/entities`, `useDocumentsUnderReview` of `documents/entities`, `ActivityDialogs`, the waiting stage of Progress |
| After it | The review of one item (section 15), S1c, S1d, S3 to S6 |
| Docs first | The API covers the calls (`POST /runs/{run_id}/resume`, the pending interrupt, the items of an artifact, the workflow definition with the `option` of its edges). One rule was missing: what a send-back option does with the items that the user edited (A10). The user answered it, and it is written in `docs/API.md` by the docs PR S2b.D (`docs/fe/review-edited-items`, from `main`), which merges before S2b.1. The answers of A1 to A10 go to `docs/ui/usability.md` on `frontend-plan` before the code (4, 5.4, 5.7, 6.4, 7.3, 8.1) |
| Sketch | [`docs/ui/wireframes/s2b-review-bar.html`](ui/wireframes/s2b-review-bar.html): the bar in five states, the options with what each does, and the confirm dialog of an approving option and of a send-back option; layout only |

### How a review is answered (the API, for every row below)

One review is one interrupt: one checkpoint of the run, over the documents it lists (`review_artifacts`). It has one answer: one option, one feedback text, the answers of its questions, and the list of the items edited before it. There is no option and no feedback per item.

```text
POST /runs/{run_id}/resume                     Idempotency-Key: <key>
{
  "interrupt_id": "7b0c...",
  "option": "reject_reanalyse",                one option for the whole review
  "feedback": "AR-003: ...; RAW-004: ...",      one text, required when the option requires it
  "answers": {},                               one entry per question, by its key
  "modified_items": [{ "item_id": "d3f9...", "version": 2 }]
}
```

- The items are edited before, one at a time, with `PATCH /items/{item_id}`; each save is a new version. `modified_items` lists them with their version and carries no content; it is accepted only when the interrupt allows edits.
- An option that approves (`approves: true`) makes the documents under review and every item of them that is still `draft` approved. An item that is `rejected` stays rejected. An option that does not approve approves nothing.
- The option leads the run to the node of the edge of the checkpoint whose `option` is its key; that node has a stage, which the user knows by its title.
- An option that does not approve keeps the edited items at the versions the user saved, and the agents read them with the feedback before they write again (S2b.D).
- The answer is final: no endpoint takes it back. A `409 invalid_state` answers an interrupt already resolved.

### Questions to the user

The agent builds the proposal; the user confirms or changes each before the PR that shows it opens (A2, A4, A5, A7, A9, A10 before S2b.1; A1, A3, A6, A8 before S2b.2).

| Id | Question | Proposal (built) | Decision |
|---|---|---|---|
| A1 | Does the bar show the whole answer at once, as the sketch 7.3 of Usability, or one row that opens it? | One row (the look, the prompt, the edited items, `Answer`), 48 px high; `Answer` opens the form above the row, inside the bar, and `Hide the answer` closes it | 13 |
| A2 | Usability 4 says "buttons on the review bar; the approving option is the only primary button". S2a built one column of options with the feedback box inside the chosen one, and one Send. Which one does the bar show? | The form of S2a, with what each option does under its label (decision 5): one answer form in the chat and on the bar. Usability 4 and 7.3 are rewritten to it | 5 |
| A3 | How are the edited items named? | Answered by the user (2026-11-07, twice). Nobody remembers what a key such as `AR` stands for, so an item names itself by the title of its kind and its title; its key comes last, small and muted, and is never the main text. On the bar, which has little room, the titles of the first two in one sentence, each a link to its item with a tooltip that gives the kind, the title and the key: "You edited Layered booking flow and Students book a session at once.", "You edited Layered booking flow, Students book a session at once, and 4 more items." In the dialog, each edited item on its own line: the kind ("Analyzed requirement", small, muted) and the title; the key is left out there, since a key is optional and shows only where it helps (decision 17) | 12, 17 |
| A4 | Can the user answer while an item or a document is in edit mode? | No: an answer sends the saved versions, so a change not saved yet would not be part of it. "Save or cancel your change before you answer." and the options and Send are disabled with that reason, in the chat and on the bar | 7 |
| A5 | What shows after the answer is sent? | The toast of S2a; on the page that was on screen, one line in place of the bar ("Reviewed", "You chose Redo the analysis."), which takes the focus once the dialog closes; in the chat, the line of the answered review takes it | 9 |
| A6 | Where does `Open review` of Progress lead? | To the first document under review, in the preview tab; to the chat at the review when the review lists no document | 15 |
| A7 | Is the answer kept while the user moves between pages (`J`, `K`, Previous, Next, the outline, the chat)? | Yes: the chosen option, the feedback and the answers of the questions are kept for the review (by its interrupt) until it is sent, in the chat and on every bar. They are kept in the memory of the browser tab: a reload starts again from the defaults | 6 |
| A8 | What shows when the review fails to load while the run waits? | One row on every document page and item page of the project: "The review could not load." with `Try again`; the rest of the page as usual | 11 |
| A9 | Does Send ask before it sends? | Yes, always, in the chat and on the bar: a dialog states the review now (documents, versions, draft and edited items), the answer (option, feedback, answers) and what happens on send, in plain sentences; its button is the label of the option. Not red: the action destroys nothing, but it cannot be taken back, and the dialog says so | 8 |
| A10 | When the user chooses an option that sends the work back (Redo the analysis, Interview again, Ask for changes), what happens to the items they edited? | Answered by the user (2026-11-07): the edited items keep the versions the user saved, and the agents read them with the feedback before they write again. Written in `docs/API.md` by S2b.D; the server repository follows it | 4 |

## 2. What was read

| Source | What it gave |
|---|---|
| `docs/ui/usability.md` 4 (rows of the review), 5.2, 5.4 (Review across item pages, When a document can change), 5.6 (Outside the tabs), 6.4 (the sketch of option D), 7.3, 8.1 (40 px controls on the review bar), 8.3 (words) | The bar at the bottom of the document under review and of each of its item pages, with the count of the edited items; the prompt, the edited items as links, the options; the bar belongs to the document, not to a tab |
| `docs/architecture/web-app.md` 5 | One review panel built from the pending interrupt; the edited items sent as `modified_items` when `allow_edits` |
| `docs/API.md` Runs, resume body and rules, editing rule; `docs/DATA_SHAPE.md` HumanDecision | Section 1 above |
| `mocks/workflow/requirements_engineering.v1.json` | The edges of each checkpoint carry the key of their option: `accept` to `requirement_engineer` (Writing the specification), `reject_reanalyse` to `analyst` (Analysing the interviews), `reject_reinterview` to `rework_elicitation` (Interviewing), `ok` to `backlog_manager`, `not_ok` to `requirement_engineer`, `approve` to `interviewer` |
| `docs/architecture/web-app-modules.md` 2, 5, 9 and `frontend/lint/lib/modules/module-imports.constants.js` | `documents` may read `review`, `artifact`, `run`, `project`; `review` may read `workflow`, `artifact`, `run`; `activity` may read `review`; a widget imports no widget |
| `frontend/CONTRIBUTING.md` | Every dialog mounted once by a `...Dialogs` widget and opened through the store of its feature (`createPendingActionStore`); a target of more than one id as a key made by a pure helper of the entity; a request to take the focus as a small store (`requestFocus`, `focused`) |
| S2a plan, sections 1, 3 (decisions 19, 26, 33, 34), 10, 15 | S2b mounts `AnswerReviewForm` and counts with `useEditedItems`; `Open review` leading to the document left to S2b |
| S1b plan, decision 9 and section 10 | The edit mode of a record (`useIsEditing`), the lock reasons of `editAccessOf`, History and Previous and Next on an item page |
| Code of `feat/fe/activity` | Every file of sections 6 to 8, read at `5db9bb25`; `ConfirmDialog` (`onConfirm` that returns a promise keeps the dialog open with its buttons disabled until it resolves) |
| Skills of the prompt | FSD (strategy C for the two pages, `@x` only between entities), Clean Review, React Best Practices (`rerender-derived-state-no-effect`), Composition Patterns (a slot over a boolean), Web Design Guidelines (focus after a region goes away, a dialog that names its action), React Foundation Review (effects inside hooks, no derived state in a store), the Fowler catalog (Extract Function for the click of a waiting stage, Introduce Parameter Object for the outcome of an option) |

### What S2a planned and what it built

| S2a plan said | Built | Rule this plan takes |
|---|---|---|
| `AnswerReviewForm`: the options as `PendingButton`, a `pendingOption` that opens the feedback box, Cancel | The questions on steps (`StepNav`), the options as one radio column (`OptionsColumn`, `OptionRow`) with the box inside the chosen option, one Send; no Cancel | The bar uses the form as built (A2); the rows gain what each option does |
| `useAnswerReview(run, interrupt)` takes the edited items from its caller | It calls `useEditedItems` itself and waits while the items load (`isItemsLoading`) | The dialog calls it, so the edited items it lists are those it sends |
| The review in the chat: `ReviewEntry`, an `Item` card while pending | `PendingReview` laid over the end of the chat; `ReviewEntry` for an answered review only | The bar draws its own row; it does not reuse `PendingReview` (a widget of `activity`) |
| `Open review`: a visible `Button size="xs"` under the waiting step | A click on the waiting stage row opens the chat at the review; "Open review" is screen reader text and the tooltip | Decision 15 changes the target of that click, not its look |

## 3. Decisions

### The answer (S2b.1)

1. **Where an option leads is a rule of the definition.** `optionTargetStage(definition, checkpointNodeId, optionKey)` joins `workflow/entities/definition/workflow-definition.utils.ts`: the edge from the checkpoint whose `option` is the key (`edgesFrom`), its target node (`findNode`), and the `stage` of that node. It gives `{ type: 'stage', key }`, `{ type: 'end' }` for a node of kind `end`, or null when no edge names the option or its stage is internal. Its data-driven test covers the six options of version 1.
2. **What the review holds now is a rule of `artifact`.** `reviewItemCounts(items)` joins `artifact/entities/status/item-status.utils.ts` beside `editedItems`: `{ draft, edited }`, where `draft` counts the items whose `review_status` is `draft` (the edited ones included, since they are still draft) and `edited` the items of `editedItems`. The file `status/hooks/useEditedItems.ts` moves to `status/hooks/useReviewItems.ts` (`git mv`, a commit alone), and gains `useReviewItems(artifactIds)`, which reads the same queries and gives `{ edited, counts, isPending }`; `useEditedItems` stays in it, over `useReviewItems`, so S2a does not change. Both read the first page of each artifact, as S2a decision 19 says (section 15).
3. **What an option does is a rule of `review`.** `optionOutcome(option, context)` joins `review/entities/interrupts.utils.ts` and gives an `OptionOutcome`:
   - `{ type: 'approve', next, draftCount, editedCount, artifacts }` for an option with `approves: true`;
   - `{ type: 'sendBack', next, editedCount, artifacts }` otherwise;
   - `next` is the title of the target stage, `'end'`, or null (decision 1). `context` is one object (`OptionContext`: `next`, `counts`, `artifacts`), not a list of parameters.
   `useOptionOutcomes(interrupt, run)` in `review/entities/hooks/useOptionOutcomes.ts` joins the definition at `run.workflow_version` (`useWorkflowDefinition`, `useStageTitles`, `optionTargetStage` through `workflow/entities/@x/review`) and the counts (`useReviewItems` through a new `artifact/entities/@x/review.ts`), and gives `Map<optionKey, OptionOutcome>` with `isPending`.
4. **Each option says what it does, in the form and in the dialog** (A2, A9). The words are functions of `answerReviewMessages.outcomes` over an `OptionOutcome`: the form shows one line under the label of each option (`outcomeLine`), the dialog the full list (`outcomeSteps`). They state only what section 1 states. Every line is a full sentence with a subject and a verb, in the basic formal words of the user view, with one meaning each: no label followed by a colon ("Then: ..."), no fragment. A stage title that comes in the middle of a sentence starts with a small letter through `lowerFirst` of `@/shared/lib/text` (decision 18). Section 11 holds the words.
5. **The form keeps its look.** The options column of S2a stays; under each label, the outcome line in `text-xs text-muted-foreground`, then, for an option that requires feedback and is not chosen, the line "This choice needs a short description from you." as today. Send keeps its label; it no longer sends (decision 8).
6. **The answer is kept for its review** (A7). `review/features/answer/stores/answer-draft.store.ts` with `useAnswerDraftStore`: `drafts: Record<string, AnswerReviewFormValues>` by interrupt id, `saveDraft(interruptId, values)`, `clearDraft(interruptId)`. `useAnswerReviewForm` starts from the draft when there is one, else from the defaults of S2a, and saves each change through `useAnswerDraft(interruptId, form)` of `hooks/useAnswerDraft.ts`: `form.subscribe` (react-hook-form) in an effect inside the hook, with its cleanup. Two forms of one review on screen at once (the chat in one group, a document in the other) each save on change; the one that is not edited shows the draft of its mount until it mounts again (section 15). The step of the questions (`StepNav`) is not kept: it starts at the first question.
7. **The lock while a record is edited** (A4). `AnswerReviewForm` takes `disabledReason?: string | null`: while not null, the options, the questions, the steps and Send are disabled, each wrapped in `DisabledReason` with the reason, and `useAnswerReviewForm` treats the form as busy. `artifact/features/edit` exports `useIsEditingAnyRecord()` from `hooks/useEditingRecord.ts` (`recordKey !== null`). The bar and `PendingReview` of the chat give `disabledReason={answerReviewMessages.saveFirst}` while it is true: an answer from the chat while a document is in edit mode in another group would also leave the change out. The rule is the composition of two features, so the widgets hold it (FSD strategy C).
8. **Send asks first** (A9). Send checks the form (as in S2a: the feedback, the questions), saves the draft, and opens `ConfirmAnswerDialog` through `useOpenConfirmAnswerDialog()`. The store is `createPendingActionStore()` of `@/shared/lib/pending-action` in `stores/confirm-answer-dialog.store.ts`; its target is `interruptKeyOf(runId, interruptId)` of `review/entities/interrupts.utils.ts`, read back by `parseInterruptKey`. The dialog reads the run (`useRun`), the pending interrupt (`usePendingInterrupt`), the draft (`useSavedDraft`), the outcomes (`useOptionOutcomes`) and the review items (`useReviewItems`), and is the only file that calls `useAnswerReview`. It is mounted once by `ActivityDialogs` (`activity/widgets/dialogs`), which the project layout mounts for every page of a project, the documents included.
9. **After the send** (A5). On success, `useAnswerReview` shows the toast of S2a, clears the draft, and stores `{ interruptId, optionLabel }` in `stores/answer-sent.store.ts` (`useAnswerSentStore`: `lastSent`, `focusRequested`, `markSent`, `requestFocus`, `focused`). The dialog closes when the reloads end (`onConfirm` returns their promise) and, in `onClosed`, calls `requestFocus()`, since the form that held the focus is gone. The sent line of the bar (S2b.2) and `ReviewEntry` of the chat read `useSentAnswer(interruptId)` (`hooks/useSentAnswer.ts`): the one on screen whose interrupt is `lastSent` takes the focus and calls `focused()`. A failure keeps the dialog open with the toast of S2a and keeps the draft. A `409` (answered elsewhere) reloads the interrupts; the review is no longer pending, so the dialog shows "This review was already answered." with Close only.
10. **`'use client'`.** The project layout mounts `ActivityDialogs`; `ConfirmAnswerDialog`, `useOpenConfirmAnswerDialog`, `useAnswerDraft`, `useSentAnswer`, `useOptionOutcomes`, `useReviewItems` and the stores start with `'use client'`.

### The bar (S2b.2)

11. **Placement.** The bar is a widget of `documents`: `documents/widgets/review-bar`. It puts the answer of `review` beside the items of `artifact` on the pages of `documents`. It is not in `review`, which may not read `documents`, whose entity says which documents the review lists. The review of one document is `useDocumentReview(projectId, artifactId)` in `documents/entities/hooks/useDocumentsUnderReview.ts`, a `DocumentReviewResult`: `none` (no interrupted run, or its review does not list the artifact), `pending`, `error` with `retry` (A8), `success` with `run` and `interrupt`. Its pure part is `documentReviewOf(state)` in `documents/entities/utils/documents.utils.ts`.
12. **The edited items on the row** (A3). The bar reads `useEditedItems(artifactIds)` with every artifact of the review, since the answer sends them all. One sentence: "You edited", then the titles of the first `shownEditedTitleCount` (2) and, when there are more, "N more items", joined by `listSentenceParts` of `@/shared/lib/text` (decision 18), then a full stop. Each title is a `PageLink` to `useItemHref(projectId)(item)`, cut with "..." past `max-w-48`, inside a `RecordNameTooltip` (decision 17). No edited item, or a review that takes no edits: no part.
13. **Closed by default, open above the row** (A1). A `section` with `aria-label`, in a column: the open part (the form, `max-h-96`, its own scroll) on top while open; the row under it, always, so `Answer` and `Hide the answer` stay under the pointer. The open state is `review-bar.store.ts` (`useReviewBarStore`: `openInterruptId`, `toggleAnswer(interruptId)`, `closeAnswer()`), keyed by the interrupt, so the bar stays open across the pages of one review and a new review starts closed; read through `useReviewBarState(review)`. The draft of decision 6 keeps what the user wrote.
14. **Two pages, one bar: a slot.** `DocumentPage` and `ItemPage` each take `footer?: ReactNode`, drawn under their scroll area in the column of the page, so History and Previous and Next float above the bar; a page in a loading, error or not found state draws it too. The route pages of `app/` pass `<DocumentReviewBar>` and `<ItemReviewBar>` (FSD strategy C), since a widget imports no widget. `ItemReviewBar` reads the item (`useItem`) and renders `DocumentReviewBar` with its `artifact_id`.
15. **`Open review` leads to the document** (A6). `firstReviewedArtifactId(interrupt)` joins `review/entities/interrupts.utils.ts`. `ProgressSection` takes `pendingInterrupt: Interrupt | null` in place of `pendingInterruptId`, and the click of a waiting stage moves to `waitingStageHref(projectId, interrupt)` of `activity/widgets/panel/progress-section.utils.ts` (Extract Function of the branch of the click).
16. **The wireframe is a sketch.** Build with the components of `shared/components/ui` and their props; classes only to place parts; no new color or token. `max-h-96` is a step of the scale.
17. **An item names itself by its kind and its title; a key is optional and always last** (the user, 2026-11-07). Nobody remembers what the letters of a key stand for (`AR`, `RAW`, `LN`), so the key is never first and never the main text, and it shows only where it helps (a search by key, the key line of an item page, a tooltip); where it adds a word the user does not read, it is left out. Every item on screen shows, in this order: the title of its kind (`useKindTitleOf()(item.kind)`, "Analyzed requirement"), its title (`itemTitle(schema, item)`, the main text), and, when it helps, its key (`KeyText`, `text-xs text-muted-foreground`) at the end. Where there is no room for the kind, the title shows alone and a tooltip gives the kind, the title and the key. Two shared components hold this, since they name no object of the product (they take strings):
    - `RecordName({ kind, title, code, layout })` in `shared/components/ui/record-name.tsx`, `code` optional: `layout="line"` puts the kind (small, muted), the title and the code (small, muted) on one line, the title cut with "..."; `layout="stacked"` puts the kind over the title, and the code at the end of the title line;
    - `RecordNameTooltip({ kind, title, code, children })` in the same file: the trigger is `children` (a title link), the content the kind, the title in `font-semibold`, and the code.
    In this PR: the bar shows titles with `RecordNameTooltip` (with the key); the dialog lists each edited item as `RecordName layout="line"` without the key, since the kind and the title say which item it is. The rule goes to the frontend README, section "Words of the screens", in the `docs` commit of S2b.2, so that the next screens follow it; S4 uses the same components.
18. **Two text helpers in shared code.** Both hold no rule of the product, so they go to `shared/lib/text/` from their first user (prompt, Placement item 5), in commit 1 of S2b.1 with their data-driven tests:
    - `lowerFirst(text)` in `formatters.utils.ts`, beside `capitalize`: the first letter in lower case, unless the first word is all capitals or holds a capital after its first letter ("API design", "iOS app" stay as they are), so that a title reads inside a sentence ("continue with writing the specification");
    - `listSentenceParts(items)` in `list.utils.ts`: a list of things written as a sentence of the locale ("A, B, and C") cut into parts, so that each thing can render as a link while the words between them stay text. The separators are not passed: they come from `Intl.ListFormat(formatLocale, { type: 'conjunction', style: 'long' }).formatToParts`, so the commas and the "and" follow the language of the app. It takes `readonly T[]` and gives `({ type: 'item'; value: T } | { type: 'text'; text: string })[]`. For `en-US` and three things: `[item A, text ', ', item B, text ', and ', item C]`; for two: `[item A, text ' and ', item B]`; for one: `[item A]`. The bar maps an `item` part to a `PageLink` and a `text` part to a string, and adds "4 more items" as the last thing.

## 4. Scope

| | |
|---|---|
| Endpoints | `POST /runs/{run_id}/resume` (through `useAnswerReview`, from the dialog only) |
| Queries | The project run, `GET /runs/{run_id}`, the pending interrupt, `GET /workflow/definition?version=` (the edges and stages of the version of the run), `GET /artifacts/{artifact_id}/items` (first page of each artifact of the review), `GET /items/{item_id}` (from its cache), the content schemas |
| Copied | Nothing |
| Written new | `optionTargetStage`; `reviewItemCounts`, `useReviewItems`; `optionOutcome`, `useOptionOutcomes`, `interruptKeyOf`, `parseInterruptKey`, `firstReviewedArtifactId`; the draft, the confirm dialog and the sent state of `review/features/answer`; `useIsEditingAnyRecord`; `documentReviewOf`, `useDocumentReview`; the widget `documents/widgets/review-bar`; the slots of the two pages; the route pages; `waitingStageHref` |
| Not built | The review of one item (approve or reject it alone, section 15); a draft kept after a reload; a command and a hotkey for the answer; the titles of the edited items; the bar in the peek of S1c |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Widget slice | The block | `review-bar` |
| Components of the block | `<Object><Block>` | `DocumentReviewBar`, `ItemReviewBar` |
| Dialog of the action | `<Verb><Object><Role>` | `ConfirmAnswerDialog` |
| Hooks of the dialog store | As the prompt names them | `useOpenConfirmAnswerDialog`, `useConfirmAnswerDialog` |
| Stores | `<topic>.store.ts` | `answer-draft.store.ts` (`useAnswerDraftStore`), `answer-sent.store.ts` (`useAnswerSentStore`), `confirm-answer-dialog.store.ts` (`useConfirmAnswerDialogStore`), `review-bar.store.ts` (`useReviewBarStore`) |
| Hooks | What they give | `useAnswerDraft`, `useSavedDraft`, `useSentAnswer`, `useOptionOutcomes`, `useReviewItems`, `useDocumentReview`, `useReviewBarState`, `useIsEditingAnyRecord` |
| Pure rules | What they give | `optionTargetStage`, `reviewItemCounts`, `optionOutcome`, `interruptKeyOf`, `parseInterruptKey`, `firstReviewedArtifactId`, `documentReviewOf`, `waitingStageHref` |
| Types | The object and what it is | `OptionOutcome`, `OptionContext`, `ReviewItemCounts`, `DocumentReviewResult`, `SentAnswer` |
| Words | `<topic>Messages` | `answerReviewMessages` (more words), `confirmAnswerMessages`, `reviewBarMessages` |
| Props | A reason, not a boolean; a slot as `SidePanel` | `disabledReason`, `footer` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `ConfirmDialog` | `shared/components/ui/confirm-dialog.tsx` | The confirm of the answer (`title`, `description`, `confirmLabel`, `onConfirm` returning a promise, `onClosed`, `children`) |
| `createPendingActionStore` | `@/shared/lib/pending-action` | The store of the dialog |
| `DisabledReason`, `Button`, `KeyText` | `shared/components/ui/` | The lock, the row, the keys |
| `pluralForm` | `@/shared/lib/text` | "1 item", "2 items" |
| `Tooltip` | `shared/components/ui/tooltip.tsx` | `RecordNameTooltip` |
| `KeyText` | `shared/components/ui/key-text.tsx` | The key at the end of `RecordName` |
| `itemTitle`, `useKindTitleOf` | `workflow/entities` | The title and the kind in the tooltip and the dialog |
| `PageLink`, `useOpenPage` | `@/shared/components/frame` | The keys of the edited items; `Open review` |
| `toneClasses` | `@/shared/lib/tone` | The color of the look |
| `edgesFrom`, `findNode`, `useWorkflowDefinition`, `useStageTitles` | `workflow/entities` | `optionTargetStage`, `useOptionOutcomes` |
| `editedItems`, `useEditedItems`, `useItemHref`, `useItem` | `artifact/entities` | The counts, the row, the item of an item page |
| `usePendingInterrupt`, `useInterruptStatusLook` | `review/entities` | The dialog, the row, the sent line |
| `useRun` | `run/entities` | The dialog |
| `shownRun`, `useProjectRunResult` | `project/entities/@x/documents` | `useDocumentReview` |
| `renderDocumentsFrame`, `renderWithProviders`, `itAsksBeforeAction`, `itToastsOnResult`, `itShowsQueryStates`, `findConfirmDialog`, `confirmAction`, `cancelAction`, `expectNoAccessibilityViolations` | `@/test/...` | The tests |

### New in shared code

| Helper | Path | Users | Replaces |
|---|---|---|---|
| `lowerFirst` | `shared/lib/text/formatters.utils.ts` | The outcome words of `answerReviewMessages` | Nothing; no copy found in the modules |
| `listSentenceParts` | `shared/lib/text/list.utils.ts` | The edited items of the bar | Nothing; no copy found in the modules |
| `RecordName`, `RecordNameTooltip` | `shared/components/ui/record-name.tsx` | The bar, the dialog; S4 | Nothing; S1b shows keys first in the link chips, which S4 changes |

### Checked, kept in the module

| Candidate | Rule it holds | Stays in |
|---|---|---|
| The target stage of an option | The graph of the definition | `workflow/entities` |
| The draft and edited counts | The review status of an item | `artifact/entities` |
| The outcome of an option | What an answer of a review does | `review/entities` |
| The draft of an answer | The state of the action of answering | `review/features/answer` |
| "N more items" after two titles | How many edited items the row names | `documents/widgets/review-bar` |

## 7. Changes to existing modules

| File | Change | PR / commit |
|---|---|---|
| `shared/lib/text/formatters.utils.ts`, `list.utils.ts` (new), `index.ts`; `shared/components/ui/record-name.tsx` (new), the design system page | `lowerFirst`, `listSentenceParts`; `RecordName`, `RecordNameTooltip` | S2b.1 / 1 |
| `workflow/entities/definition/workflow-definition.utils.ts`, `@x/review.ts`, `index.ts` | `optionTargetStage`; `@x/review` gives it with `useWorkflowDefinition`, `useStageTitles` | S2b.1 / 2 |
| `mocks/interrupts/interrupts.changes.ts` | `stageAfterOption` reads `optionTargetStage` | S2b.1 / 2 |
| `artifact/entities/status/hooks/useEditedItems.ts` to `useReviewItems.ts` | `git mv` alone | S2b.1 / 3 |
| `artifact/entities/status/item-status.utils.ts`, `status/hooks/useReviewItems.ts`, `@x/review.ts` (new), `index.ts` | `reviewItemCounts`, `useReviewItems`, `useEditedItems` over it | S2b.1 / 4 |
| `review/entities/interrupts.utils.ts`, `interrupts.types.ts`, `hooks/useOptionOutcomes.ts` (new), `index.ts` | `optionOutcome`, `OptionOutcome`, `OptionContext`, `useOptionOutcomes`, `interruptKeyOf`, `parseInterruptKey`, `firstReviewedArtifactId` | S2b.1 / 5 |
| `artifact/features/edit/hooks/useEditingRecord.ts`, `index.ts` | `useIsEditingAnyRecord()` | S2b.1 / 6 |
| `review/features/answer/...` | Section 8: the outcome lines, `disabledReason`, the draft (commit 7); the dialog and the sent state (commit 8) | S2b.1 / 7, 8 |
| `activity/widgets/dialogs/ActivityDialogs.tsx` | Mounts `ConfirmAnswerDialog` | S2b.1 / 8 |
| `activity/widgets/chat/components/PendingReview.tsx`, `ReviewEntry.tsx` | `disabledReason` while a record is edited; `ReviewEntry` takes the focus through `useSentAnswer` | S2b.1 / 9 |
| `documents/entities/utils/documents.utils.ts`, `hooks/useDocumentsUnderReview.ts`, `types/documents.types.ts`, `index.ts` | `documentReviewOf`, `useDocumentReview`, `DocumentReviewResult` | S2b.2 / 1 |
| `documents/widgets/document/components/DocumentPage.tsx`, `documents/widgets/item/components/ItemPage.tsx` | `footer` slot | S2b.2 / 3 |
| `app/.../[projectId]/documents/[artifactId]/page.tsx`, `app/.../[projectId]/items/[itemId]/page.tsx` | Pass the bars | S2b.2 / 3 |
| `activity/widgets/panel/components/ProgressSection.tsx`, `progress-section.utils.ts` (new) | `pendingInterrupt`, `waitingStageHref` | S2b.2 / 4 |
| `tests/screenshots/projects/activity.spec.ts`, `documents.spec.ts` | Section 12 | S2b.1 / 10, S2b.2 / 5 |

## 8. The slices, file by file

### `review/features/answer` (S2b.1, changed)

```text
review/features/answer/
├── components/
│   ├── AnswerReviewForm.tsx            outcome lines, disabledReason
│   ├── ConfirmAnswerDialog.tsx         new
│   ├── QuestionField.tsx
│   └── __tests__/
├── hooks/
│   ├── useAnswerReview.ts              clears the draft, marks the answer sent
│   ├── useAnswerReviewForm.ts          starts from the draft, opens the dialog
│   ├── useAnswerDraft.ts               new
│   ├── useOpenConfirmAnswerDialog.ts   new
│   ├── useSentAnswer.ts                new
│   └── __tests__/
├── stores/
│   ├── answer-draft.store.ts           new
│   ├── answer-sent.store.ts            new
│   ├── confirm-answer-dialog.store.ts  new
│   └── __tests__/
├── answer-review.constants.ts          more words, confirmAnswerMessages
├── answer-review.schema.ts
├── answer-review.types.ts              SentAnswer
├── answer-review.utils.ts
└── index.ts                            AnswerReviewForm, ConfirmAnswerDialog, useSentAnswer
```

```ts
// stores/answer-draft.store.ts
interface AnswerDraftState {
  /** The answer being written for each review, by interrupt id, until it is sent. */
  drafts: Readonly<Record<string, AnswerReviewFormValues>>
  saveDraft: (interruptId: string, values: AnswerReviewFormValues) => void
  clearDraft: (interruptId: string) => void
}

// answer-review.types.ts
/** The review answered last in this browser tab, for the line that says so. */
export interface SentAnswer {
  interruptId: string
  /** The label of the option sent; null for an answer without options. */
  optionLabel: string | null
}

// stores/answer-sent.store.ts
interface AnswerSentState {
  lastSent: SentAnswer | null
  /** Whether the line of the answer should take the focus, once the dialog has closed. */
  focusRequested: boolean
  markSent: (sent: SentAnswer) => void
  requestFocus: () => void
  focused: () => void
}

// hooks/useAnswerDraft.ts
/** Saves each change of the form of a review as its draft, while the form is mounted. */
export function useAnswerDraft(interruptId: string, form: UseFormReturn<AnswerReviewFormValues>): void
/** The draft of a review, or undefined when there is none. */
export function useSavedDraft(interruptId: string): AnswerReviewFormValues | undefined

// hooks/useSentAnswer.ts
/** Whether this review was just answered here, with its option, and whether its line takes the focus. */
export function useSentAnswer(interruptId: string | null): {
  sent: SentAnswer | null
  shouldTakeFocus: boolean
  focused: () => void
}

// hooks/useOpenConfirmAnswerDialog.ts
export function useOpenConfirmAnswerDialog(): (runId: string, interruptId: string) => void
export function useConfirmAnswerDialog(): {
  target: { runId: string; interruptId: string } | null
  open: boolean
  setOpen: (open: boolean) => void
  closed: () => void
}

// hooks/useAnswerReview.ts (changed)
/** Sends the answer of the review; on success clears its draft and marks it sent. */
export function useAnswerReview(run: Run, interrupt: Interrupt): {
  /** Resolves once the answer is sent and the queries have loaded again. */
  answer: (values: AnswerReviewFormValues) => Promise<void>
  isPending: boolean
  isItemsLoading: boolean
}

// components/ConfirmAnswerDialog.tsx
/**
 * Asks before the answer of a review is sent: what the review holds now, the answer, and what
 * sending it does, with the label of the option on the button that sends.
 */
export function ConfirmAnswerDialog(): ReactNode

// components/AnswerReviewForm.tsx (changed)
interface AnswerReviewFormProps {
  interrupt: Interrupt
  run: Run
  /** Why the review cannot be answered now; the controls stay disabled with it. */
  disabledReason?: string | null
}
```

`useAnswerReviewForm` calls `useOptionOutcomes(interrupt, run)` and gives the form `outcomes`; `OptionRow` takes `outcome: OptionOutcome | undefined` and shows no line under the label while it loads. Its `send` checks the form, calls `saveDraft`, then `openDialog(run.id, interrupt.id)`.

### `review/entities`, `workflow/entities`, `artifact/entities` (S2b.1, changed)

```ts
// workflow/entities/definition/workflow-definition.utils.ts
/** Where an option of a checkpoint leads the run: a stage by its key, the end, or null. */
export function optionTargetStage(
  definition: WorkflowDefinition,
  checkpointNodeId: string,
  optionKey: string,
): { type: 'stage'; key: string } | { type: 'end' } | null

// artifact/entities/status/item-status.utils.ts
export interface ReviewItemCounts {
  draft: number
  edited: number
}
/** How many items of a review are still draft, and how many of them the user edited. */
export function reviewItemCounts(items: readonly ArtifactItem[]): ReviewItemCounts

// artifact/entities/status/hooks/useReviewItems.ts
/** The items of the artifacts of a review, from the first page of each: the edited ones and the counts. */
export function useReviewItems(artifactIds: readonly string[]): {
  edited: ArtifactItem[]
  counts: ReviewItemCounts
  isPending: boolean
}
export function useEditedItems(artifactIds: readonly string[]): ArtifactItem[]

// review/entities/interrupts.types.ts
export interface OptionContext {
  /** The title of the stage the option leads to, 'end', or null when unknown. */
  next: string | 'end' | null
  counts: ReviewItemCounts
  artifacts: Interrupt['review_artifacts']
}
export type OptionOutcome =
  | {
      type: 'approve'
      next: OptionContext['next']
      draftCount: number
      editedCount: number
      artifacts: OptionContext['artifacts']
    }
  | {
      type: 'sendBack'
      next: OptionContext['next']
      editedCount: number
      artifacts: OptionContext['artifacts']
    }

// review/entities/interrupts.utils.ts
/** What an option of a review does, from where it leads and what the review holds. */
export function optionOutcome(option: Pick<CheckpointOption, 'approves'>, context: OptionContext): OptionOutcome
/** The key of a review in the store of its dialog, and its pair. */
export function interruptKeyOf(runId: string, interruptId: string): string
export function parseInterruptKey(key: string): { runId: string; interruptId: string } | null
/** The first artifact that the review lists, which Open review leads to; null when it lists none. */
export function firstReviewedArtifactId(interrupt: Pick<Interrupt, 'review_artifacts'>): string | null

// review/entities/hooks/useOptionOutcomes.ts
/** What each option of the review does, from the definition of the run and the items under review. */
export function useOptionOutcomes(interrupt: Interrupt, run: Pick<Run, 'workflow_version'>): {
  outcomes: ReadonlyMap<string, OptionOutcome>
  isPending: boolean
}
```

### `documents/widgets/review-bar` (S2b.2, new)

```text
documents/widgets/review-bar/
├── components/
│   ├── DocumentReviewBar.tsx           ReviewRow, EditedItems, SentLine, ReviewLoadError in the file
│   ├── ItemReviewBar.tsx
│   └── __tests__/
│       ├── DocumentReviewBar.test.tsx
│       ├── ItemReviewBar.test.tsx
│       └── review-bar.utils.data.ts
├── useReviewBarState.ts
├── review-bar.store.ts
├── review-bar.constants.ts
├── __tests__/
└── index.ts                            DocumentReviewBar, ItemReviewBar
```

```ts
// useReviewBarState.ts
/**
 * The state of the bar of one document: whether the answer of its review is open, and the last
 * review it showed, so that the line of a sent answer still names it once the review is gone.
 */
export function useReviewBarState(review: DocumentReviewResult): {
  isOpen: boolean
  toggle: () => void
  close: () => void
  /** The interrupt of the last review that this bar showed; null before any. */
  lastInterruptId: string | null
}

// DocumentReviewBar.tsx
export function DocumentReviewBar(props: { projectId: string; artifactId: string }): ReactNode
// ItemReviewBar.tsx
export function ItemReviewBar(props: { projectId: string; itemId: string }): ReactNode
```

`lastInterruptId` is a `useState` adjusted during render when `review` is `success` with another id (`rerender-derived-state-no-effect`). `DocumentReviewBar` renders by `review.state`: `none` gives `SentLine` when `useSentAnswer(lastInterruptId).sent` is not null, else nothing; `pending` nothing; `error` `ReviewLoadError`; `success` the bar. Classes: the bar `shrink-0 border-t bg-card`, the row `flex h-12 items-center gap-3 px-4`, the open part `max-h-96 overflow-auto border-b px-4 py-3`.

### `documents/entities` (S2b.2, changed)

```ts
// types/documents.types.ts
/** The review that a document is under, as its bar reads it. */
export type DocumentReviewResult =
  | { state: 'none' }
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; run: Run; interrupt: Interrupt }

// utils/documents.utils.ts
/** Which review the document is under, from the run of the project and its pending interrupt. */
export function documentReviewOf(state: {
  run: Run | null
  pending: { status: 'pending' | 'error' | 'success'; interrupt: Interrupt | null | undefined }
  artifactId: string
  retry: () => void
}): DocumentReviewResult

// hooks/useDocumentsUnderReview.ts
export function useDocumentReview(projectId: string, artifactId: string): DocumentReviewResult
```

`documentReviewOf` answers `none` when `run` is null or not `interrupted`; else `pending`, `error`, or `success` when the interrupt lists `artifactId` in `review_artifacts`, and `none` when it does not or is null.

## 9. State and data flow

| State | Where | Name |
|---|---|---|
| The run, the interrupt, the items, the definition | Query hooks of the entities | `useRun`, `usePendingInterrupt`, `useReviewItems`, `useWorkflowDefinition` |
| What each option does | Derived | `useOptionOutcomes` |
| The answer being written | Store of the feature, by interrupt | `useAnswerDraftStore` |
| The review the dialog confirms | Pending action store | `useConfirmAnswerDialogStore` (target `interruptKeyOf`) |
| The answer just sent, the focus after it | Store of the feature | `useAnswerSentStore` |
| The open answer on the bar | Store of the widget | `useReviewBarStore` |
| The last review a bar showed | `useState` in `useReviewBarState` | `lastInterruptId` |
| A record in edit mode | Store of `artifact/features/edit` | `useIsEditingAnyRecord` |

Flow. The form mounts from the draft or the defaults and loads the outcomes (the definition is cached from the first page; the items are those of the outline). Each change saves the draft. Send checks the form, then opens the dialog; the dialog reads the same queries and the draft, so what it states is what it sends. Confirm sends; the dialog waits with its buttons disabled. Success: the toast, the draft cleared, the answer marked sent, the interrupts, runs, artifacts and items reload; the review is no longer pending, so the chat shows the answered line and the bar of the page on screen the sent line; the dialog closes and the line takes the focus. Failure: the toast, the dialog stays open, the draft stays. The `interrupt` event of the stream of the run reloads the pending interrupt (S2a), so a new review shows without a reload, with no draft.

## 10. Behavior of each component

### The answer (`AnswerReviewForm`), in the chat and on the bar

| Component | Shows; disabled or hidden | User does | What follows | Focus and keys |
|---|---|---|---|---|
| An option | Its label; under it the outcome line (`outcomeLine`, section 11); for an option that requires feedback and is not chosen, "This choice needs a short description from you." Disabled with the lock reason (decision 7) | Clicks it; Space on it | It is chosen; an option that requires feedback opens its box, as in S2a; the draft is saved | As in S2a: choosing an option with a box moves the focus into the box |
| The feedback box | As in S2a. One box for the whole review: the user names the items in it ("AR-003: ...") | Writes | The draft is saved on each change | Ctrl or Cmd+Enter is Send |
| Send | "Send", or "Send answers" without options. Disabled with the lock reason; busy while the items load | Click; Ctrl or Cmd+Enter from a box | The form is checked (as in S2a: the focus goes to the first wrong field); then the dialog opens. Nothing is sent yet | The focus goes to Cancel of the dialog |
| Moving away | - | Opens another page, the chat, `J`, `K` | The answer stays in the draft; the form of the next page of the same review starts from it, at its first question | - |

### The confirm dialog (`ConfirmAnswerDialog`)

| Component | Shows | User does | What follows | Focus and keys |
|---|---|---|---|---|
| The dialog | Title "Send your answer?"; description "Check what the review holds now and what your answer does. An answer cannot be taken back."; then three parts, each a heading `text-base font-semibold` with a list. **The review now**: the prompt; "Requirements analysis is under review in version 4." for each document; "18 items are still in draft."; "You edited 2 items." and under it one line per edited item, `RecordName layout="line"` without the key: "Analyzed requirement", "Layered booking flow" (decision 17); or "You did not edit any item." (no line when the review takes no edits). **Your answer**: the option label in bold; the feedback in a `blockquote`, or "You did not write any feedback."; each question with its answer, from the draft. **What happens when you send**: `outcomeSteps` (section 11). Loading: `LoadingState size="compact"` in place of the parts, the button disabled | Reads; Cancel; Escape | Closes; nothing is sent; the draft stays | The focus starts on Cancel; Escape cancels, except while sending; after Cancel the focus goes back to Send |
| The button that sends | The label of the option ("Approve analysis", "Redo the analysis"), or "Send answers" without options; not red. While sending: its spinner, both buttons disabled | Click; Enter on it | Sends (`useAnswerReview`). Success: the toast "Your answer is sent.", the dialog closes after the reloads, the line of the answer takes the focus. Failure: the toast with the reason, the dialog stays open | Closing is blocked while sending |
| The review already answered | "This review was already answered." in place of the parts, with Close only | Close | Closes | Close takes the focus |

### The review bar (`DocumentReviewBar`), at the bottom of a document under review and of each of its item pages (S2b.2)

| Component | Shows; disabled or hidden | User does | What follows | Focus and keys |
|---|---|---|---|---|
| The bar | `section` with `aria-label` "Review of this document". Hidden while the run is not interrupted, while its review loads, on a document that the review does not list | - | - | - |
| The row: look | Icon and label of `useInterruptStatusLook('pending')` ("Waiting for you"), `text-xs font-bold` in its tone | - | - | - |
| The row: prompt | `interrupt.prompt`, one line, cut with "...", the whole prompt in its `title` | - | - | - |
| The row: edited items | Decision 12: "You edited Layered booking flow and Students book a session at once.", each title a link with the tooltip of decision 17. While a record is edited, "Save or cancel your change before you answer." in its place | Clicks a title; hovers or focuses it | The item opens in the preview tab; a double click keeps it. Hover or focus shows the tooltip (kind, title, key) | Tab reaches each title; the tooltip shows on focus, Escape hides it |
| `Answer` / `Hide the answer` | `Button size="sm"`: `variant="default"` closed, `variant="outline"` open; `aria-expanded`, `aria-controls` | Click; Enter or Space | Opens or closes the answer for the review, the same on every page of it | On open, the focus goes to the first control of the form; Escape inside the open part closes it and gives the focus back to `Answer` |
| The open part | `AnswerReviewForm` with `disabledReason`, `max-h-96`, its own scroll | As the answer above | As the answer above | As the answer above |
| `SentLine` | `role="status"`: the look of `useInterruptStatusLook('resolved')` ("Reviewed") and "You chose Redo the analysis." (or "Your answers are sent."). On the page that was on screen when the answer was sent; a page opened after shows no line | - | Goes when the page changes or another review starts | Takes the focus once the dialog closes (`tabIndex={-1}`, decision 9); not in the tab order |
| `ReviewLoadError` | `role="alert"`: "The review could not load." with `Try again` | `Try again` | The pending interrupt loads again | Stays on `Try again` |
| `ItemReviewBar` | `DocumentReviewBar` of the artifact of the item; nothing while the item loads or fails | As the bar | As the bar | `J` and `K` keep the bar open and the draft |

Notes on the sketch: the open part is drawn by `AnswerReviewForm` as it is; the sketch draws no icon before the label of the row, which has the icon of the look; the controls of the bar are `size="sm"`, not the 40 px of Usability 8.1, which is rewritten with A1; the dialog is drawn by `ConfirmDialog`, its width and spacing are those of the component.

### Progress (`ProgressSection`), the waiting stage (S2b.2)

| Component | Shows | User does | What follows | Focus and keys |
|---|---|---|---|---|
| A stage that waits for the user | As in S2a | Clicks the row; Enter or Space | The first document under review opens in the preview tab; with no document, the chat at the review | As in S2a |

## 11. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| The options with what they do | The outcome line under each option | The mentor platform, `/projects/90aa0000-0000-4000-8000-000000000001/activity`, the review of the analysis |
| The dialog of an approving option | Approve analysis: the three parts, "becomes approved", next "Writing the specification" | Choose Approve analysis, Send |
| The dialog of a send-back option | Redo the analysis with feedback: the three parts, "Nothing is approved", back to "Analysing the interviews" | Choose Redo the analysis, write, Send |
| The draft kept | The option and the feedback after moving to an item page and back | Write feedback in the chat, open `AR-003`, open the bar |
| Already answered | The line of the dialog | Unit test only |
| Document under review, items edited | The row with "You edited Layered booking flow and Students book a session at once." | The analysis; the fixtures edit `RAW-004` and `AR-003` |
| More than two edited | "..., and N more items." | Unit test only |
| A record in edit mode | The lock reason, Send and the options disabled | Press `Edit` on an item page |
| Answer sent | The sent line, or the answered line in the chat | Confirm an option |
| Review that takes no edits | No edited items on the row and in the dialog | Unit test only: every checkpoint of version 1 allows edits |
| No bar | A document not under review; the run not interrupted | The specification; `?mock-run-status=running`, `=done`, `=failed` |
| Review fails to load | `ReviewLoadError` | `?mock-interrupts=error` |

Words. `answerReviewMessages` gains (the existing words stay):

```ts
saveFirst: 'Save or cancel your change before you answer.',
outcomes: {
  /** One line under the label of an option: a full sentence. */
  outcomeLine: (outcome: OptionOutcome) => string,
  // approve, next known:   'This option approves the documents under review, and the agents then continue with writing the specification.'
  // approve, next 'end':   'This option approves the documents under review and finishes the work.'
  // approve, next null:    'This option approves the documents under review.'
  // sendBack, next known:  'This option approves nothing and sends the work back to analysing the interviews.'
  // sendBack, next null:   'This option approves nothing, and the agents work on it again with your feedback.'
  /** The list of the dialog, in this order; each entry is a full sentence. */
  outcomeSteps: (outcome: OptionOutcome) => string[],
  // approve:
  //   'Requirements analysis becomes approved.'                                       (one sentence per document under review)
  //   'Its 18 draft items become approved.'                                           ('Their ...' for several documents; none at 0)
  //   'The 2 items that you edited are approved in the versions that you saved.'      (only when editedCount > 0)
  //   'Items that were rejected stay rejected.'
  //   'The agents then continue with writing the specification.'                     ('The work is then finished.' for 'end'; none for null)
  //   'The documents cannot be changed while the agents work.'
  //   'An answer cannot be taken back after it is sent.'
  // sendBack:
  //   'Nothing is approved, and Requirements analysis stays in draft.'
  //   'The 2 items that you edited keep the versions that you saved.'                 (only when editedCount > 0)
  //   'The agents read your feedback and your edited items, and then go back to analysing the interviews.'   ('..., and then work on it again.' for null)
  //   'The documents cannot be changed while the agents work.'
  //   'An answer cannot be taken back after it is sent.'
},
``````

`confirmAnswerMessages`, in `answer-review.constants.ts`:

```ts
title: 'Send your answer?',
description: 'Check what the review holds now and what your answer does. An answer cannot be taken back.',
reviewNow: 'The review now',
yourAnswer: 'Your answer',
whatHappens: 'What happens when you send',
underReview: (title: string, version: number) => `${title} is under review in version ${String(version)}.`,
draftCount: (count: number) => `${String(count)} ${pluralForm(count, { one: 'item is', other: 'items are' })} still in draft.`,
edited: (count: number) => `You edited ${String(count)} ${pluralForm(count, { one: 'item', other: 'items' })}.`,
editedNone: 'You did not edit any item.',
noFeedback: 'You did not write any feedback.',
sendAnswers: 'Send answers',
alreadyAnswered: 'This review was already answered.',
close: 'Close',
loading: 'Loading the review',
```

`reviewBarMessages`, in `review-bar.constants.ts`, with `shownEditedTitleCount = 3`:

```ts
region: 'Review of this document',
answer: 'Answer',
hideAnswer: 'Hide the answer',
editedLead: 'You edited',
andMore: (count: number) => `${String(count)} more ${pluralForm(count, { one: 'item', other: 'items' })}`,
chose: (label: string) => `You chose ${label}.`,
answersSent: 'Your answers are sent.',
loadError: 'The review could not load.',
retry: 'Try again',
```

"Waiting for you" and "Reviewed" are `interruptStatusLabels` (user view); the developer view reads "Waiting for review" and "Resolved". Every sentence of `outcomeSteps` states a rule of section 1. The stage titles enter the sentences through `lowerFirst`; a document title keeps its capital, since it starts its sentence or is a name. The bar joins "You edited", the keys and "N more items" with `listSentenceParts`, then a full stop.

## 12. Mocks and screenshots

One mock change, below. Run 3 of the mentor thread waits at the analysis review (`allow_edits: true`) with three options, two that send back; the fixtures hold edited and draft items; `mock-interrupts` and `mock-run-status` give the other states. Answering approves the analysis or sends the run back; `?mock-reset` shows the review again. The mock already does what the dialog states: `approveArtifacts` of `mocks/interrupts/interrupts.changes.ts` approves only the `draft` items and the artifacts, and `stageAfterOption` moves the run to the stage of the edge of the option. In commit 2 of S2b.1, `stageAfterOption` reads `optionTargetStage` instead of its own walk of the edges, so the app and the mock share one rule; its answer `done` for no stage stays in the mock.

Screenshots. S2b.1, `tests/screenshots/projects/activity.spec.ts`: the review with the outcome lines; the dialog of Approve analysis; the dialog of Redo the analysis with feedback. S2b.2, `tests/screenshots/projects/documents.spec.ts`: the analysis with the bar closed and open; the item page of `AR-003` with the bar; the bar with `?mock-interrupts=error`.

## 13. Tests

| File | Cases |
|---|---|
| `workflow/entities/definition/__tests__/workflow-definition.utils.test.ts` (+ data) | `optionTargetStage`: the six options of version 1; an unknown key; a target of kind `end`; an internal stage |
| `artifact/entities/status/__tests__/item-status.utils.test.ts`; `status/hooks/__tests__/useReviewItems.test.ts` | `reviewItemCounts` (draft, edited, approved and rejected left out); the hook over two artifacts; `useEditedItems` unchanged |
| `review/entities/__tests__/interrupts.utils.test.ts`; `hooks/__tests__/useOptionOutcomes.test.ts` | `optionOutcome` for each type and each `next`; `interruptKeyOf` and `parseInterruptKey` round trip and a bad key; `firstReviewedArtifactId`; the outcomes of the analysis review |
| `artifact/features/edit/hooks/__tests__/useEditingRecord.test.ts` | `useIsEditingAnyRecord` before, during, after an edit |
| `review/features/answer/stores/__tests__/*.test.ts` | The draft saved and cleared by interrupt; `markSent`, `requestFocus`, `focused` |
| `review/features/answer/hooks/__tests__/useAnswerDraft.test.ts` | A form that mounts from a draft; each change saved; another interrupt starts from the defaults |
| `review/features/answer/components/__tests__/AnswerReviewForm.test.tsx` | The outcome line of each option; Send opens the dialog and sends nothing; the checks before it as in S2a; `disabledReason` disables the controls with the reason |
| `review/features/answer/components/__tests__/ConfirmAnswerDialog.test.tsx` | `itAsksBeforeAction` (Cancel sends nothing and keeps the draft; Confirm sends the body of the draft with the edited items); `itToastsOnResult`; the three parts for an approving and a send-back option, with and without edited items, with feedback and with questions; the label of the button; the review already answered; the focus after Cancel; `expectNoAccessibilityViolations` |
| `activity/widgets/chat/components/__tests__/PendingReview.test.tsx`, `ReviewEntry.test.tsx` | The lock while a record is edited; the answered line takes the focus after a send |
| `documents/entities/utils/__tests__/documents.utils.test.ts`; `hooks/__tests__/useDocumentsUnderReview.test.ts` | `documentReviewOf` for each state; `useDocumentReview` for the analysis, the specification and `mock-interrupts=error` |
| `documents/widgets/review-bar/...` | `itShowsQueryStates`; the row; the titles and "N more items"; no edited part without edits; the lock; open and close, the focus, Escape; open across two mounts of one review; the draft across two pages; the sent line and its focus; none on a page mounted after; `expectNoAccessibilityViolations` |
| `documents/widgets/document/...`, `item/...` | The `footer` slot under the content, in the loaded state and in a state |
| `activity/widgets/panel/__tests__/progress-section.utils.test.ts`, `components/__tests__/ProgressSection.test.tsx` | `waitingStageHref` with and without documents; the click opens the analysis |

Helpers: `reviewWith({ approves, editedCount, questions })` builds an interrupt and its items, in `review/features/answer/components/__tests__/answer-review.utils.data.ts`, read by `AnswerReviewForm.test.tsx` and `ConfirmAnswerDialog.test.tsx`; `renderReviewBar(page, options)` over `renderDocumentsFrame` in `documents/widgets/review-bar/components/__tests__/review-bar.utils.data.ts`, read by both test files of the bar.

## 14. Docs to update

| Doc | Change | Where |
|---|---|---|
| `docs/ui/usability.md` 4, 5.4, 5.7, 6.4, 7.3, 8.1 | The answers of A1 to A10: one answer per review, what each option does, the draft, the confirm, the bar | `frontend-plan`, before S2b.1 |
| `docs/API.md` resume rules | What a send-back option does with the edited items (A10) | S2b.D, `docs/fe/review-edited-items`, before S2b.1; the server repository follows it |
| `docs/architecture/web-app.md` 5 | The review panel: what each option does from the definition, the draft by interrupt, the confirm, the bar | `docs` commit of S2b.2 |
| `docs/architecture/web-app-modules.md` 9 | `documents/widgets/review-bar`, the `footer` slot filled by the routes, `ConfirmAnswerDialog` mounted by `ActivityDialogs` | `docs` commit of S2b.2 |
| `frontend/src/mocks/README.md` | The addresses of the dialog and of the bar | `docs` commit of S2b.2 |
| `frontend/README.md`, Words of the screens | An item names itself by its kind and its title; a key is optional, shown only where it helps, and always last, small and muted; where there is no room, the title alone with a tooltip (decision 17) | `docs` commit of S2b.2 |
| `docs/frontend-implementation-plan.md` | Rows S2b.1, S2b.2 and the review of one item | `frontend-plan` |

## 15. Left for the next PRs

| Item | Where |
|---|---|
| **The review of one item: approve or reject an item alone.** The API allows it today: `PATCH /items/{item_id}` with `review_status` and `If-Match`, during a review that allows edits. A feature `artifact/features/review-item` (`ReviewItemMenu`, `useSetItemReviewStatus`): Approve and Reject on the item page beside Edit, and in the menu of a row of a document; the status shows at once on the key line and in the outline; Reject asks first. With it, the dialog of the review states each status: "N items you approved", "N items you rejected stay rejected", "N draft items become approved". It needs the user's answers to: whether a rejected item sends the review back by itself, and whether Approve of the review is allowed while items are rejected | Its own PR after S2b.2, `feat/fe/review-item`, with its plan and its row in the implementation plan |
| A draft kept after a reload | A later PR: the draft store with `persistStorage` of `@/shared/lib/storage`, by interrupt, cleared when the review is no longer pending |
| Two forms of one review on screen at once that follow each other | With the draft kept after a reload: both read the store instead of their mount |
| A command "Answer the review" and a hotkey | A later PR of the review |
| The keys of a line of work in the chat, which stand alone today | S2a, section 15: `ItemRef` holds no title; those lines show the kind and the title once the item is loaded, with the key last (decision 17) |
| The counts when a document has more items than the first page | A later PR: `useReviewItems` reads the first page of each artifact (S2a decision 19) |
| The bar in the peek of an item | S1c |

## 16. Commits and checks

S2b.1 (`feat/fe/answer-review-confirm`):

1. `feat(shared): add the first letter in lower case, a list cut into parts, and the name of a record` (decisions 17, 18)
2. `feat(workflow): read the stage that an option of a checkpoint leads to`
3. `refactor(artifact): rename the hook file of the edited items after the review items` (`git mv` alone)
4. `feat(artifact): count the draft and the edited items of a review`
5. `feat(review): say what each option of a review does, and key a review for its dialog`
6. `feat(edit): tell whether any record is in edit mode`
7. `feat(review): explain each option of the answer, and keep the answer of each review while it is written`
8. `feat(review): confirm the answer of a review before it is sent, with what it does` (the dialog, its stores, `ActivityDialogs`)
9. `feat(activity): hold the answer while a record is edited, and focus the answered review`
10. `test(screenshots): cover the options and the confirm of a review`

S2b.2 (`feat/fe/review-bar`):

1. `feat(documents): read the review that a document is under`
2. `feat(documents): show the review bar of a document, with its edited items and its answer`
3. `feat(app): draw the review bar under the documents and the items of the review`
4. `feat(activity): open the document under review from the waiting stage`
5. `test(screenshots): cover the review bar of a document`
6. `docs: describe the review bar, the confirm of an answer, and the rule that a key never stands alone`

The `index.ts` of `shared/lib/text` changes in commit 1 of S2b.1, those of the `workflow`, `artifact` and `review` entities in commits 2, 4 and 5; the one of `review/features/answer` in commit 8 (`ConfirmAnswerDialog`, `useSentAnswer`). The plan, the wireframe and the prompt stay on `frontend-plan`.

Checks, one at a time, for each PR: ESLint and Prettier on the changed files; Vitest on the touched folders (`workflow/entities`, `artifact`, `review`, `activity/widgets`, then `documents`); typecheck once (props, routes, slices). No full suite, E2E, screenshots or build locally. Then `grep -nP '[^\x00-\x7F]'` on the diff, a search for `console.log`, and the grep that answers nothing when the widgets hold no rule:

```sh
git diff --name-only | grep -E 'widgets/(review-bar|chat)' | xargs grep -nE 'approves|requires_feedback|review_status|edgesFrom|editAccessOf|useCommands'
```

## 17. Checklist

- [ ] A1 to A10 confirmed or changed by the user, and written in `docs/ui/usability.md` on `frontend-plan` before S2b.1
- [x] A10 answered (2026-11-07) and committed in `docs/API.md` on `docs/fe/review-edited-items` (S2b.D)
- [ ] S2b.D pushed, opened and merged (the user); the server repository follows it
- [ ] The answers of the S2a plan (D1 to D11, A1 to A25) written in `docs/ui/usability.md`, as the S2a checklist asks
- [ ] S2a merged; this plan checked again against `main`: the paths of sections 7 and 8, `AnswerReviewForm`, `useAnswerReview`, `useEditedItems`, `useDocumentsUnderReview`, `ProgressSection`, `ActivityDialogs`
- [ ] Each commit of section 16 checked alone
- [ ] Each row of section 10 checked once in `pnpm dev:mock` (one dev server, one page at a time, stopped after): the outcome lines, both dialogs, Cancel and Confirm, the draft across pages, the lock while editing, the bar closed and open, `J` and `K`, the sent line and its focus, the error, Open review
- [ ] The plan of the review of one item written before its PR (section 15)
- [ ] Each PR opened as a draft, its description written from this plan; the endpoints it lists checked against the `*.api.ts` functions that the hooks call
