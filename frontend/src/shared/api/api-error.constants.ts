// The errors of the API: the status of the answer and its `code`, the stable value to branch on.
// Several codes share a status, such as the three conflicts of 409.

/** The statuses of the answers of the API that carry an error. */
export const HttpStatus = {
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  UnprocessableContent: 422,
  TooManyRequests: 429,
  InternalServerError: 500,
  BadGateway: 502,
} as const

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
