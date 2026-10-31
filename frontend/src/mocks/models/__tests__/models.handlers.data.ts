import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

/** A request to the catalog that the mock server refuses. */
export const rejectedCases: RejectedRequestCase[] = [
  {
    name: 'answers 500 in the error scenario',
    method: 'GET',
    path: apiEndpoints.models.path(),
    page: '/?mock-models=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]
