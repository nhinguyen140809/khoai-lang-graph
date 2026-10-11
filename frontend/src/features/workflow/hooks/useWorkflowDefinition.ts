import { useQuery } from '@tanstack/react-query'

import { getWorkflowDefinition } from '../workflow.api'

/** A version of the workflow definition; a version never changes, so it is kept. */
export function useWorkflowDefinition(version: number | undefined) {
  return useQuery({
    queryKey: ['workflow', 'definition', version],
    queryFn: () => getWorkflowDefinition(version ?? 1),
    enabled: version !== undefined,
    staleTime: Infinity,
  })
}
