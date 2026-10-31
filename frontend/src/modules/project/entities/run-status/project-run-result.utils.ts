import type { Run } from '@/modules/run/entities/@x/project'

import type { ProjectRunResult } from './project-run-result.types'

/**
 * The run that the status of a project shows. Null while the status loads or fails to load, and
 * before the first run.
 */
export function shownRun(result: ProjectRunResult): Run | null {
  return result.state === 'success' ? result.run : null
}
