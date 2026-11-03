import type { WorkflowDefinition } from '../workflow-definition.types'
import { useDefinitionQuery } from './useDefinitionQuery'

/** The `select` of a hook that wants the definition itself, with no part of it picked out. */
function selectDefinition(definition: WorkflowDefinition) {
  return definition
}

/** The workflow definition at a version, or the current one without a version. */
export function useWorkflowDefinition(version?: number) {
  return useDefinitionQuery(version, selectDefinition)
}
