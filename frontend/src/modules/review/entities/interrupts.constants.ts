import type { Wording } from '@/shared/lib/view'

import type { InterruptPurpose, InterruptStatus } from './interrupts.types'

/**
 * The label of each interrupt status in each view: a review that waits for the user, one that
 * was answered, and one that was dropped with its run.
 */
export const interruptStatusLabels = {
  pending: { developer: 'Waiting for you' },
  resolved: { developer: 'Reviewed' },
  cancelled: { developer: 'Stopped' },
} as const satisfies Record<InterruptStatus, Wording>

// How many interrupts a page of the interrupts of a run holds; the next page loads on demand.
export const interruptsPageSize = 100

/** The acts shown around the agent that waits at an interrupt: a question for an ask, a page read for a review. */
export const interruptActs: Readonly<Record<InterruptPurpose, readonly string[]>> = {
  ask: ['question'],
  review: ['review'],
}
