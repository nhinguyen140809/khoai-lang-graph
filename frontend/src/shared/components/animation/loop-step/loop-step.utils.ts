import { loopFadeShare, loopGoneAt, loopHoldUntil } from './loop-step.constants'
import type { LoopMode, StepMotion } from './loop-step.types'

const stepMotions: Record<LoopMode, (at: number, cycleSeconds: number) => StepMotion> = {
  still: () => ({ animate: { opacity: 1 }, transition: { duration: 0.2 } }),
  once: (at, cycleSeconds) => ({
    animate: { opacity: [0, 0, 1] },
    transition: { duration: cycleSeconds, times: [0, at, at + loopFadeShare], ease: 'easeOut' },
  }),
  loop: (at, cycleSeconds) => ({
    animate: { opacity: [0, 0, 1, 1, 0, 0] },
    transition: {
      duration: cycleSeconds,
      times: [0, at, at + loopFadeShare, loopHoldUntil, loopGoneAt, 1],
      ease: 'easeOut',
      repeat: Infinity,
    },
  }),
}

/** How a step plays: still while it does not play, once or in a loop while it does. */
export function loopModeOf(isStill: boolean, isOnce: boolean): LoopMode {
  if (isStill) return 'still'
  return isOnce ? 'once' : 'loop'
}

/** What a step animates and how, given how it plays and its place in the cycle. */
export function stepMotion(mode: LoopMode, at: number, cycleSeconds: number): StepMotion {
  return stepMotions[mode](at, cycleSeconds)
}
