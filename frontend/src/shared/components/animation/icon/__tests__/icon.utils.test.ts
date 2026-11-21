import { describe, expect, it } from 'vitest'

import { iconExtent } from '../icon.constants'
import { scaleOf, strokeOf } from '../icon.utils'

describe('scaleOf', () => {
  it('scales an icon so that what it draws takes the extent, and leaves one that is not measured as it is', () => {
    expect(scaleOf({ x: 12, y: 12, size: iconExtent * 2 })).toBeCloseTo(0.5)
    expect(scaleOf(undefined)).toBe(1)
  })
})

describe('strokeOf', () => {
  it('gives the default stroke when none is given, times a factor, made thicker for an icon that is scaled down', () => {
    expect(strokeOf(undefined)).toBe(1.5)
    expect(strokeOf(2, 2)).toBe(4)
    expect(strokeOf(1.5, 1, { x: 12, y: 12, size: iconExtent * 2 })).toBeCloseTo(3)
  })
})
