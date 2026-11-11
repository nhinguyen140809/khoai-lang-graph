# Workflow Definitions

The full workflow definition of each version of the agent workflow: its graph, the names its runs may store, and the schemas of its run parameters and of its state. One JSON file per workflow name and version.

Why the definition exists, and which data it governs, is in [Data shape: workflow vocabulary](../DATA_SHAPE.md#workflow-vocabulary). The endpoint that serves it is in [API design: workflow definition](../API.md#workflow-definition), and how the web app draws from it in [Web app](../architecture/web-app.md).

## Contents

- [Workflow Definitions](#workflow-definitions)
  - [Contents](#contents)
  - [1. Files](#1-files)
  - [2. Parts of a definition](#2-parts-of-a-definition)
  - [3. Version 1](#3-version-1)
  - [4. Rules a JSON Schema cannot express](#4-rules-a-json-schema-cannot-express)
  - [5. Where the definition lives in the code](#5-where-the-definition-lives-in-the-code)
  - [6. Adding a version](#6-adding-a-version)
  - [7. Open points](#7-open-points)
  - [8. Review checklist](#8-review-checklist)

---

## 1. Files

| File | Content |
|---|---|
| [`definition.schema.json`](definition.schema.json) | JSON Schema that every definition file follows: the parts of a definition and the fields of each part. It is the template for a new workflow or a new version |
| [`requirements_engineering.v1.json`](requirements_engineering.v1.json) | Version 1 of the requirements engineering workflow, complete |
| [`prompts/`](prompts/) | The template of a prompt file and the prompt of the analyst as a complete example. The format is described in [Prompts](../architecture/prompts.md) |

A definition file has the same content as the response of `GET /api/v1/workflow/definition?version=` for that version.

## 2. Parts of a definition

| Part | Holds | Used by |
|---|---|---|
| `name`, `version`, `description` | Which workflow and which version | Every run stores `name` and `version` as `workflow_name` and `workflow_version` |
| `entry` | The node at which the first run of a project starts, the node at which every later run starts, and the node a run goes to after any node when user messages are pending | The run executor |
| `agent_roles` | Every agent role, with a label, a description and the version of its prompt file | Model settings per role; run steps and origins; the Vocabulary check; the prompt each agent node loads, see [Prompts](../architecture/prompts.md) |
| `stages` | Every stage, in workflow order, as a flat list. A stage has a `title` for the user, an `internal` flag and a `parent` that makes the stages a tree | `current_stage` of a run and a thread; the status bar and the progress view, which show the titles and skip the internal stages. The progress view shows the stages nested under a stage as its sub-steps, and the subjects of a stage that an artifact kind `one_per_subject` names as its sub-steps too, one after another |
| `nodes` | Every node of the graph. `kind` is `start`, `end`, `agent`, `checkpoint` or `control`. An agent node names its agent role; a checkpoint node holds the `title` shown to the user, the prompt, the kinds of the artifacts under review, whether edits are allowed, the options, the questions asked every time, and whether an agent may add questions at run time | The graph view; the interrupt a checkpoint creates; the list of reviews the user may turn on in the run settings |
| `edges` | Every edge, with its label, whether it is conditional, and the checkpoint option that leads along it | The graph view; the edge a run follows after an answer |
| `artifact_kinds` | Every artifact kind, with its content schema version, the stage that produces it, how many a project may have, the kind of its subject item, and the item kinds it contains | The checks Item in artifact, One artifact, Subject item and Section placement; the order of artifacts in the API |
| `item_kinds` | Every item kind, with its content schema version and, for a kind that records a problem to settle, the field of its content that says whether it is still open and the link types that tie it to the items it is about and to the people it involves | The Content check; `GET /artifact-kinds`; the list of open issues |
| `persona_aspects` | The first tier of the aspects that every persona is scored on from 1 to 5: a key, a title, what it measures and what the scores 1 and 5 mean. The second tier is proposed by the planner in the plan, see [Data shape: persona aspects](../DATA_SHAPE.md#persona-aspects) | The persona generator, the interviewer and the persona agent |
| `link_types` | Every trace link type, with the pairs of item kinds it may connect, whether it must stay free of cycles, and whether only the agents create it (`agent_only`) | The checks Link type and No cycle; the link types that the user may choose when linking two items |
| `value_lists` | Every named list of allowed values for a content field, each value with a title and a description. A content schema names the list with `x-value-list` instead of an `enum`, because the list may change between experiments | The Content check; the schemas served by `GET /artifact-kinds`; the output format and the prompts of the agents; the metrics of the research track |
| `directive_kinds` | Every directive kind, with its item roles and the schema of its `details` | The Directive check |
| `export_templates` | Every export template, with the artifact kinds it is built from and the formats it can be produced in | The export endpoint |
| `run_parameters_schema` | JSON Schema of `parameters` in the run configuration, with the default of each parameter | Validation of the run configuration; the run settings form |
| `state_schema` | JSON Schema of the workflow state | The state endpoints; the state panel |

The checks named in this table are those of [Data shape: integrity rules](../DATA_SHAPE.md#integrity-rules). Each check function in `domain/` receives the part of the definition it needs as an argument.

In `link_types`, `any` stands for every item kind except `section`, which is never the source or the target of a link, and `same` for the kind of the source.

## 3. Version 1

[`requirements_engineering.v1.json`](requirements_engineering.v1.json) contains 9 agent roles, each at prompt version 1, 12 stages, 15 nodes, 25 edges (the version 2 of the definition has 30 edges, which add the option `other` to each checkpoint), 7 artifact kinds, 12 item kinds, 10 link types, 5 value lists, 2 directive kinds, 5 export templates and 4 run parameters.

The values come from the tables of the [data shape](../DATA_SHAPE.md) and from the [agent workflow diagram](../architecture/README.md#5-agent-workflow): the nodes and edges are those of the diagram, and the item kinds and schema versions are those of the [content schemas](../schemas/README.md). The values that appear in neither are proposals, listed in [Open points](#7-open-points).

An abridged example, the node `checkpoint_analysis` and the edges that leave it:

```json
{
  "nodes": [
    {
      "id": "checkpoint_analysis",
      "kind": "checkpoint",
      "label": "checkpoint_analysis",
      "stage": "analysis_review",
      "prompt": "Review the requirements analysis. Accept it, or reject it with feedback.",
      "review_artifact_kinds": ["requirements_analysis"],
      "allow_edits": true,
      "options": [
        { "key": "accept", "label": "Accept", "requires_feedback": false, "approves": true, "is_default": true },
        { "key": "reject_reanalyse", "label": "Reject and re-analyse", "requires_feedback": true, "approves": false, "is_default": false },
        { "key": "reject_reinterview", "label": "Reject and re-interview", "requires_feedback": true, "approves": false, "is_default": false }
      ],
      "questions": [],
      "agent_questions": false
    }
  ],
  "edges": [
    { "source": "checkpoint_analysis", "target": "requirement_engineer", "label": "accept", "conditional": true, "option": "accept" },
    { "source": "checkpoint_analysis", "target": "analyst", "label": "reject + re-analyse", "conditional": true, "option": "reject_reanalyse" },
    { "source": "checkpoint_analysis", "target": "rework_elicitation", "label": "reject + re-interview", "conditional": true, "option": "reject_reinterview" }
  ]
}
```

## 4. Rules a JSON Schema cannot express

These rules relate parts of one definition to each other, or a definition to the content schemas. A test of the backend checks them for every definition version.

| Rule | Detail |
|---|---|
| Unique names | Keys of agent roles, stages, link types and export templates, ids of nodes, and kinds of artifacts, items and directives are unique in their list |
| Stage tree | The `parent` of a stage is null or the key of a stage listed before it, so the stages form a forest with no cycle. A node and an artifact kind name a stage that has no children |
| Start and end | Exactly one node of kind `start` and one of kind `end` |
| Known names | Every stage, agent role, node, artifact kind and item kind that a part names is defined in the same definition. A link pair never names `section` |
| Value sources | Every `x-value-from` in the content schemas that the definition uses names an artifact kind whose `per_project` is `one`, and a field of its content schema that is a list of strings |
| Value lists | Keys of the lists and of the values inside each list are unique. Every `x-value-list` in the content schemas that the definition uses names one of its lists |
| Roles in use | Every agent role is the role of at least one agent node |
| Options and edges | Every option of a checkpoint leads along exactly one edge of that checkpoint, every edge leaving a checkpoint names one of its options, and every checkpoint has exactly one default option |
| Questions | A checkpoint has at least one option, one question, or `agent_questions` set. Question keys are unique in the checkpoint. A `single_select` or `multi_select` question has at least two choices, and a question of another type has none. `min_selected` and `max_selected` are set only on `multi_select`, with `min_selected <= max_selected <=` the number of choices when both are set. `default_answer` is null only for a question that is not required; otherwise it is a valid answer to the question, and it never contains a choice that requires text |
| Items have a home | Every item kind is contained in at least one artifact kind |
| Subject item | `subject_item_kind` is set exactly when `per_project` is `one_per_subject` |
| Schemas exist | Every artifact kind and item kind has a content schema at the version given |
| Prompts exist | Every agent role has a prompt file at its `prompt_version`. In these docs only the analyst prompt is written, so the rule applies to the code |
| Valid schemas | `run_parameters_schema`, `state_schema` and every `details_schema` are valid JSON Schemas, and the parameter defaults are valid against `run_parameters_schema` |

`max_personas` not lower than `target_personas_num` is a rule between two parameters. JSON Schema in the form used here cannot express it, so the run configuration check applies it, as the description of the parameter states.

## 5. Where the definition lives in the code

These files are the specification until the backend exists. After that the source is `agents/<graph_name>/definition.py`, next to the graph, and each file here is exported from it.

| Part | Source in the code |
|---|---|
| `nodes` and `edges` | Read from the compiled graph, so the graph is the only source of its structure. The definition adds the label, the stage, the agent role and the checkpoint data of each node, and the label and option of each edge |
| `item_kinds`, `artifact_kinds` schema versions | Refer to the content models of `domain/` |
| `run_parameters_schema`, `state_schema` | Generated from the Pydantic models of the run parameters and of the state |
| Every other part | Written in `definition.py` |

A sketch of the code; the names are not fixed:

```python
DEFINITION_V1 = WorkflowDefinition(
    name="requirements_engineering",
    version=1,
    graph=build_graph,  # nodes and edges are read from the compiled graph
    entry=Entry(first_run="planner", later_runs="intent_router", pending_messages="intent_router"),
    agent_roles=[AgentRole("planner", "Planner", "Turns the intent into an elicitation plan.", prompt_version=1), ...],
    stages=[Stage("intent_routing", "Handling your request", internal=True, parent=None), ...],
    node_data={
        "checkpoint_analysis": Checkpoint(
            stage="analysis_review",
            prompt="Review the requirements analysis. Accept it, or reject it with feedback.",
            review_artifact_kinds=["requirements_analysis"],
            allow_edits=True,
            options=[Option("accept", "Accept", requires_feedback=False, approves=True, is_default=True), ...],
        ),
        ...
    },
    item_kinds={"section": 1, "persona": 1, ...},  # kind to content schema version
    run_parameters=RunParametersV1,  # Pydantic model
    state=StateV1,  # Pydantic model
    ...
)
```

A check in continuous integration exports every definition and fails when the result differs from the committed file, so a change of the workflow is visible in review.

## 6. Adding a version

1. Copy the newest file to `<name>.v<n+1>.json`, set `version`, and make the change. A published file is never edited, because runs refer to it and clients cache it without expiry; this applies to a label or a prompt as well.
2. A new item kind, a new artifact kind, or a new schema version of one, needs its content schema first, see [Content schemas: changing a schema](../schemas/README.md#changing-a-schema).
3. Check the file against `definition.schema.json` and the rules of [section 4](#4-rules-a-json-schema-cannot-express).
4. New runs use the new version. Runs of earlier versions keep theirs; a write made by the user outside a run uses the newest.
5. The tables of the [data shape](../DATA_SHAPE.md) describe version 1. When a later version becomes the one the product runs, update them.

A new workflow, with another `name`, starts from `definition.schema.json` and `requirements_engineering.v1.json` in the same way, at version 1.

## 7. Open points

1. **Export formats.** The formats of each export template are proposed here; the data shape lists the templates and the formats, but not which format goes with which template.
2. **Run parameters.** The defaults and the upper bounds of the parameters are proposed here, to keep the cost of a run bounded.
3. **Edits at the analysis and specification checkpoints.** The proposed architecture shows modify only at the persona checkpoint. `allow_edits` is true at the other two as well.
4. **Prompts of the checkpoints.** The prompt texts are proposed here.
5. **Edges after the validator.** Both are assumed, as in [Architecture: open points](../architecture/README.md#9-open-points).
6. **Item kinds per directive item role.** An item role names no item kind, so `addressed_to` is not limited to personas by the definition.

## 8. Review checklist

- [ ] Every name of version 1 in the data shape appears in the file, and no other name does
- [ ] The nodes and edges match the agent workflow diagram
- [ ] Every item kind and artifact kind has a content schema at the version given
- [ ] Every checkpoint option leads along exactly one edge
- [ ] The file is valid against `definition.schema.json`
