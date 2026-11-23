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
  (`assistant`), one stage (`lookup`, shown to the user as "Checking the project"), the graph `start -> assistant -> end`, its tools declared
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

Two requests of one thread may write runs at the same moment, so the database holds the rules and
the code does not trust what it read a moment before:

- A unique index on `(thread_id, workflow_name)` for the runs that are `queued`, `running` or
  `interrupted` refuses a second unfinished run of a workflow. The request that loses the race
  gets the winner back and its message waits in that run as `pending`, as it would have if it had
  come after; it does not fail. The same holds when a run ends and starts the run that its pending
  messages wait for, while a request has started one: those messages wait for that run.
- A unique index on `(thread_id, number)` keeps the order of the runs. A run that finds its number
  taken is written again with the next one, up to five times.
- A unique index on `(thread_id, sequence)` keeps the order of the messages. A message that finds
  its sequence taken, whether it is a message of the user, an answer of the assistant or the report
  of an agent, is written again with the next one.
- Starting a run again after a failure answers `409 run_already_active` when the thread already has an
  unfinished run of that workflow, also when another request started it a moment after the check.

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
   read first: the reads that do not depend on each other are asked for in one step, and `max_reads`
   counts them all. A step is a call of the model.
2. `workflow`: the message starts a run of `requirements_engineering` or waits in the run that
   is unfinished, exactly as before. The cost of the decision is kept as it was.
3. `general`: the recorder writes a run of `assistance` that is already finished: the user message
   and the answer are messages of that run, the step holds one note of kind `tool` for each read
   (named by a tool of the definition), the usage and the cost are those of the step, and the
   references of the answer name what was read. The response is `{message, run, commands}`, where
   `run` is that run and `commands` are the UI commands for the client to run once, which are not
   kept. The words of the answer are the message of that run that the thread lists, and the response
   does not repeat them.

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

## 7. Answering in the background

Today the request that sends a message waits for the whole answer, which is one call of the model
for each read, so the Send button turns for as long as the assistant works, and the client cannot
tell sending a message from the assistant working on it.

### Rules

- Sending stores the message and ends. The request answers `201 {message, run, commands}` at once,
  where `run` is a run of `assistance` with status `running` and `commands` is empty.
- The assistant works as a job of the server, not of the request: a task of the server's event
  loop with a session of its own, which calls the model off the loop. A server that stops while it
  works fails the run with `server_restarted`, as it does for any run.
- The job writes what the recorder writes today, but into the run that exists: its one step is
  `running` from the start, a note of kind `tool` is written, and committed, as each call of a tool
  begins, so a client that follows the run sees the calls while they happen, and when the answer is
  ready the job writes the answer as a message of the run and sets `status = succeeded`.
- The UI commands of an answer are part of the answer message, as `commands`, so that a client that
  was not connected when the answer came can still read them. They are run once by the client that
  saw the run end, never by one that loads the thread later.
- A message that the assistant decides `workflow` is handled as before after the decision: it
  starts a run of `requirements_engineering` or waits as `pending` in the one that is unfinished.
  The run of `assistance` made for it is removed, since it has no answer to show.

### What each side does

- Backend: the route of a message stops calling `decide`; the job calls it. The recorder splits in
  a start (creates the running run) and a finish (steps, notes, answer, `succeeded`). The message
  gets `commands`. Sending twice before the first answer ends is allowed: each message has its own
  run of `assistance`, and the rule of one unfinished run per workflow of a thread is lifted for
  `assistance`, since its runs do not wait for each other.
- Frontend: Send is pending only while the message is stored. The chat follows the run of
  `assistance` as it follows any run, and shows the line of the agent working until it succeeds.
  When it succeeds, the answer message is read and its commands are run once.

### Decided

- The run of `assistance` made for a message that turns out to be `workflow` is removed.
- A thread has one unfinished run of `assistance` at a time, as it has one of the main workflow. A
  message that comes while it works is stored as `pending` in that run, and the assistant takes it
  in at its next step, as a `<new_message>` that it reads with the first and answers in one reply
  (it is then `delivered` in that step). When the assistant decides `workflow`, all the messages of
  the turn go to the main workflow, in the order they came. A message that comes after the last step
  has no step to be read in: it waits, and the job answers it in a run of its own when the run ends.

### The limit of reads

The definition is a graph of one node, `assistant`, and the loop of reads runs inside that node as
steps that the code drives, so the limit `max_reads` is the only brake of that loop: each read is a
call of the model, which costs seconds and money, and no gate of the run counts it. When the answer
runs as a job of the server it should be walked like any run, with the cost and step limits of its
run configuration (`max_cost_usd`, `max_steps`) doing that work, and `max_reads` left as a plain
parameter of the definition with a higher default. That is not built yet.
