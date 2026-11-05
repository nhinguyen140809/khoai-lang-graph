import { describe, expect, it } from 'vitest'

import { collectBy, groupBy, newestOfEachGroup } from '../group.utils'
import { collectByCases, groupByCases, newestOfEachGroupCases } from './group.utils.data'

describe('groupBy', () => {
  it.each(groupByCases)('gives $name', ({ items, keyOf, groups }) => {
    expect(groupBy(items, keyOf)).toEqual(groups)
  })
})

describe('newestOfEachGroup', () => {
  it.each(newestOfEachGroupCases)('keeps $name', ({ items, kept }) => {
    const newest = newestOfEachGroup(
      items,
      ({ group }) => group,
      ({ rank }) => rank,
    )

    expect([...newest].map(([group, { id }]) => [group, id])).toEqual(kept)
  })
})

describe('collectBy', () => {
  it.each(collectByCases)('$name', ({ items, keyOf, valueOf, collected }) => {
    expect([...collectBy(items, keyOf, valueOf)]).toEqual(collected)
  })

  it('holds the items themselves without a value reader', () => {
    expect([...collectBy(['p1', 'q1', 'p2'], (item) => item.slice(0, 1))]).toEqual([
      ['p', ['p1', 'p2']],
      ['q', ['q1']],
    ])
  })

  it('skips the item of a null key', () => {
    expect([...collectBy(['a', 'b'], () => null)]).toEqual([])
  })
})
