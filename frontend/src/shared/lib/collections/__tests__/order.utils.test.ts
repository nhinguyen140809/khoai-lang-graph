import { describe, expect, it } from 'vitest'

import { firstInOrder, rankIn } from '../order.utils'

describe('rankIn', () => {
  it('gives the place of a value in the order, from 0', () => {
    expect(rankIn(['b', 'a', 'c'], 'a')).toBe(1)
  })

  it('places a value that is not in it after all of them', () => {
    expect(rankIn(['b', 'a', 'c'], 'd')).toBe(3)
  })
})

describe('firstInOrder', () => {
  it('gives the value that comes first in the order', () => {
    expect(firstInOrder(['c', 'a', 'b'], ['a', 'b', 'c'])).toBe('a')
  })

  it('keeps the first of the list when several come after the order', () => {
    expect(firstInOrder(['d', 'e'], ['a', 'b', 'c'])).toBe('d')
  })

  it('gives the one value of a one-value list', () => {
    expect(firstInOrder(['only'], ['a', 'b'])).toBe('only')
  })

  it('gives undefined for an empty list', () => {
    expect(firstInOrder([], ['a'])).toBeUndefined()
  })
})
