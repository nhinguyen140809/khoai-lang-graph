import { useCallback } from 'react'

import type { WorkflowDefinition } from '../workflow-definition.types'
import { actsOf } from '../workflow-definition.utils'
import type { WorkflowRef } from '../workflow-ref.types'
import { useDefinitionQuery } from './useDefinitionQuery'

/**
 * The acts to show around the agent at work in a version of the workflow, so that a run reads with
 * the version it ran with: those of the tool in use when it names some, else those of the stage.
 * None without a workflow, and while the definition loads.
 */
export function useActsOf(
  workflow: WorkflowRef | undefined,
  stage: string | null,
  tool: string | null,
): string[] {
  // A stable function, so that the query does not select again on every render.
  const selectActs = useCallback(
    (definition: WorkflowDefinition) => actsOf(definition, { stage, tool }),
    [stage, tool],
  )
  const acts = useDefinitionQuery(workflow, selectActs, { isEnabled: workflow !== undefined })

  return acts.data ?? []
}
