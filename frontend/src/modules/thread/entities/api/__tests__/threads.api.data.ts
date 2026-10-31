import { HttpResponse } from 'msw'
import { ZodError } from 'zod'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { buildThread } from '@/mocks/threads/threads.fixtures'
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

/** The answer of POST /projects/{project_id}/threads, as the schema of a thread reads it. */
export const createdThread = buildThread({ id: 't1', project_id: 'p1' })

/** The answer of POST /threads/{thread_id}/messages, as the schema of a sent message reads it. */
export const sentMessage = {
  message: {
    id: 'm1',
    thread_id: 't1',
    sequence: 1,
    run_id: 'r1',
    author: 'user',
    agent_role: null,
    content: 'An idea',
    artifact_refs: [],
    item_refs: [],
    delivery: 'started_run',
    delivered_in_step_id: null,
    created_at: '2026-10-01T09:00:00Z',
  },
  run: buildRun({ id: 'r1', thread_id: 't1', project_id: 'p1', number: 1 }),
}
