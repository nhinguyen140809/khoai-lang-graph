import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

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

/** A request to a run endpoint that the mock server refuses. */
export const runErrorCases = [
  {
    name: 'refuses to read the runs of a thread in the error scenario',
    method: HttpMethod.Get,
    path: apiEndpoints.threadRuns.path({ threadId: threadIds.mentorMain }),
    page: '/?mock-runs=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'refuses to read a run that does not exist',
    method: HttpMethod.Get,
    path: apiEndpoints.run.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses to read the steps of a run that does not exist',
    method: HttpMethod.Get,
    path: apiEndpoints.runSteps.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses to stop a run that does not exist',
    method: HttpMethod.Post,
    path: apiEndpoints.runCancel.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses to stop a run in the error scenario',
    method: HttpMethod.Post,
    path: apiEndpoints.runCancel.path({ runId: runIds.mentorMain3 }),
    page: '/?mock-cancel-run=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'refuses to stop a run that succeeded',
    method: HttpMethod.Post,
    path: apiEndpoints.runCancel.path({ runId: runIds.mentorMain1 }),
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'refuses to stop a run that failed',
    method: HttpMethod.Post,
    path: apiEndpoints.runCancel.path({ runId: runIds.mentorMain2 }),
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
] satisfies RejectedRequestCase[]

/** A request to retry a run that the mock server refuses. */
export const refusedRetryCases = [
  {
    name: 'refuses to retry a run that does not exist',
    method: HttpMethod.Post,
    path: apiEndpoints.runRetry.path({ runId: 'no-such-run' }),
    body: { from_step_id: 'step' },
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses to retry without a step',
    method: HttpMethod.Post,
    path: apiEndpoints.runRetry.path({ runId: runIds.mentorMain2 }),
    body: {},
    page: '/?mock-run-status=done',
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
  {
    name: 'refuses to retry from a step that is not of the run',
    method: HttpMethod.Post,
    path: apiEndpoints.runRetry.path({ runId: runIds.mentorMain2 }),
    body: { from_step_id: 'no-such-step' },
    page: '/?mock-run-status=done',
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed' },
  },
] satisfies RejectedRequestCase[]
