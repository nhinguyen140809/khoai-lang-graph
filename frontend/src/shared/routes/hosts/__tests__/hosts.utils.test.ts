import { describe, expect, it } from 'vitest'

import { addressOfAreaPath, areaPathOf, hostOfView, isAreaPath, viewOfHost } from '../hosts.utils'
import { addressCases, areaPathCases, hostCases, hostOfViewCases } from './hosts.utils.data'

describe('viewOfHost', () => {
  it.each(hostCases)('shows the $view view on $host', ({ host, view }) => {
    expect(viewOfHost(host)).toBe(view)
  })
})

describe('areaPathOf', () => {
  it.each(areaPathCases)('names the page of each view for $address', (testCase) => {
    expect(areaPathOf('developer', testCase.address)).toBe(testCase.developer)
    expect(areaPathOf('user', testCase.address)).toBe(testCase.user)
  })
})

describe('isAreaPath', () => {
  it.each(addressCases)('is $isArea for $path', ({ path, isArea }) => {
    expect(isAreaPath(path)).toBe(isArea)
  })
})

describe('addressOfAreaPath', () => {
  it.each(addressCases)('gives $address for $path', ({ path, address }) => {
    expect(addressOfAreaPath(path)).toBe(address)
  })
})

describe('hostOfView', () => {
  it.each(hostOfViewCases)('gives $user and $developer from $host', ({ host, user, developer }) => {
    expect(hostOfView('user', host)).toBe(user)
    expect(hostOfView('developer', host)).toBe(developer)
  })
})
