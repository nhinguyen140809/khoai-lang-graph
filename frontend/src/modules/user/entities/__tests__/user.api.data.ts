import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { getMe } from '../user.api'

/** A call of the user API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the signed-in user',
    call: () => getMe(),
    request: { method: 'GET', path: apiEndpoints.me.path(), body: null },
  },
] satisfies SentRequestCase[]

/** A call of the user API, the handler that refuses it, and the message of the error. */
export const apiErrorCases = [
  {
    name: 'a failed read of the user',
    refuse: () => serverErrorOn(HttpMethod.Get, apiEndpoints.me.path()),
    call: () => getMe(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load your account (HTTP 500)',
    },
  },
]
