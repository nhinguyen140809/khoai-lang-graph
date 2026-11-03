import { describe, expect, it } from 'vitest'

import { runProgress } from '../run-progress.utils'
import { edgeCases, nodeCases } from './run-progress.utils.data'

describe('runProgress', () => {
  it.each(nodeCases)('tells the nodes for $name', ({ steps, runStatus, nodes }) => {
    expect(runProgress(steps, { status: runStatus }).nodes).toMatchObject(nodes)
  })

  it.each(edgeCases)('finds the last edge for $name', ({ steps, edge }) => {
    expect(runProgress(steps, undefined).lastEdge).toEqual(edge)
  })

  it('has no node before the first step', () => {
    expect(runProgress([], { status: 'queued' }).nodes).toEqual({})
  })
})
