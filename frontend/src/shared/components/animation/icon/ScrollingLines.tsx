'use client'

import { motion } from 'motion/react'

import { useSlideUp } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The lengths of the three lines that repeat, in units of the frame. */
const lengths = [16, 10, 13] as const

/** The side that the lines of text line up on. */
type TextAlign = 'left' | 'center' | 'right'

/** Where a line of a length starts, for each way that lines line up, within the 24 units of the frame (the lines keep 4 in from its edges). */
const lineStarts: Record<TextAlign, (length: number) => number> = {
  left: () => 4,
  center: (length) => 12 - length / 2,
  right: (length) => 20 - length,
}

/** How many lines there are in all, which fill the height while the lines slide up by one repeat of three. */
const lineCount = 8

/** How the lines slide up: where the first is, how far apart they are, how many of them the round slides by, and where they fade at the top and at the bottom. */
const sliding = {
  top: 4,
  gap: 5,
  rowsPerRound: lengths.length,
  edges: { top: 1, bottom: 22, fade: 3 },
}

/**
 * Lines of text that slide up without end: a line comes in at the bottom as another goes out at
 * the top, all while they slide. Three lengths repeat, and the round slides by that many lines, so
 * the end of the round looks as its start does.
 */
export function ScrollingLines({
  progress,
  className,
  stroke,
  align,
}: DrawnIconProps & { align: TextAlign }) {
  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.text}>
      {Array.from({ length: lineCount }, (_, index) => (
        <SlidingLine key={index} progress={progress} index={index} align={align} />
      ))}
    </IconFrame>
  )
}

/** A line of text that slides up, seen less as it comes to the top or the bottom. */
function SlidingLine({
  progress,
  index,
  align,
}: {
  progress: DrawnIconProps['progress']
  index: number
  align: TextAlign
}) {
  const length = lengths[index % lengths.length] ?? 0
  const { y, opacity } = useSlideUp(progress, { index, ...sliding })

  return (
    <motion.path
      d={`M${String(lineStarts[align](length))} 0h${String(length)}`}
      style={{ y, opacity }}
    />
  )
}
