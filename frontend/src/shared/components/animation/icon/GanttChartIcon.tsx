'use client'

import { motion } from 'motion/react'

import { useSlideToAndFro } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The bars of the chart: the row of each, where it rests, how long it is, how far it slides to either side, and where along the round it is at the right of its sliding. */
const bars = [
  { y: 4.5, x: 5, width: 8, reach: 2.5, phase: 0 },
  { y: 10.5, x: 9, width: 9, reach: 2.5, phase: 0.33 },
  { y: 16.5, x: 6, width: 7, reach: 2.5, phase: 0.66 },
] as const

/** How tall a bar is. */
const barHeight = 3

/** A chart of tasks along a time, with no axes: horizontal solid bars, each sliding to and fro in its own time, as a plan is moved about. */
export function GanttChartIcon({ progress, className, stroke }: DrawnIconProps) {
  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.gantt}>
      {bars.map((bar) => (
        <SlidingBar key={bar.y} progress={progress} {...bar} />
      ))}
    </IconFrame>
  )
}

/** A bar of the chart that slides to and fro. */
function SlidingBar({
  progress,
  y,
  x,
  width,
  reach,
  phase,
}: { progress: DrawnIconProps['progress'] } & (typeof bars)[number]) {
  const slid = useSlideToAndFro(progress, reach, phase)

  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={barHeight}
      rx="1.2"
      fill="currentColor"
      stroke="none"
      style={{ x: slid }}
    />
  )
}
