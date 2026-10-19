import { http, HttpResponse } from 'msw'

import { login, logout, register } from '../auth.api'

/** A call of the auth API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'sends the credentials to sign in',
    call: () => login({ email: 'linh.pham@example.com', password: 'secret' }),
    request: {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'linh.pham@example.com', password: 'secret' },
    },
  },
  {
    name: 'sends the fields of a new account',
    call: () => register({ email: 'an@example.com', password: 'secret', display_name: 'An Tran' }),
    request: {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: { email: 'an@example.com', password: 'secret', display_name: 'An Tran' },
    },
  },
  {
    name: 'signs out without a body',
    call: () => logout(),
    request: { method: 'POST', path: '/api/v1/auth/logout', body: null },
  },
]

/** A call of the auth API, the handler that refuses it, and the message of the error. */
export const refusedCallCases = [
  {
    name: 'a refused sign-in',
    refuse: () =>
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json({ status: 401, code: 'unauthenticated' }, { status: 401 }),
      ),
    call: () => login({ email: 'a@example.com', password: 'x' }),
    error: { status: 401, code: 'unauthenticated', message: 'Failed to sign in (HTTP 401)' },
  },
  {
    name: 'an email that has an account',
    refuse: () =>
      http.post('/api/v1/auth/register', () =>
        HttpResponse.json({ status: 422, code: 'validation_failed' }, { status: 422 }),
      ),
    call: () => register({ email: 'a@example.com', password: 'x', display_name: 'A' }),
    error: { status: 422, message: 'Failed to create the account (HTTP 422)' },
  },
  {
    name: 'a failed sign-out',
    refuse: () => http.post('/api/v1/auth/logout', () => new HttpResponse(null, { status: 500 })),
    call: () => logout(),
    error: { status: 500, code: null, message: 'Failed to sign out (HTTP 500)' },
  },
]
