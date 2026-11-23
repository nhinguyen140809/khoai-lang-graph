'use client'

import { useMotionValue } from 'motion/react'
import { useRef, useState } from 'react'

import { Face } from '@/shared/components/face'
import { useIsInView } from '@/shared/lib/viewport'

import { restingLook } from './act.constants'
import { type Act, type ActProp, type FaceMove, type IconKey, slots } from './act.types'
import { ActProps } from './ActProps'
import { useActDrive } from './hooks/useActDrive'

/** How long a round of a demonstration takes: an orbit goes slowly, the rest at the pace of the acts. */
const demoLoopMs = { orbit: 7200, other: 3200 } as const

/**
 * The thing that a demonstration moves. An orbit goes round with dots, which read as a ring, and
 * are the same all round; the other motions use an icon that has a front, a plane, so that a turn,
 * a flip or a shake can be seen.
 */
const demoIcons = { orbit: 'dot', other: 'check' } as const satisfies Record<string, IconKey>

/** How many times a face moves over a round of a demonstration. */
const demoMoveCycles = 3

/** The motions of one demonstration: what the thing does, and how the face moves. All are optional. */
export type MotionDemoMotion = Partial<
  Pick<
    ActProp,
    | 'enter'
    | 'exit'
    | 'slot'
    | 'offset'
    | 'reach'
    | 'distance'
    | 'size'
    | 'course'
    | 'axis'
    | 'tilt'
    | 'turn'
    | 'courseCycles'
    | 'effect'
    | 'effectCycles'
    | 'copies'
  >
> & { move?: FaceMove }

interface MotionDemoProps {
  seed: string
  motion: MotionDemoMotion
  className?: string
}

/**
 * One motion alone: a face with one thing beside it that plays the motion over and over, or a
 * face that moves, so that each name of the vocabulary of the acts can be seen by itself.
 */
export function MotionDemo({ seed, motion, className }: MotionDemoProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useIsInView(ref)
  const gain = useMotionValue(1)
  const { move, ...onThing } = motion
  // One motion for the life of the demonstration, so the act is built once.
  const [act] = useState<Act>(() => ({
    loopMs: motion.course === 'orbit' ? demoLoopMs.orbit : demoLoopMs.other,
    look: restingLook,
    ...(move !== undefined && { move: { move, cycles: demoMoveCycles } }),
    props:
      move === undefined
        ? [
            {
              icon: demoIcons[motion.course === 'orbit' ? 'orbit' : 'other'],
              from: 0,
              to: 1,
              slot: 'right',
              ...onThing,
            },
          ]
        : [],
  }))
  const { drive, round } = useActDrive(act, 0, gain, isInView)

  return (
    <span ref={ref} className={className ?? 'relative inline-flex shrink-0'}>
      <Face seed={seed} mood="working" size="xl" drive={drive} />
      <ActProps act={act} round={round} gain={gain} allowed={slots} size="xl" partner={undefined} />
    </span>
  )
}
