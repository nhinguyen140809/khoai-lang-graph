# Screen Skeletons

ASCII skeletons of the main screens of the web app. The layout follows VS Code: a top bar with the app and the project, an activity bar with the features of the project on the left, a side panel to navigate inside the chosen feature, an editor with tabs, and a status bar. The chat follows agent behavior in the terminal: one stream of messages and agent steps, with an input box at the bottom.

The skeletons fix the regions and what each one holds; sizes, colors and components come later. The apps behind this layout are in [UI Reference Apps](reference-apps.md), and the data each region draws is in [Web App](../architecture/web-app.md) and [API design](../API.md). The examples use the project of the API examples: an online platform where university students find mentors.

## Contents

- [Screen Skeletons](#screen-skeletons)
  - [Contents](#contents)
  - [1. Frame](#1-frame)
  - [2. Project list](#2-project-list)
  - [3. Chat](#3-chat)
  - [4. Review](#4-review)
  - [5. Artifacts](#5-artifacts)
  - [6. Artifact as a document](#6-artifact-as-a-document)
  - [7. Workflow](#7-workflow)
  - [8. Trace](#8-trace)
  - [9. Project settings](#9-project-settings)
  - [10. Open points](#10-open-points)

---

## 1. Frame

Every screen inside a project uses this frame.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | SIDE PANEL               | EDITOR TABS                                                 |
| [E] |                          +-------------------------------------------------------------+
|  A  | Navigation inside the    | EDITOR                                                      |
|  W  | feature chosen on the    |                                                             |
|  T  | activity bar             | The console, an artifact, an item, the graph or a table,       |
|  S  |                          | opened from the side panel                                  |
|     |                          |                                                             |
|     |                          +-------------------------------------------------------------+
|     |                          | PANEL (optional)                                            |
|  *  |                          | Trace and timeline of an item, or the detail of a step      |
+-----+--------------------------+-------------------------------------------------------------+
| STATUS BAR   run state | stage | step | cost of the run | workflow version                   |
+----------------------------------------------------------------------------------------------+
```

| Region | Holds |
|---|---|
| Top bar | The logo, the project name with a menu to switch project or go back to the project list, a box to search items and run commands (`Ctrl+K`), the user menu |
| Activity bar | One icon per feature of the project: `E` Console, `A` Artifacts, `W` Workflow, `T` Traceability, `S` Sources (Later), and `*` Settings at the bottom. A badge shows a count, such as the reviews waiting on Console. An icon shows the side panel of its feature and nothing else: the editor and its tabs are not changed. The icon of the panel on screen hides the panel |
| Side panel | Navigation inside the chosen feature: the artifact tree, the runs and their steps, the coverage counts. The panel of any feature can hold several parts, each in a section: a section collapses to its title, may have actions at the right of its title, shown while the pointer is over the title and always on a touch screen, and a line divides it from the next one. Console has one section today, the outline of its event log. `Ctrl+B` hides and shows the panel, which keeps its state and its width while hidden |
| Editor | What was opened from the side panel, in tabs. The tabs belong to the project, not to a feature: choosing a feature on the activity bar does not close or change them, and a page opened from any side panel, such as a result of Search, is added to the same strip as a new tab. The console, a review, an artifact, an item, a run, a view of traceability and the settings each open as one tab. A review is one tab with the artifact and the console split inside it |
| Panel | An optional area under the editor, split into sections shown as tabs: the trace and the timeline of the open item, or the step and the state of the selected step. The actions of the section shown and the button that hides the panel sit at the end of the tabs. ``Ctrl+` `` hides and shows the panel |
| Status bar | The active run of the project: its state, stage, step, cost against `max_cost_usd`, and the workflow version. A click opens the run in Workflow |

Marks used in the skeletons:

| Mark | Meaning |
|---|---|
| `[C]` | The feature on the activity bar whose side panel is shown |
| `v` and `>` | An expanded and a collapsed node of a tree |
| `[REQ-001 ...]` | The selected row of a list or a tree |
| `x` after a tab name | The close button of the tab, shown on the active tab and on a tab under the pointer or with the focus, and on every tab on a touch screen |
| `!` | Needs review: the item was made from an older version of an item it links to |
| `*` | A step of a running workflow, printed as it starts |
| `-` | A detail under a step, printed while the step runs: text, a tool call, an item produced |
| `...` | More rows of the same kind |

Threads stay in the API: a thread maps one-to-one to a workflow session and holds at most one unfinished run. The web app never shows them: there is no sidebar of threads, and every project has a single console, shown as one event log with the one input box at the bottom. The thread of a project is created when its session is first opened.

## 2. Project list

A screen outside a project: its activity bar has no feature yet, only the account menu. A feature shown outside a project would be added to it. The prompt for a new idea comes first, and the projects of the user follow it.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Projects                     [ Search or run a command   Ctrl+K ]         (user) |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|                  What product do you want to write the requirements for?                     |
|                                                                                              |
|          +------------------------------------------------------------------------+          |
|          | > An online platform where university students find a mentor           |          |
|          |                                                                        |          |
|          | enter to create the project, shift+enter for a new line                |          |
|          |                                                                 [ ^ ]  |          |
|          +------------------------------------------------------------------------+          |
|                                                                                              |
|          Your projects                                     [ Filter ]  [ Archived ]          |
|                                                                                              |
|          Name                        Status                    Last activity                 |
|          --------------------------------------------------------------------------          |
|          [Mentor platform]           Waiting for you               2 min ago  [...]          |
|          Library booking             Working                      3 days ago  [...]          |
|          Campus food ordering        Done                          yesterday  [...]          |
|          ...                                                                                 |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

- The prompt keeps its place, about a fifth of the window under the top bar on a screen wider than a phone, whatever the length of the list. It starts a project from an idea; drawn here with an idea typed in it. Enter, or the arrow up at the bottom right of the box, opens the dialog that creates the project. The arrow is named Create project, in its tooltip and for assistive technology, and waits until the box has text. `Create project` in the command palette and in the menu of the project opens this screen with the focus in the prompt.
- The dialog, titled `Create project`, shows the name, which is optional because the agents name the project from the idea when it is left empty; the idea, which can still be edited; the language of the documents; and, folded under Agent settings, the settings that the agents start from (the number of personas and the reviews) with their defaults. Only the name has a hint, as its placeholder: it is named from the idea if left empty. Its `Create project` button creates the project, sends the idea as its first message, which starts the first run, and opens the project at Activity.
- A row opens the project at Activity; the name of the project is in the primary color. Status says, in the words of the user view, the status that the latest runs of the threads of the project roll up to, the one that needs the user most: Waiting for you, then Failed, Working, Starting, Stopped and Done; or Not started before the first run.
- `[...]` at the end of a row opens the menu of the project: Rename, Archive, or Restore in the list of archived projects, then Delete under a separator, in red. Rename opens a dialog with the name of the project selected, so that typing replaces it; it closes once the list shows the new name, with a success toast. `Rename project`, last in the menu of the open project on the top bar, and in the command palette opens the same dialog. Archive and Restore take effect at once, and a success toast names the project once it has left the list; the toast after Archive has Undo, a ghost button in the primary color, which restores it. Delete asks first, in a dialog that names the project and says that its documents and activity go with it and that this cannot be undone; the dialog waits until the project has left the list, and stays open with a toast when deleting fails. A project with a run that is not finished (about to start, running or waiting for review) is not deleted: Delete opens a dialog that says to stop the run in the project first, with Open project, which opens it at Activity. The button always shows, so that a screen without a pointer reaches it too. The menu has no other way in: a right click on a row opens the menu of the browser for a link, such as Open in new tab.
- `Filter`, left of `Archived`, opens the filters of the list as a small form: Status, any number of the statuses of the column and Not started, and Last activity, one of In the last day, In the last 2 days, In the last 7 days and In the last 30 days. Apply applies them, and the API filters the projects; closing the form without Apply drops what was chosen. The button shows how many filters are applied, and Clear filters empties the form. When no project matches, the empty state of the list says so, with Clear filters.
- An empty list shows the empty state under the prompt: no projects yet, and that a project starts from an idea in the prompt above. An empty list of archived projects is one sentence.
- The list has no counts of items: the short names of the item kinds (PER, AR, REQ) mean little to a user who is not an analyst.

## 3. Chat

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | THREADS          [+ New] | Main thread  x                                              |
| [C] |                          +-------------------------------------------------------------+
|  A  | [Main thread         (1)]| > I want to build an online platform for university         |
|  W  |  analysis_review         |   students to find mentors.                                 |
|  T  |                          |                                                             |
|  S  |  Booking rules           | * planner             Elicitation plan v1           0:21    |
|     |  done                    | * persona_generator   PER-001  PER-002  PER-003     0:35    |
|     |                          |   Personas approved by you                                  |
|     |                          | * interview           PER-001 Student, 12 turns     2:10    |
|     |                          | * interview           PER-002 Mentor, 9 turns       1:48    |
|     |                          | > Also ask about group sessions.                            |
|     |                          |   queued, read at the next step                             |
|     |                          | * interview           PER-003 Admin, 10 turns       1:55    |
|     |                          | * analyst             24 AR  3 AMB  1 CONF          0:52    |
|     |                          |   PER-001 and PER-003 disagree on who approves a booking,   |
|     |                          |   see CONF-001.                                             |
|     |                          |                                                             |
|     |                          | ? Review: Requirements analysis v4                          |
|     |                          |                                                             |
|     |                          | +---------------------------------------------------------+ |
|     |                          | | > Message, @ to mention an item, / for a command        | |
|     |                          | +---------------------------------------------------------+ |
|  *  |                          |   ctrl+o expand step    esc stop run                        |
+-----+--------------------------+-------------------------------------------------------------+
| Run 3: waiting for review | analysis_review | step 67 | $0.42 of $2.00 | workflow v1         |
+----------------------------------------------------------------------------------------------+
```

| Element | Content |
|---|---|
| Threads | The threads of the project, newest first, each with the stage of its latest run. A badge counts the reviews waiting in the thread |
| `>` line | A message of the user. A message sent while a run is busy shows its delivery until a step reads it |
| `*` line | One step, or a group of steps such as one interview, with the agent role, the keys of the items it produced, and its duration. Keys open the item; `ctrl+o` expands a group into its steps |
| Plain line | A message of an agent, in Markdown; item keys are links |
| `?` line | A review that waits for the user, see [section 4](#4-review) |
| Input box | The message; the first message of a thread starts a run. `@` mentions an item by key. `/` lists the commands `/stop`, `/retry`, `/export` and `/run-settings`, the last one for the run settings sent with the next message. `Esc` stops the run |

## 4. Review

When a run pauses at a checkpoint, the artifact under review opens on the left half of the editor and the chat on the right half. The side panel is hidden to make room.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------------------------+-------------------------------------------+
|     | Requirements analysis v4  x                | Main thread  x                            |
| [C] +--------------------------------------------+-------------------------------------------+
|  A  | Requirements analysis   v4   draft         | * analyst      24 AR  3 AMB  1 CONF  0:52 |
|  W  |                                            |                                           |
|  T  | Analyzed requirements                      | ? Review the requirements analysis.       |
|  S  |   Key      Title                Priority   |   Accept it, or reject it with feedback.  |
|     | M AR-007   Layered booking flow must       |   Under review: Requirements analysis v4  |
|     |   AR-008   Mentor availability  must       |   Edited by you: AR-007 v2                |
|     |   AR-009   Session reminders    should     |                                           |
|     |   ...                                      |     1. Accept                             |
|     | Conflicts                                  |     2. Reject and re-analyse              |
|     |   CONF-001  Who approves a booking         |   > 3. Reject and re-interview            |
|     | Ambiguity issues                           |                                           |
|     |   AMB-001  "Fast" search has no number     |   Feedback (required)                     |
|     |   AMB-002  Session length not given        |   +-------------------------------------+ |
|     |   ...                                      |   | Ask the student and the admin       | |
|     |                                            |   | whether a layered design works.     | |
|     |                                            |   +-------------------------------------+ |
|  *  |                                            |   enter send   up/down choose  esc later  |
+-----+--------------------------------------------+-------------------------------------------+
| Run 3: waiting for review | analysis_review | step 67 | $0.42 of $2.00 | workflow v1         |
+----------------------------------------------------------------------------------------------+
```

- The options of the checkpoint are a numbered list, chosen with the arrow keys or the number, as in Claude Code. The feedback box appears when the chosen option requires feedback.
- Items edited before answering are marked `M` in the artifact and listed in the review; they are sent as `modified_items`.
- Questions, when a definition version adds them, appear under the options: a numbered list for `single_select`, `[ ]` check boxes for `multi_select`, a text box for `free_text` and a number box for `number`, each filled with its default answer.
- `Esc` keeps the review in the thread, to answer later.

## 5. Artifacts

The side panel is a tree like the explorer of VS Code: artifacts, their sections, and their items. Clicking an item opens it in a tab; clicking an artifact opens it as a document, see [section 6](#6-artifact-as-a-document).

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | ARTIFACTS       [Export] | REQ-001 Search mentors  x | Requirement specification       |
|  C  |                          +-------------------------------------------------------------+
| [A] | > Elicitation plan       | Requirement specification > 3 Functional > 3.1 > REQ-001    |
|  W  | v Personas               |                                                             |
|  T  |     PER-001 Student      | REQ-001  Search mentors              v3  approved  [Edit]   |
|  S  |     PER-002 Mentor       |                                                             |
|     |     PER-003 Admin        | Statement     The system shall let a student search         |
|     | > Interviews             |               mentors by field and availability.            |
|     | v Requirements analysis  | Type          functional                                    |
|     |   > Raw requirements     | Priority      must                                          |
|     |   > Analyzed reqs        | Rationale     Students cannot find a free mentor today.     |
|     |   > Conflicts            | Acceptance    1. Results within 2 s for 1,000 mentors       |
|     |   > Ambiguity issues     | criteria      2. Filters for field and availability         |
|     | v Requirement spec       | Verification  test                                          |
|     |   v 3 Functional         +-------------------------------------------------------------+
|     |     v 3.1 Mentor disc.   | TRACE    TIMELINE                                           |
|     |        [REQ-001 Search]  | Outgoing   derived_from   AR-003                            |
|     |         REQ-002 Filter   |            depends_on     REQ-002                           |
|     |     > 3.2 Booking        | Incoming   US-004         derived_from    ! made from v2    |
|     | > Product backlog      ! |            AMB-002        concerns                          |
|  *  | > Validation reports     |                                                             |
+-----+--------------------------+-------------------------------------------------------------+
| Run 3: waiting for review | analysis_review | step 67 | $0.42 of $2.00 | workflow v1         |
+----------------------------------------------------------------------------------------------+
```

The TIMELINE tab of the same panel lists the versions of the item:

```text
TRACE    TIMELINE
v3   edited by you                          2 hours ago     [Compare with v2]
v2   approved at specification_review       yesterday       [Compare with v1]
v1   created by requirement_engineer        yesterday       run 1, step 70
```

- The editor shows the fields of the item in `x-ui-field-order`, with breadcrumbs from the artifact down to the item. `Edit` turns the fields into inputs; saving sends `PATCH` with `If-Match`.
- TRACE lists the links of the item by link type, outgoing and incoming. `!` marks a link made from an older version of this item.
- TIMELINE lists the item revisions. An item that supersedes others lists them at the end, so the history continues across keys.
- The tree follows the sections that the agents create. An artifact without sections is grouped by item kind, as the requirements analysis is here. Superseded and deleted items are hidden unless a filter shows them.
- `Export` asks for an export template and a format.

## 6. Artifact as a document

Clicking an artifact in the tree opens it as one document, drawn by the `x-ui-display` of its kinds. The requirement specification uses `heading` for sections and `table` for requirements:

```text
Requirement specification   v2   approved                               [Export]
--------------------------------------------------------------------------------
3      Functional requirements
3.1    Mentor discovery
       How a student finds a mentor.
       Key       Title             Type         Priority   Verification
       REQ-001   Search mentors    functional   must       test
       REQ-002   Filter by field   functional   should     test
3.2    Booking
       Key       Title                       Type         Priority   Verification
       REQ-005   Book a 30-minute session    functional   must       test
```

An interview transcript uses `transcript`. A quote that an item cites is highlighted, with the citing items in the margin:

```text
Interview: PER-001 Student   iteration 0   12 turns
--------------------------------------------------------------------------------
#3   interviewer   How do you look for a mentor today?
#4   PER-001       I ask seniors in my club, but [[I never   <- RAW-002 evidenced_by
                   know who is free this week]], so I give up.
#5   interviewer   What would make you book a session?
```

## 7. Workflow

The side panel lists the runs of a thread and their steps; the editor shows the graph of the workflow version of the selected run, with the state of each node; the panel shows the selected step.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | RUNS      Main thread v  | Run 3  x                                                    |
|  C  |                          +-------------------------------------------------------------+
|  A  | v Run 3   waiting review |              [start]                                        |
| [W] |     1  planner      done |                 |                                           |
|  T  |     2  persona_gen  done |             [planner] done                                  |
|  S  |     3  checkpt_pers done |                 |                                           |
|     |   > 4-27  PER-001        |        [persona_generator] done                             |
|     |   > 28-45 PER-002        |                 |                                           |
|     |   > 46-65 PER-003        |       <checkpoint_personas> done                            |
|     |     66 analyst      done |                 |                                           |
|     |    [67 checkpt_anal wait]|  [interviewer] done x31 <--> [persona_agent] done x31       |
|     | > Run 2   failed         |                 |                                           |
|     | > Run 1   done           |            [analyst] done      not OK: (rework_elicitation) |
|     |                          |                 | OK                                        |
|     |                          |       <checkpoint_analysis> waiting                         |
|     |                          |                 | accept       reject: analyst, rework      |
|     |                          |      [requirement_engineer]                                 |
|     |                          |                ...                                          |
|     |                          +-------------------------------------------------------------+
|     |                          | STEP 67   checkpoint_analysis   analysis_review   iter 0    |
|     |                          | Waiting for review since 10:42               [Open review]  |
|  *  |                          | [Retry from this step]             [Open trace in Langfuse] |
+-----+--------------------------+-------------------------------------------------------------+
| Run 3: waiting for review | analysis_review | step 67 | $0.42 of $2.00 | workflow v1         |
+----------------------------------------------------------------------------------------------+
```

- The graph is laid out by elkjs from the workflow definition, see [Web App: workflow graph](../architecture/web-app.md#3-workflow-graph). `[ ]` is an agent node, `< >` a checkpoint, `( )` a control node. The sketch leaves out `intent_router` and most backward edges.
- Each node shows its state (`idle`, `running`, `waiting`, `done`, `failed`) and, when visited more than once, its visit count, so rework loops are visible.
- Every turn of an interview is a step, so the steps of one interview are grouped under the persona and expand on click.
- The panel shows the selected step: its node, stage, iteration, model, usage, the items it produced, and the actions to retry from it and to open its trace.

## 8. Trace

As built in the user view: the feature "Trace" on the activity bar, its side panel with an overview of what needs attention and the tree of the documents, and the chain of a chosen item as a graph. See [Usability 7.8](usability.md#78-trace) for the words and the behavior.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | Overview                 | [Trace of Layered booking flow] x                         |
|  A  |   Requirements with-      +-------------------------------------------------------------+
|  D  |   out a user story   3   |                                                             |
|  T  |   Requirements with-      |  Interview, student                                         |
|  R  |   out a source       2   |     ^                                                       |
|  A  |   Links to check     2   |     |  Based on                                           |
|  C  |   Open issues        3   |     v                                                      |
|  E  |                          |  Stated need, Students book a session at once               |
|     | Documents                |     ^  Based on  (!) made from version 3                   |
|     | v Interview transcripts  |     v                                                      |
|     | v Requirements analysis  |  Analysed requirement, Layered booking flow                |
|     |     (!) Layered booki... |     ^  Concerns                                            |
|     | v Requirement specifi... |     v                                                      |
|     |                          |  Point to clarify, Fast has no number                      |
|     |                          |                                                             |
|     |                          |  (?) How to read the lines     v Read the links as a list  |
+-----+--------------------------+-------------------------------------------------------------+
|   (>) Working: Interviewing  [ Stop ]                                                        |
+----------------------------------------------------------------------------------------------+
```

The traceability matrix, a table of every chain of the project, moves to the developer view in a later build; the user view follows one item at a time through its chain.

## 9. Project settings

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | PROJECT SETTINGS         | Settings  x                                                 |
|  C  |                          +-------------------------------------------------------------+
|  A  | [General]                | General                                                     |
|  W  |  Runs                    |   Name              [ Mentor platform                  ]    |
|  T  |  Models                  |   Description       [ Online platform where students ]      |
|  S  |                          |   Output language   [ English v ]                           |
|     |                          |                                                             |
|     |                          | Runs                     empty: your default is used        |
|     |                          |   Review at         [x] checkpoint_personas                 |
|     |                          |                     [x] checkpoint_analysis                 |
|     |                          |                     [x] checkpoint_spec                     |
|     |                          |   Max steps         [ 200 ]                                 |
|     |                          |   Max cost (USD)    [ 2.00 ]                                |
|     |                          |   Max iterations    [ 2 ]                                   |
| [*] |                          |   ...                                                       |
+-----+--------------------------+-------------------------------------------------------------+
| Run 3: waiting for review | analysis_review | step 67 | $0.42 of $2.00 | workflow v1         |
+----------------------------------------------------------------------------------------------+
```

- General holds the fields of the project. Runs holds `run_config` of the project; the fields under `parameters` come from `run_parameters_schema`, so a new parameter appears without a client change. A field left empty takes the value of the user.
- Models holds `model_overrides`: one model per agent role, empty for the default of the user.

## 10. Open points

1. **Several runs in one project.** Each thread has at most one active run, so a project can have several. Open: what the status bar shows then, or whether a project allows only one.
2. **Grouping in the explorer.** Grouping an artifact without sections by item kind is a choice of the web app, not data. Open: whether it fits every artifact kind.
3. **Narrow screens.** The frame targets a desktop browser. On a narrow screen the activity bar could become a bottom tab bar and the side panel a drawer.
4. **Font of the chat.** A monospace font for the whole chat, like a terminal, or only for the step lines.
5. **Sources (Later).** Uploaded documents become a feature on the activity bar once SourceDocument is in scope.
