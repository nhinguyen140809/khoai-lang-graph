'use client'

import { cn } from 'cn'
import { motion } from 'motion/react'

import { hashOf } from '@/shared/lib/palette'

import { faceSizeClasses } from '../face.constants'
import { useFaceState } from '../hooks/useFaceState'
import { humanGazeScale, humanLooks } from './human-face.constants'
import type { HumanFaceProps } from './human-face.types'
import { eyesMotionOf, phaseOf } from './human-face.utils'

/** The units that the face is drawn in, as a square of this many. */
const units = 32

/**
 * The face of a person, drawn beside the face of an agent with the same props. It is a sketch for
 * now: a head on shoulders, with two eyes, drawn in the colors of the interface, which stands for
 * the art that will draw it. What it does with its parts is the point: the body (the shoulders)
 * breathes and bounces, the head sways and tilts and turns with the eyes, and the eyes look
 * about, blink and close while a mood changes, all of them from what every face has (see
 * `useFaceState`), with less of the gaze than a face of an agent takes. Like the face of an agent,
 * it is hidden from assistive technology, since the name sits beside it.
 */
export function HumanFace({
  seed,
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
  })
  const { isEyesShut = false } = look

  return (
    <span
      ref={ref}
      aria-hidden
      data-slot="human-face"
      data-mood={mood}
      data-resting={isRested || undefined}
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden',
        !isInView && 'face-paused',
        faceSizeClasses[size],
        className,
      )}
    >
      <motion.span data-slot="human-face-body" className="absolute inset-0" style={bodyStyle}>
        <svg viewBox={`0 0 ${String(units)} ${String(units)}`} className="size-full fill-muted">
          <ellipse cx="16" cy="32" rx="14" ry="9" />
        </svg>
      </motion.span>
      <motion.span data-slot="human-face-pose" className="absolute inset-0" style={poseStyle}>
        <motion.span data-slot="human-face-head" className="absolute inset-0" style={headStyle}>
          <svg viewBox={`0 0 ${String(units)} ${String(units)}`} className="size-full">
            <circle cx="16" cy="14" r="9" className="fill-secondary" />
            <g
              className={cn('face-squash', isChanging && 'scale-y-10 face-squash-closing')}
              style={{ transformBox: 'view-box', transformOrigin: 'center' }}
              onTransitionEnd={(event) => {
                if (event.target === event.currentTarget && isChanging) settle()
              }}
            >
              <g
                className={cn(
                  motions.isBlinking && 'animate-face-blink motion-reduce:animate-none',
                )}
                style={{ transformBox: 'view-box', transformOrigin: 'center' }}
              >
                <motion.g
                  data-slot="human-face-eyes"
                  data-shut={isEyesShut || undefined}
                  className="fill-foreground"
                  style={{ x: gaze.eye.x, y: gaze.eye.y }}
                >
                  {[12, 20].map((cx) => (
                    <ellipse key={cx} cx={cx} cy="14" rx="1.4" ry={isEyesShut ? 0.3 : 1.8} />
                  ))}
                </motion.g>
              </g>
            </g>
          </svg>
        </motion.span>
      </motion.span>
    </span>
  )
}
