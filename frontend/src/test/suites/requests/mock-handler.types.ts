import type { HttpMethod, HttpStatus } from '@/shared/api/http'

/** A request that the mock server refuses, and the answer it gives. */
export interface RejectedRequestCase {
  name: string
  method: HttpMethod
  path: string
  /** Sent as it is when it is a text, so that a case can send what is not JSON; as JSON otherwise. */
  body?: unknown
  /** The page address that chooses a scenario of the mocks, such as `/?mock-projects=error`. */
  page?: string
  headers?: Record<string, string>
  status: HttpStatus
  /** What the body of the answer holds, such as `{ code: 'internal_error' }` or `{ errors }`. */
  answer?: Record<string, unknown>
}
