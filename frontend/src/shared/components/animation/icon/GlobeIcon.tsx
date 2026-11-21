'use client'

import { motion } from 'motion/react'

import { useTurnMeridian } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** A globe whose meridian turns as the globe does: it goes from a line to a full curve and back. */
export function GlobeIcon({ progress, className, stroke }: DrawnIconProps) {
  const rx = useTurnMeridian(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.globe}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <motion.ellipse cx="12" cy="12" ry="9" rx={rx} />
    </IconFrame>
  )
}
