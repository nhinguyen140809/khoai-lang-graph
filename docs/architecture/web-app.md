# Web App

How the web app draws the workflow, the progress of a run, the reviews and the artifacts from data the backend provides, so that an experiment that changes the workflow or the content schemas needs no change in the web app.

The endpoints named here are defined in [API design](../API.md), the content schemas and their display keywords in [Content schemas](../schemas/README.md), and the run behavior in [Runtime](runtime.md).

## Contents

- [Web App](#web-app)
  - [Contents](#contents)
  - [1. Principle](#1-principle)
  - [2. What the web app reads](#2-what-the-web-app-reads)
  - [3. Workflow graph](#3-workflow-graph)
  - [4. Progress of a run on the graph](#4-progress-of-a-run-on-the-graph)
  - [5. Reviews](#5-reviews)
  - [6. Artifacts and items](#6-artifacts-and-items)
  - [7. Run settings and workflow state](#7-run-settings-and-workflow-state)
  - [8. What still needs a change in the web app](#8-what-still-needs-a-change-in-the-web-app)
  - [9. Files](#9-files)
  - [10. Open points](#10-open-points)
  - [11. Review checklist](#11-review-checklist)

---

## 1. Principle

The web app knows how to draw each **kind** of thing: a node of each node kind, a field of each widget, an interrupt with options, an item list of each display. It does not know **which** nodes, options, item kinds or fields the current workflow has; it reads them from the backend when it needs them.

An experiment changes the backend only: a new workflow definition version, or a new content schema version. The web app reads the new data and draws it.

## 2. What the web app reads

| What the web app shows | Read from | Changes when |
|---|---|---|
| Workflow graph and stages | `GET /workflow/definition?version=` | A new workflow definition version |
| Where a run is and where it has been | `GET /runs/{run_id}/steps`, then the event stream of the run | Every step |
| The activity of a project: its progress, its outline and its chat | The threads of the project, the runs, steps, interrupts and messages of the thread it shows, then the event stream of its latest run | Every step, review and message |
| The review the user must answer | `GET /runs/{run_id}/interrupts?status=pending`, then the `interrupt` event | Every checkpoint |
| Artifacts and items | `GET /artifact-kinds` for the schemas, `GET /content-schemas/{kind}/{schema_version}` for content stored with an older version, the artifact and item endpoints for the content | A new content schema version |
| Run settings form | `run_parameters_schema` and the `checkpoint` nodes of the workflow definition | A new workflow definition version |
| Workflow state, for experiments | The state endpoints and `state_schema` of the workflow definition | Every step |

A workflow definition version and a content schema version never change once used, so the web app caches them without expiry, keyed by their version.

Every endpoint above has a request and response example in [API design](../API.md); the examples on this page use the same run. The types of the responses are generated from the OpenAPI schema into `src/shared/api/generated/` and are not repeated here. This page shows only what the web app builds from the responses: the types it owns and an example of each.

## 3. Workflow graph

1. Read the definition with TanStack Query, under the key `['workflow-definition', version]`, where `version` is `workflow_version` of the run on screen.
2. Turn every node into a React Flow node. The component is chosen by `kind`: `start` and `end`, `agent`, `checkpoint`, `control`. The label is `label`.
3. Turn every edge into a React Flow edge with its `label`.
4. Lay the graph out with elkjs (layered algorithm). The definition has no positions, so a node added in the backend gets a place without a client change. The layout is computed once per definition version.

The data of a node and of an edge, in `modules/run/widgets/graph/run-graph.types.ts`. `InterruptOption` is the option type of the generated API client:

```ts
export interface WorkflowNodeData {
  label: string
  title: string | null // set for a checkpoint only
  stage: string | null
  agentRole: string | null
  allowEdits: boolean
  options: InterruptOption[] // empty for every kind except checkpoint
}

export interface WorkflowEdgeData {
  conditional: boolean
  option: string | null // the checkpoint option that leads along the edge
}
```

Example. The `checkpoint_analysis` node and its `reject_reinterview` edge of [definition version 1](../workflow/requirements_engineering.v1.json) become:

```ts
const nodes: Node<WorkflowNodeData>[] = [
  {
    id: 'checkpoint_analysis',
    type: 'checkpoint', // selects CheckpointNode
    position: { x: 0, y: 0 }, // replaced by the layout
    data: {
      label: 'checkpoint_analysis',
      title: 'Review the analysis',
      stage: 'analysis_review',
      agentRole: null,
      allowEdits: true,
      options: [/* accept, reject_reanalyse, reject_reinterview, as in the definition */],
    },
  },
]

const edges: Edge<WorkflowEdgeData>[] = [
  {
    id: 'checkpoint_analysis:rework_elicitation:reject_reinterview',
    source: 'checkpoint_analysis',
    target: 'rework_elicitation',
    label: 'reject + re-interview',
    data: { conditional: true, option: 'reject_reinterview' },
  },
]
```

The edge id joins the source, the target and the option, because a checkpoint can have two edges to the same node for two options.

### Visible stages

The graph serves the developer view. The pages for the user show the stages instead, as a tree built from `stages` of the same definition:

1. Group the stages by `parent`; a stage with a null `parent` is a root. The list is in workflow order, so the children of a stage keep that order.
2. Drop the stages with `internal` set, with their children. The text of a stage is its `title`, never its `key`.
3. Mark the stage of `current_stage` of the run. When it is internal, the status bar keeps the title of the previous stage that is not.
4. A stage with children renders as a group that can be collapsed, and it opens when it holds the current stage.

The review stages (`persona_review`, `analysis_review`, `specification_review`) are stages like the others, so the checkpoints appear in the tree at the place of their stage and need no separate entry. The depth of the tree is not limited by the web app; the definition decides it.

Progress, in the side panel of Activity (planned in S2a), draws this tree as steps and sub-steps: a step is a stage at the top level, and its sub-steps are the stages nested under it. The definition says one more thing that makes sub-steps: a stage that an artifact kind with `per_project: one_per_subject` names runs once for each subject of that kind, one after another (in version 1, `interviewing` for each persona, through `interview_transcript`). Its subjects are its sub-steps, in the order the run takes them, each done, in progress or not started. How many agents or steps a stage has makes no sub-step: that work shows in the chat. Each step and sub-step shows the status of its stage or subject: the current stage takes the status of the run, a stage with steps is done, a stage without steps has not started, and a stage with children takes the status of the child that needs the user most.

## 4. Progress of a run on the graph

The web app keeps a status for every node, computed by one pure function from the steps and the events of the run:

| Input | Effect on the graph |
|---|---|
| A step starts (`node_start`) | The node becomes `running`; its visit count increases by one; the edge from the previous node is marked as the last edge taken |
| A step ends (`node_end`) | The node becomes `done`, or `failed` when the step failed |
| `interrupt` | The checkpoint node becomes `waiting` |
| `message_delivered` | The message is shown as delivered at the node that took it in |
| `error`, `done` | No node stays `running` |

- The same function first replays the steps returned by `GET /runs/{run_id}/steps` and the pending interrupt, if any, then applies the live events, so a reload or a reconnect draws the same picture. The pending interrupt is needed because the stream continues after `last_event_id` of the run, so an `interrupt` event sent before a reload is not sent again.
- A node visited more than once shows its visit count, which makes rework loops visible.
- Clicking a node opens a panel with its steps (model, tokens, cost, items created or changed), the workflow state after each step, and the action to retry from that step.
- The existing reducer of run events, which keeps only the active node today, grows into this function.

The result of the function, in `modules/run/entities/steps/run-steps.types.ts`:

```ts
export type NodeStatus = 'idle' | 'running' | 'waiting' | 'done' | 'failed'

export interface NodeProgress {
  status: NodeStatus
  visits: number // steps of this node in the run
  lastStepId: string | null
}

export interface RunProgress {
  nodes: Record<string, NodeProgress> // a node that is not in the map is idle
  lastEdge: { source: string; target: string } | null
  lastEventId: string | null
}
```

Example. The web app loads the four steps of the [steps example](../API.md#runs): `planner`, `persona_generator`, `checkpoint_personas` and `interviewer`, all succeeded. Then three live events arrive:

```text
id: 20  event: node_start  data: {"node":"persona_agent","step_id":"e1a4...", ...}
id: 21  event: node_end    data: {"node":"persona_agent","step_id":"e1a4...","status":"succeeded", ...}
id: 22  event: node_start  data: {"node":"interviewer","step_id":"e1a5...", ...}
```

The function returns:

```ts
const progress: RunProgress = {
  nodes: {
    planner: { status: 'done', visits: 1, lastStepId: 'e1a0...' },
    persona_generator: { status: 'done', visits: 1, lastStepId: 'e1a1...' },
    checkpoint_personas: { status: 'done', visits: 1, lastStepId: 'e1a2...' },
    interviewer: { status: 'running', visits: 2, lastStepId: 'e1a5...' },
    persona_agent: { status: 'done', visits: 1, lastStepId: 'e1a4...' },
  },
  lastEdge: { source: 'persona_agent', target: 'interviewer' },
  lastEventId: '22',
}
```

The graph draws `interviewer` as running with the count 2, and highlights the edge from `persona_agent`. A reload at this point loads six steps, the last one running, and returns the same result: the last edge is the one between the last two steps, and `lastEventId` is `last_event_id` of the run.

## 5. Reviews

One review panel serves every checkpoint, built from the pending interrupt:

- The `prompt`, and links to the artifacts under review at the version shown.
- One button per option, with its `label`. A text box for feedback appears when the chosen option requires it.
- One input per question, chosen by `type`: radio buttons for `single_select`, check boxes for `multi_select` (within `min_selected` and `max_selected`), a text area for `free_text`, a number input for `number`. The `default_answer` of each question is filled in, so the user changes only what differs. A choice that requires text shows a text box when it is chosen, and a required question must be answered before the panel can be sent.
- When `allow_edits` is true, the items of the artifacts under review can be edited before answering; the edited items are sent as `modified_items`.
- Answering sends `option`, `feedback`, `answers` and `modified_items` to the resume endpoint.
- Interrupts resolved at once with the defaults are listed in the history of the run, with the answers taken, but open no panel.
- An answered interrupt gives its `decision`, so the history says which option was taken, by the user or by default.

The answer form is `review/features/answer` (planned in S2a): the chat of Activity shows it in the card of a pending review, and the review bar of a document (S2b) shows it under the document under review.

Adding, removing or renaming an option or a question, adding a checkpoint, or an agent adding questions at run time, needs no client change.

Example. The [pending interrupt example](../API.md#runs) is drawn as:

```text
Review the requirements analysis. Accept it, or reject it with feedback.
Under review: Requirements analysis, version 4          (link to the artifact)
Items can be edited before answering.

[ Accept ]   [ Reject and re-analyse ]   [ Reject and re-interview ]
Feedback  ______________________________________   (after a reject option; required)
```

The user corrects `AR-007` with `PATCH /items/d3f9...` and `If-Match: 1`, which stores version 2, then chooses "Reject and re-interview" and writes feedback. The panel sends:

```json
{
  "interrupt_id": "7b0c...",
  "option": "reject_reinterview",
  "feedback": "Ask the student and the admin whether a layered design works for both.",
  "modified_items": [{ "item_id": "d3f9...", "version": 2 }]
}
```

The run continues; the stream sends `node_start` of the next node, and the checkpoint node becomes `done`.

## 6. Artifacts and items

The artifact panel draws every kind from its content schema and the display keywords:

| `x-ui-display` | Drawn as |
|---|---|
| `document` | The fields of the artifact, above its items |
| `heading` | A section heading with its number and the items it contains |
| `table` | A table with the columns of `x-ui-list-fields`; the `x-ui-title-field` is the link to the item |
| `cards` | One card per item with the fields of `x-ui-list-fields` |
| `transcript` | The messages in order, as a conversation |

The side panel lists a document as a tree: its sections and, under them, the items of the kinds whose `x-ui-navigable` is `true`, each named by its `x-ui-title-field`. A kind whose `x-ui-navigable` is `false`, such as `interview_message`, has no row and no page of its own: its items are short enough to read in place on the page of the document, so there is no need to reach them one by one.

- The detail view and the edit form show the fields in `x-ui-field-order`, each labelled with the `title` of its property (a property without a title reads its name with underscores as spaces and a capital) and with the input of its `x-ui-widget`. A `readOnly` field is shown but not editable. A field marked `x-value-from` offers the values of the named field of the artifact of the project, for example the topics of the elicitation plan.
- The form checks the content against the schema in the browser for immediate feedback; the backend stays the authority and answers `422` with the field paths.
- An item keeps the `schema_version` it was written with, and the web app reads the schema of that version from `GET /content-schemas/{kind}/{schema_version}` when it differs from the current one, so older items are still drawn correctly.
- A kind can have its own component where the generic drawing is not good enough, for example a persona card. A registry maps the kind to the component; a kind without an entry uses the generic drawing.

A field as the detail view and the edit form see it, built from one property of a schema by `contentFields(schema)`, in `modules/workflow/entities/content/fields/content-fields.types.ts`:

```ts
export type FieldWidget = 'text' | 'textarea' | 'select' | 'number' | 'list' | 'tags' | 'object-list'

export interface ContentField {
  name: string
  title: string // the title of the property, else derived from the name
  widget: FieldWidget // x-ui-widget, or derived from the type when absent
  nullable: boolean // the type list contains null
  required: boolean
  readOnly: boolean
  options: string[] // enum values without null for a select; empty otherwise
  description: string | null
  allowedValuesFrom: string | null // x-value-from
  minItems: number | null
  minimum: number | null
  maximum: number | null
  entryFields: ContentField[] // the fields of one entry of an object-list
}
```

Example. With the [items example](../API.md#artifacts-and-items) and the `spec_requirement` schema, the requirement specification is drawn as:

```text
3      Functional requirements                                    (section: heading)
3.1    Mentor discovery                                           (section: heading)
       How a student finds a mentor.
       Title            Type         Priority   Verification method    (spec_requirement: table)
       Search mentors   functional   must       test
```

The columns are `x-ui-list-fields` and "Search mentors", the `x-ui-title-field`, links to `REQ-001`. Opening `REQ-001` shows its fields in `x-ui-field-order`:

| `name` | `label` | `widget` | `nullable` | `options` |
|---|---|---|---|---|
| `title` | Title | `text` | false | - |
| `statement` | Statement | `textarea` | false | - |
| `type` | Type | `select` | false | `functional`, `non_functional`, `constraint` |
| `quality_category` | Quality category | `select` | true | `performance`, `security`, `usability`, `reliability`, `maintainability`, `compatibility`, `portability` |
| `priority` | Priority | `select` | false | `must`, `should`, `could`, `wont` |
| `rationale` | Rationale | `textarea` | false | - |
| `acceptance_criteria` | Acceptance criteria | `list` | false | - |
| `fit_criterion` | Fit criterion | `textarea` | true | - |
| `verification_method` | Verification method | `select` | false | `test`, `inspection`, `demonstration`, `analysis` |

A nullable select offers an empty choice that stores `null`. Saving the form sends `PATCH /items/c41e...` with the changed `content` fields and `If-Match` set to the version shown.

The inputs of the content fields live in `modules/workflow/entities/components/content-input/`, one row per widget in `ContentValueControl`; `ContentFieldInput` places each with its label and error inside the `FormProvider` of a form of `ContentFormValues` (the values sit under `content`, where the API names the problems of a field). A `readOnly` field shows its value without an input. The tags that take their values from another artifact (`x-value-from`) draw one checkbox per value; every other list of entries has Add and Remove, and an entry left empty is dropped on save.

The history of a record (an artifact or an item) sits in a floating surface at the bottom left corner of its page, in three levels: the History button; the selected version with Newer and Older, who made it and why, and Show changes; and the list of every version above the stepper. While the surface is open, the page draws the selected version in place of the fields, with the words that changed struck through and filled in when Show changes is on; the links and the origin of the item do not show, since they belong to the current version.

The words that a link quotes are marked where they sit: in the fields of an item (the marks of `useItemLinks`, by field), and in the messages of a transcript (the marks of `useLinkQuotesOf`, by message). A mark or a chip opens the card of the items at the other end of its link (`LinkedItemsPopover`), and the end of the item page gathers the chain the item is based on, down to the words of the interview it cites (`ItemOrigin`).

The status `outOfDate` marks an item that a link made from an older version of an item it links to: the letter `!` in its row of the tree. An item of a kind with `x-ui-navigable: false` opens the page of its document scrolled to its block, marked, since it has no page of its own.

## 7. Run settings and workflow state

- **Run settings.** The form for `parameters` of the run configuration is built from `run_parameters_schema`, one `RunParameterField` for each property, so a new run parameter appears without a client change. The widget comes from the type of the property: an integer or a number is a number input, a property with `enum` is a select, a boolean is a group of three choices (default, on, off), and any other type of a single value is a text input. A property that holds a list or an object has no widget and is left out. A parameter that is not set is not sent, so the next level supplies it, and the form shows the `default` of the property for it ("Default (On)" for a boolean, a placeholder for any other); a boolean set to on or off sends `true` or `false`. The form checks `minimum`, `maximum` and the type against the schema before sending.
- **Reviews to turn on.** The form also holds a list of checkboxes for `review_checkpoints` of the run configuration, one per node of kind `checkpoint` in the definition, in the order of the nodes. Each checkbox is named by the `title` of the checkpoint, never by its id, and its description is the `prompt`. A checked checkpoint pauses the run for the user; an unchecked one continues at once with its default option and default answers, so a new checkpoint in a definition version appears in the list without a client change. The value saved is the list of ids of the checked checkpoints. The same `title` names the review in the status bar.
- **Workflow state.** A panel for experiments shows the state of the run, or the state after a chosen step, as a tree, following `state_schema`. Artifacts and items appear as references and link to the version that the step used, so the state of an old step shows the content as it was then, also for items deleted since.

Example of run settings. The property `"max_turns": { "type": "integer", "minimum": 1, "default": 6 }` of `run_parameters_schema` becomes the `RunParameterField` below, in `modules/workflow/entities/run-parameters/run-parameters.types.ts`: a number input labeled "Max turns", filled with `max_turns` of the project run configuration, and showing the default "6" as its placeholder while it is empty.

```ts
const maxTurns: RunParameterField = {
  name: 'max_turns',
  label: 'Max turns', // no title, so derived from the name
  widget: 'number', // derived from "integer"
  description: null,
  options: [],
  minimum: 1,
  maximum: null,
  integer: true,
  defaultValue: 6,
}
```

Example of workflow state. The [state example](../API.md#workflow-state) is drawn as:

```text
current_stage           interviewing
active_persona_index    1
interview_turn          3
iteration_count         0
personas                PER-001 v1, PER-002 v2                         (links to those versions)
interview_transcripts   Interview with the student v7, Interview with the mentor v2   (links to those versions)
```

## 8. What still needs a change in the web app

Changes of these kinds need code in the web app; every other change of the workflow or of the content schemas does not:

- A new node kind, other than `start`, `end`, `agent`, `checkpoint` and `control`.
- A new question type, other than `single_select`, `multi_select`, `free_text` and `number`.
- A new event type that needs its own display.
- A new value of `x-ui-display` or `x-ui-widget`.
- A dedicated component for a kind that the generic drawing shows poorly.

## 9. Files

Where the parts above go in the web app. The module and the layer of each part follow [Web App Modules](web-app-modules.md), and the names follow the file naming rules of the contributing guide:

| Part | Module and layer | Files |
|---|---|---|
| Workflow definition and state | `workflow`, entities | `modules/workflow/entities/definition/workflow.api.ts`, `modules/workflow/entities/definition/workflow-definition.types.ts`, `modules/workflow/entities/definition/workflow.keys.ts`, `modules/workflow/entities/definition/hooks/useWorkflowDefinition.ts` |
| Progress of a run | `run`, entities | `modules/run/entities/steps/run-progress.utils.ts`; `NodeStatus`, `NodeProgress` and `RunProgress` in `modules/run/entities/steps/run-steps.types.ts` |
| Graph | `run`, widget `graph` | `modules/run/widgets/graph/components/WorkflowGraph.tsx`; one component per node kind: `TerminalNode.tsx`, `AgentNode.tsx`, `CheckpointNode.tsx`, `ControlNode.tsx`; `modules/run/widgets/graph/run-graph.types.ts` (`WorkflowNodeData`, `WorkflowEdgeData`); `modules/run/widgets/graph/graph-layout.utils.ts` (elkjs) |
| Details of a node | `run`, widget `graph` | `modules/run/widgets/graph/components/NodeDetailsPanel.tsx`, with the retry action of `run/features/retry` |
| Reviews | `review`: entities, feature `answer`, widget `panel` | `modules/review/entities/interrupts.api.ts`, `modules/review/entities/interrupts.types.ts`, `modules/review/entities/hooks/useInterruptQueries.ts`; `modules/review/features/answer/components/AnswerReviewForm.tsx` (options, questions, feedback), `modules/review/features/answer/hooks/useAnswerReview.ts`, `modules/review/features/answer/hooks/useAnswerReviewForm.ts` (S2a); `modules/review/widgets/panel/components/ReviewPanel.tsx`, which shows the prompt, the items under review with the edit form of `artifact/features/edit`, and the answer form (S2b) |
| Status of a project | `project`, widget `status`; `run`, feature `stop` | `modules/project/widgets/status/components/ProjectRunStatus.tsx`, `modules/project/entities/run-status/hooks/useProjectRunResult.ts`, `modules/run/entities/events/hooks/useRunStatusEvents.ts`, `modules/project/entities/run-status/hooks/useProjectRunStream.ts`, `modules/run/features/stop/components/StopRunDialog.tsx` |
| Threads and messages | `thread`, entities | `modules/thread/entities/api/threads.api.ts`, `modules/thread/entities/api/messages.api.ts`, `modules/thread/entities/types/threads.types.ts`, `modules/thread/entities/types/messages.types.ts`, `modules/thread/entities/hooks/useThreadQueries.ts`, `modules/thread/entities/hooks/useMessageQueries.ts`; `modules/thread/features/send-message/useSendMessage.ts` (S2a) |
| Activity | `activity`: entities, feature `choose-run-settings`, widgets `panel`, `chat`, `dialogs` (S2a) | `modules/activity/entities/hooks/useActivityThread.ts`, `useRunEntries.ts`, `useActivityStream.ts`, `modules/activity/entities/activity-entries.utils.ts`; `modules/run/entities/steps/stage-progress.utils.ts` and `work-entries.utils.ts`, which give the steps and sub-steps of Progress and the lines of work of the chat; `modules/activity/widgets/panel/components/ProgressSection.tsx`, `OutlineSection.tsx`; `modules/activity/widgets/chat/components/ActivityPage.tsx`, `ActivityPrompt.tsx`; `modules/activity/features/choose-run-settings/components/ChooseRunSettingsDialog.tsx` |
| Form built from a schema | Shared code | `shared/components/content-form/ContentForm.tsx`, `modules/workflow/entities/content/fields/content-fields.types.ts` (`ContentField`), `shared/components/content-form/field-widgets.utils.ts`. The caller gives the values of a field marked `x-value-from` |
| Artifacts and items | `artifact`, entities | `modules/workflow/entities/artifact-kinds/artifact-kinds.api.ts`, `modules/artifact/entities/types/artifacts.types.ts`, `modules/artifact/entities/types/items.types.ts`; one component per display: `DocumentView.tsx`, `SectionHeading.tsx`, `ItemTable.tsx`, `ItemCards.tsx`, `TranscriptView.tsx`; `modules/artifact/entities/kind-components.constants.ts` (the registry) |
| Editing an artifact or an item | `artifact`, feature `edit` | The edit form, on `ContentForm.tsx`, and one hook per save: `modules/artifact/features/edit/hooks/useUpdateArtifact.ts`, `modules/artifact/features/edit/hooks/useUpdateItem.ts` |
| Run settings | `run`, entities | `modules/run/entities/components/RunDefaultsFields.tsx`, on `runParameterFields` of `workflow`. It saves nothing: the feature that shows the fields saves the values |
| Workflow state | `run`, entities | `modules/run/entities/components/StateTree.tsx` |
| Usage | `usage`, entities | `modules/usage/entities/usage.api.ts`, `modules/usage/entities/usage.types.ts`, `modules/usage/entities/hooks/useUsageQueries.ts` (with `useMonthlyBudget`), `modules/usage/entities/components/MonthlyBudgetItem.tsx`, `shared/lib/cost/`, `shared/api/query-client/query-meta.*` |
| Models | `llm-model`, entities | `modules/llm-model/entities/models/models.api.ts`, `modules/llm-model/entities/models/models.types.ts`, `modules/llm-model/entities/models/hooks/useModelQueries.ts`, `modules/llm-model/entities/model-settings/model-settings.api.ts`, `modules/llm-model/entities/model-settings/model-settings.types.ts`, `modules/llm-model/entities/model-settings/hooks/useModelSettingQueries.ts` |
| Account | `user`, entities | `modules/user/entities/user/user.api.ts`, `modules/user/entities/user/user.types.ts`, `modules/user/entities/user/hooks/useMe.ts`, `modules/user/entities/sessions/sessions.api.ts`, `modules/user/entities/sessions/sessions.types.ts`, `modules/user/entities/sessions/hooks/useSessionQueries.ts`, `modules/user/entities/user-settings/user-settings.api.ts`, `modules/user/entities/user-settings/user-settings.types.ts`, `modules/user/entities/user-settings/hooks/useUserSettingsQueries.ts` |

## 10. Open points

1. **Stable layout.** An automatic layout can move nodes when a new definition version adds one. If the team wants positions that stay put, the definition can carry optional position hints, used when present.
2. **Checking content in the browser.** A JSON Schema validator adds to the size of the web app; checking only on the backend is the lighter alternative.
3. **Who sees the workflow state.** The state panel is meant for experiments; whether every user of a project sees it, or only some roles, is not decided.

## 11. Review checklist

- [ ] No node, option, item kind, field or run parameter of the current workflow is written in the web app code
- [ ] The graph, the reviews, the artifact panel and the run settings each read their data from an endpoint listed in section 2
- [ ] A reload during a run draws the same graph as before the reload
- [ ] Every change that still needs the web app is in the list of section 8
