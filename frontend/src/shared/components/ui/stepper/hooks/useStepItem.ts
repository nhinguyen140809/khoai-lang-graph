import { useContext } from 'react'

import { StepItemContext } from '../stepper-context'

export function useStepItem() {
  const ctx = useContext(StepItemContext)
  if (!ctx) throw new Error('useStepItem must be used within a StepperItem')
  return ctx
}
