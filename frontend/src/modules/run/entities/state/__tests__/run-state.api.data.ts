import { runIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { SentRequestCase } from '@/test/suites'

import { getCurrentRunState, getRunStateAfterStep } from '../run-state.api'

/** A call of the state API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the current state of a run',
    call: () => getCurrentRunState(runIds.mentorMain3),
    request: {
      method: 'GET',
      path: apiEndpoints.runState.path({ runId: runIds.mentorMain3 }),
      body: null,
    },
  },
  {
    name: 'reads the state after a step, its id encoded',
    call: () => getRunStateAfterStep(runIds.mentorMain3, 'step 1'),
    request: {
      method: 'GET',
      path: apiEndpoints.runStepState.path({ runId: runIds.mentorMain3, stepId: 'step 1' }),
      body: null,
    },
  },
] satisfies SentRequestCase[]
