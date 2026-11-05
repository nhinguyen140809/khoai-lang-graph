import { cn } from 'cn'
import type * as React from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

interface ColoredTextProps extends Omit<React.ComponentProps<'span'>, 'color'> {
  /** The color of the text; none keeps the color of the text around it. */
  color?: Tone | null | undefined
}

/**
 * A run of text in one of the colors of the app: the title of a row, a state, a count. Whatever
 * sits inside takes the color too.
 */
function ColoredText({ color, className, ...props }: ColoredTextProps) {
  return (
    <span
      data-slot="colored-text"
      data-color={color ?? undefined}
      className={cn(
        color !== null && color !== undefined && [toneClasses[color], 'text-(--tone-strong)'],
        className,
      )}
      {...props}
    />
  )
}

export { ColoredText }
