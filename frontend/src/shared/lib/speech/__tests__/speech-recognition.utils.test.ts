import { describe, expect, it } from 'vitest'

import { speechProblemOf, transcriptOf } from '../speech-recognition.utils'

describe('transcriptOf', () => {
  it('joins what was heard in one text, the words not yet final included', () => {
    const results = [
      { isFinal: true, 0: { transcript: 'make a' } },
      { isFinal: false, 0: { transcript: ' mentor   app' } },
    ]

    expect(transcriptOf(results)).toBe('make a mentor app')
  })

  it('is empty when nothing was heard', () => {
    expect(transcriptOf([])).toBe('')
  })
})

describe('speechProblemOf', () => {
  it.each([
    ['not-allowed', 'not-allowed'],
    ['service-not-allowed', 'not-allowed'],
    ['audio-capture', 'no-microphone'],
    ['network', 'other'],
  ])('reads %s as %s', (error, problem) => {
    expect(speechProblemOf(error)).toBe(problem)
  })
})
