import type { Run } from '@/modules/run/entities'

import { mockRecord } from '../shared/db/mock-state.utils'

// What the mock server changes about runs while the app runs: the runs that messages started, and
// the runs that were stopped. The changes are kept apart from the fixtures, which never change.

/** The runs that the messages sent with POST /threads/{thread_id}/messages started. */
export const createdRuns = mockRecord<Run[]>('created-runs', () => [])

export const runChanges = mockRecord<Record<string, Partial<Run>>>('run-changes', () => ({}))

/** The runs with the changes that stopping them made. */
export function withRunChanges(runs: Run[]): Run[] {
  const changes = runChanges.get()
  return runs.map((run) => ({ ...run, ...changes[run.id] }))
}

export function changeRun(runId: string, change: Partial<Run>) {
  runChanges.set({ ...runChanges.get(), [runId]: { ...runChanges.get()[runId], ...change } })
}
