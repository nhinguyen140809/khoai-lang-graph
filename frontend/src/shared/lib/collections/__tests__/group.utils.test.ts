import { describe, expect, it } from 'vitest'

import { newestOfEachGroup } from '../group.utils'
import { newestOfEachGroupCases } from './group.utils.data'

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
