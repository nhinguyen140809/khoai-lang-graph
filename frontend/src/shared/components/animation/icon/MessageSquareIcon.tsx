'use client'

import { motion } from 'motion/react'

import { useSpeak } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** A filled speech bubble with round corners: its body opens from the corner of its tail, from a small box, and the tail grows after it, each swelling by its own amount, as it does when it speaks. */
export function MessageSquareIcon({ progress, className, stroke }: DrawnIconProps) {
  const { body, tail } = useSpeak(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.messageSquare}>
      <motion.path
        d="M8 3h8a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5z"
        fill="currentColor"
        stroke="none"
        style={{ ...body, transformBox: 'fill-box', transformOrigin: 'bottom left' }}
      />
      <motion.path
        d="M9.5 16.5 5 21v-6.5z"
        fill="currentColor"
        stroke="none"
        style={{ ...tail, transformBox: 'fill-box', transformOrigin: 'top right' }}
      />
    </IconFrame>
  )
}
