import { describe, expect, it } from 'vitest'

import { capitalize, initialsOf } from '../text.utils'
import { capitalizeCases, initialsCases } from './text.utils.data'

describe('capitalize', () => {
  it.each(capitalizeCases)('writes $name with a capital', ({ text, capitalized }) => {
    expect(capitalize(text)).toBe(capitalized)
  })
})

describe('initialsOf', () => {
  it.each(initialsCases)('%j gives %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected)
  })
})
