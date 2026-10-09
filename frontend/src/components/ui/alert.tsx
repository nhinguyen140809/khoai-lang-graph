import { cva } from 'class-variance-authority'
import { cn } from 'cn'
import * as React from 'react'

import { toneClasses, type ToneVariantProps, type ToneVariants } from '@/lib/tone.constants'
import { resolveToneVariant } from '@/lib/tone.utils'

// `variant` is the fill and `color` the meaning; the color sets the --tone variables these read.
const alertStyles = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-2 py-1.5 text-left text-xs/relaxed has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-1.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        outline:
          'bg-card text-card-foreground *:data-[slot=alert-title]:text-(--tone-strong) *:[svg]:text-(--tone-strong)',
        soft: 'border-transparent bg-(--tone-soft) text-foreground *:data-[slot=alert-description]:text-foreground *:data-[slot=alert-title]:text-(--tone-strong) *:[svg]:text-(--tone-strong)',
        solid:
          'border-transparent bg-(--tone) text-(--tone-foreground) *:data-[slot=alert-description]:text-(--tone-foreground) *:[svg]:text-current',
      },
      color: toneClasses,
    },
  },
)

type AlertVariant = 'outline' | 'soft' | 'solid'

// Without a color, an alert is neutral.
const alertTones = {
  defaultVariant: 'outline',
  legacy: {
    default: { variant: 'outline', color: 'neutral' },
    destructive: { variant: 'outline', color: 'destructive' },
  },
  defaultColors: { outline: 'neutral', soft: 'neutral', solid: 'neutral' },
} as const satisfies ToneVariants<AlertVariant, string>

type AlertProps = Omit<React.ComponentProps<'div'>, 'color'> & ToneVariantProps<typeof alertTones>

function Alert({ className, variant, color, ...props }: AlertProps) {
  const tone = resolveToneVariant(alertTones, { variant, color })

  return (
    <div
      data-slot="alert"
      data-variant={tone.variant}
      data-color={tone.color}
      role="alert"
      className={cn(alertStyles(tone), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-xs/relaxed text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4',
        className,
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('absolute top-1.5 right-2', className)}
      {...props}
    />
  )
}

export { Alert, AlertAction, AlertDescription, AlertTitle }
