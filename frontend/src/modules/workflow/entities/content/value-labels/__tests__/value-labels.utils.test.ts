import { describe, expect, it } from 'vitest'

import { nonStatusTone, valueLabel, valueTone } from '../value-labels.utils'

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

describe('valueTone', () => {
  it('gives the tone written for the field', () => {
    expect(valueTone('persona.interview_status', 'in_progress')).toBe('primary')
    expect(valueTone('persona.interview_status', 'completed')).toBe('success')
  })

  it('reads a value without a row in the neutral tone', () => {
    expect(valueTone('persona.interview_status', 'withdrawn')).toBe('neutral')
    expect(valueTone('note.mood', 'calm')).toBe('neutral')
  })
})

describe('nonStatusTone', () => {
  it('gives the first place the primary tone, then every tone that is not a status, in turn', () => {
    expect([0, 1, 2, 3, 4, 5].map(nonStatusTone)).toEqual([
      'primary',
      'chart',
      'accent',
      'muted',
      'neutral',
      'primary',
    ])
  })

  it('never gives a tone of a status', () => {
    for (const place of Array.from({ length: 12 }, (_, index) => index)) {
      expect(nonStatusTone(place)).not.toBe('success')
      expect(nonStatusTone(place)).not.toBe('warning')
      expect(nonStatusTone(place)).not.toBe('destructive')
    }
  })
})
