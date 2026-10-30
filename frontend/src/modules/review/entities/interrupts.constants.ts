import type { Wording } from '@/shared/lib/view'

import type { InterruptStatus } from './interrupts.types'

/**
 * The label of each interrupt status in each view: a review that waits for the user, one that
 * was answered, and one that was dropped with its run.
 */
export const interruptStatusLabels = {
  pending: { developer: 'Waiting for review', user: 'Waiting for you' },
  resolved: { developer: 'Resolved', user: 'Reviewed' },
  cancelled: { developer: 'Cancelled', user: 'Stopped' },
} as const satisfies Record<InterruptStatus, Wording>

// How many interrupts a page of the interrupts of a run holds; the next page loads on demand.
export const interruptsPageSize = 100
