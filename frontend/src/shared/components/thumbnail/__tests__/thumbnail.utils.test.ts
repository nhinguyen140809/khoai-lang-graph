import { describe, expect, it } from 'vitest'

import { paletteColors } from '@/shared/lib/palette'

import { thumbnailStyleOf } from '../thumbnail.utils'

describe('thumbnailStyleOf', () => {
  it('gives the same color of the palette for the same seed', () => {
    const style = thumbnailStyleOf('persona') as Record<string, string>

    expect(paletteColors).toContain(style['--thumbnail-color'])
    expect(thumbnailStyleOf('persona')).toEqual(style)
  })
})
