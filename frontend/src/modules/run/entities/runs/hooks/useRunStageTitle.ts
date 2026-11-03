import { useStageTitle } from '@/modules/workflow/entities/@x/run'

import { hasStageName } from '../../status/run-status.utils'
import type { Run } from '../runs.types'

/**
 * The title of the stage that the status of a run names; undefined when it names none and while
 * the definition loads.
 */
export function useRunStageTitle(
  run: Pick<Run, 'status' | 'workflow_version' | 'current_stage'> | null,
): string | undefined {
  return useStageTitle(
    run?.workflow_version,
    run !== null && hasStageName(run.status) ? run.current_stage : null,
  )
}
