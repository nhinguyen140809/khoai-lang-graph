'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { cardStackIntervalMs, cardStackPeekPx } from './card-stack.constants'
import { cardModeOf, cardMotion, depthOf } from './card-stack.utils'
import { useCardTurns } from './hooks/useCardTurns'

interface CardStackItem {
  /** Names the card, under the stack while the card is in front. */
  label: string
  /** The card; `isFront` is set while it is the one in front, so that it can play. */
  render: (isFront: boolean) => ReactNode
}

interface CardStackProps {
  items: readonly CardStackItem[]
  /** How long each card stays in front, in milliseconds. */
  intervalMs?: number
}

/**
 * Cards in a pile like a carousel: the front one is whole and the others wait behind it, a little
 * higher, smaller and fainter. Each turn the front card grows a little and fades away, the others
 * come forward, and it comes back at the end of the pile. It does not turn when the user asked for
 * less motion.
 */
export function CardStack({ items, intervalMs = cardStackIntervalMs }: CardStackProps) {
  const isStill = useReducedMotion() === true
  const count = items.length
  const { front, leaving } = useCardTurns(count, intervalMs, isStill)

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        className="grid p-px"
        // The cards behind rise above the front one, so the pile makes room for them.
        style={{ paddingTop: (count - 1) * cardStackPeekPx }}
      >
        {items.map((item, index) => {
          const depth = depthOf(index, front, count)
          const isLeaving = index === leaving
          const { card, content } = cardMotion(cardModeOf(isStill, isLeaving), depth, count)
          return (
            <motion.div
              key={item.label}
              aria-hidden={depth > 0}
              className="col-start-1 row-start-1 rounded-lg bg-card p-1 ring-1 ring-foreground/10"
              style={{ originY: 0 }}
              initial={false}
              animate={card.animate}
              transition={card.transition}
            >
              {/* The card stays solid; what is drawn on it fades with its place behind. */}
              <motion.div initial={false} animate={content.animate} transition={content.transition}>
                {item.render(depth === 0)}
              </motion.div>
            </motion.div>
          )
        })}
      </div>
      <motion.p
        key={front}
        initial={isStill ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs"
      >
        {items[front]?.label}
      </motion.p>
    </div>
  )
}
