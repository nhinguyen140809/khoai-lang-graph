import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import { Slot } from 'radix-ui'
import type * as React from 'react'

import { type Tone, toneClasses } from '@/shared/lib/tone.constants'

// `variant` is the fill and `color` the meaning; the color sets the --tone variables these read.
// Each size matches a text size of the page: captions, component text, and body text. A code
// longer than its container breaks anywhere instead of overflowing it.
const codeVariants = cva(
  'inline-flex w-fit items-center rounded-sm border border-transparent font-mono wrap-anywhere',
  {
    variants: {
      variant: {
        solid: 'bg-(--tone) text-(--tone-foreground)',
        surface: 'border-(--tone-border) bg-(--tone-soft) text-(--tone-strong)',
        soft: 'bg-(--tone-soft) text-(--tone-strong)',
        outline: 'border-(--tone-border) text-(--tone-strong)',
        plain: 'text-(--tone-strong)',
      },
      size: {
        sm: 'min-h-4 px-1 text-4xs',
        default: 'min-h-5 px-1.5 text-xs',
        lg: 'min-h-6 px-2 text-sm',
      },
      color: toneClasses,
    },
  },
)

type CodeVariant = 'solid' | 'surface' | 'soft' | 'outline' | 'plain'

type CodeSize = 'sm' | 'default' | 'lg'

/** Inline code, such as an identifier, a key, or a short command in a sentence. */
function Code({
  className,
  variant = 'soft',
  color = 'neutral',
  size = 'default',
  asChild = false,
  ...props
}: Omit<React.ComponentProps<'code'>, 'color'> & {
  variant?: CodeVariant | undefined
  color?: Tone | undefined
  size?: CodeSize | undefined
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : 'code'

  return (
    <Comp
      data-slot="code"
      data-variant={variant}
      data-color={color}
      data-size={size}
      className={cn(codeVariants({ variant, color, size }), className)}
      {...props}
    />
  )
}

export { Code, type CodeSize, type CodeVariant }
