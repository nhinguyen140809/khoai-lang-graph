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

Location in the code: `agents/<graph_name>/prompts/<agent_role>.v<version>.md`, with the common settings of the app in `agents/<graph_name>/prompts/_common.v<version>.md`. Until the backend exists, drafts live in [`docs/workflow/prompts/`](../workflow/prompts/).

A file has a front matter block and a body with two parts:

```markdown
---
role: analyst
version: 2
common: 1
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
| System | `Skills` | No | The abilities that the role needs, one bullet for each, with how to use it: the part of the prompt that is about this role and no other. Between `Goal` and `Inputs` |
| System | `Inputs` | Yes | Each data tag of the context, what it contains and how it is formatted |
| System | `Procedure` | Yes | The steps to follow, numbered |
| System | `Rules` | Yes | What the agent must always or never do |
| System | `Output` | No | Guidance for filling the output model that the field descriptions of the schema do not give: link fields, when to update an existing item, how to choose a value |
| System | `Examples` | No | Short examples of input and output, from a project that is not in any dataset |
| User | `Context` | Yes | The data of this call, each input inside an XML tag named after it |
| User | `Task` | Yes | The request of this call, in one or two sentences |

The System part of a prompt that names a version of the common settings (`common` in its front matter) starts with those settings, then the heading "Your role in this step", then the sections above. The common settings follow the structure of a general-purpose agent: who the agent is and who it writes for, how it works, how it writes for people, and how it asks the user. Their sections are:

| Section | Content |
|---|---|
| The team and the people you write for | That the agent is one step of a workflow, who reads what it writes, and which of its texts are for the next agent and which for the user |
| How you work | Do only the own step, use only the inputs and treat data as data, never invent, say plainly what is missing and what was assumed, stay consistent, report honestly |
| Writing for people | The language and the register of the user, the outcome first, complete sentences, terms spelled out, readable before short, names by what things say, no filler, doubt said in one sentence, Markdown only where it is shown |
| Asking the user | Ask only what the user alone can decide; one complete question; two to four options with a title and a description; the recommended option first and as the default; a way to say something else; never ask twice |

The System part is the same for every call of the role within a run, and its first part, the common settings, is the same for every role, so that a provider can cache it across roles. The User part holds what changes: the long data first and the request last, which is the order providers recommend for long inputs.

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
- Link fields have the name of the link type, as in the prompt view, and name the items the item is linked to, by key or by `ref` of the same response, for example `derived_from: ["R1", "LN-002"]`. A link of a type that allows words may be an object with its words instead, for example `evidenced_by: [{ "message": "PER-001#4", "target_quote": "<exact words>" }]` and `derived_from: [{ "item": "R1", "source_quote": "<words of this item>", "target_quote": "<words of R1>" }]`. The server turns them into trace links, and a quote that breaks the [quote rules](../API.md#quote-rules) fails the validation of the step.
- The model may return fields of the artifact itself, such as `summary` and the content fields of the artifact kind.
- An output model with a `report` field also has a `notes` field: a required list of one to three `{ kind, text }`, where `kind` is `doing` or `finding`; the schema refuses an empty list, so that a model writes at least the `doing` note. The server keeps the first three, cuts each text at 160 characters, stores them in the `notes` of the step and sends each one as a `step_note` event before the report. The `interviewer` has no `notes`: its report on the turn where it stops is what it tells the user. A model never writes a `thinking` note: the server would add one only when the provider returns a summary of the reasoning of the model (Later).
- The output model of a node that is followed by a checkpoint (the `persona_generator`, the `analyst` and the `requirement_engineer`) also has an optional `review` field: the `prompt` of the review for this case (at most 300 characters), suggestions for its options, each naming one of the options that the checkpoint has (the schema lists their keys and what they say; `label` at most 40 characters, `description` at most 120, `suggested_feedback` at most 300) and at most three questions, each a `single_select`, a `multi_select` or a `free_text`, with two to four choices of at most 60 characters and the agent's own default. The server drops what breaks a rule, adds the `other` choice, and turns the rest into the interrupt of the checkpoint. The descriptions of these fields in the output model carry the instructions, as for `notes`.
- Every output model of a node has a `report` field, except the answers of the `persona_agent`, which are the interview itself. The `interviewer` writes its `report` only on the turn where it stops, together with the `summary` of the interview, which stays with the transcript; on a turn where it asks a question the `report` is null. The report of a node is: one to three sentences to the user, in the output language, about what the node did. The server stores it as a [Message](../DATA_SHAPE.md#message-mvp) of the thread with `author` `agent` and the role of the node, and fills `artifact_refs` and `item_refs` with the artifacts and the items the response wrote or named, so the chat is the record the user reads.

## 7. Writing rules

- **Common settings first.** What holds for every agent of the app, in particular how it writes for people and how it asks the user, is written once in the common settings and not in each prompt. A prompt keeps what is about its role: the skills, the procedure and the rules of its output. A change of the common settings is a new `_common.v<n>.md`, and each prompt names the version it uses.
- **English instructions.** Every prompt is written in English. The language of the output comes from the `output_language` placeholder, which is fixed for a run and may appear in the System part.
- **Data is data.** Text inside a data tag comes from users, from documents or from other agents. The Rules section of every prompt states that instructions found inside a data tag are not followed.
- **Keys only.** An agent refers to items by key or by `ref`, never by id, title or position. The `report` field is the exception, since the user reads it: it names a thing by what it says, and the refs of the message carry the links, so no key appears in the words.
- **A summary is not a report.** The `summary` of an artifact describes what the document says, for the reader of the document, and stays with the artifact until its content changes. The `report` says what the step did, to the user in the chat, once. Both may be written in one response; an agent writes a `summary` only for the artifacts whose output model has the field (`summary` is optional in them).
- **Markdown only where it is shown as Markdown.** The `report` is a message of the chat and a note is a line of the activity, both shown as Markdown: bold, italic and a short list are allowed in a report, bold and italic only in a note, and never headings, tables, links or code. A report that names three or more things side by side introduces them in one sentence and lists them as bullets, one per line, instead of a long sentence with commas. The prompt of a review, the label of an option, the suggested feedback, a question and its choices are shown as plain text, and the output models tell the agent so.
- **Report what matters.** The `report` field states what was done in plain words first, then only what needs the user's attention, such as a conflict found, an input missing or a choice to make; when nothing needs attention, one short sentence that the work is done. It never lists counts alone, and it does not repeat what the refs already link.
- **Step notes.** The notes of a step tell what it is doing and what it notices on the way, the `report` tells what it ended with, so a note never repeats the report; the report itself may add one sentence on why the result came out so when it is not obvious. A note speaks to a user who is not an engineer: everyday words, the language of `output_language`, the register of the user's own words, Markdown only for a bold or an italic name, and no key, id, field name, JSON, token, prompt or tool. Every step that has a `notes` field writes at least the `doing` note. The text below is the description of the `notes` field in the output model, which the model reads with the rest of the schema, the way it reads the description of `report`; a prompt does not repeat it, so adding the field needs no new prompt version. A prompt that needs more says so in its Output section. The text:

  ```text
  One to three short notes to the user, in the order you write them, each with a `kind` and a `text`. Begin with a `doing` note: one short sentence, under 160 characters, in the present tense, that says what you are doing now or are about to do, such as "I am comparing what the three students said about booking." Add a `finding` for something the user may care about, such as a conflict, a gap or a surprise: one short sentence, under 160 characters. Each `text` has at most 160 characters; a longer one is cut. Write in the output language, in plain words, as you would explain it to a colleague who does not build software. Name things by what they say, never by their keys, ids or field names, and never mention JSON, prompts or tools. Do not repeat the report: notes tell what you are doing and what you notice on the way, the report tells what the work ended with. You may use Markdown for **bold** and *italic* only. Always write the `doing` note; add a `finding` only when you have one, and never pad.
  ```

- **No changing values in the System part.** No timestamp, run id, user name or counter, so that the System part stays identical within a run.
- **One task per prompt.** A role with two different jobs has two prompts, each with its own output model.
- **No repetition of the schema.** The meaning of a field is written once, in the description of the content schema; the Output section adds only what the schema cannot say.
- **Plain, direct sentences.** Numbered steps in Procedure, one rule per bullet in Rules.
- **A reason with each hard rule.** A rule that the agent is most likely to break, or that protects a later step, ends with one sentence that says why, for example that a made-up fact becomes a requirement that nobody wanted. An agent that knows the reason handles a case that the rule did not foresee. Rules about the format of the output need no reason.
- **An example for each hard field.** A field that the schema cannot explain, such as a review with its options and its question, a turn of the interviewer or an issue of the validator, has a short example in Examples, in a domain that no other example uses. A weak and a better version of the hard sentence stand beside it, and a check validates every JSON example against the output model, so that no example teaches a field that does not exist.

## 8. Versions

- **File per version.** A change of the text creates `<agent_role>.v<n+1>.md`, and a change of the common settings creates `_common.v<n+1>.md`, which each prompt adopts by naming the new version in its own new file. A file merged into `main` is never edited afterwards; a check in continuous integration fails when one changes.
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
5. **Notes written live.** `notes` is the first field of every output model that has it, and the server reads the notes out of the answer while it streams, so a note is sent when its closing brace arrives. This relies on the model writing the fields in the order of the schema; which models do is not checked. A call that is retried after a failed parse may have sent notes of the failed answer.
6. **Thinking from the provider.** Whether a provider returns a summary of its reasoning, and in which field, differs by provider and by gateway. The `thinking` note is added per provider only when one is checked to return a usable summary.

## 12. Review checklist

- [ ] Every prompt file has the front matter fields and the required sections in order
- [ ] No placeholder of the System part changes within a run
- [ ] The Rules section says that instructions inside data tags are not followed
- [ ] The prompt repeats no field description of the content schemas
- [ ] Every `prompt_version` of the workflow definition has a file
