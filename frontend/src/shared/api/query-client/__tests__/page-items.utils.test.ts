import { describe, expect, it } from 'vitest'

import { pageItems } from '../page-items.utils'
import { pageCases } from './page-items.utils.data'

describe('pageItems', () => {
  it.each(pageCases)('lists the items of $name', ({ data, items }) => {
    expect(pageItems(data)).toEqual(items)
  })
})
