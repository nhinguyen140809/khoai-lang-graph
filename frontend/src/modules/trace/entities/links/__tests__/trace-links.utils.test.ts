import { describe, expect, it } from 'vitest'

import { isLinkOutOfDate } from '../trace-links.utils'
import { outOfDateCases } from './trace-links.utils.data'

describe('isLinkOutOfDate', () => {
  it.each(outOfDateCases)('answers for $name', ({ link, target, expected }) => {
    expect(isLinkOutOfDate(link, target)).toBe(expected)
  })
})
