import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

/** The reads of the workflow definition that find nothing, or fail. */
export const definitionRejectedCases: RejectedRequestCase[] = [
  {
    name: 'finds no definition at another version',
    method: HttpMethod.Get,
    path: `${apiEndpoints.workflowDefinition.path()}?version=2`,
    status: HttpStatus.NotFound,
  },
  {
    name: 'fails in the error scenario',
    method: HttpMethod.Get,
    path: apiEndpoints.workflowDefinition.path(),
    page: '/?mock-workflow=error',
    status: HttpStatus.InternalServerError,
  },
]
