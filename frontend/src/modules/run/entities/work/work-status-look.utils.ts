import type { WorkStatus } from './work.types'
import { workStatusLooks } from './work-status-look.constants'

/** Whether a line of work is in progress. */
export function isWorkStatusInProgress(status: WorkStatus): boolean {
  return workStatusLook(status).isLoading
}

/** How a status of a line of work shows. */
export function workStatusLook(status: WorkStatus) {
  return workStatusLooks[status]
}
