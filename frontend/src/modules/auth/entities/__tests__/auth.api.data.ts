import { http, HttpResponse } from 'msw'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { login, logout, register } from '../auth.api'

/** A call of the auth API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'sends the credentials to log in',
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
    name: 'logs out without a body',
    call: () => logout(),
    request: { method: 'POST', path: apiEndpoints.logout.path(), body: null },
  },
] satisfies SentRequestCase[]

/** A call of the auth API, the handler that refuses it, and the message of the error. */
export const apiErrorCases = [
  {
    name: 'a refused login',
    refuse: () =>
      http.post(apiEndpoints.login.pattern, () =>
        HttpResponse.json(
          { status: HttpStatus.Unauthorized, code: 'unauthenticated' },
          { status: HttpStatus.Unauthorized },
        ),
      ),
    call: () => login({ email: 'a@example.com', password: 'x' }),
    error: {
      status: HttpStatus.Unauthorized,
      code: 'unauthenticated',
      message: 'Failed to log in (HTTP 401)',
    },
  },
  {
    name: 'an email that has an account',
    refuse: () =>
      http.post(apiEndpoints.register.pattern, () =>
        HttpResponse.json(
          { status: HttpStatus.UnprocessableContent, code: 'validation_failed' },
          { status: HttpStatus.UnprocessableContent },
        ),
      ),
    call: () => register({ email: 'a@example.com', password: 'x', display_name: 'A' }),
    error: {
      status: HttpStatus.UnprocessableContent,
      message: 'Failed to create the account (HTTP 422)',
    },
  },
  {
    name: 'a failed logout',
    refuse: () => serverErrorOn(HttpMethod.Post, apiEndpoints.logout.path()),
    call: () => logout(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to log out (HTTP 500)',
    },
  },
]
