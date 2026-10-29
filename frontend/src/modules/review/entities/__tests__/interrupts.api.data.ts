import { runIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader } from '@/shared/api/http'
import type { SentRequestCase } from '@/test/suites'

import { findPendingInterrupt, listRunInterrupts, resumeRun } from '../interrupts.api'

// The body of a request that answers the pending interrupt of a run.
const answerBody = {
  interrupt_id: 'interrupt 1',
  option: 'accept',
  feedback: null,
  answers: {},
  modified_items: [],
}

/** A call of the interrupts API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the first page of the interrupts of a run',
    call: () => listRunInterrupts('run 1', null, 100),
    request: {
      method: 'GET',
      path: `${apiEndpoints.runInterrupts.path({ runId: 'run 1' })}?limit=100`,
      body: null,
    },
  },
  {
    name: 'reads the page after a cursor',
    call: () => listRunInterrupts(runIds.mentorMain3, 'next', 10),
    request: {
      method: 'GET',
      path: `${apiEndpoints.runInterrupts.path({ runId: runIds.mentorMain3 })}?limit=10&cursor=next`,
      body: null,
    },
  },
  {
    name: 'reads the interrupts of one status',
    call: () => listRunInterrupts('run 1', null, 100, { status: 'pending' }),
    request: {
      method: 'GET',
      path: `${apiEndpoints.runInterrupts.path({ runId: 'run 1' })}?status=pending&limit=100`,
      body: null,
    },
  },
  {
    name: 'reads the interrupt that the run waits for as a page of one',
    call: () => findPendingInterrupt('run 1'),
    request: {
      method: 'GET',
      path: `${apiEndpoints.runInterrupts.path({ runId: 'run 1' })}?status=pending&limit=1`,
      body: null,
    },
  },
  {
    name: 'answers the review with its body and the idempotency key',
    call: () => resumeRun('run 1', answerBody, 'answer-key'),
    request: {
      method: 'POST',
      path: apiEndpoints.runResume.path({ runId: 'run 1' }),
      body: answerBody,
      headers: { [HttpHeader.IdempotencyKey]: 'answer-key' },
    },
  },
] satisfies SentRequestCase[]
