import type { Run } from '@/modules/run/entities'

import { mockState } from '../shared/db'

// What the mock server changes about runs while the app runs: the runs that messages started, and
// the runs that were stopped. The edits are kept apart from the fixtures, which never change.

/** The runs that the messages sent with POST /threads/{thread_id}/messages started. */
export const createdRuns = mockState<Run[]>('created-runs', () => [])

/** The fields that changed in a run, by run id, such as the status that stopping a run sets. */
export const runEdits = mockState<Record<string, Partial<Run>>>('run-changes', () => ({}))
