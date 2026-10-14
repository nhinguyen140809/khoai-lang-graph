import { z } from 'zod'

import { apiUrl } from './api-url.utils'

// The error body of the API (RFC 9457 Problem Details). Fields are optional so that an error from
// a proxy, which has no such body, still becomes an ApiError.
const problemSchema = z.object({
  title: z.string().optional(),
  code: z.string().optional(),
  detail: z.string().nullable().optional(),
  errors: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
})

/** The statuses of an answer that the app handles in a way of its own. */
export const HttpStatus = {
  /** No valid session: the app opens the sign-in page. */
  Unauthorized: 401,
  /** The record does not exist, or the user may not see it. */
  NotFound: 404,
  /** Too many attempts, such as signing in. */
  TooManyRequests: 429,
} as const

export interface FieldProblem {
  field: string
  message: string
}

/** A response with an error status. `code` is the stable value to branch on, when the body has one. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | null
  readonly fieldErrors: FieldProblem[]

  constructor(message: string, status: number, code: string | null, fieldErrors: FieldProblem[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === HttpStatus.NotFound
}

interface ApiRequestOptions {
  /** What the request does, for the error message: "load projects" gives "Failed to load projects". */
  action: string
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

async function toApiError(response: Response, action: string): Promise<ApiError> {
  const fallback = `Failed to ${action} (HTTP ${String(response.status)})`
  let json: unknown = null
  try {
    json = await response.json()
  } catch {
    // No JSON body: keep the fallback message.
  }
  const problem = problemSchema.safeParse(json)
  if (!problem.success) return new ApiError(fallback, response.status, null, [])
  const { detail, code, errors } = problem.data
  return new ApiError(
    detail != null && detail !== '' ? `${fallback}: ${detail}` : fallback,
    response.status,
    code ?? null,
    errors ?? [],
  )
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
  if (!response.ok) throw await toApiError(response, action)
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
