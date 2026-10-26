import { describe, expect, it } from 'vitest'

import { afterLoginPath, loginHrefFor, nextParam } from '../auth-hrefs.utils'
import {
  authHrefCases,
  keptNextPaths,
  nextParamCases,
  replacedNextPaths,
  loginHrefForCases,
} from './auth-hrefs.utils.data'

describe('safeNextPath', () => {
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

describe('nextParam', () => {
  it.each(nextParamCases)('reads $name of next', ({ query, next }) => {
    expect(nextParam(query)).toBe(next)
  })
})
