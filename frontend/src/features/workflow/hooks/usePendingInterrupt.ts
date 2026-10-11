import { useQuery } from '@tanstack/react-query'

import { getPendingInterrupt } from '../workflow.api'

/** The interrupt of the run that waits for a review, if any. */
export function usePendingInterrupt(runId: string) {
  return useQuery({
    queryKey: ['workflow', 'pending-interrupt', runId],
    queryFn: () => getPendingInterrupt(runId),
  })
}
