'use client'

import { useEffect, useState } from 'react'

interface CardTurn {
  /** The card in front. */
  front: number
  /** The card that is going to the back of the pile, until the next turn; null before the first. */
  leaving: number | null
}

/**
 * Which card is in front of a pile of `count` cards, and which one is leaving it: the front card
 * leaves each `intervalMs`, and the next one comes forward. The pile stays still when `isStill`
 * is set or when there is no second card to turn to.
 */
export function useCardTurns(count: number, intervalMs: number, isStill: boolean): CardTurn {
  const [turn, setTurn] = useState<CardTurn>({ front: 0, leaving: null })

  useEffect(() => {
    if (isStill || count < 2) return
    const timer = setInterval(() => {
      setTurn((current) => ({ front: (current.front + 1) % count, leaving: current.front }))
    }, intervalMs)
    return () => {
      clearInterval(timer)
    }
  }, [isStill, count, intervalMs])

  return turn
}
