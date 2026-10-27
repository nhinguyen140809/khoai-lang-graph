import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

/** The reads of the kinds and of a content schema that find nothing. */
export const schemaRejectedCases: RejectedRequestCase[] = [
  {
    name: 'finds no kinds at another workflow version',
    method: 'GET',
    path: `${apiEndpoints.artifactKinds.path()}?workflow_version=2`,
    status: HttpStatus.NotFound,
  },
  {
    name: 'finds no content schema for another version',
    method: 'GET',
    path: apiEndpoints.contentSchema.path({ kind: 'persona', version: '2' }),
    status: HttpStatus.NotFound,
  },
  {
    name: 'finds no content schema for another kind',
    method: 'GET',
    path: apiEndpoints.contentSchema.path({ kind: 'nothing', version: '1' }),
    status: HttpStatus.NotFound,
  },
]
