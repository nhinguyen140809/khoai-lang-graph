import { describe, expect, it } from 'vitest'

import { groupBy, newestOfEachGroup } from '../group.utils'
import { groupByCases, newestOfEachGroupCases } from './group.utils.data'

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
