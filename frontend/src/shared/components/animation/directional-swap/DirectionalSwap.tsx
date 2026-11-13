'use client'

import { cn } from 'cn'
import type { ComponentProps } from 'react'

import { swapModes, swapMotions } from './directional-swap.config'
import { swapDistance, swapMs } from './directional-swap.constants'
import type { SlideDirection, SwapMode, SwapMotion } from './directional-swap.types'
import { slideStyle } from './directional-swap.utils'
import { useDirectionalSwap } from './hooks/useDirectionalSwap'

interface DirectionalSwapProps extends ComponentProps<'div'> {
  /** What the content is: when it changes, the old content goes out and the new one comes in. */
  swapKey: string | number
  /** The way the content moves: `up` brings the new content in from below and sends the old one up. */
  direction?: SlideDirection
  /** How the new content comes in: `slide` from the opposite side, or `fade` where it stands. */
  enter?: SwapMotion
  /** How the old content goes out: `slide` the way of the move, or `fade` where it stands. */
  exit?: SwapMotion
  /**
   * `sync` crosses the two at once, in the same place. `wait` lets the old content go out first and
   * brings the new content in after it, so the two are never seen together.
   */
  mode?: SwapMode
  /** How far a slide goes, as a share of the width (left, right) or the height (up, down) of the content. */
  distance?: number
  /** How long the content takes to go out, and to come in, in milliseconds. */
  duration?: number
}

/**
 * Shows one piece of content at a time. When the key changes, the old content goes out and the
 * new content comes in, each as `slide` (along the direction of the move, such as toward older or
 * newer, with a fade) or as `fade` alone; they combine freely, such as a fade out followed by a
 * new item that slides in. A slide covers a share of the size of the content, so it is as clear
 * on a wide item as on a narrow one, and the box clips what slides out of it. The old content is
 * the last one that its key had. Neither moves when the user asked for less motion.
 */
function DirectionalSwap({
  swapKey,
  direction = 'up',
  enter = 'slide',
  exit = 'slide',
  mode = 'sync',
  distance = swapDistance,
  duration = swapMs,
  className,
  children,
  ...props
}: DirectionalSwapProps) {
  const leaving = useDirectionalSwap({ swapKey, children, direction, exit, duration })
  const { leavingClass, showsEnteringWhileLeaving } = swapModes[mode]

  return (
    <div
      data-slot="directional-swap"
      className={cn('relative grid overflow-clip', className)}
      {...props}
    >
      {leaving && (
        <div
          key={leaving.key}
          aria-hidden
          inert
          // A fade that stays, with the motion set by `slideStyle`.
          className={cn(
            'pointer-events-none min-w-0 animate-out fade-out-0 fill-mode-forwards motion-reduce:hidden',
            leavingClass,
          )}
          style={slideStyle(leaving.direction, 'exit', {
            distance,
            ms: duration,
            slides: swapMotions[leaving.exit].slides,
          })}
        >
          {leaving.node}
        </div>
      )}
      {(!leaving || showsEnteringWhileLeaving) && (
        <div
          key={swapKey}
          // A fade, with the motion set by `slideStyle`.
          className="col-start-1 row-start-1 min-w-0 animate-in fade-in-0 motion-reduce:animate-none"
          style={slideStyle(direction, 'enter', {
            distance,
            ms: duration,
            slides: swapMotions[enter].slides,
          })}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export { DirectionalSwap }
