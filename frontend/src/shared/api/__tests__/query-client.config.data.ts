import { ApiError } from '../api-error.utils'

const apiError = (status: number) => new ApiError('Failed', status, null, [])

/** The error of a failed query, and the API answers 401 with it. */
export const unauthorizedError = apiError(401)

/** The error of a failed query that leaves the user on the page. */
export const keptPageCases = [
  { name: 'another 4xx status', error: apiError(403) },
  { name: 'a 5xx status', error: apiError(500) },
  { name: 'an error that is not of the API', error: new Error('offline') },
]

/** The failures of a query so far, its last error, and whether it tries once more. */
export const retryCases = [
  { name: 'a 404', failures: 0, error: apiError(404), retries: false },
  { name: 'a 401', failures: 0, error: apiError(401), retries: false },
  { name: 'the first 500', failures: 0, error: apiError(500), retries: true },
  { name: 'a second 500', failures: 1, error: apiError(500), retries: false },
  {
    name: 'the first error that is not of the API',
    failures: 0,
    error: new Error('offline'),
    retries: true,
  },
  {
    name: 'a second error that is not of the API',
    failures: 1,
    error: new Error('offline'),
    retries: false,
  },
]
