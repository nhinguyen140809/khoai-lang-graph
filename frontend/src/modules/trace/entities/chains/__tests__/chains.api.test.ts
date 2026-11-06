import { describe, expect, it } from 'vitest'

import { itSendsRequests } from '@/test/suites'

import { getArtifactTrace, getItemTrace } from '../chains.api'
import { requirement, sentRequestCases, specification } from './chains.api.data'

/** The keys of the items of a trace, in the order the API lists them. */
function keysOf(trace: { items: { key: string }[] }): string[] {
  return trace.items.map(({ key }) => key)
}

describe('traces api', () => {
  it('reads the chain of an item down to the interview and up to the backlog', async () => {
    const trace = await getItemTrace(requirement.id)

    expect(keysOf(trace)).toEqual([
      'AR-001',
      'PER-001',
      'PER-001#2',
      'RAW-001',
      'REQ-001',
      'US-001',
    ])
    expect(trace.links).toHaveLength(5)
  })

  it('reads what the item was built from going backward, and what was built from it going forward', async () => {
    const backward = await getItemTrace(requirement.id, { direction: 'backward' })
    const forward = await getItemTrace(requirement.id, { direction: 'forward' })

    expect(keysOf(backward)).toEqual(['AR-001', 'PER-001', 'PER-001#2', 'RAW-001', 'REQ-001'])
    expect(keysOf(forward)).toEqual(['REQ-001', 'US-001'])
  })

  it('stops a chain at the depth that is asked for', async () => {
    const trace = await getItemTrace(requirement.id, { direction: 'backward', depth: 1 })

    expect(keysOf(trace)).toEqual(['AR-001', 'REQ-001'])
    expect(trace.links).toHaveLength(1)
  })

  it('reads the chains of all the items of an artifact in one answer', async () => {
    const trace = await getArtifactTrace(specification.id)

    const ids = new Set(trace.items.map(({ id }) => id))
    expect(keysOf(trace)).toEqual(
      expect.arrayContaining(['REQ-001', 'US-001', 'AR-001', 'RAW-001', 'PER-001#2']),
    )
    expect(ids.size).toBe(trace.items.length)
    expect(
      trace.links.every((link) => ids.has(link.source_item_id) && ids.has(link.target_item_id)),
    ).toBe(true)
  })

  itSendsRequests(sentRequestCases)
})
