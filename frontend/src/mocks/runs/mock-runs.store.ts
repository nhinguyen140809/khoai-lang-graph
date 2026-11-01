import type { Message } from '@/features/console'
import type { Run, RunStep } from '@/features/threads'

import { mockRecord } from '../shared/mock-db.utils'

// What the mock server changes about runs and messages while the app runs: the runs and messages
// that POST requests create, the steps of the runs it plays, and the runs that were stopped or
// finished. They are kept apart from the fixtures, which never change.

export const createdRuns = mockRecord<Run[]>('created-runs', () => [])
export const createdSteps = mockRecord<Record<string, RunStep[]>>('created-steps', () => ({}))
export const createdMessages = mockRecord<Message[]>('created-messages', () => [])
export const runChanges = mockRecord<Record<string, Partial<Run>>>('run-changes', () => ({}))

/** The runs with the changes that stopping or finishing them made. */
export function withRunChanges(runs: Run[]): Run[] {
  const changes = runChanges.get()
  return runs.map((run) => ({ ...run, ...changes[run.id] }))
}

export function changeRun(runId: string, change: Partial<Run>) {
  runChanges.set({ ...runChanges.get(), [runId]: { ...runChanges.get()[runId], ...change } })
}
