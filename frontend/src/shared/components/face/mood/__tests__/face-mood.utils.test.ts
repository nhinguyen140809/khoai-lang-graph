import { describe, expect, it } from 'vitest'

import { moods } from '../../face.types'
import { moodOfState } from '../face-mood.utils'

describe('moodOfState', () => {
  it.each(moods)('keeps the mood %s', (mood) => {
    expect(moodOfState(mood)).toBe(mood)
  })

  it('names the mood that a face comes to rest in', () => {
    expect(moodOfState('resting-idle')).toBe('idle')
    expect(moodOfState('resting-happy')).toBe('happy')
  })

  it('names the mood that goes through a step', () => {
    expect(moodOfState('thinking-long')).toBe('thinking')
    expect(moodOfState('thinking-squint')).toBe('thinking')
  })
})
