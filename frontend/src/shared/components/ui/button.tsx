import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { Slot } from 'radix-ui'
import * as React from 'react'

import { fillTones, toneClasses, type ToneVariantProps } from '@/shared/lib/tone.constants'
import { resolveToneVariant } from '@/shared/lib/tone.utils'

// `variant` is the fill and `color` the meaning; the color sets the --tone variables these read.
const buttonStyles = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        solid: 'bg-(--tone) text-(--tone-foreground) hover:bg-(--tone)/80',
        soft: 'bg-(--tone-soft) text-(--tone-strong) hover:bg-[color-mix(in_oklab,var(--tone-soft),var(--tone-strong)_10%)] aria-expanded:bg-[color-mix(in_oklab,var(--tone-soft),var(--tone-strong)_10%)]',
        outline: 'border-(--tone-border) hover:bg-(--tone-soft) aria-expanded:bg-(--tone-soft)',
        ghost: 'hover:bg-(--tone-soft) aria-expanded:bg-(--tone-soft)',
        link: 'text-(--tone-strong) underline-offset-4 hover:underline',
      },
      color: toneClasses,
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    compoundVariants: [
      // Colored outline and ghost buttons take the text color of the tone; neutral ones inherit it.
      {
        variant: ['outline', 'ghost'],
        color: ['primary', 'success', 'warning', 'destructive'],
        class: 'text-(--tone-strong)',
      },
      // A status color also tints the focus ring.
      {
        color: ['success', 'warning', 'destructive'],
        class:
          'focus-visible:border-(--tone-strong)/40 focus-visible:ring-(--tone-strong)/20 dark:focus-visible:ring-(--tone-strong)/40',
      },
      // Neutral solid and ghost buttons keep the look of the shadcn/ui secondary and ghost variants.
      {
        variant: 'solid',
        color: 'neutral',
        class:
          'hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
      },
      // A neutral outline button looks like an outline Toggle: the input border, no fill, and the
      // muted fill on hover.
      {
        variant: 'outline',
        color: 'neutral',
        class:
          'border-input hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
      },
      {
        variant: 'ghost',
        color: 'neutral',
        class:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
      },
    ],
    defaultVariants: {
      size: 'default',
    },
  },
)

type ButtonStyleProps = ToneVariantProps<typeof fillTones> & {
  size?: VariantProps<typeof buttonStyles>['size']
}

/** The classes of a button, for elements that look like one without being a Button. */
function buttonVariants({
  className,
  size,
  ...props
}: ButtonStyleProps & { className?: string | undefined } = {}) {
  return cn(buttonStyles({ ...resolveToneVariant(fillTones, props), size }), className)
}

type ButtonProps = Omit<React.ComponentProps<'button'>, 'color'> &
  ButtonStyleProps & {
    asChild?: boolean
  }

function Button({
  className,
  variant,
  color,
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  const tone = resolveToneVariant(fillTones, { variant, color })

  return (
    <Comp
      data-slot="button"
      data-variant={tone.variant}
      data-color={tone.color}
      data-size={size}
      className={cn(buttonStyles({ ...tone, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
