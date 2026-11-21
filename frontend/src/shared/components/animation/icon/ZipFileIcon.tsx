'use client'

import { motion, useTransform } from 'motion/react'

import { useZipDown } from '@/shared/lib/animation/motions'

import { iconBounds } from './icon.constants'
import type { DrawnIconProps } from './icon.types'
import { IconFrame } from './IconFrame'

/** How the zip is pulled: from where to where its pull goes, and between which parts of the round. */
const pulling = { top: 4, bottom: 15, from: 0.1, to: 0.7 }

/** The teeth of the zip: how far apart they are down the file, and how large each is. */
const teethGap = 2
const toothWidth = 1.7
const toothHeight = 1.1
const teethCount = 6

/** The pull of the zip: its size. */
const pull = { width: 3, height: 4 }

/** A file with a zip down its middle that is pulled shut: the pull goes down and the teeth close behind it, then it goes back up, as when a file is packed into an archive. */
export function ZipFileIcon({ progress, className, stroke }: DrawnIconProps) {
  const pullY = useZipDown(progress, pulling)

  return (
    <IconFrame className={className} stroke={stroke} bounds={iconBounds.zip}>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      {Array.from({ length: teethCount }, (_, index) => (
        <ClosingTooth key={index} index={index} pullY={pullY} />
      ))}
      <motion.rect
        x={12 - pull.width / 2}
        y={0}
        width={pull.width}
        height={pull.height}
        rx="0.8"
        fill="currentColor"
        stroke="none"
        style={{ y: pullY }}
      />
    </IconFrame>
  )
}

/** A tooth of the zip that shows once the pull has gone past it. */
function ClosingTooth({ index, pullY }: { index: number; pullY: DrawnIconProps['progress'] }) {
  const y = pulling.top + pull.height + index * teethGap
  const opacity = useTransform(pullY, (at) => (at + pull.height >= y ? 1 : 0))
  const x = index % 2 === 0 ? 12 - toothWidth : 12

  return (
    <motion.rect
      x={x}
      y={y}
      width={toothWidth}
      height={toothHeight}
      fill="currentColor"
      stroke="none"
      style={{ opacity }}
    />
  )
}
