import { useQuery } from '@tanstack/react-query'

import { getRun } from '../threads.api'

/** One run; idle until a run is given. */
export function useRun(runId: string | null | undefined) {
  return useQuery({
    queryKey: ['threads', 'run', runId],
    queryFn: () => (runId == null ? Promise.reject(new Error('No run')) : getRun(runId)),
    enabled: runId != null,
  })
}
