import { useQuery } from '@tanstack/react-query'

import { getWorkflowState } from '../workflow.api'

/** The state after a step; the state of a step never changes, so it is kept. */
export function useWorkflowState(runId: string, stepId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['workflow', 'state', runId, stepId],
    queryFn: () => getWorkflowState(runId, stepId),
    enabled,
  })
}
