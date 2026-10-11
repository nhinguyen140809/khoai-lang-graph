import { describe, expect, it } from 'vitest'

import { edgeId, layoutGraph, NODE_HEIGHT } from '../graph-layout.utils'
import type { WorkflowDefinition } from '../workflow.types'

const definition: WorkflowDefinition = {
  name: 'w',
  version: 1,
  nodes: [
    { id: 'start', kind: 'start', label: 'start' },
    { id: 'a', kind: 'agent', label: 'a' },
    { id: 'end', kind: 'end', label: 'end' },
  ],
  edges: [
    { source: 'start', target: 'a', label: null, conditional: false, option: null },
    { source: 'a', target: 'end', label: null, conditional: false, option: null },
    { source: 'a', target: 'ghost', label: null, conditional: false, option: null },
  ],
  stages: [],
  agent_roles: [],
}

describe('layoutGraph', () => {
  it('places every node, top to bottom, in the order of the edges', async () => {
    const { positions } = await layoutGraph(definition)

    expect(Object.keys(positions).sort()).toEqual(['a', 'end', 'start'])
    expect(positions.a?.y).toBeGreaterThanOrEqual((positions.start?.y ?? 0) + NODE_HEIGHT)
    expect(positions.end?.y).toBeGreaterThanOrEqual((positions.a?.y ?? 0) + NODE_HEIGHT)
  })
})

describe('edgeId', () => {
  it('tells apart two edges between the same nodes', () => {
    const base = { source: 'a', target: 'b' }

    expect(edgeId({ ...base, option: 'x' }, 0)).not.toBe(edgeId({ ...base, option: 'y' }, 1))
  })
})
