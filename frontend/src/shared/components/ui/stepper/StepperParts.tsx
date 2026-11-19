'use client'

import { cn } from 'cn'

import { type Tone, toneClasses } from '@/shared/lib/tone'

import { useStepItem } from './hooks/useStepItem'
import { useStepper } from './hooks/useStepper'

export function StepperIndicator({
  children,
  className,
  variant = 'solid',
  color,
  ...props
}: React.ComponentProps<'div'> & {
  /** The fill of the indicator: solid as installed, or ghost with none, so what it holds stands alone. */
  variant?: 'solid' | 'ghost' | undefined
  /** The color of the icon or the number it holds; the color of the text around it without one. */
  color?: Tone | undefined
}) {
  const { state, isLoading } = useStepItem()
  const { indicators } = useStepper()

  return (
    <div
      data-slot="stepper-indicator"
      data-state={state}
      data-variant={variant}
      data-color={color}
      className={cn(
        'relative flex size-6 shrink-0 items-center justify-center overflow-hidden border-background bg-accent text-accent-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground',
        'rounded-full text-xs',
        variant === 'ghost' &&
          'bg-transparent data-[state=active]:bg-transparent data-[state=completed]:bg-transparent',
        color && [toneClasses[color], 'text-(--tone-strong)'],
        className,
      )}
      {...props}
    >
      <div className="absolute">
        {indicators &&
        ((isLoading && indicators.loading) ||
          (state === 'completed' && indicators.completed) ||
          (state === 'active' && indicators.active) ||
          (state === 'inactive' && indicators.inactive))
          ? (isLoading && indicators.loading) ||
            (state === 'completed' && indicators.completed) ||
            (state === 'active' && indicators.active) ||
            (state === 'inactive' && indicators.inactive)
          : children}
      </div>
    </div>
  )
}

export function StepperSeparator({ className }: React.ComponentProps<'div'>) {
  const { state } = useStepItem()

  return (
    <div
      data-slot="stepper-separator"
      data-state={state}
      className={cn(
        'm-0.5 rounded-sm bg-muted group-data-[orientation=horizontal]/stepper-nav:h-0.5 group-data-[orientation=horizontal]/stepper-nav:flex-1 group-data-[orientation=vertical]/stepper-nav:h-12 group-data-[orientation=vertical]/stepper-nav:w-0.5',
        className,
      )}
    />
  )
}

export function StepperTitle({ children, className }: React.ComponentProps<'h3'>) {
  const { state } = useStepItem()

  return (
    <h3
      data-slot="stepper-title"
      data-state={state}
      className={cn('text-sm leading-none font-medium', className)}
    >
      {children}
    </h3>
  )
}

export function StepperDescription({ children, className }: React.ComponentProps<'div'>) {
  const { state } = useStepItem()

  return (
    <div
      data-slot="stepper-description"
      data-state={state}
      className={cn('text-sm text-muted-foreground', className)}
    >
      {children}
    </div>
  )
}
