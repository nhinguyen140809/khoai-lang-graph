'use client'

import { motion } from 'motion/react'

import { useDrawIn, useLightUp } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { strokeOf } from './icon.utils'
import { IconFrame } from './IconFrame'

/** A thick line that is drawn from one solid dot to another, and the two dots that light up as it reaches them. */
export function NodesIcon({ progress, className, stroke }: DrawnIconProps) {
  const line = useDrawIn(progress, 0.15, 0.6)
  const first = useLightUp(progress, 0, 0.3)
  const second = useLightUp(progress, 0.5, 0.9)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.nodes}>
      <motion.path
        d="M7 17 17 7"
        pathLength={line}
        strokeWidth={strokeOf(stroke, 2, iconBounds.nodes)}
      />
      <motion.circle cx="6" cy="18" r="4" fill="currentColor" style={{ opacity: first }} />
      <motion.circle cx="18" cy="6" r="4" fill="currentColor" style={{ opacity: second }} />
    </IconFrame>
  )
}
