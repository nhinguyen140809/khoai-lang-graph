/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/refs -- the library drives the focus of its steps from a register of the trigger elements, which their render and effects read */

'use client'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from 'cn'
import { useEffect, useMemo, useRef } from 'react'

import { useStepItem } from './hooks/useStepItem'
import { useStepper } from './hooks/useStepper'

export type StepperTriggerProps = useRender.ComponentProps<'button'>

export function StepperTrigger({
  className,
  children,
  tabIndex,
  render,
  ...props
}: StepperTriggerProps) {
  const { state, isLoading } = useStepItem()
  const stepperCtx = useStepper()
  const {
    setActiveStep,
    activeStep,
    registerTrigger,
    triggerNodes,
    focusNext,
    focusPrev,
    focusFirst,
    focusLast,
  } = stepperCtx
  const { step, isDisabled } = useStepItem()
  const isSelected = activeStep === step
  const selectedTabIndex = isSelected ? 0 : -1
  const id = `stepper-tab-${step}`
  const panelId = `stepper-panel-${step}`

  // Register this trigger for keyboard navigation
  const btnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (btnRef.current) {
      registerTrigger(btnRef.current)
    }
  }, [btnRef.current])

  // Find our index among triggers for navigation
  const myIdx = useMemo(
    () => triggerNodes.findIndex((n: HTMLButtonElement) => n === btnRef.current),
    [triggerNodes, btnRef.current],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        if (myIdx !== -1 && focusNext) focusNext(myIdx)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        if (myIdx !== -1 && focusPrev) focusPrev(myIdx)
        break
      case 'Home':
        e.preventDefault()
        if (focusFirst) focusFirst()
        break
      case 'End':
        e.preventDefault()
        if (focusLast) focusLast()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        setActiveStep(step)
        break
    }
  }

  const defaultProps = {
    role: 'tab',
    id,
    'aria-selected': isSelected,
    'aria-controls': panelId,
    tabIndex: typeof tabIndex === 'number' ? tabIndex : selectedTabIndex,
    'data-slot': 'stepper-trigger',
    'data-state': state,
    'data-loading': isLoading,
    className: cn(
      'inline-flex cursor-pointer items-center outline-none focus-visible:z-10 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60',
      'gap-2.5 rounded-full',
      className,
    ),
    onClick: () => setActiveStep(step),
    onKeyDown: handleKeyDown,
    disabled: isDisabled,
    children,
  }

  return useRender({
    defaultTagName: 'button',
    render,
    ref: btnRef,
    props: mergeProps<'button'>(defaultProps, props),
  })
}
