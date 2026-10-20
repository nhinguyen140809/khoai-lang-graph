import { noRunLook, runStatusLooks } from '../constants/run-status-look.constants'
import type { RunStatus } from '../types/run-status.types'

/** How a run status shows, or how a project or a thread without a run shows for null. */
export function runStatusLook(status: RunStatus | null) {
  return status === null ? noRunLook : runStatusLooks[status]
}
