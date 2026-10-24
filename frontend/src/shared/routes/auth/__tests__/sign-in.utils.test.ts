import { describe, expect, it } from 'vitest'

import { nextParam, safeNextPath, signInHrefFor } from '../sign-in.utils'
import {
  authHrefCases,
  keptNextPaths,
  nextParamCases,
  replacedNextPaths,
  signInHrefForCases,
} from './sign-in.utils.data'

describe('safeNextPath', () => {
  it.each(keptNextPaths)('keeps %j', (next) => {
    expect(safeNextPath(next)).toBe(next)
  })

  it.each(replacedNextPaths)('replaces %j with the home page', (next) => {
    expect(safeNextPath(next)).toBe('/')
  })
})

describe('signInHref and registerHref', () => {
  it.each(authHrefCases)('$name gives $href', ({ build, next, href }) => {
    expect(build(next)).toBe(href)
  })
})

describe('signInHrefFor', () => {
  it.each(signInHrefForCases)('$name', ({ location, href }) => {
    expect(signInHrefFor(location)).toBe(href)
  })
})

describe('nextParam', () => {
  it.each(nextParamCases)('reads $name of next', ({ query, next }) => {
    expect(nextParam(query)).toBe(next)
  })
})
