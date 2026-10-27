import { describe, expect, it } from 'vitest'

import { afterLoginPath, loginHrefFor } from '../auth-hrefs.utils'
import {
  authHrefCases,
  keptNextPaths,
  loginHrefForCases,
  replacedNextPaths,
} from './auth-hrefs.utils.data'

describe('afterLoginPath', () => {
  it.each(keptNextPaths)('keeps %j', (next) => {
    expect(afterLoginPath(next)).toBe(next)
  })

  it.each(replacedNextPaths)('replaces %j with the home page', (next) => {
    expect(afterLoginPath(next)).toBe('/')
  })
})

describe('loginHref and registerHref', () => {
  it.each(authHrefCases)('$name gives $href', ({ build, next, href }) => {
    expect(build(next)).toBe(href)
  })
})

describe('loginHrefFor', () => {
  it.each(loginHrefForCases)('$name', ({ location, href }) => {
    expect(loginHrefFor(location)).toBe(href)
  })
})
