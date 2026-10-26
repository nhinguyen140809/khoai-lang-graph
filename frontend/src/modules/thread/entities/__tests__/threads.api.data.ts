import { HttpResponse } from 'msw'
import { ZodError } from 'zod'

import { HttpStatus } from '@/shared/api/http'
import { serverError } from '@/test/msw'

/** An answer of GET /threads, and the error that listThreads throws for it. */
export const failedListCases = [
  {
    name: 'an HTTP error',
    answer: () => serverError(),
    error: 'HTTP 500',
  },
  {
    name: 'an answer that does not match the schema',
    answer: () => HttpResponse.json({ items: [{ id: 1 }] }),
    error: ZodError,
  },
  {
    name: 'an answer that is not JSON',
    answer: () => new HttpResponse('not json', { status: HttpStatus.Ok }),
    error: SyntaxError,
  },
]

/** The answer of POST /projects/{project_id}/threads. */
export const createdThread = { id: 't1' }

/** The answer of POST /threads/{thread_id}/messages. */
export const sentMessage = { message: { id: 'm1' }, run: { id: 'r1' } }
