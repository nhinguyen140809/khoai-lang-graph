import { HttpStatus } from './api-error.types'
import { ApiError } from './api-error.utils'

/**
 * Whether a failed request is tried once more. An answer such as 401 or 404 does not change on a
 * second try; a network error or a server error may.
 */
export function retryOnce(failureCount: number, error: Error): boolean {
  return (
    !(error instanceof ApiError && error.status < HttpStatus.InternalServerError) &&
    failureCount < 1
  )
}
