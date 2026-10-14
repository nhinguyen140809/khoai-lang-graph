import { describe, expect, it } from 'vitest'

import { authHref, nextParam, safeNextPath, signInHref } from '../auth-redirect.utils'

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

  it('drops a page to return to that is not of this app, or is the project list', () => {
    expect(authHref('/login', 'https://example.com')).toBe('/login')
    expect(authHref('/login', '/projects')).toBe('/login')
    expect(authHref('/register', '/login')).toBe('/register')
  })
})

describe('signInHref', () => {
  it('returns to the whole address: path, query and fragment', () => {
    expect(signInHref({ pathname: '/threads/t1', search: '?tab=runs', hash: '#step-3' })).toBe(
      '/login?next=%2Fthreads%2Ft1%3Ftab%3Druns%23step-3',
    )
  })

  it('needs no page to return to from the project list', () => {
    expect(signInHref({ pathname: '/projects', search: '', hash: '' })).toBe('/login')
  })

  it('stays on a sign-in or account page', () => {
    expect(signInHref({ pathname: '/login', search: '?next=%2Fsettings', hash: '' })).toBeNull()
    expect(signInHref({ pathname: '/register', search: '', hash: '' })).toBeNull()
  })
})

describe('nextParam', () => {
  it('reads one value of next from the query', () => {
    expect(nextParam({ next: '/settings' })).toBe('/settings')
    expect(nextParam({ next: ['/a', '/b'] })).toBeNull()
    expect(nextParam({})).toBeNull()
  })
})
