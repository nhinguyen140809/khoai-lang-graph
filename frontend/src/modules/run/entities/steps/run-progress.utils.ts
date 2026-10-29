import type { RunStatus } from '../status/run-status.types'
import type { NodeProgress, NodeStatus, RunProgress, RunStep } from './run-steps.types'
import { orderedSteps } from './run-steps.utils'

/** What a node is doing, from its last step: a step that runs while the run is paused waits. */
function nodeStatusOf(step: RunStep, runStatus: RunStatus | undefined): NodeStatus {
  if (step.status === 'failed') return 'failed'
  if (step.status === 'running') return runStatus === 'interrupted' ? 'waiting' : 'running'
  return 'done'
}

/**
 * The state of every node of the graph, from the steps of a run: the last step of a node says
 * whether the node runs, waits, is done or failed, the steps count its visits, and the last edge
 * is the one between the last two steps.
 */
export function runProgress(steps: RunStep[], run: { status: RunStatus } | undefined): RunProgress {
  const ordered = orderedSteps(steps)
  const nodes: Record<string, NodeProgress> = {}
  for (const step of ordered) {
    nodes[step.node] = {
      status: nodeStatusOf(step, run?.status),
      visits: (nodes[step.node]?.visits ?? 0) + 1,
      lastStepId: step.id,
    }
  }
  const last = ordered.at(-1)
  const beforeLast = ordered.at(-2)
  const hasEdge = last !== undefined && beforeLast !== undefined && beforeLast.node !== last.node
  return { nodes, lastEdge: hasEdge ? { source: beforeLast.node, target: last.node } : null }
}
