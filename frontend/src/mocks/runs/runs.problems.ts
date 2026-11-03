import { invalidState, notFound } from '../shared/http/response'
import { findUnfinishedRun } from './lookup/runs.lookup'

/** The answer to a request that names a run the mock server does not hold. */
export function runNotFound() {
  return notFound('The run')
}

/** The refusal to start a run in a thread that has a run that has not ended; null when it has none. */
export function refuseUnfinishedRun(threadId: string) {
  return findUnfinishedRun(threadId) === undefined
    ? null
    : invalidState('The thread has a run that has not ended.')
}
