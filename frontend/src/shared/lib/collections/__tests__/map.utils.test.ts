import { describe, expect, it } from 'vitest'

import { removeEntry, setEntry } from '../map.utils'
import { removeEntryCases, setEntryCases } from './map.utils.data'

describe('setEntry', () => {
  it.each(setEntryCases)('sets $name', ({ map, key, value, entries }) => {
    const result = setEntry(new Map<string, number>(map), key, value)

    expect([...result]).toEqual(entries)
  })

  it('leaves the map it was given as it was', () => {
    const map = new Map([['a', 1]])

    setEntry(map, 'b', 2)

    expect([...map]).toEqual([['a', 1]])
  })
})

describe('removeEntry', () => {
  it.each(removeEntryCases)('removes $name', ({ map, key, entries }) => {
    expect([...removeEntry(new Map<string, number>(map), key)]).toEqual(entries)
  })

  it('leaves the map it was given as it was', () => {
    const map = new Map([['a', 1]])

    removeEntry(map, 'a')

    expect([...map]).toEqual([['a', 1]])
  })
})
