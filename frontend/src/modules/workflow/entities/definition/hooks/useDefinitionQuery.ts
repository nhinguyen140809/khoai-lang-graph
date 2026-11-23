import { useQuery } from '@tanstack/react-query'

import type { HookQueryOptions } from '@/shared/api/query-client'

import { workflowDefinitionStaleTime } from '../stale-time.constants'
import { getWorkflowDefinition } from '../workflow.api'
import { workflowKeys } from '../workflow.keys'
import type { WorkflowDefinition } from '../workflow-definition.types'
import type { WorkflowRef } from '../workflow-ref.types'

// One request serves every part of a version: a hook picks its part with `select`, so that the
// stages, the titles and the graph of a version share one entry in the cache.
export function useDefinitionQuery<Selected>(
  workflow: WorkflowRef | undefined,
  select: (definition: WorkflowDefinition) => Selected,
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useQuery({
    queryKey: workflowKeys.definition(workflow),
    queryFn: () => getWorkflowDefinition(workflow),
    enabled: isEnabled,
    // A version never changes once it exists; the current one changes with a deploy.
    staleTime: workflow === undefined ? workflowDefinitionStaleTime : Infinity,
    select,
  })
}
