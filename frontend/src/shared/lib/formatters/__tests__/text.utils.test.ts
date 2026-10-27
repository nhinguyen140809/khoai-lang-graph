import { describe, expect, it } from 'vitest'

import { capitalize, initialsOf, snakeToSentenceCase } from '../text.utils'
import { capitalizeCases, initialsCases, snakeToSentenceCaseCases } from './text.utils.data'

describe('capitalize', () => {
  it.each(capitalizeCases)('writes $name with a capital', ({ text, capitalized }) => {
    expect(capitalize(text)).toBe(capitalized)
  })
})

describe('snakeToSentenceCase', () => {
  it.each(snakeToSentenceCaseCases)('turns $name into sentence case', ({ key, sentence }) => {
    expect(snakeToSentenceCase(key)).toBe(sentence)
  })
})

describe('initialsOf', () => {
  it.each(initialsCases)('%j gives %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected)
  })
})
