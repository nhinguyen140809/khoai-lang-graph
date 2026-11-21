'use client'

import { motion, useTransform } from 'motion/react'

import { useTipOver } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** The books that stand: where each is and how wide it is. They are as tall as the one that falls. */
const standing = [
  { x: 2.5, width: 3.4 },
  { x: 6.9, width: 3.4 },
] as const

const bookTop = 4
const bookBottom = 20

/** The book that falls: its left edge, its width, and how far it leans, in degrees, against the books that stand. */
const falling = { x: 13.2, width: 3.4, lean: 11 } as const

/** The outline of the falling book when it has turned `degrees` to the left about its bottom left corner. */
function fallenOutline(degrees: number): string {
  const angle = (degrees * Math.PI) / 180
  const corner = (dx: number, dy: number) => {
    // The corner `dx` to the right and `dy` up from the pivot, turned to the left.
    const x = falling.x + dx * Math.cos(angle) - dy * Math.sin(angle)
    const y = bookBottom - dx * Math.sin(angle) - dy * Math.cos(angle)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }
  const height = bookBottom - bookTop
  const corners = [
    corner(0, 0),
    corner(falling.width, 0),
    corner(falling.width, height),
    corner(0, height),
  ]
  return `M${corners.join('L')}Z`
}

/** Solid books on a shelf: two stand together and a third, upright at first, tips over to the left and leans against them, then stands up again. */
export function LibraryIcon({ progress, className, stroke }: DrawnIconProps) {
  const lean = useTipOver(progress, falling.lean)
  const outline = useTransform(lean, fallenOutline)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.library}>
      {standing.map((book) => (
        <rect
          key={book.x}
          x={book.x}
          y={bookTop}
          width={book.width}
          height={bookBottom - bookTop}
          rx="0.8"
          fill="currentColor"
          stroke="none"
        />
      ))}
      <motion.path d={outline} fill="currentColor" stroke="none" />
    </IconFrame>
  )
}
