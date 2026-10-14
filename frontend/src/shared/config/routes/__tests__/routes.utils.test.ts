import { describe, expect, it } from 'vitest'

import { routes } from '../routes.utils'

describe('routes', () => {
  it('gives the pages without parameters', () => {
    expect(routes.home()).toBe('/')
    expect(routes.settings()).toBe('/settings')
  })
})
