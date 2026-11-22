'use client'

import { motion } from 'motion/react'

import { useDrawIn, useTypeWithCursor } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The words of a typed line, each with the stretch of `progress` in which it appears. */
const words = [
  { d: 'M2 12h4', from: 0, to: 0.2 },
  { d: 'M8 12h5', from: 0.2, to: 0.45 },
  { d: 'M15 12h3', from: 0.45, to: 0.65 },
  { d: 'M20 12h3', from: 0.65, to: 0.85 },
] as const

/** How many times the cursor blinks while `progress` goes from 0 to 1, and how far it goes along while the line is typed. */
const cursor = { blinks: 8, travel: 21 }

/** A line that is typed word by word, with a cursor that blinks after it. */
export function TypedLineIcon({ progress, className, stroke }: DrawnIconProps) {
  const { opacity, x } = useTypeWithCursor(progress, cursor)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.typedLine}>
      {words.map((word) => (
        <TypedWord key={word.d} progress={progress} {...word} />
      ))}
      <motion.path d="M3 7v10" style={{ opacity, x }} />
    </IconFrame>
  )
}

/** A word of the line that is drawn from its start to its end when its turn comes. */
function TypedWord({
  progress,
  d,
  from,
  to,
}: { progress: DrawnIconProps['progress'] } & (typeof words)[number]) {
  const length = useDrawIn(progress, from, to)

  return <motion.path d={d} pathLength={length} />
}
