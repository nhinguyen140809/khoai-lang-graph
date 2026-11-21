import type { ReactNode } from 'react'
import { createContext } from 'react'

export type StepperOrientation = 'horizontal' | 'vertical'
export type StepState = 'active' | 'completed' | 'inactive' | 'loading'
export type StepIndicators = {
  active?: ReactNode
  completed?: ReactNode
  inactive?: ReactNode
  loading?: ReactNode
}

export interface StepperContextValue {
  activeStep: number
  setActiveStep: (step: number) => void
  orientation: StepperOrientation
  registerTrigger: (node: HTMLButtonElement | null) => void
  triggerNodes: HTMLButtonElement[]
  focusNext: (currentIdx: number) => void
  focusPrev: (currentIdx: number) => void
  focusFirst: () => void
  focusLast: () => void
  indicators: StepIndicators
}

export interface StepItemContextValue {
  step: number
  state: StepState
  isDisabled: boolean
  isLoading: boolean
}

export const StepperContext = createContext<StepperContextValue | undefined>(undefined)
export const StepItemContext = createContext<StepItemContextValue | undefined>(undefined)
