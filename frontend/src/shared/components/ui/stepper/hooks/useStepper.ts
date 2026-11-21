import { useContext } from 'react'

import { StepperContext } from '../stepper-context'

export function useStepper() {
  const ctx = useContext(StepperContext)
  if (!ctx) throw new Error('useStepper must be used within a Stepper')
  return ctx
}
