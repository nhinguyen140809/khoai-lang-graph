import type { Interrupt } from '@/modules/review/entities'

import { mockState } from '../shared/db'

// What the mock server changes about the interrupts while the app runs: the answers. The
// interrupts themselves come from the steps of the runs, which never change.

/** The status that an answer set on an interrupt of a run, by interrupt id. */
export const interruptEdits = mockState<Record<string, Pick<Interrupt, 'status' | 'resolved_at'>>>(
  'interrupt-edits',
  () => ({}),
)
