import { useCallback, useMemo, useState } from 'react'

import {
  type StepIndicators,
  type StepperContextValue,
  type StepperOrientation,
} from '../stepper-context'

interface StepperStateOptions {
  /** The step the stepper starts on, when no step is given from outside. */
  defaultValue: number
  /** The step the stepper is on, when the one outside it drives it; its own step otherwise. */
  value?: number | undefined
  onValueChange?: ((value: number) => void) | undefined
  orientation: StepperOrientation
  indicators: StepIndicators
}

/**
 * The state of a stepper: the step it is on, the triggers of its steps kept in the order they
 * registered so its keys walk between them, and the value that its parts read through its
 * context. The steps register as they render and do not go away while the stepper is on screen.
 */
export function useStepperState({
  defaultValue,
  value,
  onValueChange,
  orientation,
  indicators,
}: StepperStateOptions): StepperContextValue {
  const [activeStep, setActiveStep] = useState(defaultValue)
  const [triggerNodes, setTriggerNodes] = useState<HTMLButtonElement[]>([])

  const registerTrigger = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return
    setTriggerNodes((prev) => (prev.includes(node) ? prev : [...prev, node]))
  }, [])

  const setCurrentStep = useCallback(
    (step: number) => {
      if (value === undefined) {
        setActiveStep(step)
      }
      onValueChange?.(step)
    },
    [value, onValueChange],
  )

  const currentStep = value ?? activeStep

  const focusTrigger = useCallback(
    (index: number) => {
      const node = triggerNodes[index]
      if (node) node.focus()
    },
    [triggerNodes],
  )
  const focusNext = useCallback(
    (currentIdx: number) => {
      focusTrigger((currentIdx + 1) % triggerNodes.length)
    },
    [focusTrigger, triggerNodes.length],
  )
  const focusPrev = useCallback(
    (currentIdx: number) => {
      focusTrigger((currentIdx - 1 + triggerNodes.length) % triggerNodes.length)
    },
    [focusTrigger, triggerNodes.length],
  )
  const focusFirst = useCallback(() => {
    focusTrigger(0)
  }, [focusTrigger])
  const focusLast = useCallback(() => {
    focusTrigger(triggerNodes.length - 1)
  }, [focusTrigger, triggerNodes.length])

  return useMemo<StepperContextValue>(
    () => ({
      activeStep: currentStep,
      setActiveStep: setCurrentStep,
      orientation,
      registerTrigger,
      triggerNodes,
      focusNext,
      focusPrev,
      focusFirst,
      focusLast,
      indicators,
    }),
    [
      currentStep,
      setCurrentStep,
      orientation,
      registerTrigger,
      triggerNodes,
      focusNext,
      focusPrev,
      focusFirst,
      focusLast,
      indicators,
    ],
  )
}
