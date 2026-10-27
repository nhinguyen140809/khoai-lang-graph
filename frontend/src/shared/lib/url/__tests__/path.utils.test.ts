import { describe, expect, it } from 'vitest'

import { isAtOrUnder, pathOf, pathWithQuery } from '../path.utils'
import { isAtOrUnderCases, pathOfCases, pathWithQueryCases } from './path.utils.data'

describe('pathOf', () => {
  it.each(pathOfCases)('gives the path of %j', (href, path) => {
    expect(pathOf(href)).toBe(path)
  })
})

describe('isAtOrUnder', () => {
  it.each(isAtOrUnderCases)(
    '$pathname is at or under $path: $holds',
    ({ pathname, path, holds }) => {
      expect(isAtOrUnder(pathname, path)).toBe(holds)
    },
  )
})

describe('pathWithQuery', () => {
  it.each(pathWithQueryCases)('makes an address from $name', ({ path, params, address }) => {
    expect(pathWithQuery(path, params)).toBe(address)
  })
})
