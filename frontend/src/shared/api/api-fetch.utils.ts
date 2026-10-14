import type { z } from 'zod'

import { type ApiError, toApiError } from './api-error.utils'
import { apiUrl } from './api-url.utils'

interface ApiRequestOptions {
  /** What the request does, for the error message: "load projects" gives "Failed to load projects". */
  action: string
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

// The ApiError of an answer with an error status; its body is read when it is JSON.
async function readError(response: Response, action: string): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // No JSON body: the error keeps the plain message.
  }
  return toApiError(response.status, body, `Failed to ${action} (HTTP ${String(response.status)})`)
}

// Sends one request; an error status becomes an ApiError.
async function send(
  path: string,
  { action, method = 'GET', body, headers = {} }: ApiRequestOptions,
): Promise<Response> {
  const init: RequestInit = { method, headers }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json', ...headers }
    init.body = JSON.stringify(body)
  }
  const response = await fetch(apiUrl(path), init)
  if (!response.ok) throw await readError(response, action)
  return response
}

/** Sends one request to the API and parses the JSON response with `schema`. */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options: ApiRequestOptions,
): Promise<T> {
  const response = await send(path, options)
  return schema.parse(await response.json())
}

/** Sends a request whose answer has no body to read, such as `204 No Content`. */
export async function apiCommand(path: string, options: ApiRequestOptions): Promise<void> {
  await send(path, { method: 'POST', ...options })
}
