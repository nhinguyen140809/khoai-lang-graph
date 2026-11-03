import { useWording } from '@/shared/lib/view'

import type { RunStatus } from '../run-status.types'
import { runStatusLabel } from '../run-status.utils'
import { runStatusLook } from '../run-status-look.utils'

/**
 * How a run status shows, with its label in the view of the app, or how a project or a thread
 * without a run shows for null. Every component of a run status reads it and chooses only its
 * fill and its size.
 */
export function useRunStatusLook(status: RunStatus | null) {
  const label = useWording(runStatusLabel(status))
  return { ...runStatusLook(status), label }
}
