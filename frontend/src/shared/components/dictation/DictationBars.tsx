'use client'

import { motion, type MotionValue, useTransform } from 'motion/react'

import { dictationBarWeights } from './dictation.constants'
import type { DictationSize } from './dictation.types'

const barDelayMs = 120

/** One bar of a voice: it rises with the level of the voice, and rests low while nobody speaks. */
function ListeningBar({
  level,
  weight,
  delayMs,
  isMetered,
}: {
  level: MotionValue<number>
  weight: number
  delayMs: number
  isMetered: boolean
}) {
  const scaleY = useTransform(level, (value) => 0.25 + 0.75 * Math.min(1, value * weight))

  return isMetered ? (
    <motion.span style={{ scaleY }} className="h-full w-1 origin-center rounded-xs bg-current" />
  ) : (
    <span
      className="h-full w-1 origin-center animate-listen rounded-xs bg-current motion-reduce:animate-none"
      style={{ animationDelay: `${String(delayMs)}ms` }}
    />
  )
}

interface DictationBarsProps {
  level: MotionValue<number>
  isMetered: boolean
  /** How many bars, by the kind of place. */
  size: DictationSize
}

/** The bars of a voice that is heard, as many as the button that stops the dictation is long. */
export function DictationBars({ level, isMetered, size }: DictationBarsProps) {
  return (
    <span aria-hidden className="mr-1 flex h-4 items-center gap-1">
      {dictationBarWeights[size].map((weight, index) => (
        <ListeningBar
          key={index}
          level={level}
          weight={weight}
          delayMs={index * barDelayMs}
          isMetered={isMetered}
        />
      ))}
    </span>
  )
}
