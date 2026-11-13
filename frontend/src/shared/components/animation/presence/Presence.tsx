'use client'

import type { VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import type { ComponentProps } from 'react'

import { motionMs } from '@/shared/lib/animation'

import { usePresence } from './hooks/usePresence'
import { presenceVariants } from './presence.utils'

interface PresenceProps extends ComponentProps<'div'>, VariantProps<typeof presenceVariants> {
  /** Whether the content is shown. It leaves the page only after its exit has played. */
  present: boolean
  /** How long it takes to come in and to go out, in milliseconds. */
  duration?: number
}

/**
 * Content that comes in and goes out with a motion instead of being added and removed at once,
 * for a banner, a note or a panel on one side of its box. The `variant` is how it moves: it
 * fades, zooms, or slides from the `top`, `bottom`, `left` or `right`. It stays in the page until
 * the exit has played, and is hidden at once when the user asked for less motion.
 */
function Presence({
  present,
  variant,
  duration = motionMs,
  className,
  style,
  ...props
}: PresenceProps) {
  const isMounted = usePresence(present, duration)

  if (!isMounted) return null

  return (
    <div
      data-slot="presence"
      data-state={present ? 'open' : 'closed'}
      className={cn(presenceVariants({ variant }), className)}
      style={{ animationDuration: `${String(duration)}ms`, ...style }}
      {...props}
    />
  )
}

export { Presence }
