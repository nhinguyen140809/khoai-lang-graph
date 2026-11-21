'use client'

import { motion } from 'motion/react'

import { useGrowAndShorten } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** How wide a column is: a little less than a bar of the bars icon. */
const columnWidth = 2.6

/** The columns of a board: where each stands, how tall it is, and where along the round it is at its longest. */
const columns = [
  { x: 6, height: 11, phase: 0 },
  { x: 12, height: 6, phase: 0.33 },
  { x: 18, height: 14, phase: 0.66 },
] as const

/** The solid columns of a board of tasks, each of which grows and shortens in its own time, as cards move between them. */
export function KanbanIcon({ progress, className, stroke }: DrawnIconProps) {
  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.kanban}>
      {columns.map((column) => (
        <GrowingColumn key={column.x} progress={progress} {...column} />
      ))}
    </IconFrame>
  )
}

/** A column that grows and shortens from its head. */
function GrowingColumn({
  progress,
  x,
  height,
  phase,
}: { progress: DrawnIconProps['progress'] } & (typeof columns)[number]) {
  const scaleY = useGrowAndShorten(progress, phase)

  return (
    <motion.rect
      x={x - columnWidth / 2}
      y={5}
      width={columnWidth}
      height={height}
      rx="1"
      fill="currentColor"
      stroke="none"
      style={{ scaleY, originY: 0 }}
    />
  )
}
