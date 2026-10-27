import { describe, expect, it } from 'vitest'

import { placeInOutline } from '../artifact-outline.utils'
import { outlineCases } from './artifact-outline.utils.data'

describe('placeInOutline', () => {
  it.each(outlineCases)('places $name', ({ items, placed }) => {
    const found = placeInOutline(items).map(({ item, depth }) => [
      item.id,
      item.outline_number,
      depth,
    ])

    expect(found).toEqual(placed)
  })
})
