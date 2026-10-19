import { workflowKeys } from '../workflow.keys'

/** A key of the workflow, and the key above it. */
export const keyCases = [
  { name: 'the stages of a version', key: workflowKeys.stages(1), wider: workflowKeys.all() },
]
