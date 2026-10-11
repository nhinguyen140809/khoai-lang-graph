# Screen Skeletons

ASCII skeletons of the main screens of the web app. The layout follows VS Code: a top bar with the app and the project, an activity bar with the features of the project on the left, a side panel to navigate inside the chosen feature, an editor with tabs, and a status bar. The session shows the event log of the runs of the project, with an input box at the bottom.

The skeletons fix the regions and what each one holds; sizes, colors and components come later. The apps behind this layout are in [UI Reference Apps](reference-apps.md), and the data each region draws is in [Web App](../architecture/web-app.md) and [API design](../API.md). The examples use the project of the API examples: an online platform where university students find mentors.

## Contents

- [Screen Skeletons](#screen-skeletons)
  - [Contents](#contents)
  - [1. Frame](#1-frame)
  - [2. Project list](#2-project-list)
  - [3. Session](#3-session)
  - [4. Review](#4-review)
  - [5. Artifacts](#5-artifacts)
  - [6. Artifact as a document](#6-artifact-as-a-document)
  - [7. Workflow](#7-workflow)
  - [8. Traceability](#8-traceability)
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
|  T  | activity bar             | The session, an artifact, an item, the graph or a table,       |
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
| Activity bar | One icon per feature of the project: `E` Session, `A` Artifacts, `W` Workflow, `T` Traceability, `S` Sources (Later), and `*` Settings at the bottom. A badge shows a count, such as the reviews waiting on Session |
| Side panel | Navigation inside the chosen feature: the artifact tree, the runs and their steps, the coverage counts. Session has an outline of its event log and the list of sessions. `Ctrl+B` hides and shows the panel |
| Editor | What was opened from the side panel, in tabs. Two tabs can be shown side by side, for example an artifact and the session during a review |
| Panel | An optional area under the editor: the trace and the timeline of the open item, or the detail of the selected step |
| Status bar | The active run of the project: its state, stage, step, cost against `max_cost_usd`, and the workflow version. A click opens the run in Workflow |

Marks used in the skeletons:

| Mark | Meaning |
|---|---|
| `[C]` | The active feature on the activity bar |
| `v` and `>` | An expanded and a collapsed node of a tree |
| `[REQ-001 ...]` | The selected row of a list or a tree |
| `x` after a tab name | The tab can be closed |
| `!` | Needs review: the item was made from an older version of an item it links to |
| `*` | A step of a running workflow, printed as it starts |
| `-` | A detail under a step, printed while the step runs: text, a tool call, an item produced |
| `...` | More rows of the same kind |

Threads stay in the API: a thread maps one-to-one to a workflow session and holds at most one unfinished run. The web app never shows them: there is no sidebar of threads, and every project has a single session, shown as one event log with the one input box at the bottom. The thread of a project is created when its session is first opened.

## 2. Project list

The only screen outside a project, so it has no activity bar.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Projects                     [ Search or run a command   Ctrl+K ]         (user) |
+----------------------------------------------------------------------------------------------+
|                                                                                              |
|  Projects                                                   [ Archived ]  [ + New project ]  |
|                                                                                              |
|  Name                    Last activity    Items                               Run            |
|  ------------------------------------------------------------------------------------------  |
|  [Mentor platform]       2 min ago        3 PER   24 AR   18 REQ   12 US      Waiting review |
|  Campus food ordering    yesterday        4 PER   31 AR   22 REQ   15 US      -              |
|  Library booking         3 days ago       2 PER    0 AR    0 REQ    0 US      Running        |
|  ...                                                                                         |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

- A row opens the project at Session. Items are the `item_counts` of the project.
- `New project` asks for a name, a description and the output language, then opens Session on an empty event log; the first message starts the first run.

## 3. Session

The session is the working view of the project: the event log of its runs, with an input at the bottom. The side panel has two views: the outline of the session on screen, which goes to each message or command that the user typed, and the list of the sessions of the project. The editor is the log, without tabs.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | SESSION                  | 2026-10-06                                                  |
| [E] | [Outline] Sessions       | 08:30:01  run     Run 3 started, retrying run 2             |
|  A  |                          | 08:30:01  step    planner                            0:09   |
|  W  | 08:10:00  I want to      | 08:30:10  step    persona_generator  PER-001  PER-002 0:18  |
|  T  |           build an on... | 08:30:28  step    checkpoint_personas                1:35   |
|  S  | 10:00:00  Group sessi... | 08:32:03  steps   interviewing  24 steps             3:12   |
|     | 08:30:40  Also ask th... |                   PER-001#1  PER-001#2  PER-001#3  +21      |
|     | 08:44:02  /expand        | 08:35:15  steps   interviewing  18 steps             2:24   |
|     |                          | 08:40:19  step    analyst                            0:53   |
|     |                          | 08:41:12  step    checkpoint_analysis             waiting   |
|     |                          |           review  Requirements analysis v4 waits for review |
|     |                          |                                                             |
|     |                          | +---------------------------------------------------------+ |
|     |                          | | > / for a command                                       | |
|     |                          | +---------------------------------------------------------+ |
|  *  |                          |   ctrl+o expand steps    esc stop run                       |
+-----+--------------------------+-------------------------------------------------------------+
| Run 3: waiting for review | analysis_review | step 67 | $0.42 of $2.00 | workflow v1         |
+----------------------------------------------------------------------------------------------+
```

| Part | Content |
|---|---|
| Outline | Each time the user typed a message or ran a command in the session, oldest first, with its time. Choosing one scrolls the event log to it |
| Sessions | The sessions of the project, each with the stage of its latest run and a badge for the reviews waiting. A project has one session today, so the list has one entry |

Every row of the log has the same columns: the time, the kind of event, what happened, and how long it took. The log shows only events: what the user typed, and what the runs do.

| Row | Content |
|---|---|
| Date | The date, printed before the first event of each day |
| `input` | What the user typed to start a run |
| `command` | A command that the user ran |
| `run` | A run started (naming the run it retries), or ended: done, failed with its error, or stopped |
| `step` | A step of the workflow with its node, the keys of the items it produced, and its duration. A step in progress shows `running` and its time; a review checkpoint shows `waiting`. Keys open the item |
| `steps` | Consecutive steps on one subject, such as the turns of one interview, as one row with the keys they produced. `ctrl+o` or `/expand` opens every group into its steps |
| `review` | A review that waits for the user, see [section 4](#4-review) |
| Input box | A message starts a run when no run is unfinished; while a run is unfinished the box takes commands only. `@` mentions an item by key. `/` lists the commands `/stop`, `/retry`, `/expand` and `/collapse`. `Esc` pressed twice stops the run |

## 4. Review

When a run pauses at a checkpoint, the artifact under review opens on the left half of the editor and the session on the right half. The side panel is hidden to make room.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------------------------+-------------------------------------------+
|     | Requirements analysis v4  x                |                                            |
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

- The options of the checkpoint are a numbered list, chosen with the arrow keys or the number. The feedback box appears when the chosen option requires feedback.
- Items edited before answering are marked `M` in the artifact and listed in the review; they are sent as `modified_items`.
- Questions, when a definition version adds them, appear under the options: a numbered list for `single_select`, `[ ]` check boxes for `multi_select`, a text box for `free_text` and a number box for `number`, each filled with its default answer.
- `Esc` leaves the review waiting in the event log, to answer later.

## 5. Artifacts

The side panel is a tree like the explorer of VS Code: artifacts, their sections, and their items. Clicking an item opens it in a tab; clicking an artifact opens it as a document, see [section 6](#6-artifact-as-a-document).

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | ARTIFACTS       [Export] | REQ-001 Search mentors  x | Requirement specification  x    |
|  E  |                          +-------------------------------------------------------------+
| [A] | > Elicitation plan       | Requirement specification > 3 Functional > 3.1 > REQ-001    |
|  W  | v Personas               |                                                             |
|  T  |     PER-001 Student      | REQ-001  Search mentors              v3  approved           |
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

The side panel lists the runs of the project and their steps (they live in the thread of the session of the project, which is never shown, as in [Session](#3-session)); the editor shows the graph of the workflow version of the selected run, with the state of each node; the panel shows the selected step.

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | RUNS                     | Run 3  x                                                    |
|  E  |                          +-------------------------------------------------------------+
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

## 8. Traceability

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | TRACEABILITY             | Matrix  x                                                   |
|  E  |                          +-------------------------------------------------------------+
|  A  | COVERAGE                 | Backlog   Spec      Analyzed   Source           Evidence    |
|  W  |   No backlog item      2 | US-004    REQ-001   AR-003     RAW-002          PER-001#4   |
| [T] |   No source            1 | US-005    REQ-001   AR-003     RAW-002, LN-001  PER-001#4   |
|  S  |   Needs review         3 | US-006    REQ-002   AR-005     RAW-004          PER-002#7   |
|     |                          | -         REQ-007   AR-011     RAW-015          PER-003#2   |
|     | VIEWS                    | -         REQ-009   AR-014     -                -           |
|     |  [Matrix]                | ...                                                         |
|     |   Issues                 |                                                             |
|     |                          | [ Only gaps ]                                               |
|  *  |                          |                                                             |
+-----+--------------------------+-------------------------------------------------------------+
| Run 3: waiting for review | analysis_review | step 67 | $0.42 of $2.00 | workflow v1         |
+----------------------------------------------------------------------------------------------+
```

- The matrix has one row per `derived_from` chain, from backlog item down to raw requirement or latent need, with the interview messages that `evidenced_by` points to. Every key opens the item.
- The coverage counts come from the coverage endpoint; a click filters the matrix to those rows.
- Issues lists the open ambiguity issues, conflicts and validation issues with the items they concern or flag.

## 9. Project settings

```text
+----------------------------------------------------------------------------------------------+
| (K) khoai / Mentor platform v            [ Search or run a command   Ctrl+K ]         (user) |
+-----+--------------------------+-------------------------------------------------------------+
|     | PROJECT SETTINGS         | Settings  x                                                 |
|  E  |                          +-------------------------------------------------------------+
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

1. **Several runs or sessions in one project.** The API keeps threads, and each can hold at most one unfinished run, so a project could have several. The first version shows one session per project. Open: when to open a second session, and what the status bar shows when more than one run is unfinished.
2. **Grouping in the explorer.** Grouping an artifact without sections by item kind is a choice of the web app, not data. Open: whether it fits every artifact kind.
3. **Narrow screens.** The frame targets a desktop browser. On a narrow screen the activity bar could become a bottom tab bar and the side panel a drawer.
4. **Sources (Later).** Uploaded documents become a feature on the activity bar once SourceDocument is in scope.
