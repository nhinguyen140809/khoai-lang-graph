import { ApiError } from '@/shared/api/error'
import { HttpStatus } from '@/shared/api/http'

/**
 * Whether a failed request is tried once more. An answer such as 401 or 404 does not change on a
 * second try; a network error or a server error may.
 */
export function canRetryOnce(failureCount: number, error: Error): boolean {
  return (
    !(error instanceof ApiError && error.status < HttpStatus.InternalServerError) &&
    failureCount < 1
  )
}
