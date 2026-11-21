'use client'

import { motion } from 'motion/react'

import { useDrawIn } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { strokeOf } from './icon.utils'
import { IconFrame } from './IconFrame'

/** A tick that is drawn in the first half of the round and stays. */
export function CheckIcon({ progress, className, stroke }: DrawnIconProps) {
  const tick = useDrawIn(progress, 0.05, 0.45)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.check}>
      <motion.path
        d="m4 12.5 5 5L20 6.5"
        pathLength={tick}
        strokeWidth={strokeOf(stroke, 2.5 / 1.5, iconBounds.check)}
      />
    </IconFrame>
  )
}
