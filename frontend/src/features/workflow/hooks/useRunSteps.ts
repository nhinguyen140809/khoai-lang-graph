import { useQuery } from '@tanstack/react-query'

import { listRunSteps } from '../workflow.api'

/** The steps of one run, in order. */
export function useRunSteps(runId: string) {
  return useQuery({
    queryKey: ['workflow', 'run-steps', runId],
    queryFn: () => listRunSteps(runId),
  })
}
