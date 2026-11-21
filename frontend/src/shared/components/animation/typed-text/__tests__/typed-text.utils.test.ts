import { describe, expect, it } from 'vitest'

import { typedTextMs, wordsOf } from '../typed-text.utils'

describe('wordsOf', () => {
  it('splits a text at its spaces and leaves out the empty words', () => {
    expect(wordsOf('What  do you build?')).toEqual(['What', 'do', 'you', 'build?'])
    expect(wordsOf('')).toEqual([])
  })
})

describe('typedTextMs', () => {
  it('lasts from the start of the first word to the end of the last', () => {
    expect(typedTextMs('one two three', { step: 100, wordDuration: 400 })).toBe(600)
  })

  it('adds the delay, and is nothing for a text without words', () => {
    expect(typedTextMs('one', { step: 100, wordDuration: 400, delay: 50 })).toBe(450)
    expect(typedTextMs('')).toBe(0)
  })
})
