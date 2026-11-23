'use client'

import { motion } from 'motion/react'

import { useDipIntoTray } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** A tray with an arrow into it: the arrow dips into the tray and comes back, as `progress` goes from 0 to 1. */
export function DownloadIcon({ progress, className, stroke }: DrawnIconProps) {
  const y = useDipIntoTray(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.download}>
      <path d="M5 20h14" />
      <motion.g style={{ y }}>
        <path d="m7 11 5 5 5-5" />
        <path d="M12 4v12" />
      </motion.g>
    </IconFrame>
  )
}
