import { describe, expect, it } from 'vitest'

import { cursorPagesOptions } from '../cursor-pages.config'
import { cursorCases } from './cursor-pages.config.data'

describe('cursorPagesOptions', () => {
  it('starts with the first page', () => {
    expect(cursorPagesOptions.initialPageParam).toBeNull()
  })

  it.each(cursorCases)('follows the cursor of $name', ({ page, next }) => {
    expect(cursorPagesOptions.getNextPageParam(page)).toBe(next)
  })
})
