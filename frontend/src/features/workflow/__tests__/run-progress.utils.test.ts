import { describe, expect, it } from 'vitest'

import { runProgress } from '../run-progress.utils'
import type { WorkflowStep } from '../workflow.types'

function step(sequence: number, node: string, status: WorkflowStep['status'] = 'succeeded') {
  return {
    id: `s${String(sequence)}`,
    run_id: 'r1',
    sequence,
    node,
    agent_role: null,
    stage: 'planning',
    status,
    iteration: 0,
    subject_item_id: null,
    model_id: null,
    llm_calls: 0,
    usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0, duration_ms: 0 },
    produced: [],
    error: null,
    started_at: '2026-10-01T00:00:00Z',
    finished_at: null,
  } satisfies WorkflowStep
}

describe('runProgress', () => {
  it('has no node and no edge before the first step', () => {
    expect(runProgress([], { status: 'queued' })).toEqual({ nodes: {}, lastEdge: null })
  })

  it('counts the visits of a node and keeps its last step', () => {
    const progress = runProgress([step(1, 'a'), step(2, 'b'), step(3, 'a')], {
      status: 'succeeded',
    })

    expect(progress.nodes.a).toEqual({ status: 'done', visits: 2, lastStepId: 's3' })
    expect(progress.nodes.b?.visits).toBe(1)
    expect(progress.lastEdge).toEqual({ source: 'b', target: 'a' })
  })

  it('marks a step that runs while the run is paused as waiting, and otherwise as running', () => {
    const steps = [step(1, 'a'), step(2, 'checkpoint', 'running')]

    expect(runProgress(steps, { status: 'interrupted' }).nodes.checkpoint?.status).toBe('waiting')
    expect(runProgress(steps, { status: 'running' }).nodes.checkpoint?.status).toBe('running')
  })

  it('marks a node of a failed step as failed', () => {
    expect(runProgress([step(1, 'a', 'failed')], { status: 'failed' }).nodes.a?.status).toBe(
      'failed',
    )
  })

  it('does not draw an edge when the last two steps are of one node', () => {
    expect(runProgress([step(1, 'a'), step(2, 'a')], undefined).lastEdge).toBeNull()
  })
})
