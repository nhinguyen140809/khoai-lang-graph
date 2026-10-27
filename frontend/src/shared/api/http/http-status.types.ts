/** The statuses of the answers of the API: the ones that succeed and the ones that carry an error. */
export const HttpStatus = {
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  UnprocessableContent: 422,
  TooManyRequests: 429,
  InternalServerError: 500,
  BadGateway: 502,
  ServiceUnavailable: 503,
} as const

export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus]
