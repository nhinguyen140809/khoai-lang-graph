'use client'

import { motion } from 'motion/react'

import { useMoveApart } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** Two solid blocks that come together and move apart, as a group does when it is taken apart. */
export function UngroupIcon({ progress, className, stroke }: DrawnIconProps) {
  const { apart, away } = useMoveApart(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.ungroup}>
      <motion.rect
        x="3.5"
        y="3.5"
        width="10"
        height="8"
        rx="1.5"
        fill="currentColor"
        stroke="none"
        style={{ x: away, y: away }}
      />
      <motion.rect
        x="10.5"
        y="12.5"
        width="10"
        height="8"
        rx="1.5"
        fill="currentColor"
        stroke="none"
        style={{ x: apart, y: apart }}
      />
    </IconFrame>
  )
}
