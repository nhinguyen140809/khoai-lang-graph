import { apiRequest, listPageSchema } from '@/lib/api-fetch.utils'

import { itemSchema } from './search.types'

// The most results the panel lists; a longer list asks for a narrower search.
export const SEARCH_RESULT_LIMIT = 50

/** The items of a project whose key or content contain `q`, ordered by key. */
export function searchItems(projectId: string, q: string) {
  const query = new URLSearchParams({ q, limit: String(SEARCH_RESULT_LIMIT) })
  return apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/items?${query.toString()}`,
    listPageSchema(itemSchema),
    { action: 'search the items' },
  )
}

export function getItem(itemId: string) {
  return apiRequest(`/api/v1/items/${encodeURIComponent(itemId)}`, itemSchema, {
    action: 'load the item',
  })
}
