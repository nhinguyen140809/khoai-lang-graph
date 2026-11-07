import { describe, expect, it } from 'vitest'

import { itemLinkGroups, linkQuotesByItem, outOfDateItemIds } from '../chains.utils'
import { chainTrace, outOfDateTrace, quotesTrace } from './chains.utils.data'

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
      kindTitleOf: () => 'Kind',
    })

    expect(groups.outgoing.map(({ title }) => title)).toEqual(['Evidenced by'])
    expect(groups.incoming.map(({ title }) => title)).toEqual(['Based on'])
    expect(groups.outgoing[0]?.rows.map(({ other }) => other.key)).toEqual(['PER-001#2'])
  })

  it('puts a link type missing from the definition last, titled by its key', () => {
    const groups = itemLinkGroups(chainTrace, 'spec', {
      linkTypes: [{ key: 'derived_from', title: 'Based on' }],
      titleOf: (item) => item.key,
      kindTitleOf: () => 'Kind',
    })

    expect(groups.outgoing.map(({ title }) => title)).toEqual(['Based on', 'concerns'])
  })

  it('marks a row out of date when its link was made from an older version of its target', () => {
    const groups = itemLinkGroups(outOfDateTrace, 'spec', {
      linkTypes,
      titleOf: (item) => item.key,
      kindTitleOf: () => 'Kind',
    })

    expect(groups.outgoing[0]?.rows[0]?.isOutOfDate).toBe(true)
  })
})
