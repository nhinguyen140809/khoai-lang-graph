'use client'

import { motion } from 'motion/react'

import { useSpeak } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** A speech bubble that swells and shakes a little, as it does when it speaks. */
export function MessageSquareIcon({ progress, className, stroke }: DrawnIconProps) {
  const { scale, rotate } = useSpeak(progress)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.messageSquare}>
      <motion.path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        style={{ scale, rotate, transformBox: 'fill-box', transformOrigin: 'center' }}
      />
    </IconFrame>
  )
}
