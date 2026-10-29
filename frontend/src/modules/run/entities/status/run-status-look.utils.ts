import type { RunStatus } from './run-status.types'
import { noRunLook, runStatusLooks } from './run-status-look.constants'

/** How a run status shows, or how a project or a thread without a run shows for null. */
export function runStatusLook(status: RunStatus | null) {
  return status === null ? noRunLook : runStatusLooks[status]
}
