import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { runIds } from '../../../shared/db'

/** A request that the directives endpoint refuses. */
export const refusedDirectiveCases = [
  {
    name: 'refuses the directives of a run that does not exist',
    method: HttpMethod.Get,
    path: apiEndpoints.runDirectives.path({ runId: 'no-such-run' }),
    status: HttpStatus.NotFound,
    answer: { code: 'not_found' },
  },
  {
    name: 'fails in the error scenario',
    method: HttpMethod.Get,
    path: apiEndpoints.runDirectives.path({ runId: runIds.mentorMain1 }),
    page: '/?mock-directives=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
] satisfies RejectedRequestCase[]
