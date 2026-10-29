import type { WorkflowDefinition } from '../definition/workflow-definition.types'
import { checkpointNodes } from '../definition/workflow-definition.utils'
import type { ReviewableCheckpoint } from './checkpoints.types'

/** The reviews the user may turn on, one for each checkpoint, in the order of the definition. */
export function reviewableCheckpoints(definition: WorkflowDefinition): ReviewableCheckpoint[] {
  return checkpointNodes(definition).map(({ id, title, prompt }) => ({
    id,
    title,
    description: prompt,
  }))
}
