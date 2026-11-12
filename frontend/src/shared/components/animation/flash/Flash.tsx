'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { type ComponentProps, useState } from 'react'

import { toneClasses } from '@/shared/lib/tone'

// `color` sets the --tone variables that the keyframes of the flash read, as it does for Badge.
const flashVariants = cva('rounded-sm', {
  variants: { color: toneClasses },
  defaultVariants: { color: 'primary' },
})

interface FlashProps
  extends Omit<ComponentProps<'span'>, 'color'>, VariantProps<typeof flashVariants> {
  /** The value shown: each time it changes, the background lights up and fades. */
  flashKey: string | number
  /** How long the light takes to fade, in milliseconds. */
  duration?: number
}

/**
 * A span that lights its background for a moment each time its value changes, so a change that
 * the reader may have missed is easy to find. The `color` is the meaning of the change, from the
 * colors of the interface. It stays still at first and when the user asked for less motion.
 */
function Flash({ flashKey, color, duration = 1000, className, style, ...props }: FlashProps) {
  const [initialKey] = useState(flashKey)

  return (
    <span
      key={flashKey}
      data-slot="flash"
      data-color={color ?? 'primary'}
      className={cn(
        flashVariants({ color }),
        flashKey !== initialKey && 'animate-flash motion-reduce:animate-none',
        className,
      )}
      style={{ animationDuration: `${String(duration)}ms`, ...style }}
      {...props}
    />
  )
}

export { Flash }
