import { describe, expect, it } from 'vitest'

import { initials } from '../account.utils'

describe('initials', () => {
  it.each([
    ['Linh Pham', 'LP'],
    ['an tran van', 'AV'],
    ['Linh', 'L'],
    ['  Linh   Pham  ', 'LP'],
    ['', '?'],
    ['   ', '?'],
  ])('%j gives %j', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
