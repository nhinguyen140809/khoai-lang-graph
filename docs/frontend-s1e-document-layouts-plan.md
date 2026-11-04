# Frontend S1e: an interview as a conversation of its participants, and the personas as profiles

The plan of S1e of the [Frontend implementation plan](frontend-implementation-plan.md), a part of the screen Documents that comes after [S1b](frontend-s1b-edit-artifacts-plan.md) and before [S1c](frontend-s1c-item-peek-plan.md) and [S1d](frontend-s1d-export-plan.md). Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md), checked against `main` at `3d87b5e` (#60) and against the S1b stack, which is not merged yet: `feat/fe/edit-artifacts` at `0c72c6f` (S1b.2), on `feat/fe/edit-entities` at `661a489` (S1b.1) and `chore/fe/maintenance-before-edit` at `c31b0be` (S1b.0). S1e changes files that S1b adds or rewrites (`ContentValueControl.tsx` and its table of controls, the marks of a transcript, the slots and the anchors of the document view, the item page), so every path and name below is the one of `0c72c6f`. Once S1b.2 merges, the plan is checked again against `main`. When the code differs from what this plan says (a name, a path, a signature), the agent stops and reports the difference instead of choosing.

The layouts were drawn as a [wireframe](ui/wireframes/s1e-document-layouts.html) and chosen by the user on 2026-11-04 and 2026-11-05. The wireframe is a sketch and stays as it was chosen: section 1.2 lists what it does not draw and where its design is changed by this plan, and decision 2 says how to build from it.

Short paths: `documents/...`, `artifact/...`, `workflow/...`, `trace/...` are under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`; `tests/screenshots/...` is `frontend/tests/screenshots/...`.

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

S1e is one PR (answer A5): the schema docs first, then the tones of the avatar, the reading rules and the views of `workflow`, then the layouts of `artifact` with the mock that serves them, then the pages, then the screenshots and the docs.

| PR | Branch | Title | Based on |
|---|---|---|---|
| S1e | `feat/fe/document-layouts` | `feat(frontend): lay out an interview as a conversation of its participants and the personas as profiles, from their schemas` | `main`, once S1b.2 is merged |

| | |
|---|---|
| Needs | S1b merged (S1b.0, S1b.1, S1b.2): the table `widgetControls` of `ContentValueControl` and the read only fields of `ContentFieldInput` (S1b.1), the keyword `x-ui-role-field` and `extensionFieldText` (`820654c`, `a8aa5b9`), the marks of a transcript (`messageMarks`, `renderMessageMark`), the anchors and `data-target` of the blocks, the slots `actions` and `fieldsView` of `ArtifactDocument`, `RevisionContent`, the item page with `ItemKeyLine` and the link line, `PageLink` with `className` (`df16caa`) |
| After it | S1c (peek): `renderItemKey` also draws the key on an avatar card, and its peek no longer shows `ItemOrigin` (section 15); the S1c plan is checked again once S1e merges. S1d (export): the Export button in the `actions` slot, unchanged by S1e |
| Docs-first | The schemas change in `docs/schemas/` and `docs/DATA_SHAPE.md` in the first commit, docs only (decision 5); the server repository follows them. The answers A1 to A26 and the answer of D1 go to `docs/ui/usability.md` on `frontend-plan` before commit 4, which shows the screens |

Answers of the user (2026-11-04 and 2026-11-05), each built by the decision named:

| # | Question | Answer | Built by |
|---|---|---|---|
| A1 | How an interview reads | The display `transcript` itself becomes a conversation; no second display beside it. Where each field of the interview goes comes from its widget and the layout of the artifact, not from fixed names in the code | Decisions 15 to 18 |
| A2 | How a persona reads | In its document, one avatar card per persona; its own page as a profile. Both from one new display value, `profile` (answer A24) | Decisions 7, 20, 21 |
| A3 | Layouts of a whole document | Built now: an artifact kind may name a display other than `document` | Decisions 7, 13, 17 |
| A4 | Names of widgets and displays | A name says how the thing looks, as the name of a component does, never the domain: `separator`, `avatar-list`, `badge`, `profile`; not `status`, `count` or "persona card" | Decisions 7, 8 |
| A5 | Scope | One PR | Section 16 |
| A6 | How the messages look | Wireframe option A: two sides, an avatar for each participant, several messages in a row from one participant, any number of participants | Decisions 14, 18 |
| A7 | Turns | Shown inside the transcript only, as separators "Turn 2"; nowhere else (not on a card, a peek, a link) | Decisions 8, 15 |
| A8 | Badges | A soft fill and no dot, in any badge | Decision 8 |
| A9 | Colors of the participants | Tones of the design system by place in the list, fixed in the code; never a tone of a status (`success`, `warning`, `destructive`), which reads as an error or a state | Decision 10 |
| A10 | The number of turns | No new field: the API already sends `turn_count`. It is not shown at the end of the conversation, whose separators already show the turns | Decision 17 |
| A11 | Who speaks | A field `participants` of the transcript, shown, each participant reaching its own page; the API gives the link | Decisions 5, 8, 14, 17, 19 |
| A12 | Version of the schemas | Version 1 is edited in place | Decision 5 |
| A13 | "Why this item exists" | Dropped from the item page on purpose; the link line under the title of an item replaces it | Section 2.1 |
| A14 | Status and stop reason of an interview | Widget `separator`: drawn as separators after the last message. A field that the server adds later with this widget becomes a separator too; no summary row | Decisions 8, 15, 17 |
| A15 | The line under the title (`summary` of the artifact) | Kept: it is a field of the API, "shown at the top of the artifact"; the mock gives it a text that the page does not show elsewhere | Section 12 |
| A16 | Speaker and sides | A message names its speaker (`speaker`, the key of a participant) in place of `role`; the participants who share the role of the first participant (the one who leads) sit at the right, the others at the left | Decisions 5, 14 |
| A17 | Where the link of a participant comes from | `item_id` in each entry of `participants`, set by the server, null for an agent; the one exception to "Plain values only" of the content schemas | Decision 5 |
| A18 | `turn_count` | Shown in the list of the fields at the top of the transcript, titled "Turns" ("Turn count" does not read as natural language) | Decisions 5, 17 |
| A19 | The interview status of a persona | Widget `badge`: a real `Badge` wherever the field shows, its tone fixed in the code beside its label | Decisions 8, 9 |
| A20 | Separators at one place | Share one separator, their values side by side: "Completed   Stopping condition reached" | Decisions 11, 15 |
| A21 | The name above a row of messages | Plain text; the participants are reached from the list at the top only | Decision 18 |
| A22 | How the participants show at the top | An avatar list: each participant a ghost button with its avatar and its name, no underline, the text in the primary color on hover; a participant without a page is the same avatar and name, not a button | Decision 8 |
| A23 | The fill of an avatar | The soft fill of a tone. `Avatar` gains the tones and fills that `Badge` and `Button` take, the same way they take them | Decisions 6, 10 |
| A24 | The page of a persona | Not a new keyword: one new value of `x-ui-display`, `profile`. In a document it draws an avatar card for each item (wireframe B); on the page of one item, the whole page as a profile (wireframe A) | Decisions 7, 20, 21 |
| A25 | How to build from the wireframe | Reuse the components that exist; change the classes inside a component as little as possible; the wireframe is a sketch, not a spec of each class; use the design system of the app, no new color and nothing drawn by hand. The wireframe is not changed: what it lacks and what changes in its design are notes for the build (section 1.2) | Decision 2 |
| A26 | One display or two for a persona | One value, `x-ui-display: profile` (each kind has one display): in a document it draws an avatar card per item, on the page of one item the whole page as a profile. The avatar card is the look of a `profile` item in a document, not a widget; the widgets are for fields (`avatar-list` is the one for people). Chosen over two keywords, over `avatar-cards` alone, and over a display on the artifact | Decisions 7, 20, 21 |

Question for the user. It has the proposal that this plan builds; the user confirms or changes it before commit 4:

| # | Question | Proposal built here |
|---|---|---|
| D1 | The tones of the participants | The design system has three tones that are not statuses: `primary`, `chart`, `neutral`. The first participant (who leads) takes `primary`; the others alternate `chart` and `neutral`, so in a group of four, two interviewees share a tone and their names tell them apart |

### 1.1 Sketches

A group interview (the data allows it; version 1 of the workflow writes two participants). `(I)` is an avatar with the initials of a participant; `[ ... ]` marks the words that an item quotes. The participants with a page are ghost buttons.

```text
Group interview on bookings                                            [ Edit ]
Approved
The admin and the mentor disagree on who approves a booking; the student only
asks for an answer within the day.
-----------------------------------------------------------------------------
Participants   (I) Interviewer   (MS) Minh, third-year computer science student
               (M) Mentor   (A) Admin
Turns          2
-----------------------------------------------------------------------------
 -------------------------------- Turn 1 --------------------------------
                                                          Interviewer  (I)
                                  +----------------------------------+
                                  | Who should approve a booking?    |
                                  +----------------------------------+
 (A)  Admin
      +------------------------------------+
      | I do, at least in the first year.  |
      +------------------------------------+
 (M)  Mentor
      +------------------------------------------+
      | I would rather approve my own sessions.  |
      +------------------------------------------+
      +------------------------------------------+
      | Students book hours that I cannot do.    |
      +------------------------------------------+
 (MS) Minh, third-year computer science student
      +--------------------------------------------------+
      | I do not want to [wait two days for an answer].  |
      +--------------------------------------------------+
 -------------------------------- Turn 2 --------------------------------
 ...
 -------------------- Completed   Turn limit reached --------------------
```

While an interview runs, the last separator reads `----------- In progress -----------` (the stop reason has no value yet).

The personas in their document (display `profile`: one avatar card per item):

```text
Interviewee (3)
+------------------------------------------+  +------------------------------------------+
| (S) Student                              |  | (M) Mentor                               |
|     Student   [Interviewed]              |  |     Mentor   [Interviewed]               |
| Third-year undergraduate who wants       |  | Lecturer who mentors students next to    |
| advice on a research career.             |  | teaching.                                |
| Goals: Find a mentor in my field; Bo...  |  | Goals: Set the hours I am free; Meet ... |
+------------------------------------------+  +------------------------------------------+
```

The page of a persona (display `profile`: the page of one item as a profile):

```text
Interviewees > Student
(S)  Student                                                           [ Edit ]
Approved   PER-001   Student   [Interviewed]
(the link line of S1b)

Background
Third-year undergraduate who wants advice on a research career.
Expertise
Knows the courses of the faculty, not the people behind them.
Goals                                  Interests
- Find a mentor in my field            - Research
- Book a session in a few minutes      - Internships
Constraints                            Priorities
- Free only between classes            - Speed
                                       - Trust in the mentor
Concerns
- Not knowing who is free this week
Behavioral tendencies
Gives up when a task takes more than a few steps.
```

### 1.2 Notes on the wireframe for the build

`docs/ui/wireframes/s1e-document-layouts.html` (open it in a browser; the bar at its top switches the screen, the option, the sample of data and the state). It shows the transcript (option A chosen), the personas (option B, the cards, and option A, the page of one persona) and the three widgets. It stays as it was chosen; it is a sketch, not the design of every part. Read it with the two tables below; where it differs from this plan, this plan wins.

**What the wireframe does not draw.** Build these from the rows of section 10 and from the components as they are, not from the wireframe:

| Part | Where it is settled |
|---|---|
| The tones and the fills of the avatars as they will be (the wireframe draws solid fills of its own) | Decisions 6 and 10 |
| A participant under the pointer, with the focus, and the target message with its ring | Section 10 |
| The cards of the marks of the quoted words in a bubble, and their keys | S1b, unchanged |
| The history of a transcript (the version in place of the list of the fields) and its edit form (the read only fields) | Decisions 17 and 23 |
| The link line, the history surface and the navigator of the page of a persona | S1b, unchanged |
| The dark theme | The tokens of the app; nothing of its own |
| The empty, loading and error states beyond the rough ones of its bar | S1a and section 11 |
| The tab icons of the display `profile` | Decision 7 |
| The real width of the page beside the side panel, and the narrow window beyond the frame of 375 px of its bar | The page of S1a, unchanged |

**What changes in the design of the wireframe.**

| In the wireframe | In the build |
|---|---|
| The participants at the top are links in the primary color, underlined on hover | An avatar list of ghost buttons, each its avatar and its name, the text of the page color, primary on hover, no underline (A22, decision 8) |
| The avatars have solid fills, among them accent and muted | The soft fill of a tone of the design system: `primary`, `chart`, `neutral` (A23, D1) |
| The cards and the page of a persona are named `avatar-cards` and "page display: profile", two keywords | One display value, `profile`: its avatar cards in a document, its profile on the page of one item (A24) |
| The field `turn_count` is titled "Turn count" | "Turns" (A18) |
| The class strings, the colors, the sizes and the spacing of each block | Not a spec: the components of the design system with their props (decision 2) |
| The bar at the top, the frame of reasons and the numbers of the blocks | Chrome of the wireframe, not part of the app |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| The wireframe and the five rounds of answers (2026-11-04, 2026-11-05) | A1 to A26 and the question D1 |
| `docs/ui/usability.md` (`frontend-plan`) 5.3, 5.4, 7.4, 8.1, 8.3, 9 | A message has no page and is read in the transcript, where quoted words are marked; the item page of a persona with its 11 fields and five lists; body text of a document at 16 px; the user words "Interviewer", "Interviewee"; the document is the page |
| `docs/DATA_SHAPE.md` Artifact, InterviewTranscript and InterviewMessage | `summary`: "Short overview written by the agent, shown at the top of the artifact"; `subject_item_id` names the persona outside the content; the transcript has `status`, `turn_count`, `stop_reason`; a message has `turn`, `role` (`interviewer`, `persona`), `content`, `iteration`, `topic`; "One transcript per persona per project" |
| `docs/schemas/README.md`, `content-schema.meta.schema.json` | The display keywords and their exact set; the rule `x-level: artifact` forces `x-ui-display: document`; `x-ui-role-field` is in the meta schema (`820654c`) but not in the table of the README; a title or a display keyword is edited in place; "Plain values only: no field holds the id or key of another item" |
| `docs/schemas/artifacts/interview_transcript.v1.json`, `items/interview_message.v1.json`, `items/persona.v1.json` | The read only fields of an interview, whose `status` and `stop_reason` are fixed `enum`s of the file; the list fields of a message; a persona with 11 fields, five of them lists |
| `docs/workflow/prompts/analyst.v1.md` | The analyst reads a transcript as lines `<key> <role>: <content>`; the server builds the line, so it reads the role of a speaker from the participants once `speaker` replaces `role` |
| `docs/architecture/web-app.md` 6, 8, 9 (`0c72c6f`) | The table of the displays; "A registry maps the kind to the component", which the code never built; the files row names files that do not exist |
| `frontend/CONTRIBUTING.md` | One exported component per file, small parts stay in their file; a hook never sits in a component file; no class value in brackets outside `shared/components/ui/`; a constants file exports no type |
| `artifact/entities/components/*`, `outline/*` (`0c72c6f`) | Three renderers in `DocumentBlocks.tsx` (280 lines); the speaker of a message as the raw value of its role field; the fields of every artifact drawn as `h2` sections before the blocks; a group heading per kind ("Interview message (8)"); `ArtifactItemDetails.tsx` exports `ItemKeyLine` too |
| `workflow/entities/content/*`, `components/*` | Three exhaustive tables by widget; the labels of values by field path; `contentDisplayOf`, `documentDisplaysByKind`, `summaryFields` |
| `documents/widgets/document/components/DocumentPage.tsx`, `item/components/ItemPage.tsx`, `item/hooks/useItemPage.ts`, `documents/entities/utils/document-tab-icons.utils.ts` | The document page gives `renderItemLink` (a `PageLink` to `project.item(id)`); the item page draws its `h1`, Edit, `ItemKeyLine`, the link line and `ArtifactItemDetails`; `useItemPage` gives the schema and the place of the item in the outline (`neighbors.index`); the tab icon of an item page already reads the display of its kind |
| `shared/components/ui/avatar.tsx`, `badge.tsx`, `button.tsx`, `message.tsx`, `bubble.tsx`, `marker.tsx`, `card.tsx`; `shared/lib/tone`; `shared/lib/formatters` | `Avatar` and `AvatarFallback` take no tone; `Badge` and `Button` take `variant` (the fill: `solid`, `soft`, `outline`, `ghost`, `link`) and `color` (the tone) through a `cva` with `toneClasses`; `Button variant="ghost"` with the neutral tone keeps the text color and fills on hover; `Message`, `Bubble` (`muted`, `tinted`), `Marker` (`separator`), `Card`; the tones `neutral`, `primary`, `success`, `warning`, `destructive`, `chart`; `initialsOf`. No badge of the app draws a dot |
| `mocks/artifacts/fixtures/*`, `mocks/runs/fixtures/runs.fixtures.ts`, `mocks/workflow/` | The three interviews of the mentor platform are `completed`, built by `interview()` with the summary `${turnCount} turns with the ...`; the builder resolves `subject_item_id` from `subjectKey`; the library project has a run `running` at `interviewing` and no transcript; the copies of the schemas equal the docs when parsed, but no test compares them |
| `tests/screenshots/projects/documents.spec.ts` | `Document with cards` (the persona catalog), `Document with a transcript` (full page) |
| Skills `feature-sliced-design`, `clean-review`, `ui-ux` | Each rule in the module of its object; a table by value instead of a branch on a name; a wireframe chosen before the build |

### 2.1 S1b as planned and as built, and what S1e takes from it

S1b is not merged; this table compares its plan with `0c72c6f`, for the parts that S1e reads.

| S1b plan | Built (`0c72c6f`) | Rule for S1e |
|---|---|---|
| The fields of a message named by constants (`transcriptRoleField`, `transcriptContentField` of S1a, a `transcriptTurnField`) | The keyword `x-ui-role-field` in the schema and `extensionFieldText` (`820654c`, `a8aa5b9`) | Every layout reads its fields from the schema (decision 3) |
| The speaker of a message as plain text (S1b.0, decision 25) | Plain text, but the raw value of the role (`persona`, `interviewer`) | S1e draws the name of the participant (decision 18) |
| The marks of a transcript in `LinkedItemsPopover`; a failure shows a line with Try again | `QuotedWordsPopover`; a failure shows a toast | S1e keeps `messageMarks` and `renderMessageMark` as they are |
| `ItemOrigin`, "Why this item exists" (decision 16) | Dropped on purpose (answer A13): the link line under the title replaces it. `mocks/README.md` still lists "A transcript at a message: open REQ-001, scroll to Why this item exists" | S1e does not read it; the stale row is for S1b to fix; the S1c plan, whose peek shows `ItemOrigin`, follows it |
| Under a version of a document, the line "The items below are as they are now; each item has its own history." | `revisionMessages.itemsAsNow` defined and drawn nowhere | Reported for S1b |
| A docs PR of its own for a change of the API (S1b.D) | `x-ui-role-field` went in a commit of S1b.1 with its mock copy (`820654c`) | S1e puts the schema docs in its first commit (decision 5) |

## 3. Decisions

The behavior on the screen of each component is in section 10; a decision that sets a behavior points to its row there.

### Placement and how to build

1. **What goes where.** Each piece sits in the module of its object, at the lowest layer that may hold it. `artifact` may import only `workflow` (`moduleImports`), and does so through `workflow/entities/@x/artifact.ts`.

   | Piece | Where | Why |
   |---|---|---|
   | The tones and fills of an avatar (`variant` and `color` of `AvatarFallback`) | `shared/components/ui/avatar.tsx` | No product object; as `Badge` and `Button` take them |
   | The displays by level (`artifactDisplays`, `profile`), `artifactDisplayOf`, `documentDisplaysByKind`; the widgets `separator`, `avatar-list`, `badge`; `extensionField`, `isOneLineField`, `profileFields` | `workflow/entities/content/fields/` | Reading rules of a content schema |
   | `hasListValue`; the value rules of the three widgets; `ValueDefinition` | `workflow/entities/content/values/` | Rules and types of the values |
   | The tone of a value of a badge (`valueTonesByField`, `valueTone`); the tone of a person by place (`personTone`) | `workflow/entities/content/value-labels/` | Looks of values, beside their labels |
   | The read views and controls of the three widgets; `PersonAvatar`; `FieldSeparator`; `InlineFieldValues` | `workflow/entities/components/` | The view of a value is `workflow`'s; the widget `avatar-list` draws avatars, so the avatar of a person sits here too |
   | The display and the participants of a document in its data; the blocks of a transcript; the parts of a conversation (`transcriptParts`); the participants (`transcriptParticipants`); the anchor props (`itemAnchorProps`) | `artifact/entities/outline/` | Reading rules of the outline and the content of an artifact |
   | The layouts of a document page, the conversation, the avatar cards, the heading and the body of a profile page | `artifact/entities/components/` | The views of a document and of an item without actions |
   | The address of a participant; the page of a persona | `documents/widgets/document`, `documents/widgets/item` | The widgets know the addresses and place the views |
   | The tab icons of the display `profile` | `documents/widgets/panel/documents-frame.config.tsx` | Where the icons of every display are |
   | The copies of the schemas, the test that compares them with the docs, the participants and speakers of the interviews, the interview in progress of the library project, the summaries | `mocks/workflow/`, `mocks/artifacts/` | The mock serves the schemas and the documents |

2. **The wireframe is a sketch; build with the design system** (answer A25). The wireframe gives the layout: what shows, in which order, on which side, in which component. It does not give the classes, and it does not draw every part (section 1.2):
   - reuse the components of `shared/components/ui` and their props (`variant`, `color`, `size`, `align`) before any class; the classes that this plan names are the few that place the parts (a grid, a gap, a width, a line clamp), and a block that a component already spaces gets none;
   - change the classes inside a shared component only where this plan says so (the tones of `AvatarFallback`, decision 6), never to match a pixel of the wireframe;
   - no new color, no new token, no hand-drawn shape: every color is a tone or a token of the design system, read through the props of the components;
   - where the wireframe and this plan differ (section 1.2), this plan wins; where neither says, follow the component as it is.

3. **No layout reads a field or a kind by its name, and no code branches on a value of the schema.** Every layout reads the schema of its kind: `x-ui-display`, `x-ui-title-field`, `x-ui-role-field`, `x-ui-participants-field`, `x-ui-list-fields`, `x-ui-field-order` and `x-ui-widget`. Where a field goes is decided by its widget and the layout: a `separator` field marks a place of the conversation, every other field of a transcript shows in its list at the top. The new components and rules hold no field name (`turn`, `speaker`, `turn_count`, `status`, `name`, `goals`, ...) and no kind name. What is written by field path is the table of tones (`valueTonesByField`), as `valueLabelsByField` already does; what the widgets read by name is the shape of an entry of `avatar-list` (`name`, `item_id`) and of a participant (`key`, `role`), which the README fixes. Section 16 has the grep that checks it.

   Every value that a schema can name is looked up in a table keyed by that value, `as const satisfies Record<Value, ...>`, never tested with `if (display === 'profile')`, a `switch` or a default branch. A new value then fails to compile until each table that it keys has its row, and a value never falls silently to the look of another. The tables:

   | Value | Table | Where | Rows |
   |---|---|---|---|
   | `x-ui-widget` | `widgetValueViews` (read), `widgetControls` (edit), `widgetValueRules` (check) | `workflow/entities/components/`, `content/values/` (exist) | One per widget |
   | `x-ui-display` of an artifact | `artifactLayouts` | `artifact/entities/components/ArtifactDocument.tsx` | `document`, `transcript` |
   | `x-ui-display` of an artifact, for the headings of the groups of items | `groupHeadings` | `artifact/entities/outline/document-blocks.utils.ts` | `document`: true; `transcript`: false |
   | `x-ui-display` of an item, for a run of items in a document | `itemRunViews` | `artifact/entities/components/DocumentBlocks.tsx` (in place of its chain of `if`) | `table`, `cards`, `transcript`, `profile`; `heading` is drawn as the heading of a section, before the runs |
   | `x-ui-display` of an item, for the page of one item | `itemPageLayouts`: the display gives a page layout, `ItemPageLayout` | `workflow/entities/content/fields/content-fields.types.ts` | `profile` gives `profile`; `heading`, `table`, `cards`, `transcript` give `fields` |
   | The page layout of an item | `headingAvatars` (`ItemHeading.tsx`), `keyLineFields` and `detailBodies` (`ArtifactItemDetails.tsx`) | `artifact/entities/components/` | `fields`, `profile` |
   | `x-ui-display`, for the tab icons | `documentTabIcons` | `documents/widgets/panel/documents-frame.config.tsx` (exists) | One per display, for a document and for an item |
   | A value of a fixed enum | `valueLabelsByField` (exists), `valueTonesByField` | `workflow/entities/content/value-labels/` | By field path |

   What a widget means for a rule is a predicate written once in `content-fields.utils.ts`, reading a list of widgets: `isOneLineField` (`oneLineWidgets`), `isSeparatorField` (the widget `separator`). The rules and the components call the predicates and never compare a widget themselves.

   So a new display, widget or page layout is: its value in the meta schema and the README (docs first), in its list of values (`contentDisplays`, `itemDisplays`, `artifactDisplays`, `fieldWidgets`, `ItemPageLayout`), then a row in each table that the compiler reports, with its test data; no other file changes. The `transcript` of an artifact and the participants follow the same rule: what a field does in a conversation comes from its widget (`separator`, `avatar-list`), not from its name.

4. **Nothing else moves.** No new topic, no new module import, no new store, query, endpoint or scenario. `workflow/entities/@x/artifact.ts` gains `artifactDisplayOf`, `pageLayoutOf`, `extensionField`, `profileFields`, `isOneLineField`, `isSeparatorField`, `hasListValue`, `personTone`, `PersonAvatar`, `FieldSeparator`, `InlineFieldValues` and the types `ArtifactDisplay`, `ItemDisplay`, `ItemPageLayout`, `ProfileFields`, `ValueDefinition`; `workflow/entities/index.ts` does not change. `artifact/entities/index.ts` gains `ItemHeading` and `RenderItemIdLink`, and moves `RenderItemLink` to its new file.

### Schemas (docs)

5. **The schemas change in version 1, in place, in the first commit** (answers A12, A17, A18). No content is stored outside the mock yet. The first commit changes `docs/schemas/` and `docs/DATA_SHAPE.md` only; the mock copies follow in commit 4 with the code that reads them. There is no docs PR of its own (answer A5; S1b did the same for `x-ui-role-field`, `820654c`). The server repository follows the files, its models, and the line of the analyst prompt (the role of a speaker read from the participants). The exact changes are in section 8.
   - `interview_transcript`: `x-ui-display: transcript`; a new keyword `x-ui-participants-field: participants`; a new read only field `participants` (widget `avatar-list`), a list of objects `{ key, name, role, item_id }`, the one who leads first; `turn_count` titled "Turns"; `status` and `stop_reason` take the widget `separator`; `x-ui-field-order: [participants, turn_count, status, stop_reason]`.
   - `interview_message`: `role` gives way to `speaker`, the key of a participant of its transcript; `x-ui-role-field: speaker`; `turn` takes the widget `separator`; `x-ui-list-fields: [turn, speaker, content]`.
   - `persona`: `x-ui-display: profile`; `x-ui-list-fields: [name, stakeholder_type, interview_status, background, goals]`; `interview_status` takes the widget `badge`.
   - The meta schema: the displays by level, the three widgets and their conditions, the keyword `x-ui-participants-field`. The README: "Plain values only" names `item_id` of a participant as its one exception.

### The avatar (`shared`)

6. **`AvatarFallback` takes a tone and a fill** (answer A23), as `Badge` and `Button` do: a `cva` with `variant` (`soft`, `solid`) and `color` (`toneClasses`), and `data-variant` and `data-color` on the element. `soft` is `bg-(--tone-soft) text-(--tone-strong)`, `solid` is `bg-(--tone) text-(--tone-foreground)`. Without `variant` and `color` the fallback looks as today (`bg-muted text-muted-foreground`); with a `color` and no `variant` it is `soft`. Nothing else of `avatar.tsx` changes. A test of the component and the avatars of the chat card of the design system page, in soft tones, show it.

### Displays (`workflow`)

7. **The displays** (answers A2, A3, A4, A24).
   - `contentDisplays`: `document`, `heading`, `table`, `cards`, `transcript`, `profile`. `artifactDisplays = ['document', 'transcript']` with the type `ArtifactDisplay`, and `itemDisplays = ['heading', 'table', 'cards', 'transcript', 'profile']` with the type `ItemDisplay`. `artifactDisplayOf(schema)`: the named display when it is one of `artifactDisplays`, else `document`; `contentDisplayOf(schema)` uses it for an artifact, and does as today for an item.
   - `profile` (item kinds): the items are people. In a document, one avatar card per item (decision 20); on the page of one item, the whole page as a profile (decision 21). The page of one item takes its layout from the row of its display in `itemPageLayouts`, through `pageLayoutOf(schema)` (decision 3): `profile` gives the page layout `profile`, every other display `fields`, the page of today; there is no keyword for a page. `cards` stays for the other kinds and keeps its code and tests, with no kind of version 1 using it.
   - `documentDisplaysByKind` gives the layout of the artifact kind when it is not `document`, else the rule of today: `interview_transcript` gives `transcript`, `persona_catalog` gives `profile`. The tab icons get `documents.document.profile` (`UsersIcon`) and `documents.item.profile` (`UserRoundIcon`).

### Widgets (`workflow`)

8. **Three widgets, each named after how it looks** (answers A4, A7, A8, A14, A19, A22). Each gets its row in the three tables by widget:

   | Widget | What it is | Read (`widgetValueViews`) | Edit (`widgetControls`) | Value rule (`widgetValueRules`) |
   |---|---|---|---|---|
   | `separator` | A value that marks a place of a sequence, such as the turn of a message or how an interview ended. In a transcript, drawn as a separator (decision 15); elsewhere as its value | A choice reads as the label of its value, any other value as text | By its type: `SelectControl` for a choice (`enum`, `x-value-list`, `x-value-from`), `NumberControl` for a number, else `TextControl` | By its type, as `select`, `number` or `text` |
   | `avatar-list` | A list of people: each entry an avatar and its `name`; an entry with an `item_id` reaches the page of that item | `AvatarListValue`: the people in a row that wraps (`flex flex-wrap gap-1`). An entry with an `item_id`, when the caller gives `renderItemIdLink`: `Button asChild variant="ghost" size="sm"` with `hover:text-primary` around `renderItemIdLink(itemId, <>{avatar}{name}</>)`, so the button is a link with no underline. Any other entry: the same avatar and name in a `span` with the spacing of the button (`inline-flex items-center gap-1 px-2.5 text-sm`). The avatar is `PersonAvatar` (`size="sm"`, `personTone(place)`) | `EntriesOf`, as `object-list` | As `object-list` |
   | `badge` | A choice shown as a `Badge` wherever it shows | `Badge variant="soft" color={valueTone(path, value)}` with the label of the value; no dot | `SelectControl` | As `select` |

   `ContentFieldValue` gains the optional prop `renderItemIdLink?: (itemId: string, children: ReactNode) => ReactNode`, passed to `AvatarListValue`; it must return one element that takes `className` (a `PageLink`), since `Button asChild` gives it its classes. `fieldWidgetOf` does not change. The meta schema requires `enum` or `x-value-list` on a `badge`, and `type: array` on an `avatar-list`.

9. **The tone of a badge value is in the code, by field path** (answer A19): `valueTonesByField` (`content/value-labels/value-tones.constants.ts`), beside `valueLabelsByField`, for the values of a fixed enum of the schema files. Row: `persona.interview_status` (`not_started` `neutral`, `in_progress` `primary`, `completed` `success`). `valueTone(path, value)` gives `neutral` for a value without a row.

10. **The tone of a person by place** (answers A9, A23, D1): `personTone(place)` of `value-labels.utils.ts` gives `primary` for place 0, then `chart` and `neutral` in turn from place 1. No tone of a status. `PersonAvatar({ name, tone, size })` (`components/PersonAvatar.tsx`): `Avatar` with `size`, and `AvatarFallback variant="soft" color={tone}` holding `initialsOf(name)`; `aria-hidden`, since the name is beside it.

11. **`FieldSeparator` and `InlineFieldValues`** (`workflow/entities/components/`):
    - `FieldSeparator({ fields, content, definition })`: a `Marker` with `variant="separator"` holding, in field order, the text of each filled field: a number reads as its title and its value ("Turn 2"), a choice as the label of its value ("Completed"), a text as itself; nothing when no field is filled (answer A20).
    - `InlineFieldValues` draws the filled fields of a content as values, one `span` each, in their order, each after its title in a `sr-only` span. The caller gives the line: the line under the name of an avatar card, the key line of a profile page.

12. **What reads on one line, what marks a place, and what a person shows.** `isOneLineField(field)`: its widget is one of `oneLineWidgets` (`text`, `select`, `badge`, `number`, `boolean`, `separator`). `isSeparatorField(field)`: its widget is `separator`. `profileFields(schema)` gives, for the views of the display `profile`:
    - `title`: the field of `x-ui-title-field`;
    - `line`: the other fields of `summaryFields` that read on one line (persona: stakeholder type, interview status);
    - `card`: the other fields of `summaryFields` (persona: background, goals);
    - `body`: every field apart from `title` and `line`, in field order.

### Layouts (`artifact`)

13. **The data of a document holds its layout and its participants.** `ArtifactDocumentData` gains `display: ArtifactDisplay` and `participants: Participant[]`. `useArtifactDocument` reads both from the schema and the content of the artifact (`artifactDisplayOf`, `transcriptParticipants`), and stays `pending` while that schema is pending, so that a transcript never shows first as a document. When the schema fails, the document draws as a `document` with no fields and no participants, as today. The blocks come from `documentBlocks(outline, { artifactDisplay: display })`.

14. **The participants** (answers A11, A16). `transcriptParticipants(schema, content)` of `outline/transcript.utils.ts` reads the list that `x-ui-participants-field` names; each entry gives `key`, `name`, `role` and `item_id`. Each participant gets `side`: `end` when its role is the role of the first participant (the one who leads), `start` otherwise; and `tone`: `personTone(place)`, the place of the entry in the list, so that a participant has the same tone at the top and in the conversation. A schema without the keyword, or an empty list, gives no participant.

15. **The parts of a conversation** (answers A7, A14, A20). `transcriptParts(schema, items, participants)` of `outline/transcript.utils.ts` gives, in order:
    - a `separator` before the first message and wherever the value of a field of the message kind that `isSeparatorField` accepts changes from the message before (for a message: `turn`), holding the fields whose value changed and the content of the message; fields that change at the same message share one part;
    - a `run` for each row of messages of one speaker with no separator between them, holding the participant and each message with its text (the field of `x-ui-title-field`).
    A speaker without an entry in the participants gets one: its key as its name, `start`, `neutral`.

16. **A transcript reads as one conversation.** `documentBlocks(input, { artifactDisplay })` adds the group heading of a run of items when `groupHeadings[artifactDisplay]` is true (decision 3): `document` has them, a `transcript` has none ("Interview message (8)" leaves the page).

17. **`ArtifactDocument` lays out by the display of the artifact** (answers A1, A10, A14, A18). The header stays the same for every layout: the title with `actions`, the status line, the summary. After it, a local table by display, `artifactLayouts` (`Record<ArtifactDisplay, ...>`), places the parts, so that a display without a row fails to compile:

    | Display | After the header | While the history shows a version (`fieldsView`) |
    |---|---|---|
    | `document` | The fields as sections (`h2` and value), then the blocks, as today | `fieldsView` in place of the fields, above the blocks |
    | `transcript` | The fields that `isSeparatorField` does not accept, as a list (`TranscriptFields`): a `dl` between two rules, each row its title (`dt`, `text-sm font-semibold text-muted-foreground`, a fixed width) and its value (`ContentFieldValue` with `renderItemIdLink`): "Participants", then "Turns"; then the blocks (the conversation); then `FieldSeparator` of the fields that `isSeparatorField` accepts, after the last message | `fieldsView` in place of the list; no separator after the last message |

    `ArtifactDocument` gains the prop `renderItemIdLink`, given by the document page. The empty state ("This document has no content yet.") stays.

18. **`ItemTranscript` draws the parts** (answers A6, A21; row in section 10). An `ol` in `max-w-prose`, `space-y-4`:
    - a separator: a `li` with `FieldSeparator` (`text-xs`) of the fields of the part;
    - a run: a `li` with `Message` `align` = the side of its participant; `PersonAvatar` of the participant; `MessageContent` with `MessageHeader` (the name, as text) and one `Bubble` per message: `variant="tinted"` on the side `end`, `variant="muted"` on the side `start`; each `BubbleContent` carries `itemAnchorProps`, `whitespace-pre-line text-base text-pretty`, `data-[target]:ring-2 data-[target]:ring-ring`, and the marks as today (`Highlight` with `renderMessageMark`).

### Profiles and links (`artifact`, `documents`)

19. **The address of an item by its id.** `RenderItemIdLink = (itemId: string, children: ReactNode) => ReactNode` (`outline/outline.types.ts`): the document page gives `(itemId, children) => <PageLink href={project.item(itemId)}>{children}</PageLink>`, as it gives `renderItemLink`; `PageLink` takes the classes of the ghost button (decision 8). A participant with an `item_id` is a persona, which has a page; an `item_id` that answers 404 shows the not found state of the item page.

20. **`ItemAvatarCards` draws the display `profile` in a document** (answers A2, A8; row in section 10). A grid (`grid gap-3 sm:grid-cols-2`) of `Card size="sm"`, each with `itemAnchorProps` and `data-[target]:bg-accent/50`:
    - `CardHeader`: `PersonAvatar` (`personTone(place + 1)`, place among the items of the run) beside an `h3` holding `renderItemLink(item, itemTitle(view.schema, item))`, and under it `InlineFieldValues` of `line` in `CardDescription`;
    - `CardContent`: each filled field of `card`: a text on at most two lines (`line-clamp-2`); a list on one line (`line-clamp-1`), its title in `font-semibold text-muted-foreground` and its entries joined by "; ".

21. **The display `profile` on the page of one item** (answers A2, A24). Three entity components, used by `ItemPage`, each look their part up by `pageLayoutOf(schema)` in a table keyed by `ItemPageLayout` (decision 3):
    - `ItemHeading({ item, schema, title, place })`: the `h1` of the page, after `PersonAvatar` (`size="lg"`, `personTone(place)`) when `headingAvatars[layout]` is true (`profile`). `ItemPage` gives `place` = `neighbors.index` of `useItemPage` (the place in the outline, from 1), so the avatar of a persona has the tone of its card;
    - `ItemKeyLine` gains `schema`: after the key, `InlineFieldValues` of `keyLineFields[layout](schema)` (`fields`: none; `profile`: `profileFields(schema).line`);
    - `ArtifactItemDetails`: the body that `detailBodies[layout]` names: `fields`, the list of today; `profile`, the fields of `body` in a grid (`grid gap-6 sm:grid-cols-2`), a list in one column and any other field across both (a local `ProfileField` with `data-wide` and `sm:data-wide:col-span-2`); the marks of the fields stay in both.

22. **The files of the document views.** `DocumentBlocks.tsx` keeps the headings, `ItemsTable` and `ItemCards`, and draws each run of items through `itemRunViews` (decision 3) in place of its chain of `if`, with the new row `profile`. `ItemTranscript` leaves it for `ItemTranscript.tsx`; `ItemAvatarCards.tsx` and `ItemHeading.tsx` are new. The local `anchorProps` becomes `itemAnchorProps` of `outline/outline.utils.ts`; `RenderItemLink` moves to `outline/outline.types.ts` beside `RenderItemIdLink`. No existing file moves: the S1c and S1d plans name `ArtifactDocument.tsx`, `DocumentBlocks.tsx` and `ArtifactItemDetails.tsx` at their paths.

23. **Edit and history keep their behavior.** The edit form of a transcript shows its fields read only: the participants as an avatar list, "4", "Completed", "Stopping condition reached". `RevisionContent` draws the fields of a version as sections; on a transcript it takes the place of the list of the fields (decision 17).

### Mock

24. **The mock follows the schemas** (commit 4): the copies of the three schemas; a case in `mocks/workflow/__tests__/artifact-kinds.fixtures.test.ts` that compares every file of `contentSchemaFiles` with its file in `docs/schemas/<artifacts or items>/`; each interview with its participants (the `item_id` of a persona resolved by the builder, as it resolves `subject_item_id`) and its speakers; the interview in progress of the library project; summaries that the page does not show elsewhere (A15). Section 12 has the data.

## 4. Scope

| | |
|---|---|
| Endpoints | None new. The page reads what it reads today |
| Queries | `useArtifact`, `useItemSchema`, `useOutlineItems`, `useArtifactKinds`, `useWorkflowDefinition`, unchanged |
| Written new | The tones and fills of `AvatarFallback`; the widgets `separator`, `avatar-list`, `badge`; the displays `profile` (items) and `transcript` (artifacts); the tones of badge values and of people; `PersonAvatar`, `FieldSeparator`, `InlineFieldValues`, `ItemTranscript` as a conversation, `ItemAvatarCards`, `ItemHeading`, the profile body of `ArtifactItemDetails`; the pure rules `artifactDisplayOf`, `extensionField`, `profileFields`, `isOneLineField`, `hasListValue`, `valueTone`, `personTone`, `transcriptParticipants`, `transcriptParts`, `itemAnchorProps`; the schema changes and their mock |
| Not built | A group interview in the workflow (the data allows several participants; version 1 writes two); a persona with the same tone in all its transcripts; a separator between the rounds of a reworked interview (`iteration` keeps `number`); any other kind moved to a new widget or display; any change of the wireframe |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Widgets | How it looks, as a component of the library is named; never the domain (answer A4) | `separator`, `avatar-list`, `badge` |
| Displays | How it looks | `profile`; `artifactDisplays`, `ArtifactDisplay` |
| Keyword | `x-ui-<what it names>-field`, as `x-ui-title-field` | `x-ui-participants-field` |
| Message field | Who says the words | `speaker` |
| Pure rules | Named after what they give; booleans with `is` or `has` | `artifactDisplayOf`, `pageLayoutOf`, `extensionField`, `profileFields`, `valueTone`, `personTone`, `transcriptParticipants`, `transcriptParts`, `itemAnchorProps`, `isOneLineField`, `isSeparatorField`, `hasListValue` |
| Types | The object and what it is | `ItemDisplay`, `ItemPageLayout`, `ProfileFields`, `Participant`, `TranscriptPart`, `RenderItemIdLink`, `ValueDefinition` (the name of the alias it replaces) |
| Looks | `<subject>ByField`, beside `valueLabelsByField` | `valueTonesByField` in `value-tones.constants.ts` |
| Props of the avatar | As `Badge` and `Button` | `variant`, `color` of `AvatarFallback` |
| Components | `<Object><Block>`, or what it draws | `ItemTranscript` (kept), `ItemAvatarCards`, `ItemHeading`, `PersonAvatar`, `FieldSeparator`, `InlineFieldValues`; `AvatarListValue`, `BadgeValue`, `SeparatorControl` (local) |
| Local components | What they draw | `TranscriptFields`, `DocumentLayout`, `TranscriptLayout`, `FieldSections` (in `ArtifactDocument.tsx`); `FieldList`, `ProfileGrid`, `ProfileField` (in `ArtifactItemDetails.tsx`) |
| Tables by value | What they give, in the plural, keyed by the value (decision 3) | `artifactLayouts`, `groupHeadings`, `itemRunViews`, `itemPageLayouts`, `headingAvatars`, `keyLineFields`, `detailBodies` |
| Option and prop | Named after what they carry | `{ artifactDisplay }` of `documentBlocks`; `renderItemIdLink` |
| Tab icons | `documents.<document or item>.<display>` | `documents.document.profile`, `documents.item.profile` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `Message`, `MessageContent`, `MessageHeader` | `shared/components/ui/message.tsx` | The sides and the head of a run |
| `Bubble`, `BubbleContent` | `shared/components/ui/bubble.tsx` | The words of a message (`tinted`, `muted`) |
| `Marker`, `MarkerContent` | `shared/components/ui/marker.tsx` | `FieldSeparator` (`variant="separator"`) |
| `Avatar`, `AvatarFallback` | `shared/components/ui/avatar.tsx` | `PersonAvatar`, with the tones of decision 6 |
| `Button` | `shared/components/ui/button.tsx` | A participant that reaches its page (`variant="ghost"`, `size="sm"`, `asChild`) |
| `Badge` | `shared/components/ui/badge.tsx` | The widget `badge` (`variant="soft"`, `color`) |
| `Card`, `CardHeader`, `CardDescription`, `CardContent` | `shared/components/ui/card.tsx` | An avatar card |
| `Highlight` | `shared/components/ui/highlight.tsx` | The marks in a bubble, as today |
| `PageLink` | `shared/components/frame` | The address of a participant and of a card |
| `toneClasses`, `Tone` | `shared/lib/tone` | The tones of `AvatarFallback` |
| `initialsOf` | `shared/lib/formatters` | The initials of an avatar |
| `isSameValue` | `shared/lib/collections` | A separator value that changes |
| `ContentFieldValue`, `useValueLabel`, `contentFields`, `summaryFields`, `itemTitle`, `extensionFieldText`, `fieldText` | `workflow/entities` | Every value and field |

### Extract before new code

| What | Path | Why |
|---|---|---|
| `itemAnchorProps(itemId, targetItemId)` | `artifact/entities/outline/outline.utils.ts`, from `anchorProps` of `DocumentBlocks.tsx` | Three files draw anchored blocks |
| `RenderItemLink` | `artifact/entities/outline/outline.types.ts`, from `DocumentBlocks.tsx` | Two component files read it, and neither imports the other |
| `hasListValue(field)` | `workflow/entities/content/values/content-values.utils.ts` | `initialValue` and `toStoredContent` read `widgetValueRules[field.widget].hasListValue` inline; the profile body needs the same answer |
| `ValueDefinition` (`Pick<WorkflowDefinition, 'value_lists'> \| undefined`) | `workflow/entities/content/values/content-values.types.ts`, from the local alias of `ContentFieldValue.tsx` | The same `Pick` would be spelled in eight files: `ContentFieldValue`, `ContentValueControl`, `ContentFieldInput`, `InlineFieldValues`, `FieldSeparator`, `ItemTranscript`, `ItemAvatarCards`, and `DocumentBlocks` (as `ReturnType<typeof useWorkflowDefinition>['data']`) |

### Checked, not extracted

| Candidate | Copies | Why it stays |
|---|---|---|
| `PersonAvatar` to `shared/components` | Users in `workflow` and `artifact` | It draws a person of the content with the tones of people; `shared` gets only the tones of `AvatarFallback` |
| `FieldSeparator`, `InlineFieldValues` to `shared/components` | Several users | They draw content fields, an object of `workflow` |
| `transcriptParts`, `transcriptParticipants` | One user each | Rules of the transcript of an outline |

## 7. Changes to existing modules

| File | What changes | Commit |
|---|---|---|
| `docs/schemas/content-schema.meta.schema.json`, `README.md`, `artifacts/interview_transcript.v1.json`, `items/interview_message.v1.json`, `items/persona.v1.json`; `docs/DATA_SHAPE.md` | Section 8 | 1 |
| `shared/components/ui/avatar.tsx`, `__tests__/avatar.test.tsx` (new); `design-system/widgets/showcase/components/cards/ChatCard.tsx` | Decision 6 | 2 |
| `workflow/entities/content/fields/content-fields.types.ts`, `content-fields.utils.ts`, `artifact-kinds/artifact-kinds.types.ts` | The widgets, `profile`, `artifactDisplays`, `itemDisplays`, `ItemPageLayout`, `itemPageLayouts`, `oneLineWidgets`, `ProfileFields`; `artifactDisplayOf`, `pageLayoutOf`, `contentDisplayOf`, `documentDisplaysByKind`, `extensionField`, `isOneLineField`, `profileFields`; `x-ui-participants-field` in `contentSchemaSchema` | 3 |
| `workflow/entities/content/values/content-values.utils.ts`, `widget-value-rules.utils.ts`, `content-values.types.ts` | `hasListValue`; the rows of the three widgets; `ValueDefinition` | 3 |
| `workflow/entities/content/value-labels/value-tones.constants.ts` (new), `value-labels.utils.ts` | `valueTonesByField`; `valueTone`, `personTone` | 3 |
| `workflow/entities/components/ContentFieldValue.tsx`, `PersonAvatar.tsx`, `FieldSeparator.tsx`, `InlineFieldValues.tsx` (new), `content-input/ContentValueControl.tsx`, `content-input/ContentFieldInput.tsx` | The rows of the three widgets and `renderItemIdLink`; `ValueDefinition` | 3 |
| `workflow/entities/@x/artifact.ts` | Decision 4 | 3 |
| `documents/widgets/panel/documents-frame.config.tsx` | The icons of `profile` | 3 |
| `artifact/entities/outline/outline.types.ts`, `outline.utils.ts`, `document-blocks.utils.ts`, `transcript.utils.ts` (new), `hooks/useArtifactDocument.ts` | Decisions 13 to 16, 19 | 4 |
| `artifact/entities/components/ArtifactDocument.tsx`, `DocumentBlocks.tsx`, `ItemTranscript.tsx` (new), `ItemAvatarCards.tsx` (new), `ItemHeading.tsx` (new), `ArtifactItemDetails.tsx`, `index.ts` | Decisions 17, 18, 20 to 22 | 4 |
| `workflow/entities/content/value-labels/interview-value-labels.constants.ts`, `value-labels.constants.ts` | `messageRoleLabels` and its row `interview_message.role` go with the field | 4 |
| `mocks/workflow/data/content-schemas/*.json` (three), `mocks/workflow/__tests__/artifact-kinds.fixtures.test.ts` | The copies; the comparison | 4 |
| `mocks/artifacts/fixtures/mentor-platform-artifacts.fixtures.ts`, `artifacts.fixtures.ts`, `artifact-builder.fixtures.ts` | Section 12 | 4 |
| Tests that read the mock: `workflow/.../content-fields.utils.test.ts`, `workflow/.../value-labels.constants.test.ts`, `artifact/.../outline.utils.test.ts`, `ArtifactDocument.test.tsx`, `ArtifactItemDetails.test.tsx` | Section 13 | 4 |
| `documents/widgets/document/components/DocumentPage.tsx`, `documents/widgets/item/components/ItemPage.tsx` and their tests | `renderItemIdLink`; `ItemHeading` with `place`, `schema` on `ItemKeyLine` | 5 |
| `tests/screenshots/projects/documents.spec.ts` | Section 12 | 6 |
| `docs/architecture/web-app.md`, `docs/architecture/web-app-modules.md`, `frontend/src/mocks/README.md` | Section 14 | 7 |

The files that two commits change: `content-fields.utils.test.ts` and `value-labels.constants.test.ts` (commit 3 adds the cases with test schemas; commit 4 changes the expectations that read the mock).

## 8. The slices, file by file

S1e adds no slice; it adds to `shared/components/ui/avatar.tsx`, the entities of `workflow` and `artifact`, and two pages. The class strings below are the few that place the parts (decision 2).

### `docs/schemas` and `docs/DATA_SHAPE.md` (commit 1)

`content-schema.meta.schema.json`:

- `x-ui-display`: `"enum": ["document", "heading", "table", "cards", "transcript", "profile"]`. In the rule by level, an artifact takes `"enum": ["document", "transcript"]` (today `"const": "document"`); an item takes `"enum": ["heading", "table", "cards", "transcript", "profile"]` and `"x-ui-participants-field": false`.
- New `"x-ui-participants-field": { "type": "string", "description": "Artifact kinds only. The field that lists the people of a conversation, the one who leads first: an object list whose entries have key, name, role and item_id. A message names its speaker by key. The kinds that draw a transcript name one." }`.
- `x-ui-role-field`: "Item kinds only. The field whose value is the key of the participant who says the words of a message."
- `x-ui-list-fields`: "Item kinds only. The fields shown as table columns, on a card, and on an avatar card (the fields of one line under its title, then the others)."
- `$defs.field.x-ui-widget`: `"enum": ["text", "textarea", "select", "number", "list", "tags", "object-list", "separator", "avatar-list", "badge"]`, and the field gains `"allOf"`: a `badge` requires `enum` or `x-value-list`; an `avatar-list` requires `"type": { "const": "array" }`.

`artifacts/interview_transcript.v1.json`:

```json
"x-ui-display": "transcript",
"x-ui-participants-field": "participants",
"x-ui-field-order": ["participants", "turn_count", "status", "stop_reason"],
"properties": {
  "participants": {
    "title": "Participants",
    "type": "array",
    "minItems": 2,
    "items": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "key": { "title": "Key", "type": "string", "description": "The key that the messages of the participant name: interviewer, or the key of the persona.", "x-ui-widget": "text" },
        "name": { "title": "Name", "type": "string", "description": "The name shown beside the messages.", "x-ui-widget": "text" },
        "role": { "title": "Role", "type": "string", "enum": ["interviewer", "persona"], "description": "What the participant does in the interview.", "x-ui-widget": "select" },
        "item_id": { "title": "Item", "type": ["string", "null"], "description": "The item that the participant is, such as its persona; null for an agent.", "x-ui-widget": "text" }
      },
      "required": ["key", "name", "role", "item_id"]
    },
    "description": "The people of the interview, the one who leads first. Set by the system.",
    "x-ui-widget": "avatar-list",
    "readOnly": true
  },
  "turn_count": { "...": "as today", "title": "Turns" },
  "status": { "...": "as today", "x-ui-widget": "separator" },
  "stop_reason": { "...": "as today", "x-ui-widget": "separator" }
},
"required": ["participants", "turn_count", "status", "stop_reason"]
```

`items/interview_message.v1.json`: `role` is replaced by `"speaker": { "title": "Speaker", "type": "string", "description": "The key of the participant of the transcript who says the words.", "x-ui-widget": "text" }`; `turn` takes `"x-ui-widget": "separator"`; `"x-ui-role-field": "speaker"`; `"x-ui-list-fields": ["turn", "speaker", "content"]`; `x-ui-field-order` and `required` name `speaker` in place of `role`.

`items/persona.v1.json`: `"x-ui-display": "profile"`; `"x-ui-list-fields": ["name", "stakeholder_type", "interview_status", "background", "goals"]`; `interview_status` takes `"x-ui-widget": "badge"`.

`README.md`:

- Display keywords: `x-ui-display` by level with `profile` ("the items are people: in a document, one avatar card each, the avatar beside the title and the list fields under it; the page of one item as a profile, the avatar beside its title, the list fields of one line on its key line, the lists in two columns") and the layout `transcript` of an artifact ("its items as a conversation of its participants: its fields other than separators at the top, the separators of its messages between them, its own separators after the last message"); rows for `x-ui-role-field` and `x-ui-participants-field`; the new text of `x-ui-list-fields`.
- `x-ui-widget`: `separator` ("a value that marks a place of a sequence: in a transcript, a separator where the value of a message changes, or after the last message for a field of the artifact; elsewhere, its value"), `avatar-list` ("a list of people whose entries have a `name` and an `item_id`: each an avatar and the name, reaching the item when it has one"), `badge` ("a choice shown as a badge in the color of its value").
- The table of the kinds: "Every artifact kind except `interview_transcript`: `document`", "`interview_transcript`: `transcript`", "`persona`: `profile`", the new list fields of `persona` and `interview_message`; `participants` among the read only fields.
- Plain values only: "No field holds the id or key of another item, except `item_id` of a participant of a conversation, which the system sets so that the participant reaches the item it is. Relations between items are trace links."

`DATA_SHAPE.md`: the table of InterviewTranscript gains `participants` ("object[]: `key`, `name`, `role` (`interviewer`, `persona`), `item_id` (the persona, null for the interviewer), the interviewer first; the data allows several personas, version 1 writes one"); InterviewMessage has `speaker` ("the key of a participant of its transcript") in place of `role`.

### `shared/components/ui/avatar.tsx` (commit 2)

```tsx
// `variant` is the fill and `color` the meaning, as for Badge and Button; without either, the
// fallback keeps its muted look.
const avatarFallbackStyles = cva(
  'flex size-full items-center justify-center rounded-full text-sm group-data-[size=sm]/avatar:text-xs',
  {
    variants: {
      variant: {
        soft: 'bg-(--tone-soft) text-(--tone-strong)',
        solid: 'bg-(--tone) text-(--tone-foreground)',
        none: 'bg-muted text-muted-foreground',
      },
      color: toneClasses,
    },
  },
)

function AvatarFallback({
  className,
  variant,
  color,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  variant?: 'soft' | 'solid' | undefined
  color?: Tone | undefined
})
```

The fallback resolves `variant` to `soft` when `color` is given without it, and to `none` when neither is; it sets `data-variant` and `data-color` as `Badge` does. The chat card of the design system page draws its avatars in soft tones.

### `workflow/entities` (commit 3)

```text
workflow/entities/
├── @x/artifact.ts                       decision 4
├── artifact-kinds/artifact-kinds.types.ts   + 'x-ui-participants-field'
├── components/
│   ├── ContentFieldValue.tsx            + rows separator, avatar-list (AvatarListValue), badge (BadgeValue);
│   │                                      renderItemIdLink; ValueDefinition
│   ├── FieldSeparator.tsx               new
│   ├── InlineFieldValues.tsx            new
│   ├── PersonAvatar.tsx                 new
│   └── content-input/
│       ├── ContentFieldInput.tsx        ValueDefinition
│       └── ContentValueControl.tsx      + rows separator (SeparatorControl), avatar-list, badge; ValueDefinition
└── content/
    ├── fields/content-fields.types.ts   + widgets, profile, artifactDisplays, itemDisplays, ItemPageLayout,
    │                                      itemPageLayouts, oneLineWidgets, ProfileFields
    ├── fields/content-fields.utils.ts   + artifactDisplayOf, pageLayoutOf, extensionField, isOneLineField,
    │                                      isSeparatorField, profileFields
    ├── values/content-values.types.ts   + ValueDefinition
    ├── values/content-values.utils.ts   + hasListValue
    ├── values/widget-value-rules.utils.ts   + rows separator, avatar-list, badge
    ├── value-labels/value-tones.constants.ts    new
    └── value-labels/value-labels.utils.ts       + valueTone, personTone
```

```ts
// content-fields.types.ts
export const fieldWidgets = [
  'text', 'textarea', 'select', 'number', 'boolean', 'list', 'tags', 'object-list',
  'separator', 'avatar-list', 'badge',
] as const

/** The widgets whose value reads on one line, such as under the title of an avatar card. */
export const oneLineWidgets = ['text', 'select', 'badge', 'number', 'boolean', 'separator'] as const satisfies readonly FieldWidget[]

export const contentDisplays = ['document', 'heading', 'table', 'cards', 'transcript', 'profile'] as const

/** The layouts of a whole document, which an artifact kind may name; its items take the others. */
export const artifactDisplays = ['document', 'transcript'] as const satisfies readonly ContentDisplay[]
export type ArtifactDisplay = (typeof artifactDisplays)[number]

/** The displays of an item kind: how a run of its items is drawn in a document. */
export const itemDisplays = ['heading', 'table', 'cards', 'transcript', 'profile'] as const satisfies readonly ContentDisplay[]
export type ItemDisplay = (typeof itemDisplays)[number]

/** How the page of one item is laid out: every field under its label, or the whole page as a profile. */
export type ItemPageLayout = 'fields' | 'profile'

/** The layout of the page of one item, by the display of its kind; a display without a row fails to compile. */
export const itemPageLayouts = {
  heading: 'fields',
  table: 'fields',
  cards: 'fields',
  transcript: 'fields',
  profile: 'profile',
} as const satisfies Record<ItemDisplay, ItemPageLayout>

/** The fields of a kind whose display is `profile`, as its cards and the page of one item draw them. */
export interface ProfileFields {
  /** The field of `x-ui-title-field`: the name on the card and the heading of the page. */
  title: ContentField | undefined
  /** The other list fields that read on one line: under the name on the card, on the key line of the page. */
  line: ContentField[]
  /** The other list fields: a text on two lines and a list on one line, on the card. */
  card: ContentField[]
  /** Every field but the title and the line, in field order: the body of the page. */
  body: ContentField[]
}
```

```ts
// content-fields.utils.ts
/** The layout that an artifact kind names for its document, else `document`. */
export function artifactDisplayOf(schema: ContentSchema): ArtifactDisplay
/** How a kind is shown: for an artifact, its layout; for an item, the display it names, else `table`. */
export function contentDisplayOf(schema: ContentSchema): ContentDisplay
/** The layout of the page of one item of the kind: the row of its display in `itemPageLayouts`. */
export function pageLayoutOf(schema: ContentSchema): ItemPageLayout
/** What each kind of artifact is made of, by kind name: its own layout when not `document`, else as today. */
export function documentDisplaysByKind(kinds: ArtifactKinds | undefined): Map<string, ContentDisplay>
/** The field that an extension of the schema names; undefined when there is none. */
export function extensionField(
  schema: ContentSchema,
  extension: 'x-ui-title-field' | 'x-ui-role-field' | 'x-ui-participants-field',
): ContentField | undefined
/** Whether the value of a field reads on one line: its widget is one of `oneLineWidgets`. */
export function isOneLineField(field: Pick<ContentField, 'widget'>): boolean
/** Whether a field marks a place of a sequence: its widget is `separator`. */
export function isSeparatorField(field: Pick<ContentField, 'widget'>): boolean
/** The fields of a kind whose display is `profile`, as its cards and the page of one item draw them. */
export function profileFields(schema: ContentSchema): ProfileFields
```

```ts
// content-values.utils.ts and content-values.types.ts
/** Whether the value of a field is a list: it starts empty and is never stored as null. */
export function hasListValue(field: Pick<ContentField, 'widget'>): boolean
/** What titles the values of a field that names a value list; undefined until the definition loads. */
export type ValueDefinition = Pick<WorkflowDefinition, 'value_lists'> | undefined

// value-tones.constants.ts
/** The tone of each value of a badge field, by the path of the field, for a fixed enum of the schema files. */
export const valueTonesByField: Readonly<Record<string, Readonly<Record<string, Tone>>>> = {
  'persona.interview_status': { not_started: 'neutral', in_progress: 'primary', completed: 'success' },
}

// value-labels.utils.ts
/** The tone of a value of a badge field: the one written for the field at `path`, else neutral. */
export function valueTone(path: string, value: string): Tone
/** The tone of a person by its place in a list: primary for the first, who leads, then chart and neutral in turn. Never a tone of a status. */
export function personTone(place: number): Tone
```

```tsx
// ContentFieldValue.tsx, rows of widgetValueViews
separator: ({ field, value, definition }) =>
  isChoiceField(field) ? <SelectValue field={field} value={textOf(value)} definition={definition} /> : <span>{textOf(value)}</span>,
'avatar-list': ({ value, renderItemIdLink }) =>
  Array.isArray(value) ? <AvatarListValue entries={value} renderItemIdLink={renderItemIdLink} /> : null,
badge: ({ field, value, definition }) => <BadgeValue field={field} value={textOf(value)} definition={definition} />,
```

`isChoiceField` is a local helper of the file (options, `valueList` or `allowedValuesFrom`). `AvatarListValue` reads `name` and `item_id` of each entry (`isRecord`, `fieldText`) and draws each as decision 8 says. `ContentValueControl` adds `separator: SeparatorControl` (a local component that renders `SelectControl`, `NumberControl` or `TextControl` by the type of the field), `'avatar-list': EntriesOf`, `badge: SelectControl`.

```tsx
// FieldSeparator.tsx
/**
 * A separator that marks a place of a sequence, holding the filled fields that change there:
 * a number as its title and its value ("Turn 2"), a choice as the label of its value, a text as
 * itself. Nothing when no field is filled.
 */
export function FieldSeparator(props: { fields: readonly ContentField[]; content: ContentValues; definition: ValueDefinition; className?: string })

// InlineFieldValues.tsx
/** The filled fields of a content as values on one line, each after its title for assistive technology. */
export function InlineFieldValues(props: { fields: readonly ContentField[]; content: ContentValues; definition: ValueDefinition })

// PersonAvatar.tsx
/** The avatar of a person: its initials on the soft fill of its tone. The name sits beside it, so it is hidden from assistive technology. */
export function PersonAvatar(props: { name: string; tone: Tone; size?: 'sm' | 'default' | 'lg' })
```

### `artifact/entities` (commit 4)

```text
artifact/entities/
├── components/
│   ├── ArtifactDocument.tsx     the layouts by display (artifactLayouts), TranscriptFields, FieldSections;
│   │                              + renderItemIdLink
│   ├── ArtifactItemDetails.tsx  keyLineFields, detailBodies (FieldList, ProfileGrid); ItemKeyLine + schema
│   ├── DocumentBlocks.tsx       itemRunViews (+ row profile) in place of the if chain; ItemTranscript moves out
│   ├── ItemHeading.tsx          new (headingAvatars)
│   ├── ItemAvatarCards.tsx     new
│   └── ItemTranscript.tsx       new file: the conversation
├── outline/
│   ├── document-blocks.utils.ts + { artifactDisplay }, groupHeadings
│   ├── hooks/useArtifactDocument.ts   + display, participants; pending while the schema loads
│   ├── outline.types.ts         + display and participants of ArtifactDocumentData, Participant,
│   │                              TranscriptPart, RenderItemLink, RenderItemIdLink
│   ├── outline.utils.ts         + itemAnchorProps
│   └── transcript.utils.ts      new: transcriptParticipants, transcriptParts
└── index.ts                     + ItemHeading, RenderItemIdLink; RenderItemLink from outline.types
```

```ts
// outline.types.ts
/** Draws the title of an item as a link to its page; the page of the document gives how it opens. */
export type RenderItemLink = (item: OutlineItem, title: ReactNode) => ReactNode
/** Wraps some content in one element that opens the page of the item with this id and takes a class, such as a `PageLink`. */
export type RenderItemIdLink = (itemId: string, children: ReactNode) => ReactNode

/** A person of a conversation, as its transcript draws it. */
export interface Participant {
  key: string
  name: string
  /** The item that the participant is, whose page it reaches; null for an agent. */
  itemId: string | null
  /** `end` for those who share the role of the first participant, who leads; `start` for the others. */
  side: 'start' | 'end'
  tone: Tone
}

/** A part of a conversation: a separator where values change, or the messages in a row of one participant. */
export type TranscriptPart =
  | { type: 'separator'; key: string; fields: ContentField[]; content: ContentValues }
  | { type: 'run'; key: string; participant: Participant; messages: { item: OutlineItem; text: string }[] }

export interface ArtifactDocumentData {
  artifact: Artifact
  /** How the document is laid out: the display of its artifact kind. */
  display: ArtifactDisplay
  /** The filled fields of the artifact, in the order of its schema. */
  fields: ContentField[]
  /** The people of its conversation; empty for a document that is not a transcript. */
  participants: Participant[]
  blocks: DocumentBlock[]
  kinds: ReadonlyMap<string, KindView>
}
```

```ts
// transcript.utils.ts
/** The participants that the field of `x-ui-participants-field` lists, each with its side and its tone; none without the keyword. */
export function transcriptParticipants(schema: ContentSchema, content: ContentValues): Participant[]
/**
 * The parts of a conversation in order: a separator before the first message and where a field
 * with the widget separator changes, and a run for each row of messages of one speaker. A speaker
 * that is not a participant gets one: its key as its name, at the start, neutral.
 */
export function transcriptParts(
  schema: ContentSchema,
  items: readonly OutlineItem[],
  participants: readonly Participant[],
): TranscriptPart[]

// outline.utils.ts
/** The props that tie the block of an item to the address of the page: its anchor, a target of the focus, and `data-target` when the address names it. */
export function itemAnchorProps(itemId: string, targetItemId: string | null): { id: string; tabIndex: -1; 'data-target'?: '' }

// document-blocks.utils.ts: whether a layout of an artifact heads each group of items with its kind.
const groupHeadings = { document: true, transcript: false } as const satisfies Record<ArtifactDisplay, boolean>
// A `transcript` reads as one conversation: its runs have no heading of their kind.
export function documentBlocks(input: ArrangeInput, { artifactDisplay }: { artifactDisplay: ArtifactDisplay }): DocumentBlock[]
```

```tsx
// ItemTranscript.tsx
/**
 * The messages of a transcript as a conversation: the participants who lead at the right in a
 * tinted bubble, the others at the left in a muted one, each row of messages beside the avatar and
 * under the name of its participant, a separator where a value such as the turn changes, the quoted
 * words marked.
 */
export function ItemTranscript<Range extends HighlightRange>(props: {
  items: readonly OutlineItem[]
  view: KindView
  participants: readonly Participant[]
  definition: ValueDefinition
  targetItemId: string | null
  messageMarks?: ReadonlyMap<string, readonly Range[]> | undefined
  renderMessageMark?: ((range: Range, children: ReactNode) => ReactNode) | undefined
})

// ItemAvatarCards.tsx
/** One avatar card per item: the avatar, the title as the link to its page, its fields of one line under it, then a text on two lines and a list on one line. */
export function ItemAvatarCards(props: {
  items: readonly OutlineItem[]
  view: KindView
  renderItemLink: RenderItemLink
  definition: ValueDefinition
  targetItemId: string | null
})

// ItemHeading.tsx
/** The heading of an item page: its title, after the avatar of the item when its page layout (`pageLayoutOf`) has one in `headingAvatars`. */
export function ItemHeading(props: { item: ArtifactItem; schema: ContentSchema | undefined; title: string; place: number })
```

```tsx
// ArtifactDocument.tsx (the layouts)
interface LayoutParts {
  /** The fields as sections, for a document. */
  sections: ReactNode
  /** The fields that are not separators, as a list, for a transcript. */
  fieldList: ReactNode
  /** The separator fields of the artifact, after the last message; null when none is filled. */
  endSeparator: ReactNode
  /** The sections and the items, from `DocumentBlocks`. */
  blocks: ReactNode
  /** The fields of the version that the history shows, in place of the fields. */
  version: ReactNode | undefined
}

// A layout without a row fails to compile, as a widget without a view does.
const artifactLayouts = {
  document: DocumentLayout,
  transcript: TranscriptLayout,
} as const satisfies Record<ArtifactDisplay, (parts: LayoutParts) => ReactNode>
```

```tsx
// DocumentBlocks.tsx: the view of a run of items, by its display. Each view takes the props that
// DocumentBlocks has for a run and reads the ones it needs.
const itemRunViews = {
  table: ItemsTable,
  cards: ItemCards,
  transcript: ItemTranscript,
  profile: ItemAvatarCards,
} as const satisfies Record<Exclude<ItemDisplay, 'heading'>, (props: RunViewProps) => ReactNode>

// ItemHeading.tsx: whether an avatar leads the title, by the page layout.
const headingAvatars = { fields: false, profile: true } as const satisfies Record<ItemPageLayout, boolean>

// ArtifactItemDetails.tsx: what follows the key on the key line, and the body of the fields, by the page layout.
const keyLineFields = {
  fields: () => [],
  profile: (schema) => profileFields(schema).line,
} as const satisfies Record<ItemPageLayout, (schema: ContentSchema) => ContentField[]>
const detailBodies = { fields: FieldList, profile: ProfileGrid } as const satisfies Record<ItemPageLayout, (props: DetailBodyProps) => ReactNode>
```

`DocumentLayout` renders `version ?? sections`, then `blocks`. `TranscriptLayout` renders `version ?? fieldList`, then `blocks`, then `version === undefined && endSeparator`. `DocumentBlocks` passes `participants` to `ItemTranscript` and draws `ItemAvatarCards` for the display `profile`.

### The pages (commit 5)

- `DocumentPage` gives `ArtifactDocument` the prop `renderItemIdLink={(itemId, children) => <PageLink href={project.item(itemId)}>{children}</PageLink>}`.
- `ItemPage` replaces its `<h1>` with `<ItemHeading item={record} schema={page.schema} title={page.title} place={page.neighbors.index} />` and passes `schema={page.schema}` to `ItemKeyLine`.

## 9. State and data flow

| State | Where | Name |
|---|---|---|
| The artifact, its schema, its items, the kinds, the definition | The query hooks of the entities, unchanged | `useArtifact`, `useItemSchema`, `useOutlineItems`, `useArtifactKinds`, `useWorkflowDefinition` |
| The layout and the participants of a document | Derived in `useArtifactDocument` | `display`, `participants` |
| The parts of a conversation, the fields of a profile, the tone of a person | Derived at render by pure rules | `transcriptParts`, `profileFields`, `personTone` |
| The marks, the target, the history, the edit mode | As S1b | - |

Flow: the page loads the artifact, its schema and its items, shows the loading state until all three are there, then the layout of its kind. While the agents write an interview, `useWritingArtifacts` reloads the document: new messages join the conversation, a new turn adds its separator, "Turns" counts up, and the last separator changes from "In progress" to "Completed   Stopping condition reached".

## 10. Behavior of each component

### Document page, layout `transcript`

| Component (where) | What it shows; hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| Header | Title with Edit (S1b) and Export (S1d); the status line; the summary of the artifact. Unchanged | As S1b | As S1b | As S1b |
| List of the fields (`TranscriptFields`, under the header) | Between two rules, each field that is not a separator: "Participants" as an avatar list, "Turns" with its number; a field without a value left out; the title above the value below `sm`; hidden while the history shows a version (the version takes its place) | Hovers a participant with a page; clicks it; double clicks it; Ctrl or Cmd click | Hover: the fill of the ghost button and the text in the primary color, no underline. Click: the page of the persona in the preview tab; a double click keeps the tab; Ctrl or Cmd keeps the meaning of the browser (`PageLink`) | Each participant with a page is in the Tab order, Enter opens it; a participant without a page (the interviewer) is not focusable |
| Separator of a turn (`FieldSeparator`) | A rule with "Turn 2" in its middle, `text-xs`, muted, before the first message and wherever the turn changes; no group heading above the conversation | - | - | Not focusable |
| Run of messages (`ItemTranscript`) | The avatar of the participant in the soft fill of its tone and its name, then its messages in a row, each a bubble: at the right and tinted for the participants who lead, at the left and muted for the others; the words keep their line breaks; the quoted words marked (S1b) | Clicks a mark, or Enter or Space on it (S1b) | The card of the items that quote the words (S1b) | A mark is in the Tab order; the bubble, the name and the avatar are not |
| The target message (`?item=` of a message) | Its bubble with a ring | Arrives from an address | The page scrolls the message to the middle (S1b) | The bubble takes the focus (`tabIndex={-1}`); the ring stays while the address names it |
| Last separator (`FieldSeparator` of the artifact) | After the last message, a rule with the values of the separator fields side by side: "Completed   Stopping condition reached", or "In progress"; nothing when none is filled; hidden while the history shows a version | - | - | Not focusable; a screen reader reads the text |

### Document page, display `profile` (the personas)

| Component (where) | What it shows; hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| Group heading | "Interviewee (3)", as today | - | - | - |
| Card (`ItemAvatarCards`) | Two columns from `sm`, one below. The avatar in the soft fill of the tone of its place; the name as a link; under it the stakeholder type and the interview status badge ("Interviewed", "Interview in progress", "Not interviewed"); the background on at most two lines; "Goals:" and the goals on one line; an empty field left out; no key until S1c | Clicks the name; double clicks it; Ctrl or Cmd click | Opens the page of the persona in the preview tab; a double click keeps it (`PageLink`) | The name is in the Tab order |
| The target card (`?item=` of a persona) | The card `bg-accent/50` | Arrives from an address | The page scrolls the card to the middle | The card takes the focus (`tabIndex={-1}`) |

### Item page of a persona (display `profile`)

| Component (where) | What it shows; hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| `ItemHeading` | The avatar (`lg`) in the tone of the place of the persona, the same as on its card, then the `h1`; Edit at the right (S1b) | As S1b | As S1b | As S1b |
| `ItemKeyLine` | The review status, the key, then the stakeholder type and the interview status badge | - | - | Not focusable |
| Link line, history, navigator | As S1b | As S1b | As S1b | As S1b |
| Body (`ArtifactItemDetails`) | Background and expertise across the page; the five lists in pairs; behavioral tendencies across; an empty field left out; one column below `sm`; the marks of the links (S1b) | As S1b | As S1b | As S1b |

### Edit form of a transcript

| Component (where) | What it shows; hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| The fields in `EditArtifactForm` | Each read only, as its value under its label: the participants as an avatar list, "4", "Completed", "Stopping condition reached". Reached only during a review that lists the transcript (no checkpoint of version 1 does, so Edit stays disabled with its reason) | - | - | The form keeps the focus rules of S1b |

## 11. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| A finished interview of two | The list of the fields, the conversation with its turn separators, the last separator "Completed   Stopping condition reached" | The interview with the student of the mentor platform (artifact `...103`), default |
| An interview in progress | Four messages; "Turns 2"; the last separator "In progress"; the document marked as being written in the tree | The interview with the student of the library project (artifact `...304`), default (section 12) |
| Several participants, several messages in a row | Each participant with its avatar and name; a run of two messages under one name | Unit test (version 1 of the workflow writes two participants) |
| An interview without messages | The list of the fields, then the last separator alone | Unit test |
| A speaker that is not a participant | Its key as its name, at the left, neutral | Unit test |
| A participant whose item is gone | The page opens on the not found state of the item page | Unit test of the link; the page as S1a |
| Quoted words in a bubble | The marks and their card | The interview with the student of the mentor platform |
| A message at the address | Its bubble with a ring, focused | That interview with `?item=<id of PER-001#2>` |
| A version of an interview in the history | The version in place of the list of the fields, the conversation as now, no last separator | That interview, History |
| The personas as avatar cards | Three cards | The persona catalog of the mentor platform (artifact `...102`), default |
| Personas being interviewed | "Interview in progress", "Not interviewed"; empty lists left out | The persona catalog of the library project (artifact `...302`), default |
| The profile page of a persona | The profile | PER-001 of the mentor platform |
| A badge value without a tone | Neutral | Unit test |
| Loading, error, not found of the page | As S1a | `?mock-artifact=loading`, `?mock-artifact=error`, `/documents/missing` |

Words. The title of `turn_count` becomes "Turns" in the schema. Every other word comes from what exists: the labels of `transcriptStatusLabels` ("In progress", "Completed"), `stopReasonLabels`, `personaInterviewStatusLabels`, the titles of the fields in the schemas ("Participants", "Turn", "Goals", ...), and the names of the participants in the data. `messageRoleLabels` goes with the field `role`. No `Messages` object of a slice changes.

## 12. Mocks and screenshots

- Commit 4 copies the three schemas of commit 1 into `mocks/workflow/data/content-schemas/`, with the test of decision 24.
- `interview()` of `mentor-platform-artifacts.fixtures.ts` takes a summary, and builds `participants` = `[{ key: 'interviewer', name: 'Interviewer', role: 'interviewer', item_id: null }, { key: personaKey, name: personaName, role: 'persona', item_id: null }]` and each message with `speaker` (`interviewer`, or the key of the persona, from the first element of the tuple, renamed `speaker`). `buildProjectArtifacts` (`artifact-builder.fixtures.ts`) sets `item_id` of each participant whose `key` is the key of an item of the project to the id of that item, as it resolves `subject_item_id` from `subjectKey`. The summaries say what the page does not:
  - the student: "The student gives up when no mentor is free this week, and wants to book and cancel without writing to anyone.";
  - the mentor: "The mentor offers two afternoons a week, sessions of an hour, and wants a reminder for both sides.";
  - the admin: "The admin wants to approve the mentors and, in the first year, every booking.";
  - the persona catalog: "The mentor and the admin may disagree on who approves a booking."
- The library project (`artifacts.fixtures.ts`): `SimpleProject` gains `interviewStatuses?: [string, string]` (default both `completed`) and `interview?: ArtifactSpec`, placed last by `simpleSpecs`, so that the ids of its first three artifacts stay `...301` to `...303`. The library gets `interviewStatuses: ['in_progress', 'not_started']` and, as `...304`:

  ```ts
  {
    kind: 'interview_transcript',
    title: 'Interview with the student',
    summary: 'The student finds the free rooms gone by nine, booked by people who never come.',
    status: 'draft',
    subjectKey: 'PER-001',
    content: {
      participants: [
        { key: 'interviewer', name: 'Interviewer', role: 'interviewer', item_id: null },
        { key: 'PER-001', name: 'Student', role: 'persona', item_id: null }, // resolved by the builder
      ],
      turn_count: 2,
      status: 'in_progress',
      stop_reason: null,
    },
    items: [
      // key, then turn, speaker, content and topic; iteration 0
      ['PER-001#1', 1, 'interviewer', 'How do you book a study room today?', 'daily use'],
      ['PER-001#2', 1, 'PER-001', 'I ask at the desk, and the free rooms are gone by nine.', 'daily use'],
      ['PER-001#3', 2, 'interviewer', 'What goes wrong once a room is booked?', 'problems'],
      ['PER-001#4', 2, 'PER-001', 'People book a room for the whole day and never come.', 'problems'],
    ],
  }
  ```

  Check with the tests of `mocks/artifacts`, `mocks/projects` and `mocks/runs` that no count of the library project changed in a test; a test that counted its artifacts gets the new count.
- No new scenario.
- Screenshot cases in `tests/screenshots/projects/documents.spec.ts` (commit 6): `Document with cards` becomes `Document with avatar cards` (same address); `Document with a transcript` stays (full page); new `Transcript of an interview in progress` (`/projects/${projectIds.library}/documents/${mockId(IdPrefix.Artifact, 304)}`, full page); new `Avatar cards of personas being interviewed` (`/projects/${projectIds.library}/documents/${mockId(IdPrefix.Artifact, 302)}`); new `Profile page of a persona` (open PER-001 from the outline of the mentor catalog, full page); new `Participant under the pointer` (the transcript of the mentor platform with the pointer on "Student" of the list of the fields).

## 13. Tests

| File | Cases |
|---|---|
| `shared/components/ui/__tests__/avatar.test.tsx` (new, commit 2) | No props: the muted fallback as before. `color` alone: `data-variant="soft"`, `data-color`. `variant="solid"` with a color. Axe |
| `workflow/.../content-fields.utils.test.ts` + data (commit 3) | `pageLayoutOf`: `profile` gives `profile`, `table` gives `fields`; the keys of `itemPageLayouts` equal `itemDisplays` (as the test of `widgetValueRules` compares its keys with `fieldWidgets`). `artifactDisplayOf`: `transcript`; `profile` reads `document`; none reads `document`. `contentDisplayOf` by level: an item names `profile`. `documentDisplaysByKind`: the layout of an artifact wins over its items. `extensionField`: each keyword; a name that is not a property. `isOneLineField` and `isSeparatorField` for each widget. `profileFields`: title, line, card and body of a test kind; no title field. The three widgets are read from `x-ui-widget` |
| `workflow/.../content-fields.utils.test.ts` (commit 4) | `documentDisplaysByKind` of the mock: `persona_catalog` gives `profile`, `interview_transcript` gives `transcript` |
| `workflow/.../content-values.utils.test.ts` + data | `hasListValue` for each widget; a `badge` outside its options refused with "Choose one of the values."; a `separator` checked by its type (a choice, a number below its minimum) |
| `workflow/.../widget-value-rules.utils.test.ts` | Rows for every widget (the case that compares the keys with `fieldWidgets`); `avatar-list` has a list value |
| `workflow/.../value-labels.utils.test.ts` | `valueTone`: a value with a row; neutral without. `personTone` for the places 0 to 4: primary, chart, neutral, chart, neutral |
| `workflow/.../value-labels.constants.test.ts` | Commit 3: every path of `valueTonesByField` is written as `<kind>.<field>`. Commit 4: `fixedSelects` takes the widgets `select`, `badge` and `separator`, so that the labels of the transcript status, the stop reason and the persona status still belong to fields that exist; the row of `interview_message.role` is gone; every path of `valueTonesByField` names a badge field of a mock schema with those values |
| `workflow/.../ContentFieldValue.test.tsx` + data | A `badge` reads the label of its value, in its tone (`data-color`), with no dot; a `separator` reads as a label or a number; an `avatar-list` draws an avatar and a name per entry, a ghost button (`data-variant="ghost"`) through `renderItemIdLink` when the entry has an `item_id`, a `span` without the prop or without the id |
| `workflow/.../content-input/ContentFieldInput.test.tsx` + data | A `badge` edits as a select; a `separator` of a choice as a select, of a number as a number input; a read only `avatar-list` shows its people |
| `workflow/.../FieldSeparator.test.tsx`, `InlineFieldValues.test.tsx`, `PersonAvatar.test.tsx` (new) | The separator: "Turn 2", a label, two fields side by side, nothing for empty fields. The line: filled fields only, in order, each after its `sr-only` title. The avatar: the initials, `data-variant="soft"` and the `data-color` of its tone, `aria-hidden`. Axe on each |
| `artifact/.../outline.utils.test.ts` + data | `itemAnchorProps`. `documentBlocks`: a group heading in a `document`; none in a `transcript`; every call already in the file passes `{ artifactDisplay: 'document' }`. The persona block is `profile` (commit 4) |
| `artifact/.../transcript.utils.test.ts` + data (new) | `transcriptParticipants`: the entries in order with their `itemId` and tone; two who lead share the right side; no keyword gives none. `transcriptParts`: a separator before the first message and where the turn changes, not where only the speaker changes; two separator fields changing at one message share one part; two messages of one speaker in one run; four participants; a speaker that is not a participant; the text from the title field |
| `artifact/.../hooks/useArtifactDocument.test.ts` | `display` of the interview is `transcript`, of the plan `document`; its participants; `pending` while the schema of the artifact loads; a schema that fails gives `document` with no fields |
| `artifact/.../components/ArtifactDocument.test.tsx` (extended) | The interview: the list with "Participants" and "Turns", "Student" as a ghost button that is a link through `renderItemIdLink`, "Interviewer" as text; no group heading; the separators "Turn 1" to "Turn 4"; the interviewer runs at the end (`data-align="end"`), the student at the start; the last separator "Completed" and "Stopping condition reached" after the last message, and no `h2` "Status". The library interview: "In progress" alone. A `fieldsView` on the interview takes the place of the list, and the last separator is gone. The persona catalog: three `h3` links, the badge "Interviewed", the background, "Goals:"; the library catalog: "Not interviewed". The anchors and the marks of the S1b case on the bubble of PER-001#2. Axe on the interview and on the cards |
| `artifact/.../components/ArtifactItemDetails.test.tsx` (extended) | A persona: the body without the name, the stakeholder type and the status; a list without `data-wide`, a text with it; a requirement as before. `ItemKeyLine` with the schema of a persona: the type and the badge after the key |
| `artifact/.../components/ItemHeading.test.tsx` (new) | A persona: the avatar with its initials and the tone of its place, and the `h1`; a requirement: the `h1` alone |
| `documents/widgets/document/components/__tests__/DocumentPage.test.tsx`, `documents/widgets/item/components/__tests__/ItemPage.test.tsx` (extended, commit 5) | "Student" in the list of the interview opens its item page; the page of PER-001: the avatar, the badge on the key line, the lists in pairs |
| `mocks/workflow/__tests__/artifact-kinds.fixtures.test.ts` | Every content schema of the mock equals its file in `docs/schemas/` |
| `mocks/artifacts/...` (the builder) | `item_id` of the persona of each interview is the id of its item; the interviewer has none |

Helpers: the test schemas (a transcript with participants, a message kind with and without `x-ui-role-field`, a kind with the display `profile`) sit in `content-fields.utils.data.ts` and `transcript.utils.data.ts`, each read by its own test; `ArtifactDocument.test.tsx` keeps `renderDocument(kind)` and gains a `projectId` option for the library project and a `renderItemIdLink` in its slots.

## 14. Docs to update

| Doc | What changes | Commit |
|---|---|---|
| `docs/schemas/*`, `docs/DATA_SHAPE.md` | Section 8 | 1 |
| `docs/architecture/web-app.md` section 6 | "The page of a document draws every kind ..." in place of "The artifact panel draws"; the displays by level with `profile` and the layout `transcript`; the participants of a transcript and where its fields go; the three widgets, the tones of badge values and of people in the code; the bullet of the registry replaced by "A layout that the generic drawing cannot give is a new value of `x-ui-display`, named after how it looks, never a component chosen by the name of a kind"; `FieldWidget` in the sketch with every widget | 7 |
| `docs/architecture/web-app.md` section 8 | "A new value of `x-ui-display` or `x-ui-widget`" names the tables that it adds a row to (decision 3), and says that the compiler reports each missing row | 7 |
| `docs/architecture/web-app.md` section 9 | The row Artifacts and items names the files that exist: `ArtifactDocument.tsx`, `DocumentBlocks.tsx`, `ItemTranscript.tsx`, `ItemAvatarCards.tsx`, `ItemHeading.tsx`, `ArtifactItemDetails.tsx`; `PersonAvatar.tsx`, `FieldSeparator.tsx`, `InlineFieldValues.tsx` of `workflow`; no registry | 7 |
| `docs/architecture/web-app-modules.md` | The row `artifact`: "the views of a document and of an item without actions, laid out by the display of the artifact and of each kind of item" | 7 |
| `frontend/src/mocks/README.md` | Section Documents: the library project, "An interview in progress" (its interview) and "Personas being interviewed" (its catalog); "The profile page of a persona" | 7 |
| `docs/ui/usability.md` (`frontend-plan`) | A1 to A26 and the answer of D1 (5.3 for the transcript, 7.4 for the personas) | Before commit 4 |
| `docs/ui/wireframes/s1e-document-layouts.html` (`frontend-plan`) | The wireframe, kept as it was chosen; section 1.2 holds the notes for the build | Done with this plan |
| `docs/frontend-implementation-plan.md` (`frontend-plan`) | The row S1e, and S1c.1 after it | Done with this plan |

## 15. Left for the next PRs

| Item | Where |
|---|---|
| The key on an avatar card as the button of the peek (`renderItemKey`); the peek without `ItemOrigin` | S1c; its plan is checked again once S1e merges |
| A group interview in the workflow (several personas in one transcript) | The workflow and the server; the frontend draws it already |
| The same tone for a persona in every transcript and on its card | Not planned: the tones go by place in each list (answer A9) |
| More tones for people, if a group of five or more needs them | A new tone of the design system, in a PR of its own |
| A separator between the rounds of a reworked interview (`iteration` as a `separator`) | A change of the schema when the mock holds a transcript with two rounds; no code |
| The other statuses (issues, backlog, validation report) as `badge` | Later, screen by screen |
| The words of the values in the definition instead of the web app (usability 8.3, open point 3) | The planning of the language of the UI |
| The citing items in the margin of a transcript (skeletons 6) | S4, if the card is not enough |
| The stale row "Why this item exists" of `mocks/README.md`, and the unused `revisionMessages.itemsAsNow` | S1b, or the next maintenance PR |

## 16. Commits and checks

`feat/fe/document-layouts`, from `origin/main` once S1b.2 is merged:

1. `docs(schemas): lay out an interview as a conversation of its participants and the personas as profiles, and add three widgets`
2. `feat(shared): give an avatar the tones and fills of the other components`
3. `feat(workflow): read the layout of an artifact and the profile display, and draw the separator, avatar list and badge widgets`
4. `feat(artifact): draw an interview as a conversation of its participants, and the personas as avatar cards and a profile page`
5. `feat(documents): open the page of a participant from its interview, and show the page of a persona as a profile`
6. `test(screenshots): cover the conversation of an interview, the avatar cards and the profile page`
7. `docs: describe the layouts of a document, the participants of a transcript and the new widgets`

Each file goes in the commit of its row in section 7. Commit 3 compiles alone: `profile` falls to the table of `DocumentBlocks` until commit 4 adds its case, and no schema of the mock names a new widget or display before commit 4. The plan, the prompt and the wireframe stay on `frontend-plan`.

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on the touched folders (`shared/components/ui`, `modules/design-system`, `modules/workflow/entities`, `modules/artifact/entities`, `modules/documents`, `mocks/workflow`, `mocks/artifacts`, `mocks/projects`, `mocks/runs`); typecheck once, since types change. A test that times out only with the others runs again alone. No full suite, E2E, screenshots or build locally; CI runs them. Then:

- `grep -nP '[^\x00-\x7F]'` on the docs and on the new comments;
- `grep -rnE 'backend|frontend|UI|dashboard|FR-[0-9]|NFR-[0-9]|docs/'` on the new comments;
- `grep -nE "interview|persona|turn|speaker|stop_reason|stakeholder|goals" frontend/src/modules/artifact/entities/components/{ItemTranscript,ItemAvatarCards,ItemHeading}.tsx frontend/src/modules/artifact/entities/outline/transcript.utils.ts frontend/src/modules/workflow/entities/components/{PersonAvatar,FieldSeparator,InlineFieldValues}.tsx` answers nothing (decision 3);
- `grep -nE "=== '(document|heading|table|cards|transcript|profile|fields|separator|avatar-list|badge)'|case '(document|heading|table|cards|transcript|profile|fields|separator|avatar-list|badge)'"` on the new and changed components and on `transcript.utils.ts` and `document-blocks.utils.ts` answers nothing (decision 3: values are looked up in tables; the predicates of `content-fields.utils.ts` are the one place that names a widget);
- `git diff` of the new components holds no color class and no class value in brackets (decision 2), and no `rounded-full` but in `avatar.tsx` (answer A8: no dot in a badge).

## 17. Checklist

- [ ] D1 confirmed or changed by the user; A1 to A26 and the answer of D1 written in `docs/ui/usability.md` on `frontend-plan` before commit 4
- [x] The answers of S1b (A1 to A9) are in `usability.md` (2026-11-03)
- [x] The wireframe in `docs/ui/wireframes/`, unchanged, with the notes for the build in section 1.2
- [ ] S1b.2 merged; this plan checked again against `main`: the paths and the names of sections 7 and 8, `widgetControls`, `messageMarks`, `fieldsView`, `x-ui-role-field`, `ItemKeyLine`, `useItemPage`, `PageLink` with `className`
- [ ] The server repository follows the schemas, the data shape (the participants with `item_id`) and the line of the analyst prompt of commit 1 (the user)
- [ ] Commits 1 to 7, each checked
- [ ] The S1c plan updated: `renderItemKey` on an avatar card, and its peek without `ItemOrigin`
- [ ] Each row of section 10 checked once in `pnpm dev:mock` (one dev server, one page at a time, stopped after): the interview with the student and its participant that opens PER-001, the personas of the mentor platform, the profile page of PER-001, the interview and the personas of the library project, the interview at a message from `?item=`
- [ ] The description of the PR written from this plan; it calls no new endpoint
