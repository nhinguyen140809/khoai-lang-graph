import { useShallow } from 'zustand/react/shallow'

import { useStopRunStore } from '../stop-run.store'

/**
 * The Stop dialog of the status: the run it asks about while it is open, `ask`, which opens it for
 * a run, from Stop or the command palette, and `close`.
 */
export function useStopRunDialog() {
  return useStopRunStore(useShallow(({ runId, ask, close }) => ({ runId, ask, close })))
}
