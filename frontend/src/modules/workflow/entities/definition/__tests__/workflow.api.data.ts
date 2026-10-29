import { http } from 'msw'

import { emptyResponse } from '@/mocks/shared/http/response'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { getWorkflowDefinition } from '../workflow.api'

/** A call of the workflow API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the current workflow definition',
    call: () => getWorkflowDefinition(),
    request: { method: 'GET', path: apiEndpoints.workflowDefinition.path(), body: null },
  },
  {
    name: 'reads the workflow definition at a version',
    call: () => getWorkflowDefinition(1),
    request: {
      method: 'GET',
      path: `${apiEndpoints.workflowDefinition.path()}?version=1`,
      body: null,
    },
  },
] satisfies SentRequestCase[]

/** A call, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the workflow definition',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.workflowDefinition.path()),
    call: () => getWorkflowDefinition(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load the workflow (HTTP 500)',
    },
  },
  {
    name: 'a version that does not exist',
    refuse: () =>
      http.get(apiEndpoints.workflowDefinition.pattern, () => emptyResponse(HttpStatus.NotFound)),
    call: () => getWorkflowDefinition(9),
    error: {
      status: HttpStatus.NotFound,
      code: null,
      message: 'Failed to load the workflow (HTTP 404)',
    },
  },
]
