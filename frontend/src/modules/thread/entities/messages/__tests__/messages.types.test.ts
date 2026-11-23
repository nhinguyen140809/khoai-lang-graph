import { describe, expect, it } from 'vitest'

import { sentMessage } from '../../threads/__tests__/threads.api.data'
import { messageSchema } from '../messages.types'

describe('messageSchema', () => {
  it('reads a message that leaves out the commands as one that asks for none', () => {
    const withoutCommands: Record<string, unknown> = { ...sentMessage.message }
    delete withoutCommands.commands

    expect(messageSchema.parse(withoutCommands).commands).toEqual([])
  })

  it('reads the UI commands that an answer asks for', () => {
    const answered = {
      ...sentMessage.message,
      commands: [{ command: 'open_settings', artifact_id: null, item_id: null, label: null }],
    }

    expect(messageSchema.parse(answered).commands).toHaveLength(1)
  })
})
