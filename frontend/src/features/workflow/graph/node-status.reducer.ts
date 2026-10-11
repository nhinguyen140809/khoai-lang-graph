// The state of every node of a run (docs/architecture/web-app.md §4). The
// same reducer first replays the steps of GET /runs/{id}/steps and the
// pending interrupt, then the live stream events, so a reload and a
// reconnect draw the same picture as the live run.

import type { RunStep } from '../workflow.types'

export type NodeStatus = 'idle' | 'running' | 'waiting' | 'done' | 'failed'

export interface NodeProgress {
  status: NodeStatus
  visits: number // steps of this node in the run
  lastStepId: string | null
}

export interface RunProgress {
  nodes: Record<string, NodeProgress> // a node that is not in the map is idle
  lastEdge: { source: string; target: string } | null
  lastEventId: string | null
}

export const initialProgress: RunProgress = {
  nodes: {},
  lastEdge: null,
  lastEventId: null,
}

export interface RunEventLike {
  id: string
  type: string
  data: Record<string, unknown>
}

function nodeOf(progress: RunProgress, id: string): NodeProgress {
  return progress.nodes[id] ?? { status: 'idle', visits: 0, lastStepId: null }
}

/** The steps and pending interrupt of a run replayed onto the graph. */
export function replaySteps(steps: RunStep[], pendingInterruptNode: string | null): RunProgress {
  const progress: RunProgress = { nodes: {}, lastEdge: null, lastEventId: null }
  let previous: string | null = null
  for (const step of steps) {
    const node = nodeOf(progress, step.node)
    node.visits += 1
    node.lastStepId = step.id
    node.status = step.status === 'failed' ? 'failed' : 'done'
    progress.nodes[step.node] = node
    if (previous !== null && previous !== step.node) {
      progress.lastEdge = { source: previous, target: step.node }
    }
    previous = step.node
  }
  if (pendingInterruptNode !== null) {
    const node = nodeOf(progress, pendingInterruptNode)
    node.status = 'waiting'
    progress.nodes[pendingInterruptNode] = node
  }
  return progress
}
