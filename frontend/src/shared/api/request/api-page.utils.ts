import { z } from 'zod'

import type { ListPage } from './api-page.types'
import { apiRequest } from './api-request.utils'

/** The envelope of every list endpoint: one page of items and the cursor of the next page. */
function listPageSchema<T>(itemSchema: z.ZodType<T>) {
  return z.object({ items: z.array(itemSchema), next_cursor: z.string().nullable() })
}

interface PageOptions {
  /** How many items the page holds at most. */
  limit: number
  /** The `next_cursor` of the page before; null for the first page. */
  cursor: string | null
  /** What the request does, for the message of its error, such as "load projects". */
  action: string
}

/** Reads one page of a list endpoint; the query of `path` is kept. */
export function fetchPage<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  { limit, cursor, action }: PageOptions,
): Promise<ListPage<T>> {
  // Any origin works here: only the path and the query string are kept.
  const url = new URL(path, 'http://localhost')
  url.searchParams.set('limit', String(limit))
  if (cursor !== null) url.searchParams.set('cursor', cursor)
  return apiRequest(`${url.pathname}${url.search}`, listPageSchema(itemSchema), { action })
}
