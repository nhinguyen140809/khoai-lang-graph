'use client'

import { motion, useReducedMotion } from 'motion/react'
import { createContext, type ReactNode, use } from 'react'

import { loopSeconds } from './loop-step.constants'
import { loopModeOf, stepMotion } from './loop-step.utils'

interface LoopPlayback {
  /** While it is not set, the steps are still and complete. */
  isPlaying: boolean
  /** Plays the cycle once and stays complete, with no fade out and no repeat. */
  once: boolean
  /** The length of one cycle, the same for every step of the loop. */
  cycleSeconds: number
}

const LoopContext = createContext<LoopPlayback>({
  isPlaying: false,
  once: false,
  cycleSeconds: loopSeconds,
})

interface LoopProps {
  isPlaying?: boolean | undefined
  once?: boolean | undefined
  cycleSeconds?: number | undefined
  children: ReactNode
}

/** Sets how the `LoopStep`s under it play, so that each step of a drawing names only its place. */
export function Loop({
  isPlaying = false,
  once = false,
  cycleSeconds = loopSeconds,
  children,
}: LoopProps) {
  return <LoopContext value={{ isPlaying, once, cycleSeconds }}>{children}</LoopContext>
}

interface LoopStepProps {
  /** The share of the cycle, from 0 to 0.7, at which the step starts to come in. */
  at: number
  children: ReactNode
}

/**
 * One step of a drawing that plays in a loop, for the parts of an SVG, under a `Loop`: it fades in
 * at its share of the cycle, stays, and fades out with the others at the end, so the loop has no
 * seam; with `once` it stays instead, for a drawing that is replaced when it has played. Put the
 * steps of a drawing in the order they come in, each with a later `at`. Without `isPlaying`, and
 * when the user asked for less motion, it shows the drawing as it is at its fullest.
 */
export function LoopStep({ at, children }: LoopStepProps) {
  const { isPlaying, once, cycleSeconds } = use(LoopContext)
  const isStill = useReducedMotion() === true || !isPlaying
  const { animate, transition } = stepMotion(loopModeOf(isStill, once), at, cycleSeconds)

  return (
    <motion.g initial={false} animate={animate} transition={transition}>
      {children}
    </motion.g>
  )
}
