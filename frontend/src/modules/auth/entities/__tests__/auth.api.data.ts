import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'

import { login, logout, register } from '../auth.api'

/** A call of the auth API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'sends the credentials to sign in',
    call: () => login({ email: 'linh.pham@example.com', password: 'secret' }),
    request: {
      method: 'POST',
      path: apiEndpoints.login.path(),
      body: { email: 'linh.pham@example.com', password: 'secret' },
    },
  },
  {
    name: 'sends the fields of a new account',
    call: () => register({ email: 'an@example.com', password: 'secret', display_name: 'An Tran' }),
    request: {
      method: 'POST',
      path: apiEndpoints.register.path(),
      body: { email: 'an@example.com', password: 'secret', display_name: 'An Tran' },
    },
  },
  {
    name: 'signs out without a body',
    call: () => logout(),
    request: { method: 'POST', path: apiEndpoints.logout.path(), body: null },
  },
]

/** A call of the auth API, the handler that refuses it, and the message of the error. */
export const refusedCallCases = [
  {
    name: 'a refused sign-in',
    refuse: () =>
      http.post(apiEndpoints.login.pattern, () =>
        HttpResponse.json({ status: 401, code: 'unauthenticated' }, { status: 401 }),
      ),
    call: () => login({ email: 'a@example.com', password: 'x' }),
    error: { status: 401, code: 'unauthenticated', message: 'Failed to sign in (HTTP 401)' },
  },
  {
    name: 'an email that has an account',
    refuse: () =>
      http.post(apiEndpoints.register.pattern, () =>
        HttpResponse.json({ status: 422, code: 'validation_failed' }, { status: 422 }),
      ),
    call: () => register({ email: 'a@example.com', password: 'x', display_name: 'A' }),
    error: { status: 422, message: 'Failed to create the account (HTTP 422)' },
  },
  {
    name: 'a failed sign-out',
    refuse: () =>
      http.post(apiEndpoints.logout.path(), () => new HttpResponse(null, { status: 500 })),
    call: () => logout(),
    error: { status: 500, code: null, message: 'Failed to sign out (HTTP 500)' },
  },
]
