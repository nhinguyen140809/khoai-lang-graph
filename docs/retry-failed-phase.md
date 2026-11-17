# Retry a failed phase

Working note, not committed. It records what the chat needs from the API to run a failed phase of work again, what already exists on each layer, and what the backend still has to do.

## What the user sees

A phase of work that failed ends with its failure line. Under that line a "Try again" button starts a new run from the step that failed. The steps before it are not run again. The button shows only when the run has ended (a run starts only when no other run works) and a step of the phase failed.

## The endpoint

`POST /api/v1/runs/{run_id}/retry`

- Headers: `Idempotency-Key` (a new key for each click, so sending the same request again starts no second run), and the usual origin check.
- Body: `{ "from_step_id": "<uuid>" }`. The id of the first step with status `failed` in the phase. No other field is allowed.
- 202: the new run, with `retry_of_run_id` set to `run_id`, status `queued`, and `current_stage` of the step.
- 409 `run_already_active`: the project has a run that is running or waiting. The chat says that another run works.
- 422 `validation_failed`, field `from_step_id`: not a step of this run.
- Budget: the call is refused as for any new run when the budget is spent.

The new run resolves its settings when it starts, so the settings saved since the failed run apply to it.

## What exists on each layer

| Layer | State |
| --- | --- |
| Backend route | Done: `features/runs/router.py`, `retry_run`. It creates the run with `retry_of_run_id` and `input.retry_from_step_id`, and starts the job. |
| Backend executor | Done on `feat/be/agent-improvements`: `_retried_state` of `features/runs/executor.py` restores the state saved after the step before the one to retry and walks on from it. |
| Endpoint registry | Done: `apiEndpoints.runRetry`. |
| API function | Done: `retryRun(runId, fromStepId, idempotencyKey)` in `modules/run/entities/runs/runs.api.ts`. |
| Mock | Done: `runs.handlers.ts` answers it (`201` where the backend answers `202`; both are read as success). |
| Feature | Done: `modules/run/features/retry` with `useRetryRun`, `RetryRunButton` and `retryableStep`. |
| Chat | Done: `FailureEntryView` shows the button. |

## Checked against the backend

Run with `scripts/serve_demo.py` (the scripted model) on `feat/be/agent-improvements`, with the chat in front of it. The last step of a finished run was set to `failed` in the dev database, so the chat showed its failure line and "Try again". One click sent `POST /runs/{id}/retry` (202). The new run, number 2, had one step, the validator, took the state saved after the step before it, and ended `succeeded`; the steps before were not run again. The chat showed it as a new run under a separator, with the run bar at "Done".

## Still open

- A retry from a run that a newer run has followed. The route allows it. The chat now hides the button for such a run, so the user cannot start it from the page. If the rule belongs to the API, the route can answer 409 for a run that is not the latest of its thread.
- The status of the failed run stays `failed`. The new run points at it with `retry_of_run_id`, which the chat can use to show "retry of run N".
