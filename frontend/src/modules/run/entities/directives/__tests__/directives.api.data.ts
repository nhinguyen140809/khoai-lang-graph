import { runIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import type { SentRequestCase } from '@/test/suites'

import { listRunDirectives } from '../directives.api'

/** A call of the directives API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the first page of the directives of a run',
    call: () => listRunDirectives('run 1', null, 100),
    request: {
      method: 'GET',
      path: `${apiEndpoints.runDirectives.path({ runId: 'run 1' })}?limit=100`,
      body: null,
    },
  },
  {
    name: 'reads the page after a cursor',
    call: () => listRunDirectives(runIds.mentorMain1, 'next', 10),
    request: {
      method: 'GET',
      path: `${apiEndpoints.runDirectives.path({ runId: runIds.mentorMain1 })}?limit=10&cursor=next`,
      body: null,
    },
  },
] satisfies SentRequestCase[]
