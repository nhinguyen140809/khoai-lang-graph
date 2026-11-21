'use client'

import { type MotionValue, useTransform } from 'motion/react'

import type { OrbitShape } from '../act.types'
import { orbitPoint } from '../act.utils'

/** Where a thing is on its ring, at its point of a turn. */
export interface OrbitTracks {
  x: MotionValue<number>
  y: MotionValue<number>
  depth: MotionValue<number>
  seen: MotionValue<number>
}

const noOrbit = { x: 0, y: 0, depth: 0, seen: 1 }

/** The tracks of a thing that goes round the face from `place`, or of one that stays put when it is not on a ring. */
export function useOrbit(
  turn: MotionValue<number>,
  place: { x: number; y: number },
  shape: OrbitShape,
  isOrbit: boolean,
): OrbitTracks {
  const at = useTransform(turn, (value) => (isOrbit ? orbitPoint(value, place, shape) : noOrbit))
  return {
    x: useTransform(at, (point) => point.x),
    y: useTransform(at, (point) => point.y),
    depth: useTransform(at, (point) => point.depth),
    seen: useTransform(at, (point) => point.seen),
  }
}
