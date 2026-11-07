import { describe, expect, it } from 'vitest'

import { runErrorLabels } from '../run-error.constants'
import { runErrorLabel } from '../run-error.utils'
import { runErrorCodes } from '../runs.types'

describe('runErrorLabel', () => {
  it('labels every code of a failed run', () => {
    for (const code of runErrorCodes) {
      expect(runErrorLabel(code)).toBe(runErrorLabels[code])
    }
  })

  it('gives null for a code the app does not know', () => {
    expect(runErrorLabel('made_up')).toBeNull()
  })
})
