import { useQuery } from '@tanstack/react-query'

import { layoutGraph } from '../graph-layout.utils'
import type { WorkflowDefinition } from '../workflow.types'

/** The places of the nodes of a definition; they are computed once for each version. */
export function useGraphLayout(definition: WorkflowDefinition | undefined) {
  return useQuery({
    queryKey: ['workflow', 'layout', definition?.name, definition?.version],
    queryFn: () =>
      definition === undefined
        ? Promise.reject(new Error('No definition'))
        : layoutGraph(definition),
    enabled: definition !== undefined,
    staleTime: Infinity,
  })
}
