import { HttpResponse } from 'msw'

import { runIds, threadIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'
import type { SentRequestCase } from '@/test/suites'

import { cancelRun, findLatestRun, getRun, listThreadRuns, retryRun } from '../runs.api'

/** A call of the run API, and the request it sends. */
export const sentRunRequestCases = [
  {
    name: 'reads a page of the runs of a thread, with the cursor',
    call: () => listThreadRuns('thread 1', 'next', 20),
    request: {
      method: 'GET',
      path: `${apiEndpoints.threadRuns.path({ threadId: 'thread 1' })}?limit=20&cursor=next`,
      body: null,
    },
  },
  {
    name: 'reads the newest run of a thread as a page of one',
    call: () => findLatestRun('thread 1'),
    request: {
      method: 'GET',
      path: `${apiEndpoints.threadRuns.path({ threadId: 'thread 1' })}?limit=1`,
      body: null,
    },
  },
  {
    name: 'reads a run by its id, encoded',
    call: () => getRun('run 1'),
    request: { method: 'GET', path: apiEndpoints.run.path({ runId: 'run 1' }), body: null },
  },
  {
    name: 'stops a run with a POST that has no body',
    call: () => cancelRun(runIds.mentorMain3),
    request: {
      method: 'POST',
      path: apiEndpoints.runCancel.path({ runId: runIds.mentorMain3 }),
      body: null,
    },
  },
  {
    name: 'retries a run from a step, with the idempotency key',
    call: () => retryRun(runIds.mentorMain2, 'step-1', 'retry-key'),
    request: {
      method: 'POST',
      path: apiEndpoints.runRetry.path({ runId: runIds.mentorMain2 }),
      body: { from_step_id: 'step-1' },
      headers: { [HttpHeader.IdempotencyKey]: 'retry-key' },
    },
  },
] satisfies SentRequestCase[]

/** A thread, and the runs that it holds, the newest first. */
export const threadRunCases = [
  { name: 'a thread with three runs', threadId: threadIds.mentorMain, numbers: [3, 2, 1] },
  { name: 'a thread with one run', threadId: threadIds.campusMain, numbers: [1] },
]

/** An answer of GET /threads/{thread_id}/runs for a thread without a run. */
export const emptyRunPageAnswer = () => HttpResponse.json({ items: [], next_cursor: null })
