import type { WorkflowDefinition } from '../definition/workflow-definition.types'
import type { CheckpointNode } from '../definition/workflow-graph.types'
import type { ReviewableCheckpoint } from './checkpoints.types'

/** The reviews the user may turn on, one for each checkpoint that reviews documents, in the order of the definition. */
export function reviewableCheckpoints(definition: WorkflowDefinition): ReviewableCheckpoint[] {
  return checkpointNodes(definition)
    .filter(({ purpose }) => purpose === 'review')
    .map(({ id, title, prompt }) => ({ id, title, description: prompt }))
}

/** The nodes where a run pauses to ask the user, in the order of the definition. */
export function checkpointNodes(definition: WorkflowDefinition): CheckpointNode[] {
  return definition.nodes.filter((node) => node.kind === 'checkpoint')
}
