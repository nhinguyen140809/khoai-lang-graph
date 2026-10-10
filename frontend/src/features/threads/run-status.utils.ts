import { runStatusUrgency } from '@/lib/run-status.constants'

import type { Thread } from './threads.types'

/**
 * The thread whose unfinished run the status bar follows: the run that needs the user most
 * (waiting for review, then running, then queued), in the thread with the newest message on a
 * tie. `threads` is newest message first.
 */
export function pickStatusThread(threads: Thread[]): Thread | undefined {
  return unfinishedThreads(threads)[0]
}

/** The threads that have an unfinished run, the run that needs the user most first. */
export function unfinishedThreads(threads: Thread[]): Thread[] {
  return threads
    .filter(({ active_run_status }) => active_run_status !== null)
    .toSorted(
      (a, b) =>
        runStatusUrgency[a.active_run_status ?? 'succeeded'] -
        runStatusUrgency[b.active_run_status ?? 'succeeded'],
    )
}

export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`
}
