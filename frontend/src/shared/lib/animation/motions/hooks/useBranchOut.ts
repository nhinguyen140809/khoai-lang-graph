'use client'

import { type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '../../animation.utils'

/** The motion of a branch that grows from a node to another, over the stretch from `from` to `to` of the round: how much of its line is drawn, and how large and how seen the node at its end is, which comes in as the line reaches it. */
export function useBranchOut(progress: MotionValue<number>, from: number, to: number) {
  const line = useTransform(progress, (value) => stretchOf(value, from, to))
  const node = useTransform(progress, (value) => stretchOf(value, to - 0.1, to + 0.05))
  return { line, node, scale: useTransform(node, (value) => 0.3 + 0.7 * value) }
}
