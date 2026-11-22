'use client'

import { motion } from 'motion/react'

import { useFlyAway } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { strokeOf } from './icon.utils'
import { IconFrame } from './IconFrame'

/** The paper plane: it goes up and to the right, smaller as it goes, leaving a dashed trail, over the round. */
export function SendIcon({ progress, className, stroke }: DrawnIconProps) {
  const { x, y, scale, trail } = useFlyAway(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.send}>
      <motion.g style={{ x, y, scale }}>
        <path d="M3 11 21 3l-8 18-2-8z" />
      </motion.g>
      <motion.path
        d="M -3 28 C -0.5 26.8 1.6 24.6 3.3 22 C 4.8 19.7 5.2 17.6 4.2 16.1 C 3.2 14.7 1.4 14.5 0.3 15.8 C -0.9 17.2 -0.6 19.4 1.2 20.4 C 3.4 21.5 6.4 19.4 9 15.8"
        strokeDasharray="2 2"
        pathLength={trail}
        strokeWidth={strokeOf(stroke, 1 / 1.5, iconBounds.send)}
        style={{ opacity: trail }}
      />
    </IconFrame>
  )
}
