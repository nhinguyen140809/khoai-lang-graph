import { describe, expect, it } from 'vitest'

import { viewStartHref } from '../view-start.utils'

describe('viewStartHref', () => {
  it('names the host that shows each view', () => {
    expect(viewStartHref('user', 'dev.localhost:3000')).toBe('//localhost:3000/')
    expect(viewStartHref('developer', 'localhost:3000')).toBe('//dev.localhost:3000/')
  })

  it('leads to the start page on show without a host', () => {
    expect(viewStartHref('user', null)).toBe('/')
  })
})
