import type { Run } from '@/features/threads'

import { mockRecord } from '../shared/mock-db.utils'

// What the mock server changes about runs while the app runs: the runs that were stopped. The
// changes are kept apart from the fixtures, which never change.

export const runChanges = mockRecord<Record<string, Partial<Run>>>('run-changes', () => ({}))

/** The runs with the changes that stopping them made. */
export function withRunChanges(runs: Run[]): Run[] {
  const changes = runChanges.get()
  return runs.map((run) => ({ ...run, ...changes[run.id] }))
}

export function changeRun(runId: string, change: Partial<Run>) {
  runChanges.set({ ...runChanges.get(), [runId]: { ...runChanges.get()[runId], ...change } })
}
