import { ApiError } from '../../error/api-error.utils'

const apiError = (status: number) => new ApiError('Failed', status, null, [])

/** The failures of a request so far, its last error, and whether it tries once more. */
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
