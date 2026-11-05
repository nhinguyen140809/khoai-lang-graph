import type { WorkflowDefinition } from './workflow-definition.types'
import type { CheckpointNode, WorkflowEdge, WorkflowNode } from './workflow-graph.types'
import type { AgentRole, ValueList } from './workflow-vocabulary.types'

/** The node with this id, or null when the definition has none. */
export function findNode(definition: WorkflowDefinition, nodeId: string): WorkflowNode | null {
  return definition.nodes.find(({ id }) => id === nodeId) ?? null
}

/** The nodes where a run pauses to ask the user, in the order of the definition. */
export function checkpointNodes(definition: WorkflowDefinition): CheckpointNode[] {
  return definition.nodes.filter((node) => node.kind === 'checkpoint')
}

/** The edges that leave a node. */
export function edgesFrom(definition: WorkflowDefinition, nodeId: string): WorkflowEdge[] {
  return definition.edges.filter(({ source }) => source === nodeId)
}

/** The agent role of the definition with this key, or undefined. */
export function findAgentRole(
  definition: Pick<WorkflowDefinition, 'agent_roles'>,
  key: string,
): AgentRole | undefined {
  return definition.agent_roles.find((role) => role.key === key)
}

/** The list of values that a content field names with `x-value-list`, or null if none. */
export function findValueList(
  definition: Pick<WorkflowDefinition, 'value_lists'>,
  key: string,
): ValueList | null {
  return definition.value_lists.find((list) => list.key === key) ?? null
}
