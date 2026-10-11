import { useQuery } from '@tanstack/react-query'

import { getPendingReview } from '../console.api'
import { consoleKeys } from '../console-keys.constants'

/** The review that the run waits for; read only while the run is paused. */
export function usePendingReview(runId: string | null) {
  return useQuery({
    queryKey: consoleKeys.review(runId ?? ''),
    queryFn: () => getPendingReview(runId ?? ''),
    enabled: runId !== null,
  })
}
