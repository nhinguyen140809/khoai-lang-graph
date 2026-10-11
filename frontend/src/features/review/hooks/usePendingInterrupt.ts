import { useQuery } from '@tanstack/react-query'

import { getPendingInterrupt } from '../review.api'

/** The review that a run waits for; null when it waits for none. */
export function usePendingInterrupt(runId: string) {
  return useQuery({
    queryKey: ['review', 'interrupt', runId],
    queryFn: () => getPendingInterrupt(runId),
  })
}
