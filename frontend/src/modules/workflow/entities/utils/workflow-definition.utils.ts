import type { ReviewableCheckpoint, VisibleStage } from '../types/definition-views.types'
import type { WorkflowDefinition } from '../types/workflow-definition.types'
import type { CheckpointNode, WorkflowEdge, WorkflowNode } from '../types/workflow-graph.types'
import type { ValueList, WorkflowStage } from '../types/workflow-vocabulary.types'

/** The title of each stage, by the key of the stage. */
export function stageTitles(definition: WorkflowDefinition): Map<string, string> {
  return new Map(definition.stages.map(({ key, title }) => [key, title]))
}

/**
 * The stages the user sees, as a tree by `parent`, in the order of the definition. An internal stage
 * is left out with the stages under it.
 */
export function visibleStages(definition: WorkflowDefinition): VisibleStage[] {
  function build(parent: string | null): VisibleStage[] {
    return definition.stages
      .filter((stage) => stage.parent === parent && !stage.internal)
      .map(({ key, title }) => ({ key, title, children: build(key) }))
  }

  return build(null)
}

/**
 * The title of the stage a run is in, as the user reads it. A stage that the user does not see, one
 * that is internal or under an internal one, gives the title of the nearest stage before it that the
 * user sees, or null when there is none. Null also for a stage that the definition does not have.
 */
export function visibleStageTitle(definition: WorkflowDefinition, stage: string): string | null {
  const index = definition.stages.findIndex(({ key }) => key === stage)

  if (index === -1) {
    return null
  }

  return (
    definition.stages
      .slice(0, index + 1)
      .findLast((candidate) => isStageVisible(definition, candidate))?.title ?? null
  )
}

function isStageVisible(definition: WorkflowDefinition, stage: WorkflowStage): boolean {
  if (stage.internal) {
    return false
  }

  const parent = definition.stages.find(({ key }) => key === stage.parent)

  return parent === undefined || isStageVisible(definition, parent)
}

/** The reviews the user may turn on, one for each checkpoint, in the order of the definition. */
export function reviewableCheckpoints(definition: WorkflowDefinition): ReviewableCheckpoint[] {
  return checkpointNodes(definition).map(({ id, title, prompt }) => ({
    id,
    title,
    description: prompt,
  }))
}

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

/** The list of values that a content field names with `x-value-list`, or null if none. */
export function findValueList(definition: WorkflowDefinition, key: string): ValueList | null {
  return definition.value_lists.find((list) => list.key === key) ?? null
}
