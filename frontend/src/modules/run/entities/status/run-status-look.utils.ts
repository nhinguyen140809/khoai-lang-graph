import { inView, type View } from '@/shared/lib/view'

import type { RunStatus } from './run-status.types'
import { noRunLook, runStatusLooks } from './run-status-look.constants'

/**
 * How a run status shows in a view, or how a project or a thread without a run shows for null:
 * the tone and the icon of the view, or of the developer view where the user view has none.
 */
export function runStatusLook(status: RunStatus | null, view: View) {
  const { tone, icon, needsUser } = status === null ? noRunLook : runStatusLooks[status]
  return { tone: inView(tone, view), icon: inView(icon, view), needsUser }
}
