import type { NodeProgress, RunProgress, WorkflowRun, WorkflowStep } from './workflow.types'

/**
 * The state of every node of the graph, from the steps of a run: the last step of a node says
 * whether the node runs, is done or failed, the steps count its visits, and the last edge is the
 * one between the last two steps. A review checkpoint that runs while the run is paused waits.
 */
export function runProgress(
  steps: WorkflowStep[],
  run: Pick<WorkflowRun, 'status'> | undefined,
): RunProgress {
  const ordered = steps.toSorted((a, b) => a.sequence - b.sequence)
  const nodes: Record<string, NodeProgress> = {}
  for (const step of ordered) {
    const visits = (nodes[step.node]?.visits ?? 0) + 1
    const waits = step.status === 'running' && run?.status === 'interrupted'
    nodes[step.node] = {
      status:
        step.status === 'failed'
          ? 'failed'
          : step.status === 'running'
            ? waits
              ? 'waiting'
              : 'running'
            : 'done',
      visits,
      lastStepId: step.id,
    }
  }
  const last = ordered.at(-1)
  const beforeLast = ordered.at(-2)
  return {
    nodes,
    lastEdge:
      last !== undefined && beforeLast !== undefined && beforeLast.node !== last.node
        ? { source: beforeLast.node, target: last.node }
        : null,
  }
}
