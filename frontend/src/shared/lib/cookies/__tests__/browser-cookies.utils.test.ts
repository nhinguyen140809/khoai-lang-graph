import { describe, expect, it } from 'vitest'

import { browserCookies, cookieName } from '../browser-cookies.utils'

describe('browserCookies', () => {
  it('reads what it wrote, and nothing for a missing name', () => {
    browserCookies.set(cookieName('test'), 'value', { maxAge: 60 })

    expect(browserCookies.get(cookieName('test'))).toBe('value')
    expect(browserCookies.get(cookieName('missing'))).toBeUndefined()
  })

  it('drops the cookie once its age runs out', () => {
    browserCookies.set(cookieName('test'), 'value', { maxAge: 0 })

    expect(browserCookies.get(cookieName('test'))).toBeUndefined()
  })

  it('writes the value with the characters a cookie cannot hold', () => {
    browserCookies.set(cookieName('test'), 'a; b=c', { maxAge: 60 })

    expect(browserCookies.get(cookieName('test'))).toBe('a; b=c')

    browserCookies.set(cookieName('test'), '', { maxAge: 0 })
  })

  it('reads the value of a cookie the page shares the origin with', () => {
    document.cookie = `outside-name=value; path=/`

    expect(browserCookies.get('outside-name')).toBe('value')

    document.cookie = 'outside-name=; path=/; max-age=0'
  })
})
