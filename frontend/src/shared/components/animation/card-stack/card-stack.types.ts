import type { TargetAndTransition, Transition } from 'motion/react'

/** How a card moves in a turn: not at all, away to the end of the pile, or to its place in it. */
export type CardMode = 'still' | 'leaving' | 'resting'

interface Motion {
  animate: TargetAndTransition
  transition: Transition
}

/** The motion of a card, and of what is drawn on it, which fades with its place behind. */
export interface CardMotion {
  card: Motion
  content: Motion
}
