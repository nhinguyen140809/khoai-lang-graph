import { runIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { SentRequestCase } from '@/test/suites'

import { listRunSteps } from '../run-steps.api'

/** A call of the steps API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the first page of the steps of a run',
    call: () => listRunSteps('run 1', null, 200),
    request: {
      method: 'GET',
      path: `${apiEndpoints.runSteps.path({ runId: 'run 1' })}?limit=200`,
      body: null,
    },
  },
  {
    name: 'reads the page after a cursor',
    call: () => listRunSteps(runIds.mentorMain3, 'next', 50),
    request: {
      method: 'GET',
      path: `${apiEndpoints.runSteps.path({ runId: runIds.mentorMain3 })}?limit=50&cursor=next`,
      body: null,
    },
  },
] satisfies SentRequestCase[]
