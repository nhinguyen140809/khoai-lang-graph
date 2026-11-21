import type { Mood } from '@/shared/components/face'

import type { WorkEntry, WorkStatus } from './work.types'
import { workStatusLooks } from './work-status-look.constants'

/** Whether a line of work is in progress. */
export function isWorkStatusInProgress(status: WorkStatus): boolean {
  return workStatusLook(status).isLoading
}

/** How a status of a line of work shows. */
export function workStatusLook(status: WorkStatus) {
  return workStatusLooks[status]
}

/**
 * The mood of the face of the agent in a line of work: the mood of its status, except that a line
 * that runs and has not yet created or changed an item is still thinking.
 */
export function workMoodOf(work: Pick<WorkEntry, 'status' | 'created' | 'changed'>): Mood {
  const hasResult = work.created.length > 0 || work.changed.length > 0
  return work.status === 'running' && !hasResult ? 'thinking' : workStatusLook(work.status).mood
}
