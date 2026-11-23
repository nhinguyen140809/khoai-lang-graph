'use client'

import { agentRoleLabels } from '../workflow-definition.utils'
import type { WorkflowRef } from '../workflow-ref.types'
import { useDefinitionQuery } from './useDefinitionQuery'

/** The labels of the agent roles of a workflow at a version; empty while it loads. */
export function useAgentRoleLabels(workflow: WorkflowRef | undefined): ReadonlyMap<string, string> {
  const labels = useDefinitionQuery(workflow, agentRoleLabels, {
    isEnabled: workflow !== undefined,
  })
  return labels.data ?? new Map()
}
