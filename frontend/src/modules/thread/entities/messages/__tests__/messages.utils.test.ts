import { describe, expect, it } from 'vitest'

import { messageDeliveryNote } from '../messages.utils'
import { messageDeliveryNoteCases } from './messages.utils.data'

describe('messageDeliveryNote', () => {
  it.each(messageDeliveryNoteCases)('$name', ({ delivery, runStatus, note }) => {
    expect(messageDeliveryNote({ delivery }, runStatus)?.developer ?? null).toBe(note)
  })
})
