import { ApiError } from '@/shared/api/api-fetch.utils'

/** The problems that the server found, by field; a failure without fields has none. */
export function serverFieldErrors(error: unknown, prefix = ''): Record<string, string> {
  if (!(error instanceof ApiError)) return {}
  return Object.fromEntries(
    error.fieldErrors
      .filter(({ field }) => field.startsWith(prefix))
      .map(({ field, message }) => [field.slice(prefix.length), message]),
  )
}

/** The message of a failure that is not a problem of one field. */
export function formErrorMessage(error: unknown): string | null {
  if (error === null || error === undefined) return null
  if (error instanceof ApiError && error.fieldErrors.length > 0) return null
  return error instanceof Error ? error.message : 'Something went wrong.'
}
