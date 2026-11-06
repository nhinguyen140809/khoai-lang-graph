import type { RunStatus } from '@/modules/run/entities/@x/thread'
import type { Wording } from '@/shared/lib/view'

import type { MessageDelivery, MessageDeliveryNote } from './messages.types'

/** A chat is read to its end, so its messages load in the largest pages. */
export const messagesPageSize = 200

/** The label of each delivery of a message of the user in each view, read with its row in Outline. */
export const messageDeliveryLabels = {
  started_run: { developer: 'Started a run', user: 'Started the work' },
  delivered: { developer: 'Delivered', user: 'Read by the agents' },
  pending: { developer: 'Pending', user: 'Not read yet' },
  undelivered: { developer: 'Undelivered', user: 'Not read' },
} as const satisfies Record<MessageDelivery, Wording>

/** The note under a message of the user while it is not read, in each view. */
export const messageDeliveryNotes = {
  pendingInStep: {
    developer: 'Pending: read at the next safe point',
    user: 'Will be read after the current step.',
  },
  pendingInReview: {
    developer: 'Pending: read after the review',
    user: 'Will be read after you answer the review.',
  },
  undelivered: {
    developer: 'Undelivered: the run ended first',
    user: 'Not read: the work ended before this message.',
  },
} as const satisfies Record<MessageDeliveryNote, Wording>

/** The note a pending message reads, by the status of its run: the run going on reads in the step, a run that waits reads after the review, an ended run never. */
export const deliveryNoteOfRunStatus = {
  queued: 'pendingInStep',
  running: 'pendingInStep',
  interrupted: 'pendingInReview',
  succeeded: 'undelivered',
  failed: 'undelivered',
  cancelled: 'undelivered',
} as const satisfies Record<RunStatus, MessageDeliveryNote>
