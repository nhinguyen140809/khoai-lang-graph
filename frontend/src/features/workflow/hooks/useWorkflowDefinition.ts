import { useQuery } from '@tanstack/react-query'

import { getWorkflowDefinition } from '../definition.api'

/** The definition the runs of `version` were executed with; the query key
 * is the one docs/architecture/web-app.md §3 names. */
export function useWorkflowDefinition(version: number | null) {
  return useQuery({
    queryKey: ['workflow-definition', version],
    queryFn: () => getWorkflowDefinition(version),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
