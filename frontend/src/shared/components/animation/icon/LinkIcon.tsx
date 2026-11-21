'use client'

import { motion } from 'motion/react'

import { useStretchAndTurn } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The two links of a chain, which stretch apart and come back and turn a little as `progress` goes from 0 to 1. */
export function LinkIcon({ progress, className, stroke }: DrawnIconProps) {
  const style = {
    ...useStretchAndTurn(progress),
    transformBox: 'fill-box',
    transformOrigin: 'center',
  } as const

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.link}>
      <motion.path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" style={style} />
      <motion.path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" style={style} />
    </IconFrame>
  )
}
