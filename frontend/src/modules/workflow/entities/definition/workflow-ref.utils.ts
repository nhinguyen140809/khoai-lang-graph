import type { WorkflowRef } from './workflow-ref.types'

/**
 * The workflow that a run ran, as the definition it ran with is asked for; undefined for no run,
 * so that what reads a definition for a run waits for it.
 */
export function workflowRefOf(
  run: { workflow_name: string; workflow_version: number } | null | undefined,
): WorkflowRef | undefined {
  return run == null ? undefined : { name: run.workflow_name, version: run.workflow_version }
}
