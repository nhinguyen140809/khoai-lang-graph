import type { SlideDirection, SwapMode, SwapMotion } from './directional-swap.types'

/**
 * What each mode of a swap does with the old content and the new content. A new mode is one more
 * entry here.
 */
export const swapModes = {
  // The old content leaves over the new one without taking room, so the box takes the size of the
  // new content at once.
  sync: { leavingClass: 'absolute inset-x-0 top-0', showsEnteringWhileLeaving: true },
  // The old content is the only one there, in the place of the new one, until it has left.
  wait: { leavingClass: 'col-start-1 row-start-1', showsEnteringWhileLeaving: false },
} satisfies Record<SwapMode, { leavingClass: string; showsEnteringWhileLeaving: boolean }>

/** What each motion does to content that goes out or comes in. */
export const swapMotions = {
  slide: { slides: true },
  fade: { slides: false },
} satisfies Record<SwapMotion, { slides: boolean }>

/**
 * Where the content travels for each direction: along which axis, and toward which side of it, -1
 * for up and left and 1 for down and right.
 */
export const swapDirections = {
  up: { axis: 'y', heading: -1 },
  down: { axis: 'y', heading: 1 },
  left: { axis: 'x', heading: -1 },
  right: { axis: 'x', heading: 1 },
} satisfies Record<SlideDirection, { axis: 'x' | 'y'; heading: -1 | 1 }>

/** New content starts against the way of the move, and old content ends along it. */
export const swapPhaseSigns = { enter: -1, exit: 1 } as const
