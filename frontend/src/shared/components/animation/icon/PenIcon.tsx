'use client'

import { motion } from 'motion/react'

import { useWriteAcross } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** How many times the pen goes across while `progress` goes from 0 to 1, how far its point goes to each side, and how far the other end leans behind it, in degrees. */
const writing = { strokes: 4, reach: 1.8, lean: 8 }

/** Where the point of the pen is, as shares (from 0 to 1) of the box of the pen from its left and its top: the end that stays on its line while the other end turns. */
const nib = { x: 0.016, y: 0.984 }

/** A solid pen alone, that writes: its point goes to and fro across, and the other end leans behind it, turning about the point as the point changes its way. */
export function PenIcon({ progress, className, stroke }: DrawnIconProps) {
  const { x, rotate } = useWriteAcross(progress, writing)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.pen}>
      <motion.g style={{ x }}>
        <motion.path
          d="M21.2 6.8a1 1 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5z"
          fill="currentColor"
          stroke="none"
          style={{ rotate, originX: nib.x, originY: nib.y }}
        />
      </motion.g>
    </IconFrame>
  )
}
