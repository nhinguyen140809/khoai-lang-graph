import { describe, expect, it } from 'vitest'

import { paletteColors } from '../palette.constants'
import { colorOf, hashOf } from '../palette.utils'

describe('hashOf', () => {
  it('is the same for the same text and different for another', () => {
    expect(hashOf('analyst')).toBe(hashOf('analyst'))
    expect(hashOf('analyst')).not.toBe(hashOf('validator'))
  })
})

describe('colorOf', () => {
  it('gives the same color of the palette for the same text', () => {
    expect(colorOf('persona')).toBe(colorOf('persona'))
    expect(paletteColors).toContain(colorOf('persona'))
  })

  it('reaches every color of the palette over many texts', () => {
    const used = new Set(
      Array.from({ length: 200 }, (_, place) => colorOf(`kind-${String(place)}`)),
    )

    expect(used.size).toBe(paletteColors.length)
  })
})

describe('colorOf with colors given', () => {
  it('takes only from the colors given', () => {
    const colors = ['red', 'green', 'blue']
    const used = new Set(
      Array.from({ length: 60 }, (_, place) => colorOf(`text-${String(place)}`, colors)),
    )

    expect([...used].every((color) => colors.includes(color))).toBe(true)
    expect(used.size).toBe(colors.length)
  })
})
