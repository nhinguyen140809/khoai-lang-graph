# Assistance: the workflow that answers a message about the app

This note says how a message about the app (not about the requirements work) is answered by its own
workflow, `assistance`, beside `requirements_engineering`, and how the code stays open to a third
workflow. It is the design behind [`workflow/assistance.v1.json`](../workflow/assistance.v1.json).

## 1. Problem

The assistant started as a function of the request handler: it read the project, answered, and
left no trace but a message. A client could not show what it did, because an agent of the workflow
shows its face, its acts, the tools it used and the notes it wrote through a run, its steps and its
events, and the assistant had none of them. A second source of truth also grew: the reads of the
assistant were a closed list in code, while the tools of every other agent are declared in a
definition.

## 2. Decision

The assistant is an agent of a workflow of its own.

- `assistance` is a workflow definition like `requirements_engineering`: one agent role
  (`assistant`), one stage (`guidance`), the graph `start -> assistant -> end`, its tools declared
  in `tools`, and `max_reads` among its run parameters.
- A message that the assistant answers has a run of this workflow. The run is finished when the
  request answers: it has one step, whose notes are the reads that were made, with the usage and
  the cost of the answer, and the events a stream would have sent. A client reads it like any run.
- A message about the work still starts a run of `requirements_engineering`, and a message that
  arrives while that run is unfinished still waits for it as `pending`. The assistant only decides
  which of the two a message is; the intent router still takes every message that enters the
  requirements workflow.

Options that were not taken: the assistant as a node in the graph of `requirements_engineering`
(a question sent during a run would wait for a safe point instead of being answered at once), and
a function with no run (nothing for a client to show).

## 3. The interface

Two things are common to every workflow, and one thing is the workflow's own.

| | Common (abstract) | The workflow's own (concrete) |
|---|---|---|
| What it is | `Workflow`: its name, its current version and the definition it serves for any version | The module of its definition and its agents |
| Where | `agents/workflows.py` | `agents/requirements_engineering/`, `agents/assistance/` |
| Executing a run | none: the way a run executes is the workflow's own | `RunWalker` walks a graph in the background and may pause at a review; `AssistanceRecorder` answers in the request and ends the run |

A thread holds at most one unfinished run of each workflow (`queued`, `running` or `interrupted`):
the database refuses a second one. The unfinished run that a message waits for is the one of the
workflow that takes it, and the `active_run_id` that a thread shows is its unfinished run of the
main workflow. A run of `assistance` is over before the request answers, so it is never unfinished.

One workflow is the main workflow of a thread, `MAIN_WORKFLOW` in the registry, which is
`requirements_engineering`: the status of the thread is the status of its latest run of that
workflow, and the chat follows the latest run of it. A run of another workflow is a run of the
thread to show, and it changes none of these.

A registry maps the name of a workflow to its `Workflow`. The endpoint that serves a definition
reads it (`GET /workflow/definition?name=`, the name defaulting to `requirements_engineering`), and
the runs of a thread are listed by workflow (`GET /threads/{id}/runs?workflow=`). A new workflow is a definition file, a `Workflow`
and one line in the registry.

## 4. A message, step by step

1. The assistant reads the project and the message and decides `workflow` or `general`. It may
   read first, as many times as `max_reads` allows. Each read is a call of the model.
2. `workflow`: the message starts a run of `requirements_engineering` or waits in the run that
   is unfinished, exactly as before. The cost of the decision is kept as it was.
3. `general`: the recorder writes a run of `assistance` that is already finished: the user message
   and the answer are messages of that run, the step holds one note of kind `tool` for each read
   (named by a tool of the definition), the usage and the cost are those of the step, and the
   references of the answer name what was read. The response is `{message, run, assistant}`, where
   `run` is that run and `assistant` carries the words and the commands, which are for the client to
   run once and are not kept.

## 5. The client

- A run names its workflow (`workflow_name`, `workflow_version`). The client loads the definition
  of that workflow and version, so the title of a stage, the words of a tool use and the name of
  a role of an assistance run come from `assistance`, not from the requirements definition.
- The chat lists the runs of a thread in order, so an answered message is a run among the others,
  drawn by the same entries: the message, the phase `Guidance` with the acts around the face of the
  agent, the uses of its tools and its answer.
- What the chat follows live, its prompt and its progress bar use the latest run of the main workflow, which it asks for with `?workflow=requirements_engineering`.

## 6. What changes for what exists

- `assistant_turns` keeps the cost of the messages that were decided `workflow`: they have no run.
  The cost of an answered message is in its step.
- The reads of the assistant are declared in `assistance.v1.json`; the code checks that the reads
  it makes and the names the model may give are the declared ones.
- `definition.schema.json` no longer asks for artifact kinds, item kinds or link types, since a
  workflow that writes no documents has none.
