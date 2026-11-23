import type { Run } from '../../runs/runs.types'
import { useRunSteps } from '../../steps/hooks/useRunStepQueries'
import type { WorkEntry } from '../work.types'
import { workEntries } from '../work-entries.utils'

/**
 * The last phase of the work of a run, which tells the agent at work and what it is doing now;
 * undefined while the steps load or before an agent has run.
 */
export function useRunLastWork(run: Pick<Run, 'id' | 'status'> | null): WorkEntry | undefined {
  const steps = useRunSteps(run?.id ?? '', { isEnabled: run !== null })
  return workEntries(steps.data?.pages.flatMap(({ items }) => items) ?? [], run).at(-1)
}
