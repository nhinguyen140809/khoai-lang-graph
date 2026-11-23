'use client'

import { cn } from 'cn'
import { useRef } from 'react'

import { AgentFace, type Mood } from '@/shared/components/face'
import { useIsInView, usePrefersReducedMotion } from '@/shared/lib/viewport'

import { actorFrameClasses } from './act.constants'
import { type ActSize, type Slot, slots as allSlots } from './act.types'
import { actOf, moodOf } from './act.utils'
import { ActProps } from './ActProps'
import { useActCycle } from './hooks/useActCycle'
import { useActDrive } from './hooks/useActDrive'

interface ActorProps {
  /** What the face comes from, such as the key of an agent. */
  seed: string
  /** The mood of the face. Each act has one too, which the face has unless this says another; the mood of work in general (`working`) says none, so the act's own stands. */
  mood?: Mood
  /** The size of the face: the largest that a face has by default, or larger still. The things around it are as large as the face makes them. */
  size?: ActSize
  /** What the face of the other agent comes from, for a work that two agents do, such as an interview with a persona; the acts that draw one draw it only when this is given. */
  partner?: string | undefined
  /** The acts to show around the face, one after another and again from the first; the keys of the catalog. A key with no act drawn is left out. */
  acts: readonly string[]
  /** The slots around the face that may be used, all of them by default. */
  slots?: readonly Slot[]
  className?: string
}

/**
 * A face at work: the face of an agent with what it is doing drawn around it, in the colors of the interface, while
 * its eyes and its body follow the work. The list of acts goes round, each act a few rounds, and
 * one gives way to the next gently. The face has the mood that it is given, else that of its act. It does
 * nothing but show the face for a user who asked for less motion, and stops while out of sight. A frame
 * holds it, which keeps the room that the acts reach into without taking it from the layout (see
 * `actor-frame`); the `className` is the frame's, so that it places the actor with the face where it says.
 */
export function Actor({
  seed,
  mood,
  size = 'lg',
  partner,
  acts,
  slots = allSlots,
  className,
}: ActorProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useIsInView(ref)
  const isStill = usePrefersReducedMotion()
  const { shown, swaps, gain } = useActCycle(isStill ? [] : acts, isInView)
  const act = actOf(shown)
  const { drive, round } = useActDrive(act, swaps, gain, isInView)

  return (
    <span
      data-slot="actor-frame"
      data-partner={partner !== undefined}
      className={cn('actor-frame', actorFrameClasses[size], className)}
    >
      <span
        ref={ref}
        data-slot="actor"
        data-act={shown ?? undefined}
        className="relative inline-flex shrink-0"
      >
        <AgentFace seed={seed} mood={moodOf(mood, act)} size={size} drive={drive} />
        {act !== null && (
          <ActProps
            act={act}
            round={round}
            gain={gain}
            allowed={slots}
            size={size}
            partner={partner}
          />
        )}
      </span>
    </span>
  )
}
