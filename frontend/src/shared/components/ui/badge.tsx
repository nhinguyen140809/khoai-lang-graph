import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import { Slot } from 'radix-ui'
import * as React from 'react'

import {
  fillTones,
  resolveToneVariant,
  toneClasses,
  type ToneVariantProps,
} from '@/shared/lib/tone'

// `variant` is the fill and `color` the meaning; the color sets the --tone variables these read.
const badgeStyles = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        solid: 'bg-(--tone) text-(--tone-foreground) [a]:hover:bg-(--tone)/80',
        soft: 'bg-(--tone-soft) text-(--tone-strong)',
        outline: 'border-(--tone-border) text-(--tone-strong) [a]:hover:bg-(--tone-soft)',
        ghost: 'text-(--tone-strong) hover:bg-(--tone-soft)',
        link: 'text-(--tone-strong) underline-offset-4 hover:underline',
        text: 'text-(--tone-strong)',
      },
      color: toneClasses,
    },
  },
)

type BadgeStyleProps = ToneVariantProps<typeof fillTones>

/** The classes of a badge, for elements that look like one without being a Badge. */
function badgeVariants({
  className,
  ...props
}: BadgeStyleProps & { className?: string | undefined } = {}) {
  return cn(badgeStyles(resolveToneVariant(fillTones, props)), className)
}

type BadgeProps = Omit<React.ComponentProps<'span'>, 'color'> &
  BadgeStyleProps & {
    asChild?: boolean
  }

function Badge({ className, variant, color, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span'
  const tone = resolveToneVariant(fillTones, { variant, color })

  return (
    <Comp
      data-slot="badge"
      data-variant={tone.variant}
      data-color={tone.color}
      className={cn(badgeStyles(tone), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
