import { describe, expect, it } from 'vitest'

import { toHex } from '../design-system.utils'

describe('toHex', () => {
  it('writes an rgb color as hex', () => {
    expect(toHex('rgb(55, 85, 205)')).toBe('#3755cd')
  })

  it('adds the alpha of a color with some transparency', () => {
    expect(toHex('rgba(0, 0, 0, 0.5)')).toBe('#00000080')
  })

  it('leaves a color that is opaque without an alpha pair', () => {
    expect(toHex('rgba(255, 255, 255, 1)')).toBe('#ffffff')
  })

  it('returns any other form as it came', () => {
    expect(toHex('color(srgb 0.1 0.2 0.3)')).toBe('color(srgb 0.1 0.2 0.3)')
  })
})
