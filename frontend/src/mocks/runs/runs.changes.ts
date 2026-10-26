import type { Run } from '@/modules/run/entities'

import { runEdits } from './runs.store'

/** Sets fields of a run, over what it had before. */
export function changeRun(runId: string, change: Partial<Run>) {
  runEdits.set({ ...runEdits.get(), [runId]: { ...runEdits.get()[runId], ...change } })
}
