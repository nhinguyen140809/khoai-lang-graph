import { HttpResponse } from 'msw'
import { ZodError } from 'zod'

import { PROJECT_IDS, THREAD_IDS } from '@/mocks/shared/mock-ids.constants'

import { listProjectThreads } from '../threads.api'

/** A read of the threads API, what the test keeps of it, and what the mock data gives. */
export const readCases = [
  {
    name: 'the threads of a project',
    read: async () => (await listProjectThreads(PROJECT_IDS.mentor)).map(({ id }) => id),
    expected: [THREAD_IDS.mentorMain, THREAD_IDS.mentorPricing],
  },
]

/** An answer of GET /projects/{project_id}/threads, and the error that listProjectThreads throws for it. */
export const failedListCases = [
  {
    name: 'an HTTP error',
    answer: () => new HttpResponse(null, { status: 500 }),
    error: 'Failed to load the threads (HTTP 500)',
  },
  {
    name: 'an answer that does not match the schema',
    answer: () => HttpResponse.json({ items: [{ id: 1 }], next_cursor: null }),
    error: ZodError,
  },
  {
    name: 'an answer that is not JSON',
    answer: () => new HttpResponse('not json', { status: 200 }),
    error: SyntaxError,
  },
]
