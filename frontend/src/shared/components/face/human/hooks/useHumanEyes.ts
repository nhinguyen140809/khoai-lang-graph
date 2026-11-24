'use client'

import { useMachine } from '@xstate/react'
import { useEffect, useMemo } from 'react'

import { hashOf } from '@/shared/lib/palette'

import { humanEyesMachine, stepOf } from '../human-eyes.reducer'
import type { EyeShape, HumanEyesLook } from '../human-face.types'
import { eyeShapeOf } from '../human-face.utils'

/** The eye at the step that its track is at: the eye of the kind that the step asks for, looking the way that it asks. */
function shapeAt(rest: string, track: Parameters<typeof stepOf>[0], pick: number): EyeShape {
  const step = stepOf(track)
  return { ...eyeShapeOf(rest, step.role, pick + track.index), look: step.look ?? null }
}

/**
 * The eyes that a face has right now, one for each side: the eyes that the face has (`rest`, by
 * variant) as the round of steps of its mood asks of each eye, one kind of eye of their family
 * after another (see `humanEyesMachine`). Two eyes at the same step of the same kind take the same
 * eyes, so that they match.
 */
export function useHumanEyes(
  look: HumanEyesLook,
  rest: string,
  seed: string,
): { left: EyeShape; right: EyeShape } {
  const [snapshot, send] = useMachine(humanEyesMachine, { input: { eyes: look } })

  useEffect(() => {
    send({ type: 'LOOK', eyes: look })
  }, [send, look])

  const { left, right } = snapshot.context
  const pick = hashOf(`${seed}:eyes-round`)
  const leftShape = shapeAt(rest, left, pick)
  const rightShape = shapeAt(rest, right, pick)
  // The same drawings stay the same objects, so that nothing is drawn again while the eyes stay.
  return useMemo(
    () => ({ left: leftShape, right: rightShape }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      leftShape.variant,
      leftShape.isFlipped,
      leftShape.look,
      rightShape.variant,
      rightShape.isFlipped,
      rightShape.look,
    ],
  )
}
