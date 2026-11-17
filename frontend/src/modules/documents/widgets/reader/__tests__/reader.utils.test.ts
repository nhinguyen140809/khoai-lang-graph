import { describe, expect, it } from 'vitest'

import { isSameView, readerAddress, readerViewOf } from '../reader.utils'
import { addressCases, sameViewCases, viewCases } from './reader.utils.data'

describe('readerViewOf', () => {
  it.each(viewCases)('reads $name', ({ params, view }) => {
    expect(readerViewOf(params)).toEqual(view)
  })
})

describe('isSameView', () => {
  it.each(sameViewCases)('is $isSame for $name', ({ first, second, isSame }) => {
    expect(isSameView(first, second)).toBe(isSame)
  })
})

describe('readerAddress', () => {
  it.each(addressCases)('opens the reader on $name', ({ view, address }) => {
    expect(readerAddress('/projects/p1', view)).toBe(address)
  })
})
