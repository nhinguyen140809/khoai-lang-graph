import type { RunStep } from './run-steps.types'

/** The steps of a run in the order they ran. */
export function orderedSteps(steps: RunStep[]): RunStep[] {
  return steps.toSorted((a, b) => a.sequence - b.sequence)
}
