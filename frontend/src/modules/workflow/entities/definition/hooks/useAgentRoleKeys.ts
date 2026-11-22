'use client'

import { agentRoleKeys } from '../workflow-definition.utils'
import { useDefinitionQuery } from './useDefinitionQuery'

/** The keys of the agent roles of the current workflow, in the order it lists them; empty while it loads. */
export function useAgentRoleKeys(): readonly string[] {
  return useDefinitionQuery(undefined, agentRoleKeys).data ?? []
}
