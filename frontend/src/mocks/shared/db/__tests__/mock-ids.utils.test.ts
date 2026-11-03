import { describe, expect, it } from 'vitest'

import { createdId, nextCreatedId } from '../mock-ids.utils'

describe('nextCreatedId', () => {
  it('gives the id after the records already created', () => {
    expect(nextCreatedId('5f2d', { get: () => [] })).toBe(createdId('5f2d', 1))
    expect(nextCreatedId('5f2d', { get: () => ['a', 'b'] })).toBe(createdId('5f2d', 3))
  })
})
