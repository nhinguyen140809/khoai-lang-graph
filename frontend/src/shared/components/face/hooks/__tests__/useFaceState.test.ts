import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { type FaceLooks, type Mood, moods, type MotionLook } from '../../face.types'
import { useFaceState } from '../useFaceState'

const looks: FaceLooks<MotionLook> = {
  ...(Object.fromEntries(moods.map((mood) => [mood, { gaze: 'still' }])) as Record<
    Mood,
    MotionLook
  >),
  idle: { gaze: 'drift', body: 'breathe' },
  'resting-idle': { gaze: 'toward' },
}

const eyesOf = () => ({ lives: ['steady', 'steady'] as const, canBlink: true })

function stateOf(input: Partial<Parameters<typeof useFaceState<MotionLook>>[0]> = {}) {
  return renderHook(() => useFaceState({ looks, mood: 'idle', eyesOf, phase: 0, ...input })).result
    .current
}

describe('useFaceState', () => {
  it('takes the look of the mood', () => {
    expect(stateOf().look).toEqual(looks.idle)
    expect(stateOf().state).toBe('idle')
  })

  it('takes the look of a state that the kind of face has a look for', () => {
    const face = stateOf({ state: 'resting-idle' })

    expect(face.look.gaze).toBe('toward')
    expect(face.isRested).toBe(true)
  })

  it('takes the look of the mood for a state that it has no look for', () => {
    const face = stateOf({ mood: 'happy', state: 'resting-happy' })

    expect(face.look).toEqual(looks.happy)
    expect(face.isRested).toBe(true)
  })

  it('says otherwise for the parts that an override gives', () => {
    expect(stateOf({ override: { body: 'bounce' } }).look).toEqual({
      gaze: 'drift',
      body: 'bounce',
    })
  })

  it('is not at rest in a mood that does not come to rest', () => {
    expect(stateOf({ mood: 'working' }).isRested).toBe(false)
  })
})
