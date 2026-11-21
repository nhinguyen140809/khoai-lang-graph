import { describe, expect, it } from 'vitest'

import { seenWithin, stretchOf } from '../animation.utils'

describe('stretchOf', () => {
  it.each([
    { name: 'before the stretch', progress: 0.1, expected: 0 },
    { name: 'at the start', progress: 0.2, expected: 0 },
    { name: 'halfway', progress: 0.4, expected: 0.5 },
    { name: 'at the end', progress: 0.6, expected: 1 },
    { name: 'after the stretch', progress: 0.9, expected: 1 },
  ])('gives $expected $name', ({ progress, expected }) => {
    expect(stretchOf(progress, 0.2, 0.6)).toBeCloseTo(expected)
  })
})

describe('seenWithin', () => {
  const edges = { top: 1, bottom: 22, fade: 3 }

  it('shows what is in the middle whole, and nothing beyond the edges', () => {
    expect(seenWithin(10, edges)).toBe(1)
    expect(seenWithin(0, edges)).toBe(0)
    expect(seenWithin(23, edges)).toBe(0)
  })

  it('fades what is near an edge, more the nearer it is', () => {
    expect(seenWithin(2.5, edges)).toBeCloseTo(0.5)
    expect(seenWithin(20.5, edges)).toBeCloseTo(0.5)
  })
})
