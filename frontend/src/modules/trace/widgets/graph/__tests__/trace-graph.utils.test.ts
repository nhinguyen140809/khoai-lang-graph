import { describe, expect, it } from 'vitest'

import { traceGraphOf } from '../trace-graph.utils'
import { graphCases, twoItemTrace } from './trace-graph.utils.data'

describe('traceGraphOf', () => {
  it.each(graphCases)('gives $name', ({ trace, nodes, edges }) => {
    const graph = traceGraphOf(trace, ({ id }) => `Title of ${id}`)

    expect(graph.nodes.map(({ id, isSuperseded }) => ({ id, isSuperseded }))).toEqual(nodes)
    expect(
      graph.edges.map(({ id, source, target, isOutOfDate, targetQuote }) => ({
        id,
        source,
        target,
        isOutOfDate,
        targetQuote,
      })),
    ).toEqual(edges)
  })

  it('takes the title of a node from the function it is given', () => {
    const graph = traceGraphOf(twoItemTrace, ({ key }) => `T ${key}`)

    expect(graph.nodes.map(({ title }) => title)).toEqual(['T A', 'T B'])
  })
})
