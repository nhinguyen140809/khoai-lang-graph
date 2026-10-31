import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpStatus } from '@/shared/api/http'
import type { RejectedRequestCase } from '@/test/suites'

import { mePasswordFixture } from '../me.fixtures'

/** GET /me in the scenario of the page address: the status and the fields it answers. */
export const meCases = [
  {
    name: 'the signed-in user',
    address: '/',
    status: HttpStatus.Ok,
    body: { email: 'linh.pham@example.com', display_name: 'Linh Pham' },
  },
  {
    name: '500 in the error scenario',
    address: '/?mock-me=error',
    status: HttpStatus.InternalServerError,
    body: { code: 'internal_error' },
  },
  {
    name: '404 in the empty scenario',
    address: '/?mock-me=empty',
    status: HttpStatus.NotFound,
    body: { code: 'not_found', detail: 'The user does not exist.' },
  },
]

/** The requests that change the user or the password and that the mock refuses. */
export const meRejectedCases: RejectedRequestCase[] = [
  {
    name: 'answers 422 to PATCH /me with a blank name',
    method: 'PATCH',
    path: apiEndpoints.me.path(),
    body: { display_name: ' ' },
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'display_name', message: 'Enter a value.' }] },
  },
  {
    name: 'answers 500 to PATCH /me in the error scenario',
    method: 'PATCH',
    path: apiEndpoints.me.path(),
    body: { display_name: 'An' },
    page: '/?mock-update-me=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
  {
    name: 'answers 422 to POST /me/password with a wrong current password',
    method: 'POST',
    path: apiEndpoints.password.path(),
    body: { current_password: 'wrong', new_password: 'long-enough-1' },
    status: HttpStatus.UnprocessableContent,
    answer: {
      errors: [{ field: 'current_password', message: 'The current password is wrong.' }],
    },
  },
  {
    name: 'answers 422 to POST /me/password with a short new password',
    method: 'POST',
    path: apiEndpoints.password.path(),
    body: { current_password: mePasswordFixture, new_password: 'short' },
    status: HttpStatus.UnprocessableContent,
    answer: { errors: [{ field: 'new_password', message: 'Use at least 8 characters.' }] },
  },
  {
    name: 'answers 500 to POST /me/password in the error scenario',
    method: 'POST',
    path: apiEndpoints.password.path(),
    body: { current_password: mePasswordFixture, new_password: 'long-enough-1' },
    page: '/?mock-change-password=error',
    status: HttpStatus.InternalServerError,
    answer: { code: 'internal_error' },
  },
]
