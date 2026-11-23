'use client'

import { easeInOut, useMotionValue, useTransform } from 'motion/react'

import { useClock } from '@/shared/lib/animation'
import { usePrefersReducedMotion } from '@/shared/lib/viewport'

import type { FaceDrive, GazeLook, GazeTiming, GazeValues } from '../../face.types'
import { eyeReach, gazePaths } from '../face-motion.constants'
import { useFade } from './useFade'

const noStops = [[0, 0, 0]] as const

/** A value that goes from `from` to `to` as `weight` goes from 0 to 1. */
function blend(from: number, to: number, weight: number): number {
  return from + (to - from) * weight
}

/**
 * Where the eyes look over time, as the motion of each eye and the turn of the face, from one path
 * that both follow, so that they never drift apart. The path runs from the phase of the face, so
 * that faces side by side do not look together. `gain` says how much of the path is taken: it goes
 * to nothing while a mood changes and back to the value of the gaze when it has, so that a new
 * look grows from rest. The eyes travel farther than the path by `eyeReach`, as much of it as the
 * outline has room for (`reachShare`), so that they look about more than the face turns. A `drive`
 * gives the look over to something outside: by its weight the gaze goes from the path to the point
 * it names, and the eyes and the face follow either the same way. A user who asked for less motion
 * has the eyes keep still. `gazeScale` is how much of every gaze this kind of face takes, as a multiple of
 * the one of the face of an agent (1): a face with drawn eyes takes less, so that it looks about as a
 * picture moves. It is not applied to a look that a `drive` gives, which says where to look.
 */
export function useGaze(
  look: GazeLook,
  { phase, isChanging, isRunning, reachShare }: GazeTiming,
  drive?: FaceDrive['look'],
  gazeScale = 1,
): GazeValues {
  const isStill = usePrefersReducedMotion()
  const path = look.path === null ? null : gazePaths[look.path]
  const stops = path?.stops ?? noStops
  const gainOfLook = isStill ? 0 : look.gain * gazeScale
  const head = look.head

  const time = useMotionValue(phase)
  const none = useMotionValue(0)
  const lookX = drive?.x ?? none
  const lookY = drive?.y ?? none
  const lookWeight = drive?.weight ?? none
  const gain = useFade(gainOfLook, isChanging)

  // A path of no length holds the eyes at one place, with nothing to run.
  useClock(
    time,
    {
      durationMs: path === null || isStill || path.durationMs === 0 ? null : path.durationMs,
      start: phase,
      isMirrored: false,
    },
    isRunning,
  )

  const round = useTransform(time, (value) => value % 1)
  const times = stops.map(([stop]) => stop)
  const right = useTransform(
    round,
    times,
    stops.map(([, x]) => x),
    { ease: easeInOut },
  )
  const down = useTransform(
    round,
    times,
    stops.map(([, , y]) => y),
    { ease: easeInOut },
  )

  const x = useTransform<number, number>([right, gain, lookX, lookWeight], ([r, g, to, w]) =>
    blend((r ?? 0) * (g ?? 0), to ?? 0, isStill ? 0 : (w ?? 0)),
  )
  const y = useTransform<number, number>([down, gain, lookY, lookWeight], ([d, g, to, w]) =>
    blend((d ?? 0) * (g ?? 0), to ?? 0, isStill ? 0 : (w ?? 0)),
  )
  // Looking up and to the left, the top of an eye goes inward; up and to the right, the other way.
  const roll = useTransform<number, number>([x, y], ([a, b]) => (a ?? 0) * (b ?? 0) * 2)
  const rotateY = useTransform(x, (value) => value * (head?.turn ?? 0))
  const rotateX = useTransform(y, (value) => value * (head?.lift ?? 0) + (head?.bow ?? 0))
  const rotateZ = useTransform(x, (value) => value * (head?.roll ?? 0))

  const eyeX = useTransform(x, (value) => value * (1 + (eyeReach.x - 1) * reachShare))
  const eyeY = useTransform(y, (value) => value * (1 + (eyeReach.y - 1) * reachShare))

  return { eye: { x: eyeX, y: eyeY, roll }, head: { rotateX, rotateY, rotateZ } }
}
