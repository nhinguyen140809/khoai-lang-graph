import { useQuery } from '@tanstack/react-query'

import { listReviewedItems } from '../review.api'

/** The items of the artifacts under review. */
export function useReviewedItems(artifactIds: string[]) {
  return useQuery({
    queryKey: ['review', 'items', ...artifactIds],
    queryFn: () => listReviewedItems(artifactIds),
    enabled: artifactIds.length > 0,
  })
}
