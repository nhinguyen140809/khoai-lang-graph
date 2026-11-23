import type { WorkflowRef } from '../workflow-ref/workflow-ref.types'

/**
 * The query keys of the workflow, from the widest to the narrowest; each starts with the one above.
 */
export const workflowKeys = {
  all: () => ['workflow'] as const,
  /**
   * The definition of the workflow that `workflow` names at its version; the current definition of
   * the requirements workflow without one.
   */
  definition: (workflow?: WorkflowRef) =>
    [
      ...workflowKeys.all(),
      'definition',
      workflow?.version ?? null,
      ...(workflow === undefined ? [] : [workflow.name]),
    ] as const,
}
