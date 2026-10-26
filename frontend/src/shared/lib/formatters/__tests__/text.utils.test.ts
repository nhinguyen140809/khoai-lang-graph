import { describe, expect, it } from 'vitest'

import { initials } from '../text.utils'
import { initialsCases } from './text.utils.data'

describe('initials', () => {
  it.each(initialsCases)('%j gives %j', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})
