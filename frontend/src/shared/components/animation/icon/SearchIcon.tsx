'use client'

import { motion } from 'motion/react'

import { useHop } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The magnifying glass: it hops up and settles back to the side as `progress` goes from 0 to 1. */
export function SearchIcon({ progress, className, stroke }: DrawnIconProps) {
  const { x, y } = useHop(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.search}>
      <motion.g style={{ x, y }}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </motion.g>
    </IconFrame>
  )
}
