import { describe, expect, it } from 'vitest'

import { authHref, safeNextPath } from '../auth-redirect.utils'

describe('safeNextPath', () => {
  it('keeps a path of the app', () => {
    expect(safeNextPath('/projects/p1/session?mock-run-state=done')).toBe(
      '/projects/p1/session?mock-run-state=done',
    )
  })

  it.each([
    null,
    undefined,
    '',
    'https://example.com',
    '//example.com/x',
    '/\\example.com',
    'projects',
  ])('replaces %s with the project list', (next) => {
    expect(safeNextPath(next)).toBe('/projects')
  })

  it('does not return to the sign-in pages', () => {
    expect(safeNextPath('/login?next=%2Fprojects')).toBe('/projects')
    expect(safeNextPath('/register')).toBe('/projects')
  })
})

describe('authHref', () => {
  it('carries the page to return to', () => {
    expect(authHref('/login', '/projects/p1/session')).toBe(
      '/login?next=%2Fprojects%2Fp1%2Fsession',
    )
    expect(authHref('/register', null)).toBe('/register')
  })
})
