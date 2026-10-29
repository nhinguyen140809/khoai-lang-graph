import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'

import { runIds, threadIds } from '../../../shared/db'

/** GET /threads/{thread_id}/runs in the scenario of the page address: the runs it lists. */
export const runListCases = [
  {
    name: 'the runs of a thread, the latest first',
    address: '/',
    threadId: threadIds.mentorMain,
    runs: [
      { number: 3, status: 'interrupted' },
      { number: 2, status: 'failed' },
      { number: 1, status: 'succeeded' },
    ],
  },
  { name: 'no run for a thread without one', address: '/', threadId: 'no-such-thread', runs: [] },
  {
    name: 'no run in the empty scenario',
    address: '/?mock-runs=empty',
    threadId: threadIds.mentorMain,
    runs: [],
  },
]

/** A state of the run of the API examples, and what GET /runs/{run_id} answers in it. */
export const runStatusScenarioCases = [
  { state: 'waiting', status: 'interrupted', stepCount: 67, finished: false },
  { state: 'running', status: 'running', stepCount: 66, finished: false },
  { state: 'failed', status: 'failed', stepCount: 66, finished: true },
  { state: 'done', status: 'succeeded', stepCount: 71, finished: true },
]

/** The states of the run of the API examples in which it has not ended. */
export const unfinishedRunStates = ['waiting', 'running']

/** A request in the scenario of the page address, and the error it answers. */
export const runErrorCases = [
  {
    request: 'GET /threads/{thread_id}/runs in the error scenario',
    address: '/?mock-runs=error',
    method: 'GET',
    path: apiEndpoints.threadRuns.path({ threadId: threadIds.mentorMain }),
    status: HttpStatus.InternalServerError,
    code: 'internal_error',
  },
  {
    request: 'GET /runs/{run_id} of a run that does not exist',
    address: '/',
    method: 'GET',
    path: apiEndpoints.run.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    code: 'not_found',
  },
  {
    request: 'GET /runs/{run_id}/steps of a run that does not exist',
    address: '/',
    method: 'GET',
    path: apiEndpoints.runSteps.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    code: 'not_found',
  },
  {
    request: 'POST /runs/{run_id}/cancel of a run that does not exist',
    address: '/',
    method: 'POST',
    path: apiEndpoints.runCancel.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    code: 'not_found',
  },
  {
    request: 'POST /runs/{run_id}/cancel of a run that succeeded',
    address: '/',
    method: 'POST',
    path: apiEndpoints.runCancel.path({ runId: runIds.mentorMain1 }),
    status: HttpStatus.Conflict,
    code: 'invalid_state',
  },
  {
    request: 'POST /runs/{run_id}/cancel of a run that failed',
    address: '/',
    method: 'POST',
    path: apiEndpoints.runCancel.path({ runId: runIds.mentorMain2 }),
    status: HttpStatus.Conflict,
    code: 'invalid_state',
  },
]

/** A request to retry a run that the mock server refuses. */
export const refusedRetryCases = [
  {
    request: 'POST /runs/{run_id}/retry of a run that does not exist',
    address: '/',
    path: apiEndpoints.runRetry.path({ runId: 'no-such-run' }),
    body: { from_step_id: 'step' },
    status: HttpStatus.NotFound,
    code: 'not_found',
  },
  {
    request: 'POST /runs/{run_id}/retry without a step',
    address: '/?mock-run-status=done',
    path: apiEndpoints.runRetry.path({ runId: runIds.mentorMain2 }),
    body: {},
    status: HttpStatus.UnprocessableContent,
    code: 'validation_failed',
  },
  {
    request: 'POST /runs/{run_id}/retry from a step that is not of the run',
    address: '/?mock-run-status=done',
    path: apiEndpoints.runRetry.path({ runId: runIds.mentorMain2 }),
    body: { from_step_id: 'no-such-step' },
    status: HttpStatus.UnprocessableContent,
    code: 'validation_failed',
  },
]
