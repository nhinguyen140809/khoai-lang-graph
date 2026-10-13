import { describe, expect, it } from 'vitest'

import { isAtOrUnder, pathOf } from '@/shared/lib/path.utils'

describe('pathOf', () => {
  it('leaves out the query and the fragment', () => {
    expect(pathOf('/projects/p1/search?q=REQ#top')).toBe('/projects/p1/search')
  })
})

describe('isAtOrUnder', () => {
  it('holds the path itself and the pages under it, not a path that only starts the same', () => {
    expect(isAtOrUnder('/settings', '/settings')).toBe(true)
    expect(isAtOrUnder('/settings/profile', '/settings')).toBe(true)
    expect(isAtOrUnder('/settings-old', '/settings')).toBe(false)
  })
})
