import { useActsOf } from '@/modules/workflow/entities/@x/run'

import type { Run } from '../../runs/runs.types'
import { toolInUse } from '../work-items.utils'
import { useRunLastWork } from './useRunLastWork'

/**
 * The acts to show around the agent of a run while it works: those of the tool that it uses now when
 * the workflow names some for it, else those of the stage it is in. The stage is that of the phase
 * that runs, or the stage the run names between two phases. None before the definition loads, and
 * when the workflow names none.
 */
export function useRunActs(
  run: Pick<Run, 'id' | 'status' | 'workflow_version' | 'current_stage'> | null,
): string[] {
  const work = useRunLastWork(run)
  const isRunning = work?.status === 'running'
  const stage = isRunning ? work.stage : (run?.current_stage ?? null)
  return useActsOf(run?.workflow_version, stage, isRunning ? toolInUse(work) : null)
}
