import { HttpResponse } from 'msw'

import { ApiErrorCode, HttpStatus } from '@/shared/api/api-error.constants'
import type { FieldProblem } from '@/shared/api/api-error.utils'

/** An error response in the Problem Details format of the API. */
export function problem(
  status: number,
  code: string,
  title: string,
  detail: string | null = null,
  errors: FieldProblem[] = [],
) {
  return HttpResponse.json(
    { type: 'about:blank', title, status, code, detail, errors },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

export function notFound(what: string) {
  return problem(HttpStatus.NotFound, ApiErrorCode.NotFound, 'Not found', `${what} does not exist.`)
}

/** No valid session. */
export function unauthenticated(detail: string) {
  return problem(HttpStatus.Unauthorized, ApiErrorCode.Unauthenticated, 'Unauthenticated', detail)
}

/** A body that breaks the rules of its fields, one problem per field. */
export function validationFailed(errors: FieldProblem[]) {
  return problem(
    HttpStatus.UnprocessableContent,
    ApiErrorCode.ValidationFailed,
    'Validation failed',
    null,
    errors,
  )
}

export function internalError() {
  return problem(HttpStatus.InternalServerError, ApiErrorCode.InternalError, 'Internal error')
}
