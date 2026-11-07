'use client'

import { threadsByAttention, useProjectThreads } from '@/modules/thread/entities/@x/activity'

import type { ActivityThreadResult } from '../activity-entries.types'

/**
 * The thread that the activity of a project shows: the one whose latest run needs the user most,
 * the one the status bar shows. Null for a project without a thread.
 */
export function useActivityThread(projectId: string): ActivityThreadResult {
  const threads = useProjectThreads(projectId)

  if (threads.isPending) return { state: 'pending' }
  if (threads.isError) {
    return { state: 'error', retry: () => void threads.refetch() }
  }
  const first = threads.data.pages[0]?.items ?? []
  return { state: 'success', thread: threadsByAttention([...first])[0] ?? null }
}
