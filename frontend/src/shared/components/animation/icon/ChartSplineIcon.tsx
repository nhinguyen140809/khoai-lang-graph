'use client'

import { motion } from 'motion/react'

import { useDrawIn } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The curve, from its left end to its right end. */
const curve = 'M3 16C6 16 6.5 8 10 8S14 15.5 16.5 15.5 19.5 7 21 6'

/** A single smooth curve with no axes, drawn from left to right in the first part of the round, with a dot at its end, as the line of a chart is. */
export function ChartSplineIcon({ progress, className, stroke }: DrawnIconProps) {
  const line = useDrawIn(progress, 0.05, 0.7)
  const dot = useDrawIn(progress, 0.65, 0.8)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.chartSpline}>
      <motion.path d={curve} pathLength={line} />
      <motion.circle
        cx="21"
        cy="6"
        r="1.6"
        fill="currentColor"
        stroke="none"
        style={{ opacity: dot }}
      />
    </IconFrame>
  )
}
