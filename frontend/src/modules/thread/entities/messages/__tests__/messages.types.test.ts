import { describe, expect, it } from 'vitest'

import { sentMessage } from '../../threads/__tests__/threads.api.data'
import { sentMessageSchema } from '../messages.types'

describe('sentMessageSchema', () => {
  it('reads an answer that leaves out the commands as one that asks for none', () => {
    const { message, run } = sentMessage

    expect(sentMessageSchema.parse({ message, run }).commands).toEqual([])
  })

  it('reads the UI commands that an answer asks for', () => {
    const answered = {
      ...sentMessage,
      commands: [{ command: 'open_settings', artifact_id: null, item_id: null, label: null }],
    }

    expect(sentMessageSchema.parse(answered).commands).toHaveLength(1)
  })
})
