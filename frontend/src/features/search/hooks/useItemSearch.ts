import { useQuery } from '@tanstack/react-query'

import { searchItems } from '../search.api'

/** The shortest text that is searched; a single letter matches almost everything. */
export const MIN_QUERY_LENGTH = 2

export function useItemSearch(projectId: string, q: string) {
  const text = q.trim()
  return useQuery({
    queryKey: ['items', 'search', projectId, text],
    queryFn: () => searchItems(projectId, text),
    enabled: text.length >= MIN_QUERY_LENGTH,
  })
}
