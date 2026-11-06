import { isUnfinishedRunStatus, type RunStatus } from '@/modules/run/entities/@x/thread'
import type { Wording } from '@/shared/lib/view'

import { deliveryNoteOfRunStatus, messageDeliveryNotes } from './messages.constants'
import type { Message, MessageDelivery } from './messages.types'

/** The note of each delivery of a message of the user; only a pending one reads one. */
const noteOfDelivery: Record<MessageDelivery, (runStatus: RunStatus | null) => Wording | null> = {
  started_run: () => null,
  delivered: () => null,
  pending: (runStatus) =>
    messageDeliveryNotes[runStatus === null ? 'pendingInStep' : deliveryNoteOfRunStatus[runStatus]],
  undelivered: () => messageDeliveryNotes.undelivered,
}

/** The note under a message of the user about when the agents read it; null when there is none. */
export function messageDeliveryNote(
  message: Pick<Message, 'delivery'>,
  runStatus: RunStatus | null,
): Wording | null {
  return message.delivery === null ? null : noteOfDelivery[message.delivery](runStatus)
}

/**
 * Whether the agents will never read a message of the user: it was marked undelivered, or it
 * still waits for a run that has already ended.
 */
export function isNeverRead(
  message: Pick<Message, 'delivery'>,
  runStatus: RunStatus | null,
): boolean {
  if (message.delivery === 'undelivered') return true
  return message.delivery === 'pending' && runStatus !== null && !isUnfinishedRunStatus(runStatus)
}
