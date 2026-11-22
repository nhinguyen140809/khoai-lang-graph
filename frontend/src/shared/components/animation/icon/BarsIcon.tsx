'use client'

import { motion } from 'motion/react'

import { useRiseAndFall } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The bars: where each stands, how tall it is, and where it is along the round when it is at its highest. */
const bars = [
  { x: 5, y: 12, height: 8, phase: 0 },
  { x: 10.5, y: 5, height: 15, phase: 0.33 },
  { x: 16, y: 9, height: 11, phase: 0.66 },
] as const

/** Solid vertical bars that rise and fall each at its own time, with no axes, as figures do when they are weighed. */
export function BarsIcon({ progress, className, stroke }: DrawnIconProps) {
  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.bars}>
      {bars.map((bar) => (
        <RisingBar key={bar.x} progress={progress} {...bar} />
      ))}
    </IconFrame>
  )
}

/** A bar that rises and falls from its foot. */
function RisingBar({
  progress,
  x,
  y,
  height,
  phase,
}: { progress: DrawnIconProps['progress'] } & (typeof bars)[number]) {
  const scaleY = useRiseAndFall(progress, phase)

  return (
    <motion.rect
      x={x}
      y={y}
      width="3"
      height={height}
      rx="1"
      fill="currentColor"
      stroke="none"
      style={{ scaleY, originY: 1 }}
    />
  )
}
