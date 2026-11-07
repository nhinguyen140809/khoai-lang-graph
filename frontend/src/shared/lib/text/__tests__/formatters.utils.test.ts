import { describe, expect, it } from 'vitest'

import { capitalize, initialsOf, jsonToPlainText, snakeToSentenceCase } from '../formatters.utils'
import {
  capitalizeCases,
  initialsCases,
  jsonToPlainTextCases,
  snakeToSentenceCaseCases,
} from './formatters.utils.data'

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

describe('jsonToPlainText', () => {
  it.each(jsonToPlainTextCases)('writes $name', ({ value, text }) => {
    expect(jsonToPlainText(value)).toBe(text)
  })
})
