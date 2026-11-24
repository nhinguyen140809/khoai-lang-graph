'use client'

import { cn } from 'cn'
import { motion, type MotionStyle } from 'motion/react'
import { useCallback, useEffect, useMemo } from 'react'

import { hashOf } from '@/shared/lib/palette'

import { faceSizeClasses } from '../face.constants'
import { useFaceState } from '../hooks/useFaceState'
import { useHumanEyes } from './hooks/useHumanEyes'
import { useHumanFaceArt } from './hooks/useHumanFaceArt'
import {
  eyesCloseMs,
  gazeUnit,
  humanBodyScale,
  humanGazeScale,
  humanLooks,
  humanSoloMotions,
} from './human-face.constants'
import type { HumanFaceProps } from './human-face.types'
import { eyesMotionOf, eyesOf, phaseOf, tokensOf } from './human-face.utils'
import { HumanEyes } from './HumanEyes'

/**
 * The face of a person, drawn beside the face of an agent with the same props. The picture comes
 * from the catalog of the faces (a part that the spec does not name comes from the seed); what
 * moves it is what every face has (see `useFaceState`), with less of the gaze than a face of an
 * agent takes: the body breathes and bounces, the head sways and tilts and turns with the eyes,
 * and the eyes look about, blink, and close while a mood changes the eyes and the mouth. Like the
 * face of an agent, it is hidden from assistive technology, since the name sits beside it.
 */
export function HumanFace({
  seed,
  spec,
  frame = 'circle',
  mood = 'idle',
  drive,
  size = 'default',
  className,
}: HumanFaceProps) {
  const {
    ref,
    isInView,
    isRested,
    isChanging,
    settle,
    look,
    gaze,
    motions,
    poseStyle,
    headStyle,
    bodyStyle,
  } = useFaceState({
    looks: humanLooks,
    mood,
    drive,
    eyesOf: eyesMotionOf,
    phase: phaseOf(hashOf(seed)),
    gazeScale: humanGazeScale,
    bodyScale: humanBodyScale,
  })
  // The eyes have closed after the time that they take to: a change of mood is shown then.
  useEffect(() => {
    if (!isChanging) return
    const timer = setTimeout(settle, eyesCloseMs)
    return () => {
      clearTimeout(timer)
    }
  }, [isChanging, settle])
  const rest = eyesOf(seed, spec)
  const eyes = useHumanEyes(look.eyes, rest, seed)
  const tokens = useMemo(() => tokensOf(spec, seed), [spec, seed])
  const soloMotion = humanSoloMotions[rest]
  const { left, right } = eyes
  const renderEyes = useCallback(
    (place: string | undefined) => (
      <HumanEyes left={left} right={right} place={place} tokens={tokens} motion={soloMotion} />
    ),
    [left, right, tokens, soloMotion],
  )
  const { picture, background } = useHumanFaceArt(seed, spec, { mouth: look.mouth }, renderEyes)

  return (
    <span
      ref={ref}
      aria-hidden
      data-frame={frame}
      style={frame === 'none' ? undefined : { backgroundColor: background }}
      data-slot="human-face"
      data-mood={mood}
      data-resting={isRested || undefined}
      className={cn(
        'relative inline-flex shrink-0',
        frame === 'circle' && 'overflow-hidden rounded-full',
        !isInView && 'face-paused',
        faceSizeClasses[size],
        className,
      )}
    >
      <motion.span data-slot="human-face-body" className="absolute inset-0" style={bodyStyle}>
        <motion.span data-slot="human-face-pose" className="absolute inset-0" style={poseStyle}>
          <motion.span data-slot="human-face-head" className="absolute inset-0" style={headStyle}>
            <motion.span
              data-slot="human-face-picture"
              data-covered={isChanging || undefined}
              data-blinking={motions.isBlinking || undefined}
              className="absolute inset-0"
              style={
                {
                  '--human-face-eye-x': gaze.eye.x,
                  '--human-face-eye-y': gaze.eye.y,
                  '--human-face-unit': `${String(gazeUnit)}px`,
                } as MotionStyle
              }
            >
              {picture}
            </motion.span>
          </motion.span>
        </motion.span>
      </motion.span>
    </span>
  )
}
