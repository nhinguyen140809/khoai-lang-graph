import { useLatestRun } from '@/modules/run/entities/@x/project'
import { threadsByAttention, useProjectThreads } from '@/modules/thread/entities/@x/project'
import { pageItems } from '@/shared/api/query-client'

import type { ProjectRunResult } from '../project-run-result.types'

/**
 * The status of a project: its threads from the one whose latest run needs the user most, and the
 * latest run of that thread, which the status shows. The streams of the unfinished runs load both
 * again as the runs go on. A status already shown stays when loading it again fails.
 */
export function useProjectRunResult(projectId: string): ProjectRunResult {
  const threads = useProjectThreads(projectId)
  // Every thread of a project fits the first page today, so the loaded pages hold them all.
  const sorted =
    threads.data === undefined ? undefined : threadsByAttention(pageItems(threads.data))
  const thread = sorted?.[0]
  const run = useLatestRun(thread?.id ?? '', { isEnabled: thread !== undefined })

  if (threads.isLoadingError) return { state: 'error', retry: () => void threads.refetch() }
  if (sorted === undefined) return { state: 'pending' }
  if (thread === undefined) return { state: 'success', run: null, threads: sorted }
  if (run.isLoadingError) return { state: 'error', retry: () => void run.refetch() }
  if (run.data === undefined) return { state: 'pending' }
  return { state: 'success', run: run.data, threads: sorted }
}
