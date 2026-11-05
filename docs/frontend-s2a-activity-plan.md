# Frontend S2a: the activity of a project, with its progress, its outline, the chat and one prompt for every start of work

The plan of S2a of the [Frontend implementation plan](frontend-implementation-plan.md): Activity, the first feature of the activity bar, with the progress of the work and the outline of the chat in its side panel, and the chat in its tab, where the user reads what the agents did, sends a message and answers a review. It comes after S1 (S1a to S1e) and before [S2b](#15-left-for-the-next-prs), the review bar of a document, which reuses the answer form of S2a. Written from [Prompt: create a frontend feature or widget plan](prompt-create-frontend-feature-plan.md), checked against `main` at `3d87b5e` (#60) and against the S1 stack, which is not merged yet: `feat/fe/edit-artifacts` at `ebf11bc` (S1b.2) and `feat/fe/document-layouts` at `9711007` (S1e). S2a reads parts that the stack adds: `PageLink` of the frame, `RouteParam.Item` with the `?item=` address of a document, `useScrollToItem` of the document page, and, from the [S1c plan](frontend-s1c-item-peek-plan.md), `usePeekedItem` of `@/shared/routes`. Every path and name below is the one of `main` or of those commits; once S1d merges, the plan is checked again against `main`. When the code differs from what this plan says (a name, a path, a signature), the agent stops and reports the difference instead of choosing.

The layout was sketched by the user on 2026-11-05: [the progress and the chat](ui/wireframes/s2a-activity-progress-and-chat.png) and [the outline](ui/wireframes/s2a-activity-outline.png). The sketches are rough, made from library demos: section 1.2 maps each part of them to the data that the API gives, and lists what they do not draw and what changes in their design; decision 2 says how to build from them.

Short paths: `activity/...`, `thread/...`, `review/...`, `run/...`, `artifact/...`, `workflow/...`, `project/...`, `documents/...`, `design-system/...` are under `frontend/src/modules/`; `shared/...`, `mocks/...`, `test/...`, `app/...` under `frontend/src/`; `tests/screenshots/...` is `frontend/tests/screenshots/...`; `lint/...` is `frontend/lint/...`.

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

S2 of the implementation plan held the activity and the review bar of a document. It splits into two plans (D9): S2a, this plan, the activity; S2b, the review bar of a document, after it. S2a is a docs PR, S2a.D, then five stacked PRs of the code: a maintenance PR that removes the first chat, the entities of the six modules that the activity reads, the components of the design system and the shared prompt, the two actions, then the widgets with their route. Each PR is based on the branch of the one before, and its base changes to `main` once that one merges.

| PR | Branch | Title | Based on |
|---|---|---|---|
| S2a.D | `docs/fe/activity` | `docs(api): give an answered review the decision that answered it` | `main` |
| S2a.0 | `chore/fe/maintenance-before-activity` | `chore(frontend): remove the first chat and the start of a run that the API lacks, and share the scroll to an anchor` | `main`, once S1d is merged |
| S2a.1 | `feat/fe/activity-entities` | `feat(frontend): read the progress of the stages, the work of a run, the decision of a review and the thread of the activity` | S2a.0, once S2a.D is merged |
| S2a.2 | `feat/fe/prompt-input` | `feat(frontend): add the stepper, the timeline and the trace, and one prompt input for every prompt that starts work` | S2a.1 |
| S2a.3 | `feat/fe/send-message-and-answer` | `feat(frontend): send a message with the settings of the run it starts, and answer a review` | S2a.2 |
| S2a.4 | `feat/fe/activity` | `feat(frontend): show the activity of a project, its progress and its outline in the side panel and the chat in its tab` | S2a.3 |

| | |
|---|---|
| Needs | S1 merged (S1a to S1e): `PageLink` and its `className` (S1b.0, `df16caa`), `RouteParam.Item` and `useScrollToItem` (S1b), `ContentFieldInput` and the edit features (S1b, not read by S2a but by S2b), `usePeekedItem` with `togglePeek` (S1c.2), the `Avatar` tones (S1e, not read). E4, E5, E6 and P7 merged (they are): the run, review and thread entities, `StopRunButton` and the one `StopRunDialog` mounted by `ProjectRunStatusItem`. S2a.D merged before S2a.1 |
| After it | S2b (the review bar of a document): mounts `AnswerReviewForm` of `review/features/answer` at the bottom of a document under review and of its item pages; counts the edited items with `useEditedItems`. S3 (Search): the command palette gains nothing from S2a. S6 (Workflow): Try again on a failed run (`run/features/retry`) joins the work entry of a failed step |
| Docs-first | The decision of an answered review is a field of the API that the docs do not have: S2a.D adds it (decision 5); the server repository follows it. The answers A1 to A12 and the answers of D1 to D12 go to `docs/ui/usability.md` on `frontend-plan` (5.7 and 7.7) before commit S2a.4/1, which shows the screen. Web App Modules, Web App and the mocks README change in the docs commit of S2a.4 |

Answers of the user (2026-11-05), from the two sketches and the request that came with them, each built by the decision named:

| # | Question | Answer | Built by |
|---|---|---|---|
| A1 | What the side panel of Activity holds | Sections that collapse and expand, two of them: Progress and Outline | Decisions 28, 29 |
| A2 | How Progress looks | A vertical stepper of the reui library (`pnpm dlx shadcn@latest add @reui/c-stepper-43` as the model): the stages, with the open one showing its tasks | Decisions 7, 29 |
| A3 | The marks of the stepper | Solid icons, or icons without a background: no box around them | Decision 7 |
| A4 | How Outline looks | A timeline: each message cut to one line; its time shows on hover, under the title | Decision 30 |
| A5 | What the middle shows | A chat layout | Decisions 31, 32 |
| A6 | How the work of the agents shows in the chat | The trace component of the library (`pnpm dlx shadcn@latest add @reui/c-trace-5` as the model), with variants and colors of its own | Decisions 7, 33 |
| A7 | How a review shows in the chat | A card with its question and its options as buttons, as "Apply 3 changes to production?" with Deny and Apply | Decisions 26, 34 |
| A8 | The prompt of the chat and the prompt of a new project | One frame, a template, for both; each place passes its own actions under it and renders them differently for now (whether they become one component is decided later) | Decisions 8, 24 |
| A9 | Settings of the prompt | A setting opens from below the prompt box, as part of the whole prompt component, then shows as a large dialog, if a setting fits there | Decisions 8, 25 |
| A10 | Components | The components are installed from the libraries already; compose them and pass the content in. No new component drawn with CSS from scratch, so that nothing leaves the design system | Decision 2 |
| A11 | The sketches | A rough layout: map each part to the data that the API gives, and add the data that is needed where it fits | Section 1.2; decisions 5 (the decision of a review), 12 (the work of a run), 19 (the subjects of a stage) |
| A12 | Icons noted on the sketch | `FilesIcon` for documents, `WorkflowIcon` or `SplineIcon` for traceability, `RotateCcwClockIcon` for history; solid icons, no box | Decision 28, D1 |

Questions for the user. Each has the proposal that this plan builds; the user confirms or changes it before commit S2a.4/1:

| # | Question | Proposal built here |
|---|---|---|
| D1 | The icon of Activity on the activity bar | `RotateCcwClockIcon`, the history icon of the sketch: the feature shows what happened. Documents keeps `FilesIcon`; Trace (S4) takes `WorkflowIcon` |
| D2 | What Outline lists, and in which order | The messages of the thread (of the user, of the agents and of the app), the newest at the top, as the sketch draws. A click scrolls the chat to the message. The reviews and the work stay out: Progress shows them |
| D3 | The color of the dot of an Outline row | The tone of its author, never a tone of a status: the user `primary`, the agents `chart`, the app `neutral` |
| D4 | What a work line of the chat says | The title of its stage, then its subject when it has one ("Interviewing: Student"); at the right, the time it took and the counts of the items it created and changed ("+12 ~1"); it expands to those items, each its key and its title, a link. A running line shimmers and has Stop; a failed line is in the destructive tone. The developer view adds the node and the cost |
| D5 | How a review reads in the chat | A card: the prompt of the checkpoint; the documents under review as links; the questions, filled with their default answers; the options as buttons, the approving one primary, the others outline. An option that needs feedback opens a feedback box in the card with Send and Cancel. Once answered, the card turns into one line: "Answered: Accept", or "Answered with the default: Approve" when the run did not pause |
| D6 | The row under the prompt of the chat | At the left, "Run settings", shown while the next message starts a run: a large dialog with the reviews, the limits and the parameters of that run. At the right, while a run is unfinished, when the message will be read. The `+` (attach), the voice input, the model, the effort and "Project" of the sketch are not built: the API has no upload or voice input, and the models of a run belong to `llm-model`, which `thread` may not read |
| D7 | The row under the prompt of a new project | None in S2a: Enter opens the dialog that creates the project, which holds its settings, as today. The frame is shared, the row stays empty |
| D8 | A project with no run, such as one whose idea was not sent | The chat shows its empty state above the prompt, which takes the focus; sending creates the thread when there is none. Progress says that the work has not started; Outline that there is no message |
| D9 | Scope | Two plans: S2a, the activity (six PRs, this plan); S2b, the review bar of a document, after it |
| D10 | The decision of an answered review | A new field of the API, `decision` on a resolved interrupt (S2a.D), so that the card says which option was taken |
| D11 | The marks of the stages | Icons without a box, in the tone of the status: done a check in a circle (`success`), in progress a spinning ring (`primary`), waiting for you a circle with an exclamation mark (`warning`), failed a circle with a cross (`destructive`), stopped a circle with a square (`neutral`), not started the number of the stage in muted text |
| D12 | The tasks under a stage | The work done in the stage, one row per agent step or per subject (one row per interviewed persona), and the subjects not started yet, muted, as the sketch draws the pending tasks |

### 1.1 Sketches

The project of the API examples, run 3 of the mentor thread, waiting at the analysis review. `(v)` done, `(o)` in progress, `(!)` waiting for you, `[ ]` a button, `>` a collapsed and `v` an open section or stage.

```text
+--------------------------------------------------------------------------------------------+
| khoai / Mentor platform v          [ Search or run a command   Ctrl+K ]               (NT) |
+--------+---------------------------------+-------------------------------------------------+
|  [H]   | Activity                        | [Activity] x                                    |
|Activity| v Progress                      +-------------------------------------------------+
|        |  (v) Planning the interviews  > |  -------- 6 October 2026, 08:30 --------        |
|  [D]   |  (v) Proposing the intervie...> | > Try a design that suits both the student     |
|Documents|  (v) Finalizing the intervi...>|   and the admin.                         You   |
|        |  (v) Interviewing             v |  o Planning the interviews          9s   +1    |
|  [S]   |      | (v) Student         24   |  o Proposing the interviewees      18s   +3    |
| Search |      | (v) Mentor          18   |  o Interviewing: Student         2m 10s  +24  v|
|        |      | (v) Admin           20   |  ...                                            |
|  [T]   |  (v) Analysing the intervie...> |  o Analysing the interviews        31s +24 ~1  |
| Trace  |  (!) Reviewing the analysis     |  Analyst                                        |
|        |      [ Open review ]            |  The student and the admin disagree on who      |
|        |   7  Writing the specification  |  approves a booking, see CONF-001.             |
|        |   8  Reviewing the specification|  Requirements analysis, version 4               |
|        |   9  Writing the user stories   | +---------------------------------------------+ |
|        |  10  Verifying the documents    | | (!) Review the requirements analysis.        | |
|        |  11  Finished                   | |     Accept it, or reject it with feedback.  | |
|        | v Outline                       | |     Requirements analysis, version 4        | |
|        |  * 6 Oct 2026                   | |  [ Reject and re-analyse ]                  | |
|        |    Try a design that suits b... | |  [ Reject and re-interview ]   [ Accept ]   | |
|        |  * 2 Oct 2026                   | +---------------------------------------------+ |
|        |    The requirement specificat...| +---------------------------------------------+ |
|        |  * 2 Oct 2026                   | | > Ask or request a change              [^] | |
|  [*]   |    I want to build an online ...| +---------------------------------------------+ |
|Settings|                                 |  Will be read after you answer the review.     |
+--------+---------------------------------+-------------------------------------------------+
| (!) Waiting for you: Reviewing the analysis                                                |
+--------------------------------------------------------------------------------------------+
```

A work line expanded (a click on its chevron):

```text
 o Analysing the interviews                                   31s   +24 ~1   v
     + REQ-001  Book a session in a few minutes
     + REQ-002  See which mentors are free this week
     ...
     ~ PER-001  Student
```

While the run works, the running line shimmers, has Stop at its right, and the prompt reads "Will be read after the current step." With no unfinished run, the row under the prompt holds `[ Run settings ]` at the left, and a "Changed" badge beside it once the user set a value for the next run.

The review card after `Reject and re-interview`, an option that needs feedback (as in Usability 7.3):

```text
+-----------------------------------------------------------------------+
| (!) Review the requirements analysis. Accept it, or reject it with    |
|     feedback.                                                         |
|     Requirements analysis, version 4                                  |
|     Reject and re-interview                                           |
|     Feedback (required)                                               |
|     +---------------------------------------------------------------+ |
|     | Ask the student and the admin whether a layered design works. | |
|     +---------------------------------------------------------------+ |
|                                              [ Cancel ]  [ Send ]     |
+-----------------------------------------------------------------------+
```

### 1.2 Notes on the sketches for the build

`docs/ui/wireframes/s2a-activity-progress-and-chat.png` and `s2a-activity-outline.png`. They stay as the user drew them; they are sketches made from library demos, not the design of every part. Read them with the three tables below; where they differ from this plan, this plan wins.

**What each part of the sketches becomes, and the data it reads.**

| Part of the sketch | In S2a | Data |
|---|---|---|
| Top bar, status bar, the bell, the toast "The project is created, but its idea was not sent." | The frame as today; the toast is the one of `useCreateProject` | - |
| "> Progress", a title that collapses | `SidePanelSection` "Progress" | - |
| The phase rows: a check, a number, a chevron (Resolution Planning, Scope Alignment, 3 Implementation) | One row per stage that the user sees, in the order of the definition of the latest run, with its title and the mark of its status (D11); a stage with children or with tasks has the chevron | `useVisibleStages(run.workflow_version)`; `status` and `current_stage` of the run; its steps |
| The tasks of the open phase (Configure Solution with a ring, Connect Systems and the others pending) | The rows of the stage: its work entries, each with the mark of its status, and the subjects of the stage not started, muted (D12) | `useRunSteps`; `groupSteps`; the artifact kinds `one_per_subject` of the definition and the items of their subject kind |
| The bar at the left of the current task | The work entry that runs now | The step with `status: running` |
| "> Outline", a title that collapses | `SidePanelSection` "Outline" | - |
| The timeline rows: a colored dot, a date, "Completed Beta Program" | One row per message, the newest at the top (D2): the dot in the tone of the author (D3), the date, the first line of the message cut to one line, and the time under it on hover and on focus | `useThreadMessages`: `author`, `content`, `created_at` |
| The trace lines "Refreshed state for 42 resources 11s" and "Planned 3 changes +1 ~1 -1" with its list | A work entry (D4) | The steps: `stage`, `agent_role`, `subject_item_id`, `status`, `started_at`, `finished_at`, `produced`, `usage.cost_usd` |
| The rows "Create", "Update", "Destroy" with their icons | The items of a work entry: a plus for an item created (`version` 1), a pencil for an item changed. `produced` holds no deleted item, so no trash row | `produced` (ItemRef) |
| The card "Apply 3 changes to production? Destroys ... [Deny] [Apply]" | A review entry (D5) | The interrupts of the run: `prompt`, `options`, `questions`, `review_artifacts`, `status`, `decision` (S2a.D) |
| The prompt "How can I help you today?" | The prompt of the chat on the shared `PromptInput`, "Ask or request a change" | `POST /threads/{thread_id}/messages` |
| `+` and the voice buttons in the box | Not built (D6) | - |
| The row under the box: "Project v", "Opus 5.5 Medium Manual" | "Run settings" at the left, the delivery hint at the right (D6) | `run_config` of the body of the message; `active_run_id` of the thread; `status` of the run |
| The empty page "Activity is not built yet" with the toast | A project with no run (D8) | `useActivityThread`, `useLatestRun` |
| The notes on the icons | Activity takes `RotateCcwClockIcon` (D1) | - |

**What the sketches do not draw.** Build these from the rows of section 10 and from the components as they are:

| Part | Where it is settled |
|---|---|
| The messages of the user and of the agents in the chat, with the mark of their author and the delivery of a message of the user | Decisions 31, 32; Usability 5.7 |
| The documents and the items that a message names, as links | Decision 32 |
| The separator that starts each run, with its date and time | Decision 31 |
| The feedback box, the questions and the line of an answered review | Decisions 26, 34 |
| Stop on a running line | Decision 33 |
| The large dialog of the run settings | Decision 25 |
| The loading, empty and error states of each section and of the chat | Section 11 |
| The developer view: the node names, the costs, the run numbers | Decisions 29, 31, 33 |
| The focus, the keys, a target entry with its ring | Section 10 |
| The dark theme | The tokens of the app; nothing of its own |
| A narrow window | The frame of S1c: the side panel gives way |

**What changes in the design of the sketches.**

| In the sketch | In the build |
|---|---|
| The demo of `c-stepper-43` with a frame around it and Previous and Next | The stepper alone, in the side panel; no frame, no Previous and Next: the run moves the stages, not the user |
| The marks of the phases: a filled circle with a check or a number | Icons without a box (A3, D11): the indicator of the stepper gains the variant `ghost` (decision 7) |
| The demo of `c-trace-5` with its own icons (refresh, list, plus, pencil, trash) | One mark per work entry, the icon of its status; the items take a plus or a pencil |
| The card of the demo as an `Item` with Deny and Apply | The same `Item variant="outline"`, with the options of the checkpoint, the approving one primary (Usability 4: "the approving option is the only primary button") |
| The dots of the timeline in five colors | Three tones, by author (D3) |
| "How can I help you today?" | "Ask or request a change" (Usability 5.7) |
| `+`, the voice input, "Project v", the model, the effort and "Manual" | Not built; "Run settings" and the delivery hint (D6) |
| The class strings, the colors, the sizes and the spacing | Not a spec: the components of the design system with their props (decision 2) |
| The handwritten notes, the dark frame around the screens | Not part of the app |

## 2. What was read

| Source | What it gave this PR |
|---|---|
| The two sketches and the request of 2026-11-05 | A1 to A12; the questions D1 to D12 |
| `docs/ui/usability.md` (`frontend-plan`) 4, 5.1, 5.2, 5.7, 7.3, 7.7, 8, 9, open points 13 and 14 | Activity first on the bar; the side panel with the stages as a tree, marked as the run goes, with `Open review` on a stage that waits; the entries of the chat (work done, finding, document, review, message of the user with "Will be read after the current step"); no bubbles and no avatars; Stop next to the progress line; one primary action; the user words (review, document, interviewee) |
| `docs/ui/skeletons.md` 3, 4 | The chat of the developer view: one line per step or group with the keys it produced and its duration; the review with its options and the feedback box |
| `docs/architecture/web-app.md` 2, 3 (visible stages), 4, 5, 9 | The stages as a tree, internal ones dropped, the current one marked and open; the progress of a run from its steps and events; one review panel built from the pending interrupt, with buttons, feedback, questions by type, edits sent as `modified_items` |
| `docs/architecture/web-app-modules.md` 1, 2, 5, 6, 9 | `activity` beside `project`, reading `workflow`, `artifact`, `run`, `review`, `thread`; the widgets `steps` (now `panel`) and `chat`; `thread/features/send-message`, `review/features/answer`; links between entities through `@x` |
| `docs/API.md` threads and messages, runs, interrupts, resume, 6 (event stream), 7 (flows) | `POST /threads/{id}/messages` with `content`, `run_config`, `models`, never refused for an unfinished run; the steps with `produced`; the pending interrupt; the resume body and its rules; the fields "Added" of each event (`step_id`, `stage`, `agent_role`, `status`, `message_id`, ...); `project_named`; replay from `last_event_id`. No body gives the option that answered a review |
| `docs/DATA_SHAPE.md` 6 | Thread, Message (`delivery`), Run, RunStep, RunEvent, Interrupt, HumanDecision, the stages of version 1 (`intent_routing` internal, `done` titled "Finished"), the agent roles |
| `docs/architecture/runtime.md` 5 | A message during a run waits for the next safe point; an interrupted run takes no message until the review is answered |
| `frontend/CONTRIBUTING.md` | Dialogs mounted once with a pending action store; toasts; a hook never in a component file; one exported component per file |
| `git show origin/feat/fe/artifacts-backup:frontend/src/modules/activity/widgets/chat/...` (P7) | `ActivityEntry` (a full width entry with a small mark, the fill of the user, actions under it), `RunEntry`, `CopyEntryAction`, `entryAuthorNames`; started its runs with `useStartRun` |
| `git show origin/feat/fe/mock:frontend/src/features/review/...` | `review-form.utils.ts` (default option, initial answers, the problems of an answer, the resume body), `QuestionField.tsx`, `ChoiceList.tsx`, `review.schema.ts` |
| `activity/widgets/chat/*`, `run/features/start/*`, `run/entities/runs/runs.api.ts` (`createRun`), `run/entities/events/*` | The first chat on `main` starts runs with `POST /threads/{thread_id}/runs`, which the API lacks, and folds the token text with `useRunStream`; its route shows a placeholder |
| `run/entities/*`, `thread/entities/*`, `review/entities/*`, `workflow/entities/stages`, `checkpoints`, `definition`; `project/entities/run-status/*`, `project/features/create/*` | What section 6 reuses; `useVisibleStages`, `groupSteps`, `listenToRun`, `useRunStatusEvents`, `useArtifactsInProgress`, `usePendingInterrupt`, `threadsByAttention` (in `@x/project` only), `sendFirstMessage`, `NewProjectPrompt` and its focus store |
| `shared/components/frame` (index, `SidePanel`, `SidePanelSection`, `useEditorTab`, `useOpenPage`), `shared/components/ui` (`message-scroller`, `marker`, `item`, `questionnaire`, `input-group`, `copy-button`, `colored-text`, `spinner`), `shared/lib` | Section 6 |
| reui.io registry: `c-stepper-43`, `stepper`, `timeline`, `c-trace-5`; ui.shadcn.com: `trace` | The examples are blocks (`components/examples/c-*.tsx`, a `Pattern` without props) built on the primitives `@reui/stepper` (`Stepper`, `StepperItem`, `StepperTrigger`, `StepperIndicator`, `StepperTitle`, `StepperDescription`, `StepperSeparator`, `StepperNav`, `StepperPanel`, `StepperContent`, on `@base-ui/react`), `@reui/timeline` (`Timeline`, `TimelineItem`, `TimelineHeader`, `TimelineDate`, `TimelineTitle`, `TimelineIndicator`, `TimelineSeparator`, `TimelineContent`) and `trace` of shadcn (`Trace`, `TraceLine` with `status` `running`, `error`, `pending`, `TraceIcon`, `TraceTitle`, `TraceDescription`, `TraceCollapsible`, `TraceCollapsibleTrigger`, `TraceCollapsibleContent`). The reui primitives install to `components/reui/` |
| Skills `feature-sliced-design` (with `references/cross-import-patterns.md`, `references/layer-structure.md`), `clean-review` | Each rule in the module of its object; composition from the layer above (the widgets give the routes and the run to the features); a table by value instead of a branch on a name; no helper with one user in shared code |

### 2.1 What S2a takes from the PRs before it

| Before | Built, or planned | Rule for S2a |
|---|---|---|
| The first chat on `main` (R1): `ChatPage`, `useChat`, `AssistantMessage`, `useStartRun`, `createRun` | Calls `POST /threads/{thread_id}/runs`, which the API lacks; folds the tokens of one run into text | S2a.0 removes them; the chat sends messages and reads what is stored (decision 9) |
| The chat of P7 in its backup | `ActivityEntry` with marks by author, `CopyEntryAction` written by hand, `useActivity` with turns kept in `useState` | The row keeps its shape as `ActivityRow` (decision 31); the copy is `CopyButton` of `shared/components/ui`; the entries are read from the server, never kept in a state |
| The implementation plan, section 5: "`EntryAuthor` of the new chat reads `Message['author']`" | - | No `EntryAuthor`: the looks of an author are `messageAuthorLooks` of `thread/entities`, keyed by `MessageAuthor` (decision 15) |
| S1b: the target of a document, `?item=` with `useScrollToItem` in `documents/widgets/document` | Built in `feat/fe/edit-artifacts` | The chat has the same need: the scroll moves to `shared/lib/viewport` as `useScrollToAnchor` (decision 6), and the chat reads `?entry=` |
| S1c plan: "S2 adds the chat and the review bar, and with them `openPeek`" | Planned | S2a adds `openPeek` to `usePeekedItem` and uses it for the keys of a message (decision 32) |
| S1b plan: "S2 lists the edited items in the answer of the review" | Planned for the review bar | The answer of S2a sends the items that `itemStatus` reads as `edited` in the documents under review (decisions 19, 26) |
| The review form of `feat/fe/mock` | `validateReview` by hand, `ChoiceList` with its own keys, `editedItems` from `updated_by` and `version > 1` | The schema of the form checks the answers; `Questionnaire` replaces `ChoiceList`; the edited items come from `itemStatus` (decision 26) |

## 3. Decisions

The behavior on the screen of each component is in section 10; a decision that sets a behavior points to its row there.

### Placement and how to build

1. **What goes where.** Each piece sits in the module of its object, at the lowest layer that may hold it. `activity` may import `workflow`, `artifact`, `run`, `review` and `thread` (`moduleImports`); its entities read them through an `@x/activity.ts` file of each, its widgets through their `index.ts`.

   | Piece | Where | Why |
   |---|---|---|
   | The stepper, the timeline, the trace; the indicator without a box, the tone of a trace line and of a timeline dot | `shared/components/ui/` | Components of the libraries, without a product object |
   | `PromptInput`, `isSubmitKey` | `shared/components/prompt/` | No product object; two users in S2a: the prompt of a new project and the prompt of the chat |
   | `useScrollToAnchor` | `shared/lib/viewport/hooks/` | No product object; two users: the document page and the chat |
   | The fields of the run events; `runProgressEvents`; `useRunProgressEvents` | `run/entities/events/` | The stream of a run is the run's |
   | `WorkEntry`, `workEntries`; `StageStatus`, its labels and looks, `useStageStatusLook`; `StageProgress`, `stageProgress`, `useStageProgress`; `useReloadRunSteps` | `run/entities/steps/` | Reading rules of the steps of a run; the hook joins the stages (`workflow`) and the subjects (`artifact`), both under `run` |
   | `agentRoleLabels`, `useAgentRoleLabels` | `workflow/entities/definition/` | The words of the agent roles of a definition |
   | `StageSubject`, `useStageSubjects` | `artifact/entities/items/` | The items that the stages of a definition work on, one artifact each |
   | `editedItems`, `useEditedItems` | `artifact/entities/status/` | Beside `itemStatus`, which says `edited` |
   | `messageAuthorLabels`, `messageAuthorLooks`, `useMessageAuthorLook`; `messageDeliveryNote`; `messageHeadline`; `hasUnfinishedRun`; `useReloadThreadMessages` | `thread/entities/` | Looks and rules of a message and a thread |
   | `InterruptDecision`; `interruptStatusLooks`, `useInterruptStatusLook`; `decisionOption`; `useReloadRunInterrupts` | `review/entities/` | Rules and looks of an interrupt |
   | `useActivityThread`; `ActivityEntry`, `runEntries`, `useRunEntries`; `entryAnchorId`; `useActivityStream` | `activity/entities/` (new) | The activity is a subject of its own above `thread`, `review` and `run` (Web App Modules 9): its entries join the messages, the work and the reviews of a run |
   | Send a message: the mutation, the prompt, the dialog of the run settings, its stores | `thread/features/send-message` | The action adds a message to a thread |
   | Answer a review: the mutation, the form, its schema and rules | `review/features/answer` | The action resolves an interrupt |
   | Stop | `run/features/stop`, unchanged | The one `StopRunDialog` of the layout |
   | The side panel with Progress and Outline; the item of the activity bar | `activity/widgets/panel` | A block of the frame |
   | The chat in its tab | `activity/widgets/chat` | Objects next to actions: the entries, Send, Answer, Stop |
   | The dialog of the run settings, mounted once | `activity/widgets/dialogs` | Every dialog is mounted once by a `...Dialogs` widget |
   | The page of the route, the destinations and the contributions of the layout | `app/(project)/projects/[projectId]/` | Where the screens are placed |
   | The fields of the stream, the decision, more messages, the scenario of a run with questions | `mocks/` | The mock serves the API |

2. **The sketches are sketches; build with the design system** (answers A10, A11). They give the layout: what shows, in which order, in which component. They do not give the classes, and they do not draw every part (section 1.2):
   - reuse the components of `shared/components/ui` and their props (`variant`, `color`, `size`, `status`) before any class; the classes that this plan names are the few that place the parts (a gap, a width, a truncation), and a block that a component already spaces gets none;
   - change the classes inside a shared component only where this plan says so (decision 7), never to match a pixel of a sketch;
   - no new color, no new token, no hand-drawn shape: every color is a tone of `shared/lib/tone` or a token, read through the props of the components (`color` of `TraceLine`, `TimelineIndicator`, `Marker`, `Badge`, `Button`, `ColoredText`);
   - where a sketch and this plan differ (section 1.2), this plan wins; where neither says, follow the component as it is.

3. **No code reads a stage, a node, an agent role, an option or a kind by its name** (D0 of Usability). The stages come from `stages` of the definition of the run, the titles from the definition and the schemas, the options from the interrupt. Every value with a fixed set is looked up in a table keyed by that value, `as const satisfies Record<Value, ...>`, never tested with `if (status === 'waiting')`, a `switch` or a default branch, so that a new value fails to compile until each table has its row:

   | Value | Table | Where |
   |---|---|---|
   | `StageStatus` | `stageStatusLabels`, `stageStatusLooks` | `run/entities/steps/` |
   | `WorkStatus` | `workStatusLooks` (the `status` of `TraceLine` and the mark), `workStatusLabels` | `run/entities/steps/` |
   | `MessageAuthor` | `messageAuthorLabels`, `messageAuthorLooks` | `thread/entities/` |
   | `MessageDelivery` with the status of the run | `messageDeliveryNotes` | `thread/entities/` |
   | `InterruptStatus` | `interruptStatusLabels` (exists), `interruptStatusLooks` | `review/entities/` |
   | `ActivityEntry['type']` | `entryViews` | `activity/widgets/chat/components/RunActivity.tsx` |
   | `ProgressRow['type']` | `progressRowViews` | `activity/widgets/panel/components/ProgressSection.tsx` |
   | `QuestionType` | `questionInputs` | `review/features/answer/components/QuestionField.tsx` |

   Section 16 has the grep that checks it.

4. **The links between the modules.** No new module import (`moduleImports` lets `activity` read the five modules it reads, and `run` read `workflow` and `artifact`). The `@x` files:

   | File | Gains | Read by |
   |---|---|---|
   | `workflow/entities/@x/run.ts` | `useVisibleStages`, `type VisibleStage` | `useStageProgress` |
   | `workflow/entities/@x/artifact.ts` | Nothing: it gives `useWorkflowDefinition`, `useArtifactKinds`, `kindSchemasByKind` and `itemTitle` already | `useStageSubjects` |
   | `workflow/entities/@x/review.ts` | `questionAnswerSchema`, `type CheckpointOption` | `interruptDecisionSchema`, `decisionOption` |
   | `artifact/entities/@x/run.ts` | `useStageSubjects`, `type StageSubject` | `useStageProgress` |
   | `thread/entities/@x/activity.ts` (new) | `useProjectThreads`, `threadsByAttention`, `useThreadMessages`, `useReloadThreadMessages`, `type Thread`, `type Message` | `useActivityThread`, `useRunEntries`, `useActivityStream` |
   | `run/entities/@x/activity.ts` (new) | `useThreadRuns`, `useRunSteps`, `useReloadRunSteps`, `useRunProgressEvents`, `workEntries`, `type Run`, `type WorkEntry` | `useRunEntries`, `useActivityStream` |
   | `review/entities/@x/activity.ts` (new) | `useRunInterrupts`, `useReloadRunInterrupts`, `type Interrupt` | `useRunEntries`, `useActivityStream` |
   | `workflow/entities/@x/activity.ts` (new) | `useVisibleStages`, `type VisibleStage` | `useRunEntries` (the titles of the stages, and which ones the user sees) |
   | `artifact/entities/@x/activity.ts` (new) | `useStageSubjects` | `useRunEntries` (the title of a subject) |

   The widgets of `activity` and the features read the `index.ts` of the entities they use; section 7 lists what each index gains.

### The API (S2a.D)

5. **An answered review gives its decision** (D10). `docs/API.md`, Runs: the interrupt body gains `decision`, null while `status` is `pending` or `cancelled`, else `{ "option": string | null, "feedback": string | null, "answers": object, "decided_by": UUID | null, "decided_at": datetime }`, the HumanDecision that resolved it; `decided_by` is null when the run took the defaults without asking. The example of the pending interrupt shows `"decision": null`; a second example shows a resolved interrupt of the persona review with `"decision": { "option": "approve", "feedback": null, "answers": {}, "decided_by": "11b7...", "decided_at": "2026-10-06T08:32:03Z" }`. `docs/DATA_SHAPE.md`, Interrupt: a derived, read only `decision` (HumanDecision?), "the decision that resolved it, given with the interrupt so that a client shows which option was taken". The server repository follows it. S2a.D changes docs only, from `main`, merged before S2a.1, as S1e.D was.

### Shared code (S2a.0, S2a.2)

6. **`useScrollToAnchor(anchorId, { isReady })`** (`shared/lib/viewport/hooks/useScrollToAnchor.ts`, S2a.0): the body of `useScrollToItem` of S1b with the id of the element as its parameter: once `isReady`, it scrolls the element with that id to the middle (`scrollIntoView({ block: 'center' })`) and gives it the focus; again when the id changes; nothing for null or a missing element. `useScrollToItem` is removed: the document page calls `useScrollToAnchor(targetItemId === null ? null : itemAnchorId(targetItemId), { isReady: true })`.

7. **Three components of the libraries, and the changes inside them** (answers A2, A3, A6; S2a.2).
   - `components.json` gains `"registries": { "@reui": "https://reui.io/r/{name}.json" }`. Then `pnpm dlx shadcn@latest add trace @reui/stepper @reui/timeline`, answering No to every question that would overwrite a file that exists (`button`, `collapsible`). The reui files land in `src/shared/components/reui/`: move them to `src/shared/components/ui/stepper.tsx` and `timeline.tsx` (plain `mv`, they are new) and delete the empty folder. `trace.tsx` lands in `ui/`; its `IconPlaceholder` becomes `ChevronRightIcon` of `lucide-react` (the CLI does it for the icon library of `components.json`; check that no `IconPlaceholder` is left). The examples `@reui/c-stepper-43` and `@reui/c-trace-5` are not installed: their sources at `https://reui.io/r/c-stepper-43.json` and `https://reui.io/r/c-trace-5.json` are read for how they compose the primitives.
   - `StepperIndicator` gains `variant`: `solid` (the default, the classes as installed) and `ghost` (no fill, no border: `bg-transparent` and the color of the text around it), with `data-variant`, as `Badge` and `Button` name their fills. The ghost indicator holds what the caller gives: an icon in a `ColoredText` of a tone, or a number.
   - `TraceLine` gains `color?: Tone`: `toneClasses[color]` and `data-color` on the line, and its `TraceIcon` takes `text-(--tone)` when the line has a color, as `Marker` colors its icon. Its `status` stays as installed (`running` shimmers the title, `error` takes the destructive text, `pending` fades).
   - `TimelineIndicator` gains `color?: Tone`: the dot takes `bg-(--tone)` from `toneClasses[color]`, and the muted fill of the install without it.
   - Nothing else of the three files changes. Each gets a card on the design system page (`StepperCard`, `TimelineCard`, `TraceCard` in `design-system/widgets/showcase/components/cards/`), with sample data in `design-system.fixtures.ts`, and a row in the shared code table of `frontend/CONTRIBUTING.md`.

8. **One prompt for every prompt that starts work** (answers A8, A9; S2a.2). `PromptInput` (`shared/components/prompt/PromptInput.tsx`) is the frame that `NewProjectPrompt` has today, made shared: a `form` holding the `InputGroup` with the fill of a card, the `>` mark, `InputGroupTextarea`, the send button (an arrow up in a tooltip, `Button size="icon"`), and the keys for assistive technology; then the row under the box, the `footer`, which each place fills with its own actions (A8: they differ for now). It holds no product word: each place gives its words.
   - Enter sends, Shift+Enter adds a line, nothing is sent while a composition is open (`isSubmitKey` of `prompt-input.utils.ts`, a pure rule tested by data); a blank text is never sent; while `isPending` the arrow is disabled and shows `Spinner`.
   - The text is controlled by the place (`value`, `onValueChange`), which keeps it while a request is sent and clears it on success.
   - `size`: `comfortable` (three rows, the prompt of a new project) or `compact` (one row that grows with the text, the chat; Usability 5.7: "one line high until the user types").
   - `NewProjectPrompt` keeps its heading, its state, `useProjectPromptFocus` and its words, and renders `PromptInput` with `size="comfortable"` and no footer (D7). Its tests stay green unchanged.

### Removed (S2a.0)

9. **The first chat goes.** `activity/widgets/chat/` of `main` (`ChatPage`, `useChat`, `AssistantMessage`, `chat.types.ts`, tests), `run/features/start/` (`useStartRun`), `createRun`, `createRunResponseSchema` and `CreateRunResponse` (`run/entities/runs/`), the mock handler of `POST /threads/{thread_id}/runs` when there is one (`GET` stays), and `useRunStream` with the state part of `run-events.reducer.ts` (`RunStreamState`, `initialRunStreamState`, `applyRunEvent`, read by `useRunStream` only). The file keeps `parseRunEvent` and `isTerminal`, pure helpers: it is renamed `run-events.utils.ts` with `git mv`, in a commit of its own, with its test and data. The route of the activity keeps its placeholder until S2a.4.

### Entities (S2a.1)

10. **The run events carry the fields of the API.** `runEventSchemas` (`run/entities/events/run-events.types.ts`) parse every field of section 6 of the API, "Fields today" and "Added":
    - `node_start`: `node`, `step_id`, `agent_role` (nullable), `stage`, `iteration`, `persona_key` (nullable);
    - `node_end`: `node`, `step_id`, `status` (`succeeded`, `failed`, `skipped`), `usage` (`runUsageSchema`);
    - `token`: `node`, `text`, `step_id`; `tool_call`: `node`, `tool`, `args`, `step_id`;
    - `artifact_created`: `artifact_id`, `name`, `version`, `kind`; `artifact_delta`: `artifact_id`, `delta`, `version`, `item_id` (nullable), `item_key` (nullable), `change` (`item_created`, `item_updated`, `item_deleted`, `artifact_updated`);
    - `message_delivered`: `message_id`, `step_id`, `node`; `project_named`: `step_id`, `project_id`, `name` (new type);
    - `interrupt`: `node`, `step_id`, `payload` (`{ interrupt_id, prompt, options, questions, allow_edits, review_artifacts }`, the schemas of `review` cannot be read by `run`: `payload` stays `z.unknown()`, and the activity reloads the interrupts instead of reading it);
    - `error`: `message`, `code`, `stage`; `done`: `status` (`succeeded`, `failed`, `cancelled`).
    The mock stream sends them in the same commit (section 12), and the data of the tests that build events gets them. An event that misses a field is dropped by `parseRunEvent`, as today.

11. **The events that change what a run did** (`runProgressEvents` of `run-events.constants.ts`: `node_start`, `node_end`, `interrupt`, `message_delivered`, `error`, `done`). `useRunProgressEvents(run, onChanged)` (`events/hooks/useRunProgressEvents.ts`) follows the stream of an unfinished run after the `last_event_id` it had when loaded, as `useRunStatusEvents` does, and calls `onChanged` after each of those events; the calls of a burst share one (`coalescedTask`), a connection that fails for good calls it too, and the cleanup sets `isClosed` so that a call in progress reports nothing. It reads nothing itself: the activity gives what to reload (decision 23).

12. **The work of a run.** `workEntries(steps, run)` (`steps/work-entries.utils.ts`) gives the lines of the work: `groupSteps(steps)` (consecutive steps on one subject in one stage join), keeping only the entries whose steps have an `agent_role` (a checkpoint or a control node does no work that the user reads; the review shows as its interrupt). Each `WorkEntry`:
    - `id`: the id of its first step, `steps`, `stage`, `node` (of its first step), `subjectItemId` (null for a step on no subject), `subjectKey` (the key of `groupSteps`, or null);
    - `status`: `WorkStatus`, from its last step: `failed` when it failed; `running` when a step runs, `waiting` instead when the run is `interrupted`; else `done`;
    - `startedAt` (its first step), `durationMs` (from the first `started_at` to the last `finished_at`; null while a step runs), `costUsd` (the sum of `usage.cost_usd`);
    - `created` and `changed`: the items of `produced`, each once by `item_id` at its last version, `created` when the first version that the steps produced is 1, else `changed`.

13. **The status of a stage** (D11). `stageStatuses = ['not_started', 'running', 'waiting', 'done', 'failed', 'stopped']`. `stageProgress(stages, { steps, run, subjects })` (`steps/stage-progress.utils.ts`) gives a `StageProgress` for each stage of the tree of `useVisibleStages`, in its order:
    - the current stage is `run.current_stage` when the user sees it, else the stage of the latest step that the user sees (an internal stage such as `intent_routing` gives way to the one before it, as the status bar does);
    - the current stage takes the status of the run: `queued` and `running` give `running`, `interrupted` gives `waiting`, `failed` gives `failed`, `cancelled` gives `stopped`, `succeeded` gives `done` (a table `stageStatusOfRun`, `Record<RunStatus, StageStatus>`);
    - any other stage with steps is `done`, without steps `not_started`;
    - a stage with children takes the status of the child that needs the user most, in the order `waiting`, `failed`, `running`, `stopped`, `done`, `not_started` (`stageStatusesByAttention`); all children `not_started` give `not_started`;
    - `number`: its place among the stages of its level, from 1;
    - `rows` (D12): its work entries (`workEntries` of the steps of that stage), each with the title of its subject from `subjects` (else its `subjectKey`, else null), then, when the stage works on subjects (`subjects` has the stage), each subject without a work entry of the stage, as `{ type: 'subject', subject }`;
    - `isOpen`: true for the current stage and the stages that hold it (Web App 3: "it opens when it holds the current stage").
    A run that is null gives every stage `not_started`. Looks: `stageStatusLooks` (`steps/stage-status-look.constants.ts`): `done` `success` `CircleCheckIcon`; `running` `primary` (the mark is `Spinner`); `waiting` `warning` `CircleAlertIcon`, `needsUser`; `failed` `destructive` `CircleXIcon`, `needsUser`; `stopped` `neutral` `CircleStopIcon`; `not_started` `neutral`, no icon (the number shows). Labels: `stageStatusLabels` (`steps/stage-status.constants.ts`), section 11. `useStageStatusLook(status)` gives the look with its label in the view of the app, as `useRunStatusLook` does. `workStatusLooks` gives each `WorkStatus` the `status` of `TraceLine` (`traceStatus`: `running` for `running`, `error` for `failed`, none for `waiting` and `done`), its tone and its icon (`running` `primary`, the mark is `Spinner`; `waiting` `warning` `CirclePauseIcon`; `done` `success` `CheckIcon`; `failed` `destructive` `XIcon`), and `workStatusLabels` its words for assistive technology ("In progress", "Waiting for you", "Done", "Failed"; the developer view "Running", "Waiting for review", "Done", "Failed"). `useWorkStatusLook(status)` (`steps/hooks/useWorkStatusLook.ts`) gives the look with its label; the widgets read the two hooks, never the tables.

14. **`useStageProgress(run, projectId)`** (`steps/hooks/useStageProgress.ts`) joins `useVisibleStages(run?.workflow_version)`, `useRunSteps(run.id)` and `useStageSubjects(projectId, run?.workflow_version)`, and gives `StageProgressResult`: `{ state: 'pending' }`, `{ state: 'error', retry }` when the stages or the steps fail (the subjects failing leaves them out), `{ state: 'success', stages: StageProgress[] }`; with a null run, `success` with the stages of nothing (the panel shows its empty state, D8). `useReloadRunSteps()` (`steps/hooks/useRunStepQueries.ts`) gives the function that loads the steps of a run again (`runStepKeys.ofRun(runId)`).

15. **The words and the looks of a message** (`thread/entities`):
    - `messageAuthorLabels` (`messages.constants.ts`, `Record<MessageAuthor, Wording>`): `user` "You", `agent` "Agents", `system` "Update", the same in both views; `messageAuthorLooks` (`message-look.constants.ts`): `user` `primary` `ChevronRightIcon`, `agent` `chart` `DotIcon`, `system` `neutral` `InfoIcon`. `useMessageAuthorLook(author)` gives both. A message of an agent shows the label of its `agent_role` instead of "Agents" (`useAgentRoleLabels`, decision 18) when the definition has it.
    - `messageDeliveryNote(message, runStatus)` (`messages.utils.ts`): the note under a message of the user, from `messageDeliveryNotes`: `pending` while the run is `interrupted` "Will be read after you answer the review.", `pending` otherwise "Will be read after the current step.", `undelivered` "Not read: the work ended before this message.", `started_run` and `delivered` none. The run status picks between the two notes of `pending` through a table keyed by `RunStatus`.
    - `messageHeadline(content)`: the first line of the content that holds text, trimmed; the Outline cuts it to one line with CSS.
    - `hasUnfinishedRun(thread)` (`threads.utils.ts`): `active_run_id !== null`; the next message starts a run when it is false.
    - `useReloadThreadMessages()` (`hooks/useMessageQueries.ts`): loads the messages of a thread again.
    - `sendFirstMessage(projectId, body, idempotencyKey)` takes the whole `SendMessageBody` instead of `content`, so that the first message of a project created without a thread sends its run settings too; `useCreateProject` passes `{ content: idea }`.

16. **The thread of the activity.** `useActivityThread(projectId)` (`activity/entities/hooks/useActivityThread.ts`): the threads of the project (`useProjectThreads`), and the first of `threadsByAttention`, the thread whose latest run needs the user most, the one the status bar shows; `ActivityThreadResult`: `pending`, `error` with `retry`, `success` with `thread: Thread | null` (null for a project without a thread). Every thread of a project fits the first page today, as `useProjectRunResult` says.

17. **The decision of a review, and its look** (`review/entities`, after S2a.D). `interruptSchema` gains `decision: interruptDecisionSchema.nullable()` (`InterruptDecision`: `option`, `feedback`, `answers`, `decided_by`, `decided_at`). `decisionOption(interrupt)` (`interrupts.utils.ts`): the option of `interrupt.options` whose key is `decision.option`, or null. `interruptStatusLooks` (`interrupt-look.constants.ts`): `pending` `warning` `CircleAlertIcon`, `resolved` `success` `CircleCheckIcon`, `cancelled` `neutral` `CircleStopIcon`; `useInterruptStatusLook(status)` gives the look and the label of `interruptStatusLabels`. `useReloadRunInterrupts()` (`hooks/useInterruptQueries.ts`) loads every query of the interrupts of a run again (`interruptKeys.ofRun(runId)`).

18. **The labels of the agent roles** (`workflow/entities/definition`). `agentRoleLabels(definition)` (`workflow-definition.utils.ts`): a `Map` of the `label` of each agent role by its key. `useAgentRoleLabels(version)` (`definition/hooks/useAgentRoleLabels.ts`) reads it through `useDefinitionQuery`, for the version of the run that wrote the message.

19. **The items of a review and the subjects of a stage** (`artifact/entities`).
    - `editedItems(items)` (`status/item-status.utils.ts`): the items whose `itemStatus` is `edited` (changed by the user and still draft). `useEditedItems(artifactIds)` (`status/hooks/useEditedItems.ts`): the first page of the items of each artifact (`useQueries` with `listArtifactItems(artifactId, null, outlinePageSize)`, as `useProjectItemsOfKinds` does for the kinds), combined into `editedItems`. Its key is a new `itemKeys.firstOfArtifact(artifactId)` (`[...itemKeys.lists(), 'artifact-first', artifactId]`), beside `firstOfProject`: `itemKeys.ofArtifact` holds the pages of `useArtifactItems`, another shape of data, and the two may not share a key. It starts with `itemKeys.lists()`, so that every change of an item that loads the lists again loads it too.
    - `useStageSubjects(projectId, version)` (`items/hooks/useStageSubjects.ts`): for each artifact kind of the definition whose `per_project` is `one_per_subject`, the items of its `subject_item_kind` (`useProjectItemsOfKinds`), each a `StageSubject` (`id`, `key`, `title` from `itemTitle` of its kind schema), by the `stage` of that artifact kind: `ReadonlyMap<string, StageSubject[]>`. In version 1, `interviewing` gives the personas.

20. **The entries of a run** (`activity/entities`). `ActivityEntry` is a message, a work entry or a review, each with its `id` (the id of the message, of the first step, of the interrupt) and its `time` (`created_at`, `startedAt`, `created_at`). `runEntries({ messages, work, interrupts, stageTitles, subjects, view })` (`activity-entries.utils.ts`):
    - a work entry gets `stageTitle` (from `stageTitles`, the stages that the user sees) and `subjectTitle` (from `subjects`, else its `subjectKey`); in the user view, a work entry of a stage that the user does not see is left out; the developer view keeps it with `stageTitle` null;
    - the entries are in the order of `time`; at the same time a message comes first, then a work entry, then a review.
    `useRunEntries(run, messages, projectId)` (`hooks/useRunEntries.ts`) joins `useRunSteps(run.id)`, `useRunInterrupts(run.id)`, `useVisibleStages(run.workflow_version)`, `useStageSubjects(projectId, run.workflow_version)` and `useView()`, and gives `RunEntriesResult`: `pending`, `error` with `retry` (the steps or the interrupts failed), `success` with `entries`. No hook polls: the stream of decision 23 loads them again.

21. **The messages of each run.** `messagesByRun(messages)` (`activity-entries.utils.ts`): the messages of the thread by `run_id`, each list in the order of `sequence`; the messages without a run under `null`, shown before the first run.

22. **The anchor of an entry.** `entryAnchorId(entryId)` (`activity-entries.utils.ts`): `entry-<id>`, the `id` of the element of an entry in the chat, which `?entry=` scrolls to.

23. **The activity follows the stream of its latest run** (`useActivityStream(run, threadId)`, `activity/entities/hooks/useActivityStream.ts`): `useRunProgressEvents(run, reload)`, where `reload` loads again the steps of the run (`useReloadRunSteps`), its interrupts (`useReloadRunInterrupts`) and the messages of the thread (`useReloadThreadMessages`). The latest run itself loads again through `useLatestRun`, which polls while the run is unfinished, and through the stream that `ProjectRunStreams` of the layout follows already. As `useWritingArtifacts` of `documents` does, each module keeps its own reload; the activity says only when.

### Features (S2a.3)

24. **Send a message** (`thread/features/send-message`, answer A8; rows in section 10).
    - `useSendMessage({ projectId, thread })` (`hooks/useSendMessage.ts`): a mutation that sends `{ content, run_config }` with a new idempotency key for each submit (`newIdempotencyKey`): to `sendMessage(thread.id, ...)`, or, for a project without a thread, `sendFirstMessage(projectId, ...)`. `run_config` is the settings that the user chose for the next run (decision 25), sent only when `hasUnfinishedRun(thread)` is false and they are not empty. On success: the settings of the thread are cleared, and the messages of the thread, the thread (`threadKeys.all()`) and its runs (`runKeys.ofThread`, `runKeys.latestOfThread`) load again; the stream of the new run then follows. On failure: a toast with `errorMessageOf`, the text stays in the prompt. A message is never refused because a run is unfinished (API), so nothing is disabled for it.
    - `SendMessagePrompt({ projectId, thread, run })` (`components/SendMessagePrompt.tsx`; `thread` and `run` may be null, and a null thread has no unfinished run): `PromptInput size="compact"` with the words of `sendMessageMessages`; its `footer`: at the left `RunSettingsButton` (a local component: `Button variant="ghost" size="xs"` with `SlidersHorizontalIcon` and "Run settings", a `Badge variant="soft"` "Changed" beside it when settings are chosen), shown while `hasUnfinishedRun(thread)` is false; at the right the note of `messageDeliveryNotes` for a `pending` message under the status of `run`, while the thread has an unfinished run (D6). It keeps its text in `useState`, clears it on success, and takes the focus when the activity has no entry (D8).
    - The models of the message (`models`) are not offered: `thread` may not read `llm-model` (section 15).

25. **The settings of the next run, in a large dialog** (A9, D6). `RunSettingsDialog` (`components/RunSettingsDialog.tsx`), mounted once by `ActivityDialogs`, opened by `RunSettingsButton` through its store (`run-settings-dialog.store.ts`, `createPendingActionStore()`, the target is the id of the thread; hooks `useOpenRunSettingsDialog` and `useRunSettingsDialog` in `hooks/useOpenRunSettingsDialog.ts`). A `Dialog` with `DialogContent className="max-h-dialog grid-rows-header-body sm:max-w-2xl"`, the title and the description of `sendMessageMessages.settings`, a `Form` (react-hook-form, `runDefaultsFieldsSchema`, starting from the settings chosen for that thread through `runDefaultsFieldValuesOf`, else `noRunDefaultsFieldValues`) with `RunDefaultsFields` (`legend`, `checkpoints` and `parameterFields` of `useRunSettingsOptions()`), and the buttons Reset, Cancel and Apply. Apply stores `toRunDefaults(values, parameterFields)` for the thread (`next-run-settings.store.ts`: `settingsByThread`, `chooseSettings(threadId, settings)`, `clearSettings(threadId)`; `isRunDefaultsEmpty` clears), closes, and shows no toast. Nothing is sent until the message: a field left empty takes the value of the project, then of the user (RunDefaults of the API).

26. **Answer a review** (`review/features/answer`, A7, D5; rows in section 10). Copied from `feat/fe/mock` with these changes:
    - `answer-review.utils.ts` (from `review-form.utils.ts`): `defaultOption`, `initialAnswers` as they are, over `CheckpointOption` and `InterruptQuestion`; `problemWith` becomes `answerProblem(question, answer)`, which returns an `AnswerProblem` (`{ type: 'chooseOne' }`, `{ type: 'chooseAtLeast'; count }`, `{ type: 'chooseAtMost'; count }`, `{ type: 'writeAnswer' }`, `{ type: 'enterNumber' }`, `{ type: 'explainChoice'; label }`) instead of a sentence, and the schema writes it with the function of `answerReviewMessages.problems` of its type; `validateReview` goes (the schema checks); `editedItems` goes (decision 19); `buildResumeBody` becomes `resumeRunBody(interrupt, values, modifiedItems)`, which gives `ResumeRunBody` of `review/entities`; `modifiedItemsOf(items)` maps the edited items to `ModifiedItem`, and gives none when the interrupt does not allow edits.
    - `answer-review.schema.ts` (from `review.schema.ts`): `answerReviewFormSchema(interrupt)`, a zod object `{ option: string | null, feedback: string, answers: Record<string, QuestionAnswer> }` with a `superRefine` that reports at `feedback` and at `answers.<key>` the problems of `answerProblem` and the feedback that a chosen option requires.
    - `useAnswerReview(run)` (`hooks/useAnswerReview.ts`): the mutation `resumeRun(run.id, body, newIdempotencyKey())`; on success, a toast "Your answer is sent." (`actionToastDuration`), and the interrupts of the run, the run (`runKeys.all()`), the artifacts and the items (`artifactKeys.all()`, `itemKeys.all()`, since an approving option approves them) load again; on failure, a toast with `errorMessageOf`, and the interrupts load again (a `409 invalid_state` means another tab answered).
    - `useAnswerReviewForm(interrupt, run)` (`hooks/useAnswerReviewForm.ts`): the form with its schema and the initial answers, the option that waits for its feedback (`pendingOption`, set by an option that requires feedback, cleared by Cancel), `chooseOption(option)` (submits at once an option that needs no feedback; else opens the feedback), and the edited items (`useEditedItems` of the artifacts under review).
    - `AnswerReviewForm({ interrupt, run })` (`components/AnswerReviewForm.tsx`): the questions (`QuestionField` each), the options as buttons, the feedback box (`FormField` of `shared/components/form`, `name="feedback"`, whose control is a `Textarea` of four rows; `TextField` is one line) with Cancel and Send, the options as `PendingButton` (`pending` on the one clicked, `pendingLabel` "Sending the answer"); `QuestionField` (`components/QuestionField.tsx`, from the backup) draws a question by its type with the parts of `Questionnaire` (`QuestionnaireItem`, `QuestionnaireTitle`, `QuestionnaireChoices` with `type` radio or checkbox, `QuestionnaireChoice`, `QuestionnaireInput`, `QuestionnaireError`) through `questionInputs`, keyed by the type of the question; `ChoiceList` is not copied.
    - The prompt of the review, its documents and its decision are drawn by the review entry of the chat (decision 34), and by the review bar of S2b; the form is only the answer.

27. **Stop** is `StopRunButton` of `run/features/stop`, given the latest run, on the running work line (decision 33). It opens the one `StopRunDialog` that `ProjectRunStatusItem` mounts; nothing of the feature changes.

### Widgets (S2a.4)

28. **Activity on the activity bar** (`activity/widgets/panel/activity-frame.config.tsx`, A12, D1): `activityDestination(projectId)`: `{ id: 'activity', label: 'Activity', icon: <RotateCcwClockIcon />, href: routes.project(projectId).activity(), panel: <ActivityPanel projectId={projectId} /> }`, first in the `destinations` of the project layout. `ActivityPanel` is a `SidePanel` titled "Activity" holding two `SidePanelSection`s, "Progress" and "Outline", both open at first (A1). It reads `useActivityThread(projectId)` and the latest run of that thread (`useLatestRun`), and gives them to the sections.

29. **Progress** (`ProgressSection`, A2, A3, D11, D12; row in section 10): `useStageProgress(run, projectId)` drawn as `Stepper orientation="vertical"` with a `StepperItem` per stage (`step` its place in the list, `completed` for `done`, `loading` for `running`), each a `StepperTrigger` (it opens and closes the rows of the stage, as in `c-stepper-43`) with a `StepperIndicator variant="ghost"` (the icon of `useStageStatusLook` in a `ColoredText` of its tone, `Spinner` for `running`, the number for `not_started`), a `StepperTitle` (the title; muted for `not_started`) and, for a stage that waits for the user, `Button size="xs" variant="soft" color="warning"` "Open review", which opens the chat at the pending review (its id from `usePendingInterrupt(run.id, { runStatus: run.status })` of `review/entities`; the button waits for it). The open rows sit in a `Collapsible` under the trigger, a vertical `Stepper` of their own with one item per row, through `progressRowViews`: a work row is its mark (`useWorkStatusLook`), its title (the subject title, else the agent role label; the developer view the node) and its count of steps in `text-3xs` (a group); a click opens the chat at that work entry. A subject row is muted, `CircleDashedIcon`, its title. The row that runs has `aria-current="step"` and the left border of the sketch (`border-l-2 border-primary`). A stage with children nests its children the same way.

30. **Outline** (`OutlineSection`, A4, D2, D3; row in section 10): `useThreadMessages(thread.id)`, newest first, drawn as `Timeline` with a `TimelineItem` per message: `TimelineIndicator color={look.tone}` (`useMessageAuthorLook`), `TimelineDate` (`formatDate`), `TimelineTitle` holding a button (`Button variant="ghost" size="sm"`, the width of the row, `justify-start`) with `messageHeadline(content)` in a `span` with `truncate`; under it, the time (`formatDateTime`) in `text-3xs text-muted-foreground`, hidden until the row is under the pointer or holds the focus (`opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100`), and always read by assistive technology. A click opens the chat at the message.

31. **The chat** (`ActivityPage({ projectId })`, A5; rows in section 10). The tab: `useEditorTab({ id: 'activity', title: 'Activity', href })`, the icon of the feature. The page reads `useActivityThread`, then, with a thread, `useLatestRun`, `useThreadRuns`, `useThreadMessages` and `useActivityStream`. It draws `MessageScroller` (`MessageScrollerViewport`, `MessageScrollerContent` in `mx-auto max-w-3xl px-4`, `MessageScrollerButton` to the end) with the messages without a run, then a `RunActivity` per run, the oldest first, each in a `MessageScrollerItem` (the last one `scrollAnchor`); under the scroller, `SendMessagePrompt` in the same width. `?entry=` (`RouteParam.Entry`, read by `useActivityTarget`) scrolls to its entry with `useScrollToAnchor(entryAnchorId(target), { isReady })` once its run has loaded.
    - `RunActivity({ run, messages, projectId, latestRun })`: `useRunEntries`; a `Marker variant="separator"` first, with the date and time of its first entry (`formatDateTime`), and "Run 3" before it in the developer view; then each entry through `entryViews` (`message`: `MessageEntry`, `work`: `WorkEntryView`, `review`: `ReviewEntry`), each inside `ActivityRow`. Its own loading (`LoadingState size="compact" rows={3}`) and error (`ErrorState size="compact"` with Try again) in its place: a run that fails to load does not hide the others, and an `ErrorBoundary` of `react-error-boundary` wraps each run.
    - `ActivityRow({ id, mark, tone, author, actions, isFilled, children })` (`components/ActivityRow.tsx`, from `ActivityEntry` of the backup): full width, the mark at its start in a `ColoredText` of its tone (hidden from assistive technology), the label of its author in `sr-only`, the content in `text-sm leading-6`, the actions under it (shown on hover and focus, always on a touch screen), the fill `bg-muted` for the user (`data-filled`), `id={entryAnchorId(id)}`, `tabIndex={-1}`, `data-target` when the address names it, `data-[target]:ring-2 data-[target]:ring-ring`.

32. **A message** (`MessageEntry`): the user: its text (`whitespace-pre-wrap`), filled, the note of `messageDeliveryNote` under it in `text-xs text-muted-foreground`, the action `CopyButton` (`display="icon"`, `size="icon-xs"`). An agent: the label of its agent role in `text-xs font-semibold text-muted-foreground`, then `Markdown` of its content, then its `artifact_refs` (each a `PageLink` to `routes.project(projectId).document(artifactId)`: its title, and ", version 4" in muted text) and its `item_refs` (each a `Button variant="ghost" size="xs"` with the key in `font-mono text-xs`, `aria-label` "Quick look at REQ-001", which calls `openPeek(itemId)` of `usePeekedItem`); the action `CopyButton`. The app (`system`): its text, muted, without action.

33. **A work entry** (`WorkEntryView`, A6, D4): `Trace` with a `TraceCollapsible` when it created or changed an item, else a plain `TraceLine`:
    - `TraceLine status={look.traceStatus} color={look.tone}`, the look of `useWorkStatusLook(status)`: `TraceIcon` with the icon of its status (`Spinner` while it runs), `TraceTitle` with the title (`stageTitle`, then ": " and `subjectTitle` when it has one; the developer view the node and the key of the subject), `TraceDescription` with `formatDuration(durationMs)` (nothing while it runs), then the counts "+12" and "~1" in `font-mono text-xs` with the label "12 created, 1 changed" for assistive technology; the developer view adds the cost (`formatCurrency`);
    - `TraceCollapsibleTrigger` wraps the line; `TraceCollapsibleContent` lists the items, created first, each a `TraceLine` with `PlusIcon` or `PencilIcon` in its `TraceIcon`, the key (`font-mono text-xs`) and the title as a `PageLink` to `routes.project(projectId).item(itemId)`;
    - while it runs and it is the last work entry of the latest run, `StopRunButton run={latestRun}` sits at the right of the line (Usability 4: "Stop next to the progress line"); a failed entry shows the `error` of its last step under it, in `text-xs`, destructive.
    The title of an item: `ItemRef` holds no title; the line shows the key, and the title comes from `useStageSubjects` for a subject; for other items the key alone shows until a later PR (section 15).

34. **A review** (`ReviewEntry`, A7, D5): while `pending`, an `Item variant="outline" size="sm"` (`ItemMedia` with the icon of `useInterruptStatusLook` in its tone; `ItemContent` with `ItemTitle` the prompt and `ItemDescription` the documents under review, each a `PageLink` to the document with ", version N"; under them `AnswerReviewForm interrupt run`). Once `resolved`, one line in `ActivityRow` with the success mark: "Answered: " and the label of `decisionOption(interrupt)`, or "Answered with the default: " when `decision.decided_by` is null, the feedback under it when there is one, quoted in muted text. `cancelled`: "Stopped with the run", neutral. The review that a run took with the defaults without pausing shows the same line, since the API lists those interrupts too.

35. **The dialogs** (`activity/widgets/dialogs/ActivityDialogs.tsx`): renders `RunSettingsDialog`; mounted once in `projectContributions` of the project layout.

36. **`'use client'`.** The project layout imports `activity/widgets/panel` (`activityDestination`) and `activity/widgets/dialogs`; every hook that they reach and that imports `useState`, `useEffect`, `useEffectEvent` or `useRef` starts with `'use client'`: `useActivityThread`, `useStageProgress`, `useActivityStream`, `useRunProgressEvents`, `useScrollToAnchor`, `useActivityTarget`, `useAnswerReviewForm`, the hooks of the stores. `useActivityTarget` reads `useSearchParams`, and `ActivityPage` is rendered by the page of its route, not by the layout, so it needs no `Suspense` of the layout; the page wraps it in `<Suspense fallback={null}>`.

### Mock

37. **The mock follows the API** (section 12): the stream sends the fields of decision 10; the interrupts carry `decision`; the mentor thread has a finding of the analyst with an artifact and items, and a message of the user sent during run 3, pending until the review is answered; the library project, running at the interviews, streams its steps.

## 4. Scope

| | |
|---|---|
| Endpoints | `POST /threads/{thread_id}/messages` (send, with `run_config`); `POST /projects/{project_id}/threads` through `sendFirstMessage` (a project without a thread); `POST /runs/{run_id}/resume` (answer); `POST /runs/{run_id}/cancel` (Stop, as today) |
| Queries | `GET /projects/{project_id}/threads`, `GET /threads/{thread_id}/messages`, `GET /threads/{thread_id}/runs`, the latest run, `GET /runs/{run_id}/steps`, `GET /runs/{run_id}/interrupts`, `GET /runs/{run_id}/stream`, `GET /workflow/definition`, `GET /artifact-kinds`, `GET /projects/{project_id}/items?kind=`, `GET /artifacts/{artifact_id}/items` (edited items) |
| Copied | From `origin/feat/fe/artifacts-backup`: `ActivityEntry` as `ActivityRow`. From `origin/feat/fe/mock`: `review-form.utils.ts`, `review.schema.ts`, `QuestionField.tsx`, each changed as decision 26 says |
| Written new | `useScrollToAnchor`; the stepper, the timeline and the trace with their changes; `PromptInput`; the run event fields, `useRunProgressEvents`, `workEntries`, `stageProgress`, `useStageProgress`, the looks of a stage and of a work entry; `agentRoleLabels`; `editedItems`, `useEditedItems`, `useStageSubjects`; the looks and the notes of a message, `messageHeadline`, `hasUnfinishedRun`; the decision of an interrupt and its look; the entities of `activity`; `send-message`, `answer`; the widgets `panel`, `chat`, `dialogs`; the route |
| Not copied | `RunEntry` and `useActivity` of the backup (they follow one run's tokens and keep turns in a state); `CopyEntryAction` and `EntryAction` (`CopyButton` does both); `ChoiceList` (`Questionnaire`); `usePendingReview`, `ReviewLine`, `ReviewCard` and `ReviewPage` of `feat/fe/mock` (old frame) |
| Not built | The review bar of a document (S2b); the models of a run in the prompt; attachments and voice input; `@` mentions and `/` commands; the dot of Activity when entries arrive; a list of several threads; the live text of a node (`token`); Try again on a failed run (S6); the titles of the items in a work line other than subjects |

## 5. Naming

| Part | Rule | Name |
|---|---|---|
| Slices | Feature: the action; widget: the block | `send-message`, `answer`; `panel`, `chat`, `dialogs` |
| Components of an action | `<Verb><Object><Role>` | `SendMessagePrompt`, `RunSettingsDialog`, `AnswerReviewForm` |
| Components of a block | `<Object><Block>` or what it draws | `ActivityPanel`, `ProgressSection`, `OutlineSection`, `ActivityPage`, `RunActivity`, `ActivityRow`, `MessageEntry`, `WorkEntryView`, `ReviewEntry`, `ActivityDialogs`, `QuestionField`, `PromptInput` |
| Local components | What they draw | `RunSettingsButton` (`SendMessagePrompt.tsx`), `WorkRow`, `SubjectRow` (`ProgressSection.tsx`), `OutlineRow` (`OutlineSection.tsx`), `RefLinks` (`MessageEntry.tsx`), `WorkItems` (`WorkEntryView.tsx`), `ReviewDecision` (`ReviewEntry.tsx`) |
| Mutation hooks | `use<Verb><Object>` | `useSendMessage`, `useAnswerReview` |
| Hooks of a form or a dialog | As the prompt names them | `useAnswerReviewForm`; `useOpenRunSettingsDialog`, `useRunSettingsDialog` |
| Stores | `<topic>.store.ts`, `use<Topic>Store` | `run-settings-dialog.store.ts` (`useRunSettingsDialogStore`), `next-run-settings.store.ts` (`useNextRunSettingsStore`: `settingsByThread`, `chooseSettings`, `clearSettings`) |
| Entity hooks | What they give | `useActivityThread`, `useRunEntries`, `useActivityStream`, `useStageProgress`, `useStageStatusLook`, `useWorkStatusLook`, `useRunProgressEvents`, `useAgentRoleLabels`, `useStageSubjects`, `useEditedItems`, `useMessageAuthorLook`, `useInterruptStatusLook` |
| Reload hooks | `useReload<Resource>`, in the `use<Resource>Queries.ts` of the resource | `useReloadRunSteps`, `useReloadThreadMessages`, `useReloadRunInterrupts` |
| Pure rules | Named after what they give; booleans with `is` or `has` | `workEntries`, `stageProgress`, `runEntries`, `messagesByRun`, `entryAnchorId`, `messageHeadline`, `messageDeliveryNote`, `hasUnfinishedRun`, `decisionOption`, `agentRoleLabels`, `editedItems`, `defaultOption`, `initialAnswers`, `answerProblem`, `resumeRunBody`, `modifiedItemsOf`, `isSubmitKey` |
| Types | The object and what it is | `WorkEntry`, `WorkStatus`, `StageStatus`, `StageProgress`, `ProgressRow`, `StageProgressResult`, `StageSubject`, `ActivityEntry`, `RunEntriesResult`, `ActivityThreadResult`, `InterruptDecision`, `AnswerReviewFormValues`, `AnswerProblem` |
| Lists and tables of values | The plural of what they hold | `stageStatuses`, `stageStatusesByAttention`, `stageStatusOfRun`, `stageStatusLabels`, `stageStatusLooks`, `workStatusLooks`, `workStatusLabels`, `runProgressEvents`, `messageAuthorLabels`, `messageAuthorLooks`, `messageDeliveryNotes`, `interruptStatusLooks`, `entryViews`, `progressRowViews`, `questionInputs` |
| Words | `<topic>Messages` in `<topic>.constants.ts`; `PromptInput` has none, since each place gives its words | `sendMessageMessages`, `answerReviewMessages`, `activityPanelMessages`, `activityChatMessages` |
| Route parameter | `RouteParam.<Name>` | `RouteParam.Entry = 'entry'`; `routes.project(id).activity({ entryId })` |
| Destination | `<feature>Destination` | `activityDestination` |
| Props | Named after what they carry | `footer`, `size`, `isPending`, `onValueChange`, `submitLabel`, `keysHint` of `PromptInput`; `variant` of `StepperIndicator`; `color` of `TraceLine` and `TimelineIndicator` |

## 6. Shared code first

### Reuse

| What | From | For |
|---|---|---|
| `SidePanel`, `SidePanelSection`, `useEditorTab`, `useOpenPage`, `PageLink` | `@/shared/components/frame` | The panel, its sections, the tab, the links |
| `MessageScroller`, `MessageScrollerViewport`, `MessageScrollerContent`, `MessageScrollerItem`, `MessageScrollerButton` | `shared/components/ui/message-scroller.tsx` | The chat that keeps its end in view |
| `Marker` (`variant="separator"`) | `shared/components/ui/marker.tsx` | The separator of a run |
| `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions` | `shared/components/ui/item.tsx` | The review card |
| `Questionnaire` parts | `shared/components/ui/questionnaire.tsx` | The questions of a review |
| `InputGroup`, `InputGroupAddon`, `InputGroupTextarea`, `Tooltip`, `Button`, `Badge`, `Spinner`, `Collapsible`, `Dialog` | `shared/components/ui/` | The prompt, the buttons, the marks, the rows, the dialog |
| `CopyButton`, `ColoredText`, `Markdown` | `shared/components/ui/` | Copy an entry; the tone of a mark; the content of an agent |
| `Form`, `FormField` | `@/shared/components/form` | The feedback box (a `Textarea` in a `FormField`), the run settings form |
| `PendingButton`, `Textarea` | `shared/components/ui/` | The options while the answer is sent; the feedback |
| `LoadingState`, `ErrorState`, `EmptyState` | `@/shared/components/state` | The states of each block |
| `toneClasses`, `Tone` | `@/shared/lib/tone` | The tones of the trace and the timeline |
| `useView`, `useWording`, `Wording` | `@/shared/lib/view` | The labels in each view |
| `formatDate`, `formatDateTime`, `formatDuration`, `formatCurrency` | `@/shared/lib/formatters` | The dates, the times, the durations, the costs |
| `coalescedTask` | `@/shared/lib/timing` | The bursts of the stream |
| `pageItems`, `cursorPagesOptions` | `@/shared/api/query-client` | The pages of the lists |
| `newIdempotencyKey`, `errorMessageOf`, `toast`, `actionToastDuration` | `shared/api`, `sonner`, `shared/lib/timing` | The mutations |
| `createPendingActionStore`, `useSetPendingAction`, `usePendingAction` | `@/shared/lib/pending-action` | The dialog of the run settings |
| `routes`, `RouteParam` | `@/shared/routes` | Every address |
| `usePeekedItem` (S1c) | `@/shared/routes` | The keys of a message open the peek |
| `listenToRun`, `useRunSteps`, `useThreadRuns`, `useLatestRun`, `groupSteps`, `runStepKeys`, `runKeys` | `run/entities` | The work and the stream |
| `RunDefaultsFields`, `useRunSettingsOptions`, `runDefaultsFieldsSchema`, `runDefaultsFieldValuesOf`, `noRunDefaultsFieldValues`, `toRunDefaults`, `isRunDefaultsEmpty` | `run/entities` | The run settings dialog |
| `StopRunButton` | `run/features/stop` | Stop on the running line |
| `useProjectThreads`, `threadsByAttention`, `useThreadMessages`, `sendMessage`, `sendFirstMessage`, `messageKeys`, `threadKeys` | `thread/entities` | The thread, the messages, Send |
| `useRunInterrupts`, `resumeRun`, `interruptKeys`, `interruptStatusLabels` | `review/entities` | The reviews, Answer |
| `useVisibleStages`, `useDefinitionQuery`, `itemTitle`, `kindSchemasByKind`, `useArtifactKinds` | `workflow/entities` | Stages, labels, titles |
| `itemStatus`, `useProjectItemsOfKinds`, `itemKeys`, `artifactKeys`, `listArtifactItems` | `artifact/entities` | Edited items, subjects |
| `useProjectPromptFocus` | `project/features/create` | `NewProjectPrompt`, unchanged |

### Extract before new code

| What | Path | Why |
|---|---|---|
| `useScrollToAnchor(anchorId, { isReady })` | `shared/lib/viewport/hooks/useScrollToAnchor.ts`, from `useScrollToItem` of `documents/widgets/document` (S2a.0) | The document page and the chat scroll to their target the same way; `useScrollToItem` holds no product rule once the id is given |
| `PromptInput`, `isSubmitKey` | `shared/components/prompt/`, from `NewProjectPrompt` (S2a.2) | Two users now: the prompt of a new project and the prompt of the chat (A8) |

### Checked, not extracted

| Candidate | Copies | Why it stays |
|---|---|---|
| `ActivityRow` to `shared/components` | One user, the chat | The row of the activity; S2b shows no entry |
| The reload of three lists at the events of a run, in `useActivityStream` | One user | `useWritingArtifacts` reloads other lists for other events; two different joins |
| `RunSettingsDialog` beside the run settings of a new project (`NewProjectForm`) | Two forms that embed `RunDefaultsFields` | They save to different places (the project, the next message) and already share the fields component |
| `useActivityTarget` and `useDocumentTarget` | Two hooks of one line, each reading its own `RouteParam` | A helper over `useSearchParams().get(name)` would name nothing more |
| `messageDeliveryNotes` in the developer view | One wording for both | The delivery reads the same for both |

## 7. Changes to existing modules

| File | What changes | Commit |
|---|---|---|
| `docs/API.md`, `docs/DATA_SHAPE.md` | Decision 5 | S2a.D/1 |
| `activity/widgets/chat/*` (all), `run/features/start/*` (all), `run/entities/runs/runs.api.ts`, `runs.types.ts`, `run/entities/events/hooks/useRunStream.ts` and its test, `run/entities/events/run-events.reducer.ts` and its test and data, `run/entities/index.ts`, `mocks/runs/handlers/runs.handlers.ts` | Decision 9: removed | S2a.0/1 |
| `run/entities/events/run-events.reducer.ts` to `run-events.utils.ts`, its test and data (`git mv`); its importers (`run-event-channels.api.ts`) | Decision 9: renamed | S2a.0/2 |
| `shared/lib/viewport/hooks/useScrollToAnchor.ts` (new) and its test; `shared/lib/viewport/index.ts`; `documents/widgets/document/hooks/useScrollToItem.ts` (removed) and `DocumentPage.tsx` | Decision 6 | S2a.0/3 |
| `run/entities/events/run-events.types.ts`, `run-events.constants.ts`, `hooks/useRunProgressEvents.ts` (new); the test data that build events; `mocks/runs/handlers/run-stream.handlers.ts` | Decisions 10, 11 | S2a.1/1 |
| `run/entities/steps/work-entries.utils.ts`, `stage-progress.types.ts`, `stage-progress.utils.ts`, `stage-status.constants.ts`, `stage-status-look.constants.ts`, `stage-status-look.utils.ts`, `hooks/useStageStatusLook.ts`, `hooks/useWorkStatusLook.ts`, `hooks/useStageProgress.ts` (new); `run-steps.types.ts` (`WorkEntry`, `WorkStatus`); `hooks/useRunStepQueries.ts` (`useReloadRunSteps`); `run/entities/@x/activity.ts` (new); `run/entities/index.ts` | Decisions 12 to 14 | S2a.1/1 |
| `workflow/entities/definition/workflow-definition.utils.ts`, `hooks/useAgentRoleLabels.ts` (new); `workflow/entities/@x/run.ts`; `workflow/entities/@x/activity.ts` (new); `workflow/entities/index.ts` | Decisions 4, 18 | S2a.1/1 |
| `artifact/entities/status/item-status.utils.ts`, `status/hooks/useEditedItems.ts` (new), `items/items.keys.ts` (`firstOfArtifact`), `items/hooks/useStageSubjects.ts` (new), `items/items.types.ts` (`StageSubject`), `artifact/entities/@x/run.ts`, `@x/activity.ts` (new), `index.ts` | Decision 19 | S2a.1/1 |
| `thread/entities/messages.constants.ts` (new), `message-look.constants.ts` (new), `messages.utils.ts` (new), `threads.utils.ts`, `hooks/useMessageQueries.ts`, `hooks/useMessageAuthorLook.ts` (new), `api/threads.api.ts` (`sendFirstMessage`), `@x/activity.ts` (new), `index.ts`; `project/features/create/hooks/useCreateProject.ts` (the new signature) | Decision 15 | S2a.1/2 |
| `review/entities/interrupts.types.ts`, `interrupts.utils.ts` (new), `interrupt-look.constants.ts` (new), `hooks/useInterruptStatusLook.ts` (new), `hooks/useInterruptQueries.ts`, `@x/activity.ts` (new), `index.ts`; `mocks/interrupts/interrupts.fixtures.ts`, `interrupts.changes.ts` | Decision 17 | S2a.1/3 |
| `activity/entities/` (new slice), `lint/lib/file-names/file-kinds.constants.js` when ESLint refuses a kind of the new slice, with its case in `lint/configs/__tests__/configs.test.js` | Decisions 16, 20 to 23 | S2a.1/4 |
| `components.json`; `shared/components/ui/stepper.tsx`, `timeline.tsx`, `trace.tsx` (new); `design-system/widgets/showcase/components/cards/StepperCard.tsx`, `TimelineCard.tsx`, `TraceCard.tsx` (new), `DesignSystemPage.tsx`, `design-system.fixtures.ts`; `package.json` only if the CLI adds a dependency (it should not: `@base-ui/react` and `cn` are there) | Decision 7 | S2a.2/1 |
| `shared/components/prompt/` (new) | Decision 8 | S2a.2/2 |
| `project/features/create/components/NewProjectPrompt.tsx` | Decision 8 | S2a.2/3 |
| `thread/features/send-message/` (new); `mocks/messages/messages.handlers.ts` only if it does not keep `run_config` yet | Decisions 24, 25 | S2a.3/1 |
| `review/features/answer/` (new) | Decision 26 | S2a.3/2 |
| `shared/routes/route-params/route-params.constants.ts` (`Entry`), `project-routes.utils.ts` (`activity({ entryId })`), their tests; `shared/routes/peek/` (`openPeek`, S1c) | Decisions 31, 32 | S2a.4/1 |
| `activity/widgets/panel/` (new) | Decisions 28 to 30 | S2a.4/1 |
| `activity/widgets/chat/` (new), `activity/widgets/dialogs/` (new) | Decisions 31 to 35 | S2a.4/2 |
| `app/(project)/projects/[projectId]/activity/page.tsx`, `layout.tsx` | Decisions 28, 35, 36 | S2a.4/3 |
| `mocks/messages/messages.fixtures.ts`, `mocks/runs/fixtures/runs.fixtures.ts` (steps of the library run), the tests that count them | Section 12 | S2a.1/1 (steps), S2a.1/2 (messages) |
| `tests/screenshots/projects/activity.spec.ts` (new) | Section 12 | S2a.4/4 |
| `docs/architecture/web-app.md`, `docs/architecture/web-app-modules.md`, `frontend/CONTRIBUTING.md`, `frontend/src/mocks/README.md`, `frontend/README.md` | Section 14 | S2a.4/5 |

The files that two commits change: `run/entities/index.ts` (S2a.0/1 removes `createRun`, `useRunStream`; S2a.1/1 adds the new exports), `thread/entities/index.ts` (S2a.1/2 only), `frontend/CONTRIBUTING.md` (the rows of the new UI components in S2a.2/1 and of `PromptInput` in S2a.2/2; the guides otherwise go whole in the docs commit), `app/(project)/projects/[projectId]/layout.tsx` (S2a.4/3 only).

## 8. The slices, file by file

The class strings below are the few that place the parts (decision 2).

### `docs/API.md` and `docs/DATA_SHAPE.md` (S2a.D)

In Runs, under the example of the pending interrupt: the line "The pending interrupt ... The `interrupt` event carries the same fields, with `interrupt_id` for `id`" gains "and without `status`, `created_at`, `resolved_at` and `decision`". The example gains `"decision": null`. A paragraph after it:

```markdown
A resolved interrupt gives its `decision`, the HumanDecision that resolved it: `option`, `feedback`,
`answers`, `decided_by` (null when the run took the defaults because its checkpoint is not in
`review_checkpoints`) and `decided_at`. It is null while the interrupt is pending and for a
cancelled one.
```

with the example of a resolved interrupt of decision 5. `DATA_SHAPE.md`, Interrupt, a row: `decision` | HumanDecision? | "Derived, read-only. The decision that resolved it; null while pending and when cancelled. Given with the interrupt so that a client shows which option was taken".

### `shared/lib/viewport` (S2a.0)

```ts
// hooks/useScrollToAnchor.ts
'use client'
/**
 * Scrolls the element with the id to the middle of its scroll area and gives it the focus, once
 * `isReady`; again when the id changes. Nothing for null, or when no element has the id.
 */
export function useScrollToAnchor(anchorId: string | null, { isReady }: { isReady: boolean }): void
```

### `shared/components/ui` (S2a.2)

```tsx
// stepper.tsx: what changes in the installed file
const stepperIndicatorStyles = cva('<the classes of the install without the fill>', {
  variants: {
    variant: {
      // The fill of the install: the accent, and the primary once active or completed.
      solid: 'bg-accent text-accent-foreground data-[state=active]:bg-primary ... ',
      // No fill and no border: the icon or the number that the caller gives stands alone.
      ghost: 'bg-transparent text-current',
    },
  },
  defaultVariants: { variant: 'solid' },
})

// trace.tsx
function TraceLine({ status, color, className, ...props }: React.ComponentProps<'span'> & {
  status?: 'running' | 'error' | 'pending' | undefined
  /** Colors the icon of the line; the text keeps its color. */
  color?: Tone | undefined
})

// timeline.tsx
function TimelineIndicator({ color, className, ...props }: React.ComponentProps<'div'> & {
  /** The fill of the dot; the muted fill without it. */
  color?: Tone | undefined
})
```

### `shared/components/prompt` (S2a.2)

```text
shared/components/prompt/
├── PromptInput.tsx
├── prompt-input.utils.ts          isSubmitKey
├── __tests__/
│   ├── PromptInput.test.tsx
│   ├── prompt-input.utils.test.ts
│   └── prompt-input.utils.data.ts
└── index.ts                       PromptInput
```

```tsx
interface PromptInputProps {
  /** The id of the element that names the prompt, such as a heading above it. */
  labelledBy?: string | undefined
  /** The name of the prompt for assistive technology when nothing on screen names it. */
  label?: string | undefined
  value: string
  onValueChange: (value: string) => void
  /** Sends the text, trimmed; never called with a blank text or while `isPending`. */
  onSubmit: (text: string) => void
  /** The name of the send button, in its tooltip and for assistive technology. */
  submitLabel: string
  /** The keys, read by assistive technology only, such as "Enter to send, Shift+Enter for a new line". */
  keysHint: string
  placeholder: string
  /** While the text is sent: the button is disabled and spins. */
  isPending?: boolean | undefined
  /** Three rows for a prompt that starts a project, one row that grows for the chat. */
  size?: 'comfortable' | 'compact' | undefined
  /** The row under the box, filled by the place that holds the prompt: its settings and its notes. */
  footer?: ReactNode
  inputRef?: Ref<HTMLTextAreaElement> | undefined
}

/**
 * The prompt that starts work: a box with the mark of a prompt, the text and a send button, and a
 * row under it for what the place adds. Enter sends, Shift+Enter adds a line.
 */
export function PromptInput(props: PromptInputProps)

// prompt-input.utils.ts
/** Whether a key sends the prompt: Enter without Shift, outside a composition of an input method. */
export function isSubmitKey(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'isComposing'>): boolean
```

The box keeps the classes of `NewProjectPrompt` (the fill of a card, the mark in the padding, `max-h-60`, `leading-relaxed`); `size` sets `rows` (3 or 1) and `min-h-16` or `min-h-9`. The footer is a `div` under the `InputGroup`, `flex items-center justify-between gap-2 px-1 pt-1.5 text-xs text-muted-foreground`, rendered only when given.

### `run/entities` (S2a.1)

```text
run/entities/
├── @x/activity.ts                         new: decision 4
├── events/
│   ├── run-events.types.ts                every field of the API, project_named
│   ├── run-events.constants.ts            + runProgressEvents
│   └── hooks/useRunProgressEvents.ts      new
└── steps/
    ├── run-steps.types.ts                 + WorkEntry, WorkStatus
    ├── work-entries.utils.ts              new: workEntries
    ├── stage-progress.types.ts            new: stageStatuses, StageStatus, StageProgress, ProgressRow, StageProgressResult
    ├── stage-progress.utils.ts            new: stageProgress (stageStatusOfRun, stageStatusesByAttention inside)
    ├── stage-status.constants.ts          new: stageStatusLabels
    ├── stage-status-look.constants.ts     new: stageStatusLooks, workStatusLooks
    ├── stage-status-look.utils.ts         new: stageStatusLook, stageStatusLabel
    └── hooks/
        ├── useRunStepQueries.ts           + useReloadRunSteps
        ├── useStageProgress.ts            new
        ├── useStageStatusLook.ts          new
        └── useWorkStatusLook.ts           new
```

```ts
// run-steps.types.ts
/** What a line of the work of a run is doing: running, paused at a review, done or failed. */
export type WorkStatus = 'running' | 'waiting' | 'done' | 'failed'

/** One line of the work of a run: a step of an agent, or its steps on one subject joined. */
export interface WorkEntry {
  /** The id of its first step, which anchors it in the chat. */
  id: string
  steps: RunStep[]
  stage: string
  node: string
  /** The item that its steps work on, such as the persona of an interview; null without one. */
  subjectItemId: string | null
  /** The key of that item, from what the steps produced; null without one. */
  subjectKey: string | null
  status: WorkStatus
  startedAt: string
  /** Null while a step runs. */
  durationMs: number | null
  costUsd: number
  /** The items that its steps created, each once at its last version. */
  created: ItemRef[]
  /** The items that its steps changed, each once at its last version. */
  changed: ItemRef[]
}

// work-entries.utils.ts
/** The work of a run as lines, in order: the steps of the agents, those on one subject joined. */
export function workEntries(steps: RunStep[], run: Pick<Run, 'status'> | null): WorkEntry[]

// stage-progress.types.ts
export const stageStatuses = ['not_started', 'running', 'waiting', 'done', 'failed', 'stopped'] as const
export type StageStatus = (typeof stageStatuses)[number]

/** A row under a stage: a line of its work, or a subject that it has not worked on yet. */
export type ProgressRow =
  | { type: 'work'; work: WorkEntry; subjectTitle: string | null }
  | { type: 'subject'; subject: StageSubject }

/** A stage of the workflow as far as a run went, with its rows and the stages under it. */
export interface StageProgress {
  key: string
  title: string
  /** Its place among the stages of its level, from 1. */
  number: number
  status: StageStatus
  rows: ProgressRow[]
  /** Whether it starts open: it is the current stage or holds it. */
  isOpen: boolean
  children: StageProgress[]
}

export type StageProgressResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; stages: StageProgress[] }

// stage-progress.utils.ts
/**
 * Every stage that the user sees, with its status from the steps and the run: the current stage
 * takes the status of the run, a stage with steps is done, the others have not started; a stage
 * with children takes the status of the child that needs the user most.
 */
export function stageProgress(
  stages: readonly VisibleStage[],
  input: { steps: RunStep[]; run: Pick<Run, 'status' | 'current_stage'> | null; subjects: ReadonlyMap<string, StageSubject[]> },
): StageProgress[]

// hooks/useStageProgress.ts
/** The stages of the workflow of a run with their progress, their work and their subjects. */
export function useStageProgress(run: Run | null, projectId: string): StageProgressResult

// hooks/useRunStepQueries.ts
/** Loads the steps of a run again. */
export function useReloadRunSteps(): (runId: string) => Promise<void>

// events/hooks/useRunProgressEvents.ts
'use client'
/**
 * Follows the events of an unfinished run after the last event it had when it loaded, and calls
 * `onChanged` after each event that changes what the run did (`runProgressEvents`); the calls of a
 * burst share one, and a connection that fails for good calls it too. Stops after `done`.
 */
export function useRunProgressEvents(
  run: Pick<Run, 'id' | 'status' | 'last_event_id'> | null | undefined,
  onChanged: () => Promise<void> | void,
): void
```

### `workflow`, `artifact`, `thread`, `review` entities (S2a.1)

```ts
// workflow/entities/definition/workflow-definition.utils.ts
/** The label of each agent role of a definition, by its key. */
export function agentRoleLabels(definition: WorkflowDefinition): Map<string, string>
// workflow/entities/definition/hooks/useAgentRoleLabels.ts
/** The labels of the agent roles in a version of the workflow; empty while it loads. */
export function useAgentRoleLabels(version: number | undefined): ReadonlyMap<string, string>

// artifact/entities/items/items.types.ts
/** An item that a stage works on, one artifact each, such as a persona to interview. */
export interface StageSubject { id: string; key: string; title: string }
// artifact/entities/items/hooks/useStageSubjects.ts
/** The items that each stage works on, by the key of the stage; empty while they load. */
export function useStageSubjects(projectId: string, version: number | undefined): ReadonlyMap<string, StageSubject[]>

// artifact/entities/status/item-status.utils.ts
/** The items that the user changed and that are still draft, as `itemStatus` reads them. */
export function editedItems(items: readonly ArtifactItem[]): ArtifactItem[]
// artifact/entities/status/hooks/useEditedItems.ts
/** The edited items of the artifacts given, from the first page of the items of each. */
export function useEditedItems(artifactIds: readonly string[]): ArtifactItem[]

// thread/entities/messages.utils.ts
/** The first line of a message that holds text, trimmed. */
export function messageHeadline(content: string): string
/** The note under a message of the user about when the agents read it; null when there is none. */
export function messageDeliveryNote(
  message: Pick<Message, 'delivery'>,
  runStatus: RunStatus | null,
): Wording | null
// thread/entities/threads.utils.ts
/** Whether a run of the thread has not finished, so that a message joins it instead of starting one. */
export function hasUnfinishedRun(thread: Pick<Thread, 'active_run_id'>): boolean
// thread/entities/hooks/useMessageQueries.ts
/** Loads the messages of a thread again. */
export function useReloadThreadMessages(): (threadId: string) => Promise<void>

// review/entities/interrupts.types.ts
export const interruptDecisionSchema = z.object({
  option: z.string().nullable(),
  feedback: z.string().nullable(),
  answers: z.record(z.string(), questionAnswerSchema),
  /** Null when the run took the defaults without asking. */
  decided_by: z.string().nullable(),
  decided_at: z.iso.datetime(),
})
// review/entities/interrupts.utils.ts
/** The option that answered a review; null while it waits, without options, or once cancelled. */
export function decisionOption(interrupt: Pick<Interrupt, 'options' | 'decision'>): CheckpointOption | null
// review/entities/hooks/useInterruptQueries.ts
/** Loads every query of the interrupts of a run again. */
export function useReloadRunInterrupts(): (runId: string) => Promise<void>
```

`workflow/entities/@x/review.ts` gains `questionAnswerSchema` and `type CheckpointOption`.

### `activity/entities` (S2a.1, new)

```text
activity/entities/
├── activity-entries.types.ts       ActivityEntry, RunEntriesResult, ActivityThreadResult
├── activity-entries.utils.ts       runEntries, messagesByRun, entryAnchorId
├── hooks/
│   ├── useActivityThread.ts
│   ├── useRunEntries.ts
│   └── useActivityStream.ts
├── __tests__/activity-entries.utils.test.ts, activity-entries.utils.data.ts
├── hooks/__tests__/useActivityThread.test.ts, useRunEntries.test.ts, useActivityStream.test.ts
└── index.ts
```

```ts
// activity-entries.types.ts
/** One entry of the chat of a run: a message, a line of work, or a review. */
export type ActivityEntry =
  | { type: 'message'; id: string; time: string; message: Message }
  | {
      type: 'work'
      id: string
      time: string
      work: WorkEntry
      /** The title of its stage; null for a stage that the user does not see (developer view). */
      stageTitle: string | null
      /** The title of its subject, else its key; null without a subject. */
      subjectTitle: string | null
    }
  | { type: 'review'; id: string; time: string; interrupt: Interrupt }

export type RunEntriesResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; entries: ActivityEntry[] }

export type ActivityThreadResult =
  | { state: 'pending' }
  | { state: 'error'; retry: () => void }
  | { state: 'success'; thread: Thread | null }

// activity-entries.utils.ts
/** The entries of a run in the order of their time: a message first, then work, then a review. */
export function runEntries(input: {
  messages: readonly Message[]
  work: readonly WorkEntry[]
  interrupts: readonly Interrupt[]
  stageTitles: ReadonlyMap<string, string>
  subjects: ReadonlyMap<string, StageSubject[]>
  view: View
}): ActivityEntry[]
/** The messages of a thread by the run they belong to, in order; `null` holds those of no run. */
export function messagesByRun(messages: readonly Message[]): ReadonlyMap<string | null, Message[]>
/** The id of the element of an entry in the chat. */
export function entryAnchorId(entryId: string): string

// hooks/useActivityThread.ts
/** The thread that the activity of a project shows: the one whose latest run needs the user most. */
export function useActivityThread(projectId: string): ActivityThreadResult
// hooks/useRunEntries.ts
/** The entries of a run: its messages, its work and its reviews, with the titles of its stages. */
export function useRunEntries(run: Run, messages: readonly Message[], projectId: string): RunEntriesResult
// hooks/useActivityStream.ts
/** Loads the work, the reviews and the messages again as the latest run of the thread goes on. */
export function useActivityStream(run: Run | null | undefined, threadId: string): void
```

`index.ts`: `useActivityThread`, `useRunEntries`, `useActivityStream`, `messagesByRun`, `entryAnchorId`, `type ActivityEntry`.

### `thread/features/send-message` (S2a.3)

```text
thread/features/send-message/
├── components/
│   ├── SendMessagePrompt.tsx        PromptInput + RunSettingsButton (local) + the delivery note
│   └── RunSettingsDialog.tsx
├── hooks/
│   ├── useSendMessage.ts
│   └── useOpenRunSettingsDialog.ts  useOpenRunSettingsDialog, useRunSettingsDialog
├── stores/
│   ├── run-settings-dialog.store.ts
│   └── next-run-settings.store.ts
├── send-message.constants.ts        sendMessageMessages
├── __tests__/ (one per folder)
└── index.ts                         SendMessagePrompt, RunSettingsDialog
```

```ts
// next-run-settings.store.ts
interface NextRunSettingsState {
  /** The settings that the user chose for the run that the next message of each thread starts. */
  settingsByThread: Readonly<Record<string, RunDefaults>>
  chooseSettings: (threadId: string, settings: RunDefaults) => void
  clearSettings: (threadId: string) => void
}

// useSendMessage.ts
/**
 * Sends a message of the user to the thread of the activity, or to a new thread of the project
 * when it has none, with the run settings chosen for a run that it starts. Once sent, the settings
 * are cleared, and the messages, the thread and its runs load again; a failure shows as a toast.
 */
export function useSendMessage(options: { projectId: string; thread: Thread | null }): {
  send: (content: string) => void
  isPending: boolean
}
```

### `review/features/answer` (S2a.3)

```text
review/features/answer/
├── components/
│   ├── AnswerReviewForm.tsx
│   └── QuestionField.tsx
├── hooks/
│   ├── useAnswerReview.ts
│   └── useAnswerReviewForm.ts
├── answer-review.schema.ts
├── answer-review.utils.ts
├── answer-review.constants.ts       answerReviewMessages
├── __tests__/ (one per folder)
└── index.ts                         AnswerReviewForm
```

```ts
// answer-review.utils.ts
/** The option that the form starts with: the default one, else the first; none without options. */
export function defaultOption(options: readonly CheckpointOption[]): CheckpointOption | undefined
/** The answers that the form starts with: the default answer of each question. */
export function initialAnswers(questions: readonly InterruptQuestion[]): Record<string, QuestionAnswer>
/** What is wrong with the answer to a question, with the count or the label that its words name; null when nothing is. */
export function answerProblem(question: InterruptQuestion, answer: QuestionAnswer | undefined): AnswerProblem | null
/** The body that answers the review with the values of the form and the items edited before it. */
export function resumeRunBody(interrupt: Interrupt, values: AnswerReviewFormValues, modifiedItems: ModifiedItem[]): ResumeRunBody
/** The edited items as the resume body names them; none when the review does not take edits. */
export function modifiedItemsOf(interrupt: Pick<Interrupt, 'allow_edits'>, items: readonly ArtifactItem[]): ModifiedItem[]

// AnswerReviewForm.tsx
/**
 * The answer to a review: its questions, filled with their default answers, then its options as
 * buttons, the approving one primary. An option that needs feedback opens the feedback box first.
 */
export function AnswerReviewForm(props: { interrupt: Interrupt; run: Run })
```

### `activity/widgets` (S2a.4)

```text
activity/widgets/
├── panel/
│   ├── activity-frame.config.tsx     activityDestination
│   ├── activity-panel.constants.ts   activityPanelMessages
│   ├── components/
│   │   ├── ActivityPanel.tsx
│   │   ├── ProgressSection.tsx       progressRowViews; WorkRow, SubjectRow (local)
│   │   ├── OutlineSection.tsx        OutlineRow (local)
│   │   └── __tests__/
│   └── index.ts                      activityDestination
├── chat/
│   ├── activity-chat.constants.ts    activityChatMessages
│   ├── components/
│   │   ├── ActivityPage.tsx
│   │   ├── RunActivity.tsx           entryViews
│   │   ├── ActivityRow.tsx
│   │   ├── MessageEntry.tsx          RefLinks (local)
│   │   ├── WorkEntryView.tsx         WorkItems (local)
│   │   ├── ReviewEntry.tsx           ReviewDecision (local)
│   │   └── __tests__/
│   ├── useActivityTarget.ts          the lone hook of the slice
│   └── index.ts                      ActivityPage
└── dialogs/
    ├── ActivityDialogs.tsx
    ├── __tests__/ActivityDialogs.test.tsx
    └── index.ts                      ActivityDialogs
```

```tsx
// activity-frame.config.tsx
/** Activity on the activity bar of a project: the progress and the outline, with the chat in a tab. */
export function activityDestination(projectId: string): FeatureDestination

// RunActivity.tsx: the view of an entry, by its type.
const entryViews = {
  message: MessageEntry,
  work: WorkEntryView,
  review: ReviewEntry,
} as const satisfies Record<ActivityEntry['type'], (props: EntryViewProps) => ReactNode>

// ProgressSection.tsx: the view of a row under a stage, by its type.
const progressRowViews = {
  work: WorkRow,
  subject: SubjectRow,
} as const satisfies Record<ProgressRow['type'], (props: RowViewProps) => ReactNode>

// useActivityTarget.ts
'use client'
/** The entry that the address of the activity names (`?entry=`), or null. */
export function useActivityTarget(): string | null
```

### The route and the layout (S2a.4)

- `activity/page.tsx`: `<Suspense fallback={null}><ActivityPage projectId={projectId} /></Suspense>`, the `projectId` from `params`, as the document page reads it.
- `layout.tsx`: `const destinations = [activityDestination(projectId), documentsDestination(projectId)]`; `projectContributions` gains `<ActivityDialogs />` after `<ProjectDialogs />`; the JSDoc says that the activity bar holds Activity and Documents.

## 9. State and data flow

| State | Where | Name |
|---|---|---|
| The threads, the latest run, the runs, the messages, the steps, the interrupts, the definition, the kinds, the items | The query hooks of the entities, never copied | `useProjectThreads`, `useLatestRun`, `useThreadRuns`, `useThreadMessages`, `useRunSteps`, `useRunInterrupts`, `useVisibleStages`, `useArtifactKinds`, `useProjectItemsOfKinds`, `useArtifactItems` |
| The thread of the activity, the entries of a run, the progress of the stages | Hooks that combine queries, unions with `state` | `useActivityThread`, `useRunEntries`, `useStageProgress` |
| The work lines, the progress rows, the decision, the headline, the note | Pure rules at render | `workEntries`, `stageProgress`, `runEntries`, `decisionOption`, `messageHeadline`, `messageDeliveryNote` |
| The text of the prompt | `useState` in `SendMessagePrompt` (and in `NewProjectPrompt`, as today) | - |
| The settings of the next run of each thread | A store of `send-message`, not persisted | `useNextRunSettingsStore` |
| The run settings dialog | A pending action store, mounted once | `useRunSettingsDialogStore` |
| The option that waits for its feedback, the values of the answer | `useAnswerReviewForm` (react-hook-form, and a `useState`) | `pendingOption` |
| Which stages are open in Progress | The stepper itself (`Collapsible` without state of its own), starting from `isOpen` | - |
| The entry that the chat scrolls to | The address, `?entry=` | `useActivityTarget` |
| The live changes of the latest run | The stream, `useActivityStream`; the run itself through `useLatestRun` and `ProjectRunStreams` | - |
| Whether a send or an answer is pending | The mutation | `isPending` |

Flow. The layout puts Activity first on the bar; a project opens at its activity (`/projects/{id}` redirects there). The panel and the page both read the thread of the activity (one query), then its latest run. Progress loads the stages of the version of the run, the steps (the query that the chat reads too) and the subjects; Outline loads the messages. The chat loads the runs of the thread and, for each run, its steps and its interrupts, each run showing its own loading; meanwhile the prompt is there. While the run works, each event of `runProgressEvents` loads the steps, the interrupts and the messages again (a burst shares one load): a new step appears as a running line that shimmers, the stage moves in Progress, a message read loses its note, a review appears as a card and its stage turns to "Waiting for you". Sending a message adds it at once after the load that follows the answer of the API, with its note; the first message of an idle thread starts a run, whose stream the activity then follows. Answering a review sends the answer, shows a toast, and loads the interrupts, the run and the documents again: the card turns into its line, and the stage goes on.

## 10. Behavior of each component

### Activity bar and side panel

| Component (where) | What it shows; hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| Activity on the activity bar | `RotateCcwClockIcon` with "Activity" under it, first | Clicks it | Shows the side panel of Activity; a second click hides it (the frame); the tab of the chat does not change | As every destination |
| `ActivityPanel` | The title "Activity", then Progress and Outline, each open. Its states: the thread loading (`LoadingState size="compact" rows={4}`), failing (`ErrorState size="compact"` with Try again) | Clicks Try again | Loads the threads again | The title of each section is a button (`SidePanelSection`): Enter or Space collapses it |
| Progress, a stage row (`StepperTrigger`) | Its mark (D11), its title cut with "..." and the full title in its `title` attribute, the chevron when it has rows or children; muted when not started. A stage that needs the user has "Open review" | Clicks the row; Enter or Space; Arrow up and down between rows (the stepper) | Opens or closes its rows; several stages may be open at once. "Open review" opens the chat at the pending review (`routes.project(id).activity({ entryId: interrupt id })`) in the tab of the activity | The rows of the stepper are one Tab stop, the arrows move between them (`role="tablist"` of the stepper); "Open review" is a Tab stop of its own. The status is read after the title ("Interviewing, Done") |
| Progress, a work row | Its mark, its title, its count of steps; the bar at its left while it runs | Clicks it | Opens the chat at that work entry; the entry is scrolled to the middle and marked with a ring | Enter opens it; Tab moves to it |
| Progress, a subject row | Muted, a dashed circle, the title; "Not started" for assistive technology | - | - | Not focusable |
| Progress, its states | Loading (`LoadingState size="compact" rows={5}`); error (`ErrorState size="compact"`, Try again); no run: `EmptyState size="compact"` "The work has not started." | Clicks Try again | Loads the stages and the steps again | - |
| Outline, a message row | The dot in the tone of its author, the date, the first line cut to one line; the time under it on hover and on focus | Clicks it; Enter | Opens the chat at the message: scrolled to the middle, focused, marked with a ring until another entry is named | Tab moves between the rows; the time is read with the row |
| Outline, its states | Loading (`LoadingState size="compact" rows={3}`); error with Try again; no message: `EmptyState size="compact"` "No messages yet." | Clicks Try again | Loads the messages again | - |

### The chat

| Component (where) | What it shows; hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| The tab | "Activity", the icon of the feature; one tab, whatever entry the address names | Clicks it, closes it | As every tab | As every tab |
| `ActivityPage`, its states | The thread loading (`LoadingState`), failing (`ErrorState` with Try again); no message and no run: `EmptyState` "No activity yet" with "Send your idea or a request to start the work.", above the prompt | Clicks Try again | Loads the threads again | With no entry, the prompt takes the focus |
| `MessageScroller` | The runs, the oldest first; the end in view when the page opens and while new entries arrive, unless the user scrolled up; then the button to the end | Scrolls; clicks the button to the end | The button scrolls to the end and hides | The button is a Tab stop while shown |
| The separator of a run | A line with the date and time of its first entry; "Run 3" before it in the developer view | - | - | Not focusable |
| `RunActivity`, its states | Its entries; while they load `LoadingState size="compact" rows={3}` in their place; an error `ErrorState size="compact"` with Try again, the other runs as usual | Clicks Try again | Loads the steps and the interrupts of that run again | - |
| A message of the user (`MessageEntry`) | The `>` mark in the primary tone, the text on the fill of the user, "You" for assistive technology; the note of its delivery under it; Copy under it on hover and focus | Clicks Copy | Copies the text; the button shows "Copied" for two seconds (`CopyButton`) | Copy is a Tab stop; the entry is not, except as a target |
| A message of an agent | The dot in the chart tone, the label of its agent role, the content in Markdown, the documents it names as links, the keys of the items as buttons | Clicks a document; double clicks it; clicks a key | A document opens in the preview tab (`PageLink`), a double click keeps the tab; a key opens the peek of the item (S1c), and a second click on the key of the item peeked does not close it (`openPeek`) | The links and the keys are Tab stops; the key reads "Quick look at REQ-001" |
| A message of the app | Muted text with the info mark | - | - | - |
| A work line (`WorkEntryView`) | The mark of its status in its tone, the title, the duration, "+12 ~1"; shimmering while it runs, destructive when it failed with the error under it; Stop at its right while it is the running line of the latest run | Clicks the line or its chevron; clicks an item; clicks Stop | Expands or collapses its items (closed at first; several may be open); an item opens its page in the preview tab; Stop opens the Stop dialog (P7), which asks before stopping | The trigger is a button, `aria-expanded`; Enter or Space toggles it; the items are Tab stops once open |
| A review card (`ReviewEntry`, pending) | The warning mark, the prompt, the documents under review as links with their version, the questions with their default answers, the options as buttons | Changes an answer; clicks an option | Decision 26 and the rows of the answer below | The first option is the first Tab stop after the questions |
| A review line (resolved or cancelled) | "Answered: Accept", or "Answered with the default: Approve", the feedback under it quoted; "Stopped with the run" | - | - | Not focusable |
| A target entry (`?entry=`) | Its row with a ring | Arrives from Progress, Outline or an address | The page scrolls the entry to the middle once its run has loaded | The row takes the focus (`tabIndex={-1}`); the ring stays while the address names it |

### The answer of a review (`AnswerReviewForm`)

| Component | What it shows; hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| The options | One button per option, in the order of the checkpoint; the approving one `Button` (solid, primary), the others `variant="outline"`; all disabled while the answer is sent, the one clicked with `Spinner` (`PendingButton`) | Clicks an option that needs no feedback | The form checks the questions (on submit, then at each change); with a problem, the first wrong question takes the focus and shows its error; else the answer is sent | Tab moves between the options; Enter or Space clicks |
| An option that needs feedback | As the others | Clicks it | The options give way to the name of the option, "Feedback (required)" and its box, with Cancel and Send | The feedback box takes the focus |
| The feedback box | A text area of four rows | Types; Enter adds a line; Ctrl or Cmd+Enter sends; Escape | Send checks that the feedback holds text (else "Write the feedback." under it, and the focus stays) and sends; Escape and Cancel bring back the options and keep nothing | Cancel gives the focus back to the option that opened the box |
| A question | Its prompt, then by its type: radio choices (`single_select`), check boxes (`multi_select`, with its bounds), a text area (`free_text`), a number input (`number`), filled with its default answer; a choice that requires text shows a text box once chosen | Changes the answer | The problem of the question shows under it after the first submit, at each change | Arrow keys inside a group of choices; Tab between questions |
| After sending | - | - | Success: the toast "Your answer is sent.", the card becomes its line once the interrupts load again; the run goes on. Failure: the toast with the reason, the form keeps its values; on `409` the interrupts load again and the card becomes the line of the answer given elsewhere | The focus goes to the line of the answer (`tabIndex={-1}`) |
| While sending | The options disabled | Leaves the page | The request goes on; its toast still shows | - |

### The prompt of the chat (`SendMessagePrompt`) and the run settings

| Component | What it shows; hidden when | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| The box | One line, "Ask or request a change", the `>` mark, the send arrow (disabled while blank) | Types; Enter; Shift+Enter; clicks the arrow | Enter or the arrow sends the trimmed text; Shift+Enter adds a line; the box grows up to its maximum, then scrolls. While sending, the arrow spins and is disabled, the text stays; on success the text is cleared; on failure the toast "The message was not sent." with the reason, the text stays | The box keeps the focus after sending |
| "Run settings" (footer, left) | Shown while the thread has no unfinished run (the next message starts one); "Changed" beside it once settings are chosen | Clicks it | Opens the run settings dialog | Enter opens it |
| The note (footer, right) | While the thread has an unfinished run: "Will be read after the current step.", or "Will be read after you answer the review." when the run waits | - | - | Read once with the footer; not a live region |
| `RunSettingsDialog` | "Settings of the next run", its description, the reviews (check boxes), the limits and the parameters (`RunDefaultsFields`), Reset, Cancel, Apply; at most the height of `max-h-dialog`, the fields scroll | Changes fields; Apply; Reset; Cancel; Escape | Apply checks the fields (on submit, then at each change; the first wrong field takes the focus) and keeps them for the next message of this thread, then closes; Reset empties every field (the project values then apply) and keeps the dialog open; Cancel and Escape close and keep the settings as they were | Opens with the focus on its first field; closes with the focus back on "Run settings" |

### The prompt of a new project

| Component | What it shows | What the user does | What follows | Focus and keys |
|---|---|---|---|---|
| `NewProjectPrompt` on `PromptInput` | As today: the heading, three rows, the arrow; no footer | As today | As today | As today, with `useProjectPromptFocus` |

## 11. Screen states and words

| State | What shows | Scenario |
|---|---|---|
| Waiting at the analysis review | Progress up to "Reviewing the analysis" waiting, with Open review; the chat with three runs, the card of the review, the pending note | The mentor platform, `/projects/90aa...0001/activity`, default |
| Working | The running line with Stop, the stage in progress, "Will be read after the current step." | `?mock-run-status=running` |
| Failed | The failed line with its error; the stage failed | `?mock-run-status=failed` |
| Finished | Every stage done but those that the run skipped; no Stop; "Run settings" under the prompt | `?mock-run-status=done` |
| Interviews in progress, subjects not started | Under "Interviewing", the interviewed personas and those not started, muted | The library project, `/projects/90aa...0003/activity` |
| A project with no run | The empty states of Progress, Outline and the chat; the prompt focused | A generated project with no run yet (`mocks/projects/generated-project-specs.fixtures.ts`) |
| No thread | The same, and sending creates the thread | `?mock-threads=empty` |
| Threads loading, failing | The states of the panel and the page | `?mock-threads=loading`, `?mock-threads=error` |
| Messages loading, failing | Outline and the chat: their states | `?mock-messages=loading`, `?mock-messages=error` |
| Steps loading, failing | Progress and each run: their states | `?mock-runs=loading`, `?mock-runs=error` |
| Interrupts failing | Each run: its error | `?mock-interrupts=error` |
| A review with questions only, or with questions added | The questions and "Send answers" | `?mock-agent-questions=only`, `?mock-agent-questions=added` |
| Answering: pending, failing | The options disabled; the toast | `?mock-resume-run=loading`, `?mock-resume-run=error` |
| Sending: pending, failing | The arrow spinning; the toast | `?mock-send-message=loading`, `?mock-send-message=error` |
| A resolved review, with its decision | "Answered: Approve" in run 1 and run 3 | The mentor platform |
| A review taken with the defaults | "Answered with the default: OK" | Unit test |
| A target entry | Its ring, scrolled to the middle | `?entry=<id of the review of run 3>` |
| Developer view | Node names, costs, run numbers, entries of internal stages | The developer view of the user settings |

Words, as the `Messages` objects hold them (each new; the existing words of `interruptStatusLabels`, `runStatusLabels`, `createProjectMessages` stay):

```ts
export const activityPanelMessages = {
  title: 'Activity',
  progress: 'Progress',
  outline: 'Outline',
  loading: 'Loading the activity',
  loadError: 'The activity could not be loaded.',
  progressLoading: 'Loading the progress',
  progressError: 'The progress could not be loaded.',
  notStarted: 'The work has not started.',
  openReview: 'Open review',
  outlineLoading: 'Loading the messages',
  outlineError: 'The messages could not be loaded.',
  noMessages: 'No messages yet.',
}

export const activityChatMessages = {
  tabTitle: 'Activity',
  loading: 'Loading the activity',
  loadError: 'The activity could not be loaded.',
  emptyTitle: 'No activity yet',
  emptyDescription: 'Send your idea or a request to start the work.',
  runLoading: 'Loading the work',
  runError: 'The work of this run could not be loaded.',
  /** The developer view, before the date of a run. */
  run: (number: number) => `Run ${String(number)}`,
  counts: (created: number, changed: number) => `${String(created)} created, ${String(changed)} changed`,
  answered: 'Answered:',
  answeredWithDefault: 'Answered with the default:',
  stopped: 'Stopped with the run',
  version: (version: number) => `version ${String(version)}`,
  quickLook: (key: string) => `Quick look at ${key}`,
}

export const sendMessageMessages = {
  label: 'Message to the agents',
  placeholder: 'Ask or request a change',
  send: 'Send',
  keys: 'Enter to send, Shift+Enter for a new line',
  notSent: 'The message was not sent.',
  runSettings: 'Run settings',
  changed: 'Changed',
  settings: {
    title: 'Settings of the next run',
    description: 'They apply to the run that your next message starts. A field left empty takes the value of the project.',
    legend: 'Reviews and limits',
    reset: 'Reset',
    cancel: 'Cancel',
    apply: 'Apply',
  },
}

export const answerReviewMessages = {
  sent: 'Your answer is sent.',
  notSent: 'The answer was not sent.',
  feedback: 'Feedback (required)',
  cancel: 'Cancel',
  send: 'Send',
  sendAnswers: 'Send answers',
  sending: 'Sending the answer',
  // One function for each type of AnswerProblem, which gives it its count or its label.
  problems: {
    chooseOne: () => 'Choose one.',
    chooseAtLeast: ({ count }: { count: number }) => `Choose at least ${String(count)}.`,
    chooseAtMost: ({ count }: { count: number }) => `Choose at most ${String(count)}.`,
    writeAnswer: () => 'Write an answer.',
    enterNumber: () => 'Enter a number.',
    explainChoice: ({ label }: { label: string }) => `Explain the choice "${label}".`,
  },
  writeFeedback: 'Write the feedback.',
}
```

`stageStatusLabels` (user, developer): `not_started` "Not started", "Not started"; `running` "In progress", "Running"; `waiting` "Waiting for you", "Waiting for review"; `done` "Done", "Done"; `failed` "Failed", "Failed"; `stopped` "Stopped", "Cancelled". `messageAuthorLabels`: "You", "Agents", "Update". `messageDeliveryNotes`: "Will be read after the current step.", "Will be read after you answer the review.", "Not read: the work ended before this message." A function of words takes its numbers as its parameters, so that no component builds a sentence.

## 12. Mocks and screenshots

- **The stream** (`mocks/runs/handlers/run-stream.handlers.ts`, S2a.1/1): every event carries the fields of decision 10. For a running run, it sends the `node_start` of its last step (`step_id`, `stage`, `agent_role`, `iteration`, `persona_key` of the subject), then the `artifact_delta` events as today with `version`, `item_id`, `item_key`, `change`; for another run, the replay of the mock as today with the fields, `node_end` with `status: 'succeeded'` and the usage of the step, then `done` with the status of the run. The `token` events stay.
- **The steps of the library run** (`mocks/runs/fixtures/runs.fixtures.ts`): the steps up to two interviews, the second running (the third persona has none), so that Progress shows a subject not started. Check the counts of `mocks/runs` and `mocks/projects` tests.
- **The messages** (`mocks/messages/messages.fixtures.ts`, S2a.1/2): in the mentor thread, an agent message of run 3 by the `analyst`, "The student and the admin disagree on who approves a booking, see CONF-001.", with `artifact_refs` the requirements analysis at version 4 and `item_refs` CONF-001; a message of the user sent during run 3, "Also ask about group sessions.", `delivery: 'pending'`. Keep the ids of the messages before them. The tests that count the messages of the mentor thread get the new count.
- **The decisions** (`mocks/interrupts/interrupts.fixtures.ts`, S2a.1/3): each resolved interrupt gets its `decision` (the persona review of run 1: `approve` by the user; the analysis review of run 1: `accept`; the review of run 2 taken with the defaults: `ok`, `decided_by: null`); `interrupts.changes.ts` writes the decision when the mock resolves an interrupt.
- **Send** (`mocks/messages/messages.handlers.ts`): the handler of `POST /threads/{id}/messages` stores `run_config` with the run it starts, if it does not yet; a message to a thread with an unfinished run is `pending`, as the API says.
- No new scenario: the states of section 11 use the parameters that exist.
- Screenshots, `tests/screenshots/projects/activity.spec.ts` (S2a.4/4): `Activity waiting for a review` (the mentor platform, full page), `Activity working` (`?mock-run-status=running`), `Activity of a project with no run`, `Progress with subjects not started` (the library project, the side panel), `Review with feedback` (the card after a click on "Reject and re-interview"), `Review with questions` (`?mock-agent-questions=added`), `Run settings dialog`, `Work line expanded`.

## 13. Tests

| File | Cases |
|---|---|
| `shared/lib/viewport/hooks/__tests__/useScrollToAnchor.test.ts` (S2a.0) | Scrolls and focuses the element once ready; nothing before ready, for null, for a missing id; again when the id changes |
| `run/entities/events/__tests__/run-events.utils.test.ts` + data (S2a.0, renamed; S2a.1 adds cases) | Each event type with its fields parses; an event without a field of the API is dropped; `project_named` parses |
| `run/entities/events/hooks/__tests__/useRunProgressEvents.test.ts` | Calls after each event of `runProgressEvents`, not after `token`; a burst shares one call; a failed connection calls; listens after `last_event_id`; nothing for a finished run; after the cleanup a call in progress reports nothing (the `isClosed` case) |
| `run/entities/steps/__tests__/work-entries.utils.test.ts` + data | Agent steps only; steps on one subject joined; the status of each case (failed, running, waiting while interrupted, done); the duration and the cost; created and changed, each item once at its last version |
| `run/entities/steps/__tests__/stage-progress.utils.test.ts` + data | Each run status gives the current stage its status; an internal current stage gives way to the stage of the latest visible step; a stage with steps is done; children by attention; the numbers; the subjects not started after the work; `isOpen`; a null run |
| `run/entities/steps/hooks/__tests__/useStageProgress.test.ts`, `useStageStatusLook.test.ts`; `__tests__/stage-status-look.utils.test.ts` | The states of the join; the look and the label in each view; every `StageStatus` has a row in each table |
| `workflow/.../__tests__/workflow-definition.utils.test.ts`, `hooks/__tests__/useAgentRoleLabels.test.ts` | The labels of the fixture definition |
| `artifact/.../status/__tests__/item-status.utils.test.ts`, `status/hooks/__tests__/useEditedItems.test.ts`, `items/hooks/__tests__/useStageSubjects.test.ts` | `editedItems` keeps the items that `itemStatus` reads as edited; the hook combines the artifacts; the subjects of `interviewing` are the personas with their titles; a kind with one artifact per project gives none |
| `thread/.../__tests__/messages.utils.test.ts` + data, `threads.utils.test.ts`, `hooks/__tests__/useMessageQueries.test.ts`, `hooks/__tests__/useMessageAuthorLook.test.ts`, `api/__tests__/threads.api.test.ts` | `messageHeadline` (leading blank lines, one line, empty); `messageDeliveryNote` for each delivery and run status; `hasUnfinishedRun`; the reload; the looks; `sendFirstMessage` sends the body |
| `review/.../__tests__/interrupts.utils.test.ts`, `interrupts.api.test.ts` + data, `hooks/__tests__/useInterruptQueries.test.ts`, `useInterruptStatusLook.test.ts` | `decisionOption` (pending, resolved, no option, cancelled); the decision parses; the reload |
| `activity/entities/__tests__/activity-entries.utils.test.ts` + data | `runEntries`: the order by time and the order at one time; the titles; an internal stage left out in the user view, kept in the developer view; `messagesByRun`; `entryAnchorId` |
| `activity/entities/hooks/__tests__/useActivityThread.test.ts`, `useRunEntries.test.ts`, `useActivityStream.test.ts` | The thread that needs the user most; no thread; the states (`itShowsQueryStates` cases); the reload of the three lists at an event (`EventSourceStub`) |
| `shared/components/ui/__tests__/stepper.test.tsx`, `trace.test.tsx`, `timeline.test.tsx` | `variant="ghost"` sets `data-variant` and no fill class; `color` sets `data-color` on a trace line and a timeline dot; axe |
| `shared/components/prompt/__tests__/prompt-input.utils.test.ts` + data, `PromptInput.test.tsx` | `isSubmitKey` for Enter, Shift+Enter, a composition, another key; Enter sends the trimmed text, Shift+Enter does not, a blank text does not, nothing while pending; the footer renders; the keys hint is read; axe |
| `project/features/create/components/__tests__/NewProjectPrompt.test.tsx` | Unchanged, green |
| `thread/features/send-message/hooks/__tests__/useSendMessage.test.ts` | `itToastsOnResult`; the body with `run_config` only when the thread has no unfinished run; `sendFirstMessage` without a thread; the settings cleared after success; the queries invalidated; a new idempotency key for each submit |
| `thread/features/send-message/components/__tests__/SendMessagePrompt.test.tsx`, `RunSettingsDialog.test.tsx` | "Run settings" shown or hidden by the thread; "Changed"; the note by run status; the text cleared after success, kept after a failure; the dialog: Apply keeps the settings, Reset empties, Cancel keeps the old ones, the focus returns to the button; `itAsksForFieldsBeforeSending` for a wrong number; axe |
| `review/features/answer/__tests__/answer-review.utils.test.ts` + data | `defaultOption`, `initialAnswers`, each problem of `answerProblem`, `resumeRunBody` (feedback only when required, the answers, the edited items only when edits are allowed) |
| `review/features/answer/__tests__/answer-review.schema.test.ts` | The problems at `feedback` and at `answers.<key>` |
| `review/features/answer/hooks/__tests__/useAnswerReview.test.ts`, `components/__tests__/AnswerReviewForm.test.tsx`, `QuestionField.test.tsx` | `itToastsOnResult`; an option without feedback sends at once; an option with feedback opens the box, Cancel brings back the options and the focus, Send without text shows the problem; Ctrl+Enter sends; the questions of each type with their defaults; the first wrong question takes the focus; the options disabled while sending; `409` reloads the interrupts; axe |
| `activity/widgets/panel/components/__tests__/ActivityPanel.test.tsx`, `ProgressSection.test.tsx`, `OutlineSection.test.tsx` | The stages and their marks; the current stage open; a click on a stage toggles it; Open review links to the review; a work row links to its entry; the subjects not started; the states; Outline newest first, the dot tones, the headline, the time on focus, the link; axe |
| `activity/widgets/chat/components/__tests__/ActivityPage.test.tsx`, `RunActivity.test.tsx`, `MessageEntry.test.tsx`, `WorkEntryView.test.tsx`, `ReviewEntry.test.tsx`, `ActivityRow.test.tsx` | The runs oldest first with their separators; a run failing alone; each kind of message with its links, its note, Copy; the key opens the peek; a work line: title, duration, counts, expand, Stop only on the running line of the latest run, the error of a failed line; a review card pending, resolved, with the default, cancelled; the target entry scrolled, focused and ringed; the empty state with the prompt focused; axe |
| `activity/widgets/dialogs/__tests__/ActivityDialogs.test.tsx` | The run settings dialog opens from its store |
| `shared/routes/__tests__/routes.utils.test.ts` + data | `activity({ entryId })` writes `?entry=` |

Helpers: `runWith(status)` and `stepOf(fields)` builders in `run/entities/steps/__tests__/stage-progress.utils.data.ts`, read by the tests of `run/entities/steps` only; the activity tests render with `renderWorkbench` and the contributions of the layout that they need (`ProjectRunStatusItem` for the Stop dialog, `ActivityDialogs`); an `interruptWith(fields)` builder in `review/features/answer/__tests__/answer-review.utils.data.ts`, read by the tests of that slice.

## 14. Docs to update

| Doc | What changes | Commit |
|---|---|---|
| `docs/API.md`, `docs/DATA_SHAPE.md` | Decision 5 | S2a.D/1 |
| `docs/ui/usability.md` (`frontend-plan`) | 5.7 and 7.7: the side panel with Progress (the stepper, the marks of D11, the rows of D12) and Outline (D2, D3); the work lines (D4); the review card that answers in the chat (D5); the prompt with its row (D6, D7); a project with no run (D8); the icon (D1); the sketch of 7.7 redrawn from section 1.1 | Before S2a.4/1 |
| `docs/architecture/web-app-modules.md` | Section 1: the activity has entities (`useActivityThread`, the entries of a run, their stream) and the widgets `panel`, `chat`, `dialogs`; the first chat is gone. Section 2 tree. Section 5: the links of `activity` through `@x/activity`. Section 6: the rows of `activity`, `thread` (`send-message` built), `review` (`answer` built). Section 9: the tree of the stages is `activity/widgets/panel`, with Outline | S2a.4/5 |
| `docs/architecture/web-app.md` | Section 2: the activity follows the stream of its latest run. Section 3: the marks of a stage. Section 5: the review panel is `AnswerReviewForm`, in the chat now and in the review bar with S2b; the decision of an answered review. Section 9: the rows Reviews and Threads and messages with their real files, and a row Activity | S2a.4/5 |
| `frontend/CONTRIBUTING.md` | The shared code table: `stepper`, `timeline`, `trace` (S2a.2/1), `PromptInput` (S2a.2/2), `useScrollToAnchor` (S2a.0/3) | Each in its commit |
| `frontend/src/mocks/README.md` | A section Activity: the addresses of section 11 and what each shows | S2a.4/5 |
| `docs/frontend-implementation-plan.md` (`frontend-plan`) | The row S2 split into S2a and S2b in section 8, and the rows of S2a.D to S2a.4 and S2b in section 9 | Done with this plan |

## 15. Left for the next PRs

| Item | Where |
|---|---|
| The review bar of a document and of its item pages, with the count of the edited items; `Open review` of Progress opening the document under review | S2b, its own plan |
| The models of the run in the prompt (the `models` of the body) | A later PR: a slot that the app layer fills with the field of `llm-model`, or a change of `moduleImports` |
| Attachments (`+`) and voice input | When the API has SourceDocument (Later) |
| `@` to mention an item and `/` for the commands in the prompt | A later PR of the chat |
| The dot on the icon of Activity when entries arrive while the chat is not on screen (Usability 5.7) | A later PR: needs the last entry seen, kept in the browser |
| Several threads in a project: a list or a menu of threads | When a project has more than one thread |
| The live text of a node (`token`) under its running line | Not planned: the agents report findings, not process (Usability 8.2) |
| Try again on a failed run | S6, `run/features/retry` |
| The titles of the items of a work line that are not subjects | A later PR: `ItemRef` has no title, and loading each item costs a request |
| A retried run shows the stages before its first step as not started | An open point of Usability 14 |
| Progress of a stage that a run skips (an optional branch) | Usability open point 14 |

## 16. Commits and checks

S2a.D `docs/fe/activity`, from `origin/main`:

1. `docs(api): give an answered review the decision that answered it`

S2a.0 `chore/fe/maintenance-before-activity`, from `origin/main` once S1d is merged:

1. `refactor(frontend): remove the first chat and the start of a run that the API lacks`
2. `refactor(run): name the file of the run event parsers after what it holds` (`git mv` only)
3. `refactor(frontend): scroll to an anchor with one shared hook`

S2a.1 `feat/fe/activity-entities`, on S2a.0, once S2a.D is merged:

1. `feat(run): read every field of the run events, the work of a run and the progress of its stages`
2. `feat(thread): read the looks and the delivery of a message, and send the first message with its settings`
3. `feat(review): read the decision of an answered review and its look`
4. `feat(activity): read the thread of the activity, the entries of a run and their stream`

S2a.2 `feat/fe/prompt-input`, on S2a.1:

1. `feat(shared): add the stepper, the timeline and the trace, with the tones of their marks`
2. `feat(shared): add the prompt input that every prompt that starts work shares`
3. `refactor(project): build the prompt of a new project on the shared prompt input`

S2a.3 `feat/fe/send-message-and-answer`, on S2a.2:

1. `feat(thread): send a message to a thread, with the settings of the run it starts`
2. `feat(review): answer a review with its options, its feedback and its questions`

S2a.4 `feat/fe/activity`, on S2a.3:

1. `feat(activity): show the progress and the outline of the activity in its side panel`
2. `feat(activity): show the chat of the activity, with its work, its reviews and its prompt`
3. `feat(app): put Activity first on the activity bar, with its page and its dialogs`
4. `test(screenshots): cover the activity of a project`
5. `docs: describe the activity, its entries and the prompt that it shares`

Each file goes in the commit of its row in section 7. S2a.1/1 holds the `workflow` and `artifact` parts that `run` reads (`@x/run`, `useStageSubjects`, `useAgentRoleLabels`, `editedItems`), so that it compiles alone. The plan, the prompt and the sketches stay on `frontend-plan`.

Checks, one at a time: ESLint and Prettier on the changed files; Vitest on the touched folders (`shared/lib/viewport`, `shared/components/ui`, `shared/components/prompt`, `shared/routes`, `modules/run`, `modules/thread`, `modules/review`, `modules/workflow/entities`, `modules/artifact/entities`, `modules/activity`, `modules/project/features/create`, `modules/documents/widgets/document`, `modules/design-system`, `mocks/runs`, `mocks/messages`, `mocks/interrupts`, `mocks/projects`); typecheck once, since types and routes change. A test that times out only with the others runs again alone. No full suite, E2E, screenshots or build locally; CI runs them. Then:

- `grep -nP '[^\x00-\x7F]'` on the docs and on the new comments;
- `grep -rnE 'backend|frontend|UI|dashboard|FR-[0-9]|NFR-[0-9]|docs/'` on the new comments;
- `grep -rnE "'(planning|persona_generation|persona_review|interviewing|analysis|analysis_review|specification|backlog|validation|done|intent_routing|planner|interviewer|analyst|validator|checkpoint_[a-z]+|accept|approve|reject_[a-z]+|persona|interview_transcript)'" frontend/src/modules/activity frontend/src/modules/run/entities/steps frontend/src/modules/review/features/answer frontend/src/modules/thread/features/send-message --include=*.ts --include=*.tsx | grep -v __tests__` answers nothing (decision 3);
- `grep -rnE "=== '(not_started|running|waiting|done|failed|stopped|user|agent|system|pending|resolved|cancelled|message|work|review|subject|single_select|multi_select|free_text|number)'|case '" ` on the same folders, tests aside, answers nothing (decision 3);
- `git diff` of the new components holds no class of a palette color (`-red-`, `-green-`, `-blue-`, `-amber-`, ...; the tokens such as `text-muted-foreground` and `border-primary` are the design system) and no class value in brackets outside `shared/components/ui`, state selectors such as `data-[target]:` aside (decision 2);
- `grep -rn "createRun\|useStartRun\|useRunStream\|applyRunEvent\|useScrollToItem" frontend/src` answers nothing after S2a.0.

## 17. Checklist

- [ ] D1 to D12 confirmed or changed by the user; A1 to A12 and the answers of D1 to D12 written in `docs/ui/usability.md` on `frontend-plan` before S2a.4/1
- [x] The sketches in `docs/ui/wireframes/`, unchanged, with the notes for the build in section 1.2
- [ ] S1 merged (S1b to S1e); this plan checked again against `main`: `PageLink`, `RouteParam`, `useScrollToItem`, `usePeekedItem`, `itemStatus`, the paths of sections 7 and 8
- [ ] S2a.D written, pushed, its PR opened and merged (the user); the server repository follows the decision of an interrupt
- [ ] S2a.0 to S2a.4, each commit checked, each PR opened as a draft
- [ ] The S2b plan written from S2a as built
- [ ] Each row of section 10 checked once in `pnpm dev:mock` (one dev server, one page at a time, stopped after): the mentor platform waiting, working and failed; the library project; a project with no run; a review with feedback and with questions; the run settings dialog; Outline and Progress opening their entries
- [ ] The description of each PR written from this plan; the endpoints it lists checked against the `*.api.ts` functions that the hooks call
