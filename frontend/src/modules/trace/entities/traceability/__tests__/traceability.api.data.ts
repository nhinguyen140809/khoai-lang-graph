import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { getTraceabilityCoverage, getTraceabilityMatrix } from '../traceability.api'

export const projectId = projectIds.mentor

/** A call of the traceability API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the matrix of a project',
    call: () => getTraceabilityMatrix(projectId),
    request: {
      method: 'GET',
      path: apiEndpoints.traceabilityMatrix.path({ projectId }),
      body: null,
    },
  },
  {
    name: 'reads the coverage of a project',
    call: () => getTraceabilityCoverage(projectId),
    request: {
      method: 'GET',
      path: apiEndpoints.traceabilityCoverage.path({ projectId }),
      body: null,
    },
  },
] satisfies SentRequestCase[]

/** A call, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the matrix',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.traceabilityMatrix.pattern),
    call: () => getTraceabilityMatrix(projectId),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load the traceability matrix (HTTP 500)',
    },
  },
  {
    name: 'a failed read of the coverage',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.traceabilityCoverage.pattern),
    call: () => getTraceabilityCoverage(projectId),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load the coverage (HTTP 500)',
    },
  },
]
