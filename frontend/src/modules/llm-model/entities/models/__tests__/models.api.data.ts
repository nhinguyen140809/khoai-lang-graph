import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { listModels } from '../models.api'

/** A call of the catalog API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'lists the models in the largest pages',
    call: () => listModels(),
    request: { method: 'GET', path: `${apiEndpoints.models.path()}?limit=200`, body: null },
  },
] satisfies SentRequestCase[]

/** A call of the catalog API, the handler that refuses it, and the message of the error. */
export const apiErrorCases = [
  {
    name: 'a failed read of the models',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.models.path()),
    call: () => listModels(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load the models (HTTP 500)',
    },
  },
]
