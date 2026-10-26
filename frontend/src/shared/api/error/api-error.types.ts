import type { HttpStatus } from '../http'

// The errors of the API: the status of the answer and its `code`, the stable value to branch on.
// Several codes share a status, such as the three conflicts of 409.

/** The statuses that the API answers an error with. */
export type ApiErrorStatus = (typeof HttpStatus)[
  | 'BadRequest'
  | 'Unauthorized'
  | 'Forbidden'
  | 'NotFound'
  | 'Conflict'
  | 'UnprocessableContent'
  | 'TooManyRequests'
  | 'InternalServerError'
  | 'BadGateway']

/** The `code` of an error of the API. */
export const ApiErrorCode = {
  InvalidRequest: 'invalid_request',
  Unauthenticated: 'unauthenticated',
  Forbidden: 'forbidden',
  NotFound: 'not_found',
  RunAlreadyActive: 'run_already_active',
  VersionConflict: 'version_conflict',
  InvalidState: 'invalid_state',
  IdempotencyConflict: 'idempotency_conflict',
  ValidationFailed: 'validation_failed',
  RateLimited: 'rate_limited',
  BudgetExceeded: 'budget_exceeded',
  ProviderError: 'provider_error',
  InternalError: 'internal_error',
} as const

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode]
export interface FieldProblem {
  field: string
  message: string
}

/** The words for a failed request, by the `code` or the status of its answer. */
export interface ApiErrorMessages {
  code?: Partial<Record<ApiErrorCode, string>>
  status?: Partial<Record<ApiErrorStatus, string>>
}
