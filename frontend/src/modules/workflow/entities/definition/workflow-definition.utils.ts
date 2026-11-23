import { indexBy } from '@/shared/lib/collections'

import type { WorkflowDefinition } from './workflow-definition.types'
import type { CheckpointNode, WorkflowEdge, WorkflowNode } from './workflow-graph.types'
import type { AgentRole, Tool, ValueList } from './workflow-vocabulary.types'

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

/** The label of each agent role of a definition, by its key. */
export function agentRoleLabels(definition: WorkflowDefinition): Map<string, string> {
  return indexBy(
    definition.agent_roles,
    ({ key }) => key,
    ({ label }) => label,
  )
}

/** The tool of a definition with this key, or undefined when it lists none. */
export function findTool(
  definition: Pick<WorkflowDefinition, 'tools'>,
  key: string,
): Tool | undefined {
  return definition.tools.find((tool) => tool.key === key)
}

/**
 * The acts to show around the agent at work: those of the tool in use when it names some, else
 * those of the stage; none when neither names any.
 */
export function actsOf(
  definition: Pick<WorkflowDefinition, 'stages' | 'tools'>,
  { stage, tool }: { stage: string | null; tool: string | null },
): string[] {
  const ofTool = tool === null ? [] : (findTool(definition, tool)?.acts ?? [])
  if (ofTool.length > 0) return ofTool
  return definition.stages.find(({ key }) => key === stage)?.acts ?? []
}

/** The title of each link type of a definition, by its key. */
export function linkTypeTitles(
  definition: Pick<WorkflowDefinition, 'link_types'>,
): Map<string, string> {
  return indexBy(
    definition.link_types,
    ({ key }) => key,
    ({ title }) => title,
  )
}

/** The kinds of item that each kind of artifact holds, in the order of the definition, by its kind. */
export function itemKindsByArtifactKind(
  definition: Pick<WorkflowDefinition, 'artifact_kinds'>,
): Map<string, string[]> {
  return new Map(definition.artifact_kinds.map(({ kind, item_kinds }) => [kind, item_kinds]))
}

/**
 * The kind of the subject item that each stage works on one after another: for each artifact kind
 * with one artifact for each subject, the kind of its subjects, by the key of the stage.
 */
export function subjectKindByStage(
  definition: Pick<WorkflowDefinition, 'artifact_kinds'>,
): Map<string, string> {
  return new Map(
    definition.artifact_kinds.flatMap(({ per_project, stage, subject_item_kind }) =>
      per_project === 'one_per_subject' && subject_item_kind !== null
        ? [[stage, subject_item_kind]]
        : [],
    ),
  )
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
