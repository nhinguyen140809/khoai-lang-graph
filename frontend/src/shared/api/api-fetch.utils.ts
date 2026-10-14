import { z } from 'zod'

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

/** The envelope of every list endpoint: one page of items and the cursor of the next page. */
export function listPageSchema<T>(itemSchema: z.ZodType<T>) {
  return z.object({ items: z.array(itemSchema), next_cursor: z.string().nullable() })
}

// The largest page the API serves, so that most lists take one request.
const MAX_PAGE_SIZE = 200

/** Reads every page of a list endpoint, following `next_cursor`, and returns all items in order. */
export async function fetchAllPages<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  action: string,
): Promise<T[]> {
  const pageSchema = listPageSchema(itemSchema)
  const items: T[] = []
  let cursor: string | null = null
  do {
    // Any origin works here: only the path and the query string are kept.
    const url = new URL(path, 'http://localhost')
    url.searchParams.set('limit', String(MAX_PAGE_SIZE))
    if (cursor !== null) url.searchParams.set('cursor', cursor)
    const page: { items: T[]; next_cursor: string | null } = await apiRequest(
      `${url.pathname}${url.search}`,
      pageSchema,
      { action },
    )
    items.push(...page.items)
    cursor = page.next_cursor
  } while (cursor !== null)
  return items
}
