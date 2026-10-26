import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { getMe } from '../user.api'

/** A call of the user API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the signed-in user',
    call: () => getMe(),
    request: { method: 'GET', path: apiEndpoints.me.path(), body: null },
  },
]

/** A call of the user API, the handler that refuses it, and the message of the error. */
export const refusedCallCases = [
  {
    name: 'a failed read of the user',
    refuse: () => http.get('/api/v1/me', () => new HttpResponse(null, { status: 500 })),
    call: () => getMe(),
    error: { status: 500, code: null, message: 'Failed to load your account (HTTP 500)' },
  },
]
