import type { HttpMethod } from '@/shared/api/http'

/** A request to the API of the mock server, as a test describes it. */
export interface ApiCall {
  method: HttpMethod
  path: string
  /** Sent as JSON. */
  body?: unknown
  headers?: Record<string, string>
}

/** What `fetchApi` reads of an answer: its status, its headers and its JSON body (null when empty). */
export interface ApiAnswer<T = unknown> {
  status: number
  headers: Headers
  body: T
}
