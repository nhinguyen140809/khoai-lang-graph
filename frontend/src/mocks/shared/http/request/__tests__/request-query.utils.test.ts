import { describe, expect, it } from 'vitest'

import { hasMatchingParam, requestedVersion } from '../request-query.utils'
import { paramMatchCases, requestedVersionCases } from './request-query.utils.data'

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
