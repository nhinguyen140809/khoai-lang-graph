import { describe, expect, it } from 'vitest'

import { routes } from '../routes.utils'

describe('routes', () => {
  it('gives the pages without parameters', () => {
    expect(routes.home()).toBe('/')
    expect(routes.settings()).toBe('/settings')
  })

  it('gives the account pages, which return to the page asked for', () => {
    expect(routes.signIn('/settings')).toBe('/login?next=%2Fsettings')
    expect(routes.register()).toBe('/register')
  })
})
