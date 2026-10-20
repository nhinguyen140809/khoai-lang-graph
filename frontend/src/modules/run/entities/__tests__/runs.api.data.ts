import { HttpResponse } from 'msw'
import { ZodError } from 'zod'

import { IdPrefix, mockId, RUN_IDS, THREAD_IDS } from '@/mocks/shared/mock-ids.constants'

import { getLatestRun } from '../runs.api'

/** A read of the runs API, what the test keeps of it, and what the mock data gives. */
export const readCases = [
  {
    name: 'the latest run of a thread',
    read: async () => (await getLatestRun(THREAD_IDS.mentorMain))?.id,
    expected: RUN_IDS.mentorMain3,
  },
  {
    name: 'no run for a thread before its first run',
    // The thread of the project that has no run yet.
    read: () => getLatestRun(mockId(IdPrefix.Thread, 12)),
    expected: null,
  },
]

/** An answer of POST /threads/{thread_id}/runs, and the error that createRun throws for it. */
export const failedRunCases = [
  { name: 'a conflict', answer: () => new HttpResponse(null, { status: 409 }), error: 'HTTP 409' },
  {
    name: 'a server error',
    answer: () => new HttpResponse(null, { status: 500 }),
    error: 'HTTP 500',
  },
  { name: 'an answer without the run id', answer: () => HttpResponse.json({}), error: ZodError },
]
