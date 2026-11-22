import { describe, expect, it } from 'vitest'

import { dictationProblemMessage } from '../dictation-problem.utils'

describe('dictationProblemMessage', () => {
  it.each([
    ['not-allowed', /microphone is not allowed/],
    ['no-microphone', /No microphone/],
    ['other', /could not be heard/],
  ] as const)('tells a %s failure in words', (problem, message) => {
    expect(dictationProblemMessage(problem)).toMatch(message)
  })
})
