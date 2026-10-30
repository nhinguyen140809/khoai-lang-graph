import type { Interrupt } from '@/modules/review/entities'

import { invalidState } from '../shared/http/response'

/**
 * The refusal to answer an interrupt that is not the one the run waits for: the run waits for
 * nothing, or for another interrupt. Null when it waits for this one.
 */
export function refuseAnswerOfOtherInterrupt(pending: Interrupt | null, interruptId: unknown) {
  return pending !== null && interruptId === pending.id
    ? null
    : invalidState('The run is not waiting for this answer.')
}
