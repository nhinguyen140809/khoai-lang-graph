'use client'

import { agentRoleLabels } from '../workflow-definition.utils'
import { useDefinitionQuery } from './useDefinitionQuery'

/** The labels of the agent roles in a version of the workflow; empty while it loads. */
export function useAgentRoleLabels(version: number | undefined): ReadonlyMap<string, string> {
  const labels = useDefinitionQuery(version, agentRoleLabels, {
    isEnabled: version !== undefined,
  })
  return labels.data ?? new Map()
}
