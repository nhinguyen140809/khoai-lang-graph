import { describe, expect, it } from 'vitest'

import type { TraceDirection } from '@/modules/trace/entities'

import { traceFrom } from '../chains.lookup'
import { idOf, traceCases } from './chains.lookup.data'

describe('traceFrom', () => {
  it.each(traceCases)('follows $name', ({ starts, direction, depth, keys, linkCount }) => {
    const trace = traceFrom(starts.map(idOf), direction as TraceDirection, depth)

    expect(trace.items.map(({ key }) => key)).toEqual(keys)
    expect(trace.links).toHaveLength(linkCount)
  })

  it('lists only links whose two items are in the trace', () => {
    const trace = traceFrom([idOf('US-001')], 'backward', null)

    const ids = new Set(trace.items.map(({ id }) => id))
    expect(
      trace.links.every((link) => ids.has(link.source_item_id) && ids.has(link.target_item_id)),
    ).toBe(true)
  })
})
