'use client'

import { cn } from 'cn'
import type { HTMLAttributes } from 'react'

import { useStepper } from './hooks/useStepper'
import { useStepperState } from './hooks/useStepperState'
import {
  type StepIndicators,
  StepItemContext,
  StepperContext,
  type StepperOrientation,
  type StepState,
} from './stepper-context'

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: number
  value?: number
  onValueChange?: (value: number) => void
  orientation?: StepperOrientation
  indicators?: StepIndicators
}

export function Stepper({
  defaultValue = 1,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  children,
  indicators = {},
  ...props
}: StepperProps) {
  const stepper = useStepperState({ defaultValue, value, onValueChange, orientation, indicators })

  return (
    <StepperContext.Provider value={stepper}>
      <div
        role="tablist"
        aria-orientation={orientation}
        data-slot="stepper"
        className={cn('w-full', className)}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </StepperContext.Provider>
  )
}

export interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number
  completed?: boolean
  disabled?: boolean
  loading?: boolean
}

export function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}: StepperItemProps) {
  const { activeStep } = useStepper()

  const isCompleted = completed || step < activeStep
  const pendingState: StepState = activeStep === step ? 'active' : 'inactive'
  const state: StepState = isCompleted ? 'completed' : pendingState

  const isLoading = loading && step === activeStep

  return (
    <StepItemContext.Provider value={{ step, state, isDisabled: disabled, isLoading }}>
      <div
        data-slot="stepper-item"
        className={cn(
          'group/step flex items-center justify-center not-last:flex-1 group-data-[orientation=horizontal]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:flex-col',
          className,
        )}
        data-state={state}
        {...(isLoading ? { 'data-loading': true } : {})}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  )
}

export function StepperNav({ children, className }: React.ComponentProps<'nav'>) {
  const { activeStep, orientation } = useStepper()

  return (
    <nav
      data-slot="stepper-nav"
      data-state={activeStep}
      data-orientation={orientation}
      className={cn(
        'group/stepper-nav inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
        className,
      )}
    >
      {children}
    </nav>
  )
}

export function StepperPanel({ children, className }: React.ComponentProps<'div'>) {
  const { activeStep } = useStepper()

  return (
    <div data-slot="stepper-panel" data-state={activeStep} className={cn('w-full', className)}>
      {children}
    </div>
  )
}

export interface StepperContentProps extends React.ComponentProps<'div'> {
  value: number
  forceMount?: boolean
}

export function StepperContent({ value, forceMount, children, className }: StepperContentProps) {
  const { activeStep } = useStepper()
  const isActive = value === activeStep

  if (!forceMount && !isActive) {
    return null
  }

  return (
    <div
      data-slot="stepper-content"
      data-state={activeStep}
      className={cn('w-full', className, !isActive && forceMount && 'hidden')}
      hidden={!isActive && forceMount}
    >
      {children}
    </div>
  )
}
