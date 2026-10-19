import { describe, expect, it } from 'vitest'

import { initials } from '../user.utils'
import { initialsCases } from './user.utils.data'

describe('initials', () => {
  it.each(initialsCases)('%j gives %j', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
