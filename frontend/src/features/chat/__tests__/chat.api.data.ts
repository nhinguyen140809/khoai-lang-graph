import { HttpResponse } from 'msw'
import { ZodError } from 'zod'

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
