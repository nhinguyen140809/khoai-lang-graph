import { apiRequest, listPageSchema } from '@/shared/api/api-fetch.utils'

import { SEARCH_RESULT_LIMIT } from './search.constants'
import { itemSchema } from './search.types'

/** The items of a project whose key or content contain `q`, ordered by key. */
export function searchItems(projectId: string, q: string) {
  const query = new URLSearchParams({ q, limit: String(SEARCH_RESULT_LIMIT) })
  return apiRequest(
    `/api/v1/projects/${encodeURIComponent(projectId)}/items?${query.toString()}`,
    listPageSchema(itemSchema),
    { action: 'search the items' },
  )
}
