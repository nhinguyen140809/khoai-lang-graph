import { useQuery } from '@tanstack/react-query'

import { getPendingReview } from '../session.api'
import { sessionKeys } from '../session-keys.constants'

/** The review that the run waits for; read only while the run is paused. */
export function usePendingReview(runId: string | null) {
  return useQuery({
    queryKey: sessionKeys.review(runId ?? ''),
    queryFn: () => getPendingReview(runId ?? ''),
    enabled: runId !== null,
  })
}
