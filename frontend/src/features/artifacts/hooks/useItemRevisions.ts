import { useQuery } from '@tanstack/react-query'

import { getItemRevisions } from '../artifacts.api'

/** The version history of the item (TIMELINE). */
export function useItemRevisions(itemId: string) {
  return useQuery({
    queryKey: ['artifacts', 'revisions', itemId],
    queryFn: () => getItemRevisions(itemId),
  })
}
