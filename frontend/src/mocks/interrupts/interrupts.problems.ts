import { invalidState } from '../shared/http/response'

/**
 * The refusal of an answer that the run does not wait for: the run waits for nothing, or for
 * another interrupt.
 */
export function runNotWaitingForAnswer() {
  return invalidState('The run is not waiting for this answer.')
}
