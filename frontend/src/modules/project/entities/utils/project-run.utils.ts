import type { Run } from '@/modules/run/entities/@x/project'

import type { ProjectRun } from '../types/project-run.types'

/**
 * The run that the status of a project shows. Null while the status loads or fails to load, and
 * before the first run.
 */
export function shownRun(project: ProjectRun): Run | null {
  return project.state === 'success' ? project.run : null
}
