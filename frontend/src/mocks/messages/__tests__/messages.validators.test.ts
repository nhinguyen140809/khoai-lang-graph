import { describe, expect, it } from 'vitest'

import { validateSentMessageBody } from '../messages.validators'
import { sentMessageCases, sentMessageProblemCases } from './messages.validators.data'

describe('validateSentMessageBody', () => {
  it.each(sentMessageCases)('reads $name', ({ body, message }) => {
    expect(validateSentMessageBody(body)).toEqual({ message })
  })

  it.each(sentMessageProblemCases)('refuses $name', ({ body, problems }) => {
    expect(validateSentMessageBody(body)).toEqual({ problems })
  })
})
