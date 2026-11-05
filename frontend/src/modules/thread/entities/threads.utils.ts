import { isUnfinishedRunStatus, runStatusesByAttention } from '@/modules/run/entities/@x/thread'
import { rankIn } from '@/shared/lib/collections'

import type { Thread } from './types/threads.types'

// The rank of a thread: the place of the status of its latest run, a thread without a run last.
function attentionRank({ latest_run_status: status }: Thread) {
  return status === null ? runStatusesByAttention.length : rankIn(runStatusesByAttention, status)
}

/**
 * The threads of a project from the one whose latest run needs the user most, in the order of
 * `runStatusesByAttention`, then the threads without a run. Threads of one status keep their
 * order, the latest message first, so the status of the project is the one of the first thread.
 */
export function threadsByAttention(threads: Thread[]): Thread[] {
  return threads.toSorted((a, b) => attentionRank(a) - attentionRank(b))
}

/** The threads whose latest run has not finished. */
export function threadsWithUnfinishedRun(threads: Thread[]): Thread[] {
  return threads.filter(
    ({ latest_run_status: status }) => status !== null && isUnfinishedRunStatus(status),
  )
}
