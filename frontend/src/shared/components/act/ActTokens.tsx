'use client'

import { motion, type MotionValue, useTransform } from 'motion/react'

import { stretchOf } from '@/shared/lib/animation'

/** How many tokens are on show at once: each is in view for this many times the share of the round that its turn takes. */
const overlap = 1.8

/** How far a token drifts to the side while it rises, as a share of its own width. */
const drift = 0.4

/**
 * Words that show one after another, each rising on a slant from below and fading in, then going on
 * and fading out as the next comes, such as the digits and signs of a calculation: they go on
 * appearing and going while `progress` goes from 0 to 1. `lean` is the side that they slant toward
 * (1 to the right, -1 to the left, 0 for straight up). A single token does not rise: it comes in, stays and goes, as a
 * question mark does. The size of the text is a share of the size of the face that stands around it.
 */
export function ActTokens({
  progress,
  tokens,
  lean,
}: {
  progress: MotionValue<number>
  tokens: readonly string[]
  lean: -1 | 0 | 1
}) {
  const isSingle = tokens.length === 1
  return (
    <span aria-hidden className="relative flex size-full items-center justify-center">
      {tokens.map((text, index) => (
        <Token
          key={`${text}-${String(index)}`}
          progress={progress}
          text={text}
          from={isSingle ? 0 : (index / tokens.length) * (1 - overlap / tokens.length)}
          length={isSingle ? 1 : overlap / tokens.length}
          isRising={!isSingle}
          lean={lean}
        />
      ))}
    </span>
  )
}

function Token({
  progress,
  text,
  from,
  length,
  lean,
  isRising,
}: {
  progress: MotionValue<number>
  text: string
  from: number
  length: number
  lean: -1 | 0 | 1
  isRising: boolean
}) {
  const at = useTransform(progress, (value) => stretchOf(value, from, from + length))
  const rise = isRising ? ['90%', '-110%'] : ['0%', '0%']
  const y = useTransform(at, [0, 1], rise)
  const x = useTransform(
    at,
    [0, 1],
    [`${String(-drift * 100 * lean)}%`, `${String(drift * 100 * lean)}%`],
  )
  const opacity = useTransform(at, [0, 0.25, 0.7, 1], [0, 1, 1, 0])

  return (
    <motion.span
      className="absolute font-mono act-token leading-none font-semibold whitespace-nowrap"
      style={{ x, y, opacity }}
    >
      {text}
    </motion.span>
  )
}
