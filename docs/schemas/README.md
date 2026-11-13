# Content Schemas

The exact definition of the `content` of every artifact kind and every item kind, one JSON Schema file per kind.

What an artifact and an item are, and the fields they have outside `content`, is in [Data shape: two levels](../DATA_SHAPE.md#two-levels-artifact-and-item). The meaning of each field is in the field tables of that document; the files here fix the names, types, allowed values and which fields are required.

## Files

```text
schemas/
├── artifacts/
│   ├── elicitation_plan.v1.json
│   ├── persona_catalog.v1.json
│   ├── persona_catalog.v2.json
│   ├── research_corpus.v1.json
│   ├── interview_transcript.v1.json
│   ├── requirements_analysis.v1.json
│   ├── requirement_specification.v1.json
│   ├── product_backlog.v1.json
│   └── validation_report.v1.json
└── items/
    ├── section.v1.json
    ├── persona.v1.json
    ├── persona.v2.json
    ├── source_document.v1.json
    ├── stakeholder_observation.v1.json
    ├── interview_message.v1.json
    ├── raw_requirement.v1.json
    ├── analyzed_requirement.v1.json
    ├── latent_need.v1.json
    ├── assumption.v1.json
    ├── ambiguity_issue.v1.json
    ├── conflict.v1.json
    ├── spec_requirement.v1.json
    ├── backlog_item.v1.json
    └── validation_issue.v1.json
```

| Level | Kind | File | Key prefix | Inside artifact kind |
|---|---|---|---|---|
| Artifact | `elicitation_plan` | [`artifacts/elicitation_plan.v1.json`](artifacts/elicitation_plan.v1.json) | - | - |
| Artifact | `persona_catalog` | [`artifacts/persona_catalog.v1.json`](artifacts/persona_catalog.v1.json), version 2 from workflow definition version 2: [`v2`](artifacts/persona_catalog.v2.json) | - | - |
| Artifact | `research_corpus` | [`artifacts/research_corpus.v1.json`](artifacts/research_corpus.v1.json) | - | - |
| Artifact | `interview_transcript` | [`artifacts/interview_transcript.v1.json`](artifacts/interview_transcript.v1.json) | - | - |
| Artifact | `requirements_analysis` | [`artifacts/requirements_analysis.v1.json`](artifacts/requirements_analysis.v1.json) | - | - |
| Artifact | `requirement_specification` | [`artifacts/requirement_specification.v1.json`](artifacts/requirement_specification.v1.json) | - | - |
| Artifact | `product_backlog` | [`artifacts/product_backlog.v1.json`](artifacts/product_backlog.v1.json) | - | - |
| Artifact | `validation_report` | [`artifacts/validation_report.v1.json`](artifacts/validation_report.v1.json) | - | - |
| Item | `section` | [`items/section.v1.json`](items/section.v1.json) | `SEC` | Every artifact kind with items, except `interview_transcript` |
| Item | `persona` | [`items/persona.v1.json`](items/persona.v1.json), version 2 from workflow definition version 2: [`v2`](items/persona.v2.json) | `PER` | `persona_catalog` |
| Item | `source_document` | [`items/source_document.v1.json`](items/source_document.v1.json) | `SRC` | `research_corpus` |
| Item | `stakeholder_observation` | [`items/stakeholder_observation.v1.json`](items/stakeholder_observation.v1.json) | `OBS` | `research_corpus` |
| Item | `interview_message` | [`items/interview_message.v1.json`](items/interview_message.v1.json) | Persona key, `#`, position | `interview_transcript` |
| Item | `raw_requirement` | [`items/raw_requirement.v1.json`](items/raw_requirement.v1.json) | `RAW` | `requirements_analysis` |
| Item | `analyzed_requirement` | [`items/analyzed_requirement.v1.json`](items/analyzed_requirement.v1.json) | `AR` | `requirements_analysis` |
| Item | `latent_need` | [`items/latent_need.v1.json`](items/latent_need.v1.json) | `LN` | `requirements_analysis` |
| Item | `assumption` | [`items/assumption.v1.json`](items/assumption.v1.json) | `ASM` | `requirements_analysis` |
| Item | `ambiguity_issue` | [`items/ambiguity_issue.v1.json`](items/ambiguity_issue.v1.json) | `AMB` | `requirements_analysis` |
| Item | `conflict` | [`items/conflict.v1.json`](items/conflict.v1.json) | `CONF` | `requirements_analysis` |
| Item | `spec_requirement` | [`items/spec_requirement.v1.json`](items/spec_requirement.v1.json) | `REQ` | `requirement_specification` |
| Item | `backlog_item` | [`items/backlog_item.v1.json`](items/backlog_item.v1.json) | `US` for a user story, `EP` for an epic | `product_backlog` |
| Item | `validation_issue` | [`items/validation_issue.v1.json`](items/validation_issue.v1.json) | `VAL` | `validation_report` |

## Checking the files

[`content-schema.meta.schema.json`](content-schema.meta.schema.json) is the schema of a content schema file: the keywords a file may use, the values of the `x-*` keywords, the fields every property needs, and which keywords belong to an artifact kind or to an item kind. Every file of this folder is valid against it.

Rules that relate a file to itself or to its name are not expressible in a JSON Schema. A test of the backend checks them for every file:

| Rule | Detail |
|---|---|
| Name | `$id` is `<artifacts or items>/<x-kind>/v<x-schema-version>`, the level matches `x-level`, and the file is `<x-kind>.v<x-schema-version>.json` |
| Every field is required | `required` lists exactly the names in `properties` |
| Field order | `x-ui-field-order` lists exactly the names in `properties` |
| Known fields | `x-ui-title-field`, `x-ui-role-field`, `x-ui-participants-field` and every name in `x-ui-list-fields` is a property |
| Title of a navigable kind | When `x-ui-navigable` is `true`, the field that `x-ui-title-field` names is a short title: its description says it has at most 60 characters. The length is not a keyword of the schema, because the structured output of LLM providers does not accept it |
| Value lists | Every `x-value-list` names a list of the workflow definition that uses the file, and a field has either an `enum` or one of `x-value-list` and `x-value-from`, never both |

## Conventions

| Rule | Detail |
|---|---|
| Dialect | JSON Schema draft 2020-12 |
| One file per kind and version | `<kind>.v<version>.json`. A file is never edited after it is in use; a change creates the next version, and the old file stays so that stored content can still be read. The exception is a change that does not change which content is valid: `title`, `description` and the display keywords are edited in place |
| Self-contained | A file has no reference to another file. Fixed value lists, such as priority, are repeated in each file that uses them |
| Values from the project | A field whose allowed values come from the data of the project names their source with `x-value-from`: `"<artifact kind>.<field>"`, a list of strings in the content of an artifact kind that a project has once, for example `"elicitation_plan.stakeholder_types"`. A value written to the field must be in that list of the current artifact of the project; for a list field, every element. Unlike a value list, the allowed values differ from one project to another, so the backend fills in the `enum` from the project only when it gives the schema to an agent. Version 1 uses it for `stakeholder_type` of a persona, `uncovered_stakeholder_types` of the persona catalog, and `topic` of a raw requirement and of an interview message |
| Value lists | A field whose allowed values may change between experiments names a value list of the workflow definition with `x-value-list` instead of listing them in `enum`. When the backend serves a schema, or gives it to an agent as the output format, it fills in the `enum` from the definition version in use and adds the description of each value to the description of the field, so an agent reads what every value means. Version 1 has five: `priority`, `quality_category`, `ambiguity_type`, `conflict_type` and `validation_category`, see [Workflow definitions](../workflow/README.md) |
| Closed objects | `additionalProperties` is `false`; a field that is not in the schema is rejected |
| Every field is required | An optional field is required and nullable, written as a type list such as `["string", "null"]`. This is the form the structured output of LLM providers accepts |
| Plain values only | No field holds the id or key of another item, except the participants of a conversation: the system sets the `key` of a participant to the key of the item it is and its `item_id` to the id of that item, so that a message names its speaker and the participant opens its item. Relations between items are trace links, see [Data shape: traceability](../DATA_SHAPE.md#8-traceability) |
| Metadata | `x-level` (`artifact` or `item`), `x-kind`, `x-schema-version`, and on item kinds `x-key-prefix` |
| Display keywords | `x-ui-*` and `readOnly` tell the client how to show and edit the content, see [display keywords](#display-keywords) |

Rules that a JSON Schema cannot express in the form LLM providers accept are checked by the application and written in the field description. They are:

| Kind | Rule |
|---|---|
| `analyzed_requirement`, `spec_requirement` | `quality_category` is set when `type` is `non_functional`, and null otherwise |
| `spec_requirement` | `fit_criterion` is set when `type` is `non_functional`, and null otherwise |
| `backlog_item` | `as_a`, `i_want` and `so_that` are set when `item_type` is `user_story`, and null for an epic |
| `ambiguity_issue`, `conflict` | `resolution` is set when `status` is `resolved` |
| `interview_transcript` | `stop_reason` is set when `status` is `completed` |

## Display keywords

The client renders and edits every kind from its schema, so a new kind or a new field appears in the web app without a client change. These keywords tell it how. The set below is exact; a client ignores a keyword it does not know.

At schema level:

| Keyword | Values | Meaning |
|---|---|---|
| `x-ui-display` | An artifact kind: `document`, `transcript`. An item kind: `heading`, `table`, `cards`, `transcript`, `profile` | How the content of the kind is shown. For an artifact, the layout of its document: `document`, its fields above its items; `transcript`, its items as a conversation between its participants, its fields that are separators after the last message and its other fields above the conversation. For an item: `heading`, a section heading with the items it contains; `table`, one row per item; `cards`, one card per item; `transcript`, the items in order, as the messages of a conversation; `profile`, items that are people: in a document one card per item with an avatar, and the page of one item as a profile, the avatar beside its title |
| `x-ui-navigable` | `true`, `false` | Whether the items of the kind can be reached one by one: a row in the outline of the document that holds them, and a page of their own. `false` for items that are short enough to read in place in the page of the document. Item kinds only |
| `x-ui-title-field` | One property name | The field that names an item in lists, links, the outline and trace views. Item kinds only |
| `x-ui-role-field` | One property name | The field whose value is the key of the participant who says the words of a message, shown as the speaker of a transcript. Item kinds only |
| `x-ui-participants-field` | One property name | The field that lists the people of a conversation, the one who leads first: an object list whose entries have `key`, `name`, `role` and `item_id`. The participants who share the role of the first one are drawn on its side of the conversation, the others on the other side. Artifact kinds only |
| `x-ui-list-fields` | Property names, in order | The fields shown as table columns, on a card, and on the card of a profile: the fields that read on one line under its title, then the others. Item kinds only |
| `x-ui-field-order` | Every property name, in order | The order of the fields in the detail view and the edit form |

At field level:

| Keyword | Values | Meaning |
|---|---|---|
| `x-ui-widget` | `text`, `textarea`, `select`, `number`, `list`, `tags`, `object-list`, `separator`, `avatar-list`, `badge`, `rating-list`, `boolean` | The input used to show and edit the field: one line, several lines, a choice from the `enum` or from the values that `x-value-from` names, a number, a list of lines, a list of short tags, a list of objects with their own fields. `separator`: a value that marks a place of a sequence; in a transcript, a separator where the value of a message changes from the message before, or after the last message for a field of the artifact, and its value elsewhere; edited as its type. `avatar-list`: a list of people whose entries have a `name` and an `item_id`, each shown as an avatar and its name, which opens the item when it has one. `badge`: a choice from the `enum` or from a value list, shown as a badge. `boolean`: a yes or no. `rating-list`: a list of objects of which one field names what is rated (`x-ui-label-field`), one integer field holds the rating on the scale given by its `minimum` and `maximum` (`x-ui-value-field`), and an optional field says why (`x-ui-note-field`); each entry is shown as its label, a rating on its scale and its note, and edited as an `object-list` |
| `readOnly` | `true` | A standard JSON Schema keyword. The field is set by the system: the user cannot edit it, and the output format given to an agent leaves it out |

**Wording.** The `title` and the `description` of a field, the titles of the entries of a list, and the titles of the values of a list are read by users. They use formal but friendly words, the plain words of the user and not the terms of the system: "Comfort with technology", not "Tech comfort". A title is a short noun phrase. It has no phrasal verb and no spoken phrase, so "Influence on decisions" is better than "Has a say in the decision", and "Frequency of use" is better than "Would use it often". A description is a complete sentence with a subject and a verb. A key, an id or a field name is never shown as a label; a value that is stored as a key has a title for the user next to it.

A field without `x-ui-widget` is shown by its type. The label of a field is derived from its name, for example `fit_criterion` becomes "Fit criterion".

| Kind | `x-ui-display` | `x-ui-navigable` | `x-ui-title-field` | `x-ui-list-fields` |
|---|---|---|---|---|
| Every artifact kind except `interview_transcript` | `document` | - | - | - |
| `interview_transcript` | `transcript` | - | - | - |
| `section` | `heading` | `true` | `title` | `title` |
| `persona` | `profile` | `true` | `name` | `name`, `stakeholder_type`, `interview_status`, `background`, `goals` |
| `interview_message` | `transcript` | `false` | `content` | `turn`, `speaker`, `content` |
| `raw_requirement` | `table` | `true` | `title` | `title`, `topic` |
| `analyzed_requirement` | `table` | `true` | `title` | `title`, `type`, `priority` |
| `latent_need` | `table` | `true` | `title` | `title`, `confidence`, `disposition` |
| `assumption` | `table` | `true` | `title` | `title`, `validation_status` |
| `ambiguity_issue` | `table` | `true` | `title` | `title`, `ambiguity_type`, `status` |
| `conflict` | `table` | `true` | `title` | `title`, `severity`, `status` |
| `spec_requirement` | `table` | `true` | `title` | `title`, `type`, `priority`, `verification_method` |
| `backlog_item` | `table` | `true` | `title` | `title`, `item_type`, `priority`, `story_points`, `delivery_status` |
| `validation_issue` | `table` | `true` | `title` | `title`, `category`, `severity`, `status` |

`interview_transcript` names its participants with `x-ui-participants-field: participants`, and `interview_message` its speaker with `x-ui-role-field: speaker`. In version 1, `status` and `stop_reason` of an interview transcript and `turn` of an interview message are separators, `participants` of an interview transcript is an avatar list, and `interview_status` of a persona is a badge.

The fields marked `readOnly` in version 1 are `interview_status` of a persona, `participants`, `status`, `turn_count` and `stop_reason` of an interview transcript, and `iteration` of a validation report.

How the web app uses these keywords is described in [Architecture: web app](../architecture/web-app.md).

## Where the schemas live in the code

These files are the specification until the backend exists. After that the source is code, and the files are generated from it.

The kinds a run may use, and the schema version of each, are chosen by the workflow definition version of the run, in its `artifact_kinds` and `item_kinds`, see [Workflow definitions](../workflow/README.md). A new kind, or a new version of a schema, becomes available to runs through a new definition version.

| Step | Detail |
|---|---|
| Source | One Pydantic model per kind and version in a backend package `domain/`. The package imports no other backend package |
| Conditional rules | The rules of the table above are functions in the same package, next to the models |
| Used by `agents/` | The output format an agent must return |
| Used by `features/` | Validation of `content` when an artifact or item is saved or edited, and the responses of `GET /api/v1/artifact-kinds` and `GET /api/v1/content-schemas/{kind}/{schema_version}` |
| Used by `research/` | Reading run results in experiments |
| These files | Exported from the models by a script. A check in continuous integration fails when the exported files differ from the committed ones, so a schema change is visible in review |

An agent does not fill every field. Fields marked `readOnly`, and fields marked "Set by the user" in their description, are given a default by the application, and the output format given to the agent leaves them out. The agent also returns the items a new item is linked to, by key, or by `ref` for an item created in the same response, see [Prompts: output models](../architecture/prompts.md#6-output-models); those become trace links and are not part of `content`.

## Changing a schema

A change concerns one kind only. The other kinds keep their version: changing `spec_requirement` adds `spec_requirement.v2.json`, and every other kind stays at version 1. The API version does not change.

1. Add `<kind>.v<n+1>.json` and its model; keep version `n`.
2. Add a function that converts content of version `n` to version `n+1`.
3. New rows are written with the new version. An old row is converted when it is read and saved with the new version when it is next changed.
4. Publish a workflow definition version that uses the new schema version. Runs of earlier definition versions keep the old one.
5. Update the field table in [Data shape](../DATA_SHAPE.md) and the tables above.

A change to `title`, `description` or a display keyword does not change which content is valid, so it is made in the existing file, without a new version.
