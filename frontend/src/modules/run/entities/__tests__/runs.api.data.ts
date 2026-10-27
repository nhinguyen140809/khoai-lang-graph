import { HttpResponse } from 'msw'
import { ZodError } from 'zod'

import { emptyResponse } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import { serverError } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { createRun } from '../runs.api'

/** An answer of POST /threads/{thread_id}/runs, and the error that createRun throws for it. */
export const failedRunCases = [
  { name: 'a conflict', answer: () => emptyResponse(HttpStatus.Conflict), error: 'HTTP 409' },
  {
    name: 'a server error',
    answer: () => serverError(),
    error: 'HTTP 500',
  },
  { name: 'an answer without the run id', answer: () => HttpResponse.json({}), error: ZodError },
]

/** A call of the run API, and the request it sends. */
export const sentRunRequestCases = [
  {
    name: 'sends the message as the input of a run of the thread, its id encoded',
    call: () => createRun('thread 1', 'hi'),
    request: {
      method: 'POST',
      path: apiEndpoints.threadRuns.path({ threadId: 'thread 1' }),
      body: { input: 'hi' },
    },
  },
] satisfies SentRequestCase[]
