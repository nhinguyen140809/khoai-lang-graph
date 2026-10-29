import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { runIds } from '../../../shared/db'
import { runStepFixtures } from '../../fixtures/runs.fixtures'

const [firstStep] = runStepFixtures(runIds.mentorMain3, 'waiting')

/** The id of the first step of the run of the API examples. */
export const firstStepId = firstStep?.id ?? ''

/** A stage of the run, the state after the step of that stage, and what the state lists. */
export const stepStateCases = [
  {
    name: 'the planning step: no personas yet',
    stepSequence: 1,
    stage: 'planning',
    listed: { personas: 0 },
  },
  {
    name: 'a step of the interviews: the personas exist',
    stepSequence: 10,
    stage: 'interviewing',
    listed: { personas: 3 },
  },
]

/** A request that the state endpoints refuse. */
export const refusedRunStateCases = [
  {
    name: 'refuses the state of a run that does not exist',
    method: HttpMethod.Get,
    path: apiEndpoints.runState.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses the state after a step of a run that does not exist',
    method: HttpMethod.Get,
    path: apiEndpoints.runStepState.path({ runId: 'no-such-run', stepId: firstStepId }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'refuses the state after a step that the run does not have',
    method: HttpMethod.Get,
    path: apiEndpoints.runStepState.path({ runId: runIds.mentorMain3, stepId: 'no-such-step' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'fails in the error scenario',
    method: HttpMethod.Get,
    path: apiEndpoints.runState.path({ runId: runIds.mentorMain3 }),
    page: '/?mock-run-state=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
] satisfies RejectedRequestCase[]
