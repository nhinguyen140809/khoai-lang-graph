import { z } from 'zod'

import type { ListPage } from './api-page.types'
import { apiRequest } from './api-request.utils'

/** The envelope of every list endpoint: one page of items and the cursor of the next page. */
export function listPageSchema<T>(itemSchema: z.ZodType<T>) {
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

/**
 * Collects the items of every page of a list that loads one page at a time, by passing the cursor
 * of each page to the read of the next; `readPage` gets null for the first page. For a list that
 * is known to stay short, so that no record is dropped when it grows; a long list is an infinite
 * query instead.
 */
export async function collectAllPages<T>(
  readPage: (cursor: string | null) => Promise<ListPage<T>>,
): Promise<T[]> {
  const items: T[] = []
  let cursor: string | null = null
  do {
    const page: ListPage<T> = await readPage(cursor)
    items.push(...page.items)
    cursor = page.next_cursor
  } while (cursor !== null)
  return items
}

/**
 * Reads every page of a list endpoint that is known to stay short, such as the artifacts of a
 * project, so that no record is dropped when it grows. A long list is an infinite query instead.
 */
export function fetchAllPages<T>(
  path: string,
  itemSchema: z.ZodType<T>,
  { limit, action }: Omit<PageOptions, 'cursor'>,
): Promise<T[]> {
  return collectAllPages((cursor) => fetchPage(path, itemSchema, { limit, cursor, action }))
}
