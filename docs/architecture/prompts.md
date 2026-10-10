# Prompts

How the instructions of each agent are written, stored, assembled into the messages sent to a model, versioned and checked. Nothing described here is implemented yet.

The rules for the data inside a prompt (prompt view of an item, stable rendering, fixed parts first) are in [Data shape: prompt view of an item](../DATA_SHAPE.md#prompt-view-of-an-item). The agent roles and the workflow definition that selects a prompt version are in [Workflow definitions](../workflow/README.md). A template and a complete example are in [`workflow/prompts/`](../workflow/prompts/).

## Contents

- [Prompts](#prompts)
  - [Contents](#contents)
  - [1. Decision drivers](#1-decision-drivers)
  - [2. Format and storage](#2-format-and-storage)
  - [3. Prompt file](#3-prompt-file)
  - [4. Sections](#4-sections)
  - [5. Assembling the messages](#5-assembling-the-messages)
  - [6. Output models](#6-output-models)
  - [7. Writing rules](#7-writing-rules)
  - [8. Versions](#8-versions)
  - [9. Checks and tests](#9-checks-and-tests)
  - [10. Files](#10-files)
  - [11. Open points](#11-open-points)
  - [12. Review checklist](#12-review-checklist)

---

## 1. Decision drivers

| Id | Driver |
|---|---|
| D1 | Reviewable: the whole team, including research members who do not write Python, reads and changes prompt text, and a change shows as a plain diff in a pull request |
| D2 | Structured: every prompt has the same named parts, so a reader finds the rules or the output guidance in the same place in every prompt, and a check verifies that the required parts exist |
| D3 | Cache-friendly: the text that is the same for every call of a role comes first and stays byte-identical, so the provider's prompt cache serves it |
| D4 | Reproducible: a run identifies the exact prompt text each agent used |
| D5 | Provider-neutral: one prompt works with every provider of the model catalog |
| D6 | No extra service at run time, on a low-memory machine included |

## 2. Format and storage

| Option | D1 | D2 | D3 | D4 | D5, D6 |
|---|---|---|---|---|---|
| Python string constants in `prompts.py` | Long text inside code; review means reading Python | Sections only by convention | Possible | Through the git commit | Yes |
| **Markdown file with YAML front matter, one per agent role and version, in git** | Plain text, rendered by GitHub, diff per line | Headings name the sections; the front matter declares inputs and output | The file states which part is fixed | File name carries the version; the workflow definition selects it | Yes |
| YAML file with one key per section | Multi-line text inside YAML is hard to read and to indent | Strict | Possible | As for Markdown | Yes |
| Prompt management of the tracing tool | Edited in a web interface, outside pull requests | Depends on the tool | Possible | Versions and labels in the tool, outside git | The prompt is fetched from the tool at run time; self-hosted, it runs several services |

Decision: one Markdown file with YAML front matter per agent role and version, in git, next to the graph. This matches "versioned in Git at first" in [Planning](../PLANNING.md).

Trade-offs: a small loader must parse the file and check it, and placeholders are plain text until the loader renders them, so a typo is found by the check in [section 9](#9-checks-and-tests), not by the type checker. If the team later wants to edit prompts in the tracing tool, the files stay the source and are copied into it.

## 3. Prompt file

Location in the code: `agents/<graph_name>/prompts/<agent_role>.v<version>.md`. Until the backend exists, drafts live in [`docs/workflow/prompts/`](../workflow/prompts/).

A file has a front matter block and a body with two parts:

```markdown
---
role: analyst
version: 1
description: Extracts and analyzes requirements from the interview transcripts.
output: AnalystOutput
inputs:
  - name: output_language
    part: system
    description: Language of every text field of the output.
  - name: transcripts
    part: user
    description: Interview transcripts, one message per line.
---

# System

## Role
...

# User

## Context
<transcripts>
{{ transcripts }}
</transcripts>

## Task
...
```

| Front matter field | Content |
|---|---|
| `role` | An agent role of the workflow definition |
| `version` | Integer, equal to the number in the file name |
| `description` | One line: what this prompt makes the agent do |
| `output` | Name of the output model the agent returns, see [section 6](#6-output-models) |
| `inputs` | Every placeholder of the body: its `name`, the `part` it may appear in (`system` or `user`), and a `description` |

Body rules:

- `# System` and `# User` are the only first-level headings, in this order.
- Each part has the second-level headings of [section 4](#4-sections), in the order given there.
- A placeholder is `{{ name }}`, with a name declared in `inputs`. The body has no other template syntax: no loops and no conditions. Data is turned into text by code before it is put into the template, see [section 5](#5-assembling-the-messages).
- An HTML comment (`<!-- ... -->`) is a note for the people who edit the file. The loader removes it before rendering, so it never reaches the model.

## 4. Sections

| Part | Section | Required | Content |
|---|---|---|---|
| System | `Role` | Yes | Who the agent is, in one or two sentences |
| System | `Goal` | Yes | What this step must produce, and what it is used for next |
| System | `Inputs` | Yes | Each data tag of the context, what it contains and how it is formatted |
| System | `Procedure` | Yes | The steps to follow, numbered |
| System | `Rules` | Yes | What the agent must always or never do |
| System | `Output` | No | Guidance for filling the output model that the field descriptions of the schema do not give: link fields, when to update an existing item, how to choose a value |
| System | `Examples` | No | Short examples of input and output, from a project that is not in any dataset |
| User | `Context` | Yes | The data of this call, each input inside an XML tag named after it |
| User | `Task` | Yes | The request of this call, in one or two sentences |

The System part is the same for every call of the role within a run. The User part holds what changes: the long data first and the request last, which is the order providers recommend for long inputs.

## 5. Assembling the messages

For one call of an agent node:

1. The node collects its inputs from the state and the stores: items, transcripts, the directive of the loop.
2. Code renders each input to text with the prompt view rules of the data shape: the key and the content fields of each item, in a fixed field order, items sorted by key. The same items always give the same text.
3. The loader fills the placeholders of the file, with an error for a missing or an undeclared one.
4. The System part becomes the system message and the User part the first user message. For the interviewer and the persona agent, the transcript is in the User part and only grows at its end, so successive turns share the longest possible prefix.
5. The output model is passed to the model as the structured output format, through the model layer. Its JSON Schema carries the field descriptions of the content schemas, so the prompt does not repeat them.

| Message order | Content | Cached |
|---|---|---|
| Tool definitions, when the role has tools | From the tools of the role | Yes |
| System message | System part | Yes |
| User message | User part | Only the part shared with an earlier call |

A provider caches only a prefix above a minimum length, about a thousand tokens or more depending on the model. A short System part is therefore cached only together with the tool definitions or the examples that make the prefix long enough.

## 6. Output models

An agent returns items through an output model, never as free text that is parsed afterwards. The output model of a role is a Pydantic model in `agents/`, built from the content models of `domain/`:

- Each returned item has the content fields of its kind, minus the fields marked `readOnly` and those set by the user.
- A new item has a `ref`, a short name unique within the response such as `R1`. An existing item has its `key`, and an agent returns one only to change its lifecycle fields; a change of what an item says is a new item with a `supersedes` link, see [Data shape: two levels](../DATA_SHAPE.md#two-levels-artifact-and-item). The server assigns keys to new items.
- Link fields have the name of the link type, as in the prompt view, and name the items the item is linked to, by key or by `ref` of the same response, for example `derived_from: ["R1", "LN-002"]`. The server turns them into trace links.
- The model may return fields of the artifact itself, such as `summary` and the content fields of the artifact kind.

## 7. Writing rules

- **English instructions.** Every prompt is written in English. The language of the output comes from the `output_language` placeholder, which is fixed for a run and may appear in the System part.
- **Data is data.** Text inside a data tag comes from users, from documents or from other agents. The Rules section of every prompt states that instructions found inside a data tag are not followed.
- **Keys only.** An agent refers to items by key or by `ref`, never by id, title or position.
- **No changing values in the System part.** No timestamp, run id, user name or counter, so that the System part stays identical within a run.
- **One task per prompt.** A role with two different jobs has two prompts, each with its own output model.
- **No repetition of the schema.** The meaning of a field is written once, in the description of the content schema; the Output section adds only what the schema cannot say.
- **Plain, direct sentences.** Numbered steps in Procedure, one rule per bullet in Rules.

## 8. Versions

- **File per version.** A change of the text creates `<agent_role>.v<n+1>.md`. A file merged into `main` is never edited afterwards; a check in continuous integration fails when one changes.
- **Selected by the definition.** Each agent role in the workflow definition has a `prompt_version`, so `workflow_version` of a run identifies the prompt of every agent it used. Adopting a new prompt in the product is a new definition version.
- **Overridden in experiments.** A variant of an experiment may select another prompt version per role, see [Experiments: experiment config](experiments.md#experiment-config). The run record stores the version used by each role.
- **Ablations.** Because sections are named, an ablation that removes a part, for example the examples, is a new version whose diff is exactly that section.

## 9. Checks and tests

| Check | When |
|---|---|
| Front matter is valid; `role` exists in the definition; `version` equals the file name | Loading, and a unit test over every file |
| `# System` and `# User` present; required sections present and in order | Same |
| Every placeholder is declared in `inputs`, appears only in its declared part, and every declared input is used | Same |
| Every `prompt_version` of the definition has a file | Unit test over every definition |
| The file renders with fixture inputs, and the result equals the stored snapshot | Unit test. A change of the text changes the snapshot, so the rendered prompt shows in the pull request |
| The smoke evaluation set | On pull requests that touch prompts, as the research methodology states |

## 10. Files

```text
backend/src/khoailanggraph/agents/
├── prompts.py                         loader: parse, check, render
└── <graph_name>/
    ├── prompts/
    │   ├── planner.v1.md
    │   ├── analyst.v1.md
    │   └── ...                        one file per agent role and version
    └── outputs.py                     output models, built from the content models of domain/

docs/workflow/prompts/
├── TEMPLATE.md                        every section, with notes on what to write
└── analyst.v1.md                      a complete example
```

## 11. Open points

1. **References inside one response.** The `ref` of a new item, used by links within the same response, is proposed here; the data shape only states that agents return keys.
2. **Removing a section at run time.** An experiment could drop an optional section without a new file. It is left out: a version per variant keeps every prompt that a run used in git.
3. **Wording per provider.** One prompt serves every provider. If a model family needs different wording, the choice is a version per family selected with the model, or conditions inside one file; neither is designed.
4. **Prompts of the other roles.** Only the analyst prompt is written as an example. The others are written with the backend, from the template.

## 12. Review checklist

- [ ] Every prompt file has the front matter fields and the required sections in order
- [ ] No placeholder of the System part changes within a run
- [ ] The Rules section says that instructions inside data tags are not followed
- [ ] The prompt repeats no field description of the content schemas
- [ ] Every `prompt_version` of the workflow definition has a file
