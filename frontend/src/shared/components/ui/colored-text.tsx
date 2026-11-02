import { cn } from 'cn'
import type * as React from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone'

/** The colors of a run of text: one of the colors of the app, or muted. */
type TextColor = Tone | 'muted'

interface ColoredTextProps extends Omit<React.ComponentProps<'span'>, 'color'> {
  /** The color of the text; none keeps the color of the text around it. */
  color?: TextColor | null | undefined
}

function isTone(color: TextColor | null | undefined): color is Tone {
  return color !== null && color !== undefined && color !== 'muted'
}

/**
 * A run of text in one of the colors of the app, or muted: the title of a row, a state, a count.
 * Whatever sits inside takes the color too.
 */
function ColoredText({ color, className, ...props }: ColoredTextProps) {
  return (
    <span
      data-slot="colored-text"
      data-color={color ?? undefined}
      className={cn(
        isTone(color) && [toneClasses[color], 'text-(--tone-strong)'],
        'data-[color=muted]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export { ColoredText }
export type { TextColor }
