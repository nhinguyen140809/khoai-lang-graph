import type { View } from '@/shared/lib/view'

import type { RunStatus } from '../../status/run-status.types'

/** A status of a run, or none, a view of the app, and what the badge says in it. */
export const badgeCases: { status: RunStatus | null; view: View; text: string }[] = [
  { status: 'interrupted', view: 'user', text: 'Waiting for you' },
  { status: 'interrupted', view: 'developer', text: 'Waiting for review' },
  { status: null, view: 'user', text: 'Not started' },
  { status: null, view: 'developer', text: 'No run yet' },
]
