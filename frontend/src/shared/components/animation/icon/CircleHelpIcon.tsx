'use client'

import { motion } from 'motion/react'

import { useShake } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The question mark in a circle: the mark shakes from side to side as `progress` goes from 0 to 1. */
export function CircleHelpIcon({ progress, className, stroke }: DrawnIconProps) {
  const rotate = useShake(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.circleHelp}>
      <circle cx="12" cy="12" r="10" />
      <motion.g style={{ rotate, transformBox: 'fill-box', transformOrigin: 'center' }}>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </motion.g>
    </IconFrame>
  )
}
