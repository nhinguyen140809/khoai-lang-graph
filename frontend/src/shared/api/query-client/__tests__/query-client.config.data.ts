import { ApiError } from '../../error'
import { HttpStatus } from '../../http'

const apiError = (status: HttpStatus) => new ApiError('Failed', status, null, [])

/** The error of a failed query, and the API answers 401 with it. */
export const unauthorizedError = apiError(HttpStatus.Unauthorized)

/** The error of a failed query that leaves the user on the page. */
export const keptPageCases = [
  { name: 'another 4xx status', error: apiError(HttpStatus.Forbidden) },
  { name: 'a 5xx status', error: apiError(HttpStatus.InternalServerError) },
  { name: 'an error that is not of the API', error: new Error('offline') },
]
