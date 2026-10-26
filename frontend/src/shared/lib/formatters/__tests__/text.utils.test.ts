import { describe, expect, it } from 'vitest'

import { initialsOf } from '../text.utils'
import { initialsCases } from './text.utils.data'

describe('initials', () => {
  it.each(initialsCases)('%j gives %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected)
  })
})
