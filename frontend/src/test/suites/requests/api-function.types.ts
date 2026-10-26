import type { RequestHandler } from 'msw'

import type { HttpMethod } from '@/shared/api/http'

/** A call of an API function, and the request that it sends. */
export interface SentRequestCase {
  name: string
  call: () => Promise<unknown>
  request: {
    method: HttpMethod
    /** The path with its query string. */
    path: string
    body: unknown
    headers?: Record<string, string | null>
  }
}

/** A call of an API function, the handler that refuses it, and the error that the call throws. */
export interface ApiErrorCase {
  name: string
  refuse: () => RequestHandler
  call: () => Promise<unknown>
  error: Record<string, unknown>
}
