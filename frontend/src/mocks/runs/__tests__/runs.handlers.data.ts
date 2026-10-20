import { runIds, threadIds } from '../../shared/mock-ids.constants'

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
export const runStateCases = [
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
    path: `/api/v1/threads/${threadIds.mentorMain}/runs`,
    status: 500,
    code: 'internal_error',
  },
  {
    request: 'GET /runs/{run_id} of a run that does not exist',
    address: '/',
    method: 'GET',
    path: '/api/v1/runs/no-such-run',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'GET /runs/{run_id}/steps of a run that does not exist',
    address: '/',
    method: 'GET',
    path: '/api/v1/runs/no-such-run/steps',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'POST /runs/{run_id}/cancel of a run that does not exist',
    address: '/',
    method: 'POST',
    path: '/api/v1/runs/no-such-run/cancel',
    status: 404,
    code: 'not_found',
  },
  {
    request: 'POST /runs/{run_id}/cancel of a run that succeeded',
    address: '/',
    method: 'POST',
    path: `/api/v1/runs/${runIds.mentorMain1}/cancel`,
    status: 409,
    code: 'invalid_state',
  },
  {
    request: 'POST /runs/{run_id}/cancel of a run that failed',
    address: '/',
    method: 'POST',
    path: `/api/v1/runs/${runIds.mentorMain2}/cancel`,
    status: 409,
    code: 'invalid_state',
  },
]
