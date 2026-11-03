import { describe, expect, it } from 'vitest'

import { subjectKeyOfMessage } from '../item-keys.utils'
import { messageKeyCases } from './item-keys.utils.data'

describe('subjectKeyOfMessage', () => {
  it.each(messageKeyCases)('reads $name', ({ key, subject }) => {
    expect(subjectKeyOfMessage(key)).toBe(subject)
  })
})
