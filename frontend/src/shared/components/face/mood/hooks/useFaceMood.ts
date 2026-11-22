'use client'

import { useMachine } from '@xstate/react'
import { useEffect } from 'react'

import { usePrefersReducedMotion } from '@/shared/lib/viewport'

import type { FaceState, Mood } from '../../face.types'
import { faceMoodMachine } from '../face-mood.reducer'

/**
 * The state a face shows for the mood it is given, and what the blink that covers a change needs:
 * whether a change is being covered (`isChanging`) and `settle`, to say that the eyes have closed.
 * A change starts the cover on the render that gives the new mood, not a render later; a user who
 * asked for less motion has it at once, with nothing to cover.
 */
export function useFaceMood(mood: Mood): {
  shown: FaceState
  isChanging: boolean
  settle: () => void
} {
  const isStill = usePrefersReducedMotion()
  const [snapshot, send] = useMachine(faceMoodMachine, { input: { mood } })

  useEffect(() => {
    send({ type: 'MOOD', mood, isStill })
  }, [send, mood, isStill])

  const isPending = mood !== snapshot.context.mood
  return {
    shown: isStill && isPending ? mood : snapshot.context.shown,
    isChanging: !isStill && (isPending || snapshot.matches('covering')),
    settle: () => {
      send({ type: 'SETTLE' })
    },
  }
}
