'use client'

import { motion } from 'motion/react'

import { useSwingLid } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** Where the hinge is, how long the lid is, how far it leans from the base at rest, and how far it swings to each side, in degrees. */
const lid = { hinge: { x: 15, y: 19 }, length: 14, lean: 68, swing: 9 }

/** A laptop seen from the side, as two strokes: the base, flat, and the lid, slanted from its end like `_/`. The lid opens and closes a little. */
export function LaptopIcon({ progress, className, stroke }: DrawnIconProps) {
  const { x2, y2 } = useSwingLid(progress, lid)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.laptop}>
      <path d={`M3 ${String(lid.hinge.y)}H${String(lid.hinge.x)}`} />
      <motion.line x1={lid.hinge.x} y1={lid.hinge.y} x2={x2} y2={y2} />
    </IconFrame>
  )
}
