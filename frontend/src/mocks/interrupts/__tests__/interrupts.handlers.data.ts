import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { assertPresent } from '@/shared/lib/guards'
import type { RejectedRequestCase } from '@/test/suites'

import { findRun } from '../../runs/lookup/runs.lookup'
import { runIds } from '../../shared/db'
import { pendingInterruptOf } from '../interrupts.lookup'

// The id of the interrupt that run 3 of the mentor thread waits for, in the fixtures. It is the
// same in every scenario of the page address: the id comes from the step, not from what it asks.
function pendingInterruptId(): string {
  const run = assertPresent(findRun(runIds.mentorMain3), 'The mock data holds run 3.')
  return assertPresent(pendingInterruptOf(run), 'Run 3 waits for a review.').id
}

// The body of the answer of the API example: the option that asks for feedback.
function answerBody(option: string | null, changes: Record<string, unknown> = {}) {
  return {
    interrupt_id: pendingInterruptId(),
    option,
    feedback: null,
    answers: {},
    modified_items: [],
    ...changes,
  }
}

/** A request to the endpoints of the interrupts that the mock server refuses. */
export const refusedRequestCases = [
  {
    name: 'the interrupts of a run that does not exist',
    method: HttpMethod.Get,
    path: apiEndpoints.runInterrupts.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'an answer for a run that does not exist',
    method: HttpMethod.Post,
    path: apiEndpoints.runResume.path({ runId: 'no-such-run' }),
    body: answerBody('accept'),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'an answer for a run that waits for nothing',
    method: HttpMethod.Post,
    path: apiEndpoints.runResume.path({ runId: runIds.mentorMain1 }),
    body: answerBody('accept'),
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'an answer for another interrupt than the one the run waits for',
    method: HttpMethod.Post,
    path: apiEndpoints.runResume.path({ runId: runIds.mentorMain3 }),
    body: answerBody('accept', { interrupt_id: 'another-interrupt' }),
    status: HttpStatus.Conflict,
    answer: { code: 'invalid_state' },
  },
  {
    name: 'an option that the review does not offer',
    method: HttpMethod.Post,
    path: apiEndpoints.runResume.path({ runId: runIds.mentorMain3 }),
    body: answerBody('unknown'),
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed', errors: [{ field: 'option' }] },
  },
  {
    name: 'a reject without the feedback it asks for',
    method: HttpMethod.Post,
    path: apiEndpoints.runResume.path({ runId: runIds.mentorMain3 }),
    body: answerBody('reject_reanalyse'),
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed', errors: [{ field: 'feedback' }] },
  },
  {
    name: 'a required question left unanswered, at its key',
    method: HttpMethod.Post,
    path: apiEndpoints.runResume.path({ runId: runIds.mentorMain3 }),
    page: '/?mock-agent-questions=only',
    body: answerBody(null, {
      answers: { payments: { choice_keys: ['no'], text: null, number: null } },
    }),
    status: HttpStatus.UnprocessableContent,
    answer: { code: 'validation_failed', errors: [{ field: 'answers.users' }] },
  },
  {
    name: 'the interrupts of a run in the error scenario',
    method: HttpMethod.Get,
    path: apiEndpoints.runInterrupts.path({ runId: runIds.mentorMain3 }),
    page: '/?mock-interrupts=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'an answer in the error scenario',
    method: HttpMethod.Post,
    path: apiEndpoints.runResume.path({ runId: runIds.mentorMain3 }),
    body: answerBody('accept'),
    page: '/?mock-resume-run=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
] satisfies RejectedRequestCase[]
