import { useQuery } from '@tanstack/react-query'

import { getItem } from '../search.api'

export function useItem(itemId: string) {
  return useQuery({ queryKey: ['items', itemId], queryFn: () => getItem(itemId) })
}
