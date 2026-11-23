'use client'

import { motion } from 'motion/react'

import { useBranchOut, useFadeOutAtEnd } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** Where the node on the left is, and the two on the right that it leads to, like the sides of a `<`, and the stretch of the round in which each branch grows. */
const origin = { x: 5, y: 12 }
const branches = [
  { x: 19, y: 5, from: 0.15, to: 0.45 },
  { x: 19, y: 19, from: 0.35, to: 0.65 },
] as const

/** How large a node is. */
const nodeRadius = 2.8

/** Three nodes joined as the sides of a `<`: the node on the left, then a line to each of the two on the right, which come in as it reaches them, and all go out at the end of the round. */
export function ForkNodesIcon({ progress, className, stroke }: DrawnIconProps) {
  const seen = useFadeOutAtEnd(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.fork}>
      <motion.circle
        cx={origin.x}
        cy={origin.y}
        r={nodeRadius}
        fill="currentColor"
        stroke="none"
        style={{ opacity: seen }}
      />
      {branches.map((branch) => (
        <GrowingBranch key={branch.y} progress={progress} seen={seen} {...branch} />
      ))}
    </IconFrame>
  )
}

/** A branch that grows from the first node to a node of its own, which comes in as the line reaches it. */
function GrowingBranch({
  progress,
  seen,
  x,
  y,
  from,
  to,
}: {
  progress: DrawnIconProps['progress']
  seen: DrawnIconProps['progress']
} & (typeof branches)[number]) {
  const { line, node, scale } = useBranchOut(progress, from, to)

  return (
    <motion.g style={{ opacity: seen }}>
      <motion.path
        d={`M${String(origin.x)} ${String(origin.y)}L${String(x)} ${String(y)}`}
        pathLength={line}
      />
      <motion.circle
        cx={x}
        cy={y}
        r={nodeRadius}
        fill="currentColor"
        stroke="none"
        style={{ scale, opacity: node, transformBox: 'fill-box', transformOrigin: 'center' }}
      />
    </motion.g>
  )
}
