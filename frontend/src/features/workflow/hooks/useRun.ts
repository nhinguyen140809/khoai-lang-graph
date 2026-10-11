import { useQuery } from '@tanstack/react-query'

import { getRun } from '../workflow.api'

/** One run by id. */
export function useRun(runId: string) {
  return useQuery({
    queryKey: ['workflow', 'run', runId],
    queryFn: () => getRun(runId),
  })
}
