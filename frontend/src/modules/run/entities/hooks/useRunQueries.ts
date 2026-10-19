// The hooks that read the runs: the query first, then the hooks that build on it. A hook that
// stops a run or follows its events has a file of its own.

import { useQuery } from '@tanstack/react-query'

import { useStageLabel } from '@/modules/workflow/entities/@x/run'
import { costLevel, costPercent, type CostShare } from '@/shared/lib/cost'

import { getLatestRun } from '../runs.api'
import { runKeys } from '../runs.keys'
import type { RunStatus } from '../types/run-status.types'
import { showsStage } from '../utils/runs.utils'

/**
 * The latest run of a thread, null before its first run; idle until a thread is given.
 * `useRunStatusStream` loads it again as the run goes on.
 */
export function useLatestRun(threadId: string | undefined) {
  return useQuery({
    queryKey: runKeys.latestRun(threadId ?? ''),
    queryFn: () => (threadId === undefined ? null : getLatestRun(threadId)),
    enabled: threadId !== undefined,
  })
}

/**
 * The cost of the latest run of a thread against the limit of the run. Undefined while the run
 * loads, before the first run of the thread, and for a run without a limit.
 */
export function useRunCost(threadId: string | undefined): CostShare | undefined {
  const run = useLatestRun(threadId)

  if (run.data == null) return undefined
  const percent = costPercent(run.data.usage.cost_usd, run.data.run_config.max_cost_usd)
  return percent === undefined ? undefined : { percent, level: costLevel(percent) }
}

/**
 * The label of the stage that a run is at, where its status names it, in the version of the
 * workflow that the run runs. Undefined for a status that names no stage, without a run or a
 * stage, and while the labels load; they load only for a status that names its stage.
 */
export function useRunStageLabel(
  status: RunStatus | null,
  stage: string | null,
  version: number | undefined,
): string | undefined {
  const named = status !== null && stage !== null && showsStage(status)
  const label = useStageLabel(named ? version : undefined, stage)

  return named ? label : undefined
}
