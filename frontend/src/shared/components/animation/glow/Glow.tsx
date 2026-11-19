import { cn } from 'cn'
import type { ComponentProps, CSSProperties } from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

import {
  glowBlurClasses,
  glowCornerClasses,
  glowEntranceClasses,
  glowEntranceMs,
  glowMotionClasses,
  glowSizeClasses,
} from './glow.constants'
import type { GlowBlur, GlowEntrance, GlowMotion, GlowShape, GlowSize } from './glow.types'

interface GlowProps extends Omit<ComponentProps<'div'>, 'color'> {
  /** The color of the light, from the colors of the interface. */
  color?: Tone
  /** How much of the color shows, in percent: 0 to 100. */
  strength?: number
  shape?: GlowShape
  size?: GlowSize
  /** How soft the edge is: the less it is blurred, the better the shape reads. */
  blur?: GlowBlur
  /** The width and the height as a CSS length, such as `40rem` or `60vw`, in place of the size. */
  width?: string | undefined
  height?: string | undefined
  /** Turns the shape by this many degrees, for an ellipse, a streak or a blob that leans. */
  rotate?: number | undefined
  entrance?: GlowEntrance
  /** How long the glow takes to come in, in milliseconds. */
  entranceDuration?: number | undefined
  /** The time before the glow starts to come in, in milliseconds. */
  entranceDelay?: number | undefined
  motion?: GlowMotion
  /** How long one way of the motion takes, in milliseconds. */
  motionDuration?: number | undefined
  /** The time before the motion starts, in milliseconds; a negative time starts it part of the way. */
  motionDelay?: number | undefined
}

/** What a glow sets on its shape: how much of the color shows, and a size or a turn of its own. */
function shapeStyleOf({
  strength,
  width,
  height,
  rotate,
}: {
  strength: number
  width: string | undefined
  height: string | undefined
  rotate: number | undefined
}): CSSProperties {
  return {
    opacity: strength / 100,
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...(rotate !== undefined && { rotate: `${String(rotate)}deg` }),
  }
}

/**
 * A soft light behind a page, a blurred shape in a color of the interface. The shape is one of the
 * presets (`circle`, `ellipse`, `streak`, `blob`) in one of the sizes, or any size at all with a
 * `width` and a `height`, and it may lean with `rotate`. Give its place with the
 * class, such as `absolute top-1/4 left-1/2`: it takes no part in the layout of what is over it,
 * and no pointer or screen reader reaches it. It comes in by its `entrance` and then moves by its
 * `motion`, each for as long as it is asked to; both stand still when the user asked for less
 * motion. The two live on two elements, so that they do not take the place of each other.
 */
export function Glow({
  color = 'primary',
  strength = 20,
  shape = 'circle',
  size = 'md',
  blur = 'lg',
  width,
  height,
  rotate,
  entrance = 'fade',
  entranceDuration = glowEntranceMs,
  entranceDelay = 0,
  motion = 'drift',
  motionDuration,
  motionDelay = 0,
  className,
  style,
  ...props
}: GlowProps) {
  const entranceStyle: CSSProperties = {
    animationDuration: `${String(entranceDuration)}ms`,
    animationDelay: `${String(entranceDelay)}ms`,
  }
  // The time of one way of the motion is the token of the motion, unless it is given another.
  const motionStyle: CSSProperties = {
    ...(motionDuration !== undefined && { animationDuration: `${String(motionDuration)}ms` }),
    animationDelay: `${String(motionDelay)}ms`,
  }

  return (
    <div
      aria-hidden
      data-slot="glow"
      className={cn('pointer-events-none', glowEntranceClasses[entrance], className)}
      style={{ ...entranceStyle, ...style }}
      {...props}
    >
      <div
        className={cn(
          'bg-(--tone)',
          glowBlurClasses[blur],
          glowCornerClasses[shape],
          toneClasses[color],
          // A width or a height of its own takes the place of the size, each for its own side.
          width === undefined && height === undefined && glowSizeClasses[shape][size],
          glowMotionClasses[motion],
        )}
        style={{ ...motionStyle, ...shapeStyleOf({ strength, width, height, rotate }) }}
      />
    </div>
  )
}
