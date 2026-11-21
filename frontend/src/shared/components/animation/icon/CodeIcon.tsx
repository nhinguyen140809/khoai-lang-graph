'use client'

import { motion } from 'motion/react'

import { useBlinkInTurn } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The three marks of `</>`, left to right, and the third of the round in which each blinks. */
const marks = [
  { d: 'M8 7l-5 5 5 5', from: 0, to: 0.33 },
  { d: 'M14 5l-4 14', from: 0.33, to: 0.66 },
  { d: 'M16 7l5 5-5 5', from: 0.66, to: 1 },
] as const

/** How many times a mark blinks in its turn. */
const blinks = 3

/** The opening bracket, the slash and the closing bracket of code, which blink one after another. */
export function CodeIcon({ progress, className, stroke }: DrawnIconProps) {
  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.code}>
      {marks.map((mark) => (
        <BlinkingMark key={mark.d} progress={progress} {...mark} />
      ))}
    </IconFrame>
  )
}

/** A mark of code that blinks when its turn comes. */
function BlinkingMark({
  progress,
  d,
  from,
  to,
}: { progress: DrawnIconProps['progress'] } & (typeof marks)[number]) {
  const opacity = useBlinkInTurn(progress, from, to, blinks)

  return <motion.path d={d} style={{ opacity }} />
}
