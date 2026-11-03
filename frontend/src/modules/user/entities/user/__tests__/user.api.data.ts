import { http, HttpResponse } from 'msw'

import { mePasswordFixture } from '@/mocks/account/me.fixtures'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod, HttpStatus } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import type { SentRequestCase } from '@/test/suites'

import { changePassword, getMe, updateMe } from '../user.api'
import type { ChangePasswordBody, UpdateMeBody } from '../user.types'

const mePath = apiEndpoints.me.path()
const passwordPath = apiEndpoints.password.path()

export const updateBody: UpdateMeBody = { display_name: 'Linh P.' }
export const passwordBody: ChangePasswordBody = {
  current_password: mePasswordFixture,
  new_password: 'long-enough-1',
}

function refuseWithFieldError(method: HttpMethod, pattern: string, field: string) {
  const answer = {
    status: HttpStatus.UnprocessableContent,
    code: 'validation_failed',
    errors: [{ field, message: 'Enter a value.' }],
  }
  const respond = () => HttpResponse.json(answer, { status: HttpStatus.UnprocessableContent })
  return method === HttpMethod.Patch ? http.patch(pattern, respond) : http.post(pattern, respond)
}

/** A call of the user API, and the request it sends. */
export const sentRequestCases = [
  {
    name: 'reads the signed-in user',
    call: () => getMe(),
    request: { method: 'GET', path: mePath, body: null },
  },
  {
    name: 'changes the name with the body',
    call: () => updateMe(updateBody),
    request: { method: 'PATCH', path: mePath, body: updateBody },
  },
  {
    name: 'changes the password with the body',
    call: () => changePassword(passwordBody),
    request: { method: 'POST', path: passwordPath, body: passwordBody },
  },
] satisfies SentRequestCase[]

/** A call of the user API, the handler that refuses it, and the error it throws. */
export const apiErrorCases = [
  {
    name: 'a failed read of the user',
    refuse: () => serverErrorOn(HttpMethod.Get, mePath),
    call: () => getMe(),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to load your account (HTTP 500)',
    },
  },
  {
    name: 'a failed save of the profile',
    refuse: () => serverErrorOn(HttpMethod.Patch, mePath),
    call: () => updateMe(updateBody),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to save your profile (HTTP 500)',
    },
  },
  {
    name: 'a name that the API refuses',
    refuse: () => refuseWithFieldError(HttpMethod.Patch, apiEndpoints.me.pattern, 'display_name'),
    call: () => updateMe(updateBody),
    error: {
      status: HttpStatus.UnprocessableContent,
      code: 'validation_failed',
      fieldErrors: [{ field: 'display_name', message: 'Enter a value.' }],
    },
  },
  {
    name: 'a failed change of the password',
    refuse: () => serverErrorOn(HttpMethod.Post, passwordPath),
    call: () => changePassword(passwordBody),
    error: {
      status: HttpStatus.InternalServerError,
      code: null,
      message: 'Failed to change your password (HTTP 500)',
    },
  },
  {
    name: 'a wrong current password',
    refuse: () =>
      refuseWithFieldError(HttpMethod.Post, apiEndpoints.password.pattern, 'current_password'),
    call: () => changePassword(passwordBody),
    error: {
      status: HttpStatus.UnprocessableContent,
      code: 'validation_failed',
      fieldErrors: [{ field: 'current_password', message: 'Enter a value.' }],
    },
  },
]
