import { describe, expect, it } from 'vitest'

import { nameFromMessage } from '../messages.utils'
import { nameFromMessageCases } from './messages.utils.data'

describe('nameFromMessage', () => {
  it.each(nameFromMessageCases)(
    'names a project or a thread from $name',
    ({ content, projectName }) => {
      expect(nameFromMessage(content)).toBe(projectName)
    },
  )
})
