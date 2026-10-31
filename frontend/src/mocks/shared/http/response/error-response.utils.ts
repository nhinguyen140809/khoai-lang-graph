import { HttpResponse } from 'msw'

import { ApiErrorCode, type FieldProblem } from '@/shared/api/error'
import { HttpHeader, HttpStatus, MediaType } from '@/shared/api/http'

/** An error response in the Problem Details format of the API. */
export function errorResponse(
  status: HttpStatus,
  code: string,
  title: string,
  detail: string | null = null,
  errors: FieldProblem[] = [],
) {
  return HttpResponse.json(
    { type: 'about:blank', title, status, code, detail, errors },
    { status, headers: { [HttpHeader.ContentType]: MediaType.ProblemJson } },
  )
}

export function notFound(what: string) {
  return errorResponse(
    HttpStatus.NotFound,
    ApiErrorCode.NotFound,
    'Not found',
    `${what} does not exist.`,
  )
}

/** No valid session. */
export function unauthenticated(detail: string) {
  return errorResponse(
    HttpStatus.Unauthorized,
    ApiErrorCode.Unauthenticated,
    'Unauthenticated',
    detail,
  )
}

/** A body that breaks the rules of its fields, one problem per field. */
export function validationFailed(errors: FieldProblem[]) {
  return errorResponse(
    HttpStatus.UnprocessableContent,
    ApiErrorCode.ValidationFailed,
    'Validation failed',
    null,
    errors,
  )
}

/** A request whose query the API does not read, such as a value out of the list of a parameter. */
export function invalidRequest(detail: string) {
  return errorResponse(
    HttpStatus.BadRequest,
    ApiErrorCode.InvalidRequest,
    'Invalid request',
    detail,
  )
}

/** A request that the state of the record does not allow, such as stopping a run that ended. */
export function invalidState(detail: string) {
  return errorResponse(HttpStatus.Conflict, ApiErrorCode.InvalidState, 'Invalid state', detail)
}

/** A change based on an old version of the record, which has moved on since. */
export function versionConflict(detail: string) {
  return errorResponse(
    HttpStatus.Conflict,
    ApiErrorCode.VersionConflict,
    'Version conflict',
    detail,
  )
}

export function internalError() {
  return errorResponse(HttpStatus.InternalServerError, ApiErrorCode.InternalError, 'Internal error')
}
