import { useStageTitle } from '@/modules/workflow/entities/@x/run'

import type { Run } from '../../runs/runs.types'
import { hasStageName } from '../../status/run-status.utils'
import { useRunSteps } from '../../steps/hooks/useRunStepQueries'
import { stageOfRun } from '../stage-of-run.utils'

/**
 * The title of the stage that a run is in, from the step that runs now; undefined when its status
 * names none and while the definition loads.
 */
export function useRunStageTitle(
  run: Pick<Run, 'id' | 'status' | 'workflow_version' | 'current_stage'> | null,
): string | undefined {
  const isNamed = run !== null && hasStageName(run.status)
  const steps = useRunSteps(run?.id ?? '', { isEnabled: isNamed })
  const stepList = steps.data?.pages.flatMap(({ items }) => items)
  return useStageTitle(run?.workflow_version, isNamed ? stageOfRun(run, stepList) : null)
}
