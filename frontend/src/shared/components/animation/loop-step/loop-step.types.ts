import type { TargetAndTransition, Transition } from 'motion/react'

export type LoopMode = 'still' | 'once' | 'loop'

export interface StepMotion {
  animate: TargetAndTransition
  transition: Transition
}
