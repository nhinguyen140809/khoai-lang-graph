import { describe, expect, it } from 'vitest'

import { indexBy } from '../index.utils'

const rows = [
  { id: 'a', title: 'First' },
  { id: 'b', title: 'Second' },
]

describe('indexBy', () => {
  it('holds each item by its key, in the order they came in', () => {
    expect([...indexBy(rows, ({ id }) => id)]).toEqual([
      ['a', rows[0]],
      ['b', rows[1]],
    ])
  })

  it('holds what `valueOf` tells of each item instead of the item', () => {
    expect([
      ...indexBy(
        rows,
        ({ id }) => id,
        ({ title }) => title,
      ),
    ]).toEqual([
      ['a', 'First'],
      ['b', 'Second'],
    ])
  })

  it('lets the later item hold a key that two items share', () => {
    const shared = [...rows, { id: 'a', title: 'Third' }]

    expect(indexBy(shared, ({ id }) => id).get('a')).toEqual({ id: 'a', title: 'Third' })
  })

  it('takes any iterable and holds nothing for an empty one', () => {
    expect(indexBy(new Set<string>(), (text) => text).size).toBe(0)
    expect([...indexBy(new Set(['x']), (text) => text.length)]).toEqual([[1, 'x']])
  })
})
