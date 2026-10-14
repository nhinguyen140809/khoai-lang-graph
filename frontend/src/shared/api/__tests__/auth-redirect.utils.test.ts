import { describe, expect, it } from 'vitest'

import { authHref, safeNextPath } from '../auth-redirect.utils'

describe('safeNextPath', () => {
  it('keeps a path of the app', () => {
    expect(safeNextPath('/projects/p1/console?mock-run-state=done')).toBe(
      '/projects/p1/console?mock-run-state=done',
    )
    expect(safeNextPath('/projects/p1/console#step-3')).toBe('/projects/p1/console#step-3')
  })

  it.each([
    null,
    undefined,
    '',
    'https://example.com',
    '//example.com/x',
    '/\\example.com',
    'projects',
    '/\t/example.com',
    '/\n/example.com',
    '/\r/example.com',
  ])('replaces %j with the project list', (next) => {
    expect(safeNextPath(next)).toBe('/projects')
  })

  it('does not return to the sign-in pages', () => {
    expect(safeNextPath('/login?next=%2Fprojects')).toBe('/projects')
    expect(safeNextPath('/register')).toBe('/projects')
    expect(safeNextPath('/login/')).toBe('/projects')
    expect(safeNextPath('/register#top')).toBe('/projects')
  })
})

describe('authHref', () => {
  it('carries the page to return to', () => {
    expect(authHref('/login', '/projects/p1/console')).toBe(
      '/login?next=%2Fprojects%2Fp1%2Fconsole',
    )
    expect(authHref('/register', null)).toBe('/register')
  })
})
