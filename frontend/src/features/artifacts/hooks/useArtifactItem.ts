import { useQuery } from '@tanstack/react-query'

import { getArtifactItem } from '../artifacts.api'

/** One item of the Artifacts tab by id. */
export function useArtifactItem(itemId: string) {
  return useQuery({
    queryKey: ['artifacts', 'item', itemId],
    queryFn: () => getArtifactItem(itemId),
  })
}
