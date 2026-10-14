import { describe, expect, it } from 'vitest'

import { initials } from '../account.utils'
import { initialsCases } from './account.utils.data'

describe('initials', () => {
  it.each(initialsCases)('%j gives %j', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
