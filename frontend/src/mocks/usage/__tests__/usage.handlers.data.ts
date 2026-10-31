import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

const path = apiEndpoints.usage.path()

/** A request for the usage that the mock server refuses. */
export const rejectedCases: RejectedRequestCase[] = [
  {
    name: 'answers 400 for a month that is not YYYY-MM',
    method: 'GET',
    path: `${path}?month=2026-13`,
    status: HttpStatus.BadRequest,
    answer: { code: 'invalid_request' },
  },
  {
    name: 'answers 400 for a grouping out of the list',
    method: 'GET',
    path: `${path}?group_by=week`,
    status: HttpStatus.BadRequest,
    answer: { code: 'invalid_request' },
  },
  {
    name: 'answers 500 in the error scenario',
    method: 'GET',
    path,
    page: '/?mock-usage=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]
