import { describe, expect, it } from 'vitest'

import { hasMatchingParam, pathnameOf, queryOf, requestedVersion } from '../request-query.utils'
import {
  namedVersionCases,
  paramMatchCases,
  pathnameOfCases,
  queryOfCases,
  requestedVersionCases,
} from './request-query.utils.data'

describe('hasMatchingParam', () => {
  it.each(paramMatchCases)('tells a record with $name', ({ query, param, value, passes }) => {
    expect(hasMatchingParam(new URLSearchParams(query), param, value)).toBe(passes)
  })
})

describe('requestedVersion', () => {
  it.each(requestedVersionCases)('reads $name', ({ address, version }) => {
    expect(requestedVersion(new Request(address))).toBe(version)
  })
})

describe('requestedVersion with a parameter name', () => {
  it.each(namedVersionCases)('reads $name', ({ address, param, version }) => {
    expect(requestedVersion(new Request(address), param)).toBe(version)
  })
})

describe('queryOf', () => {
  it.each(queryOfCases)('reads $name', ({ address, query }) => {
    expect(queryOf(new Request(address)).toString()).toBe(query)
  })
})

describe('pathnameOf', () => {
  it.each(pathnameOfCases)('reads $name', ({ address, pathname }) => {
    expect(pathnameOf(new Request(address))).toBe(pathname)
  })
})
