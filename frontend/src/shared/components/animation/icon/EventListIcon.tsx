'use client'

import { motion } from 'motion/react'

import { useSlideUp } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** How many rows there are in all: they fill the height while the rows slide up by one repeat of two. */
const rowCount = 6

/** How the rows slide up: where the first is, how far apart they are, how many of them the round slides by, and where they fade at the top and at the bottom. */
const sliding = {
  top: 4,
  gap: 8,
  rowsPerRound: 2,
  edges: { top: 0.5, bottom: 23.5, fade: 3 },
}

/**
 * A list of events that slides up without end, as lines of text do: a row comes in at the bottom
 * as another goes out at the top. A row is a line at the left, for what happens, and a solid block
 * at the right, for when.
 */
export function EventListIcon({ progress, className, stroke }: DrawnIconProps) {
  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.eventList}>
      {Array.from({ length: rowCount }, (_, index) => (
        <SlidingRow key={index} progress={progress} index={index} />
      ))}
    </IconFrame>
  )
}

/** A row of events that slides up, seen less as it comes to the top or the bottom. */
function SlidingRow({ progress, index }: { progress: DrawnIconProps['progress']; index: number }) {
  const { y, opacity } = useSlideUp(progress, { index, ...sliding })

  return (
    <motion.g style={{ y, opacity }}>
      <path d="M3 0h8" />
      <rect x="15" y="-3" width="6" height="6" rx="1.5" fill="currentColor" stroke="none" />
    </motion.g>
  )
}
