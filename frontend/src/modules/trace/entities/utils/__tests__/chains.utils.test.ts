import { describe, expect, it } from 'vitest'

import { itemLinkGroups, linkQuotesByItem, originOf, outOfDateItemIds } from '../chains.utils'
import { chainTrace, loopTrace, outOfDateTrace, quotesTrace } from './chains.utils.data'

describe('originOf', () => {
  it('follows the chain of a requirement down to the quote it cites', () => {
    const origin = originOf(chainTrace, 'spec')

    expect(origin.steps.map(({ item }) => item.key)).toEqual(['AR-001'])
    expect(origin.steps[0]?.steps.map(({ item }) => item.key)).toEqual(['RAW-001'])
    // The raw requirement cites the message.
    expect(origin.steps[0]?.steps[0]?.evidence.map(({ cited }) => cited.key)).toEqual(['PER-001#2'])
    // A requirement with its own evidence cites it directly too.
    const raw = originOf(chainTrace, 'raw')
    expect(raw.evidence.map(({ cited }) => cited.key)).toEqual(['PER-001#2'])
    expect(raw.steps).toEqual([])
  })

  it('walks an item met twice once, under its first path', () => {
    const origin = originOf(chainTrace, 'spec')

    expect(JSON.stringify(origin).match(/"item":\{"id":"raw"/g)?.length).toBe(1)
  })

  it('gives nothing for an item with no derived_from link', () => {
    expect(originOf(chainTrace, 'message')).toEqual({ evidence: [], steps: [] })
  })

  it('walks a loop once', () => {
    const origin = originOf(loopTrace, 'analyzed')

    expect(origin.steps.map(({ item }) => item.key)).toEqual(['RAW-001'])
    expect(origin.steps[0]?.steps).toEqual([])
  })
})

describe('linkQuotesByItem', () => {
  it('puts the source quote on the source and the target quote on the target', () => {
    const byItem = linkQuotesByItem(quotesTrace)

    expect(byItem.get('spec')?.map(({ side, other }) => [side, other.key])).toEqual([
      ['source', 'AR-001'],
    ])
    expect(byItem.get('analyzed')?.map(({ side, other }) => [side, other.key])).toEqual([
      ['target', 'REQ-001'],
    ])
    expect(byItem.get('message')?.map(({ side, other }) => [side, other.key])).toEqual([
      ['target', 'AR-001'],
    ])
    expect(byItem.has('nothing')).toBe(false)
  })
})

describe('outOfDateItemIds', () => {
  it('gives the sources of the links made from an older version of their target', () => {
    const ids = outOfDateItemIds(outOfDateTrace)

    expect([...ids].toSorted()).toEqual(['other', 'spec'])
  })
})

describe('itemLinkGroups', () => {
  const linkTypes = [
    { key: 'derived_from', title: 'Based on' },
    { key: 'evidenced_by', title: 'Evidenced by' },
  ]

  it('groups the links of an item by type and direction, in the order of the definition', () => {
    const groups = itemLinkGroups(quotesTrace, 'analyzed', {
      linkTypes,
      titleOf: (item) => item.key,
    })

    expect(groups.outgoing.map(({ title }) => title)).toEqual(['Evidenced by'])
    expect(groups.incoming.map(({ title }) => title)).toEqual(['Based on'])
    expect(groups.outgoing[0]?.rows.map(({ other }) => other.key)).toEqual(['PER-001#2'])
  })

  it('puts a link type missing from the definition last, titled by its key', () => {
    const groups = itemLinkGroups(chainTrace, 'spec', {
      linkTypes: [{ key: 'derived_from', title: 'Based on' }],
      titleOf: (item) => item.key,
    })

    expect(groups.outgoing.map(({ title }) => title)).toEqual(['Based on', 'concerns'])
  })

  it('marks a row out of date when its link was made from an older version of its target', () => {
    const groups = itemLinkGroups(outOfDateTrace, 'spec', {
      linkTypes,
      titleOf: (item) => item.key,
    })

    expect(groups.outgoing[0]?.rows[0]?.isOutOfDate).toBe(true)
  })
})
