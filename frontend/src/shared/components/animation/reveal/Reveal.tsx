import { cn } from 'cn'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { motionMs } from '@/shared/lib/animation'

import { revealMaxSteps, revealStepMs } from './reveal.constants'

interface RevealProps extends React.ComponentProps<'div'> {
  /** The place of the item among its siblings: each later place starts a little after the one before. */
  index?: number
  /** How long each item takes to come in, in milliseconds. */
  duration?: number
  /** The time before the first item starts, in milliseconds. */
  delay?: number
  /** The time between one place and the next, in milliseconds. */
  step?: number
  /** The place after which the time between places stops growing. */
  maxSteps?: number
  /** Puts the motion on the child element, such as an `li` inside a list, instead of a `div`. */
  asChild?: boolean
}

/**
 * An item that fades in and rises a little when it appears. Given its `index`, the items of a
 * list come in one after another instead of all at once. The delay stops growing after a few
 * places, so a long list does not make the last item wait. It does not move when the user asked
 * for less motion.
 */
function Reveal({
  index = 0,
  duration = motionMs,
  delay = 0,
  step = revealStepMs,
  maxSteps = revealMaxSteps,
  asChild = false,
  className,
  style,
  ...props
}: RevealProps) {
  const Comp = asChild ? Slot.Root : 'div'
  const place = Math.min(index, maxSteps)

  return (
    <Comp
      data-slot="reveal"
      style={{
        animationDuration: `${String(duration)}ms`,
        animationDelay: `${String(delay + place * step)}ms`,
        ...style,
      }}
      className={cn(
        'animate-in fade-in-0 fill-mode-backwards slide-in-from-bottom-1 motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}

export { Reveal }
