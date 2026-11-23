import type { WorkflowDefinition } from '../workflow-definition.types'
import type { WorkflowRef } from '../workflow-ref.types'
import { useDefinitionQuery } from './useDefinitionQuery'

/** The `select` of a hook that wants the definition itself, with no part of it picked out. */
function selectDefinition(definition: WorkflowDefinition) {
  return definition
}

/** The workflow definition of a workflow at a version, or the current one of the requirements workflow without one. */
export function useWorkflowDefinition(workflow?: WorkflowRef) {
  return useDefinitionQuery(workflow, selectDefinition)
}
