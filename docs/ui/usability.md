# Usability for Non-Developer Users

How to make the web app usable for users who are not developers: why the current frame reads as a developer tool, what to do with each part of it, the navigation, tabs, search and status that suit them, four frame options with ASCII skeletons, and the reference apps and guidelines behind them. This page is input for the UI design: the tab behavior of [5.6](#56-tabs) is chosen, and every other option below is a proposal.

The current frame is in [Screen Skeletons](skeletons.md), the apps already studied are in [UI Reference Apps](reference-apps.md), and the data each region draws is in [Web App](../architecture/web-app.md).

## Contents

- [Usability for Non-Developer Users](#usability-for-non-developer-users)
  - [Contents](#contents)
  - [1. Method](#1-method)
  - [2. Users and their jobs](#2-users-and-their-jobs)
  - [3. Why the current frame reads as a developer tool](#3-why-the-current-frame-reads-as-a-developer-tool)
  - [4. What happens to each part of the frame](#4-what-happens-to-each-part-of-the-frame)
  - [5. Navigation model](#5-navigation-model)
    - [5.1 Top level](#51-top-level)
    - [5.2 Where the project stands](#52-where-the-project-stands)
    - [5.3 Inside a document: sections and items](#53-inside-a-document-sections-and-items)
    - [5.4 Opening an item](#54-opening-an-item)
    - [5.5 Search](#55-search)
    - [5.6 Tabs](#56-tabs)
    - [5.7 Activity](#57-activity)
  - [6. Frame options](#6-frame-options)
    - [6.1 Option A: conversation first](#61-option-a-conversation-first)
    - [6.2 Option B: steps (rejected)](#62-option-b-steps-rejected)
    - [6.3 Option C: documents and outline](#63-option-c-documents-and-outline)
    - [6.4 Option D: workbench with labels](#64-option-d-workbench-with-labels)
    - [6.5 Developer view](#65-developer-view)
    - [6.6 Evaluation](#66-evaluation)
  - [7. Screens of option D](#7-screens-of-option-d)
    - [7.1 Home](#71-home)
    - [7.2 Agents working](#72-agents-working)
    - [7.3 Review: requesting changes](#73-review-requesting-changes)
    - [7.4 Item page](#74-item-page)
    - [7.5 Item peek](#75-item-peek)
    - [7.6 Search results](#76-search-results)
    - [7.7 Activity](#77-activity)
    - [7.8 Trace](#78-trace)
  - [8. Size, text and words](#8-size-text-and-words)
  - [9. Avoiding a generated look](#9-avoiding-a-generated-look)
  - [10. Reference apps and guidelines](#10-reference-apps-and-guidelines)
  - [11. Open points](#11-open-points)
  - [12. Next steps](#12-next-steps)

---

## 1. Method

The page follows the five planes of Jesse James Garrett's *The Elements of User Experience*, from the most abstract to the most concrete. Each plane depends on the one below it, so the decisions are taken in this order, and the hardest one to reverse (the navigation model) comes before the frame and the sizes.

| Plane | Question | Section |
|---|---|---|
| Strategy | Who uses the app and what they come to do | [2](#2-users-and-their-jobs) |
| Scope | Which information and actions the user view holds, and which go elsewhere | [3](#3-why-the-current-frame-reads-as-a-developer-tool), [4](#4-what-happens-to-each-part-of-the-frame) |
| Structure | How the user moves between the parts | [5](#5-navigation-model) |
| Skeleton | Where each part sits on the screen | [6](#6-frame-options), [7](#7-screens-of-option-d) |
| Surface | Size, text, words and look | [8](#8-size-text-and-words), [9](#9-avoiding-a-generated-look) |

The options are compared on these decision drivers. D0 is a constraint: an option that fails it is rejected whatever its other results. It follows the principle of the web app that the workflow and the content schemas are data, so that experiments change them freely ([Web App: principle](../architecture/web-app.md#1-principle)); the navigation is the hardest part of the frame to change, so it must not depend on the shape of the workflow.

| Driver | Passes when |
|---|---|
| D0 Independent of the workflow shape | The frame and the navigation read only what every workflow definition version has: the project, the artifact kinds and the artifacts, the items, the state of the run, the stages in the order of the definition with their labels, and the pending review. A definition version that adds, removes, reorders or loops stages, or adds an artifact kind, needs no change in the web app and leaves no empty or broken region. Checked by drawing the frame from a second test definition with another shape |
| D1 Status in view | The state of the run (working, waiting for the user, stopped, finished) and the current stage are visible on every screen of a project, without a click |
| D2 Review in few clicks | From any screen of a project, a pending review opens in 1 click and is answered in at most 2 more |
| D3 Reading width | The text of a document is 50 to 75 characters per line at a window width of 1280 px, with the side panel open |
| D4 Known model | The frame matches a type of app that a non-developer already uses: a chat assistant, a document editor, or a step-by-step form |
| D5 Rework and free order | A rework loop (from the analysis back to the interviews) and a jump back to any earlier document fit the frame without a special screen |
| D6 Build cost | Share of the current layout and feature components that the option reuses |
| D7 Item reach | Every item opens alone, at the full width of the content column, with its own URL, in 1 click from the navigation of its document; the next item of the same document is 1 more click |
| D8 Several things open | Two documents or items stay open at once, and the user switches between them in 1 click or sees them side by side, for example a requirement and the interview it comes from |
| D9 Room for features | A new feature of the user view, such as Sources, planned for later, gets its place in the navigation without a new region or a new layout |

## 2. Users and their jobs

The brief. Each line says where it comes from: read in the docs, or guessed and to be confirmed with users.

| Line | Content | Source |
|---|---|---|
| Product | A multi-agent assistant that turns a product idea into requirements: an interview plan, personas, simulated interviews, an analysis, a requirement specification and a product backlog | Docs |
| User | Describes a product idea, answers the reviews, edits and exports the requirements. Non-developer examples: a product owner, a business analyst, a founder, a student team writing a specification | Docs; the examples are guessed |
| Second user | The researcher: runs the same workflow and inspects runs, steps, cost and state | Docs |
| Platform | Desktop browser | Docs |
| Differentiator | Every requirement traces back to a quote in an interview with a persona (`evidenced_by`) | Docs |
| Vocabulary | Known to the user: idea, persona, interview, requirement, priority, user story, backlog, trace (following a requirement to where it comes from and to what was built from it). Unknown: run, thread, step, node, checkpoint, interrupt, token, workflow version, item keys | Guessed |

The job of each screen. The column "Decides with" is what the user compares to reach the final action, so it must be the most visible content of that screen.

| Screen | The user comes to | Decides with | Final action | What apps of this type usually do |
|---|---|---|---|---|
| Home | Resume the project that needs them, or start a new one | Which project waits for a review; last activity | Open a project; start a project | One input for a new idea at the top, recent projects below it, newest first (ChatGPT, Claude, Lovable) |
| New project | Describe the idea | - | Start | One large text box; name, language and limits have defaults behind "Options" |
| Project, agents working | Know what is happening and whether they are needed | The current stage, the documents written so far and those still to come | Wait; steer with a message; stop | A one-line status and the work produced so far (Lovable, Devin); a plan with the current step marked when the plan has a fixed shape (Gemini Deep Research) |
| Project, review | Approve the personas, the analysis or the specification, or send it back | The document, the disagreements and unclear points the agents flagged, the user's own edits | Approve; request changes with feedback | The document at full size with the decision at its edge (Kiro approves each spec file before the next one) |
| Document | Read, correct and export a finished document | Sections, priority, the source of each requirement | Edit; export | A page with an outline (Notion, Google Docs); a table for requirements (ReqView) |
| Item | Read or correct one requirement, persona or user story in full; go through the items of a document one by one, often during a review | All the fields of the item, the interview quote it is based on, linked items, history | Edit; go to the next item | Each record has its own page and address, with previous and next in the list order (Jira); a record opens beside the list for a quick look or as a full page (Notion: side peek, center peek, full page); requirements tools offer a document view and a view of one item (Jama Connect, ReqView) |
| Compare | Check one thing against another: a requirement against the interview it comes from, a persona against its transcript, the analysis against the specification | The two contents side by side, or one click apart | Edit one of them | Tabs and a side-by-side split (web browsers, View Side by Side in Word, VS Code) |
| Developer view | Debug and compare runs (researcher) | Graph, steps, state, cost, model per role | Retry from a step; open the trace | The current frame (LangGraph Studio, Langfuse) |

Items carry many fields: a specified requirement has 9, a persona 11, five of them lists. A document is read as a whole, but an item is read and edited on its own, so items need their own place in the navigation and their own page, not only a row of the document.

In the user view, Trace means following a requirement to where it comes from and to what was built from it ([7.8](#78-trace)). The trace of a run is another object, which the developer view alone names "Run trace", so the two words never meet.

The differentiator appears on the item page as its source quote ([7.4](#74-item-page)), not only on a traceability page.

## 3. Why the current frame reads as a developer tool

The frame of [Screen Skeletons](skeletons.md#1-frame) copies VS Code: the top bar, activity bar, side panel, editor tabs, editor, bottom panel and status bar are on screen together. The sizes below are measured in `frontend/src/components/layout/` and `app/styles.css`.

| Problem | Where it shows | Guideline it breaks |
|---|---|---|
| Organized by system module, not by the user's question | The activity bar has Console, Artifacts, Workflow and Traceability. The answer to "where is my project and what must I do" is split between the status bar (stage), the console (`?` line) and the badge on Console | Match between the system and the real world (NN/g heuristic 2) |
| Navigation by icon only | Activity bar icons, with their names in a tooltip | Icons need a visible text label; hover is not a substitute (NN/g, icon usability) |
| Tabs pile up | Every page opened from a side panel gets a tab of its own, so a few minutes of reading leave many tabs; the bottom panel adds a second strip of tabs | Aesthetic and minimalist design (NN/g heuristic 8); VS Code avoids the pile with a preview tab |
| Internals always on screen | Status bar: step 67, $0.42 of $2.00, workflow v1. Node names `persona_generator`, `checkpoint_analysis`. Duration of each step | Aesthetic and minimalist design (NN/g heuristic 8); progressive disclosure |
| Terminal metaphor | Monospace stream with `*`, `>` and `?` markers, `ctrl+o` and `esc` hints, slash commands, review options chosen with the arrow keys | Accelerators are fine for experts, hidden from novices and never the only path (NN/g heuristic 7); recognition rather than recall (heuristic 6) |
| Keys and item kinds as main labels | `AR-007`, `CONF-001`, `PER-001`; raw requirement, analyzed requirement, latent need, ambiguity issue | Match with the real world |
| Code-editor density | Top bar 40 px with 12 px text; status bar 24 px; panel titles 11 px; the smallest label 9 px; text in the editor 13 px; the largest heading `text-lg` | Long documents are tiring to read at this size; it suits scanning code and logs |
| Secondary features on the first level | Workflow takes an activity bar slot equal to Artifacts, though the graph serves debugging, not the user's work | The first level holds what most users need often (NN/g, progressive disclosure) |

What the current design already does right, and every option below keeps:

- One conversation per project, no list of threads.
- An activity bar for the features of the project, and tabs that belong to the project.
- Reviews drawn from the data of the checkpoint: options, questions, whether edits are allowed.
- Documents drawn from their content schema.
- The explorer tree reaches every item, and an item opens alone with its fields in order.
- Trace links and versions on every requirement.
- A command palette in the top bar, for search and for commands.

## 4. What happens to each part of the frame

Moving every developer element into another corner of the user view gives a screen of small panels, badges and stat tiles. Instead, each element of the current frame gets exactly one of five outcomes:

| Outcome | Meaning |
|---|---|
| Keep | Stays in the user view, possibly larger |
| Translate | The same information in the user's words, usually shorter, in one place |
| On demand | One click away, in a drawer or a collapsed section of the screen that owns it; nothing on screen until asked |
| Developer view | Only in the developer view, see [6.5](#65-developer-view) |
| Drop | Not in the user view; the developer view keeps it where it is today |

| Current element | Outcome | In the user view |
|---|---|---|
| Top bar: project switcher | Keep | Project name with a menu |
| Top bar: command palette (`Ctrl+K`) | Keep | A box labeled "Search or run a command", so a non-developer reads it as search: it finds projects, documents and items by title or key, and lists commands (export, stop, settings) as the user types. Enter opens a page of all the results, see [5.5](#55-search). `Ctrl+K` opens it from anywhere |
| Activity bar | Keep | A text label under every icon, and only the features of the user view: Activity, Documents, Search, Trace, Settings; Workflow joins them in the developer view, see [5.1](#51-top-level). Console becomes Activity: its side panel shows the steps of the work as a tree, and the conversation opens in a tab, see [5.7](#57-activity) |
| Side panel: artifact tree down to the items | Translate | The side panel of Documents: the documents of the project with their marks, and under the open one its sections and items, down to every item, see [5.3](#53-inside-a-document-sections-and-items) |
| Editor tabs and split editor | Keep | As in VS Code: a single click opens the preview tab, a double click keeps it; at most two groups side by side, see [5.6](#56-tabs) |
| Editor: an item opened in a tab | Keep | The item page, with its own URL, see [5.4](#54-opening-an-item) |
| Bottom panel: TRACE | Translate | "See its trace" in the menu of the item page opens the chain of the item as a graph, in the Trace feature, see [7.8](#78-trace) |
| Bottom panel: TIMELINE | On demand | "History" collapsed on the item page |
| Status bar: run state and stage | Translate | The status bar stays at the bottom, in user words: "Working: Interviewing", "Waiting for you: Analysis review", with `Open review` or `Stop`; a review that starts also shows a notification, see [5.2](#52-where-the-project-stands) |
| Status bar: step number, workflow version | Developer view | - |
| Status bar: cost against the limit | On demand | Hidden until 80% of the monthly budget is used, then a meter with the percent and the amounts, amber from 80% and red from 90%; the full figure in the usage section of Settings |
| Console: step lines with node names and durations | Translate | One line per finished piece of work, in plain words ("Interviewed the student: 12 questions"); the turns of one interview collapse into one line per persona |
| Console: messages of the user and of the agents | Keep | The chat of Activity, see [5.7](#57-activity) |
| Console: delivery state of a message sent during a run | Translate | "Will be read after the current step" under the message |
| Console: keyboard hints | Drop | Listed in the help menu |
| Console: `/stop`, `/retry`, `/export`, `/run-settings` | Translate | A button where the action applies: Stop next to the progress line, Try again on the error banner, Export on the document, run settings in Project settings. Slash commands stay as accelerators |
| Review: numbered options chosen with the keyboard | Translate | Buttons on the review bar; the approving option is the only primary button |
| Review: items edited before answering | Keep | "You edited 2 requirements" on the review bar, each a link |
| Item keys (`AR-007`) | Translate | The title first; the key after it in small muted text, for mentioning an item in a message |
| Item kind names | Translate | User words, see [8.3](#83-words) |
| Workflow graph | Developer view | The status bar names the current stage |
| Runs and their steps | Translate | The steps of the current work as a tree in the side panel of Activity, in user words, see [5.7](#57-activity); the list of runs and the details of a step stay in the developer view |
| Retry from a step | Developer view | "Try again" on a failed run retries from the last completed step |
| Workflow state tree, link to the trace | Developer view | - |
| Traceability matrix | Developer view | The user view follows one item through its chain, the Trace feature of [7.8](#78-trace); the matrix itself stays in the developer view, in a later build; the export keeps its name |
| Coverage counts | Translate | The side panel of Trace, one row per gap with its count, in the words the workflow definition or the server gives, see [7.8](#78-trace) |
| Settings: General | Keep | Project settings |
| Settings: review at each checkpoint, number of personas | Keep | Project settings |
| Settings: max steps, max turns, max iterations, max cost | On demand | "Advanced" section of Project settings, collapsed |
| Settings: model per agent role | Developer view | - |

Features in the user view have two levels at most: the screen, and one level of detail on demand. Progressive disclosure with more than two levels loses users (NN/g). This limit is about hiding features, not about the depth of the content: the content keeps its three levels (document, section, item), each reachable from the navigation of [section 5](#5-navigation-model).

## 5. Navigation model

The hardest decision to reverse: routes, components and copy all follow it. It must pass D0: the workflow definition is the part of the system that experiments change, so the navigation reads only what every definition version has. The content has three levels, document, section and item, and each level gets its own navigation; tabs keep several pages open at once.

### 5.1 Top level

| Option | Top-level entries | Seen in |
|---|---|---|
| N1 By feature of the app (current) | Console, Artifacts, Workflow, Traceability, Settings on the activity bar | VS Code, LangGraph Studio, Microsoft Teams |
| N2 By step of the workflow | One entry per group of stages, as a stepper | Kiro specs, Gemini Deep Research, setup and checkout flows |
| N3 By document | One entry per document of the project | Notion, NotebookLM, ReqView |

| Driver | N1 feature | N2 step | N3 document |
|---|---|---|---|
| D0 Independent of the workflow shape | Yes: features are concepts of the app | No: a step is a grouping of the stages of one workflow, and a stepper assumes a short, linear workflow | Yes: artifact kinds, artifacts and items exist in every definition version, and a list takes any length |
| D1 Status in view | With the status bar of [5.2](#52-where-the-project-stands) | Yes: the stepper is the status | With the status bar of [5.2](#52-where-the-project-stands) |
| D4 Known model | Code editor; with a label under each icon, the app bar of Microsoft Teams | Step-by-step form | Document app |
| D5 Rework and free order | Yes | Needs a round display for loops | Yes |
| D9 Room for features | Yes: one entry per feature | No | No: a list of documents has no place for search, traceability or sources |
| Fit for the researcher | Yes | No | Partly |

**Proposal.** N1 for the frame, with N3 inside it: the activity bar keeps the features of the app, each with a text label. Activity comes first, since a project opens at it, and Documents, next, lists the documents. The status bar of [5.2](#52-where-the-project-stands) replaces a stepper. N2 is rejected by D0, see [6.2](#62-option-b-steps-rejected).

| Feature | Side panel | User view | Developer view |
|---|---|---|---|
| Activity | The steps of the work as a tree, marked as the run goes; the chat opens in a tab, see [5.7](#57-activity) | Yes, first on the bar | Yes (the current Console) |
| Documents | The documents with their marks, and the outline of the open one, see [5.3](#53-inside-a-document-sections-and-items) | Yes | Yes (the current Artifacts) |
| Search | A query box, filters and the results, see [5.5](#55-search) | Yes | Yes |
| Trace | The overview of what needs attention, the tree of the documents and their items, and the chain of a chosen item as a graph, see [7.8](#78-trace) | Yes | Yes |
| Workflow | The runs and their steps; the graph opens in a tab | No | Yes |
| Settings | The sections of the project settings; at the bottom of the bar | Yes | Yes |
| Sources (later) | The uploaded documents | When in scope | When in scope |

- Console becomes Activity, the first feature of the bar: its side panel shows the steps of the work as a tree, and the conversation opens in a tab, see [5.7](#57-activity).
- Choosing a feature shows its side panel, as today, and choosing it again hides the panel. The tabs do not change.

The list of documents, built from data only:

- One entry per artifact kind, in the order of `artifact_kinds` in the definition, named by the `title` of its schema from `GET /artifact-kinds`.
- A kind whose `per_project` is `one_per_subject` (interview transcripts) or `many` (validation reports) is a group, and its artifacts are the entries under it, named by their `title`. For `one_per_subject`, the subjects that have no artifact yet, such as the personas not interviewed, are listed as not started.
- A kind with no artifact yet is listed as not started, muted, while the project has an unfinished run, see [open point 1](#11-open-points).

### 5.2 Where the project stands

Elements built from the run and the artifacts take the place of steps:

| Element | Shows | Reads from |
|---|---|---|
| Status bar, at the bottom of every screen of a project | The state of the run and the label of the current stage: "Working: Interviewing", "Waiting for you: Analysis review", "Stopped by an error: Analysis", "Finished"; with `Stop`, `Open review` or `Try again` | `status` and `current_stage` of the run; the `label` of that stage in `stages` of the definition; the pending interrupt |
| Notification when the run starts to wait for the user | "The analysis is ready for your review" with `Open review`, shown once, then kept in the list under the bell of the status bar | The `interrupt` event |
| Mark before each document in the side panel of Documents, and on its tab | `(>)` being written, `(!)` waiting for the user's review, `(v)` approved, no mark for a draft, `( )` not started | The `artifact_created` and `artifact_delta` events of the running step; `review_artifacts` of the pending interrupt; `review_status` of the artifact; the artifact kinds without an artifact |

- They work for any number of stages, any order, loops and parallel branches: they say what the run is doing now and what state each document is in, not where the run sits on a line.
- A rework shows as the stage label going back ("Working: Interviewing" after "Waiting for you: Analysis review") and the rewritten documents marked `(>)` again; the loop itself needs no drawing.
- The exact path of the run (which nodes, in which order, how many visits) stays in the graph of the developer view.

Where the state of the run goes:

| Option | Trade-offs |
|---|---|
| P1 A line under the top bar | Where the eye starts on every screen, so the state is seen without looking for it; one more full-width row, and the content starts lower |
| P2 The status bar at the bottom, as in the current frame | Where VS Code, Word and Excel show an ongoing state, and where the current code has it, with the notifications under its bell. A status bar holds what the user checks when they want to, so a state that needs the user can go unnoticed there |
| P3 Inside the top bar, between the project and the command palette | No extra row; the top bar then holds the project, the state, the palette and the buttons, which is tight at 1280 px |

**Proposal.** P2. The ongoing state ("Working: Interviewing") is what the user checks now and then, which is what a status bar is for. The state that needs the user ("Waiting for you") is an event, and it reaches the user through the notification, the `(!)` marks on the document and its tab, and the review bar, wherever they look. D1 holds, since the status bar is on every screen.

### 5.3 Inside a document: sections and items

| Level | What it is | Navigated with |
|---|---|---|
| Document | One artifact, or a group of the artifacts of one kind | The side panel of Documents (the sidebar in option C) |
| Section or group | A section made by the agents, up to 4 levels deep; in a document without sections, the items of one kind | The outline under the open document in the side panel, a tree that collapses and expands |
| Item | One requirement, persona, user story or issue | The outline, the rows of the document, links in text, search |

The outline:

- Appears under the document open in the active tab, while every other document stays one row. The side panel holds the list of documents and one outline, not every item of the project as the current explorer does.
- A row shows the title of the item; the key and the fields are on the item page. A collapsed section shows how many items it holds.
- The row of the item in the active tab is marked, and stays in view while Previous and Next move through the items.
- States, by attention and not by meaning (answers of 2026-11-01 and 2026-11-03), as in [the reference of the tree](documents-tree-reference.png): a line guides each level; the color of the title says how much the row asks of the user now, and one letter at the end of the row says which state, only where the color alone would leave a doubt, with no icon. `warning`: a document under review (`R`), an open issue in it (`?`), its drafts (color only, "Needs your review"). `primary`: a document being written (`W`), an item edited by the user and not reviewed yet (`E`). Muted: a kind not started, a rejected item (`X`). `!` marks an item made from an older version of an item it links to, "Based on an older version": `warning` in a document under review, `primary` outside one. A tooltip on each row gives its state in full; a collapsed section takes the color of the highest level under it. The footer of the side panel counts only what needs the user in the open document ("2 to review, 1 to resolve, 1 out of date"). Superseded and deleted items are hidden; search and the history of an item still reach them.
- A document without sections is grouped by item kind, each group named by the `title` of the item kind schema. The outline of an interview transcript has no row for its messages: a message has no page of its own (`x-ui-navigable: false`) and is read in the transcript, where the words that items quote are marked. The elicitation plan has no items; its outline lists the headings of its fields.
- The command palette in the top bar goes to documents and items by title or key, and the Search feature lists results ([5.5](#55-search)), so the side panel of Documents has no search box of its own.
- The side panel is 280 px wide and collapses, with `Ctrl+B` as an accelerator. Below a window width of 1440 px it shares the space with the right panel: opening a peek collapses the side panel, and closing it brings the side panel back; while the side panel gives way, `Ctrl+B` closes the peek and brings it back. The activity bar stays.

### 5.4 Opening an item

| Option | How | Fits | Trade-offs |
|---|---|---|---|
| I1 Peek | The item in the right panel, 400 px, beside the document | A quick look at an item met while reading, without losing the place | Too narrow for 9 to 11 fields with lists, the source, the links and the history |
| I2 Item page | The item fills a tab, with its own URL, a breadcrumb, Previous and Next | Reading and editing one item in full; going through the items one by one, during a review or after | Another tab, or the document leaves the active tab |
| I3 List and detail | The items as a narrow list on the left half, the selected item on the right half | Going through many short items, such as user stories or validation issues | The document is no longer read as continuous text; two scroll areas |
| I4 Center peek | The item in a dialog over the document | Short items | Covers the page; poor for long edits and for following links |

**Proposal.** I2 is the home of every item, and I1 serves the links met while reading.

- **Item page.** Opened from the outline, from search, and from `Open as page` in a peek, in the preview tab, or in a kept tab after a double click, see [5.6](#56-tabs). Its URL holds the `id` of the item, as every path of the API, so an item can be bookmarked and sent to a teammate. Previous and Next float over the bottom right corner of the page, show while the user acts and fade after a moment without action; they follow the outline order across sections and show the position ("3 of 18"); `J` and `K` are accelerators, as in Jira.
- **Peek.** Opened from the key of a row in the table of a document or of a card, drawn as a button ("Quick look at REQ-001"; the title stays the link to the item page), from a key in an entry of the chat of Activity, or from a disagreement. It shows the title, the key line, the main field and "Why this item exists", with `Open as page`, and "Close the quick look" on its close button. It uses the right panel, and its item is part of the address: Back closes it, a reload keeps it, a link opens it, and another page closes it. A second press on the key closes it; the key of another item replaces it.
- **Fields on the item page.** In `x-ui-field-order`, the label above the value, list fields as lists. Empty optional fields are hidden when reading and shown when editing. `Edit` turns the page into the form of the content schema, see [Web App: artifacts and items](../architecture/web-app.md#6-artifacts-and-items), and the page then shows the form alone: no links, no origin, no history, no Previous and Next, no `J` and `K`, until Save or Cancel; Cancel after a change asks "Discard your changes?".
- **When a document can change.** Only while the run waits for a review that allows edits, and only the documents of that review. Otherwise `Edit` and `Restore this version` stay on the page, disabled, and their tooltip gives the reason on hover and on focus: "Documents cannot change while the agents work.", "Only the documents under review can change now.", "This review does not take changes.", or "A document can change while it waits for your review.".
- **Links of an item.** In three places, each with one job. The words that a link quotes are marked in the text where they are; a link quotes words on its source side, its target side, or both, as its link type allows (an interview message for `evidenced_by` and `resolved_by`, both sides for `derived_from`, the requirement for `concerns` and `flags`, none for the others), at most one run of words per side. Under the key line, every direct link is a chip with the key and the title of the other item, in the words of its link type ("Based on", and "Based on this item" for a link from another item); hovering a chip lights its marks in the text, and hovering a mark lights its chips. A chip or a mark opens a card with the other item: its title, status, main field and the words it quotes, and `Open`. At the end of the page, "Why this item exists" gathers the chain that the item is based on, down to the words of the interview, with `Read`, which opens the transcript at that message. A failure to load the links shows one line with Try again and leaves the rest of the page as it is.
- **History.** A button "History" floats over the bottom left corner of the page. It opens in levels: first the selected version, with Newer and Older, "Show changes" and "Restore this version"; then the list of every version above it, newest first. While the history is open, at either level, the page shows the selected version, the current one at the start, with its changes marked in the fields when asked (removed words struck through in red, added words in green), and no link: the chips, the marks and "Why this item exists" come back when the history closes. Restore asks first, without a red button, since restoring again undoes it; after a restore the history stays open with the new version on top.
- **Review across item pages.** During a review, the review bar stays at the bottom of the document under review and of every item page of that document, with the count of items edited so far, so the user approves after the last item without going back to the document.
- **Superseded item.** Its page stays reachable from links and from history, with a banner "Replaced by REQ-014" that links to the new item.
- I3 can come later as a display of the backlog and the validation report; it needs no change to the frame.

### 5.5 Search

Two kinds of search, with different needs:

- **Going to a known thing.** "REQ-005", "booking flow", "export the specification": the user knows what they want and opens one result.
- **Exploring.** "Every requirement about booking", "every draft in the analysis": the user wants a list, filters, and to open the results one by one.

| Option | How | Fits | Trade-offs |
|---|---|---|---|
| S1 Command palette only | The box in the top bar lists documents, items and commands as the user types; choosing one opens it | Going to a known thing | The list closes once a result opens: going through 12 results means 12 searches. No room for filters |
| S2 Search feature on the activity bar | As the search view of VS Code: a query box, filters and the results grouped by document in the side panel; a result opens in a tab and the list stays | Exploring | Two places to type a search, the palette and the side panel. The side panel shows the results instead of the documents until the user chooses Documents again. At 280 px a result is its title and one line of matching text |
| S3 Results page from the palette | Enter in the palette opens a page of results in a tab: filters, results grouped by document with the matching text, the query in the URL | Exploring, when the side panel is too narrow for the results | The results and the result opened take turns in the active tab |

**Proposal.** S1 and S2. The palette goes to a known thing; Enter in the palette, or its last row "All results", opens the Search feature with the query, so the two places lead to one list. The results stay in the side panel while the user opens them one by one in the preview tab ([7.6](#76-search-results)).

- **Data.** `GET /projects/{project_id}/items` with `q` (text in the key and the content), `kind` and `review_status`, all in the API today. The results are grouped by the artifact of each item.
- **Going through the results.** An item opened from the results has Previous and Next over the results instead of the outline, its breadcrumb starts with the query, and the result is marked in the side panel.
- S3 stays the fallback if tests show that 280 px is too narrow for the results.

### 5.6 Tabs

Tabs keep several pages open: a requirement and the interview it comes from, the document under review while a link is followed, the specification and the backlog. They belong to the project, as in the current frame, and come back when the project opens again. A tab holds a document, an item, the results of a view of Trace, the chat of Activity, or the settings.

| Option | What a click in a side panel or on a link does | Fits | Trade-offs |
|---|---|---|---|
| T1 A new tab for every page | Adds a tab; a page already open gets the focus | Developers who keep many files open (the current code) | Tabs pile up after a few minutes of reading |
| T2 Preview tab | Opens a preview tab that the next click replaces; a double click or an edit keeps it | Users of VS Code; reading many pages one after the other | A tab that disappears on the next click surprises users who do not know the mode; the mode shows only as italic text |
| T3 Browser tabs | Opens the page in the active tab, which keeps its own Back and Forward; Ctrl+click, a middle click or `Open in new tab` opens a new tab | Every user of a web browser | A second tab takes a deliberate action, so `Open in new tab` must be visible for users who do not use Ctrl+click |

**Choice.** T2, as in VS Code, in both views: a single click opens a page in the preview tab, and a double click keeps it. The current code opens every page in a tab of its own (T1), so the preview tab is the change.

- **Preview tab.** A single click on a row of a side panel, a search result or a link, or `Open as page` in a peek, opens the page in the preview tab of the group, which the next single click replaces. Its title is in italics, as in VS Code.
- **Keeping a tab.** A double click on the row or on the tab, an edit of the page, or `Keep open` in the menu of the tab keeps it; a kept tab stays until it is closed.
- **Reading through.** Previous and Next on an item page, and the results of a search opened one by one, replace the page of the same tab, so reading 18 requirements leaves one tab, not 18.
- **Back.** `Alt+Left` and `Alt+Right` go back and forward through the pages shown, across tabs, as in VS Code; the buttons of the browser follow the URL of the active tab.
- **Side by side.** `Open to the side` in the menu of a row or of a tab (right click or the menu key) splits the content into two groups, each with its own tabs; the user view allows two groups. At 1280 px the side panel collapses while two groups are open, so each half keeps about 65 characters per line.
- **Tab title.** The title of the document or the item, cut with "..." when long; the full title is in the breadcrumb of the page. A document that waits for the user's review shows `(!)` on its tab.
- **Many tabs.** The strip scrolls, and a menu at its end lists every open tab; `Close other tabs` and `Close all tabs` are in the menu of a tab. The close button shows on the active tab and on a tab under the pointer or with the focus; on a touch screen, which has no pointer to show it, it is on every tab.
- **Outside the tabs.** The status bar and the review bar of the document under review belong to the project or to the document, not to one tab.

### 5.7 Activity

The console of the current frame becomes Activity, the first feature of the activity bar. As with every feature, choosing it shows its side panel, and its page opens in a tab ([7.7](#77-activity)):

- **Side panel: the steps of the work, as a tree.** One row per stage, in the order of `stages` in the definition and named by its label, with the steps that the run took in it under it: the turns of an interview grouped under its persona, as in the list of steps of the developer view ([Screen Skeletons: Workflow](skeletons.md#7-workflow)). Each row has a mark that follows the steps and the live events of the run: done, working, waiting for you, failed, or not started, muted, for the stages still to come. The stage that waits for a review has `Open review`, and a rework marks the stage it goes back to as working again, with its new steps under it. It is the graph of the developer view made simple for a user: a list read from top to bottom, without node ids, times or step numbers. The order comes from the definition, so a version with more stages or another order gives a longer or a reordered list, and D0 holds ([open point 14](#11-open-points)).
- **Tab: the chat.** The model behind it is still a conversation: a message of the user goes to the run, which reads it at the next safe point ([Runtime: messages during a run](../architecture/runtime.md#5-messages-during-a-run)). Most of what the chat shows is not conversation, though: the work done, short findings of the agents, the documents written, the reviews, and now and then a message of the user.

| Entry | Example | Form |
|---|---|---|
| Work done | "Interviewed the student: 12 questions" | One muted line with the time; the turns of one interview are one line |
| Finding | "The student and the admin disagree on who approves a booking." | Short text under the agent role that wrote it; item keys are links |
| Document | "Requirements analysis, version 4" | One line with a link to the document |
| Review | "Analysis review: waiting for you" with `Open review`; later "You approved the personas" | A line with the button while it waits, the answer after |
| Message of the user | "Also ask about group sessions." | The text, with "Will be read after the current step" until a step reads it |

- The entries are lines of a feed, in order of time, without chat bubbles or avatars: the work done and the messages share one list.
- The box at the bottom is one line high until the user types, labeled "Ask or request a change"; `@` mentions an item and `/` lists the commands, as accelerators.
- The icon of Activity on the activity bar shows a dot when entries arrive while the chat is not on screen.
- A project opens at the chat of Activity, and the pill of the status bar opens it too.

Name of the feature:

| Name | Says | Trade-offs |
|---|---|---|
| Chat | A conversation | Most entries are not messages; the word promises a chatbot that answers anything |
| Assistant | Who works on the project | Says who, not what the feature shows; the work is done by several agent roles |
| Activity | What happened, with the messages in between | A common word for a list that mixes events and comments. It is close to "activity bar", the name of the bar on the left in these docs and in the code, and Microsoft Teams uses Activity for its notifications |
| Updates | What is new | The messages of the user and the answers to reviews do not fit the word |
| Progress | Where the work is | Says nothing about messages and reviews; little to show once the run has finished |
| Console, Log | A record of the system | Words of developers |

**Proposal.** Activity, for the feature and the title of its tab. The label is for users, who never see the words "activity bar".

## 6. Frame options

The skeletons use the project of the API examples, at a window width of 1280 px. Options A, B and C drop the activity bar, the editor tabs, the bottom panel and the status bar from the user view; option D keeps the activity bar and the tabs, and drops the bottom panel and the status bar.

Marks used in the skeletons:

| Mark | Meaning |
|---|---|
| `(v)` | A document approved at a review |
| `(>)` | A document the agents are writing |
| `(!)` | A document that waits for the user's review |
| `( )` | A document not started |
| `[ Name ]` | A button; `v` after a name opens a menu |
| `[ Search or run a command   Ctrl+K ]` | The command palette box in the top bar |
| `[Name]` | The selected row of a side panel, or the active tab, without spaces inside the brackets |
| `[D]`, `[S]`, `[T]`, `[*]` with a word under them | A feature on the activity bar: Documents, Search, Trace, Settings |
| `>` at the left edge of the activity bar | The feature whose side panel is shown |
| `x` after a tab title | The close button of the tab |
| `_Name_` in a tab | The preview tab, whose title is in italics |
| `v` and `>` before a row | An expanded and a collapsed section of the outline |
| `*` after a title | An item edited by the user and not yet reviewed |
| `(NT)` | The user menu |

### 6.1 Option A: conversation first

**Apps.** ChatGPT with Canvas, Claude with Projects and Artifacts, Lovable, Gemini Canvas.

```text
+----------------------------------------------------------------------------------------------+
| khoai                          [ Search or run a command   Ctrl+K ]            [?]    (NT)   |
+-----------------------+-------------------------------------+--------------------------------+
| [ + New project ]     | Mentor platform                     | Requirements analysis      [x] |
|                       | Waiting for you: Analysis review    | Version 4, ready for review    |
| PROJECTS              |                                     |                                |
| Mentor platform     ! | You                                 | Disagreements (1)              |
| Library booking       | I want to build an online platform  |   Who approves a booking       |
| Campus food ordering  | for students to find mentors.       |                                |
|                       |                                     | Needs clarifying (2)           |
| THIS PROJECT          | +---------------------------------+ |   "Fast" search has no number  |
|   Interview plan      | | Interviewed 3 personas          | |   Session length not given     |
|   Personas            | | Student, Mentor, Admin [ Open ] | |                                |
|   Interviews          | +---------------------------------+ | Requirements (24)              |
|   Analysis          ! |                                     |   Layered booking flow   Must  |
|   Specification       | +---------------------------------+ |   Mentor availability    Must  |
|   Backlog             | | Analysis is ready               | |   Session reminders    Should  |
|                       | | 24 requirements, 1 disagreement | |   ...                          |
|                       | |           [ Review analysis ]   | |                                |
|                       | +---------------------------------+ +--------------------------------+
|                       | +---------------------------------+ | [ Request changes ] [Approve]  |
| Settings              | | Ask or tell the assistant...    | |                                |
|                       | +---------------------------------+ |                                |
+-----------------------+-------------------------------------+--------------------------------+
```

- **Where the jobs are.** Progress: cards in the conversation. Review: the card button opens the document on the right with the review bar. Reading: the right panel, or the document alone after closing the conversation.
- **Change from the current frame.** The console becomes the main column, with cards instead of step lines; the artifact tree becomes a short list of documents in the sidebar.
- **Trade-offs.** The most familiar model, and it passes D0: the cards are events of the run, whatever the workflow. The work done so far scrolls away with the cards (the status line under the project name covers part of it). With the conversation open, the document panel is about 500 px wide, about 55 characters per line, and the tables of the analysis are cramped. Three columns at 1280 px. An item opens inside the same panel, where 9 to 11 fields with lists have the same width problem; the outline of the document has no place left, so items are reached through the rows of the document or by closing the conversation.

### 6.2 Option B: steps (rejected)

**Apps.** Kiro specs (one file per phase, approved before the next), Gemini Deep Research (plan, then research, then report). Pattern: the progress indicator of the Carbon design system.

**What it was.** A stepper under the top bar with one step per group of stages (Plan, Personas, Interviews, Analysis, Specification, Backlog), each step opening its document, with an outline column on the left.

**Why it is rejected.** It fails D0.

- The steps are a grouping that the data does not have. The definition has stages and artifact kinds, not steps, so the stepper needs either a grouping rule in the web app, which names the shape of the current workflow, or a grouping added to the definition only to serve one layout.
- The form assumes a short, linear workflow. An experiment with more stages, stages in parallel, an optional stage or another loop changes the number and the order of the steps: the case in which Carbon advises against a progress indicator, and in which NN/g finds that staged disclosure breaks down because the steps depend on each other.
- The navigation, the hardest part of the frame to change, would follow the part of the system that every experiment is meant to change.

**What option C keeps from it.** The state of the project always in view, as a state built from the run instead of a row of steps; the document at full width with the review bar at its bottom; and the outline that reaches every item.

### 6.3 Option C: documents and outline

**Apps.** Notion (nested pages in a labeled sidebar), ReqView (the document tree beside the requirements), NotebookLM (sources on the left), Google Docs (the outline beside the text).

```text
+----------------------------------------------------------------------------------------------+
| khoai / Mentor platform v      [ Search or run a command   Ctrl+K ]    [ Activity ]   (NT)   |
+------------------------------+---------------------------------------------------------------+
| (v) Interview plan           |                                                               |
| (v) Personas                 |   Requirements analysis                        [ Export v ]   |
| (v) Interviews             3 |   Ready for your review. 24 requirements from 3 interviews.   |
| (!) [Requirements analysis]  |                                                               |
|     v Disagreements        1 |   Disagreements (1)                                           |
|         Who approves a bo... |   Who approves a booking                                      |
|     v Needs clarifying     2 |   The student wants to book at once; the admin wants to       |
|         "Fast" search        |   approve each session.                                       |
|         Session length       |                                                               |
|     > Stated needs        31 |   Needs clarifying (2)                                        |
|     v Requirements        24 |   "Fast" search has no number                                 |
|         Layered booking f... |   Session length is not given                                 |
|         Mentor availability  |                                                               |
|         ...                  |   Requirements (24)                                           |
|     > Unstated needs       3 |   Layered booking flow *                Must                  |
|     > Assumptions          4 |   Mentor availability                   Must                  |
| ( ) Specification            |   ...                                                         |
| ( ) Backlog                  +---------------------------------------------------------------+
| ( ) Validation reports       |   Does this analysis capture what the users need?             |
|                              |   You edited 1 requirement.                                   |
|                              |                    [ Request changes ]  [ Approve analysis ]  |
+------------------------------+---------------------------------------------------------------+
|   (!) Waiting for you: Analysis review                                                       |
+----------------------------------------------------------------------------------------------+
```

- **Where the jobs are.** Status: the status bar, on every screen of the project. Review: the status bar, or the document marked `(!)`, opens the document with the review bar at its bottom; the status bar has no `Open review` button here because the review is already on screen. Reading: the content column, about 1000 px with the sidebar open, the text capped at 70 characters. Items: the open document expands in the sidebar to its sections and items, and a click opens the item page ([7.4](#74-item-page)).
- **What it reads.** Only what every definition version has, see [5.1](#51-top-level) and [5.2](#52-where-the-project-stands): the artifact kinds in the order of the definition, the artifacts of the project and their items, the state of the run, the label of the current stage and the pending review. A definition version with another shape gives a longer or a shorter list and another label, never another layout.
- **Change from the current frame.** Five regions instead of seven: the top bar, the sidebar, the content, a right panel for the Activity panel or a peek (closed here), and the status bar. The activity bar and the explorer merge into one sidebar with text labels, in which only the open document is expanded; the console becomes the Activity panel; the graph, runs and steps move to the developer view.
- **Trade-offs.** The closest option to the current structure, so the cheapest to build. The order of the documents says what usually comes next, but not where the run is inside the workflow: the status bar names the stage, and the graph of the developer view shows the path. A document with many items makes the sidebar long while it is open. Below 1440 px the sidebar and the right panel take turns. Two documents cannot be seen side by side.

### 6.4 Option D: workbench with labels

**Apps.** VS Code, the frame of the current design; Microsoft Teams and the navigation rail of Material 3, for the label under each icon.

```text
+----------------------------------------------------------------------------------------------+
| khoai / Mentor platform v      [ Search or run a command   Ctrl+K ]                   (NT)   |
+----------+--------------------------+--------------------------------------------------------+
|   [A]    | (v) Interview plan       | [Requirements analysis] x | Layered booking flow x     |
| Activity | (v) Personas             +--------------------------------------------------------+
|          | (v) Interviews         3 |   Requirements analysis                 [ Export v ]   |
|>  [D]    | (!) Requirements analysis|   24 requirements from 3 interviews.                   |
|>Documents|     v Disagreements    1 |                                                        |
|          |         Who approves ... |   Disagreements (1)                                    |
|   [S]    |     v Needs clarifying 2 |   Who approves a booking                               |
|  Search  |         "Fast" search    |   The student wants to book at once; the admin         |
|          |         Session length   |   wants to approve each session.                       |
|   [T]    |     > Stated needs    31 |                                                        |
|  Trace   |     v Requirements    24 |   Needs clarifying (2)                                 |
|          |         Layered booki... |   "Fast" search has no number                          |
|          |         Mentor availa... |   Session length is not given                          |
|          |         ...              |                                                        |
|          |     > Unstated needs   3 |   Requirements (24)                                    |
|          |     > Assumptions      4 |   Layered booking flow *          Must                 |
|          | ( ) Specification        |   Mentor availability             Must                 |
|          | ( ) Backlog              |   ...                                                  |
|          | ( ) Validation reports   +--------------------------------------------------------+
|          |                          |   Does this analysis capture what the users need?      |
|   [*]    |                          |   You edited 1 requirement.                            |
| Settings |                          |            [ Request changes ]  [ Approve analysis ]   |
+----------+--------------------------+--------------------------------------------------------+
|   (!) Waiting for you: Analysis review                                                       |
+----------------------------------------------------------------------------------------------+
```

- **Where the jobs are.** Status: the status bar, and a notification when a review starts. Review: the notification, the status bar or the `(!)` document, as in C, with the review bar at the bottom of the document. Reading: one tab, about 900 px wide with the side panel open, the text capped at 70 characters. Items: the outline in the side panel of Documents, and the item page in a tab. Comparing: two tabs, or two groups side by side ([5.6](#56-tabs)). Conversation: Activity, first on the activity bar, with the steps of the work in its side panel and the chat in a tab ([7.7](#77-activity)).
- **What it reads.** The same data as C, and the stages in the order of the definition for the tree of Activity. The activity bar holds features of the app, not stages, so D0 holds.
- **Change from the current frame.** Six regions instead of seven: the bottom panel goes, and the status bar stays at the bottom, in user words. The activity bar stays, with a label under each icon and five features in the user view; Console becomes Activity, the first of them. The tabs stay, with the preview tab of VS Code. The explorer becomes the side panel of Documents, with the outline of the open document.
- **Trade-offs.** More on screen than C: the activity bar and the tab strip are always there, the price of D8 and D9, and a user who never opens a second tab still sees the strip. A preview tab replaced by the next click can surprise a user who does not notice the italics. Below 1440 px the side panel and a peek take turns, and two groups side by side collapse the side panel.

### 6.5 Developer view

Shared by every option. A switch in the settings of the user, which the gear at the bottom of the activity bar opens, turns it on, the way Home Assistant hides configuration options behind a per-user "advanced mode" and Figma switches the same file between Design and Dev Mode.

- **With A and C**, the developer view is the current workbench, unchanged. Both views open the same project and use the same feature components; only the frame differs.
- **With D**, the developer view is the same frame with more in it: the Workflow feature on the activity bar, the bottom panel with the trace and the timeline of an item and the details of a step, the details of the run at the end of the status bar (step, cost against the limit, workflow version), node names and keys first, and the compact density. The switch adds these; it does not change the frame.

So the researcher keeps everything in [Screen Skeletons](skeletons.md), and the user view does not need to make room for the graph, the steps, the state or the cost.

### 6.6 Evaluation

| Driver | A Conversation first | B Steps (rejected) | C Documents and outline | D Workbench with labels |
|---|---|---|---|---|
| D0 Independent of the workflow shape | Yes: the cards are events of the run | No: see [6.2](#62-option-b-steps-rejected) | Yes: artifacts, items and the run only | Yes: features of the app, artifacts, items and the run |
| D1 Status in view | Partly: status line under the project name; the cards scroll away | Yes | Yes: the status bar | Yes: the status bar, and a notification when a review starts |
| D2 Review in few clicks | Yes: the card, 1 click | Yes | Yes: the status bar or the `(!)` document, 1 click | Yes: as C |
| D3 Reading width | No: about 55 characters with the conversation open | Yes | Yes: capped at 70 characters | Yes: capped at 70 characters; about 65 in two groups |
| D4 Known model | Chat assistant | Step-by-step form | Document editor | The tabs of VS Code and a labeled app bar (Microsoft Teams); the most to learn of the four |
| D5 Rework and free order | Yes | Needs a round display | Yes | Yes |
| D6 Build cost | Medium: chat reused; new cards and document panel | - | Low: tree, documents, item view, reviews and chat reused; a new sidebar | Lowest: the frame of the current code stays; labels, density and the content of the side panels change, and a preview tab is added |
| D7 Item reach | Partly: items open in the narrow document panel; no outline | - | Yes | Yes |
| D8 Several things open | Partly: the conversation and one document | - | No: one page at a time | Yes: tabs and two groups side by side |
| D9 Room for features | Partly: sections of the sidebar | - | No: a new feature goes to the project menu | Yes: one entry per feature on the activity bar |

**Recommendation: option D.** It is the only option that passes every driver. It keeps the activity bar and the tabs of the current frame, the two things a non-developer needs to keep several documents open and to find the features of the app, and makes them readable: a label under each icon, only the features of the user view, a preview tab so that reading does not pile up tabs, the state of the run in user words with a notification for reviews, and a lower density. It also costs the least, since it changes what the frame shows rather than the frame. From C it takes the side panel of documents with the outline; from A, a place for the conversation, here the chat of Activity, with the steps of the work beside it.

When another option fits better:

- **C**, if tests show that users never keep two pages open and the app stays limited to documents.
- **A**, if tests show that users mostly steer the agents with messages and rarely read a document in full.

## 7. Screens of option D

### 7.1 Home

The only screen outside a project. The input for a new idea comes first; the list of projects says in words which one waits for the user.

```text
+----------------------------------------------------------------------------------------------+
| khoai                          [ Search or run a command   Ctrl+K ]            [?]    (NT)   |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|                  What product do you want to write the requirements for?                     |
|                                                                                              |
|          +------------------------------------------------------------------------+          |
|          | Describe the idea, who it is for and the problem it solves...          |          |
|          |                                                                        |          |
|          | Options v                                                  [ Start ]   |          |
|          +------------------------------------------------------------------------+          |
|                                                                                              |
|          Your projects                                                                       |
|          --------------------------------------------------------------------------          |
|          Mentor platform           Waiting for you: Analysis review       2 min ago          |
|          Library booking           Working: Interviewing                  1 hour ago         |
|          Campus food ordering      Done                                   yesterday          |
|          ...                                                                                 |
|                                                                   [ Archived projects ]      |
+----------------------------------------------------------------------------------------------+
```

- `Options` opens the fields that have defaults: project name (taken from the first line of the idea), output language, number of personas, and the reviews to ask for.
- An empty list shows one sentence under the input and no other block.

### 7.2 Agents working

The document being written is shown as it grows: here the interview with the second persona. The chat of Activity stays in its tab, and Activity on the activity bar shows a dot when entries arrive.

```text
+----------------------------------------------------------------------------------------------+
| khoai / Library booking v      [ Search or run a command   Ctrl+K ]                   (NT)   |
+----------+--------------------------+--------------------------------------------------------+
|   [A]    | (v) Interview plan       | [Interview with the Librarian] x                       |
| Activity | (v) Personas             +--------------------------------------------------------+
|          | (>) Interviews           |                                                        |
|>  [D]    |     (v) Student          |   Interview with the Librarian                         |
|>Documents|     (>) [Librarian]      |   In progress. Question 4, at most 6.                  |
|          |     ( ) Admin            |                                                        |
|   [S]    | ( ) Requirements analysis|   3  Interviewer  Which rooms are booked the most?     |
|  Search  | ( ) Specification        |      Librarian    The group rooms on the second        |
|          | ( ) Backlog              |                   floor, every afternoon in exams.     |
|   [T]    | ( ) Validation reports   |                                                        |
|  Trace   |                          |   4  Interviewer  How do you handle a room that        |
|          |                          |                   is booked but not used?              |
|          |                          |      Librarian    We release it after 15 minutes,      |
|          |                          |                   but nobody tells the...              |
|          |                          |                                                        |
|          |                          |   You can close this page. The work goes on, and       |
|   [*]    |                          |   the project is marked on the home page when it       |
| Settings |                          |   needs you.                                           |
+----------+--------------------------+--------------------------------------------------------+
|   (>) Working: Interviewing  [ Stop ]                                                        |
+----------------------------------------------------------------------------------------------+
```

- `Interviews` is a group, because a project has one transcript per persona; the Admin has no transcript yet, so the persona is listed as not started.
- "At most 6" is `max_turns` of the run settings.

### 7.3 Review: requesting changes

The review bar of [6.4](#64-option-d-workbench-with-labels) after `Request changes`. The options and their labels come from the checkpoint; the feedback box appears because the chosen option requires it.

```text
+---------------------------------------------------------------+
|   Does this analysis capture what the users need?             |
|                                                               |
|   What should happen next?                                    |
|   ( ) Redo the analysis with my feedback                      |
|   (o) Interview the personas again                            |
|                                                               |
|   Feedback (required)                                         |
|   +---------------------------------------------------------+ |
|   | Ask the student and the admin whether a layered design  | |
|   | works for both.                                         | |
|   +---------------------------------------------------------+ |
|                                     [ Cancel ]  [ Send ]      |
+---------------------------------------------------------------+
```

### 7.4 Item page

One item in a tab, opened from the outline. Here the specification is approved and the agents are writing the backlog; the user reads the specification item by item, with the interview of the source open in a third tab.

```text
+----------------------------------------------------------------------------------------------+
| khoai / Mentor platform v      [ Search or run a command   Ctrl+K ]                   (NT)   |
+----------+--------------------------+--------------------------------------------------------+
|   [A]    | (v) Interview plan       | Specification x | [Search mentors] x | _Interview..._ x|
| Activity | (v) Personas             +--------------------------------------------------------+
|          | (v) Interviews         3 |   Specification > 3 Functional > 3.1 Mentor discovery  |
|>  [D]    | (v) Requirements analysis|                                                        |
|>Documents| (v) Specification        |   Search mentors                            [ Edit ]   |
|          |     v 3   Functional  12 |   REQ-001   Must   Functional   Approved, version 3    |
|   [S]    |       v 3.1 Mentor dis...|   Based on [AR-001 The system lists...]                |
|  Search  |         [Search mentors] |   Based on this item [US-001 Search by field]          |
|          |         Filter by field  |                                                        |
|   [T]    |       > 3.2 Booking    5 |   Statement                                            |
|  Trace   |       > 3.3 Sessions   5 |   The system shall let a student [search mentors by    |
|          |     > 4   Non-funct... 6 |   field of study].                                     |
|          | (>) Backlog              |                                                        |
|          | ( ) Validation reports   |   Rationale                                            |
|          |                          |   Students named finding a mentor in their field as    |
|          |                          |   their main problem.                                  |
|          |                          |                                                        |
|          |                          |   Acceptance criteria                                  |
|          |                          |   1. Searching by a field of study lists only mentors  |
|          |                          |      of that field                                     |
|          |                          |                                                        |
|          |                          |   Verification     Test                                |
|          |                          |                                                        |
|          |                          |   Why this item exists                                 |
|          |                          |     Based on  AR-001  The system lists mentors by...   |
|          |                          |       Based on  RAW-001  I want to find a mentor...    |
|          |                          |         Student interview, turn 2             Read     |
|          |                          |         [I ask seniors in my club], but I never know   |
|          |                          |         who is free this week, so I give up.           |
|   [*]    |                          |                                                        |
| Settings |                          |   [ History ]                   3 of 18   [ < ]  [ > ] |
+----------+--------------------------+--------------------------------------------------------+
|   (>) Working: Backlog  [ Stop ]                                                             |
+----------------------------------------------------------------------------------------------+
```

- The breadcrumb links to the document and to each section. `3 of 18` is the position in the outline order of the specification; `[ < ]` and `[ > ]` are Previous and Next, inside this tab, floating over the bottom right corner; `[ History ]` floats over the bottom left corner.
- The line under the title holds the key, the fields the user compares between items (priority and type) and the review status.
- Quality category and fit criterion are empty for this requirement, so they are hidden; `Edit` shows every field of the content schema.
- The two lines under the key line are the links of the item: `Based on [AR-001 ...]` for its own link, `Based on this item [US-001 ...]` for the link of the user story built from it. `[search mentors by field of study]` in the statement are the words that come from AR-001, marked; a click on them or on a chip opens a card with AR-001 and `Open`.
- `Why this item exists` follows the `derived_from` chain down to the raw requirement and ends with the words of the interview that it quotes, marked in the message; `Read` opens the transcript at that message in the preview tab, drawn here as `_Interview..._` for its italic title. It sits at the end of the page and sums up the chain that the marks point into.
- `[ History ]` replaces the TIMELINE tab of the current bottom panel ([5.4](#54-opening-an-item)); while it is open, the page shows the selected version and hides the links. The tree draws its states as colors and letters ([5.3](#53-inside-a-document-sections-and-items)); the marks `(v)`, `(>)`, `(!)`, `( )` of the skeletons stand for them in text.
- A persona uses the same page with its 11 fields; its five list fields (goals, interests, constraints, priorities, concerns) are shown as lists under their labels.

### 7.5 Item peek

The key of a row in the table of a document, or a key in an entry of the chat of Activity or of a disagreement, opens the item in the right panel, so the user keeps their place. The links of an item page open their own card instead ([5.4](#54-opening-an-item)). At 1280 px the side panel collapses while the right panel is open; the activity bar stays.

```text
+----------------------------------------------------------------------------------------------+
| khoai / Mentor platform v      [ Search or run a command   Ctrl+K ]                   (NT)   |
+----------+----------------------------------------------------+------------------------------+
|   [A]    | [Requirement specification] x                      | Search mentors           [x] |
| Activity +----------------------------------------------------+ REQ-001   Must   Approved    |
|          |   Requirement specification    [ Edit ] [ Export ] |                              |
|>  [D]    |   Approved, version 2                              | The system shall let a       |
|>Documents|                                                    | student search mentors by    |
|          |   3    Functional requirements                     | field of study.              |
|   [S]    |   3.1  Mentor discovery                            |                              |
|  Search  |        How a student finds a mentor.               | Why this item exists         |
|          |                                                    |  Based on AR-001             |
|   [T]    |        [REQ-001] Search mentors      Must    Test  |   Based on RAW-001           |
|  Trace   |         REQ-002  Filter by field     Should  Test  |    Student interview, turn 2 |
|          |   3.2  Booking                                     |    [I ask seniors in my club]|
|          |         REQ-005  Book a 30-minute... Must    Test  |           [ Open as page ]   |
|   [*]    |        ...                                         |                              |
| Settings |                                                    |                              |
+----------+----------------------------------------------------+------------------------------+
|   (>) Working: Backlog  [ Stop ]                                                             |
+----------------------------------------------------------------------------------------------+
```

- `[REQ-001]` is the key of the row, a button "Quick look at REQ-001", pressed while its item is peeked; the title of the row stays the link to the item page.
- The peek holds the title, the key line, the main field and "Why this item exists"; every other field is on the item page. `[x]` reads "Close the quick look" for assistive technology; Escape closes it too, and the focus goes back to the key.
- `Open as page` opens the item page in the preview tab; a double click on the tab keeps it.
- **Export.** `[ Export ]` beside the title of a document (its label for assistive technology "Export Requirement specification") opens one dialog: the documents to export as a list of choices (the export templates of the definition), the formats of the chosen one, and Export; the palette has the same commands ("Export: Requirement specification"). Export closes the dialog; a notice says that the file is being prepared, then the file downloads by itself and the notice offers "Download again", or says that the export failed and offers "Try again". A reload forgets the exports being prepared; the list of the exports of a project comes with Settings. Export stays enabled while the agents work, since it reads the stored versions.

### 7.6 Search results

Enter in the command palette after "booking" opens the Search feature with the query; the user has opened the first result.

```text
+----------------------------------------------------------------------------------------------+
| khoai / Mentor platform v      [ Search or run a command   Ctrl+K ]                   (NT)   |
+----------+--------------------------+--------------------------------------------------------+
|   [A]    | [ booking              ] | [_Book a 30-minute session_] x                         |
| Activity | [ All kinds v ]          +--------------------------------------------------------+
|          | [ Any status v ]         |   Results for "booking" > Specification > 3.2 Booking  |
|   [D]    | 14 results               |                               1 of 14   [ < ]  [ > ]   |
|Documents |                          |                                                        |
|          | v Specification        5 |   Book a 30-minute session                  [ Edit ]   |
|>  [S]    |     [Book a 30-minu...]  |   REQ-005   Must   Functional   Approved, version 1    |
|>  Search |     Cancel a booking     |                                                        |
|          |     ...                  |   Statement                                            |
|   [T]    | v Requirements analysis 6|   The system shall let a student [[book]] a            |
|  Trace   |     Who approves a bo... |   30-minute session with a free mentor.                |
|          |     Layered booking flow |                                                        |
|          |     ...                  |   Source                                               |
|          | v Interviews           3 |   Student, interview, answer 6              [ Read ]   |
|          |     Student, answer 6    |   "I tried to [[book]] a mentor twice and gave up."    |
|   [*]    |     to [[book]] a mentor |                                                        |
| Settings |     ...                  |   > Based on and used by (2)                           |
+----------+--------------------------+--------------------------------------------------------+
|   (>) Working: Backlog  [ Stop ]                                                             |
+----------------------------------------------------------------------------------------------+
```

- `[[ ]]` marks the matching text: in the side panel when the match is not in the title, and in the open item.
- Each result opens in the preview tab, so going through the 14 results leaves one tab; a double click keeps one. Previous and Next go through the results, and the breadcrumb starts with the query.
- The filters are the item kind and the review status, the filters of the items endpoint.
- Documents on the activity bar brings back the list of documents and the outline; the tabs stay as they are.

### 7.7 Activity

Activity on the activity bar while the agents interview the librarian: the steps of the work in the side panel, and the chat in its tab.

```text
+----------------------------------------------------------------------------------------------+
| khoai / Library booking v      [ Search or run a command   Ctrl+K ]                   (NT)   |
+----------+--------------------------+--------------------------------------------------------+
|>  [A]    | (v) Planning             | [Activity] x                                           |
|>Activity | (v) Persona generation   +--------------------------------------------------------+
|          | (v) Persona review       |   09:12  Wrote the interview plan                      |
|   [D]    | (>) Interviewing         |   09:20  Wrote 3 personas                              |
|Documents |     (v) Student       12 |   09:21  Persona review: you approved them             |
|          |     (>) Librarian      4 |                                                        |
|   [S]    | ( ) Analysis             |   Agents                                               |
|  Search  | ( ) Analysis review      |   The student and the librarian disagree on how        |
|          | ( ) Specification        |   long a booked room stays free.                       |
|   [T]    | ( ) Specification review |                                                        |
|  Trace   | ( ) Backlog              |   You                                                  |
|          | ( ) Validation           |   Also ask about group rooms.                          |
|          |                          |   Will be read after the current step                  |
|          |                          |                                                        |
|          |                          |   09:40  Interviewed the student: 12 questions         |
|          |                          |                                                        |
|          |                          | +----------------------------------------------------+ |
|   [*]    |                          | | Ask or request a change                            | |
| Settings |                          | +----------------------------------------------------+ |
+----------+--------------------------+--------------------------------------------------------+
|   (>) Working: Interviewing  [ Stop ]                                                        |
+----------------------------------------------------------------------------------------------+
```

- The side panel lists the stages of the definition in its order, each named by its label; the interviews hold one row per persona, with the number of questions asked. The stage in progress is marked `(>)`, and it moves as the events of the run arrive; the stages still to come are marked `( )`, muted.
- The chat is a tab like any other: it stays open beside a document in a second group ([5.6](#56-tabs)), and the preview tab of a document opened from an entry does not replace it.
- A key in an entry opens the item in a peek ([7.5](#75-item-peek)); a document in an entry opens it in the preview tab.

### 7.8 Trace

Trace while the specification of the mentor platform is under review: the overview and the tree of the documents in the side panel, and the chain of one requirement as a graph. The layout is in the [wireframe](wireframes/s4-trace.html); the words and the rules are below.

```text
+----------------------------------------------------------------------------------------------+
| khoai / Mentor platform     [ Search or run a command   Ctrl+K ]                      (NT)   |
+----------+--------------------------+--------------------------------------------------------+
|>  [W]    | Overview                 | [Trace of Layered booking flow] x                      |
|> Trace   |   Requirements with-      +--------------------------------------------------------+
|          |   out a user story   3   |                                                        |
|   [D]    |   Requirements with-      |  Interview, student                                    |
|Documents |   out a source       2   |     ^                                                  |
|          |   Links to check     2   |     |  Based on                                       |
|   [S]    |   Open issues        3   |     v                                                 |
|  Search  |                          |  Students book a session at once                       |
|          | Documents                |     ^                                                  |
|          | v Interview transcripts  |     |  Based on (!) made from version 3              |
|          | v Requirements analysis  |     v                                                 |
|          |     (!) Layered book...  |  Layered booking flow                                  |
|          |     ( ) Filter by fi...  |     ^                                                  |
|          | v Requirement specif...  |     |  Concerns                                       |
|          |     ( ) Search mentors   |     v                                                 |
|          |                          |  Fast has no number                                    |
|          |                          |                                                        |
|   [*]    |                          |  (?) How to read the lines                             |
| Settings |                          |  v Read the links as a list                            |
+----------+--------------------------+--------------------------------------------------------+
```

- **The word.** Trace means following a requirement to where it comes from and to what was built from it. The trace of a run is another object, "Run trace", which only the developer view names.
- **The side panel, two sections.** "Overview" holds one row per gap of the coverage, its title and its one-sentence description from the workflow definition or the server (version 1: "Requirements without a user story", "Requirements without a source", "Links to check"), each with its count in the tone of its level of attention, neutral at zero; "Open issues" closes the section with its count. "Documents" holds the documents of the project and, under an open document, its items, in the layout and the colors of the tree of Documents, with marks of its own: a document row shows up to two counts (its items that need a check, its items missing a link or still open), never a letter; an item row shows the icon of its level of attention, with its reasons in a tooltip, and no mark when the item needs nothing. A row of a gap opens its page in the preview tab; a click on an item opens its chain.
- **The start page.** When no item is chosen, the page says what Trace is, carries the sentence "Choose an item in the side panel to follow where it comes from and what was built from it.", and offers "Show the open issues".
- **The chain of an item.** "Trace of Layered booking flow" opens in a tab of its own. The graph reads left to right: the interviews on the left, the backlog on the right, and an arrow goes from an item to the item it is based on, so the title of the link reads along the arrow, pointing left. A chain never turns: it is what the item is based on, followed back to the interviews, and what was built from it, followed forward to the backlog; a sibling is not in the chain, since its own chain shows it.
- **A node and an edge.** A node names an item by its kind and its title, the key only in its tooltip; the node of the item of the page is marked. An edge carries the title of its link, and its look says how much the link asks of the user, by the level of attention, not by good or bad: act (the item it is based on changed after the link was made), a solid thick warning line; follow (the link comes from an open issue), a dashed line in the primary tone; none, a solid thin muted line; quiet (an end was rejected or replaced), a dotted thin muted line. "How to read the lines" states each sentence again in a legend.
- **Choosing a link.** A click on an edge selects it: the edge takes its selected stroke, and the words that the link quotes show inside the node of each side that has them, with "made from version N" beside the title of an out of date link. The selection clears on a click elsewhere, on Escape, on a node, or moves to another link.
- **The actions.** The menu of a node (a right click, the menu key, or its "..." button) holds "Open", "Open in a new tab", "See its trace" and "Link to another item"; the menu of an edge holds "Show the quoted words" and "Remove this link". A link may change only while the document of its source takes changes: a link is a statement about its source, so an action that would change it sits disabled, with the reason. The item page gathers its actions the same way: one "..." button beside the title holds "Edit", "See its trace" and "Link to another item", and the document page the same button with "Edit".
- **A gap.** A gap opens a page in a tab with its description and its items, each named by its kind and its title with its document; a click on one shows its chain. A gap the coverage no longer lists says "This list is not shown anymore."
- **The open issues.** One card per issue: its kind and its title, its status, "The problem" with what the issue says, "Where it applies" with each item it concerns and the words it quotes, and "Between" with the people a disagreement involves; the card ends with "Open" and "See its trace".
- **One set of words.** A link is a link in both views: "Link to another item", "Remove this link", "See its trace". The traceability matrix is the developer view alone, in a later build. Under the graph, "Read the links as a list" writes one sentence per link ("Layered booking flow is based on Students book a session at once."), for a screen reader and for a user who prefers text.

## 8. Size, text and words

### 8.1 Two densities, one design system

The Night Owl tokens, colors and components stay. The components use the Nova style of shadcn/ui with the text sizes of Tailwind: `text-sm` (14 px) for text that people read, `text-xs` (12 px) for text they glance at, and `text-3xs` (11 px) and `text-4xs` (10 px) for numbers. The user view uses a comfortable density; the developer view keeps the compact one of the design system. The compact values are measured in the code; the proposed values are starting points for the prototype, each a step of the Tailwind scale.

| Element | Developer view (compact) | User view (comfortable) |
|---|---|---|
| Body text of a document | 14 px (`text-sm`) | 16 px (`text-base`), line height 1.6, text column capped at 70 characters (about 640 px) |
| Text of navigation, buttons, labels | 14 px (`text-sm`); 12.8 px on small buttons | 14 px (`text-sm`) |
| Secondary text that is read: a description, the hint of a field, a message | 14 px (`text-sm`), muted | 14 px (`text-sm`), nothing smaller |
| Text taken in at a glance: a number (a count, a time, a key), or one or two words, with room around it | 12 px (`text-xs`); 11 px (`text-3xs`) for counts, ids and times; 10 px (`text-4xs`) for a number inside a badge | The same: 12 px, 11 px for counts, ids and times, 10 px only for a number inside a badge |
| Page title | 18 px (`text-lg`), the largest heading; 16 px (`text-base`) for the title of a dialog or a card | 24 px (`text-2xl`), semibold |
| Section heading in a document | 16 px (`text-base`) | 18 px (`text-lg`), semibold |
| Top bar | 56 px, 14 px (`text-sm`) text | 56 px |
| Activity bar | 64 px; an icon with a 12 px (`text-xs`) label under it | 80 px; a 20 px icon with a 12 px (`text-xs`) label under it |
| Side panel | 280 px, collapsible; section titles 32 px | 280 px, collapsible; in Documents, the documents and the outline of the open one; rows of 32 px; each level indents by 16 px |
| Tab strip | 40 px, 14 px (`text-sm`) text; the close button on the active tab, under the pointer and with the focus, and on every tab on a touch screen | 40 px, 14 px text; the close button as in the developer view |
| Status bar | 32 px, 12 px (`text-xs`) text | 32 px; the state of the run at the left in 14 px (`text-sm`), since the user reads it, the bell of the notifications at the right |
| Right panel (peek) | - | 400 px |
| Item page | Editor tab | Content column capped at 760 px; label above value; 24 px between fields |
| Height of a control | 32 px (`h-8`); 28 px and 24 px for the small sizes | 36 px (`h-9`, the large size); 40 px on the review bar |
| Row of a list | About 28 px in the tree; 32 px for section titles | 40 px for documents and requirements |
| Icons | Alone, name in a tooltip | 16 to 18 px, always with a text label |
| Font of the conversation | Monospace | Sans-serif; monospace only for keys and code |

A small size fits text that is short, is glanced at instead of read, and has room around it, such as the count of items next to a section or the time of an entry. A sentence, a name, or a label that the user reads before acting keeps 14 px (`text-sm`) or more.

### 8.2 Copy

- **One status, one place.** The state of the project is said once, in the status bar and the marks of the documents, not again as a badge in the top bar and a card in the conversation.
- **Agents report findings, not process.** "The student and the admin disagree on who approves a booking" instead of "analyst: 24 AR, 3 AMB, 1 CONF".
- **Buttons are a verb and a noun.** "Approve analysis", "Interview again", "Restore this version". A button beside the title of what it acts on takes its noun from that title: "Export" and "Edit" sit at the right of the title of the document, and their labels for assistive technology name it ("Export Requirement specification").
- **Numbers only where they lead to a decision.** The count of disagreements leads to reading them; the step number and the token count do not.

### 8.3 Words

| System word | User word |
|---|---|
| Thread, console | Activity (the feature and its chat); the agents (who write in it) |
| Run, step, node | Not shown; "Working" in the status bar |
| Stage | Its title, in the status bar |
| Checkpoint, interrupt | Review |
| Artifact | Document |
| Persona | Interviewee |
| Elicitation plan | Interview plan |
| Raw requirement | Stated need |
| Analyzed requirement | Analysed requirement |
| Spec requirement | Requirement |
| Latent need | Unstated need |
| Ambiguity issue | Needs clarifying |
| Conflict | Disagreement |
| Backlog item | User story |
| Validation issue | Problem found |
| `derived_from`, `evidenced_by` | Based on; Why this item exists (the chain down to the interview) |
| A link to the item, seen from its target | "Based on this item" (the title of the link type, then "this item") |
| `outOfDate` (a link made from an older version of its target) | Based on an older version, `!` |
| Peek | Quick look |
| Revisions | History, Version 3 |
| Restore | Restore this version |
| Accept; Reject and re-analyse; Reject and re-interview | Approve analysis; Redo the analysis; Interview again |
| `max_cost_usd` | Budget |

The titles of the stages, checkpoints, link types, directive kinds, export templates and values of the value lists, the labels of the checkpoint options, and the titles of the artifact kinds and item kinds, come from the workflow definition and the content schemas, so the user words belong there, not in the web app. In version 1 they are written in these words; the `label` of a node stays its id, for the developer view.

## 9. Avoiding a generated look

What makes a screen look generated, and what to do instead:

| Looks generated | Instead |
|---|---|
| Every moved feature becomes a card on an overview dashboard: stat tiles for requirements, cost, steps, tokens | A number appears only on the screen where it leads to a decision |
| Grids of cards with an icon, a title and a description for navigation | A list of text labels, at most one icon each |
| Several primary buttons on one screen | One primary action per screen: Start on home, Approve during a review |
| The document inside a card inside a panel | The document is the page: no frame around it |
| The same status as a badge in three places | One status in one place ([8.2](#82-copy)) |
| Sparkle icons, gradients, "AI-powered" labels | The feature of the agents is named Activity and drawn in the style of the rest of the app |
| Agent messages that describe their own process | Messages that state what was found |
| A new visual style for the user view | The same tokens and components as the developer view, at a different density |

## 10. Reference apps and guidelines

### Frames

| App | What to look at | Option | Link |
|---|---|---|---|
| NotebookLM | Three panels: Sources, Chat, Studio; outputs made from the sources with one click | C | [Google blog: new look](https://blog.google/technology/google-labs/notebooklm-new-features-december-2024/) |
| Lovable | Chat on the left, preview on the right, other controls in the top bar; a non-developer audience | A | [Editor](https://docs.lovable.dev/features/projects/editor), [Chat](https://docs.lovable.dev/features/projects/chat), [pattern page](https://www.saasui.design/pattern/editor/lovable) |
| Kiro specs | Requirements, design and tasks as three phases, each approved before the next | B (rejected): the phases are fixed in Kiro, not in this workflow | [Specs](https://kiro.dev/docs/specs/) |
| Claude Projects | A project holds its conversations and documents | A | [What are projects](https://support.anthropic.com/en/articles/9517075-what-are-projects) |
| Gemini Canvas | Chat beside a document the assistant writes | A | [Canvas](https://gemini.google/overview/canvas/) |
| Notion | A labeled sidebar of pages; the page is the document | C | [Navigate with the sidebar](https://www.notion.com/help/navigate-with-the-sidebar) |
| Notion databases | A record opens as a side peek, a center peek or a full page, chosen per view | Opening an item (5.4) | [Release notes, July 2022](https://www.notion.com/releases/2022-07-20) |
| Jama Connect | The same requirements as a table (list view), as a document to read (reading view) and as a document to edit (document view) | Document and item views | [Document view](https://help.jamasoftware.com/en/get-started/getting-started/exploring-the-jama-connect-workspace/document-view.html), [Reading view](https://help.jamasoftware.com/en/get-started/getting-started/exploring-the-jama-connect-workspace/reading-view.html) |
| ReqView | The document tree on the left, the requirements table and the attributes of the selected one | C and D: the outline under the open document | [ReqView](https://www.reqview.com/) |
| Jira | `J` and `K` move to the next and previous issue | Previous and Next on the item page | [Jira keyboard shortcuts](https://www.atlassian.com/blog/jira/4-ways-get-jira-keyboard-shortcuts) |
| Linear | One inbox for what needs the user; a project page with its updates | C, home page | [Inbox](https://linear.app/docs/inbox), [Projects](https://linear.app/docs/projects) |
| Zapier | Steps stacked vertically instead of a canvas, described as easier for non-technical users than the canvas of Make | Why the graph goes to the developer view | [Create Zaps](https://help.zapier.com/hc/en-us/articles/8496309697421-Create-Zaps), [Zapier vs Make](https://www.breeze.pm/articles/zapier-vs-make) |
| VS Code | The frame the current design copies; the preview mode of its tabs (T2) | D, developer view | [User interface](https://code.visualstudio.com/docs/getstarted/userinterface), [Preview mode](https://code.visualstudio.com/docs/getstarted/userinterface#_preview-mode) |
| Microsoft Teams | The app bar on the left: one entry per feature, a label under each icon | D | [Layout of Teams](https://support.microsoft.com/en-us/office/learning-the-layout-of-microsoft-teams-with-a-screen-reader-e4010853-2e97-4364-8fab-1848450102cf) |

### A separate view for experts

| App | What to look at | Link |
|---|---|---|
| Home Assistant | Configuration options hidden behind an "advanced mode" switch in the user profile, per user | [Release 0.96](https://www.home-assistant.io/blog/2019/07/17/release-96/) |
| Figma | Dev Mode: a developer interface over the same file, switched with a toggle | [Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247) |

### Guidelines

| Topic | Link |
|---|---|
| The five planes (strategy to surface) | [UX Design Institute: the 5 elements of UX design](https://www.uxdesigninstitute.com/blog/5-elements-of-ux-design/) |
| Progressive disclosure, two levels, staged disclosure | [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) |
| When a step-by-step flow fits and when it does not | [NN/g: Wizards](https://www.nngroup.com/articles/wizards/) |
| Visible text labels on icons | [NN/g: Icon Usability](https://www.nngroup.com/articles/icon-usability/) |
| The ten heuristics: system status, real-world words, recognition, accelerators, minimalist design | [NN/g: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), [Visibility of system status](https://www.nngroup.com/articles/visibility-system-status/), [Match with the real world](https://www.nngroup.com/articles/match-system-real-world/), [Flexibility and efficiency](https://www.nngroup.com/articles/flexibility-efficiency-heuristic/), [Aesthetic and minimalist design](https://www.nngroup.com/articles/aesthetic-minimalist-design/) |
| Left-side navigation | [NN/g: Vertical Navigation](https://www.nngroup.com/articles/vertical-nav/), [Apple HIG: Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Material 3: Navigation rail](https://m3.material.io/components/navigation-rail/overview) |
| Stepper: when to use it, and when not (steps that change with logic) | [Carbon: Progress indicator](https://carbondesignsystem.com/components/progress-indicator/usage/), [Atlassian: Progress tracker](https://atlassian.design/components/progress-tracker/) |
| Line length of 50 to 75 characters | [Baymard: Line Length Readability](https://baymard.com/blog/line-length-readability) |

### Galleries to browse

| Site | Use |
|---|---|
| [Mobbin](https://mobbin.com/) | Screens and flows of real web apps; filter by pattern (sidebar, onboarding, empty state) |
| [SaaS UI](https://www.saasui.design/) | Patterns of SaaS apps, one page per app and pattern |

## 11. Open points

1. **Documents still to come.** Settled (2026-11-01): the artifact kinds that have no artifact yet are listed, muted, while the project has an unfinished run, and hidden once it has none.
2. **Switch to the developer view.** A per-user setting or a URL prefix; every user or only a researcher role.
3. **Language of the UI.** Vietnamese, English or both is an open question of the planning; the user words of [8.3](#83-words) need a Vietnamese set too.
4. **Time left.** "About N minutes left" in the status bar needs durations of past runs; the API does not provide them today, so the skeletons show only counts.
5. **Several runs in one project.** The status bar shows one run per project, which matches [Screen Skeletons, open point 1](skeletons.md#10-open-points) only if a project allows one active run.
6. **Groups of documents.** Interview transcripts (one per persona) and validation reports (one per run of the validator) are groups in the side panel of Documents. Open: whether the group of validation reports shows every report or only the latest.
7. **Item addresses.** Settled (2026-11-01): the item page URL holds the `id` of the item, as every path of the API.
8. **Order of the groups in the outline.** Settled (2026-11-01): a document without sections groups its items by item kind in the order of the definition, with no rule in the web app; another order is a change of the definition. The skeletons on this page still put disagreements first and are not redrawn.
9. **Peek or page from a row.** The key of a row opens a peek and its title opens the page; if tests show that users mostly read items in full, the key opens the page instead.
10. **Stage titles for the user.** Settled: the status bar shows the `title` of the current stage. A stage marked `internal`, such as "Intent routing", is not shown, and the status bar keeps the title of the previous stage. The wireframes in this page still show the earlier wording, such as "Waiting for you: Analysis review"; their boxes are drawn for the shorter text and are not redrawn.
11. **Preview tab for non-developers.** Whether the italic title is enough for a non-developer to notice that the next click replaces the tab ([5.6](#56-tabs)); if tests show it is not, a clearer mark on the tab. Also open: whether the open tabs come back when the project opens again on another device.
12. **Trace on the activity bar.** Settled (2026-11-07): a feature of its own, named "Trace", as proposed; the matrix of the developer view is a later build.
13. **Name of the feature of the agents.** Activity, as proposed in [5.7](#57-activity), or another name of its table, and the label of its input box.
14. **Stages that a run skips in Activity.** The tree lists every stage of the definition in the order of `stages`, so a stage that a run never reaches (an optional branch of an experiment) stays not started, as a document does in [open point 1](#11-open-points), and the same choice applies. The first and the last stage of version 1, intent routing and done, name no work for the user; the skeleton of [7.7](#77-activity) leaves them out, which needs the mark of an internal stage of [open point 10](#11-open-points).

## 12. Next steps

- [ ] Choose a frame option: A, C or D (B is rejected by D0)
- [ ] Confirm the brief and the jobs of [section 2](#2-users-and-their-jobs) with two or three target users
- [x] Decide whether documents still to come are listed ([open point 1](#11-open-points))
- [ ] In the same test, check that users notice a review that starts while they read another document (status bar at the bottom and a notification, see [5.2](#52-where-the-project-stands))
- [ ] Draw the chosen frame from a second test definition with another shape (more stages, a loop, a new artifact kind) to check D0
- [ ] Agree the user words of [8.3](#83-words) and move them into the labels of the workflow definition
- [ ] Build the chosen option as a clickable prototype with real content, then test it with three non-developers on four tasks: "Where is your project and does it need you?", "Send the analysis back for more interviews", "Find the requirement about booking a session and change its priority" and "Open a requirement and the interview it comes from side by side"
- [ ] Update [Screen Skeletons](skeletons.md): the current frame as the developer view, the new frame as the user view
