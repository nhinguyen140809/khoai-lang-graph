import { indexBy } from '@/shared/lib/collections'

import type { WorkflowDefinition } from '../definition/workflow-definition.types'
import type { AgentRole } from '../definition/workflow-vocabulary.types'

/** The label of each agent role of a definition, by its key. */
export function agentRoleLabels(definition: WorkflowDefinition): Map<string, string> {
  return indexBy(
    definition.agent_roles,
    ({ key }) => key,
    ({ label }) => label,
  )
}

/** The agent role of the definition with this key, or undefined. */
export function findAgentRole(
  definition: Pick<WorkflowDefinition, 'agent_roles'>,
  key: string,
): AgentRole | undefined {
  return definition.agent_roles.find((role) => role.key === key)
}
