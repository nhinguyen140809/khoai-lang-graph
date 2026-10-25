import { ApiError } from '../../error/api-error.utils'

const apiError = (status: number) => new ApiError('Failed', status, null, [])

/** The error of a failed query, and the API answers 401 with it. */
export const unauthorizedError = apiError(401)

/** The error of a failed query that leaves the user on the page. */
export const keptPageCases = [
  { name: 'another 4xx status', error: apiError(403) },
  { name: 'a 5xx status', error: apiError(500) },
  { name: 'an error that is not of the API', error: new Error('offline') },
]
