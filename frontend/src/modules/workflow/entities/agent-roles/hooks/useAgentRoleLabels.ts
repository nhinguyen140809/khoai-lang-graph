'use client'

import { useDefinitionQuery } from '../../definition/hooks/useDefinitionQuery'
import type { WorkflowRef } from '../../workflow-ref/workflow-ref.types'
import { agentRoleLabels } from '../agent-roles.utils'

/** The labels of the agent roles of a workflow at a version; empty while it loads. */
export function useAgentRoleLabels(workflow: WorkflowRef | undefined): ReadonlyMap<string, string> {
  const labels = useDefinitionQuery(workflow, agentRoleLabels, {
    isEnabled: workflow !== undefined,
  })
  return labels.data ?? new Map()
}
