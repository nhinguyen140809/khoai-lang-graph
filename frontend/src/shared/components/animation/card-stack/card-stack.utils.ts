import {
  cardStackFade,
  cardStackLeaveScale,
  cardStackLeaveShare,
  cardStackPeekPx,
  cardStackShrink,
  cardStackSpring,
  cardStackTurnSeconds,
} from './card-stack.constants'
import type { CardMode, CardMotion } from './card-stack.types'

/** How many places behind the front a card is: 0 for the front one, 1 for the next to come, and so on. */
export function depthOf(index: number, front: number, count: number): number {
  return (index - front + count) % count
}

/** How a card moves: not at all when the user asked for less motion, away while it is the one that left. */
export function cardModeOf(isStill: boolean, isLeaving: boolean): CardMode {
  if (isStill) return 'still'
  return isLeaving ? 'leaving' : 'resting'
}

const stillTransition = { duration: 0 }
const leaveTimes = [0, cardStackLeaveShare, cardStackLeaveShare + 0.001, 1]
const leaveTransition = {
  duration: cardStackTurnSeconds,
  times: leaveTimes,
  ease: 'easeOut',
} as const

/** The place of a card in the pile: where it rests, how large and how faint what is on it is. */
function placeOf(depth: number, count: number) {
  return {
    y: -depth * cardStackPeekPx,
    scale: 1 - depth * cardStackShrink,
    zIndex: count - depth,
    faded: 1 - depth * cardStackFade,
  }
}

const cardMotions: Record<CardMode, (depth: number, count: number) => CardMotion> = {
  // At its place at once.
  still: (depth, count) => {
    const { faded, ...place } = placeOf(depth, count)
    return {
      card: { animate: { ...place, opacity: 1 }, transition: stillTransition },
      content: { animate: { opacity: faded }, transition: stillTransition },
    }
  },
  // Moves to its place with a spring.
  resting: (depth, count) => {
    const { faded, ...place } = placeOf(depth, count)
    return {
      card: { animate: { ...place, opacity: 1 }, transition: cardStackSpring },
      content: { animate: { opacity: faded }, transition: cardStackSpring },
    }
  },
  // Grows a little and fades away in front, then comes back at its place behind the others.
  leaving: (depth, count) => {
    const { y, scale, faded } = placeOf(depth, count)
    return {
      card: {
        animate: {
          y: [0, 0, y, y],
          scale: [1, cardStackLeaveScale, scale, scale],
          opacity: [1, 0, 0, 1],
          zIndex: [count + 1, count + 1, 0, 0],
        },
        transition: leaveTransition,
      },
      content: {
        animate: { opacity: [1, 1, faded, faded] },
        transition: { duration: cardStackTurnSeconds, times: leaveTimes },
      },
    }
  },
}

/** The motion of a card of the pile, given how it moves and its place. */
export function cardMotion(mode: CardMode, depth: number, count: number): CardMotion {
  return cardMotions[mode](depth, count)
}
