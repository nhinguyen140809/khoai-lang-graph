import { describe, expect, it } from 'vitest'

import { addressOfTreePath, isTreePath, treePathOf, viewOfHost } from '../view-tree.utils'
import { addressCases, hostCases, treePathCases } from './view-tree.utils.data'

describe('viewOfHost', () => {
  it.each(hostCases)('shows the $view view on $host', ({ host, view }) => {
    expect(viewOfHost(host)).toBe(view)
  })
})

describe('treePathOf', () => {
  it.each(treePathCases)('names the page of each view for $address', (testCase) => {
    expect(treePathOf('developer', testCase.address)).toBe(testCase.developer)
    expect(treePathOf('user', testCase.address)).toBe(testCase.user)
  })
})

describe('isTreePath', () => {
  it.each(addressCases)('is $isTree for $path', ({ path, isTree }) => {
    expect(isTreePath(path)).toBe(isTree)
  })
})

describe('addressOfTreePath', () => {
  it.each(addressCases)('gives $address for $path', ({ path, address }) => {
    expect(addressOfTreePath(path)).toBe(address)
  })
})
