import { HttpStatus } from '../../http'
import { ApiErrorCode } from '../api-error.types'
import { ApiError } from '../api-error.utils'

/** A status, a body and the plain message, and the error that `toApiError` makes of them. */
export const toApiErrorCases = [
  {
    name: 'the code, the detail and the field problems of a Problem Details body',
    status: HttpStatus.UnprocessableContent,
    body: {
      type: 'about:blank',
      title: 'Validation failed',
      status: HttpStatus.UnprocessableContent,
      code: 'validation_failed',
      detail: 'The name is missing.',
      errors: [{ field: 'name', message: 'Enter a name.' }],
    },
    message: 'Failed to create the project (HTTP 422)',
    error: {
      status: HttpStatus.UnprocessableContent,
      code: 'validation_failed',
      message: 'Failed to create the project (HTTP 422): The name is missing.',
      fieldErrors: [{ field: 'name', message: 'Enter a name.' }],
    },
  },
  {
    name: 'the status and the plain message without a body',
    status: HttpStatus.BadGateway,
    body: null,
    message: 'Failed to load (HTTP 502)',
    error: {
      status: HttpStatus.BadGateway,
      code: null,
      message: 'Failed to load (HTTP 502)',
      fieldErrors: [],
    },
  },
  {
    name: 'the status and the plain message of a text body',
    status: HttpStatus.BadGateway,
    body: 'Bad Gateway',
    message: 'Failed to load (HTTP 502)',
    error: {
      status: HttpStatus.BadGateway,
      code: null,
      message: 'Failed to load (HTTP 502)',
      fieldErrors: [],
    },
  },
  {
    name: 'the status and the plain message of a body of another shape',
    status: HttpStatus.BadGateway,
    body: { code: 42 },
    message: 'Failed to load (HTTP 502)',
    error: {
      status: HttpStatus.BadGateway,
      code: null,
      message: 'Failed to load (HTTP 502)',
      fieldErrors: [],
    },
  },
  {
    name: 'the plain message when the detail is null',
    status: HttpStatus.NotFound,
    body: { code: 'not_found', detail: null },
    message: 'Failed to load (HTTP 404)',
    error: { code: 'not_found', message: 'Failed to load (HTTP 404)' },
  },
  {
    name: 'the plain message when the detail is empty',
    status: HttpStatus.NotFound,
    body: { code: 'not_found', detail: '' },
    message: 'Failed to load (HTTP 404)',
    error: { code: 'not_found', message: 'Failed to load (HTTP 404)' },
  },
]

/** The words for some codes and statuses. */
export const messages = {
  code: { [ApiErrorCode.RateLimited]: 'Wait a moment.' },
  status: {
    [HttpStatus.Unauthorized]: 'Wrong password.',
    [HttpStatus.TooManyRequests]: 'Slow down.',
  },
}

/** An error, and the message that `errorMessageOf` gives it with `messages`. */
export const errorMessageCases = [
  {
    name: 'the words for the code',
    error: new ApiError('x', HttpStatus.TooManyRequests, 'rate_limited', []),
    message: 'Wait a moment.',
  },
  {
    name: 'the words for the status of a code without words',
    error: new ApiError('x', HttpStatus.TooManyRequests, 'budget_exceeded', []),
    message: 'Slow down.',
  },
  {
    name: 'the words for the status of an error without a code',
    error: new ApiError('x', HttpStatus.Unauthorized, null, []),
    message: 'Wrong password.',
  },
  {
    name: 'the message of an error without words',
    error: new ApiError('Failed (HTTP 500)', HttpStatus.InternalServerError, null, []),
    message: 'Failed (HTTP 500)',
  },
  {
    name: 'the message of an error that is not of the API',
    error: new Error('Network down'),
    message: 'Network down',
  },
]

/** An error, and whether it says that what the request asked for does not exist. */
export const notFoundCases = [
  {
    name: 'an ApiError with status 404',
    error: new ApiError('x', HttpStatus.NotFound, 'not_found', []),
    notFound: true,
  },
  {
    name: 'an ApiError with another status',
    error: new ApiError('x', HttpStatus.InternalServerError, null, []),
    notFound: false,
  },
  { name: 'an error that is not of the API', error: new Error('x'), notFound: false },
  { name: 'a value that is not an error', error: 'not found', notFound: false },
]

/** An error, and whether it says that the record the request changes moved on since it was read. */
export const versionConflictCases = [
  {
    name: 'an ApiError with the code of a version conflict',
    error: new ApiError('x', HttpStatus.Conflict, ApiErrorCode.VersionConflict, []),
    isConflict: true,
  },
  {
    name: 'an ApiError of another code with the same status',
    error: new ApiError('x', HttpStatus.Conflict, ApiErrorCode.InvalidState, []),
    isConflict: false,
  },
  { name: 'an error that is not of the API', error: new Error('x'), isConflict: false },
  { name: 'a value that is not an error', error: 'version_conflict', isConflict: false },
]

/** An error, and whether it says that the request had no session. */
export const unauthorizedCases = [
  {
    name: 'an ApiError with status 401',
    error: new ApiError('x', HttpStatus.Unauthorized, null, []),
    isUnauthorized: true,
  },
  {
    name: 'an ApiError with another status',
    error: new ApiError('x', HttpStatus.Forbidden, null, []),
    isUnauthorized: false,
  },
  { name: 'an error that is not of the API', error: new Error('x'), isUnauthorized: false },
  { name: 'a value that is not an error', error: 'unauthorized', isUnauthorized: false },
]
