'use client'

import { motion } from 'motion/react'

import { useFanOut } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** Three layers that fan out and close up again, as the pages of a pile do when they are leafed through. */
export function LayersIcon({ progress, className, stroke }: DrawnIconProps) {
  const { up, down } = useFanOut(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.layers}>
      <motion.path d="m12 3 9 4.5-9 4.5-9-4.5Z" style={{ y: up }} />
      <path d="m3 12 9 4.5 9-4.5" />
      <motion.path d="m3 16.5 9 4.5 9-4.5" style={{ y: down }} />
    </IconFrame>
  )
}
