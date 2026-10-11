import { useQuery } from '@tanstack/react-query'

import { listRunSteps } from '../workflow.api'

/** The steps of a run; they are read again while the run runs. */
export function useRunSteps(runId: string, running: boolean) {
  return useQuery({
    queryKey: ['workflow', 'steps', runId],
    queryFn: () => listRunSteps(runId),
    refetchInterval: running ? 2000 : false,
  })
}
