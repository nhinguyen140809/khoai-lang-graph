import { describe, expect, it } from 'vitest'

import { valueLabel } from '../value-labels.utils'

describe('valueLabel', () => {
  it('gives the label written for the field, in each view', () => {
    expect(valueLabel('interview_transcript.stop_reason', 'max_turns')).toEqual({
      developer: 'Max turns',
      user: 'Turn limit reached',
    })
  })

  it('reads the same value differently for two fields', () => {
    expect(valueLabel('ambiguity_issue.status', 'open').user).toBe('Not clarified')
    expect(valueLabel('conflict.status', 'open').user).toBe('Not decided')
    expect(valueLabel('validation_issue.status', 'open').user).toBe('To be fixed')
  })

  it('gives the value in sentence case for a field with no labels', () => {
    expect(valueLabel('note.mood', 'needs_work')).toEqual({
      developer: 'Needs work',
      user: 'Needs work',
    })
  })

  it('gives the value in sentence case for a value the field has no label for', () => {
    expect(valueLabel('conflict.severity', 'critical').user).toBe('Critical')
  })
})
